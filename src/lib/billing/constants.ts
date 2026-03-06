export const PLANS = {
  monthly: {
    id: 'monthly' as const,
    name: 'Månadsvis',
    price: 500,
    interval: 'month' as const,
    priceDisplay: '500 kr',
    description: 'Faktureras månadsvis, avsluta när du vill',
  },
  yearly: {
    id: 'yearly' as const,
    name: 'Årsvis',
    price: 5000,
    interval: 'year' as const,
    priceDisplay: '5 000 kr',
    monthlyEquivalent: '417 kr',
    description: 'Faktureras årsvis',
    savings: '17%',
  },
} as const;

export const TRIAL_DURATION_DAYS = 14;
export const TRIAL_WARNING_DAYS = 3;

export const PLAN_FEATURES = [
  'Unlimited queues',
  'Unlimited staff members',
  'Real-time analytics',
  'QR codes & kiosk mode',
  'Push notifications',
  'Priority support',
];
