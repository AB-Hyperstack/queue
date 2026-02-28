'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Ticket } from '@/lib/types/database';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseRealtimeTicketsOptions {
  queueId?: string;
  orgId?: string;
  statusFilter?: string[];
}

export function useRealtimeTickets({ queueId, orgId, statusFilter }: UseRealtimeTicketsOptions) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  // Stabilize statusFilter — only change the reference when the actual values change
  const stableStatusFilter = useMemo(
    () => statusFilter,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(statusFilter)]
  );

  // Keep a ref so realtime callbacks always see the latest filter without re-subscribing
  const statusFilterRef = useRef(stableStatusFilter);
  statusFilterRef.current = stableStatusFilter;

  const fetchTickets = useCallback(async () => {
    const supabase = createClient();
    let query = supabase.from('tickets').select('*');

    if (queueId) query = query.eq('queue_id', queueId);
    if (orgId) query = query.eq('org_id', orgId);
    if (statusFilterRef.current?.length) query = query.in('status', statusFilterRef.current);

    query = query.order('position', { ascending: true, nullsFirst: false });

    const { data, error } = await query;
    if (!error && data) {
      setTickets(data as Ticket[]);
    }
    setLoading(false);
  }, [queueId, orgId]);

  useEffect(() => {
    if (!queueId && !orgId) return;

    fetchTickets();

    const supabase = createClient();

    const filterValue = queueId
      ? `queue_id=eq.${queueId}`
      : orgId
        ? `org_id=eq.${orgId}`
        : undefined;

    const channelName = `tickets-${queueId || orgId}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          ...(filterValue ? { filter: filterValue } : {}),
        },
        (payload: RealtimePostgresChangesPayload<Ticket>) => {
          const sf = statusFilterRef.current;

          if (payload.eventType === 'INSERT') {
            const newTicket = payload.new as Ticket;
            if (!sf?.length || sf.includes(newTicket.status)) {
              setTickets((prev) =>
                [...prev, newTicket].sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
              );
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Ticket;
            setTickets((prev) => {
              if (sf?.length && !sf.includes(updated.status)) {
                return prev.filter((t) => t.id !== updated.id);
              }
              const exists = prev.find((t) => t.id === updated.id);
              if (!exists) {
                return [...prev, updated].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
              }
              return prev
                .map((t) => (t.id === updated.id ? updated : t))
                .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
            });
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as Partial<Ticket>;
            setTickets((prev) => prev.filter((t) => t.id !== deleted.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queueId, orgId, fetchTickets]);

  return { tickets, loading, connected, refetch: fetchTickets };
}
