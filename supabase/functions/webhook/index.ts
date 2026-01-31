import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

        if (!stripeKey || !webhookSecret) {
            throw new Error('Missing Stripe configuration');
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        const signature = req.headers.get('stripe-signature');
        if (!signature) {
            throw new Error('No signature header');
        }

        const body = await req.text();
        let event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        switch (event.type) {
            // --- 1. SaaS Subscription Events ---
            case 'checkout.session.completed': {
                const session = event.data.object;
                if (session.metadata?.type === 'subscription_upgrade') {
                    // Fetch subscription to get current_period_end
                    const subscriptionId = session.subscription;
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                    await supabase
                        .from('restaurants')
                        .update({
                            subscription_status: 'active',
                            stripe_customer_id: session.customer,
                            plan_type: session.metadata.planType || 'standard',
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
                        })
                        .eq('id', session.metadata.restaurantId);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const priceId = subscription.items.data[0].price.id;
                // Determine plan type from price ID (simplified logic or fetch from metadata)
                // ideally metadata is on subscription too if passed during creation

                await supabase
                    .from('restaurants')
                    .update({
                        subscription_status: subscription.status,
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        // Update plan_type if changed? Assuming planType is in metadata or we can infer
                    })
                    .eq('stripe_customer_id', subscription.customer);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await supabase
                    .from('restaurants')
                    .update({
                        subscription_status: 'canceled',
                        plan_type: 'free',
                        current_period_end: null
                    })
                    .eq('stripe_customer_id', subscription.customer);
                break;
            }

            // --- 2. Connect Account Events ---
            case 'account.updated': {
                const account = event.data.object;
                if (account.charges_enabled && account.details_submitted) {
                    await supabase
                        .from('restaurants')
                        .update({ payments_enabled: true })
                        .eq('stripe_connect_id', account.id);
                }
                break;
            }

            // --- 3. Diner Payment Events ---
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                if (paymentIntent.metadata?.orderId) {
                    await supabase
                        .from('orders')
                        .update({
                            status: 'paid',
                            application_fee_amount: paymentIntent.application_fee_amount || 0
                        })
                        .eq('id', paymentIntent.metadata.orderId);
                }
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Webhook Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
