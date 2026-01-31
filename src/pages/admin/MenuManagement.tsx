import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Plus,
    Edit2,
    Trash2,
    LayoutGrid,
    Search,
    Package
} from 'lucide-react';

interface Category {
    id: string;
    name: string;
    display_order: number;
}

interface Item {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    category_id: string;
    is_available: boolean;
}

export const MenuManagement: React.FC<{ restaurantId?: string }> = ({ restaurantId: propRestaurantId }) => {
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');

    // Modals
    const [showCatModal, setShowCatModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    // Form states
    const [catName, setCatName] = useState('');
    const [itemName, setItemName] = useState('');
    const [itemDesc, setItemDesc] = useState('');
    const [itemPrice, setItemPrice] = useState('0');
    const [itemCatId, setItemCatId] = useState('');
    const [itemImage, setItemImage] = useState('');

    useEffect(() => {
        const init = async () => {
            if (propRestaurantId) {
                setRestaurantId(propRestaurantId);
                fetchData(propRestaurantId);
                return;
            }
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single();
            if (profile?.restaurant_id) {
                setRestaurantId(profile.restaurant_id);
                fetchData(profile.restaurant_id);
            }
        };
        init();
    }, [propRestaurantId]);

    const fetchData = async (resId: string) => {
        setLoading(true);
        try {
            const [catRes, itemRes] = await Promise.all([
                supabase.from('menus_categories').select('*').eq('restaurant_id', resId).order('display_order'),
                supabase.from('items').select('*').eq('restaurant_id', resId).order('created_at', { ascending: false })
            ]);
            setCategories(catRes.data || []);
            setItems(itemRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurantId || !catName) return;

        const data = {
            name: catName,
            restaurant_id: restaurantId,
            display_order: editingCat?.display_order || categories.length
        };

        try {
            if (editingCat) {
                await supabase.from('menus_categories').update(data).eq('id', editingCat.id);
            } else {
                await supabase.from('menus_categories').insert([data]);
            }
            setShowCatModal(false);
            setCatName('');
            setEditingCat(null);
            fetchData(restaurantId);
        } catch (error) {
            console.error('Error saving category:', error);
        }
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurantId || !itemName || !itemCatId) return;

        const data = {
            name: itemName,
            description: itemDesc,
            price: parseFloat(itemPrice),
            category_id: itemCatId,
            restaurant_id: restaurantId,
            image_url: itemImage || null,
            is_available: editingItem ? editingItem.is_available : true
        };

        try {
            if (editingItem) {
                await supabase.from('items').update(data).eq('id', editingItem.id);
            } else {
                await supabase.from('items').insert([data]);
            }
            setShowItemModal(false);
            setItemName('');
            setItemDesc('');
            setItemPrice('0');
            setItemCatId('');
            setItemImage('');
            setEditingItem(null);
            fetchData(restaurantId);
        } catch (error) {
            console.error('Error saving item:', error);
        }
    };

    const toggleAvailability = async (item: Item) => {
        try {
            await supabase.from('items').update({ is_available: !item.is_available }).eq('id', item.id);
            if (restaurantId) fetchData(restaurantId);
        } catch (error) {
            console.error('Error toggling availability:', error);
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Voulez-vous vraiment supprimer ce plat ?')) return;
        try {
            await supabase.from('items').delete().eq('id', id);
            if (restaurantId) fetchData(restaurantId);
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const handleDeleteCat = async (id: string) => {
        if (!confirm('En supprimant cette catégorie, tous les plats associés perdront leur catégorie. Continuer ?')) return;
        try {
            await supabase.from('menus_categories').delete().eq('id', id);
            if (restaurantId) fetchData(restaurantId);
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    const filteredItems = items.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        categories.find(c => c.id === i.category_id)?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight italic">
                        GESTION DU <span className="text-blue-600 not-italic uppercase">Menu</span>
                    </h1>
                    <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[10px] flex items-center gap-2">
                        Configurez vos cartes et vos plats en temps réel
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setEditingCat(null);
                            setCatName('');
                            setShowCatModal(true);
                        }}
                        className="bg-white hover:bg-gray-50 text-slate-900 px-6 py-3.5 rounded-2xl font-black text-[10px] transition-all border-2 border-slate-100 active:scale-95 flex items-center gap-2 uppercase tracking-widest"
                    >
                        <Plus size={16} strokeWidth={3} /> Catégorie
                    </button>
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setItemName('');
                            setItemDesc('');
                            setItemPrice('0');
                            setItemCatId(categories[0]?.id || '');
                            setShowItemModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest"
                    >
                        <Plus size={16} strokeWidth={3} /> Nouveau Plat
                    </button>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
                <div className="flex gap-2 bg-gray-50 p-1.5 rounded-2xl w-fit border border-gray-100">
                    <button
                        onClick={() => setActiveTab('items')}
                        className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'items' ? 'bg-white text-slate-900 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-slate-600'}`}
                    >
                        Plats
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-white text-slate-900 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-slate-600'}`}
                    >
                        Catégories
                    </button>
                </div>

                <div className="relative group max-w-md w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un plat, une catégorie..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border-2 border-slate-50 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 font-bold placeholder:text-gray-400 focus:outline-none focus:border-blue-100 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* List */}
            {activeTab === 'items' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredItems.map(item => (
                        <div key={item.id} className="bg-white rounded-[2.5rem] border-2 border-slate-50 overflow-hidden group hover:border-blue-100 transition-all duration-500 relative flex flex-col shadow-sm">
                            <div className="h-56 relative overflow-hidden bg-gray-50">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                        <Package size={64} strokeWidth={1} />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 translate-y-[-120%] group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingItem(item);
                                            setItemName(item.name);
                                            setItemDesc(item.description);
                                            setItemPrice(item.price.toString());
                                            setItemCatId(item.category_id);
                                            setItemImage(item.image_url || '');
                                            setShowItemModal(true);
                                        }}
                                        className="bg-white text-slate-900 p-3 rounded-xl shadow-xl active:scale-95 hover:bg-blue-600 hover:text-white transition-colors"
                                    >
                                        <Edit2 size={16} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="bg-white text-red-600 p-3 rounded-xl shadow-xl active:scale-95 hover:bg-red-600 hover:text-white transition-colors"
                                    >
                                        <Trash2 size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                                <div className="absolute bottom-4 left-4">
                                    <span className="bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border border-black/5">
                                        {categories.find(c => c.id === item.category_id)?.name || 'Sans catégorie'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex justify-between items-start gap-4 mb-3">
                                    <h3 className="text-xl font-black text-slate-900 italic tracking-tight uppercase leading-tight">{item.name}</h3>
                                    <span className="text-2xl font-black text-blue-600 tracking-tighter shrink-0">{item.price.toFixed(2)}€</span>
                                </div>
                                <p className="text-gray-400 text-xs font-bold leading-relaxed line-clamp-2 mb-8 italic">
                                    {item.description || "Aucune description détaillée."}
                                </p>
                                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${item.is_available ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {item.is_available ? '• En Stock' : '• Épuisé'}
                                    </span>
                                    <button
                                        onClick={() => toggleAvailability(item)}
                                        className={`w-12 h-6 rounded-full relative transition-all ${item.is_available ? 'bg-blue-600' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${item.is_available ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredItems.length === 0 && !loading && (
                        <div className="col-span-full py-24 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <Search className="text-slate-300" size={32} />
                            </div>
                            <p className="text-slate-400 font-bold italic">Aucun plat ne correspond à votre recherche.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map(cat => (
                        <div key={cat.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 flex items-center justify-between group hover:border-blue-100 transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm border border-slate-100">
                                    <LayoutGrid size={22} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-black italic tracking-tight text-lg uppercase">{cat.name}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        {items.filter(i => i.category_id === cat.id).length} Plats
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingCat(cat);
                                        setCatName(cat.name);
                                        setShowCatModal(true);
                                    }}
                                    className="p-3 bg-gray-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-100"
                                >
                                    <Edit2 size={16} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => handleDeleteCat(cat.id)}
                                    className="p-3 bg-gray-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-100"
                                >
                                    <Trash2 size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Item Modal */}
            {showItemModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6">
                    <div className="bg-white w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-3xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-6 md:p-10 border-b border-gray-50 flex items-center justify-between shrink-0">
                            <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">
                                {editingItem ? 'MODIFIER LE PLAT' : 'NOUVEAU PLAT'}
                            </h3>
                            <button onClick={() => setShowItemModal(false)} className="text-gray-400 hover:text-slate-900 transition-colors">
                                <X size={28} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveItem} className="p-6 md:p-10 space-y-6 md:space-y-8 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-4">Appelation du plat</label>
                                    <input
                                        type="text"
                                        required
                                        value={itemName}
                                        onChange={(e) => setItemName(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-slate-50 rounded-[1.5rem] py-4 px-6 text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                                        placeholder="Ex: Burger Signature"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-4">Prix (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={itemPrice}
                                        onChange={(e) => setItemPrice(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-slate-50 rounded-[1.5rem] py-4 px-6 text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-mono shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-4">Catégorie</label>
                                <select
                                    required
                                    value={itemCatId}
                                    onChange={(e) => setItemCatId(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-slate-50 rounded-[1.5rem] py-4 px-6 text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all appearance-none shadow-sm cursor-pointer"
                                >
                                    {categories.map(c => <option key={c.id} value={c.id} className="bg-white">{c.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-4">Description</label>
                                <textarea
                                    value={itemDesc}
                                    onChange={(e) => setItemDesc(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-slate-50 rounded-[1.5rem] py-4 px-6 text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all h-32 resize-none shadow-sm"
                                    placeholder="Ingrédients, allergènes, histoire du plat..."
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-4">Lien de l'image (URL)</label>
                                <input
                                    type="url"
                                    value={itemImage}
                                    onChange={(e) => setItemImage(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-slate-50 rounded-[1.5rem] py-4 px-6 text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                                    placeholder="https://images.unsplash.com/..."
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowItemModal(false)}
                                    className="flex-1 py-4 rounded-2xl bg-gray-100 text-slate-600 font-black uppercase text-[10px] tracking-widest transition-all hover:bg-gray-200"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                                >
                                    {editingItem ? 'Mettre à jour le plat' : 'Créer le plat'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Cat Modal */}
            {showCatModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6">
                    <div className="bg-white w-full max-w-md rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-3xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-6 md:p-10 border-b border-gray-50 flex items-center justify-between shrink-0">
                            <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">
                                {editingCat ? 'MODIFIER CATÉGORIE' : 'NOUVELLE CATÉGORIE'}
                            </h3>
                            <button onClick={() => setShowCatModal(false)} className="text-gray-400 hover:text-slate-900 transition-colors">
                                <X size={28} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveCategory} className="p-6 md:p-10 space-y-6 md:space-y-8 overflow-y-auto">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-4">Nom de la catégorie</label>
                                <input
                                    type="text"
                                    required
                                    value={catName}
                                    onChange={(e) => setCatName(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-slate-50 rounded-[1.5rem] py-4 px-6 text-slate-900 font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                                    placeholder="Ex: Entrées, Plats, Desserts..."
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCatModal(false)}
                                    className="flex-1 py-4 rounded-2xl bg-gray-100 text-slate-600 font-black uppercase text-[10px] tracking-widest transition-all hover:bg-gray-200"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                                >
                                    {editingCat ? 'Enregistrer' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const X: React.FC<{ size: number }> = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
