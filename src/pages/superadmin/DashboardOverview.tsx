import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Store, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';

interface GlobalStats {
    totalRestaurants: number;
    totalUsers: number;
    totalOrders: number;
    totalVolume: number;
    mrr: number;
    activeSubs: number;
}

export const DashboardOverview: React.FC = () => {
    const [stats, setStats] = useState<GlobalStats>({
        totalRestaurants: 0,
        totalUsers: 0,
        totalOrders: 0,
        totalVolume: 0,
        mrr: 0,
        activeSubs: 0
    });
    const [financials, setFinancials] = useState<any>({
        mrr: 0,
        activeSubs: 0,
        ttv30d: 0,
        totalCommission30d: 0,
        stripeBalance: 0,
        chartData: []
    });

    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [topRestaurants, setTopRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalStats = async () => {
            setLoading(true);
            try {
                // Fetch Financials from API
                const financialRes = await fetch('/api/get-platform-financials');
                if (financialRes.ok) {
                    const finData = await financialRes.json();
                    setFinancials(finData);
                    setRevenueData(finData.chartData || []);
                }

                // Fetch all restaurants for directory count
                const { count: resCount } = await supabase.from('restaurants').select('*', { count: 'exact', head: true });

                // Fetch top restaurants by commission (proxy for revenue interest)
                const { data: restaurants } = await supabase.rpc('get_restaurants_with_stats');
                const sortedRes = (restaurants || []).sort((a: any, b: any) => (b.total_revenue || 0) - (a.total_revenue || 0)).slice(0, 5);
                setTopRestaurants(sortedRes);

                setStats(prev => ({
                    ...prev,
                    totalRestaurants: resCount || 0
                }));

            } catch (error) {
                console.error('Error fetching superadmin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalStats();
    }, []);

    const cards = [
        { name: 'MRR (Revenu Mensuel)', value: `${financials.mrr} €`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { name: 'Volume (30j)', value: `${(financials.ttv30d / 1000).toFixed(1)}k €`, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'Commission (Net)', value: `${financials.totalCommission30d.toFixed(2)} €`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
        { name: 'Stripe Balance', value: `${financials.stripeBalance.toFixed(2)} €`, icon: Store, color: 'text-slate-600', bg: 'bg-slate-50' },
    ];

    if (loading) return <div className="flex h-96 items-center justify-center text-slate-400 font-bold animate-pulse">Chargement des données financières...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Vue d'ensemble <span className="text-blue-600">SuperAdmin</span></h1>
                    <p className="text-gray-600 font-medium">Pilotage SaaS & Finance.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div key={card.name} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`${card.bg} ${card.color} p-3 rounded-2xl`}>
                                <card.icon size={24} strokeWidth={2.5} />
                            </div>
                            <span className="bg-gray-50 text-gray-400 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Global</span>
                        </div>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">{card.name}</p>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{card.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Platform Volume Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                    <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                        <Activity className="text-blue-600" />
                        Volume de Ventes (30j)
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorGlobalVol" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#059669" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} tickFormatter={(val) => `${val}€`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderRadius: '12px', border: 'none', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value?: number) => [`${value || 0} €`, 'Commission']}
                                />
                                <Area type="monotone" dataKey="commission" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorGlobalVol)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Restaurants List */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="text-amber-500" />
                        Top Performance
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                        {topRestaurants.map((res, index) => (
                            <div key={res.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-amber-100 text-amber-600' : 'bg-white text-gray-400 shadow-sm'}`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{res.name}</h4>
                                        <p className="text-gray-400 text-xs font-semibold">tapzy.app/m/{res.slug}</p>
                                    </div>
                                </div>
                                <span className="font-black text-gray-900 text-sm">{(res.total_revenue || res.revenue || 0).toLocaleString()} €</span>
                            </div>
                        ))}
                        {topRestaurants.length === 0 && <p className="text-gray-400 text-center italic text-sm my-auto">Aucune donnée.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
