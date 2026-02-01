import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const key = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = new Stripe(key, { typescript: true });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Allow CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { restaurantId } = req.body;

        if (!restaurantId) {
            return res.status(400).json({ error: 'Missing restaurantId' });
        }

        // 1. Get Connect ID
        const { data: restaurant, error: fetchError } = await supabase
            .from('restaurants')
            .select('stripe_connect_id')
            .eq('id', restaurantId)
            .single();

        if (fetchError || !restaurant?.stripe_connect_id) {
            return res.status(404).json({ error: 'Restaurant or Stripe ID not found' });
        }

        // 2. Query Stripe
        const account = await stripe.accounts.retrieve(restaurant.stripe_connect_id);

        // 3. Determine Status
        const isReady = account.charges_enabled && account.details_submitted;

        // 4. Update Database
        if (isReady) {
            await supabase
                .from('restaurants')
                .update({ payments_enabled: true })
                .eq('id', restaurantId);
        }

        return res.status(200).json({
            success: true,
            isReady,
            accountId: account.id,
            details: {
                charges_enabled: account.charges_enabled,
                details_submitted: account.details_submitted
            }
        });

    } catch (error: any) {
        console.error('Check Status Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
