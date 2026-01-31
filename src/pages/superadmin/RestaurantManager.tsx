import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MenuManagement } from '../admin/MenuManagement';
import { TableManagement } from '../admin/Tables';
import { RestaurantSettings } from '../admin/RestaurantSettings';
import {
    UtensilsCrossed,
    QrCode,
    Settings,
    Users,
    ArrowLeft,
    Store
} from 'lucide-react';

export const RestaurantManager: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState<{ name: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'menu' | 'tables' | 'settings' | 'staff'>('menu');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRestaurant = async () => {
            if (!id) return;
            const { data } = await supabase.from('restaurants').select('name').eq('id', id).single();
            if (data) {
                setRestaurant(data);
            }
            setLoading(false);
        };
        fetchRestaurant();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!id || !restaurant) {
        return (
            <div className="text-center p-20">
                <h2 className="text-xl font-bold text-white mb-4">Restaurant introuvable</h2>
                <button onClick={() => navigate('/superadmin/restaurants')} className="text-blue-500 hover:text-blue-400">
                    Retour à la liste
                </button>
            </div>
        );
    }

    const tabs = [
        { id: 'menu', label: 'Menu Digital', icon: UtensilsCrossed },
        { id: 'tables', label: 'Tables & QR', icon: QrCode },
        { id: 'staff', label: 'Équipe', icon: Users },
        { id: 'settings', label: 'Paramètres', icon: Settings },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-[#111113] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                <div className="relative z-10">
                    <button
                        onClick={() => navigate('/superadmin/restaurants')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-xs font-bold uppercase tracking-widest"
                    >
                        <ArrowLeft size={14} /> Retour à la liste
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 text-blue-500">
                                <Store size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">
                                    {restaurant.name}
                                </h1>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                                        Mode SuperAdmin
                                    </span>
                                    <span className="text-gray-500 text-xs font-mono">
                                        ID: {id}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex overflow-x-auto gap-2 mt-8 -mb-2 pb-2 scrollbar-hide">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'menu' && <MenuManagement restaurantId={id} />}
                {activeTab === 'tables' && <TableManagement restaurantId={id} />}
                {activeTab === 'settings' && <RestaurantSettings restaurantId={id} />}
                {activeTab === 'staff' && (
                    <div className="p-12 text-center bg-[#111113] rounded-[2rem] border border-white/5">
                        <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-500">
                            <Users size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Gestion d'équipe</h3>
                        <p className="text-gray-500 text-sm">
                            Le module de gestion d'équipe pour SuperAdmin est en cours de développement.
                            <br />
                            Vous pouvez utiliser les paramètres ("Accès Staff") pour réinitialiser le code PIN.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
