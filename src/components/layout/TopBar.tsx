'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface TopBarProps {
  title: string;
  subtitle?: string;
  connected?: boolean;
}

export default function TopBar({ title, subtitle, connected }: TopBarProps) {
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
              {connected ? 'Live' : 'Connecting…'}
            </span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
