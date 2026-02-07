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

        // 0. Rate Limiting Check (Simple version using identifier = IP + tableId)
        const forwarded = req.headers['x-forwarded-for'];
        const ip = typeof forwarded === 'string' ? forwarded.split(/, /)[0] : req.socket.remoteAddress;
        const identifier = `${ip}-${tableId || 'no-table'}`;

        // Count attempts in the last minute
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
        const { count, error: countError } = await supabase
            .from('checkout_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('identifier', identifier)
            .gte('created_at', oneMinuteAgo);

        if (countError) {
            console.error('Rate limit check error:', countError);
        } else if (count && count >= 5) {
            return res.status(429).json({ error: 'Trop de tentatives de paiement. Veuillez patienter une minute.' });
        }

        // Log this attempt
        await supabase.from('checkout_attempts').insert([{ identifier }]);

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

        // 2. Fetch Item Prices from Supabase to prevent frontend manipulation
        const itemIds = cart.map((i: any) => i.id);
        const { data: dbItems, error: itemsError } = await supabase
            .from('items')
            .select('id, name, price, image_url')
            .in('id', itemIds);

        if (itemsError || !dbItems || dbItems.length === 0) {
            return res.status(400).json({ error: 'Certains articles n\'existent plus.' });
        }

        // Create a map for quick lookup
        const itemMap = new Map(dbItems.map(item => [item.id, item]));

        // Calculate Totals & Fee using DB prices
        let subtotal = 0;
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

        for (const cartItem of cart) {
            const dbItem = itemMap.get(cartItem.id);
            if (!dbItem) continue; // Or throw error if you prefer strict validation

            const unitAmount = Math.round(dbItem.price * 100);
            subtotal += (dbItem.price * cartItem.quantity);

            line_items.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: dbItem.name,
                        images: dbItem.image_url ? [dbItem.image_url] : [],
                        metadata: {
                            itemId: dbItem.id // Crucial for webhook
                        }
                    },
                    unit_amount: unitAmount,
                },
                quantity: cartItem.quantity,
            });
        }

        // Ensure minimum amount (e.g. 0.50 EUR)
        if (subtotal < 0.50) {
            return res.status(400).json({ error: 'Le montant minimum est de 0.50€' });
        }

        // 1% Commission (in cents) on PRODUCTS ONLY (Tip is 100% for the restaurant)
        const amountInCents = Math.round(subtotal * 100);
        const applicationFee = Math.round(amountInCents * 0.01);

        // Add Tip Line Item if present (tipAmount comes from frontend as it's user-defined)
        if (tipAmount && tipAmount > 0) {
            line_items.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Pourboire Équipe (Tip)',
                        description: 'Merci pour votre soutien ! 💖',
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
            invoice_creation: {
                enabled: true,
            },
            customer_email: req.body.customerEmail || undefined,
            success_url: `${process.env.VITE_APP_URL}/order-success?session_id={CHECKOUT_SESSION_ID}&restaurantId=${restaurantId}`,
            cancel_url: `${process.env.VITE_APP_URL}/m/${req.body.slug || 'menu'}?canceled=true`, // Need slug passed in body or derived
        });

        return res.status(200).json({ url: session.url });

    } catch (error: any) {
        console.error('Checkout Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
