'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SubscriptionStatusResponse } from '@/lib/types/database';
import { TRIAL_WARNING_DAYS } from '@/lib/billing/constants';

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.rpc('get_subscription_status');
      if (!cancelled && data) {
        setSubscription(data as unknown as SubscriptionStatusResponse);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const isTrialing = subscription?.status === 'trialing';
  const isActive = subscription?.status === 'active';
  const isExpired = subscription?.status === 'expired';
  const isCanceled = subscription?.status === 'canceled';
  const hasAccess = isTrialing || isActive;
  const daysRemaining = subscription?.trial_days_remaining ?? 0;
  const showWarning = isTrialing && daysRemaining <= TRIAL_WARNING_DAYS;

  return {
    subscription,
    loading,
    isTrialing,
    isActive,
    isExpired,
    isCanceled,
    hasAccess,
    daysRemaining,
    showWarning,
  };
}
