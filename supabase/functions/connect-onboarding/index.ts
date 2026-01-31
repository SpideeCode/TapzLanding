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
        const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173'; // Default to local for dev

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { restaurantId, email, returnUrl } = await req.json();

        if (!restaurantId) {
            throw new Error('Missing restaurantId');
        }

        // 1. Check if restaurant already has a Connect ID
        const { data: restaurant, error: fetchError } = await supabase
            .from('restaurants')
            .select('stripe_connect_id')
            .eq('id', restaurantId)
            .single();

        if (fetchError) throw fetchError;

        let accountId = restaurant?.stripe_connect_id;

        if (!accountId) {
            // 2. Create Express Account
            const account = await stripe.accounts.create({
                type: 'express',
                email: email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                metadata: {
                    restaurantId
                }
            });
            accountId = account.id;

            // 3. Save to DB
            const { error: updateError } = await supabase
                .from('restaurants')
                .update({ stripe_connect_id: accountId })
                .eq('id', restaurantId);

            if (updateError) throw updateError;
        }

        // 4. Create Account Link
        const redirectBase = returnUrl || appUrl;
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${redirectBase}/admin/settings?connect=refresh`,
            return_url: `${redirectBase}/admin/settings?connect=success`,
            type: 'account_onboarding',
        });

        return new Response(
            JSON.stringify({ url: accountLink.url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error('Connect Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    }
});
