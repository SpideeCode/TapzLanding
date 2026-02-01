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
        const { restaurantId, email } = req.body;

        if (!restaurantId) {
            return res.status(400).json({ error: 'Missing restaurantId' });
        }

        // 1. Check if restaurant already has a Connect ID
        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('stripe_connect_id')
            .eq('id', restaurantId)
            .single();

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
            await supabase
                .from('restaurants')
                .update({ stripe_connect_id: accountId })
                .eq('id', restaurantId);
        }

        // 4. Create Account Link
        // 4. Check status and generate appropriate link
        const accountInfo = await stripe.accounts.retrieve(accountId);

        let url;
        if (accountInfo.details_submitted) {
            const loginLink = await stripe.accounts.createLoginLink(accountId);
            url = loginLink.url;
        } else {
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: `${process.env.VITE_APP_URL}/admin/settings?connect=refresh`,
                return_url: `${process.env.VITE_APP_URL}/admin/settings?connect=success`,
                type: 'account_onboarding',
            });
            url = accountLink.url;
        }

        return res.status(200).json({ url: url });
    } catch (error: any) {
        console.error('Connect Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
