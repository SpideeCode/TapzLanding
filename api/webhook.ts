import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from './stripe-config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Disable body parsing for webhook signature verification
export const config = {
    api: {
        bodyParser: false,
    },
};

const getRawBody = async (req: VercelRequest): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    let rawBody;

    try {
        rawBody = await getRawBody(req);
        event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret!);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle Events
    try {
        switch (event.type) {
            // --- 1. SaaS Subscription Events ---
            case 'checkout.session.completed': {
                const session = event.data.object as any;
                if (session.metadata?.type === 'subscription_upgrade') {
                    await supabase
                        .from('restaurants')
                        .update({
                            subscription_status: 'active',
                            stripe_customer_id: session.customer,
                            // Determine plan based on price ID logic if needed, or metadata
                            plan_type: 'premium' // simplified for now, ideally derived from price
                        })
                        .eq('id', session.metadata.restaurantId);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any;
                // Find restaurant by stripe_customer_id
                await supabase
                    .from('restaurants')
                    .update({
                        subscription_status: 'canceled',
                        plan_type: 'free'
                    })
                    .eq('stripe_customer_id', subscription.customer);
                break;
            }

            // --- 2. Connect Account Events ---
            case 'account.updated': {
                const account = event.data.object as any;
                if (account.charges_enabled && account.details_submitted) {
                    // Find restaurant by connect ID
                    await supabase
                        .from('restaurants')
                        .update({ payments_enabled: true })
                        .eq('stripe_connect_id', account.id);
                }
                break;
            }

            // --- 3. Diner Payment Events ---
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as any;
                if (paymentIntent.metadata?.orderId) {
                    await supabase
                        .from('orders')
                        .update({ status: 'paid' })
                        .eq('id', paymentIntent.metadata.orderId);
                }
                break;
            }
        }
    } catch (err) {
        console.error('Error handling event:', err);
        // Don't fail the webhook response, just log
    }

    res.json({ received: true });
}
