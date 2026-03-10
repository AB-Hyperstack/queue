'use client';

import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useSidebar } from '@/components/layout/SidebarProvider';

interface TopBarProps {
  title: string;
  subtitle?: string;
  connected?: boolean;
}

export default function TopBar({ title, subtitle, connected }: TopBarProps) {
  const t = useTranslations('Common');
  const router = useRouter();
  const supabase = createClient();
  const { toggle } = useSidebar();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button onClick={toggle} className="md:hidden p-1 -ml-1 text-gray-500 hover:text-gray-700">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {connected !== undefined && (
          <div className="flex items-center gap-1.5 text-sm">
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-amber-400 animate-pulse'}`} />
            <span className={`hidden sm:inline ${connected ? 'text-green-600' : 'text-amber-500'}`}>
              {connected ? t('live') : t('connecting')}
            </span>
          </div>
        )}
        <LanguageSwitcher />
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <span className="hidden sm:inline">{t('signOut')}</span>
          {/* Icon-only on mobile */}
          <svg className="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </Button>
      </div>
    </header>
  );
}
