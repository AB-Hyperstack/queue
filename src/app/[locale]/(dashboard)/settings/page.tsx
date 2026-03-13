'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Organization, Queue, StaffMember } from '@/lib/types/database';
import { QRCodeSVG } from 'qrcode.react';
import TopBar from '@/components/layout/TopBar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { PLANS } from '@/lib/billing/constants';

export default function SettingsPage() {
  const t = useTranslations('Settings');
  const tc = useTranslations('Common');
  const [org, setOrg] = useState<Organization | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQueueName, setNewQueueName] = useState('');
  const [creating, setCreating] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const { isTrialing, isActive, isExpired, daysRemaining, showWarning, subscription, loading: subLoading } = useSubscription();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staff } = await supabase
        .from('staff_members')
        .select('*, organizations(*)')
        .eq('user_id', user.id)
        .single();

      if (staff) {
        const orgData = (staff as StaffMember & { organizations: Organization }).organizations;
        setOrg(orgData);

        const { data: queueData } = await supabase
          .from('queues')
          .select('*')
          .eq('org_id', orgData.id)
          .order('name');

        if (queueData) setQueues(queueData);
      }
      setLoading(false);
    }
    load();
  }, []);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const MAX_QUEUES = 3;

  const createQueue = async () => {
    if (!org || !newQueueName.trim() || queues.length >= MAX_QUEUES) return;
    setCreating(true);

    const slug = newQueueName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const supabase = createClient();

    const { data, error } = await supabase
      .from('queues')
      .insert({
        org_id: org.id,
        name: newQueueName.trim(),
        slug,
      })
      .select()
      .single();

    if (!error && data) {
      setQueues((prev) => [...prev, data as Queue]);
      setNewQueueName('');
    }
    setCreating(false);
  };

  const downloadQR = (queueSlug?: string) => {
    const svg = document.querySelector(
      queueSlug ? `[data-qr="${queueSlug}"]` : '[data-qr="main"]'
    ) as SVGSVGElement;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a');
      a.download = `queueflow-qr-${queueSlug || org?.slug || 'main'}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title={t('title')} subtitle={org?.name} />

      <div className="flex-1 overflow-auto p-4 md:p-6 max-w-4xl">
        {/* Plan & Billing */}
        {!subLoading && subscription && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('planAndBilling')}</h2>
            <Card className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  {isTrialing && (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          showWarning ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {t('freeTrial')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t('daysRemaining', { days: daysRemaining })}
                        {showWarning && ` ${t('upgradeToKeep')}`}
                      </p>
                    </>
                  )}
                  {isActive && (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          {t('activePlan')}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {t('planName', { plan: subscription.plan === 'yearly' ? PLANS.yearly.name : PLANS.monthly.name })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {subscription.plan === 'yearly' ? PLANS.yearly.priceDisplay + '/year' : PLANS.monthly.priceDisplay + '/month'}
                      </p>
                    </>
                  )}
                  {isExpired && (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                          {t('expiredLabel')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t('trialEnded')}
                      </p>
                    </>
                  )}
                </div>
                {isActive ? (
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/billing/portal', { method: 'POST' });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('manageSubscription')}
                  </button>
                ) : (
                  <Link
                    href="/billing"
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('upgrade')}
                  </Link>
                )}
              </div>
            </Card>
          </>
        )}

        {/* QR Codes */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('qrCodes')}</h2>
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {/* Main QR */}
          <Card className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">{t('mainJoinLink')}</p>
            <div className="flex justify-center mb-3" ref={qrRef}>
              <QRCodeSVG
                data-qr="main"
                value={`${appUrl}/join/${org?.slug}`}
                size={180}
                fgColor="#1f2937"
                level="M"
              />
            </div>
            <p className="text-xs text-gray-400 mb-3 break-all">
              {appUrl}/join/{org?.slug}
            </p>
            <Button size="sm" variant="secondary" onClick={() => downloadQR()}>
              {tc('downloadPng')}
            </Button>
          </Card>

          {/* Per-queue QR codes */}
          {queues.map((q) => (
            <Card key={q.id} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: q.color }} />
                <p className="text-sm font-medium text-gray-700">{q.name}</p>
              </div>
              <div className="flex justify-center mb-3">
                <QRCodeSVG
                  data-qr={q.slug}
                  value={`${appUrl}/join/${org?.slug}?queue=${q.slug}`}
                  size={180}
                  fgColor="#1f2937"
                  level="M"
                />
              </div>
              <p className="text-xs text-gray-400 mb-3 break-all">
                {appUrl}/join/{org?.slug}?queue={q.slug}
              </p>
              <Button size="sm" variant="secondary" onClick={() => downloadQR(q.slug)}>
                {tc('downloadPng')}
              </Button>
            </Card>
          ))}
        </div>

        {/* Queue Management */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('queueLanes')}</h2>
        <Card>
          <div className="space-y-3">
            {queues.map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: q.color }} />
                  <span className="font-medium text-gray-900">{q.name}</span>
                  <span className="text-xs text-gray-400">/{q.slug}</span>
                </div>
                <span className={`text-xs font-medium ${q.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                  {q.is_active ? tc('active') : tc('inactive')}
                </span>
              </div>
            ))}

            {/* Add new queue */}
            {queues.length >= MAX_QUEUES ? (
              <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                {t('queueLimitReached', { max: MAX_QUEUES })}
              </p>
            ) : (
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Input
                  placeholder={t('newQueuePlaceholder')}
                  value={newQueueName}
                  onChange={(e) => setNewQueueName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="md"
                  disabled={!newQueueName.trim()}
                  loading={creating}
                  onClick={createQueue}
                >
                  {tc('add')}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Kiosk Link */}
        <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">{t('kioskModeTitle')}</h2>
        <Card>
          <p className="text-sm text-gray-600 mb-3">
            {t('kioskModeDesc')}
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
            <code className="flex-1 text-sm text-gray-700 break-all">
              {appUrl}/kiosk/{org?.slug}
            </code>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigator.clipboard.writeText(`${appUrl}/kiosk/${org?.slug}`)}
            >
              {tc('copy')}
            </Button>
          </div>
        </Card>

        {/* Display Link */}
        <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">{t('displayModeTitle')}</h2>
        <Card>
          <p className="text-sm text-gray-600 mb-3">
            {t('displayModeDesc')}
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
            <code className="flex-1 text-sm text-gray-700 break-all">
              {appUrl}/display/{org?.slug}
            </code>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigator.clipboard.writeText(`${appUrl}/display/${org?.slug}`)}
            >
              {tc('copy')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
