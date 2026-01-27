import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ClipboardList, TrendingUp, AlertCircle, ShoppingBag } from 'lucide-react';

interface Stats {
    tables: number;
    categories: number;
    items: number;
    orders: number;
}

export const AdminDashboardOverview: React.FC = () => {
    const [stats, setStats] = useState<Stats>({ tables: 0, categories: 0, items: 0, orders: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    return;
                }

                const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single();
                if (!profile?.restaurant_id) {
                    setLoading(false);
                    return;
                }

                const resId = profile.restaurant_id;

                const [tables, categories, items, orders] = await Promise.all([
                    supabase.from('tables').select('id', { count: 'exact', head: true }).eq('restaurant_id', resId),
                    supabase.from('menus_categories').select('id', { count: 'exact', head: true }).eq('restaurant_id', resId),
                    supabase.from('items').select('id', { count: 'exact', head: true }).eq('restaurant_id', resId),
                    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('restaurant_id', resId)
                ]);

                setStats({
                    tables: tables.count || 0,
                    categories: categories.count || 0,
                    items: items.count || 0,
                    orders: orders.count || 0
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: 'Commandes', value: stats.orders, icon: ShoppingBag, color: 'bg-orange-500' },
        { label: 'Plats', value: stats.items, icon: TrendingUp, color: 'bg-blue-500' },
        { label: 'Tables', value: stats.tables, icon: ClipboardList, color: 'bg-green-500' },
        { label: 'Catégories', value: stats.categories, icon: AlertCircle, color: 'bg-purple-500' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Bonjour !</h1>
                <p className="text-gray-600 font-medium text-lg">Voici un aperçu de l'activité de votre restaurant.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color} opacity-5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform`} />
                        <div className="relative z-10">
                            <div className={`${stat.color} text-white p-3 rounded-2xl w-fit mb-4 shadow-lg`}>
                                <stat.icon size={24} />
                            </div>
                            <p className="text-gray-500 font-bold text-sm uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-4xl font-black text-gray-900 mt-1">
                                {loading ? '...' : stat.value}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-orange-600" />
                        Commandes Récentes
                    </h3>
                    <div className="space-y-4">
                        <div className="py-12 text-center text-gray-400 font-medium italic bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                            Aucune commande pour le moment.
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-600 to-orange-500 p-8 rounded-3xl text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 -mr-32 -mt-32 rounded-full" />
                    <h3 className="text-2xl font-black mb-4 relative z-10">Votre Menu est prêt ?</h3>
                    <p className="text-orange-100 font-medium mb-8 text-lg relative z-10">Vérifiez que vos plats sont bien à jour avant le service de ce soir.</p>
                    <button className="bg-white text-orange-600 font-black px-6 py-3 rounded-2xl shadow-lg hover:bg-orange-50 transition-all active:scale-95 relative z-10">
                        Gérer le Menu
                    </button>
                </div>
            </div>
        </div>
    );
};
