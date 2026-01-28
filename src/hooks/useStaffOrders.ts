import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface OrderItem {
    id: string;
    quantity: number;
    unit_price: number;
    items: {
        name: string;
    };
}

export interface OrderWithDetails {
    id: string;
    status: 'pending' | 'preparing' | 'served' | 'paid';
    total_price: number;
    created_at: string;
    table_id: string | null;
    tables: {
        table_number: string;
    } | null;
    order_items: OrderItem[];
}

export const useStaffOrders = (restaurantId: string) => {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        if (!restaurantId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    tables (table_number),
                    order_items (
                        id,
                        quantity,
                        unit_price,
                        items (name)
                    )
                `)
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching staff orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!restaurantId) {
            console.log('[Realtime] Waiting for restaurantId...');
            return;
        }

        fetchOrders();

        // 1. POLLING FALLBACK (Every 30 seconds)
        // This ensures that even if websockets fail, data is refreshed regularly in the background
        console.log(`[Polling] Setting up 30s fallback for: ${restaurantId}`);
        const pollingInterval = setInterval(() => {
            console.log('[Polling] Background refresh...');
            fetchOrders();
        }, 30000);

        // 2. AUDIO NOTIFICATION SETUP
        const playNotification = () => {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play failed (waiting for interaction):', e));
        };

        // 3. REALTIME SUBSCRIPTION
        console.log(`[Realtime] Initializing subscription for: ${restaurantId}`);

        const channel = supabase
            .channel(`staff-orders-${restaurantId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                (payload) => {
                    console.log('[Realtime] NEW ORDER DETECTED!', payload);
                    playNotification();
                    fetchOrders();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                (payload) => {
                    console.log('[Realtime] Order Updated:', payload);
                    fetchOrders();
                }
            )
            .subscribe((status) => {
                console.log(`[Realtime] Main Channel Status:`, status);
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Successfully connected to live stream');
                }
            });

        // Watch for items (for complex updates)
        const itemsChannel = supabase
            .channel(`staff-items-${restaurantId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'order_items'
                },
                () => {
                    console.log('[Realtime] Items added to an order, refreshing...');
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            console.log(`[Cleanup] Stopping polling and subscriptions for: ${restaurantId}`);
            clearInterval(pollingInterval);
            supabase.removeChannel(channel);
            supabase.removeChannel(itemsChannel);
        };
    }, [restaurantId]);

    const updateOrderStatus = async (orderId: string, status: OrderWithDetails['status']) => {
        // Optimistic update
        const previousOrders = [...orders];
        setOrders(current =>
            current.map(o => o.id === orderId ? { ...o, status } : o)
        );

        try {
            const { error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', orderId);

            if (error) throw error;

            // Re-fetch to confirm exactly what's in DB
            await fetchOrders();
        } catch (error) {
            // Revert on error
            setOrders(previousOrders);
            console.error('Error updating order status:', error);
            throw error;
        }
    };

    return { orders, loading, updateOrderStatus, refresh: fetchOrders };
};
