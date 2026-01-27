import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

interface Restaurant {
    id: string;
    name: string;
    slug: string;
    stripe_account_id: string | null;
    created_at: string;
}

export const RestaurantManagement: React.FC = () => {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newRes, setNewRes] = useState({ name: '', slug: '' });

    const fetchRestaurants = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false });
        if (error) console.error(error);
        else setRestaurants(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('restaurants').insert([newRes]);
        if (error) alert(error.message);
        else {
            setShowAddModal(false);
            setNewRes({ name: '', slug: '' });
            fetchRestaurants();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Restaurants</h1>
                    <p className="text-gray-600 font-medium">Gestion et supervision des établissements.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 w-full sm:w-auto text-center justify-center"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span>Ajouter un restaurant</span>
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center space-x-4 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un restaurant..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                </div>
            </div>

            {/* Restaurants List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Nom</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Slug / URL</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Stripe ID</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Chargement...</td>
                            </tr>
                        ) : restaurants.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Aucun restaurant trouvé.</td>
                            </tr>
                        ) : (
                            restaurants.map((res) => (
                                <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 text-base">{res.name}</div>
                                        <div className="text-xs font-medium text-gray-400 font-mono tracking-tight">{res.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full text-xs border border-blue-100 italic">/{res.slug}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-gray-700">{res.stripe_account_id || <span className="text-gray-300 font-normal italic">Non configuré</span>}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                <Edit2 size={18} strokeWidth={2.5} />
                                            </button>
                                            <button className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                                <Trash2 size={18} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-200 border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-gray-900 italic underline decoration-blue-600 underline-offset-8">Nouveau Restaurant</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <Plus size={24} className="rotate-45 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-gray-900 uppercase tracking-[0.2em] ml-1">Nom de l'établissement</label>
                                <input
                                    type="text"
                                    required
                                    value={newRes.name}
                                    onChange={e => setNewRes({ ...newRes, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-bold text-gray-900 placeholder:text-gray-400 shadow-sm"
                                    placeholder="ex: Le Petit Bistro"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-gray-900 uppercase tracking-[0.2em] ml-1">Lien personnalisé (Slug)</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">/</span>
                                    <input
                                        type="text"
                                        required
                                        value={newRes.slug}
                                        onChange={e => setNewRes({ ...newRes, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        className="w-full pl-9 pr-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-bold text-gray-900 placeholder:text-gray-400 shadow-sm"
                                        placeholder="ex: petit-bistro"
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider ml-1">C'est le nom qui apparaîtra dans l'URL de votre menu.</p>
                            </div>

                            <div className="flex space-x-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-4 border-2 border-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-50 transition-all active:scale-[0.98]"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
                                >
                                    Créer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
