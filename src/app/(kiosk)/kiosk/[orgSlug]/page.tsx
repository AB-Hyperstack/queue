'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useQueue } from '@/lib/hooks/useQueue';
import { useRealtimeTickets } from '@/lib/hooks/useRealtimeTickets';
import type { Queue, Organization } from '@/lib/types/database';

export default function KioskPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [org, setOrg] = useState<Organization | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [showTicket, setShowTicket] = useState(false);

  const { joinQueue } = useQueue();

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

  // Get realtime waiting counts
  const { tickets: allTickets } = useRealtimeTickets({
    orgId: org?.id,
    statusFilter: ['waiting', 'serving'],
  });

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

  const handleTakeNumber = async (queue: Queue) => {
    if (!org) return;

    const { data } = await joinQueue(queue.id, org.id);
    if (data) {
      setTicketCode(data.display_code);
      setShowTicket(true);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setShowTicket(false);
        setTicketCode(null);
      }, 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 kiosk-mode">
        <div className="animate-spin h-12 w-12 rounded-full border-3 border-teal-400 border-t-transparent" />
      </div>
    );
  }

  // Ticket confirmation overlay
  if (showTicket) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-teal-600 kiosk-mode">
        <div className="text-center text-white">
          <p className="text-2xl font-medium mb-4">Your number is</p>
          <p className="text-9xl font-bold tracking-wider mb-8">{ticketCode}</p>
          <p className="text-xl opacity-80">Please wait to be called</p>
          <div className="mt-12 animate-pulse">
            <p className="text-sm opacity-60">This screen will close automatically</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 kiosk-mode no-scrollbar">
      {/* Kiosk Header */}
      <header className="flex items-center justify-between bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{org?.name}</h1>
            <p className="text-sm text-gray-500">Tap a queue to take a number</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">QueueFlow Kiosk &mdash; by CareLabs Sweden</p>
        </div>
      </header>

      {/* Queue Buttons */}
      <main className="flex-1 grid gap-6 p-8" style={{
        gridTemplateColumns: queues.length <= 2 ? `repeat(${queues.length}, 1fr)` : 'repeat(3, 1fr)',
      }}>
        {queues.map((queue) => {
          const waiting = getWaitingCount(queue.id);
          const serving = getNowServing(queue.id);

          return (
            <button
              key={queue.id}
              onClick={() => handleTakeNumber(queue)}
              className="flex flex-col items-center justify-center rounded-2xl bg-white border-2 border-gray-100
                         shadow-sm hover:shadow-lg hover:border-teal-200 active:scale-[0.98]
                         transition-all duration-200 p-8 min-h-[250px]"
            >
              {/* Color dot */}
              <div
                className="h-5 w-5 rounded-full mb-4"
                style={{ backgroundColor: queue.color }}
              />

              {/* Queue name */}
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{queue.name}</h2>

              {/* Stats */}
              <div className="flex gap-8 text-center">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{waiting}</p>
                  <p className="text-sm text-gray-500">Waiting</p>
                </div>
                <div className="border-l border-gray-200" />
                <div>
                  <p className="text-3xl font-bold text-teal-600">{serving}</p>
                  <p className="text-sm text-gray-500">Now Serving</p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6 rounded-xl bg-teal-600 px-8 py-3 text-white font-semibold text-lg">
                Take a Number
              </div>
            </button>
          );
        })}
      </main>
    </div>
  );
}
