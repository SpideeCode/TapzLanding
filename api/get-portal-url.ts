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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { restaurantId, returnUrl } = req.body;

        if (!restaurantId) {
            return res.status(400).json({ error: 'Missing restaurantId' });
        }

        // 1. Get Customer ID from DB
        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('stripe_customer_id')
            .eq('id', restaurantId)
            .single();

        if (!restaurant?.stripe_customer_id) {
            return res.status(404).json({ error: 'No subscription found for this restaurant' });
        }

        // 2. Create Portal Session
        const session = await stripe.billingPortal.sessions.create({
            customer: restaurant.stripe_customer_id,
            return_url: returnUrl || `${process.env.VITE_APP_URL}/admin/settings`,
        });

        return res.status(200).json({ url: session.url });
    } catch (error: any) {
        console.error('Portal Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
