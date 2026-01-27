import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Store, Users, ClipboardList, TrendingUp } from 'lucide-react';

export const DashboardOverview: React.FC = () => {
    const [stats, setStats] = useState({
        restaurants: 0,
        staff: 0,
        orders: 0,
        revenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);

                const { count: resCount } = await supabase.from('restaurants').select('*', { count: 'exact', head: true });
                const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
                const { count: orderCount, data: orders } = await supabase.from('orders').select('total_price');

                const revenue = orders?.reduce((acc, order) => acc + Number(order.total_price), 0) || 0;

                setStats({
                    restaurants: resCount || 0,
                    staff: userCount || 0,
                    orders: orderCount || 0,
                    revenue
                });
            } catch (error) {
                console.error('Error fetching superadmin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        { name: 'Restaurants', value: stats.restaurants, icon: Store, color: 'bg-blue-600' },
        { name: 'Utilisateurs', value: stats.staff, icon: Users, color: 'bg-emerald-600' },
        { name: 'Commandes totales', value: stats.orders, icon: ClipboardList, color: 'bg-indigo-600' },
        { name: 'Chiffre d\'affaires', value: `${stats.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, icon: TrendingUp, color: 'bg-violet-600' },
    ];

    if (loading) return <div className="text-gray-500">Chargement des données...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Vue d'ensemble</h1>
                <p className="text-gray-600 font-medium">Contrôle global de l'écosystème Tapzy.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-white">
                {cards.map((card) => (
                    <div key={card.name} className={`${card.color} p-8 rounded-3xl shadow-xl shadow-blue-500/10 flex flex-col justify-between h-44 transition-transform hover:scale-[1.02]`}>
                        <div className="flex justify-between items-start w-full">
                            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                                <card.icon size={22} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div>
                            <p className="text-white/80 text-sm font-bold uppercase tracking-wider">{card.name}</p>
                            <p className="text-4xl font-black">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Placeholder for charts or recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[300px]">
                    <h2 className="text-lg font-bold mb-4">Commandes récentes</h2>
                    <p className="text-gray-400 text-sm">Le flux d'activité en temps réel apparaîtra ici.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[300px]">
                    <h2 className="text-lg font-bold mb-4">Top Restaurants</h2>
                    <p className="text-gray-400 text-sm">Classement des restaurants par performance.</p>
                </div>
            </div>
        </div>
    );
};
