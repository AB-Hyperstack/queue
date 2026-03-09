import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Determine locale from URL
  const localeMatch = pathname.match(/^\/(en|sv)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
  const strippedPath = localeMatch
    ? pathname.replace(/^\/(en|sv)/, '') || '/'
    : pathname;

  // Check if route needs auth (using the locale-stripped path)
  const isAdmin = strippedPath.startsWith('/admin');
  const isProtected =
    strippedPath.startsWith('/dashboard') ||
    strippedPath.startsWith('/analytics') ||
    strippedPath.startsWith('/settings');
  const isOnboarding = strippedPath.startsWith('/onboarding');
  const isBilling = strippedPath.startsWith('/billing');
  const needsAuth = isAdmin || isProtected || isOnboarding || isBilling;

  // Public routes — just handle i18n (locale detection + rewrites)
  if (!needsAuth) {
    return handleI18nRouting(request);
  }

  // Protected routes: run i18n routing first
  const response = handleI18nRouting(request);

  // If i18n returns a redirect (e.g. adding locale prefix), honour it
  if (response.headers.get('location')) {
    return response;
  }

  // --- Supabase auth check ---
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Helper: redirect to a locale-prefixed path
  const redirectTo = (path: string, searchParams?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${path}`;
    if (searchParams) {
      Object.entries(searchParams).forEach(([k, v]) =>
        url.searchParams.set(k, v)
      );
    }
    return NextResponse.redirect(url);
  };

  // Admin routes
  if (isAdmin) {
    if (!user) {
      return redirectTo('/auth/login', { redirect: strippedPath });
    }
    if (user.email !== process.env.ADMIN_EMAIL) {
      return redirectTo('/dashboard');
    }
    return response;
  }

  // Not authenticated → login
  if (!user) {
    return redirectTo('/auth/login', { redirect: strippedPath });
  }

  // Authenticated → check onboarding status
  const { data: staff } = await supabase
    .from('staff_members')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  const hasOrg = !!staff;

  // No org yet → must onboard first
  if ((isProtected || isBilling) && !hasOrg) {
    return redirectTo('/onboarding');
  }

  // Already has org → skip onboarding
  if (isOnboarding && hasOrg) {
    return redirectTo('/dashboard');
  }

  // Has org → check subscription status (skip for /billing itself)
  if (isProtected && hasOrg) {
    const { data: subStatus } = await supabase.rpc('get_subscription_status');
    if (
      subStatus &&
      (subStatus as { status: string }).status === 'expired'
    ) {
      return redirectTo('/billing');
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|auth/callback|.*\\..*).*)'],
};
