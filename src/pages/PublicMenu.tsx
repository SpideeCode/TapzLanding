import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../hooks/useCart';
import {
    MapPin,
    X,
    Box,
    Sparkles,
    ShoppingBag,
    Plus,
    Minus,
    Search,
    UtensilsCrossed,
    ArrowRight,
    Info,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
                setCategories(catRes.data || []);

                // Patch items with images if missing (for demo/dev)
                const patchedItems = (itemRes.data || []).map(item => {
                    // Force Burger Image
                    if (item.name.toLowerCase().includes('burger') && !item.image_url) {
                        return { ...item, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' };
                    }
                    return item;
                });
                setItems(patchedItems);
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

    // Lock Body Scroll when Modal is Open
    useEffect(() => {
        if (selectedItem || showCartModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedItem, showCartModal]);

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
                    cart: cart.map(item => ({ id: item.id, quantity: item.quantity })),
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

    // --- Gastronomic Theme (Light Mode) ---
    const primaryColor = '#F59E0B'; // Amber
    const bgColor = '#FFFFFF';      // White
    const fontColor = '#0F172A';    // Slate 900
    const isBgLight = true;         // Light Mode
    const inputBg = 'bg-slate-100'; // Light gray inputs

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                damping: 20,
                stiffness: 100
            } as any
        }
    };

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
                {/* Background Texture Overlay (Light) */}
                <div className="fixed inset-0 pointer-events-none z-[-1] opacity-50" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/cream-paper.png")` }}></div>
                {/* Banner Image - Natural Fit */}
                <div className="h-[250px] md:h-[400px] w-full overflow-hidden relative">
                    {restaurant.banner_url ? (
                        <div className="w-full h-full relative">
                            <img src={restaurant.banner_url} className="w-full h-full object-cover" alt="Banner" />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                        </div>
                    ) : (
                        <div className="w-full h-full relative">
                            {/* Mock data for an item, if needed for testing purposes: */}
                            {/* { id: '1', name: 'Burger Signature', price: 14.50, category: 'Plats', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', model_3d_glb: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', description: 'Un burger juteux avec du fromage fondant et notre sauce secrète, servi avec des frites maison.' } */}
                            <img
                                src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80"
                                className="w-full h-full object-cover opacity-90"
                                alt="Default Banner"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                        </div>
                    )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="flex items-center gap-6">
                        {restaurant.logo_url && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-24 h-24 md:w-32 md:h-32 bg-white p-1 rounded-[2rem] shadow-xl flex-shrink-0"
                            >
                                <img src={restaurant.logo_url} className="w-full h-full object-cover rounded-[1.8rem]" alt="Logo" />
                            </motion.div>
                        )}
                        <div className="text-slate-900 drop-shadow-sm">
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl md:text-7xl font-serif font-bold tracking-tight mb-2"
                            >
                                {restaurant.name}
                            </motion.h1>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="flex items-center gap-3 text-sm md:text-lg font-medium"
                            >
                                <span className="bg-amber-100 text-amber-600 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                                    Gastronomie
                                </span>
                                <span className="opacity-70 flex items-center gap-1 font-medium">
                                    <UtensilsCrossed size={16} /> Cuisine de passion
                                </span>
                            </motion.div>
                        </div>
                    </div>

                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setShowTableModal(true)}
                        className="bg-white/80 backdrop-blur-md border border-slate-200 text-slate-800 px-6 py-3 rounded-2xl flex items-center gap-4 hover:bg-white transition-all shadow-lg group"
                    >
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] uppercase opacity-60 tracking-[0.2em] font-black text-slate-500">N° Table</span>
                            <span className="text-2xl font-black leading-none">{tableNumber || '?'}</span>
                        </div>
                        <div className="p-2 bg-amber-500 text-white rounded-xl shadow-md group-hover:scale-110 transition-transform">
                            <MapPin size={22} />
                        </div>
                    </motion.button>
                </div>
            </div>

            {/* Sticky Navigation & Search */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl transition-all duration-300"
            >
                <div className="px-6 py-5 space-y-5">
                    {/* Search Input - Refined Glassmorphism */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity" size={20} color={fontColor} />
                        <input
                            type="text"
                            placeholder="Une envie particulière ?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-12 pr-4 py-4 rounded-2xl font-medium focus:ring-1 focus:ring-amber-500/50 transition-all outline-none border border-transparent shadow-inner ${inputBg}`}
                            style={{ color: fontColor }}
                        />
                    </div>

                    {/* Categories Scroll - Elegant Pill Buttons */}
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
                        <button
                            onClick={() => { setActiveCategory(null); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-xs tracking-widest uppercase transition-all border ${!activeCategory ? `bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20` : `border-white/10 opacity-40 hover:opacity-100 hover:border-white/20`}`}
                        >
                            Tout Explorer
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setActiveCategory(cat.id);
                                    const el = document.getElementById(cat.id);
                                    if (el) {
                                        const y = el.getBoundingClientRect().top + window.scrollY - 200;
                                        window.scrollTo({ top: y, behavior: 'smooth' });
                                    }
                                }}
                                className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-xs tracking-widest uppercase transition-all border ${activeCategory === cat.id ? `bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20` : `border-white/10 opacity-40 hover:opacity-100 hover:border-white/20`}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Menu Grid - Food-Porn Aesthetic */}
            <div className="px-4 py-8 md:px-6 max-w-4xl mx-auto pb-40 space-y-20">
                {categories.map((category) => {
                    const categoryItems = filteredItems.filter(item => item.category_id === category.id);
                    if (categoryItems.length === 0) return null;

                    return (
                        <div key={category.id} id={category.id} className="scroll-mt-40">
                            <h2
                                className="text-3xl md:text-5xl font-serif font-bold mb-10 pl-4 border-l-4 border-amber-500 italic"
                                style={{ color: fontColor }}
                            >
                                {category.name}
                            </h2>

                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-50px" }}
                                className="grid grid-cols-1 gap-6" // Wider cards - restored to full width list for mobile, grid on very large screens if needed but user said "trop petits en largeur" for cards
                            >
                                {categoryItems.map((item, index) => {
                                    // Chef's Choice Logic (Mock: 1st, 5th, 8th item)
                                    const isChefsChoice = [0, 4, 7].includes(index);

                                    // Price Formatting
                                    const [priceInt, priceDec] = item.price.toFixed(2).split('.');

                                    return (
                                        <motion.div
                                            key={item.id}
                                            variants={itemVariants}
                                            className="group relative bg-white rounded-[1.5rem] overflow-hidden shadow-lg hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 border border-slate-100 flex flex-row h-32 md:h-40" // Fixed height for list view consistency
                                        >
                                            {/* Thumbnail Image */}
                                            <div className="w-32 md:w-48 shrink-0 relative overflow-hidden">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                        <UtensilsCrossed size={24} className="text-slate-300" />
                                                    </div>
                                                )}

                                                {/* Chef's Choice Badge (Small) */}
                                                {isChefsChoice && (
                                                    <div className="absolute top-2 left-2 bg-white text-amber-600 p-1.5 rounded-full shadow-md z-10 border border-slate-100">
                                                        <Sparkles size={12} className="text-amber-500 fill-amber-500" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 p-4 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                        <h3 className="text-lg font-serif font-bold text-slate-900 leading-tight line-clamp-2">
                                                            {item.name}
                                                        </h3>
                                                        <span className="flex items-start text-amber-600 font-sans font-bold leading-none shrink-0">
                                                            <span className="text-lg">{priceInt}</span>
                                                            <span className="text-xs mt-0.5">,{priceDec}€</span>
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2 mb-2">
                                                        {item.description}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 mt-auto h-12">
                                                    {/* AR Button (Large) */}
                                                    {(item.model_3d_glb || item.model_3d_usdz) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedItem(item);
                                                            }}
                                                            className="w-full h-full rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 flex flex-col items-center justify-center text-orange-600 transition-colors shadow-sm active:scale-95 gap-0.5"
                                                        >
                                                            <Box size={20} className="stroke-[2.5]" />
                                                            <span className="text-[10px] font-black uppercase tracking-wider leading-none">Voir 3D</span>
                                                        </button>
                                                    )}

                                                    {/* Add to Cart / Quantity Control */}
                                                    {(() => {
                                                        const cartItem = cart.find(c => c.id === item.id);
                                                        const quantity = cartItem ? cartItem.quantity : 0;

                                                        if (quantity > 0) {
                                                            return (
                                                                <div className={`h-full bg-orange-500 rounded-xl flex items-center justify-between px-3 text-white shadow-sm transition-all ${!item.model_3d_glb && !item.model_3d_usdz ? 'col-span-2' : ''}`}>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                                                        className="w-8 h-full flex items-center justify-center hover:bg-orange-600 rounded-l-md transition-colors active:scale-90"
                                                                    >
                                                                        <Minus size={18} strokeWidth={3} />
                                                                    </button>
                                                                    <span className="font-black text-lg">{quantity}</span>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); addToCart({ id: item.id, name: item.name, price: item.price, image_url: item.image_url || undefined }); }}
                                                                        className="w-8 h-full flex items-center justify-center hover:bg-orange-600 rounded-r-md transition-colors active:scale-90"
                                                                    >
                                                                        <Plus size={18} strokeWidth={3} />
                                                                    </button>
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); addToCart({ id: item.id, name: item.name, price: item.price, image_url: item.image_url || undefined }); }}
                                                                className={`h-full bg-slate-900 hover:bg-black text-white rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm ${!item.model_3d_glb && !item.model_3d_usdz ? 'col-span-2' : ''}`}
                                                            >
                                                                <span>Ajouter</span>
                                                                <Plus size={16} strokeWidth={3} />
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
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
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col max-h-[90vh] bg-white border border-slate-100">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-xl font-bold text-slate-900">Numéro de table</h3>
                            {tableNumber && (
                                <button onClick={() => setShowTableModal(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
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
                                        : `bg-slate-100 hover:bg-slate-200 text-slate-700`
                                        }`}
                                    style={tableNumber === t.table_number ? { backgroundColor: primaryColor } : {}}
                                >
                                    {t.table_number}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Cart Button (Gastronomic Light) */}
            <AnimatePresence>
                {totalItems > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 left-6 right-6 z-50 max-w-md mx-auto"
                    >
                        <button
                            onClick={() => setShowCartModal(true)}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-[2rem] shadow-2xl shadow-orange-500/40 flex items-center justify-between group overflow-hidden relative transition-all active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 via-white/10 to-orange-600/0 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="bg-white text-orange-600 font-black w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-md">
                                    {totalItems}
                                </div>
                                <div className="text-left">
                                    <div className="text-xs text-orange-100 font-bold uppercase tracking-widest mb-0.5">Votre commande</div>
                                    <div className="font-serif text-xl font-bold text-white drop-shadow-sm">{totalPrice.toFixed(2)}€</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pr-2 relative z-10">
                                <span className="text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:block hidden text-orange-50">
                                    Voir le panier
                                </span>
                                <div className="bg-white/20 p-3 rounded-full group-hover:bg-white group-hover:text-orange-600 transition-colors">
                                    <ShoppingBag size={24} />
                                </div>
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart Modal (Light Theme & Upsell) */}
            {showCartModal && (
                <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center sm:p-4 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCartModal(false)} />
                    <div className="relative bg-white w-full max-w-lg md:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-slate-100">

                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-slate-900 italic">Votre Sélection</h2>
                                <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mt-1">Moment gourmand</p>
                            </div>
                            <button onClick={() => setShowCartModal(false)} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50">
                            {/* Upselling Suggestion */}
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-4">
                                <div className="text-2xl">🍰</div>
                                <div className="flex-1">
                                    <h4 className="text-slate-900 font-bold text-sm">Une petite douceur ?</h4>
                                    <p className="text-slate-500 text-xs">Nos desserts sont faits maison.</p>
                                </div>
                                <button
                                    onClick={() => { setShowCartModal(false); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }}
                                    className="bg-amber-500 text-black text-xs font-bold px-3 py-2 rounded-lg hover:bg-amber-400 transition-colors shadow-sm"
                                >
                                    Voir
                                </button>
                            </div>

                            {cart.length === 0 ? (
                                <div className="text-center py-12 opacity-50">
                                    <ShoppingBag size={48} className="mx-auto mb-4 text-slate-400" />
                                    <p className="text-slate-500 font-medium">Votre panier est vide</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                                            {item.image_url ?
                                                <img src={item.image_url} className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center text-slate-300"><UtensilsCrossed /></div>
                                            }
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-900 leading-tight pr-2">{item.name}</h4>
                                                <span className="font-serif font-bold text-amber-600">{item.price}€</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2">
                                                <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"><Minus size={14} /></button>
                                                <span className="text-sm font-bold w-4 text-center text-slate-900">{item.quantity}</span>
                                                <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Tip & Checkout */}
                        <div className="p-6 bg-white border-t border-slate-100">
                            {/* Tipping Section - Restored */}
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-900 mb-3">Pourboire pour l'équipe ❤️</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 5, 10, 15].map((tipPercent) => {
                                        const amount = totalPrice * (tipPercent / 100);
                                        const isSelected = Math.abs(tipAmount - amount) < 0.01;
                                        return (
                                            <button
                                                key={tipPercent}
                                                onClick={() => setTipAmount(amount)}
                                                className={`py-3 rounded-xl text-xs font-black transition-all border ${isSelected
                                                    ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20 scale-105'
                                                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-amber-500 hover:text-amber-500'
                                                    }`}
                                            >
                                                {tipPercent === 0 ? 'Non' : `${tipPercent}%`}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center text-sm text-slate-500">
                                    <span>Sous-total</span>
                                    <span>{totalPrice.toFixed(2)}€</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-200">
                                    <span className="text-lg font-bold text-slate-900">Total</span>
                                    <span className="text-3xl font-serif font-black text-amber-600">{(totalPrice + tipAmount).toFixed(2)}€</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isSubmitting || cart.length === 0}
                                className="w-full py-5 rounded-2xl relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-[#1A1A1B] group-hover:bg-black transition-colors" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                                <div className="relative flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest text-sm">
                                    {isSubmitting ? 'Envoi en cours...' : 'Commander et Payer'}
                                    <ArrowRight size={18} />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Outfit:wght@300;400;600;900&display=swap');
                
                .font-serif { font-family: 'Playfair Display', serif; }
                .font-sans { font-family: 'Outfit', sans-serif; }

                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes shimmer {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
            `}</style>

            {/* Item Detail Modal with AR */}
            {selectedItem && (
                <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedItem(null)} />
                    <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-slate-100">

                        {/* Header Image or AR View */}
                        <div className="relative bg-slate-100 shrink-0">
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
                                        : <div className="w-full h-full flex items-center justify-center bg-slate-200"><Clock className="opacity-20 text-slate-400" size={48} /></div>
                                    }
                                </div>
                            )}

                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2 rounded-full text-slate-900 shadow-sm z-50 hover:bg-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-3xl font-serif font-black text-slate-900 italic tracking-tighter uppercase leading-tight">
                                    {selectedItem.name}
                                </h2>
                                <span className="text-3xl font-black tracking-tighter shrink-0 text-amber-600 font-sans">
                                    {selectedItem.price}€
                                </span>
                            </div>

                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                {selectedItem.description || "Aucune description détaillée."}
                            </p>

                            {/* Dynamic Add to Cart Button in Modal */}
                            {(() => {
                                const cartItem = cart.find(c => c.id === selectedItem.id);
                                const quantity = cartItem ? cartItem.quantity : 0;

                                if (quantity > 0) {
                                    return (
                                        <div className="w-full h-16 bg-orange-500 rounded-[1.5rem] flex items-center justify-between px-6 text-white shadow-xl shadow-orange-500/20">
                                            <button
                                                onClick={() => removeFromCart(selectedItem.id)}
                                                className="w-12 h-12 flex items-center justify-center hover:bg-orange-600 rounded-full transition-colors active:scale-95"
                                            >
                                                <Minus size={24} strokeWidth={3} />
                                            </button>
                                            <span className="font-black text-3xl font-sans">{quantity}</span>
                                            <button
                                                onClick={() => addToCart({ id: selectedItem.id, name: selectedItem.name, price: selectedItem.price, image_url: selectedItem.image_url || undefined })}
                                                className="w-12 h-12 flex items-center justify-center hover:bg-orange-600 rounded-full transition-colors active:scale-95"
                                            >
                                                <Plus size={24} strokeWidth={3} />
                                            </button>
                                        </div>
                                    );
                                }

                                return (
                                    <button
                                        onClick={() => addToCart({ id: selectedItem.id, name: selectedItem.name, price: selectedItem.price, image_url: selectedItem.image_url || undefined })}
                                        className="w-full py-4 text-white bg-orange-500 rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all hover:bg-orange-600 flex items-center justify-center gap-3"
                                    >
                                        <span>Ajouter au panier</span>
                                        <div className="bg-white/20 p-1 rounded-full"><Plus size={16} strokeWidth={3} /></div>
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};
