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
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. MRR Calculation (From Supabase for speed/consistency with our internal plans)
        // We could verify against Stripe Subscriptions, but internal DB is often faster for aggregated views if synced.
        // Assuming we sync status locally.
        const { data: restaurants, error: dbError } = await supabase
            .from('restaurants')
            .select('plan_type, subscription_status');

        if (dbError) throw dbError;

        let mrr = 0;
        let activeSubs = 0;

        restaurants?.forEach(r => {
            if (r.subscription_status === 'active' || r.subscription_status === 'trialing') {
                activeSubs++;
                // Prices based on current pricing strategy
                if (r.plan_type === 'grande_reserve') mrr += 149; // Grande Réserve
                else if (r.plan_type === 'business_lounge') mrr += 89; // Business Lounge
                else mrr += 49; // Bistro Pro (Default)
            }
        });

        // 2. Stripe Balance & Volume (Real-time from Stripe)
        // Note: 'balance.retrieve()' shows available funds, not total volume. 
        // For Total Volume (TTV), we should look at BalanceTransactions or Charges.
        // Listing all charges is heavy. For a dashboard, we might want to cache this or use a reporting endpoint.
        // For MVP, we'll fetch successfull charges from the last 30 days.

        const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);

        // We can't easily iterate ALL charges for TTV if there are thousands.
        // Ideally we keep a running total in DB. 
        // BUT, for this task, let's try to get a reasonable estimate or iterate current page.
        // Alternatives: Use Stripe Reports API (async) or Balance Transactions.
        // Let's use Balance Transactions for "Net" platform earnings (Commission).

        // Let's get the Balance for "Cash in hand"
        const balance = await stripe.balance.retrieve();
        const available = balance.available.reduce((acc, curr) => acc + curr.amount, 0) / 100;
        const pending = balance.pending.reduce((acc, curr) => acc + curr.amount, 0) / 100;

        // For TTV and Commission History (Line Chart)
        // We'll stick to our internal DB 'orders' table for TTV as traversing Stripe API for *all* connected account transactions is complex (Connect).
        // Standard Stripe API keys mainly see platform direct charges or application fees.
        // Application Fees list gives us our commission.

        // Fetch recent Application Fees (Our Revenue)
        const fees = await stripe.applicationFees.list({
            limit: 100, // Last 100 fees
            created: { gte: thirtyDaysAgo }
        });

        const revenueMap: Record<string, number> = {};
        let totalCommission30d = 0;

        fees.data.forEach(fee => {
            const date = new Date(fee.created * 1000).toISOString().split('T')[0]; // YYYY-MM-DD
            const amount = fee.amount / 100; // Cents to Euro
            revenueMap[date] = (revenueMap[date] || 0) + amount;
            totalCommission30d += amount;
        });

        // TTV: We will query our DB 'orders' for the total volume as it is the most reliable source for "Volume d'affaires" across all restaurants
        const { data: orders } = await supabase
            .from('orders')
            .select('total_price, created_at')
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        let ttv30d = 0;
        orders?.forEach(o => {
            ttv30d += Number(o.total_price);
        });

        // Prepare Chart Data (Last 30 Days)
        const chartData = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLabel = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
            chartData.push({
                date: dayLabel,
                commission: revenueMap[dateStr] || 0
            });
        }

        return res.status(200).json({
            mrr,
            activeSubs,
            ttv30d,
            totalCommission30d,
            stripeBalance: available + pending,
            chartData
        });

    } catch (error: any) {
        console.error('Financial API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
