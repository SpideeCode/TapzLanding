import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = new Stripe(key, {
    typescript: true,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { priceId, restaurantId, email, successUrl, cancelUrl, planType } = req.body;

        // Check if Stripe is configured
        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
            return res.status(500).json({ error: 'Server Config Error: STRIPE_SECRET_KEY missing.' });
        }

        if (!priceId || !restaurantId) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer_email: email,
            metadata: {
                restaurantId,
                type: 'subscription_upgrade',
                planType: planType || 'standard', // Default to standard if missing
            },
            success_url: successUrl || `${process.env.VITE_APP_URL}/admin/settings?success=true`,
            cancel_url: cancelUrl || `${process.env.VITE_APP_URL}/admin/settings?canceled=true`,
        });

        return res.status(200).json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
