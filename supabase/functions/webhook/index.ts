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
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseServiceKey) {
            console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!');
            throw new Error('Server Configuration Error: Missing Service Role Key');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        console.log(`Received event: ${event.type}`);

        switch (event.type) {
            // --- 1. SaaS Subscription Events ---
            case 'checkout.session.completed': {
                const session = event.data.object;
                console.log('Session Metadata:', session.metadata);

                if (session.metadata?.type === 'subscription_upgrade') {
                    console.log(`Processing subscription upgrade for Restaurant: ${session.metadata.restaurantId}`);
                    // Fetch subscription to get current_period_end
                    const subscriptionId = session.subscription;
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                    const { error } = await supabase
                        .from('restaurants')
                        .update({
                            subscription_status: 'active',
                            stripe_customer_id: session.customer,
                            plan_type: session.metadata.planType || 'standard',
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
                        })
                        .eq('id', session.metadata.restaurantId);

                    if (error) console.error('Supabase Update Error:', error);
                    else console.log('Successfully updated restaurant subscription.');
                } else {
                    console.log('Skipping: Metadata type is not subscription_upgrade');
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                console.log(`Subscription Updated for Customer: ${subscription.customer}, Status: ${subscription.status}`);

                const { error } = await supabase
                    .from('restaurants')
                    .update({
                        subscription_status: subscription.status,
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        // Update plan_type if changed? Assuming planType is in metadata or we can infer
                    })
                    .eq('stripe_customer_id', subscription.customer);

                if (error) console.error('Supabase Update Error:', error);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                console.log(`Subscription Deleted for Customer: ${subscription.customer}`);
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
                console.log(`Account Updated: ${account.id}, Charges: ${account.charges_enabled}, Details: ${account.details_submitted}`);

                if (account.charges_enabled && account.details_submitted) {
                    const { error } = await supabase
                        .from('restaurants')
                        .update({ payments_enabled: true })
                        .eq('stripe_connect_id', account.id);

                    if (error) console.error('Supabase Update Error:', error);
                    else console.log('Successfully enabled payments for restaurant.');
                }
                break;
            }

            // --- 3. Diner Payment Events ---
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                if (paymentIntent.metadata?.orderId) {
                    console.log(`Payment Succeeded for Order: ${paymentIntent.metadata.orderId}`);
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
