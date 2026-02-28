'use client';

import { createClient } from '@/lib/supabase/client';
import type { Ticket } from '@/lib/types/database';

export function useQueue() {
  const supabase = createClient();

  const callNext = async (ticket: Ticket) => {
    const { error } = await supabase
      .from('tickets')
      .update({
        status: 'serving',
        called_at: new Date().toISOString(),
      })
      .eq('id', ticket.id);

    if (!error) {
      // Log analytics event
      await supabase.from('analytics_logs').insert({
        org_id: ticket.org_id,
        queue_id: ticket.queue_id,
        event_type: 'call',
        ticket_id: ticket.id,
        wait_duration_sec: Math.floor(
          (Date.now() - new Date(ticket.joined_at).getTime()) / 1000
        ),
      });

      // Trigger push notification
      try {
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: ticket.id }),
        });
      } catch {
        // Push notification is best-effort
      }
    }
    return { error };
  };

  const completeService = async (ticket: Ticket) => {
    const { error } = await supabase
      .from('tickets')
      .update({
        status: 'served',
        served_at: new Date().toISOString(),
      })
      .eq('id', ticket.id);

    if (!error && ticket.called_at) {
      await supabase.from('analytics_logs').insert({
        org_id: ticket.org_id,
        queue_id: ticket.queue_id,
        event_type: 'serve',
        ticket_id: ticket.id,
        service_duration_sec: Math.floor(
          (Date.now() - new Date(ticket.called_at).getTime()) / 1000
        ),
      });

      // Recalculate positions for remaining waiting tickets
      await recalculatePositions(ticket.queue_id);
    }
    return { error };
  };

  const markNoShow = async (ticket: Ticket) => {
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'no_show' })
      .eq('id', ticket.id);

    if (!error) {
      await supabase.from('analytics_logs').insert({
        org_id: ticket.org_id,
        queue_id: ticket.queue_id,
        event_type: 'no_show',
        ticket_id: ticket.id,
      });
      await recalculatePositions(ticket.queue_id);
    }
    return { error };
  };

  const snoozeTicket = async (ticket: Ticket) => {
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

    const { error } = await supabase
      .from('tickets')
      .update({ position: newPosition })
      .eq('id', ticket.id);

    if (!error) {
      await recalculatePositions(ticket.queue_id);
    }
    return { error };
  };

  const joinQueue = async (
    queueId: string,
    orgId: string,
    customerName?: string,
    customerPhone?: string
  ) => {
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
      await supabase.from('analytics_logs').insert({
        org_id: orgId,
        queue_id: queueId,
        event_type: 'join',
        ticket_id: data.id,
      });
    }

    return { data: data as Ticket | null, error };
  };

  const recalculatePositions = async (queueId: string) => {
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
  };

  return { callNext, completeService, markNoShow, snoozeTicket, joinQueue };
}
