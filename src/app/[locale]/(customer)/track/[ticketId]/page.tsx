'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeTickets } from '@/lib/hooks/useRealtimeTickets';
import { requestNotificationPermission, subscriptionToJSON } from '@/lib/utils/push';
import type { Ticket, Queue } from '@/lib/types/database';
import TicketTracker from '@/components/queue/TicketTracker';
import FeedbackForm from '@/components/queue/FeedbackForm';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function TrackPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  const t = useTranslations('Track');
  const tCommon = useTranslations('Common');

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsDenied, setNotificationsDenied] = useState(false);

  // Load ticket and queue data
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (ticketData) {
        setTicket(ticketData);

        const { data: queueData } = await supabase
          .from('queues')
          .select('*')
          .eq('id', ticketData.queue_id)
          .single();

        if (queueData) setQueue(queueData);
      }
      setLoading(false);
    }
    load();
  }, [ticketId]);

  // Subscribe to realtime updates for this queue
  const { tickets: queueTickets } = useRealtimeTickets({
    queueId: ticket?.queue_id,
    statusFilter: ['waiting', 'serving'],
  });

  // Update our ticket from realtime data
  useEffect(() => {
    if (!ticket) return;
    const updated = queueTickets.find((t) => t.id === ticket.id);
    if (updated && JSON.stringify(updated) !== JSON.stringify(ticket)) {
      setTicket(updated);
    }
  }, [queueTickets, ticket]);

  // Calculate position
  const aheadCount = ticket
    ? queueTickets.filter(
        (t) => t.status === 'waiting' && (t.position ?? 999) < (ticket.position ?? 999)
      ).length
    : 0;

  // Check notification state on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') setNotificationsEnabled(true);
      if (Notification.permission === 'denied') setNotificationsDenied(true);
    }
  }, []);

  const enableNotifications = useCallback(async () => {
    const subscription = await requestNotificationPermission();
    if (subscription) {
      setNotificationsEnabled(true);
      // Store subscription on ticket
      const supabase = createClient();
      await supabase
        .from('tickets')
        .update({ push_subscription: subscriptionToJSON(subscription) })
        .eq('id', ticketId);
    } else {
      setNotificationsDenied(true);
    }
  }, [ticketId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!ticket || !queue) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-sm text-center">
          <p className="text-gray-500">{t('ticketNotFound')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-lg px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/carelabs-logo.svg" alt="CareLabs" width={110} height={18} />
              <span className="text-xs font-medium text-gray-400 border-l border-gray-200 pl-2">QueueFlow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${ticket.status === 'cancelled' || ticket.status === 'no_show' ? 'bg-red-400' : 'bg-green-400'}`} />
              <span className="text-xs text-gray-500">{tCommon('live')}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-12">
        {/* Tracker */}
        <TicketTracker
          ticket={ticket}
          queue={queue}
          aheadCount={aheadCount}
        />

        {/* Feedback Form — shows when ticket is served */}
        {ticket.status === 'served' && (
          <div className="mt-8">
            <FeedbackForm
              ticketId={ticket.id}
              orgId={ticket.org_id}
              queueId={ticket.queue_id}
            />
          </div>
        )}

        {/* Notification CTA */}
        {ticket.status === 'waiting' && !notificationsEnabled && !notificationsDenied && (
          <div className="mt-8">
            <Card className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                {t('getNotified')}
              </p>
              <Button size="sm" variant="secondary" onClick={enableNotifications}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {t('enableNotifications')}
              </Button>
            </Card>
          </div>
        )}

        {notificationsEnabled && ticket.status === 'waiting' && (
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              {t('notificationsEnabled')}
            </p>
          </div>
        )}

        {/* Cancelled / No Show */}
        {(ticket.status === 'cancelled' || ticket.status === 'no_show') && (
          <div className="mt-8">
            <Card className="text-center">
              <p className="text-gray-500">
                {ticket.status === 'cancelled'
                  ? t('ticketCancelled')
                  : t('ticketNoShow')}
              </p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
