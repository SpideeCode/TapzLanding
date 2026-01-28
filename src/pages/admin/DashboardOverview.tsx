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
        { label: 'Commandes Total', value: stats.orders, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Plats Actifs', value: stats.items, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Tables Config.', value: stats.tables, icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Catégories', value: stats.categories, icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight italic">
                        TABLEAU DE <span className="text-blue-600 not-italic">BORD</span>
                    </h1>
                    <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Aperçu de l'activité du restaurant
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="bg-white hover:bg-gray-50 text-slate-900 px-6 py-3.5 rounded-2xl font-black text-[10px] transition-all border-2 border-slate-100 active:scale-95 uppercase tracking-widest">
                        Exporter Données
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] shadow-xl shadow-blue-500/20 transition-all active:scale-95 uppercase tracking-widest">
                        Nouveau Plat
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-600 transition-all duration-500 active:scale-[0.98]">
                        <div className="relative z-10">
                            <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl w-fit mb-6 shadow-sm border-2 border-white group-hover:bg-blue-600 group-hover:text-white transition-all duration-300`}>
                                <stat.icon size={28} strokeWidth={2.5} />
                            </div>
                            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                            <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic">
                                {loading ? (
                                    <div className="h-10 w-20 bg-slate-50 animate-pulse rounded-lg mt-2" />
                                ) : stat.value}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border-2 border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                            <TrendingUp size={24} className="text-blue-600 not-italic" />
                            COMMANDES RÉCENTES
                        </h3>
                        <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                            Tout voir
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="py-20 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border-2 border-white">
                                <ShoppingBag className="text-slate-300" size={32} />
                            </div>
                            <p className="text-slate-400 font-bold italic text-sm">En attente de vos premières commandes...</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-blue-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 -mr-20 -mt-20 rounded-full group-hover:scale-110 transition-transform duration-700" />
                        <h3 className="text-3xl font-black mb-4 relative z-10 leading-tight italic">BOOSTEZ VOTRE <br />MENU !</h3>
                        <p className="text-blue-100 font-bold mb-8 text-sm leading-relaxed relative z-10 opacity-80 uppercase tracking-wide">Ajoutez vos spécialités pour attirer plus de clients.</p>
                        <button className="bg-white text-blue-600 font-black px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95 relative z-10 text-[10px] uppercase tracking-widest">
                            Configurer maintenant
                        </button>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-200 shadow-sm relative overflow-hidden">
                        <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight uppercase">Support Client</h3>
                        <p className="text-slate-400 text-sm font-bold leading-relaxed mb-8 italic">Besoin d'aide pour configurer votre établissement ? Nos experts sont là 24/7.</p>
                        <button className="w-full py-4 rounded-2xl border-2 border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">
                            Contacter l'aide
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
