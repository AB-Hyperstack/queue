'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeTickets } from '@/lib/hooks/useRealtimeTickets';
import { useQueue } from '@/lib/hooks/useQueue';
import type { Queue, Organization, StaffMember } from '@/lib/types/database';
import TopBar from '@/components/layout/TopBar';
import TicketRow from '@/components/queue/TicketRow';
import StatBlock from '@/components/queue/StatBlock';
import Card from '@/components/ui/Card';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const [org, setOrg] = useState<Organization | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);

  const { callNext, completeService, markNoShow, snoozeTicket } = useQueue();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

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
  const { tickets, connected, refetch } = useRealtimeTickets({
    queueId: selectedQueue?.id,
    statusFilter: ['waiting', 'serving'],
  });

  const waitingTickets = tickets.filter((tk) => tk.status === 'waiting');
  const servingTickets = tickets.filter((tk) => tk.status === 'serving');

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title={t('queueManagement')}
        subtitle={org?.name}
        connected={connected}
      />

      {/* Toast notification */}
      {toast && (
        <div
          className={`mx-4 mt-2 md:mx-6 rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-all ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {toast.type === 'success' ? (
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          )}
          <span className="truncate">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto shrink-0 text-current opacity-60 hover:opacity-100">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatBlock
            label={t('waiting')}
            value={waitingTickets.length}
            color="amber"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatBlock
            label={t('beingServed')}
            value={servingTickets.length}
            color="blue"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            }
          />
          <StatBlock
            label={t('avgWait')}
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
                  ? 'bg-blue-600 text-white'
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
              <p className="mt-4 text-gray-500">{t('noOneInQueue')}</p>
              <p className="text-sm text-gray-400">{t('ticketsAppearHere')}</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {/* Serving section */}
              {servingTickets.length > 0 && (
                <>
                  <p className="px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">{t('nowServing')}</p>
                  {servingTickets.map((tk) => (
                    <TicketRow
                      key={tk.id}
                      ticket={tk}
                      onComplete={async () => {
                        const result = await completeService(tk);
                        if (!result.error) refetch();
                        return result;
                      }}
                    />
                  ))}
                </>
              )}

              {/* Waiting section */}
              {waitingTickets.length > 0 && (
                <>
                  <p className="px-2 pt-2 text-xs font-medium text-gray-400 uppercase tracking-wider">{t('waitingLabel')}</p>
                  {waitingTickets.map((tk) => (
                    <TicketRow
                      key={tk.id}
                      ticket={tk}
                      onCall={async () => {
                        const result = await callNext(tk);
                        if (!result.error) {
                          refetch();
                          if (result.notified) {
                            showToast(t('calledAndNotified', { code: tk.display_code }), 'success');
                          } else {
                            showToast(t('calledNotNotified', { code: tk.display_code }), 'warning');
                          }
                        }
                        return result;
                      }}
                      onSnooze={async () => {
                        const result = await snoozeTicket(tk);
                        if (!result.error) refetch();
                        return result;
                      }}
                      onNoShow={async () => {
                        const result = await markNoShow(tk);
                        if (!result.error) refetch();
                        return result;
                      }}
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
