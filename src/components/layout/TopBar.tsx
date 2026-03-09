'use client';

import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

interface TopBarProps {
  title: string;
  subtitle?: string;
  connected?: boolean;
}

export default function TopBar({ title, subtitle, connected }: TopBarProps) {
  const t = useTranslations('Common');
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {connected !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-amber-400 animate-pulse'}`} />
            <span className={connected ? 'text-green-600' : 'text-amber-500'}>
              {connected ? t('live') : t('connecting')}
            </span>
          </div>
        )}
        <LanguageSwitcher />
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          {t('signOut')}
        </Button>
      </div>
    </header>
  );
}
