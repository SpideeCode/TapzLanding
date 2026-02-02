import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ClipboardList, TrendingUp, AlertCircle, ShoppingBag, Calendar, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, startOfDay, startOfYear, parseISO, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Order {
    id: string;
    total_price: number;
    created_at: string;
    status: string;
}

interface TopItem {
    name: string;
    count: number;
    revenue: number;
}

interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    avgTicket: number;
    revenueGrowth: number; // vs previous period
    ordersGrowth: number;
}

type TimeRange = 'today' | '7days' | '30days' | 'year';

export const AdminDashboardOverview: React.FC = () => {
    const [timeRange, setTimeRange] = useState<TimeRange>('7days');
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        totalOrders: 0,
        avgTicket: 0,
        revenueGrowth: 0,
        ordersGrowth: 0
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [topItems, setTopItems] = useState<TopItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single();
            if (!profile?.restaurant_id) return;

            const resId = profile.restaurant_id;

            // Calculate Date Range
            let startDate = new Date();
            if (timeRange === 'today') startDate = startOfDay(new Date());
            else if (timeRange === '7days') startDate = subDays(new Date(), 7);
            else if (timeRange === '30days') startDate = subDays(new Date(), 30);
            else if (timeRange === 'year') startDate = startOfYear(new Date());

            // Fetch Orders
            const { data: orders, error } = await supabase
                .from('orders')
                .select('id, total_price, created_at, status')
                .eq('restaurant_id', resId)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Fetch Previous Period for Growth (Simplified: just doubling the lookback)
            const prevStartDate = subDays(startDate, (timeRange === 'today' ? 1 : (timeRange === '7days' ? 7 : 30))); // Approx
            const { data: prevOrders } = await supabase
                .from('orders')
                .select('total_price')
                .eq('restaurant_id', resId)
                .gte('created_at', prevStartDate.toISOString())
                .lt('created_at', startDate.toISOString());

            // Process Stats
            const currentRevenue = orders?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;
            const currentCount = orders?.length || 0;
            const prevRevenue = prevOrders?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;
            const prevCount = prevOrders?.length || 0;

            const revenueGrowth = prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100;
            const ordersGrowth = prevCount === 0 ? 100 : ((currentCount - prevCount) / prevCount) * 100;

            setStats({
                totalRevenue: currentRevenue,
                totalOrders: currentCount,
                avgTicket: currentCount > 0 ? currentRevenue / currentCount : 0,
                revenueGrowth,
                ordersGrowth
            });

            // Process Chart Data
            // Group by day (or hour for 'today')
            const groupedData: any[] = [];
            if (timeRange === 'today') {
                // ... logic for hourly if needed, keeping simple day grouping for now or per order
                // For 'today', separate by hour? Let's stick to simple daily for 7/30 days and list for today.
                // Actually for charts, if 'today', maybe show hourly.
                // Let's keep it simple: Map orders to a timeline.
            }

            // Simple map for chart:
            const processedChartData = orders?.map(o => ({
                date: format(parseISO(o.created_at), timeRange === 'today' ? 'HH:mm' : 'dd MMM'),
                amount: Number(o.total_price),
            })) || [];

            // Should aggregate by date for line chart if not 'today'
            const aggregatedChartData: any = {};
            orders?.forEach(o => {
                const key = format(parseISO(o.created_at), timeRange === 'today' ? 'HH:00' : 'dd MMM');
                if (!aggregatedChartData[key]) aggregatedChartData[key] = 0;
                aggregatedChartData[key] += Number(o.total_price);
            });

            const finalChartData = Object.keys(aggregatedChartData).map(key => ({
                name: key,
                revenue: aggregatedChartData[key]
            }));

            setChartData(finalChartData);

            // Fetch Top Items (Bonus: requires joining order_items -> items)
            // This is heavy, maybe just count from local state if we fetched items? 
            // We'll limit to fetching order_items for these orders.
            const { data: orderItems } = await supabase
                .from('order_items')
                .select('quantity, item:items(name, price)')
                .in('order_id', orders?.map(o => o.id) || []);

            const itemCounts: Record<string, TopItem> = {};
            orderItems?.forEach((oi: any) => {
                const name = oi.item?.name || 'Unknown';
                const revenue = (oi.item?.price || 0) * oi.quantity;
                if (!itemCounts[name]) itemCounts[name] = { name, count: 0, revenue: 0 };
                itemCounts[name].count += oi.quantity;
                itemCounts[name].revenue += revenue;
            });

            setTopItems(Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5));

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [timeRange]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight italic">
                        TABLEAU DE <span className="text-blue-600 not-italic">BORD</span>
                    </h1>
                    <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Données en temps réel
                    </p>
                </div>

                {/* Time Filters */}
                <div className="bg-white p-1.5 rounded-2xl border-2 border-slate-100 flex flex-wrap justify-center sm:justify-start items-center shadow-sm gap-1 sm:gap-0">
                    {(['today', '7days', '30days', 'year'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`
                                px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${timeRange === range
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}
                            `}
                        >
                            {range === 'today' && "Aujourd'hui"}
                            {range === '7days' && "7 Jours"}
                            {range === '30days' && "30 Jours"}
                            {range === 'year' && "Année"}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Revenue Card */}
                <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm group hover:border-blue-600 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <DollarSign size={24} strokeWidth={2.5} />
                        </div>
                        {stats.revenueGrowth >= 0 ? (
                            <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold">
                                <ArrowUpRight size={14} className="mr-1" />
                                {stats.revenueGrowth.toFixed(1)}%
                            </span>
                        ) : (
                            <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs font-bold">
                                <ArrowDownRight size={14} className="mr-1" />
                                {Math.abs(stats.revenueGrowth).toFixed(1)}%
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Chiffre d'affaires</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{loading ? '...' : formatCurrency(stats.totalRevenue)}</h3>
                </div>

                {/* Orders Card */}
                <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm group hover:border-purple-600 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <ShoppingBag size={24} strokeWidth={2.5} />
                        </div>
                        {stats.ordersGrowth >= 0 ? (
                            <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold">
                                <ArrowUpRight size={14} className="mr-1" />
                                {stats.ordersGrowth.toFixed(1)}%
                            </span>
                        ) : (
                            <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs font-bold">
                                <ArrowDownRight size={14} className="mr-1" />
                                {Math.abs(stats.ordersGrowth).toFixed(1)}%
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Commandes</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{loading ? '...' : stats.totalOrders}</h3>
                </div>

                {/* Avg Ticket Card */}
                <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm group hover:border-amber-500 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <TrendingUp size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Panier Moyen</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{loading ? '...' : formatCurrency(stats.avgTicket)}</h3>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 mb-6 italic tracking-tight">Évolution du Chiffre d'Affaires</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                                    tickFormatter={(val) => `${val}€`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: number) => [`${value} €`, 'Revenu']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#2563eb"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Items */}
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 mb-6 italic tracking-tight">Top Produits</h3>
                    <div className="space-y-6">
                        {loading ? (
                            <p className="text-slate-400 italic">Chargement...</p>
                        ) : topItems.length === 0 ? (
                            <p className="text-slate-400 italic">Aucune donnée.</p>
                        ) : (
                            topItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <span className={`
                                            w-8 h-8 flex items-center justify-center rounded-lg font-black text-xs
                                            ${idx === 0 ? 'bg-amber-100 text-amber-600' :
                                                idx === 1 ? 'bg-slate-100 text-slate-600' :
                                                    'bg-orange-50 text-orange-600'}
                                        `}>
                                            #{idx + 1}
                                        </span>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                            <p className="text-slate-400 text-xs font-bold">{item.count} ventes</p>
                                        </div>
                                    </div>
                                    <span className="font-black text-slate-900 text-sm">{formatCurrency(item.revenue)}</span>
                                </div>
                            ))
                        )}
                    </div>
                    <button className="w-full mt-8 py-4 rounded-xl border-2 border-slate-100 font-bold text-slate-400 hover:border-slate-300 hover:text-slate-600 text-xs uppercase tracking-widest transition-all">
                        Voir tout le menu
                    </button>
                </div>
            </div>
        </div>
    );
};
