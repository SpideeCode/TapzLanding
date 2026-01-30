import { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from './stripe-config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, restaurantId, orderId } = req.body;

        if (!amount || !restaurantId) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        // 1. Get Restaurant Connect ID
        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('stripe_connect_id, payments_enabled')
            .eq('id', restaurantId)
            .single();

        if (!restaurant?.stripe_connect_id || !restaurant.payments_enabled) {
            return res.status(400).json({ error: 'Restaurant not ready for payments' });
        }

        // 2. Calculate Fee (1%)
        // Stripe amounts are in cents
        const fee = Math.round(amount * 0.01);

        // 3. Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // ensure integer
            currency: 'eur',
            expanded_payment_methods: ['card'],
            transfer_data: {
                destination: restaurant.stripe_connect_id, // Send funds to restaurant
            },
            application_fee_amount: fee, // Platform takes 1%
            metadata: {
                restaurantId,
                orderId
            }
        });

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret
        });

    } catch (error: any) {
        console.error('Payment Info Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
