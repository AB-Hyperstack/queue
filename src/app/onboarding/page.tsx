'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const PRESET_COLORS = [
  '#0D9488',
  '#D97706',
  '#2563EB',
  '#7C3AED',
  '#DC2626',
  '#16A34A',
  '#EC4899',
  '#6366F1',
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((step) => (
        <div
          key={step}
          className={`h-2 rounded-full transition-all duration-300 ${
            step === current
              ? 'w-8 bg-teal-600'
              : step < current
                ? 'w-2 bg-teal-600'
                : 'w-2 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [ownerName, setOwnerName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);

  // Step 2 fields
  const [queueName, setQueueName] = useState('');
  const [queueColor, setQueueColor] = useState(PRESET_COLORS[0]);

  // Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdSlug, setCreatedSlug] = useState('');

  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkSlugAvailability = useCallback((slug: string) => {
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    if (!slug) {
      setSlugAvailable(null);
      setSlugChecking(false);
      return;
    }
    setSlugChecking(true);
    setSlugAvailable(null);
    slugCheckTimer.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc('check_org_slug_available', {
        slug_to_check: slug,
      });
      setSlugAvailable(data ?? false);
      setSlugChecking(false);
    }, 300);
  }, []);

  const handleOrgNameChange = (name: string) => {
    setOrgName(name);
    if (!slugManuallyEdited) {
      const newSlug = generateSlug(name);
      setOrgSlug(newSlug);
      checkSlugAvailability(newSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    const newSlug = generateSlug(value);
    setOrgSlug(newSlug);
    setSlugManuallyEdited(true);
    checkSlugAvailability(newSlug);
  };

  const handleStep1Continue = () => {
    if (!ownerName.trim() || !orgName.trim() || !orgSlug.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (slugAvailable === false) {
      setError('This URL slug is already taken.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleCreateOrg = async (skipQueue: boolean) => {
    if (!skipQueue && !queueName.trim()) {
      setError('Please enter a queue name, or skip this step.');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc(
      'create_organization_with_owner',
      {
        org_name: orgName.trim(),
        org_slug: orgSlug.trim(),
        owner_name: ownerName.trim(),
        first_queue_name: skipQueue ? null : queueName.trim(),
        first_queue_color: queueColor,
      }
    );

    if (rpcError) {
      const msg = rpcError.message;
      if (msg.includes('slug')) {
        setError('This URL slug was just taken. Please go back and choose another.');
      } else if (msg.includes('already belongs')) {
        router.push('/dashboard');
        return;
      } else {
        setError('Something went wrong. Please try again.');
      }
      setLoading(false);
      return;
    }

    if (data) {
      setCreatedSlug(orgSlug);
    }

    setLoading(false);
    setStep(3);
  };

  return (
    <div className="w-full max-w-md">
      <StepIndicator current={step} />

      {/* Step 1: Organization Details */}
      {step === 1 && (
        <>
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">Set up your business</h1>
            <p className="mt-1 text-sm text-gray-500">
              Tell us about your business to get started
            </p>
          </div>

          <Card>
            <div className="space-y-4">
              <Input
                label="Your name"
                placeholder="Jane Smith"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />

              <Input
                label="Business name"
                placeholder="Acme Clinic"
                value={orgName}
                onChange={(e) => handleOrgNameChange(e.target.value)}
              />

              <div>
                <Input
                  label="URL slug"
                  placeholder="acme-clinic"
                  value={orgSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  error={slugAvailable === false ? 'This slug is already taken' : undefined}
                />
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">
                    Your join link: /join/{orgSlug || '...'}
                  </span>
                  {orgSlug && !slugChecking && slugAvailable === true && (
                    <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  {slugChecking && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border border-gray-300 border-t-teal-600" />
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button
                className="w-full"
                onClick={handleStep1Continue}
                disabled={!ownerName.trim() || !orgName.trim() || !orgSlug.trim() || slugAvailable === false || slugChecking}
              >
                Continue
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Step 2: First Queue */}
      {step === 2 && (
        <>
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">Create your first queue</h1>
            <p className="mt-1 text-sm text-gray-500">
              Set up a queue lane for your customers
            </p>
          </div>

          <Card>
            <div className="space-y-4">
              <Input
                label="Queue name"
                placeholder="e.g. General, Support, VIP"
                value={queueName}
                onChange={(e) => setQueueName(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Color
                </label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setQueueColor(color)}
                      className={`h-8 w-8 rounded-full transition-all ${
                        queueColor === color
                          ? 'ring-2 ring-offset-2 ring-teal-600 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button
                className="w-full"
                onClick={() => handleCreateOrg(false)}
                loading={loading}
                disabled={!queueName.trim()}
              >
                Create & continue
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-gray-400 hover:text-gray-600"
                  onClick={() => handleCreateOrg(true)}
                  disabled={loading}
                >
                  Skip — I&apos;ll set this up later
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-teal-600 hover:text-teal-700"
                  onClick={() => { setStep(1); setError(''); }}
                  disabled={loading}
                >
                  Back
                </button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Step 3: All Set */}
      {step === 3 && (
        <>
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
              <svg className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">You&apos;re all set!</h1>
            <p className="mt-1 text-sm text-gray-500">
              {orgName} is ready to go
            </p>
          </div>

          <div className="rounded-lg bg-teal-50 border border-teal-100 p-4 mb-6">
            <div className="flex gap-3">
              <svg className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-teal-900">Your 14-day free trial has started</p>
                <p className="text-xs text-teal-700 mt-0.5">Full access to all features. No credit card required.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <Link href="/settings" className="block">
              <Card className="hover:border-gray-200 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                    <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Share your QR code</p>
                    <p className="text-xs text-gray-500">Download and print QR codes for customers to join</p>
                  </div>
                </div>
              </Card>
            </Link>

            <a href={`/kiosk/${createdSlug}`} target="_blank" rel="noopener noreferrer" className="block">
              <Card className="hover:border-gray-200 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                    <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Open Kiosk mode</p>
                    <p className="text-xs text-gray-500">Set up a tablet for walk-in customers</p>
                  </div>
                </div>
              </Card>
            </a>

            <Link href="/dashboard" className="block">
              <Card className="hover:border-teal-100 border-teal-50 bg-teal-50/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100">
                    <svg className="h-5 w-5 text-teal-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-teal-900">Go to Dashboard</p>
                    <p className="text-xs text-teal-700">Start managing your queues</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
