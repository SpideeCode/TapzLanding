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

                // --- Scenario A: Subscription Upgrade (Restaurant Owner) ---
                if (session.metadata?.type === 'subscription_upgrade') {
                    console.log('Updating restaurant subscription for ID:', session.metadata.restaurantId);

                    const updateResult = await supabase
                        .from('restaurants')
                        .update({
                            subscription_status: 'active',
                            stripe_customer_id: session.customer,
                            plan_type: session.metadata.planType || 'standard'
                        })
                        .eq('id', session.metadata.restaurantId)
                        .select();

                    if (updateResult.error) {
                        console.error('Supabase Update Failed:', updateResult.error);
                    }

                    // --- Scenario B: Client Order (Diner) ---
                } else if (session.metadata?.type === 'client_order') {
                    console.log('Processing Client Order for Restaurant:', session.metadata.restaurantId);

                    try {
                        // 1. Retrieve full session to get Line Items AND Product details (for metadata)
                        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
                            expand: ['line_items', 'line_items.data.price.product']
                        });

                        // 2. Create Order in DB
                        const { data: order, error: orderError } = await supabase
                            .from('orders')
                            .insert({
                                restaurant_id: session.metadata.restaurantId,
                                table_id: session.metadata.tableId || null,
                                total_price: session.amount_total ? session.amount_total / 100 : 0,
                                status: 'paid', // Directly paid
                                application_fee_amount: Math.round((session.amount_total || 0) * 0.01) / 100, // Approximate 1% for stats
                            })
                            .select()
                            .single();

                        if (orderError) {
                            console.error('Failed to insert order:', orderError);
                            throw orderError;
                        }

                        // 3. Create Order Items
                        const lineItems = fullSession.line_items?.data || [];
                        console.log(`Found ${lineItems.length} line items to process.`);

                        if (lineItems.length > 0 && order) {
                            const orderItemsToInsert = lineItems.map((li: any) => {
                                // Handle product expansion
                                const product = li.price.product;
                                const productIdFromMeta = (typeof product === 'object') ? product.metadata?.itemId : null;

                                return {
                                    order_id: order.id,
                                    item_id: productIdFromMeta,
                                    quantity: li.quantity,
                                    unit_price: li.price.unit_amount / 100
                                };
                            }).filter((i: any) => i.item_id); // Only insert if we linked the item successfully

                            if (orderItemsToInsert.length > 0) {
                                const { error: itemsError } = await supabase
                                    .from('order_items')
                                    .insert(orderItemsToInsert);

                                if (itemsError) console.error('Error inserting items:', itemsError);
                            } else {
                                console.warn('No items could be linked to DB IDs. Order created without items.');
                            }
                        }

                    } catch (err: any) {
                        console.error('Failed to create order from webhook:', err);
                    }

                } else {
                    console.log('Ignored: Metadata type unhandled:', session.metadata?.type);
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
