'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useQueue } from '@/lib/hooks/useQueue';
import type { Queue, Organization } from '@/lib/types/database';
import QueueSelector from '@/components/queue/QueueSelector';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

function JoinQueueContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Join');
  const orgSlug = params.orgSlug as string;
  const preselectedQueue = searchParams.get('queue');

  const [org, setOrg] = useState<Organization | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [waitingCounts, setWaitingCounts] = useState<Record<string, number>>({});
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const { joinQueue } = useQueue();

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Fetch org
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single();

      if (!orgData) {
        setError(t('orgNotFound'));
        setLoading(false);
        return;
      }
      setOrg(orgData);

      // Fetch active queues
      const { data: queueData } = await supabase
        .from('queues')
        .select('*')
        .eq('org_id', orgData.id)
        .eq('is_active', true)
        .order('name');

      if (queueData) {
        setQueues(queueData);

        // If queue preselected via URL param
        if (preselectedQueue) {
          const match = queueData.find((q) => q.slug === preselectedQueue);
          if (match) setSelectedQueue(match);
        }

        // Get waiting counts for each queue
        const counts: Record<string, number> = {};
        for (const q of queueData) {
          const { count } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('queue_id', q.id)
            .eq('status', 'waiting');
          counts[q.id] = count ?? 0;
        }
        setWaitingCounts(counts);
      }

      setLoading(false);
    }
    load();
  }, [orgSlug, preselectedQueue, t]);

  const handleJoin = async () => {
    if (!selectedQueue || !org) return;
    setJoining(true);

    const { data, error: joinError } = await joinQueue(
      selectedQueue.id,
      org.id,
      customerName || undefined
    );

    if (joinError) {
      setError(t('joinFailed'));
      setJoining(false);
      return;
    }

    if (data) {
      router.push(`/track/${data.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error && !org) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-sm text-center">
          <p className="text-gray-500">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-lg px-6 py-4">
          <div className="flex items-center gap-2">
            <Image src="/carelabs-logo.svg" alt="CareLabs" width={110} height={18} />
            <span className="text-xs font-medium text-gray-400 border-l border-gray-200 pl-2">QueueFlow</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{org?.name}</h1>
          <p className="mt-1 text-gray-500">{t('joinTheQueue')}</p>
        </div>

        {/* Queue Selection */}
        <div className="space-y-6">
          <QueueSelector
            queues={queues}
            waitingCounts={waitingCounts}
            onSelect={setSelectedQueue}
          />

          {/* Customer Info */}
          {selectedQueue && (
            <Card>
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">{t('yourDetails')}</h3>
                <Input
                  label={t('nameLabel')}
                  placeholder={t('namePlaceholder')}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
            </Card>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Join Button */}
          <Button
            size="lg"
            className="w-full"
            disabled={!selectedQueue}
            loading={joining}
            onClick={handleJoin}
          >
            {selectedQueue
              ? t('joinButton', { queueName: selectedQueue.name })
              : t('selectToJoin')}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function JoinQueuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <JoinQueueContent />
    </Suspense>
  );
}
