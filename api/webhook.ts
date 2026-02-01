import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const key = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = new Stripe(key, { typescript: true });

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
    console.log('Webhook Handler Invoked. Method:', req.method);
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    let rawBody;

    try {
        console.log('Verifying signature...');
        rawBody = await getRawBody(req);
        event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret!);
        console.log('Event constructed successfully:', event.type);
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
                console.log('Processing checkout.session.completed. Metadata:', session.metadata);

                if (session.metadata?.type === 'subscription_upgrade') {
                    console.log('Updating restaurant subscription for ID:', session.metadata.restaurantId);

                    const updateResult = await supabase
                        .from('restaurants')
                        .update({
                            subscription_status: 'active',
                            stripe_customer_id: session.customer,
                            // Derived from metadata passed in create-subscription.ts
                            plan_type: session.metadata.planType || 'standard'
                        })
                        .eq('id', session.metadata.restaurantId)
                        .select();

                    console.log('Supabase Update Result:', JSON.stringify(updateResult, null, 2));

                    if (updateResult.error) {
                        console.error('Supabase Update Failed:', updateResult.error);
                    }
                } else {
                    console.log('Ignored: Metadata type is not subscription_upgrade:', session.metadata?.type);
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
