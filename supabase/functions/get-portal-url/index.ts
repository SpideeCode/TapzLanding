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
        const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173';

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { restaurantId, returnUrl } = await req.json();

        if (!restaurantId) {
            throw new Error('Missing restaurantId');
        }

        // 1. Get Customer ID from DB
        const { data: restaurant, error: fetchError } = await supabase
            .from('restaurants')
            .select('stripe_customer_id')
            .eq('id', restaurantId)
            .single();

        if (fetchError) throw fetchError;

        if (!restaurant?.stripe_customer_id) {
            throw new Error('No subscription found for this restaurant');
        }

        // 2. Create Portal Session
        const session = await stripe.billingPortal.sessions.create({
            customer: restaurant.stripe_customer_id,
            return_url: returnUrl || `${appUrl}/admin/settings`,
        });

        return new Response(
            JSON.stringify({ url: session.url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error('Portal Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
