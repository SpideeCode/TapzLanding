import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Save,
    Globe,
    Camera,
    Store,
    Link as LinkIcon,
    AlertCircle,
    CheckCircle2,
    Lock,
    CreditCard,
    ArrowRight,
    Users,
    Palette,
    Settings
} from 'lucide-react';

interface Restaurant {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    staff_access_code: string | null;
    banner_url: string | null;
    primary_color: string | null;
    background_color: string | null;
    font_color: string | null;
    subscription_status: string | null;
    stripe_connect_id: string | null;
    payments_enabled: boolean;
    plan_type: 'standard' | 'premium' | 'free' | null;
}

export const RestaurantSettings: React.FC<{ restaurantId?: string }> = ({ restaurantId: propRestaurantId }) => {
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingPin, setSavingPin] = useState(false);
    const [actionLoading, setActionLoading] = useState(false); // For connect/subscription buttons
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'monetization' | 'staff'>('general');

    // Form fields
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#2563EB');
    const [backgroundColor, setBackgroundColor] = useState('#FDFDFD');
    const [fontColor, setFontColor] = useState('#1E293B');
    const [staffCode, setStaffCode] = useState('');

    useEffect(() => {
        const fetchRestaurant = async () => {
            let targetRestaurantId = propRestaurantId;

            if (!targetRestaurantId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single();
                if (profile?.restaurant_id) {
                    targetRestaurantId = profile.restaurant_id;
                }
            }

            if (targetRestaurantId) {
                const { data: res } = await supabase.from('restaurants').select('*').eq('id', targetRestaurantId).single();
                if (res) {
                    setRestaurant(res);
                    setName(res.name);
                    setSlug(res.slug);
                    setLogoUrl(res.logo_url || '');
                    setBannerUrl(res.banner_url || '');
                    setPrimaryColor(res.primary_color || '#2563EB');
                    setBackgroundColor(res.background_color || '#FDFDFD');
                    setFontColor(res.font_color || '#1E293B');
                    setStaffCode(res.staff_access_code || '');
                }
            }
            setLoading(false);
        };
        fetchRestaurant();
    }, [propRestaurantId]);

    const handleSavePin = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!restaurant) return;
        setSavingPin(true);
        setMessage(null);
        try {
            const { data, error } = await supabase.rpc('update_staff_access_code', { new_code: staffCode || null });
            if (error) throw error;
            if (data && !data.success) throw new Error(data.message || 'Erreur inconnue');
            setMessage({ type: 'success', text: 'Code PIN mis à jour avec succès !' });
        } catch (error: any) {
            console.error('Error saving PIN:', error);
            setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour du PIN.' });
        } finally {
            setSavingPin(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant) return;

        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('restaurants')
                .update({
                    name,
                    slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                    logo_url: logoUrl || null,
                    banner_url: bannerUrl || null,
                    primary_color: primaryColor,
                    background_color: backgroundColor,
                    font_color: fontColor
                })
                .eq('id', restaurant.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Paramètres mis à jour avec succès !' });
        } catch (error: any) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: error.message || 'Une erreur est survenue.' });
        } finally {
            setSaving(false);
        }
    };

    const handleConnectStripe = async () => {
        if (!restaurant) return;
        setActionLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const res = await fetch('/api/connect-onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId: restaurant.id,
                    email: user?.email
                })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("Erreur lors de la génération du lien Connect.");
            }
        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: error.message });
            setActionLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        if (!restaurant) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/get-portal-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId: restaurant.id
                })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("Erreur lors de la génération du lien Portail.");
            }
        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: error.message });
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="py-24 text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-sm" />
                <p className="text-gray-400 font-bold italic text-sm">Chargement des données...</p>
            </div>
        );
    }

    const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2'
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
                }`}
        >
            <Icon size={16} strokeWidth={2.5} />
            <span className="hidden md:inline">{label}</span>
        </button>
    );

    return (
        <div className="max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight italic">
                    PARAMÈTRES
                </h1>
                <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[10px] flex items-center gap-2">
                    Gérez votre restaurant
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-4 pb-4">
                <TabButton id="general" label="Général" icon={Settings} />
                <TabButton id="branding" label="Identité & Marque" icon={Palette} />
                <TabButton id="staff" label="Équipe & Accès" icon={Users} />
                <TabButton id="monetization" label="Monétisation" icon={CreditCard} />
            </div>

            {message && (
                <div className={`p-8 rounded-[2.5rem] flex items-center gap-4 animate-in zoom-in duration-300 shadow-sm border-2 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <AlertCircle size={24} strokeWidth={2.5} />}
                    <p className="font-black italic text-sm uppercase tracking-tight">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-12">

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                        {/* Digital Menu Link Preview */}
                        <div className="bg-blue-600 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] flex items-center gap-10 group shadow-2xl shadow-blue-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 -mr-20 -mt-20 rounded-full group-hover:scale-110 transition-transform duration-700" />
                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-blue-600 shadow-xl relative z-10">
                                <Globe size={32} strokeWidth={2.5} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] mb-2">Lien public de votre menu :</h3>
                                <p className="text-2xl font-black text-white italic tracking-tighter">
                                    tapzy.app/m/{slug || '...'}
                                </p>
                            </div>
                            <a
                                href={`/m/${slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-blue-600 transition-all active:scale-90 relative z-10 border border-white/20"
                            >
                                <LinkIcon size={24} strokeWidth={2.5} />
                            </a>
                        </div>

                        {/* General Info Section */}
                        <div className="bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-slate-200 p-6 md:p-10 space-y-10 shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-8">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 border-2 border-white shadow-sm">
                                    <Store size={24} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Informations Générales</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Nom de l'établissement</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 rounded-[1.5rem] py-5 px-8 text-slate-900 text-lg font-black italic focus:outline-none focus:border-blue-600 transition-all shadow-sm"
                                        placeholder="Ex: L'Atelier Gourmand"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Lien d'accès (Slug)</label>
                                    <div className="relative">
                                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl italic select-none">/</span>
                                        <input
                                            type="text"
                                            required
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value)}
                                            className="w-full bg-white border-2 border-slate-200 rounded-[1.5rem] py-5 pl-12 pr-8 text-slate-900 text-lg font-black italic focus:outline-none focus:border-blue-600 transition-all shadow-sm"
                                            placeholder="nom-du-resto"
                                        />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4 italic">Utilisé pour l'URL de votre menu digital</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full md:w-auto bg-slate-900 hover:bg-black disabled:bg-gray-200 text-white px-12 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/10 transition-all active:scale-95 group"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save size={20} className="group-hover:scale-110 transition-transform" strokeWidth={3} />
                                )}
                                {saving ? 'Synchronisation...' : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </div>
                )}


                {/* BRANDING TAB */}
                {activeTab === 'branding' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                        {/* Visual Identity Section */}
                        <div className="bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-slate-200 p-6 md:p-10 space-y-10 shadow-sm relative overflow-hidden active:focus-within:border-blue-600 transition-colors duration-500">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl pointer-events-none opacity-50" />

                            <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-8">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                                    <Camera size={24} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Identité Visuelle</h2>
                            </div>

                            <div className="flex flex-col md:flex-row gap-10 items-start">
                                <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-200 shrink-0 overflow-hidden group shadow-inner">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <Store size={40} strokeWidth={1.5} />
                                    )}
                                </div>
                                <div className="flex-1 space-y-4 w-full">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">URL de votre logo</label>
                                    <input
                                        type="url"
                                        value={logoUrl}
                                        onChange={(e) => setLogoUrl(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 rounded-[1.5rem] py-4 px-8 text-slate-900 font-bold focus:outline-none focus:border-blue-600 transition-all placeholder:text-gray-300 shadow-sm"
                                        placeholder="https://votre-site.com/logo.png"
                                    />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4 italic">Format recommandé: PNG ou SVG (carré) avec fond transparent</p>
                                </div>
                            </div>
                        </div>

                        {/* Branding Customization Section */}
                        <div className="bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-slate-200 p-6 md:p-10 space-y-10 shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-8">
                                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 border-2 border-white shadow-sm">
                                    <Palette size={24} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Personnalisation</h2>
                            </div>

                            <div className="space-y-8">
                                {/* Banner */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Bannière (URL)</label>
                                    <input
                                        type="url"
                                        value={bannerUrl}
                                        onChange={(e) => setBannerUrl(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 rounded-[1.5rem] py-4 px-8 text-slate-900 font-bold focus:outline-none focus:border-purple-600 transition-all placeholder:text-gray-300 shadow-sm"
                                        placeholder="https://votre-site.com/banniere.jpg"
                                    />
                                </div>

                                {/* Colors */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Couleur Principale</label>
                                        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[1.5rem] border-2 border-slate-100">
                                            <input
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="w-16 h-16 rounded-2xl border-none cursor-pointer p-1 bg-white shadow-sm"
                                            />
                                            <span className="font-black text-slate-600 uppercase tracking-widest text-sm">{primaryColor}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Couleur de Fond</label>
                                        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[1.5rem] border-2 border-slate-100">
                                            <input
                                                type="color"
                                                value={backgroundColor}
                                                onChange={(e) => setBackgroundColor(e.target.value)}
                                                className="w-16 h-16 rounded-2xl border-none cursor-pointer p-1 bg-white shadow-sm"
                                            />
                                            <span className="font-black text-slate-600 uppercase tracking-widest text-sm">{backgroundColor}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Couleur du Texte</label>
                                        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[1.5rem] border-2 border-slate-100">
                                            <input
                                                type="color"
                                                value={fontColor}
                                                onChange={(e) => setFontColor(e.target.value)}
                                                className="w-16 h-16 rounded-2xl border-none cursor-pointer p-1 bg-white shadow-sm"
                                            />
                                            <span className="font-black text-slate-600 uppercase tracking-widest text-sm">{fontColor}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full md:w-auto bg-slate-900 hover:bg-black disabled:bg-gray-200 text-white px-12 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/10 transition-all active:scale-95 group"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save size={20} className="group-hover:scale-110 transition-transform" strokeWidth={3} />
                                )}
                                {saving ? 'Synchronisation...' : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </div>
                )}


                {/* MONETIZATION TAB */}
                {activeTab === 'monetization' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                        {/* Monetization Section */}
                        <div className="bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-slate-200 p-6 md:p-10 space-y-10 shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-8">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border-2 border-white shadow-sm">
                                    <CreditCard size={24} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Monétisation</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Subscription Status */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Abonnement</h3>
                                    <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-500">Plan Actuel</span>
                                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${restaurant?.plan_type === 'premium' ? 'bg-slate-900 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                                {restaurant?.plan_type === 'premium' ? 'Premium' : 'Standard'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-500">Statut</span>
                                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${restaurant?.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {restaurant?.subscription_status === 'active' ? 'Actif' : restaurant?.subscription_status || 'Inconnu'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleManageSubscription}
                                            disabled={actionLoading}
                                            className="w-full py-4 mt-2 bg-white border-2 border-slate-200 hover:border-blue-600 text-slate-900 hover:text-blue-600 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-sm"
                                        >
                                            Gérer l'abonnement
                                        </button>
                                    </div>
                                </div>

                                {/* Stripe Connect Status */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Paiements Clients</h3>
                                    <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 flex flex-col gap-4 h-full justify-between">
                                        <p className="text-sm font-medium text-slate-500">
                                            Recevez les paiements directement sur votre compte bancaire via Stripe.
                                        </p>
                                        {restaurant?.payments_enabled ? (
                                            <div className="flex items-center gap-3 text-emerald-600 font-black uppercase tracking-widest text-xs bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                                <CheckCircle2 size={16} /> Compte actif & relié
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleConnectStripe}
                                                disabled={actionLoading}
                                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                            >
                                                Activer les paiements <ArrowRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* STAFF TAB */}
                {activeTab === 'staff' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                        {/* Staff Access Section */}
                        <div className="bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-slate-200 p-6 md:p-10 space-y-10 shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-8">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 border-2 border-white shadow-sm">
                                    <Lock size={24} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Accès Staff</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Code PIN (4-6 chiffres)</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={staffCode}
                                        onChange={(e) => setStaffCode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-white border-2 border-slate-200 rounded-[1.5rem] py-5 px-8 text-slate-900 text-lg font-black italic focus:outline-none focus:border-blue-600 transition-all shadow-sm tracking-widest"
                                        placeholder="1234"
                                    />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4 italic">Code utilisé par vos serveurs pour se connecter</p>
                                </div>
                                <div className="pb-4">
                                    <button
                                        onClick={handleSavePin}
                                        disabled={savingPin}
                                        type="button"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group mb-4"
                                    >
                                        {savingPin ? '...' : 'Enregistrer le Code PIN'}
                                        {!savingPin && <Lock size={16} strokeWidth={2.5} />}
                                    </button>
                                </div>
                            </div>
                            {/* QR Code For Staff */}
                            <div className="pt-8 border-t-2 border-slate-100 flex flex-col md:flex-row items-center gap-8">
                                <div className="bg-slate-900 p-4 rounded-3xl shadow-lg">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${window.location.origin}/staff/${slug}/login`}
                                        alt="QR Code Staff"
                                        className="w-32 h-32 rounded-xl"
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <h3 className="font-black text-slate-900 text-lg">QR Code d'accès Staff</h3>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                        Imprimez ce QR Code et affichez-le en cuisine. Vos employés n'auront qu'à le scanner pour accéder directement à la page de connexion de votre restaurant.
                                    </p>
                                    <div className="flex items-center gap-2 mt-4">
                                        <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                            {window.location.origin}/staff/{slug}/login
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form >
        </div >
    );
};
