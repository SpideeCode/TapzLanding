import { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from './stripe-config';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { priceId, restaurantId, email, successUrl, cancelUrl } = req.body;

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
                type: 'subscription_upgrade'
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
