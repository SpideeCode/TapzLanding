import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useStaffOrders, OrderWithDetails } from '../../hooks/useStaffOrders';
import {
    Clock,
    CheckCircle2,
    ChefHat,
    Truck,
    AlertCircle,
    MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const LiveOrders: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const { orders, loading, updateOrderStatus } = useStaffOrders(restaurantId || '');

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const resolveRestaurant = async () => {
            try {
                if (slug) {
                    const { data: restaurant, error: fetchError } = await supabase
                        .from('restaurants')
                        .select('id')
                        .eq('slug', slug)
                        .maybeSingle(); // Prevents "0 rows" error

                    console.log(`[Resolution] Slug: ${slug}, Found:`, restaurant);

                    if (fetchError) throw fetchError;

                    if (restaurant) {
                        setRestaurantId(restaurant.id);
                    } else {
                        setError("Restaurant introuvable");
                    }
                } else {
                    // Admin Context
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single();
                        if (profile?.restaurant_id) setRestaurantId(profile.restaurant_id);
                    }
                }
            } catch (err: any) {
                console.error("Error resolving restaurant:", err);
                setError("Erreur chargement: " + err.message);
            }
        };
        resolveRestaurant();
    }, [slug]);

    // ... imports stay same
    const columns = [
        { id: 'pending', name: 'À Préparer', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
        { id: 'preparing', name: 'En Cuisine', icon: ChefHat, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { id: 'served', name: 'Servi / Prêt', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    ];

    const getOrdersByStatus = (status: string) => orders.filter(o => o.status === status);

    const handleNextStatus = async (order: OrderWithDetails) => {
        try {
            const statusMap: Record<string, OrderWithDetails['status']> = {
                'pending': 'preparing',
                'preparing': 'served',
                'served': 'paid'
            };
            const next = statusMap[order.status];
            if (next) {
                console.log(`Updating order ${order.id} to ${next}`);
                await updateOrderStatus(order.id, next);
            }
        } catch (err: any) {
            console.error('Failed to update status:', err);
            alert('Impossible de mettre à jour le statut : ' + err.message);
        }
    };

    if (error) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-center">
                    <AlertCircle className="w-12 h-12 text-rose-500" />
                    <span className="font-black italic uppercase tracking-widest text-rose-500">Erreur</span>
                    <p className="text-slate-500">{error}</p>
                </div>
            </div>
        );
    }

    if (loading && !restaurantId) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-sm"></div>
                    <span className="font-black italic uppercase tracking-[0.2em] text-gray-400 text-[10px]">Initialisation Service...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none mb-4">
                        COMMANDES <span className="text-blue-600">LIVE</span>
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/20"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Service en cours</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-white px-8 py-5 rounded-[2rem] border-2 border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-110" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1 relative z-10">À traiter</span>
                        <span className="text-3xl font-black italic text-slate-900 relative z-10">{getOrdersByStatus('pending').length + getOrdersByStatus('preparing').length}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-10 min-h-0">
                {columns.map((col) => (
                    <div key={col.id} className="flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-8 px-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${col.bg.replace('10', '50')} ${col.color} border-2 border-slate-200 shadow-sm`}>
                                    <col.icon size={20} strokeWidth={3} />
                                </div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">{col.name}</h2>
                            </div>
                            <span className="bg-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black text-white shadow-lg border border-slate-900">
                                {getOrdersByStatus(col.id).length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar pb-10">
                            {getOrdersByStatus(col.id).map((order) => (
                                <div
                                    key={order.id}
                                    className="bg-white rounded-[3rem] border-2 border-slate-200 shadow-sm group hover:border-blue-600 transition-all duration-300 relative overflow-hidden active:scale-[0.99]"
                                >
                                    {/* Card Header */}
                                    <div className="p-8 border-b-2 border-slate-50 flex items-center justify-between bg-slate-50/50">
                                        <div className="flex items-center gap-5">
                                            <div className="bg-white text-slate-900 w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center border-2 border-slate-200 shadow-sm group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300">
                                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">Table</span>
                                                <span className="text-2xl font-black italic leading-none">{order.tables?.table_number || '??'}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                    <Clock size={12} strokeWidth={3} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: fr })}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">#{order.id.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                        <button className="p-3 text-slate-300 hover:text-slate-900 transition-colors bg-white rounded-xl shadow-sm border-2 border-slate-100">
                                            <MoreHorizontal size={20} strokeWidth={2.5} />
                                        </button>
                                    </div>

                                    {/* Items */}
                                    <div className="p-8 space-y-5">
                                        {order.order_items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between group/item">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center font-black text-sm text-slate-900 border-2 border-slate-100 shadow-sm group-hover/item:border-blue-600 transition-colors">
                                                        {item.quantity}
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight italic">{item.items.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Footer */}
                                    <div className="p-6 pt-0">
                                        <button
                                            onClick={() => handleNextStatus(order)}
                                            className={`
                                                w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg
                                                ${order.status === 'pending' ? 'bg-slate-900 text-white hover:bg-black shadow-slate-900/10' :
                                                    order.status === 'preparing' ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20' :
                                                        'bg-gray-50 text-gray-400 border border-slate-100 shadow-none'}
                                            `}
                                        >
                                            {order.status === 'pending' && (
                                                <>
                                                    <ChefHat size={16} strokeWidth={3} />
                                                    Lancer la cuisine
                                                </>
                                            )}
                                            {order.status === 'preparing' && (
                                                <>
                                                    <CheckCircle2 size={16} strokeWidth={3} />
                                                    Marquer comme prêt
                                                </>
                                            )}
                                            {order.status === 'served' && (
                                                <>
                                                    <Truck size={16} strokeWidth={3} />
                                                    Clôturer la commande
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {getOrdersByStatus(col.id).length === 0 && (
                                <div className="border-4 border-dashed border-gray-50 rounded-[4rem] p-16 flex flex-col items-center justify-center text-center bg-gray-50/30">
                                    <div className="bg-white p-8 rounded-[2.5rem] mb-6 shadow-sm border border-slate-100 text-slate-200">
                                        <col.icon size={48} strokeWidth={1} />
                                    </div>
                                    <p className="font-black italic uppercase tracking-widest text-[10px] text-gray-400">File d'attente vide</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
