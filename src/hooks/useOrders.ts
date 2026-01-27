import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Order {
    id: string;
    restaurant_id: string;
    table_id: string | null;
    status: 'pending' | 'preparing' | 'served' | 'paid';
    total_price: number;
    created_at: string;
}

export const useOrders = (restaurantId: string) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) return;

        // 1. Initial fetch of orders
        const fetchOrders = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false });

            if (error) console.error('Error fetching orders:', error);
            else setOrders(data || []);
            setLoading(false);
        };

        fetchOrders();

        // 2. Realtime subscription
        const subscription = supabase
            .channel(`orders-channel-${restaurantId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                (payload) => {
                    console.log('Change received!', payload);

                    if (payload.eventType === 'INSERT') {
                        setOrders((current) => [payload.new as Order, ...current]);
                    } else if (payload.eventType === 'UPDATE') {
                        setOrders((current) =>
                            current.map((order) =>
                                order.id === payload.new.id ? (payload.new as Order) : order
                            )
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setOrders((current) =>
                            current.filter((order) => order.id === payload.old.id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [restaurantId]);

    return { orders, loading };
};
