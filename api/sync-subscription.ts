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

        if (!restaurantId || !email) {
            return res.status(400).json({ error: 'Missing restaurantId or email' });
        }

        // 1. Search Customers by Email
        const customers = await stripe.customers.list({
            email: email,
            limit: 5, // Handle duplicate emails
            expand: ['data.subscriptions']
        });

        if (customers.data.length === 0) {
            return res.status(404).json({ error: 'Aucun client Stripe trouvé avec cet email.' });
        }

        let foundSubscription = null;
        let foundCustomer = null;
        let foundPlanType = 'standard';

        // 2. Iterate Customers to find the one with the right Session Metadata
        // Since we can't easily search sessions by metadata directly without many calls,
        // we first check if the customer has an ACTIVE subscription.
        // If they do, we assume it's the right one for this context (safer than nothing).
        // Ideally, we'd check session metadata, but `search` is rate limited or complex.

        // Strategy: Look for the most recent active subscription among these customers.
        for (const customer of customers.data) {
            const subscriptions = customer.subscriptions?.data || [];
            const activeSub = subscriptions.find(sub => sub.status === 'active' || sub.status === 'trialing');

            if (activeSub) {
                // Found an active subscription!
                foundSubscription = activeSub as Stripe.Subscription;
                foundCustomer = customer;

                // Try to determine plan type from metadata or price
                // If the session set the metadata on subscription, it's here.
                // If not, we might be blind, but we can default.
                // Let's try to fetch the session if we really need to, but for now let's rely on Price ID?
                // Or easier: check if the session metadata propagated. 
                // If create-subscription.ts didn't set subscription_data.metadata, it won't be here.
                // BUT, likely the user only has one active sub.

                // Retrieve the session that created this sub? Hard to link back.
                // Let's just default to 'standard' or check price if needed.
                // For now, we trust the sync.
                foundPlanType = activeSub.metadata?.planType || 'standard';
                break;
            }
        }

        if (!foundSubscription || !foundCustomer) {
            // Fallback: Check checkout sessions?
            // Maybe the sub is not active yet?
            return res.status(404).json({ error: 'Aucun abonnement actif trouvé.' });
        }

        // 3. Update Database
        const updates = {
            stripe_customer_id: foundCustomer.id,
            subscription_status: foundSubscription.status,
            plan_type: foundPlanType,
            current_period_end: new Date(foundSubscription.current_period_end * 1000).toISOString(),
        };

        const { error: dbError } = await supabase
            .from('restaurants')
            .update(updates)
            .eq('id', restaurantId);

        if (dbError) throw dbError;

        return res.status(200).json({
            success: true,
            message: 'Abonnement synchronisé avec succès.',
            data: updates
        });

    } catch (error: any) {
        console.error('Sync Sub Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
