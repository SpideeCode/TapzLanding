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
        if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { amount, restaurantId, orderId } = await req.json();

        if (!amount || !restaurantId) {
            throw new Error('Missing parameters');
        }

        // 1. Get Restaurant Connect ID
        const { data: restaurant, error: fetchError } = await supabase
            .from('restaurants')
            .select('stripe_connect_id, payments_enabled')
            .eq('id', restaurantId)
            .single();

        if (fetchError) throw fetchError;

        if (!restaurant?.stripe_connect_id || !restaurant.payments_enabled) {
            throw new Error('Restaurant not ready for payments');
        }

        // 2. Calculate Fee (1%)
        const fee = Math.round(amount * 0.01);

        // 3. Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount),
            currency: 'eur',
            expanded_payment_methods: ['card'],
            transfer_data: {
                destination: restaurant.stripe_connect_id,
            },
            application_fee_amount: fee,
            metadata: {
                restaurantId,
                orderId
            }
        });

        return new Response(
            JSON.stringify({ clientSecret: paymentIntent.client_secret }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error('Payment Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
