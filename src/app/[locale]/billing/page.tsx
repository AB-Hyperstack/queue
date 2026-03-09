'use client';

import { useState, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { PLANS } from '@/lib/billing/constants';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

function BillingContent() {
  const t = useTranslations('Billing');
  const tf = useTranslations('PlanFeatures');
  const tc = useTranslations('Common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get('success') === 'true';
  const checkoutCanceled = searchParams.get('canceled') === 'true';

  const { subscription, loading, isTrialing, isActive, isExpired, hasAccess, daysRemaining } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [subscribing, setSubscribing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState('');

  const featureKeys = [
    'unlimitedQueues',
    'unlimitedStaff',
    'realtimeAnalytics',
    'qrAndKiosk',
    'pushNotifications',
    'prioritySupport',
  ] as const;

  const handleSubscribe = async () => {
    setSubscribing(true);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Something went wrong');
        setSubscribing(false);
      }
    } catch {
      setError('Failed to start checkout');
      setSubscribing(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);

    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setPortalLoading(false);
      }
    } catch {
      setPortalLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl">
      {/* Success / Cancel banners */}
      {checkoutSuccess && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-100 p-4 text-center">
          <p className="text-sm font-medium text-green-800">
            {t('paymentSuccess')}
          </p>
        </div>
      )}

      {checkoutCanceled && (
        <div className="mb-6 rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
          <p className="text-sm font-medium text-gray-700">
            {t('checkoutCanceled')}
          </p>
        </div>
      )}

      {/* Status Banner */}
      {isExpired && !checkoutSuccess && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-center">
          <p className="text-sm font-medium text-red-800">
            {t('trialEnded')}
          </p>
          <p className="text-sm text-red-600 mt-1">
            {t('subscribeToContinue')}
          </p>
        </div>
      )}

      {isTrialing && (
        <div className={`mb-6 rounded-xl p-4 text-center border ${
          daysRemaining <= 3
            ? 'bg-amber-50 border-amber-200'
            : 'bg-teal-50 border-teal-100'
        }`}>
          <p className={`text-sm font-medium ${daysRemaining <= 3 ? 'text-amber-800' : 'text-teal-800'}`}>
            {t('trialRemaining', { days: daysRemaining })}
          </p>
          <p className={`text-sm mt-1 ${daysRemaining <= 3 ? 'text-amber-600' : 'text-teal-600'}`}>
            {t('subscribeNow')}
          </p>
        </div>
      )}

      {isActive && !checkoutSuccess && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-100 p-4 text-center">
          <p className="text-sm font-medium text-green-800">
            {t('proPlan')} &mdash; {subscription?.plan === 'yearly' ? 'Yearly' : 'Monthly'}
          </p>
          {subscription?.current_period_end && (
            <p className="text-sm text-green-600 mt-1">
              {t('nextBilling', { date: new Date(subscription.current_period_end).toLocaleDateString() })}
            </p>
          )}
        </div>
      )}

      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isExpired ? t('choosePlan') : isActive ? t('managePlan') : t('upgradePlan')}
        </h1>
        <p className="mt-2 text-gray-500">
          {t('simplePricing')}
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {/* Monthly */}
        <button
          type="button"
          onClick={() => setSelectedPlan('monthly')}
          className="text-left"
        >
          <Card
            className={`transition-all cursor-pointer h-full ${
              selectedPlan === 'monthly'
                ? 'border-teal-600 border-2 shadow-md'
                : 'hover:border-gray-200'
            }`}
          >
            <h3 className="font-semibold text-gray-900">{PLANS.monthly.name}</h3>
            <div className="mt-3">
              <span className="text-3xl font-bold text-gray-900">{PLANS.monthly.priceDisplay}</span>
              <span className="text-gray-500">{t('perMonth')}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{PLANS.monthly.description}</p>
          </Card>
        </button>

        {/* Yearly */}
        <button
          type="button"
          onClick={() => setSelectedPlan('yearly')}
          className="text-left relative"
        >
          <div className="absolute -top-2.5 right-4 bg-teal-600 text-white text-xs font-medium px-2.5 py-0.5 rounded-full z-10">
            {t('savePercent', { percent: PLANS.yearly.savings })}
          </div>
          <Card
            className={`transition-all cursor-pointer h-full ${
              selectedPlan === 'yearly'
                ? 'border-teal-600 border-2 shadow-md'
                : 'hover:border-gray-200'
            }`}
          >
            <h3 className="font-semibold text-gray-900">{PLANS.yearly.name}</h3>
            <div className="mt-3">
              <span className="text-3xl font-bold text-gray-900">{PLANS.yearly.priceDisplay}</span>
              <span className="text-gray-500">{t('perYear')}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {PLANS.yearly.monthlyEquivalent}/mo &mdash; {PLANS.yearly.description}
            </p>
          </Card>
        </button>
      </div>

      {/* Features */}
      <Card className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">{t('everythingIncluded')}</p>
        <div className="grid grid-cols-2 gap-2">
          {featureKeys.map((key) => (
            <div key={key} className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="h-4 w-4 text-teal-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {tf(key)}
            </div>
          ))}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 p-3 text-center">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Subscribe or Manage Button */}
      {!isActive ? (
        <Button className="w-full" onClick={handleSubscribe} loading={subscribing}>
          {t('subscribeButton', { price: selectedPlan === 'yearly' ? PLANS.yearly.priceDisplay + '/year' : PLANS.monthly.priceDisplay + '/month' })}
        </Button>
      ) : (
        <Button className="w-full" variant="secondary" onClick={handleManageSubscription} loading={portalLoading}>
          {t('manageSubscription')}
        </Button>
      )}

      {/* Footer Links */}
      <div className="mt-6 flex items-center justify-center gap-4">
        {hasAccess && (
          <Link href="/dashboard" className="text-sm text-teal-600 hover:text-teal-700">
            {t('backToDashboard')}
          </Link>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          {tc('signOut')}
        </button>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
