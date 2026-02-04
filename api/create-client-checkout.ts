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
        const { cart, restaurantId, tableId, tipAmount } = req.body;

        if (!cart || !restaurantId || cart.length === 0) {
            return res.status(400).json({ error: 'Missing cart or restaurantId' });
        }

        // 1. Get Restaurant Connect ID
        const { data: restaurant, error: fetchError } = await supabase
            .from('restaurants')
            .select('stripe_connect_id, name')
            .eq('id', restaurantId)
            .single();

        if (fetchError || !restaurant?.stripe_connect_id) {
            // If no connect ID, maybe allow cash payment? But for now, returning error
            return res.status(400).json({ error: 'Ce restaurant n\'accepte pas encore les paiements en ligne.' });
        }

        // 2. Calculate Totals & Fee
        const subtotal = cart.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

        // Ensure minimum amount (e.g. 0.50 EUR)
        if (subtotal < 0.50) {
            return res.status(400).json({ error: 'Le montant minimum est de 0.50€' });
        }

        // 1% Commission (in cents) on PRODUCTS ONLY (Tip is 100% for the restaurant)
        const amountInCents = Math.round(subtotal * 100);
        const applicationFee = Math.round(amountInCents * 0.01);

        // Prepare Line Items
        const line_items = cart.map((item: any) => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.name,
                    images: item.image_url ? [item.image_url] : [],
                    metadata: {
                        itemId: item.id // Crucial for webhook to link back to DB item
                    }
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        // Add Tip Line Item if present
        if (tipAmount && tipAmount > 0) {
            line_items.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Pourboire Équipe (Tip)',
                        description: 'Merci pour votre soutien ! 💖',
                        // images: ['https://your-cdn.com/tip-icon.png'] // Optional
                    },
                    unit_amount: Math.round(tipAmount * 100),
                },
                quantity: 1,
            });
        }

        // 3. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: line_items,
            payment_intent_data: {
                application_fee_amount: applicationFee,
                transfer_data: {
                    destination: restaurant.stripe_connect_id,
                },
            },
            metadata: {
                type: 'client_order',
                restaurantId: restaurantId,
                tableId: tableId || '',
                // Store cart summary or ID if too large. For now, basic JSON.
                // Warning: Metadata has 500 characters limit. 
                // Better to just store necessary info or rely on line_items if needed in webhook.
                // We'll rely on recreating items from the session line_items in webhook, 
                // OR we pass a very simplified cart structure if we need custom logic.
                // For simplicity in this demo, we'll try to reconstruct order in webhook from session data 
                // or just trust the 'cart' passed here is correct. 
                // ACTUALLY: The safest for a robust backend is to pass the cart items in metadata strictly for reference 
                // if they fit, but "line_items" in webhook is better.
                // Let's store a simplified JSON string if it fits, otherwise truncation might occur.
                // Ideally, we create the order as 'pending' in DB *before* checkout, and pass orderId here.
                // But the user prompt says: "Create officially the line in orders with status paid" IN THE WEBHOOK.
                // So we will pass the cart items map in metadata? No, strict limit.
                // We will rely on expanding line_items in the webhook to recreate the order.
            },
            success_url: `${process.env.VITE_APP_URL}/order-success?session_id={CHECKOUT_SESSION_ID}&restaurantId=${restaurantId}`,
            cancel_url: `${process.env.VITE_APP_URL}/m/${req.body.slug || 'menu'}?canceled=true`, // Need slug passed in body or derived
        });

        return res.status(200).json({ url: session.url });

    } catch (error: any) {
        console.error('Checkout Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
