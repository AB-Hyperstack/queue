import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Stripe from 'stripe';

// Map Stripe price IDs to plan types
function getPlanFromPriceId(priceId: string): 'monthly' | 'yearly' | null {
  if (priceId === process.env.STRIPE_PRICE_MONTHLY) return 'monthly';
  if (priceId === process.env.STRIPE_PRICE_YEARLY) return 'yearly';
  return null;
}

// Map Stripe subscription status to our status
function mapStripeStatus(status: string): string {
  switch (status) {
    case 'active': return 'active';
    case 'past_due': return 'past_due';
    case 'canceled': return 'canceled';
    case 'unpaid': return 'expired';
    case 'incomplete_expired': return 'expired';
    default: return 'active';
  }
}

// Get period dates from subscription items (Stripe v20+)
function getPeriodFromSubscription(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  if (!item) return { start: null, end: null };
  return {
    start: new Date(item.current_period_start * 1000).toISOString(),
    end: new Date(item.current_period_end * 1000).toISOString(),
  };
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Checkout completed ─────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;

        if (!orgId || !session.subscription) break;

        // Retrieve the full subscription to get price/period info
        const sub = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = sub.items.data[0]?.price?.id;
        const plan = priceId ? getPlanFromPriceId(priceId) : null;
        const period = getPeriodFromSubscription(sub);

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            plan,
            stripe_subscription_id: sub.id,
            stripe_customer_id: session.customer as string,
            current_period_start: period.start,
            current_period_end: period.end,
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId);

        break;
      }

      // ── Invoice paid (renewals) ────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        // Get the subscription ID from the invoice parent
        const subscriptionId =
          (invoice.parent?.subscription_details?.subscription as string) ?? null;

        if (!subscriptionId) break;

        // Use invoice period dates
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date(invoice.period_start * 1000).toISOString(),
            current_period_end: new Date(invoice.period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        break;
      }

      // ── Subscription updated (status/plan changes) ─────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price?.id;
        const plan = priceId ? getPlanFromPriceId(priceId) : null;
        const status = mapStripeStatus(sub.status);
        const period = getPeriodFromSubscription(sub);

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status,
            plan,
            current_period_start: period.start,
            current_period_end: period.end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);

        break;
      }

      // ── Subscription deleted (fully ended) ─────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'expired',
            plan: null,
            current_period_start: null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);

        break;
      }
    }
  } catch (err) {
    // Log but still return 200 to Stripe to prevent retries
    console.error('Webhook handler error:', err);
  }

  // Always return 200 so Stripe doesn't retry
  return NextResponse.json({ received: true });
}
