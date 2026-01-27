import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Filter, LayoutGrid, List, Edit2, Trash2 } from 'lucide-react';

interface Restaurant {
    id: string;
    name: string;
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
                    const { data: resData } = await supabase.from('restaurants').select('id, name');
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestion du Menu</h1>
                    <p className="text-gray-600 font-medium">Configurez vos catégories et vos plats.</p>
                </div>

                {isSuperAdmin && (
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
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Categories Section */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black flex items-center space-x-2 text-gray-900">
                            <LayoutGrid size={22} className={isSuperAdmin ? 'text-blue-600' : 'text-orange-600'} strokeWidth={2.5} />
                            <span>Catégories</span>
                        </h2>
                        <button
                            onClick={() => {
                                setEditingCat(null);
                                setCatName('');
                                setShowCatModal(true);
                            }}
                            className={`p-1.5 rounded-xl transition-colors ${isSuperAdmin ? 'hover:bg-blue-50 text-blue-600' : 'hover:bg-orange-50 text-orange-600'}`}
                        >
                            <Plus size={22} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y">
                        {loading ? (
                            <div className="p-4 text-center text-gray-400 text-sm">Chargement...</div>
                        ) : categories.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-sm italic">Aucune catégorie.</div>
                        ) : (
                            categories.map((cat: Category) => (
                                <div key={cat.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 transition-all cursor-pointer">
                                    <span className="font-bold text-gray-700">{cat.name}</span>
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingCat(cat);
                                                setCatName(cat.name);
                                                setShowCatModal(true);
                                            }}
                                            className={`p-1.5 text-gray-400 rounded-lg ${isSuperAdmin ? 'hover:text-blue-600 hover:bg-blue-50' : 'hover:text-orange-600 hover:bg-orange-50'}`}
                                        >
                                            <Edit2 size={16} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
                        <h2 className="text-xl font-black flex items-center space-x-2 text-gray-900">
                            <List size={22} className={isSuperAdmin ? 'text-blue-600' : 'text-orange-600'} strokeWidth={2.5} />
                            <span>Plats & Articles</span>
                        </h2>
                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setItemName('');
                                setItemPrice('0');
                                setItemCatId(categories[0]?.id || '');
                                setShowItemModal(true);
                            }}
                            className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all flex items-center space-x-2 shadow-lg active:scale-95 ${isSuperAdmin
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/10'
                                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-500/10'
                                }`}>
                            <Plus size={18} strokeWidth={3} />
                            <span>Nouveau Plat</span>
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Nom</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Catégorie</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Chargement...</td></tr>
                                ) : items.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Aucun plat configuré.</td></tr>
                                ) : (
                                    items.map((item: Item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-500">
                                                <span className="bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                                                    {categories.find((c: Category) => c.id === item.category_id)?.name || 'Inconnue'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-black text-gray-900 text-base">
                                                <span className={isSuperAdmin ? 'text-blue-600' : 'text-orange-600'}>{item.price} €</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setItemName(item.name);
                                                        setItemPrice(item.price.toString());
                                                        setItemCatId(item.category_id);
                                                        setShowItemModal(true);
                                                    }}
                                                    className={`text-gray-400 p-1.5 rounded-lg mr-2 transition-all ${isSuperAdmin ? 'hover:text-blue-600 hover:bg-blue-50' : 'hover:text-orange-600 hover:bg-orange-50'}`}
                                                >
                                                    <Edit2 size={16} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} strokeWidth={2.5} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
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
