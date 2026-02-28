import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Lazy-load web-push to avoid build errors when VAPID keys are not configured
async function getWebPush() {
  const webpush = await import('web-push');
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (vapidPublicKey && vapidPrivateKey &&
      vapidPublicKey !== 'your-vapid-public-key' &&
      vapidPrivateKey !== 'your-vapid-private-key') {
    webpush.default.setVapidDetails(
      'mailto:admin@queueflow.app',
      vapidPublicKey,
      vapidPrivateKey
    );
    return webpush.default;
  }
  return null;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { ticketId } = body;

  if (!ticketId) {
    return NextResponse.json({ error: 'ticketId is required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, queues(name)')
    .eq('id', ticketId)
    .single();

  if (!ticket?.push_subscription) {
    return NextResponse.json({ message: 'No push subscription found' });
  }

  try {
    const wp = await getWebPush();
    if (!wp) {
      return NextResponse.json({ message: 'Push notifications not configured (VAPID keys missing)' });
    }

    const queueName = (ticket as Record<string, unknown> & { queues: { name: string } }).queues?.name || 'Queue';

    await wp.sendNotification(
      ticket.push_subscription,
      JSON.stringify({
        title: "It's your turn!",
        body: `You're being called in ${queueName}. Ticket: ${ticket.display_code}`,
        icon: '/icon-192.png',
        data: { ticketId: ticket.id },
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push notification failed:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
