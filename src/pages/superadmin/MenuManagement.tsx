import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Filter, LayoutGrid, List, Edit2, Trash2, ExternalLink } from 'lucide-react';

interface Restaurant {
    id: string;
    name: string;
    slug: string;
}

interface Category {
    id: string;
    name: string;
    restaurant_id: string;
    display_order: number;
}

interface Item {
    id: string;
    name: string;
    price: number;
    category_id: string;
    restaurant_id: string;
}

export const MenuManagement: React.FC = () => {
    const [userProfile, setUserProfile] = useState<{ role: string, restaurant_id: string | null } | null>(null);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedResId, setSelectedResId] = useState<string>('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);

    // Modals state
    const [showCatModal, setShowCatModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    // Form state
    const [catName, setCatName] = useState('');
    const [itemName, setItemName] = useState('');
    const [itemPrice, setItemPrice] = useState('0');
    const [itemCatId, setItemCatId] = useState('');

    useEffect(() => {
        const fetchUserAndRestaurants = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase.from('profiles').select('role, restaurant_id').eq('id', user.id).single();
                setUserProfile(profile);

                if (profile?.role === 'superadmin') {
                    // Fetch slug as well
                    const { data: resData } = await supabase.from('restaurants').select('id, name, slug');
                    setRestaurants(resData || []);
                    if (resData && resData.length > 0) setSelectedResId(resData[0].id);
                } else if (profile?.restaurant_id) {
                    setSelectedResId(profile.restaurant_id);
                }
            } catch (error) {
                console.error('Error in MenuManagement initial fetch:', error);
            }
        };
        fetchUserAndRestaurants();
    }, []);

    const fetchMenuData = async () => {
        if (!selectedResId) return;
        setLoading(true);
        try {
            const [catRes, itemRes] = await Promise.all([
                supabase.from('menus_categories').select('*').eq('restaurant_id', selectedResId).order('display_order', { ascending: true }),
                supabase.from('items').select('*').eq('restaurant_id', selectedResId)
            ]);

            setCategories(catRes.data || []);
            setItems(itemRes.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenuData();
    }, [selectedResId]);

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedResId) return;

        const catData = {
            name: catName,
            restaurant_id: selectedResId,
            display_order: editingCat ? editingCat.display_order : categories.length
        };

        let error;
        if (editingCat) {
            ({ error } = await supabase.from('menus_categories').update(catData).eq('id', editingCat.id));
        } else {
            ({ error } = await supabase.from('menus_categories').insert([catData]));
        }

        if (error) alert(error.message);
        else {
            setShowCatModal(false);
            setEditingCat(null);
            setCatName('');
            fetchMenuData();
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Supprimer cette catégorie ? Tous les plats associés resteront mais n\'auront plus de catégorie.')) return;
        const { error } = await supabase.from('menus_categories').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchMenuData();
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedResId) return;

        const itemData = {
            name: itemName,
            price: Number(itemPrice),
            category_id: itemCatId || null,
            restaurant_id: selectedResId
        };

        let error;
        if (editingItem) {
            ({ error } = await supabase.from('items').update(itemData).eq('id', editingItem.id));
        } else {
            ({ error } = await supabase.from('items').insert([itemData]));
        }

        if (error) alert(error.message);
        else {
            setShowItemModal(false);
            setEditingItem(null);
            setItemName('');
            setItemPrice('0');
            setItemCatId('');
            fetchMenuData();
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Supprimer ce plat ?')) return;
        const { error } = await supabase.from('items').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchMenuData();
    };

    const isSuperAdmin = userProfile?.role === 'superadmin';
    const selectedRestaurant = restaurants.find(r => r.id === selectedResId);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestion du Menu</h1>
                    <p className="text-gray-600 font-medium">Configurez vos catégories et vos plats.</p>
                </div>

                {isSuperAdmin && (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                            <Filter size={18} className="text-gray-400 ml-2" />
                            <select
                                value={selectedResId}
                                onChange={(e) => setSelectedResId(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-gray-700 pr-8"
                            >
                                {restaurants.map(res => (
                                    <option key={res.id} value={res.id}>{res.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dynamic Link for SuperAdmin */}
                        {selectedRestaurant && selectedRestaurant.slug && (
                            <a
                                href={`/m/${selectedRestaurant.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center group"
                                title="Voir le menu public"
                            >
                                <ExternalLink size={20} className="group-hover:scale-110 transition-transform" />
                            </a>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Categories Section */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black flex items-center space-x-3 text-slate-900 italic tracking-tight">
                            <LayoutGrid size={22} className="text-blue-600 not-italic" strokeWidth={2.5} />
                            <span className="uppercase">Catégories</span>
                        </h2>
                        <button
                            onClick={() => {
                                setEditingCat(null);
                                setCatName('');
                                setShowCatModal(true);
                            }}
                            className="p-1.5 rounded-xl transition-all hover:bg-blue-600 hover:text-white text-blue-600 border-2 border-transparent hover:border-blue-600"
                        >
                            <Plus size={22} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-sm divide-y-2 divide-slate-100 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400 text-sm font-bold italic">Actions en cours...</div>
                        ) : categories.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm font-bold italic uppercase tracking-widest">Aucune catégorie.</div>
                        ) : (
                            categories.map((cat: Category) => (
                                <div key={cat.id} className="p-5 flex items-center justify-between group hover:bg-slate-50 transition-all cursor-pointer">
                                    <span className="font-black text-slate-900 italic uppercase tracking-tight">{cat.name}</span>
                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingCat(cat);
                                                setCatName(cat.name);
                                                setShowCatModal(true);
                                            }}
                                            className="p-2 text-slate-400 rounded-xl hover:text-blue-600 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-blue-100"
                                        >
                                            <Edit2 size={16} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-white hover:ring-2 hover:ring-red-100 rounded-xl transition-all"
                                        >
                                            <Trash2 size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Items Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black flex items-center space-x-3 text-slate-900 italic tracking-tight">
                            <List size={22} className="text-blue-600 not-italic" strokeWidth={2.5} />
                            <span className="uppercase">Plats & Articles</span>
                        </h2>
                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setItemName('');
                                setItemPrice('0');
                                setItemCatId(categories[0]?.id || '');
                                setShowItemModal(true);
                            }}
                            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 shadow-xl active:scale-95 bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20">
                            <Plus size={18} strokeWidth={3} />
                            <span>Nouveau Plat</span>
                        </button>
                    </div>

                    <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b-2 border-slate-100">
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nom</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Catégorie</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Prix</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold italic italic">Flux en cours...</td></tr>
                                    ) : items.length === 0 ? (
                                        <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold italic uppercase tracking-widest">Aucun plat configuré.</td></tr>
                                    ) : (
                                        items.map((item: Item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-5 font-black text-slate-900 uppercase tracking-tight text-sm italic">{item.name}</td>
                                                <td className="px-8 py-5">
                                                    <span className="bg-slate-900 px-3 py-1 rounded-lg text-white text-[9px] font-black uppercase tracking-widest shadow-md">
                                                        {categories.find((c: Category) => c.id === item.category_id)?.name || 'Inconnue'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 font-black text-slate-900 text-lg tracking-tighter italic">
                                                    <span className="text-blue-600">{item.price} €</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem(item);
                                                                setItemName(item.name);
                                                                setItemPrice(item.price.toString());
                                                                setItemCatId(item.category_id);
                                                                setShowItemModal(true);
                                                            }}
                                                            className="text-slate-400 p-2.5 rounded-xl transition-all hover:text-blue-600 hover:bg-white hover:shadow-md border border-transparent hover:border-blue-100"
                                                        >
                                                            <Edit2 size={16} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            className="text-slate-400 hover:text-red-600 hover:bg-white hover:ring-2 hover:ring-red-100 p-2.5 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={16} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Modal */}
            {showCatModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-200">
                        <h3 className="text-2xl font-black text-gray-900 mb-6 italic underline decoration-blue-600 underline-offset-8">
                            {editingCat ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                        </h3>
                        <form onSubmit={handleSaveCategory} className="space-y-6">
                            <div>
                                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Nom de la catégorie</label>
                                <input
                                    type="text"
                                    required
                                    value={catName}
                                    onChange={e => setCatName(e.target.value)}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-bold text-gray-900 placeholder:text-gray-400"
                                    placeholder="ex: Entrées, Plats, Desserts..."
                                />
                            </div>
                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCatModal(false)}
                                    className="flex-1 px-6 py-4 border-2 border-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-50 transition-all active:scale-[0.98]"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Item Modal */}
            {showItemModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-200">
                        <h3 className="text-2xl font-black text-gray-900 mb-6 italic underline decoration-blue-600 underline-offset-8">
                            {editingItem ? 'Modifier le plat' : 'Nouveau plat'}
                        </h3>
                        <form onSubmit={handleSaveItem} className="space-y-6">
                            <div>
                                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Nom du plat</label>
                                <input
                                    type="text"
                                    required
                                    value={itemName}
                                    onChange={e => setItemName(e.target.value)}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-bold text-gray-900"
                                    placeholder="ex: Burger Maison"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Prix (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={itemPrice}
                                        onChange={e => setItemPrice(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-bold text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Catégorie</label>
                                    <select
                                        value={itemCatId}
                                        onChange={e => setItemCatId(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-bold text-gray-900"
                                    >
                                        <option value="">Sans catégorie</option>
                                        {categories.map((cat: Category) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowItemModal(false)}
                                    className="flex-1 px-6 py-4 border-2 border-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-50 transition-all active:scale-[0.98]"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
