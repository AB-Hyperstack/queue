'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeTickets } from '@/lib/hooks/useRealtimeTickets';
import { useQueue } from '@/lib/hooks/useQueue';
import type { Queue, Organization, StaffMember } from '@/lib/types/database';
import TopBar from '@/components/layout/TopBar';
import TicketRow from '@/components/queue/TicketRow';
import StatBlock from '@/components/queue/StatBlock';
import Card from '@/components/ui/Card';

export default function DashboardPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);

  const { callNext, completeService, markNoShow, snoozeTicket } = useQueue();

  // Load org and queues
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get staff member's org
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

        if (queueData?.length) {
          setQueues(queueData);
          setSelectedQueue(queueData[0]);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  // Realtime tickets for selected queue
  const { tickets, connected } = useRealtimeTickets({
    queueId: selectedQueue?.id,
    statusFilter: ['waiting', 'serving'],
  });

  const waitingTickets = tickets.filter((t) => t.status === 'waiting');
  const servingTickets = tickets.filter((t) => t.status === 'serving');

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Queue Management"
        subtitle={org?.name}
        connected={connected}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatBlock
            label="Waiting"
            value={waitingTickets.length}
            color="amber"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatBlock
            label="Being Served"
            value={servingTickets.length}
            color="teal"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            }
          />
          <StatBlock
            label="Avg Wait"
            value={selectedQueue ? `${selectedQueue.avg_service_time_min * Math.max(waitingTickets.length, 1)}m` : '—'}
            color="blue"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
              </svg>
            }
          />
        </div>

        {/* Queue Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {queues.map((q) => (
            <button
              key={q.id}
              onClick={() => setSelectedQueue(q)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                selectedQueue?.id === q.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: selectedQueue?.id === q.id ? '#fff' : q.color }}
              />
              {q.name}
            </button>
          ))}
        </div>

        {/* Ticket List */}
        <Card padding="sm">
          {tickets.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
              <p className="mt-4 text-gray-500">No one in the queue</p>
              <p className="text-sm text-gray-400">Tickets will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {/* Serving section */}
              {servingTickets.length > 0 && (
                <>
                  <p className="px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Now Serving</p>
                  {servingTickets.map((t) => (
                    <TicketRow
                      key={t.id}
                      ticket={t}
                      onComplete={async () => completeService(t)}
                    />
                  ))}
                </>
              )}

              {/* Waiting section */}
              {waitingTickets.length > 0 && (
                <>
                  <p className="px-2 pt-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Waiting</p>
                  {waitingTickets.map((t) => (
                    <TicketRow
                      key={t.id}
                      ticket={t}
                      onCall={async () => callNext(t)}
                      onSnooze={async () => snoozeTicket(t)}
                      onNoShow={async () => markNoShow(t)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
