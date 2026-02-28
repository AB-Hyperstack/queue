'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
        setError('Organization not found');
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
  }, [orgSlug, preselectedQueue]);

  const handleJoin = async () => {
    if (!selectedQueue || !org) return;
    setJoining(true);

    const { data, error: joinError } = await joinQueue(
      selectedQueue.id,
      org.id,
      customerName || undefined
    );

    if (joinError) {
      setError('Failed to join queue. Please try again.');
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
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-teal-600 border-t-transparent" />
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">QueueFlow</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{org?.name}</h1>
          <p className="mt-1 text-gray-500">Join the queue to get served</p>
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
                <h3 className="font-medium text-gray-900">Your details (optional)</h3>
                <Input
                  label="Name"
                  placeholder="Enter your name"
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
              ? `Join ${selectedQueue.name}`
              : 'Select a queue to join'}
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
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-teal-600 border-t-transparent" />
        </div>
      }
    >
      <JoinQueueContent />
    </Suspense>
  );
}
