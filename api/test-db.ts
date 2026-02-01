import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        console.log('Test DB Handler Invoked');

        // 1. Get any restaurant
        const { data: restaurant, error: resError } = await supabase
            .from('restaurants')
            .select('id')
            .limit(1)
            .single();

        if (resError || !restaurant) {
            return res.status(500).json({ error: 'No restaurant found', details: resError });
        }

        console.log('Found Restaurant:', restaurant.id);

        // 2. Try to insert a dummy order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                restaurant_id: restaurant.id,
                total_amount: 0.50,
                status: 'paid',
                // table_id is intentionally omitted/null to test constraints
            })
            .select()
            .single();

        if (orderError) {
            console.error('Insert Failed:', orderError);
            return res.status(500).json({ error: 'Insert Failed', details: orderError });
        }

        console.log('Insert Success:', order);

        // 3. Clean up (delete the test order)
        await supabase.from('orders').delete().eq('id', order.id);

        return res.status(200).json({ success: true, message: 'DB Connection & Insert OK', orderId: order.id });

    } catch (error: any) {
        console.error('Test Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
