'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeTickets } from '@/lib/hooks/useRealtimeTickets';
import type { Queue, Organization } from '@/lib/types/database';

export default function DisplayPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const t = useTranslations('Display');
  const tCommon = useTranslations('Common');

  const [org, setOrg] = useState<Organization | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [flashQueue, setFlashQueue] = useState<string | null>(null);
  const prevServingRef = useRef<Record<string, string>>({});

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load org + queues
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single();

      if (orgData) {
        setOrg(orgData);
        const { data: queueData } = await supabase
          .from('queues')
          .select('*')
          .eq('org_id', orgData.id)
          .eq('is_active', true)
          .order('name');

        if (queueData) setQueues(queueData);
      }
      setLoading(false);
    }
    load();
  }, [orgSlug]);

  // Realtime tickets
  const { tickets: allTickets, connected, refetch } = useRealtimeTickets({
    orgId: org?.id,
    statusFilter: ['waiting', 'serving'],
  });

  // Polling fallback — keeps display up-to-date even if realtime drops
  useEffect(() => {
    if (!org) return;
    const interval = setInterval(() => refetch(), 5000);
    return () => clearInterval(interval);
  }, [org, refetch]);

  const getWaitingCount = useCallback(
    (queueId: string) => allTickets.filter((t) => t.queue_id === queueId && t.status === 'waiting').length,
    [allTickets]
  );

  const getNowServing = useCallback(
    (queueId: string) => {
      const serving = allTickets.find((t) => t.queue_id === queueId && t.status === 'serving');
      return serving?.display_code || '—';
    },
    [allTickets]
  );

  // Flash animation when "now serving" changes
  useEffect(() => {
    queues.forEach((queue) => {
      const current = getNowServing(queue.id);
      const prev = prevServingRef.current[queue.id];
      if (prev && prev !== current && current !== '—') {
        setFlashQueue(queue.id);
        setTimeout(() => setFlashQueue(null), 2000);
      }
      prevServingRef.current[queue.id] = current;
    });
  }, [allTickets, queues, getNowServing]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="animate-spin h-12 w-12 rounded-full border-3 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <p className="text-2xl text-gray-400">{t('orgNotFound')}</p>
      </div>
    );
  }

  const gridCols =
    queues.length <= 1
      ? 'grid-cols-1'
      : queues.length === 2
        ? 'grid-cols-2'
        : queues.length === 3
          ? 'grid-cols-3'
          : 'grid-cols-2 lg:grid-cols-4';

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white overflow-hidden select-none">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-6 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">{org.name}</h1>
        </div>
        <div className="text-right">
          <p className="text-4xl font-light tabular-nums text-gray-300">
            {time.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <p className="text-xs text-gray-500">
              {connected ? tCommon('live') : tCommon('connecting')}
            </p>
          </div>
        </div>
      </header>

      {/* Queue Display */}
      <main className={`flex-1 grid ${gridCols} gap-6 p-8`}>
        {queues.map((queue) => {
          const serving = getNowServing(queue.id);
          const waiting = getWaitingCount(queue.id);
          const isFlashing = flashQueue === queue.id;

          return (
            <div
              key={queue.id}
              className={`flex flex-col items-center justify-center rounded-3xl border transition-all duration-500 ${
                isFlashing
                  ? 'border-blue-400 bg-blue-950/50 scale-[1.02]'
                  : 'border-gray-800 bg-gray-900/50'
              }`}
            >
              {/* Queue name */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: queue.color }}
                />
                <h2 className="text-2xl font-semibold text-gray-300 uppercase tracking-wider">
                  {queue.name}
                </h2>
              </div>

              {/* Now Serving label */}
              <p className="text-lg text-gray-500 mb-2">{t('nowServing')}</p>

              {/* Number */}
              <div className={`transition-all duration-500 ${isFlashing ? 'scale-110' : ''}`}>
                <p className={`font-bold tabular-nums leading-none ${
                  queues.length <= 2 ? 'text-[12rem]' : 'text-[8rem]'
                } ${serving === '—' ? 'text-gray-700' : 'text-blue-400'}`}>
                  {serving}
                </p>
              </div>

              {/* Waiting count */}
              <div className="mt-8 flex items-center gap-2">
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <p className="text-xl text-gray-500">
                  {t('waiting', { count: waiting })}
                </p>
              </div>
            </div>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-10 py-4 border-t border-gray-800">
        <p className="text-sm text-gray-600">{t('branding')}</p>
        <p className="text-sm text-gray-600">
          {t('joinAt')} <span className="text-gray-400 font-medium">{typeof window !== 'undefined' ? window.location.origin : ''}/join/{orgSlug}</span>
        </p>
      </footer>
    </div>
  );
}
