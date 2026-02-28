'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Ticket } from '@/lib/types/database';

export function useQueue() {
  const callNext = useCallback(async (ticket: Ticket) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('tickets')
      .update({
        status: 'serving',
        called_at: new Date().toISOString(),
      })
      .eq('id', ticket.id)
      .select()
      .single();

    if (error) {
      console.error('callNext update failed:', error);
      return { error };
    }

    if (!data) {
      console.error('callNext: no row updated — possible RLS issue');
      return { error: new Error('Update failed — no row updated') };
    }

    // Log analytics event (best-effort, don't block on failure)
    supabase.from('analytics_logs').insert({
      org_id: ticket.org_id,
      queue_id: ticket.queue_id,
      event_type: 'call',
      ticket_id: ticket.id,
      wait_duration_sec: Math.floor(
        (Date.now() - new Date(ticket.joined_at).getTime()) / 1000
      ),
    }).then(() => {});

    // Trigger push notification (best-effort)
    fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: ticket.id }),
    }).catch(() => {});

    return { error: null };
  }, []);

  const completeService = useCallback(async (ticket: Ticket) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('tickets')
      .update({
        status: 'served',
        served_at: new Date().toISOString(),
      })
      .eq('id', ticket.id)
      .select()
      .single();

    if (error) {
      console.error('completeService failed:', error);
      return { error };
    }

    if (!data) {
      return { error: new Error('Update failed — no row updated') };
    }

    // Analytics + recalculate positions (best-effort)
    if (ticket.called_at) {
      supabase.from('analytics_logs').insert({
        org_id: ticket.org_id,
        queue_id: ticket.queue_id,
        event_type: 'serve',
        ticket_id: ticket.id,
        service_duration_sec: Math.floor(
          (Date.now() - new Date(ticket.called_at).getTime()) / 1000
        ),
      }).then(() => {});
    }

    recalculatePositions(ticket.queue_id);

    return { error: null };
  }, []);

  const markNoShow = useCallback(async (ticket: Ticket) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('tickets')
      .update({ status: 'no_show' })
      .eq('id', ticket.id)
      .select()
      .single();

    if (error) {
      console.error('markNoShow failed:', error);
      return { error };
    }

    if (!data) {
      return { error: new Error('Update failed — no row updated') };
    }

    supabase.from('analytics_logs').insert({
      org_id: ticket.org_id,
      queue_id: ticket.queue_id,
      event_type: 'no_show',
      ticket_id: ticket.id,
    }).then(() => {});

    recalculatePositions(ticket.queue_id);

    return { error: null };
  }, []);

  const snoozeTicket = useCallback(async (ticket: Ticket) => {
    const supabase = createClient();

    // Move to end of queue
    const { data: lastTicket } = await supabase
      .from('tickets')
      .select('position')
      .eq('queue_id', ticket.queue_id)
      .eq('status', 'waiting')
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const newPosition = (lastTicket?.position ?? 0) + 1;

    const { data, error } = await supabase
      .from('tickets')
      .update({ position: newPosition })
      .eq('id', ticket.id)
      .select()
      .single();

    if (error) {
      console.error('snoozeTicket failed:', error);
      return { error };
    }

    if (!data) {
      return { error: new Error('Update failed — no row updated') };
    }

    recalculatePositions(ticket.queue_id);

    return { error: null };
  }, []);

  const joinQueue = useCallback(async (
    queueId: string,
    orgId: string,
    customerName?: string,
    customerPhone?: string
  ) => {
    const supabase = createClient();

    // Get next ticket number for today
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('queue_id', queueId)
      .gte('created_at', today);

    const ticketNumber = (count ?? 0) + 1;

    // Get queue prefix
    const { data: queue } = await supabase
      .from('queues')
      .select('slug')
      .eq('id', queueId)
      .single();

    const prefix = (queue?.slug?.[0] || 'A').toUpperCase();
    const displayCode = `${prefix}-${String(ticketNumber).padStart(3, '0')}`;

    // Get current position (last waiting + 1)
    const { count: waitingCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('queue_id', queueId)
      .eq('status', 'waiting');

    const position = (waitingCount ?? 0) + 1;

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        queue_id: queueId,
        org_id: orgId,
        ticket_number: ticketNumber,
        display_code: displayCode,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        status: 'waiting',
        position,
      })
      .select()
      .single();

    if (!error && data) {
      supabase.from('analytics_logs').insert({
        org_id: orgId,
        queue_id: queueId,
        event_type: 'join',
        ticket_id: data.id,
      }).then(() => {});
    }

    return { data: data as Ticket | null, error };
  }, []);

  return { callNext, completeService, markNoShow, snoozeTicket, joinQueue };
}

async function recalculatePositions(queueId: string) {
  const supabase = createClient();

  const { data: waitingTickets } = await supabase
    .from('tickets')
    .select('id, position')
    .eq('queue_id', queueId)
    .eq('status', 'waiting')
    .order('position', { ascending: true });

  if (waitingTickets) {
    for (let i = 0; i < waitingTickets.length; i++) {
      if (waitingTickets[i].position !== i + 1) {
        await supabase
          .from('tickets')
          .update({ position: i + 1 })
          .eq('id', waitingTickets[i].id);
      }
    }
  }
}
