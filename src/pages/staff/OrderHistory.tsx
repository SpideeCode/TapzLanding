import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    CheckCircle2,
    XCircle,
    Search,
    Clock
} from 'lucide-react';

interface OrderHistoryItem {
    id: string;
    created_at: string;
    total_price: number;
    status: 'paid' | 'completed' | 'cancelled';
    tables: {
        table_number: string;
    } | null;
    order_items: {
        quantity: number;
        items: {
            name: string;
        };
    }[];
}

export const OrderHistory: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const resolveRestaurant = async () => {
            try {
                if (slug) {
                    const { data: restaurant } = await supabase
                        .from('restaurants')
                        .select('id')
                        .eq('slug', slug)
                        .single();
                    if (restaurant) setRestaurantId(restaurant.id);
                } else {
                    // Admin context
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single();
                        if (profile?.restaurant_id) setRestaurantId(profile.restaurant_id);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        resolveRestaurant();
    }, [slug]);

    useEffect(() => {
        if (!restaurantId) return;

        const fetchHistory = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    created_at,
                    total_price,
                    status,
                    tables (table_number),
                    order_items (
                        quantity,
                        items (name)
                    )
                `)
                .eq('restaurant_id', restaurantId)
                .in('status', ['completed', 'cancelled']) // Only finished orders
                .order('created_at', { ascending: false })
                .limit(50); // Pagination could be added later

            if (!error && data) {
                setOrders(data as any);
            }
            setLoading(false);
        };

        fetchHistory();
    }, [restaurantId]);

    const filteredOrders = orders.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.tables?.table_number.includes(searchTerm)
    );

    if (loading) {
        return <div className="p-10 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
                        Historique <span className="text-blue-600">Commandes</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">
                        Consultez les commandes terminées et archivées.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                    <Search className="text-slate-400 ml-2" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher (N° Commande, Table...)"
                        className="bg-transparent outline-none text-sm font-bold text-slate-700 w-full md:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-4 py-4 md:px-8 md:py-6 text-xs font-black uppercase tracking-widest text-slate-400">Date</th>
                                <th className="px-4 py-4 md:px-8 md:py-6 text-xs font-black uppercase tracking-widest text-slate-400">Commande</th>
                                <th className="px-4 py-4 md:px-8 md:py-6 text-xs font-black uppercase tracking-widest text-slate-400">Table</th>
                                <th className="px-4 py-4 md:px-8 md:py-6 text-xs font-black uppercase tracking-widest text-slate-400">Détails</th>
                                <th className="px-4 py-4 md:px-8 md:py-6 text-xs font-black uppercase tracking-widest text-slate-400">Montant</th>
                                <th className="px-4 py-4 md:px-8 md:py-6 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                                        Aucune commande trouvée dans l'historique.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-4 py-4 md:px-8 md:py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm">
                                                    {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {format(new Date(order.created_at), 'HH:mm')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 md:px-8 md:py-6">
                                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                                                #{order.id.slice(0, 8)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 md:px-8 md:py-6">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-700 border-2 border-slate-50">
                                                {order.tables?.table_number || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 md:px-8 md:py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold text-slate-900">
                                                    {order.order_items.reduce((acc, item) => acc + item.quantity, 0)} articles
                                                </span>
                                                <span className="text-xs text-slate-400 truncate max-w-[200px]">
                                                    {order.order_items.map(i => i.items.name).join(', ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 md:px-8 md:py-6">
                                            <span className="font-black text-slate-900">
                                                {order.total_price.toFixed(2)} €
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 md:px-8 md:py-6 text-right">
                                            <div className="flex justify-end">
                                                {order.status === 'completed' ? (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                                                        <CheckCircle2 size={14} />
                                                        Terminé
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest border border-rose-200">
                                                        <XCircle size={14} />
                                                        Annulé
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Pagination (Visual only for now) */}
                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>Affichage des 50 dernières commandes</span>
                    {/* Add pagination controls here if needed */}
                </div>
            </div>
        </div>
    );
};
