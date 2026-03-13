'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
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
  const [aheadCount, setAheadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsDenied, setNotificationsDenied] = useState(false);
  const ticketRef = useRef<Ticket | null>(null);

  // Load queue data once we have a ticket
  useEffect(() => {
    if (!ticket?.queue_id) return;
    const supabase = createClient();
    supabase
      .from('queues')
      .select('*')
      .eq('id', ticket.queue_id)
      .single()
      .then(({ data }) => { if (data) setQueue(data); });
  }, [ticket?.queue_id]);

  // Fetch ticket + ahead count in one go
  const fetchTicket = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (data) {
      // Only update state if something actually changed
      const prev = ticketRef.current;
      if (!prev || JSON.stringify(prev) !== JSON.stringify(data)) {
        ticketRef.current = data;
        setTicket(data);
      }

      // Count people ahead (only relevant while waiting)
      if (data.status === 'waiting') {
        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('queue_id', data.queue_id)
          .eq('status', 'waiting')
          .lt('position', data.position);
        setAheadCount(count ?? 0);
      } else {
        setAheadCount(0);
      }
    }
    return data;
  }, [ticketId]);

  // Initial load
  useEffect(() => {
    fetchTicket().then(() => setLoading(false));
  }, [fetchTicket]);

  // Polling (reliable fallback) + Realtime (instant when it works)
  useEffect(() => {
    if (!ticketId) return;
    const supabase = createClient();

    // Poll every 3 seconds — guaranteed to work on all browsers
    const interval = setInterval(fetchTicket, 3000);

    // Also subscribe to realtime for instant updates when available
    const channel = supabase
      .channel(`track-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          const updated = payload.new as Ticket;
          ticketRef.current = updated;
          setTicket(updated);
          if (updated.status !== 'waiting') setAheadCount(0);
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [ticketId, fetchTicket]);

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
