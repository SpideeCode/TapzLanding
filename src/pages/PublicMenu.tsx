import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../hooks/useCart';
import {
    ShoppingBag,
    Plus,
    Minus,
    Info,
    CheckCircle2,
    Search,
    MapPin,
    X,
    Clock,
    Box
} from 'lucide-react';
import { DishARView } from '../components/DishARView';

// --- Types ---
interface Restaurant {
    id: string;
    name: string;
    logo_url: string | null;
    slug: string;
    banner_url: string | null;
    primary_color: string | null;
    background_color: string | null;
    font_color: string | null;
    payments_enabled: boolean;
}

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
    model_3d_glb: string | null;
    model_3d_usdz: string | null;
}

interface Table {
    id: string;
    table_number: string;
}

// --- Helpers ---
const isLightColor = (hex: string | null) => {
    if (!hex) return true;
    const c = hex.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // SMPTE C-Y value
    return luma > 128; // Standard threshold
};

export const PublicMenu: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const tableNumber = searchParams.get('t');

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [tables, setTables] = useState<Table[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [showCartModal, setShowCartModal] = useState(false);
    const [showTableModal, setShowTableModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tipAmount, setTipAmount] = useState(0);
    const [tipType, setTipType] = useState<'fixed' | 'percent' | 'custom'>('custom');

    const { cart, addToCart, removeFromCart, totalItems, totalPrice } = useCart(restaurant?.id || '');

    // --- Fetch Data ---
    useEffect(() => {
        const fetchAllData = async () => {
            if (!slug) return;
            setLoading(true);
            try {
                // 1. Restaurant
                const { data: resData, error: resError } = await supabase.from('restaurants').select('*').eq('slug', slug).single();
                if (resError || !resData) throw new Error('Restaurant introuvable');
                setRestaurant(resData);

                // 2. Menu data
                const [catRes, itemRes, tableRes] = await Promise.all([
                    supabase.from('menus_categories').select('*').eq('restaurant_id', resData.id).order('display_order', { ascending: true }),
                    supabase.from('items').select('*').eq('restaurant_id', resData.id).eq('is_available', true),
                    supabase.from('tables').select('id, table_number').eq('restaurant_id', resData.id).order('table_number')
                ]);

                setCategories(catRes.data || []);
                setItems(itemRes.data || []);
                const sortedTables = (tableRes.data || []).sort((a, b) =>
                    a.table_number.localeCompare(b.table_number, undefined, { numeric: true })
                );
                setTables(sortedTables);
                if (catRes.data && catRes.data.length > 0) setActiveCategory(catRes.data[0].id);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
        fetchAllData();
    }, [slug]);

    // --- Table Persistence Logic ---
    useEffect(() => {
        const urlTable = searchParams.get('t');
        if (urlTable) {
            localStorage.setItem(`tapzy_table_${slug}`, urlTable);
        } else {
            const storedTable = localStorage.getItem(`tapzy_table_${slug}`);
            if (storedTable) {
                setSearchParams(prev => {
                    const newParams = new URLSearchParams(prev);
                    newParams.set('t', storedTable);
                    return newParams;
                });
            }
        }
    }, [searchParams, setSearchParams, slug]);

    // Force table selection only if logic above didn't find anything
    useEffect(() => {
        const urlTable = searchParams.get('t');
        if (!loading && !urlTable && tables.length > 0) {
            // Small delay to allow the persistence effect to fire first if applicable
            const timer = setTimeout(() => {
                const stored = localStorage.getItem(`tapzy_table_${slug}`);
                if (!stored) setShowTableModal(true);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [loading, searchParams, tables, slug]);
    // --- Checkout Logic ---
    const handleCheckout = async () => {
        if (!restaurant || cart.length === 0) return;
        if (!tableNumber) {
            setShowTableModal(true);
            return;
        }

        setIsSubmitting(true);
        try {
            // Check if payments are enabled
            if (!restaurant.payments_enabled) {
                throw new Error("Ce restaurant n'a pas encore activé les paiements en ligne.");
            }

            const { data: tableData } = await supabase.from('tables').select('id').eq('restaurant_id', restaurant.id).eq('table_number', tableNumber).single();
            const tableId = tableData?.id || null;

            // Call Stripe Checkout API
            const response = await fetch('/api/create-client-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cart: cart,
                    restaurantId: restaurant.id,
                    tableId: tableId,
                    slug: slug, // Pass slug for cancel_url
                    tipAmount: tipAmount
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Erreur lors du paiement');

            if (data.url) {
                // Redirect to Stripe
                window.location.href = data.url;
            } else {
                throw new Error("Impossible de générer le lien de paiement");
            }

        } catch (err: any) {
            alert('Erreur: ' + err.message);
            setIsSubmitting(false); // Only stop loading if error. If success, we redirect.
        }
    };

    // --- Derived State & Styles ---
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Dynamic Theming
    const primaryColor = restaurant?.primary_color || '#000000';
    const bgColor = restaurant?.background_color || '#FFFFFF';
    const fontColor = restaurant?.font_color || '#1E293B';
    const isBgLight = isLightColor(bgColor);

    // UI Constants
    const cardBg = isBgLight ? 'bg-white' : 'bg-white/10';
    const cardBorder = isBgLight ? 'border-gray-100' : 'border-white/10';
    const inputBg = isBgLight ? 'bg-gray-100' : 'bg-white/10';

    // --- Render Loading ---
    if (loading) return (
        <div className={`min-h-screen flex items-center justify-center ${isBgLight ? 'bg-white' : 'bg-slate-900'}`}>
            <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin opacity-20"></div>
        </div>
    );

    // --- Render Error ---
    if (error || !restaurant) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
            <Info size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">{error || "Menu introuvable"}</p>
        </div>
    );

    // --- Render Success ---
    if (orderSuccess) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center transition-colors duration-500" style={{ backgroundColor: bgColor, color: fontColor }}>
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl mb-6 animate-bounce">
                <CheckCircle2 size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-4">Commande Envoyée !</h1>
            <p className="mb-8 max-w-xs mx-auto opacity-75">On s'occupe de tout. Détendez-vous, ça arrive.</p>
            <button
                onClick={() => setOrderSuccess(false)}
                className="px-8 py-3 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-transform"
                style={{ backgroundColor: primaryColor }}
            >
                Retour au menu
            </button>
        </div>
    );

    // --- Main Render ---
    return (
        <div className={`min-h-screen font-sans selection:bg-black/10 transition-colors duration-300`} style={{ backgroundColor: bgColor, color: fontColor }}>

            {/* Header (Banner / Hero) */}
            <div className="relative">
                {/* Banner Image */}
                <div className="h-[250px] md:h-[350px] w-full overflow-hidden relative">
                    {restaurant.banner_url ? (
                        <div className="w-full h-full relative">
                            <img src={restaurant.banner_url} className="w-full h-full object-cover" alt="Banner" />
                            <div className="absolute inset-0 bg-black/40" /> {/* Always darken banner for text readability */}
                        </div>
                    ) : (
                        <div className="w-full h-full relative" style={{ backgroundColor: primaryColor }}>
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                    )}
                </div>

                {/* Restaurant Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex items-center gap-5">
                        {restaurant.logo_url && (
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-white p-1 rounded-2xl shadow-xl flex-shrink-0">
                                <img src={restaurant.logo_url} className="w-full h-full object-cover rounded-xl" alt="Logo" />
                            </div>
                        )}
                        <div className="text-white drop-shadow-md pb-1">
                            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-1">{restaurant.name}</h1>
                            <div className="flex items-center gap-2 text-sm md:text-base font-medium opacity-90">
                                <span className="bg-emerald-500/90 px-2 py-0.5 rounded textxs font-bold uppercase tracking-wider backdrop-blur-md">Ouvert</span>
                                <span>• Cuisine de passion</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowTableModal(true)}
                        className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-3 hover:bg-white/20 transition-colors"
                    >
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] uppercase opacity-70 tracking-wider font-bold">Votre Table</span>
                            <span className="text-xl font-bold leading-none">{tableNumber || '?'}</span>
                        </div>
                        <MapPin size={20} />
                    </button>
                </div>
            </div>

            {/* Sticky Navigation & Search */}
            <div className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${isBgLight ? 'bg-white/80 border-slate-100' : 'bg-slate-900/80 border-slate-800'}`}>
                <div className="px-6 py-4 space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={18} color={fontColor} />
                        <input
                            type="text"
                            placeholder="Rechercher un plat..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-11 pr-4 py-3 rounded-xl font-medium focus:ring-2 focus:ring-offset-2 transition-all outline-none ${inputBg}`}
                            style={{ ['--tw-ring-color' as any]: primaryColor, color: fontColor }}
                        />
                    </div>

                    {/* Categories Scroll */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
                        <button
                            onClick={() => { setActiveCategory(null); window.scrollTo({ top: 350, behavior: 'smooth' }); }}
                            className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold text-sm transition-all border ${!activeCategory ? `opacity-100 border-current` : `bg-transparent opacity-60 hover:opacity-100`}`}
                            style={!activeCategory ? { backgroundColor: primaryColor, borderColor: primaryColor, color: isLightColor(primaryColor) ? '#000' : '#FFF' } : { borderColor: 'currentColor' }}
                        >
                            TOUT
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setActiveCategory(cat.id);
                                    const el = document.getElementById(cat.id);
                                    if (el) {
                                        const y = el.getBoundingClientRect().top + window.scrollY - 180;
                                        window.scrollTo({ top: y, behavior: 'smooth' });
                                    }
                                }}
                                className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold text-sm transition-all border ${activeCategory === cat.id ? `opacity-100` : `bg-transparent opacity-60 hover:opacity-100`}`}
                                style={activeCategory === cat.id ? { backgroundColor: primaryColor, borderColor: primaryColor, color: isLightColor(primaryColor) ? '#000' : '#FFF' } : { borderColor: 'currentColor' }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Menu Grid */}
            <div className="px-4 py-8 md:px-6 max-w-3xl mx-auto pb-32 space-y-12">
                {categories.map(category => {
                    const categoryItems = filteredItems.filter(i => i.category_id === category.id);
                    if (categoryItems.length === 0) return null;

                    return (
                        <div key={category.id} id={category.id} className="scroll-mt-48">
                            <h3 className="text-2xl font-bold mb-6">{category.name}</h3>
                            <div className="space-y-4">
                                {categoryItems.map(item => (
                                    <div
                                        key={item.id}
                                        className={`group relative flex gap-4 p-4 rounded-2xl transition-all border hover:border-transparent hover:shadow-lg ${cardBg} ${cardBorder}`}
                                    >
                                        <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden relative">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Clock size={24} />
                                                </div>
                                            )}
                                        </div>



                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="text-lg font-bold leading-tight">{item.name}</h4>
                                                    <span className="font-bold">{item.price}€</span>
                                                </div>
                                                <p className="text-sm mt-1 line-clamp-2 leading-relaxed opacity-70">{item.description}</p>
                                            </div>

                                            <div className="flex justify-end pt-2">
                                                <button
                                                    onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, image_url: item.image_url || undefined })}
                                                    className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-all font-bold"
                                                    style={{ backgroundColor: primaryColor, color: isLightColor(primaryColor) ? '#000' : '#FFF' }}
                                                >
                                                    <Plus size={18} />
                                                </button>

                                                {/* Direct 3D Button */}
                                                {item.model_3d_glb && (
                                                    <button
                                                        onClick={() => setSelectedItem(item)}
                                                        className="ml-2 h-8 md:h-10 px-3 rounded-full flex items-center gap-1.5 bg-slate-900 text-white shadow-md active:scale-90 transition-all font-bold text-xs"
                                                    >
                                                        <Box size={14} className="text-blue-400" /> 3D
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Floating Cart Button */}
            {totalItems > 0 && (
                <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 px-4">
                    <button
                        onClick={() => setShowCartModal(true)}
                        className="w-full max-w-md shadow-2xl rounded-2xl py-4 px-6 flex items-center justify-between text-white font-bold transform transition-all active:scale-95 hover:shadow-xl"
                        style={{ backgroundColor: primaryColor, color: isLightColor(primaryColor) ? '#000' : '#FFF' }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 px-3 py-1 rounded-lg text-sm">{totalItems}</div>
                            <span>Voir le panier</span>
                        </div>
                        <span className="text-lg">{totalPrice.toFixed(2)}€</span>
                    </button>
                </div>
            )}

            {/* Table Selection Modal */}
            {showTableModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className={`w-full max-w-sm rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col max-h-[90vh] ${isBgLight ? 'bg-white' : 'bg-slate-900 border border-slate-800'}`}>
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className={`text-xl font-bold`}>Numéro de table</h3>
                            {tableNumber && (
                                <button onClick={() => setShowTableModal(false)} className={`p-2 rounded-full hover:bg-slate-100 ${isBgLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'}`}>
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-4 gap-3 overflow-y-auto min-h-0">
                            {tables.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        setSearchParams({ t: t.table_number });
                                        setShowTableModal(false);
                                    }}
                                    className={`aspect-square rounded-xl font-bold text-lg transition-all ${tableNumber === t.table_number
                                        ? `text-white shadow-lg scale-105`
                                        : `${isBgLight ? 'bg-slate-100 hover:bg-slate-200' : 'bg-slate-800 hover:bg-slate-700'}`
                                        }`}
                                    style={tableNumber === t.table_number ? { backgroundColor: primaryColor, color: isLightColor(primaryColor) ? '#000' : '#FFF' } : { color: fontColor }}
                                >
                                    {t.table_number}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Modal */}
            {showCartModal && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setShowCartModal(false)} />
                    <div className={`relative w-full max-w-md h-full shadow-2xl flex flex-col pt-10 ${isBgLight ? 'bg-white' : 'bg-slate-900'}`} style={{ animation: 'slideInRight 0.3s ease-out', color: fontColor }}>

                        <div className="px-6 pb-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className={`text-2xl font-bold`}>Votre Commande</h2>
                            <button onClick={() => setShowCartModal(false)} className={`p-2 rounded-full ${isBgLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                    <ShoppingBag size={48} className="mb-4" />
                                    <p className="font-medium">Votre panier est vide</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.image_url && <img src={item.image_url} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-sm">{item.name}</h4>
                                                <span className="font-bold">{(item.price * item.quantity).toFixed(2)}€</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"><Minus size={14} /></button>
                                                <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => addToCart(item)} className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Tip Section */}
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                            <h3 className="font-bold mb-3 text-sm opacity-80">Un petit pourboire pour l'équipe ? 💖</h3>

                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {totalPrice < 20 ? (
                                    <>
                                        <button
                                            onClick={() => { setTipAmount(1); setTipType('fixed'); }}
                                            className={`py-2 rounded-lg text-sm font-bold transition-all border ${tipAmount === 1 && tipType === 'fixed' ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}
                                        >
                                            +1€
                                        </button>
                                        <button
                                            onClick={() => { setTipAmount(2); setTipType('fixed'); }}
                                            className={`py-2 rounded-lg text-sm font-bold transition-all border ${tipAmount === 2 && tipType === 'fixed' ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}
                                        >
                                            +2€
                                        </button>
                                        <button
                                            onClick={() => {
                                                const rounded = Math.ceil(totalPrice);
                                                const tip = rounded - totalPrice > 0 ? rounded - totalPrice : 1;
                                                setTipAmount(Number(tip.toFixed(2)));
                                                setTipType('fixed');
                                            }}
                                            className={`col-span-2 py-2 rounded-lg text-sm font-bold transition-all border ${tipType === 'fixed' && tipAmount !== 1 && tipAmount !== 2 && tipAmount > 0 ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}
                                        >
                                            Arrondir ({Math.ceil(totalPrice) === totalPrice ? (totalPrice + 1).toFixed(2) : Math.ceil(totalPrice).toFixed(2)}€)
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {[0.05, 0.10, 0.15].map(pct => (
                                            <button
                                                key={pct}
                                                onClick={() => {
                                                    setTipAmount(Number((totalPrice * pct).toFixed(2)));
                                                    setTipType('percent');
                                                }}
                                                className={`py-2 rounded-lg text-sm font-bold transition-all border ${tipAmount === Number((totalPrice * pct).toFixed(2)) && tipType === 'percent' ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}
                                            >
                                                {pct * 100}%
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => { setTipAmount(0); setTipType('custom'); }}
                                            className={`py-2 rounded-lg text-sm font-bold transition-all border ${tipAmount === 0 && tipType !== 'custom' ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}
                                        >
                                            Non merci
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.10"
                                    placeholder="Autre montant"
                                    value={tipType === 'custom' ? tipAmount || '' : ''}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setTipAmount(isNaN(val) ? 0 : val);
                                        setTipType('custom');
                                    }}
                                    className={`w-full pl-8 pr-4 py-2 rounded-xl border font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${tipType === 'custom' && tipAmount > 0 ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}
                                />
                            </div>
                        </div>

                        <div className={`p-6 border-t ${isBgLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/50 border-slate-800'}`}>
                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between items-center text-sm opacity-60">
                                    <span>Sous-total</span>
                                    <span>{totalPrice.toFixed(2)}€</span>
                                </div>
                                {tipAmount > 0 && (
                                    <div className="flex justify-between items-center text-sm text-emerald-600 font-bold">
                                        <span>Pourboire</span>
                                        <span>+{tipAmount.toFixed(2)}€</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                                    <span className="text-lg font-bold opacity-70">Total à payer</span>
                                    <span className="text-3xl font-bold">{(totalPrice + tipAmount).toFixed(2)}€</span>
                                </div>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={isSubmitting || cart.length === 0}
                                className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: primaryColor, color: isLightColor(primaryColor) ? '#000' : '#FFF' }}
                            >
                                {isSubmitting ? 'Envoi...' : `Payer ${(totalPrice + tipAmount).toFixed(2)}€`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>

            {/* Item Detail Modal with AR */}
            {selectedItem && (
                <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedItem(null)} />
                    <div className="relative bg-white w-full max-w-lg rounded-t-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">

                        {/* Header Image or AR View */}
                        <div className="relative bg-gray-100 shrink-0">
                            {selectedItem.model_3d_glb ? (
                                <div className="aspect-[4/3] w-full">
                                    <DishARView
                                        glbUrl={selectedItem.model_3d_glb}
                                        usdzUrl={selectedItem.model_3d_usdz || undefined}
                                        posterUrl={selectedItem.image_url || undefined}
                                        altText={selectedItem.name}
                                    />
                                </div>
                            ) : (
                                <div className="aspect-video w-full">
                                    {selectedItem.image_url ?
                                        <img src={selectedItem.image_url} className="w-full h-full object-cover" alt={selectedItem.name} />
                                        : <div className="w-full h-full flex items-center justify-center bg-gray-200"><Clock className="opacity-20" size={48} /></div>
                                    }
                                </div>
                            )}

                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-4 right-4 bg-white/50 backdrop-blur-md p-2 rounded-full text-slate-900 shadow-sm z-50 hover:bg-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-tight">
                                    {selectedItem.name}
                                </h2>
                                <span className="text-2xl font-black text-blue-600 tracking-tighter shrink-0">
                                    {selectedItem.price}€
                                </span>
                            </div>

                            <p className="text-gray-500 font-medium leading-relaxed mb-8">
                                {selectedItem.description || "Aucune description détaillée."}
                            </p>

                            <button
                                onClick={() => {
                                    addToCart({ id: selectedItem.id, name: selectedItem.name, price: selectedItem.price, image_url: selectedItem.image_url || undefined });
                                    setSelectedItem(null);
                                }}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                Ajouter au panier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
