import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/stripe';

export async function POST(request: Request) {
  try {
    // 1. Parse plan from body
    const { plan } = await request.json();
    if (plan !== 'monthly' && plan !== 'yearly') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // 2. Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Get org via staff membership
    const { data: staff } = await supabase
      .from('staff_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!staff) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // 4. Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, stripe_customer_id')
      .eq('org_id', staff.org_id)
      .single();

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription record found' }, { status: 400 });
    }

    // 5. Create or retrieve Stripe customer
    let stripeCustomerId = subscription.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { org_id: staff.org_id },
      });
      stripeCustomerId = customer.id;

      // Save customer ID (use admin client to bypass RLS)
      await supabaseAdmin
        .from('subscriptions')
        .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
        .eq('id', subscription.id);
    }

    // 6. Determine price ID
    const priceId = plan === 'monthly'
      ? process.env.STRIPE_PRICE_MONTHLY!
      : process.env.STRIPE_PRICE_YEARLY!;

    // 7. Create Checkout session
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?success=true`,
      cancel_url: `${origin}/billing?canceled=true`,
      subscription_data: {
        metadata: { org_id: staff.org_id },
      },
      metadata: { org_id: staff.org_id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Checkout error:', message, error);
    return NextResponse.json(
      { error: `Failed to create checkout session: ${message}` },
      { status: 500 }
    );
  }
}
