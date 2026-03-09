'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const t = useTranslations('Auth');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();

    if (mode === 'login') {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
    }

    router.push(mode === 'signup' ? '/onboarding' : redirect);
  };

  return (
    <div className="w-full max-w-sm">
      {/* Language Switcher */}
      <div className="mb-4 flex justify-end">
        <LanguageSwitcher />
      </div>

      {/* Logo */}
      <div className="mb-8 text-center">
        <Image
          src="/carelabs-logo.svg"
          alt="CareLabs"
          width={160}
          height={26}
          className="mx-auto"
        />
        <p className="mt-2 text-xs text-gray-400">QueueFlow</p>
        <h1 className="mt-4 text-xl font-bold text-gray-900">
          {mode === 'login' ? t('signInTitle') : t('signUpTitle')}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {mode === 'login'
            ? t('signInSubtitle')
            : t('signUpSubtitle')}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('emailLabel')}
            type="email"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label={t('passwordLabel')}
            type="password"
            placeholder={t('passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            {mode === 'login' ? t('signInButton') : t('signUpButton')}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-sm text-teal-600 hover:text-teal-700"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login'
              ? t('noAccount')
              : t('hasAccount')}
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 rounded-full border-2 border-teal-600 border-t-transparent" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
