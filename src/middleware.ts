import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Admin routes — separate auth logic
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    if (user.email !== process.env.ADMIN_EMAIL) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const isProtectedRoute = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/settings');
  const isOnboarding = pathname.startsWith('/onboarding');
  const isBilling = pathname.startsWith('/billing');

  // Not authenticated → login
  if ((isProtectedRoute || isOnboarding || isBilling) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated → check onboarding status
  if (user && (isProtectedRoute || isOnboarding || isBilling)) {
    const { data: staff } = await supabase
      .from('staff_members')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    const hasOrg = !!staff;

    // No org yet → must onboard first
    if ((isProtectedRoute || isBilling) && !hasOrg) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }

    // Already has org → skip onboarding
    if (isOnboarding && hasOrg) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // Has org → check subscription status (skip for /billing itself)
    if (isProtectedRoute && hasOrg) {
      const { data: subStatus } = await supabase.rpc('get_subscription_status');

      if (subStatus && (subStatus as { status: string }).status === 'expired') {
        const url = request.nextUrl.clone();
        url.pathname = '/billing';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/analytics/:path*', '/settings/:path*', '/onboarding/:path*', '/billing/:path*', '/admin/:path*'],
};
