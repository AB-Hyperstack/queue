import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { queueId, orgId, customerName, customerPhone } = body;

  if (!queueId || !orgId) {
    return NextResponse.json({ error: 'queueId and orgId are required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Get next ticket number
  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('queue_id', queueId)
    .gte('created_at', today);

  const ticketNumber = (count ?? 0) + 1;

  // Get queue for prefix
  const { data: queue } = await supabase
    .from('queues')
    .select('slug')
    .eq('id', queueId)
    .single();

  const prefix = (queue?.slug?.[0] || 'A').toUpperCase();
  const displayCode = `${prefix}-${String(ticketNumber).padStart(3, '0')}`;

  // Get position
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log analytics
  await supabase.from('analytics_logs').insert({
    org_id: orgId,
    queue_id: queueId,
    event_type: 'join',
    ticket_id: data.id,
  });

  return NextResponse.json({ data });
}
