import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Save,
    Globe,
    Camera,
    Store,
    Link as LinkIcon,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

interface Restaurant {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
}

export const RestaurantSettings: React.FC = () => {
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    useEffect(() => {
        const fetchRestaurant = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single();
            if (profile?.restaurant_id) {
                const { data: res } = await supabase.from('restaurants').select('*').eq('id', profile.restaurant_id).single();
                if (res) {
                    setRestaurant(res);
                    setName(res.name);
                    setSlug(res.slug);
                    setLogoUrl(res.logo_url || '');
                }
            }
            setLoading(false);
        };
        fetchRestaurant();
    }, []);

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
                    logo_url: logoUrl || null
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

    if (loading) {
        return (
            <div className="py-24 text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-sm" />
                <p className="text-gray-400 font-bold italic text-sm">Chargement des données...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight italic">
                    PARAMÈTRES DU <span className="text-blue-600 not-italic uppercase">Restaurant</span>
                </h1>
                <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[10px] flex items-center gap-2">
                    Personnalisez votre identité de marque en temps réel
                </p>
            </div>

            {message && (
                <div className={`p-8 rounded-[2.5rem] flex items-center gap-4 animate-in zoom-in duration-300 shadow-sm border-2 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <AlertCircle size={24} strokeWidth={2.5} />}
                    <p className="font-black italic text-sm uppercase tracking-tight">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="grid grid-cols-1 gap-12">
                {/* Visual Identity Section */}
                <div className="bg-white rounded-[3rem] border-2 border-slate-200 p-10 space-y-10 shadow-sm relative overflow-hidden active:focus-within:border-blue-600 transition-colors duration-500">
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

                {/* General Info Section */}
                <div className="bg-white rounded-[3rem] border-2 border-slate-200 p-10 space-y-10 shadow-sm relative overflow-hidden">
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

                {/* Digital Menu Link Preview */}
                <div className="bg-blue-600 p-10 rounded-[3rem] flex items-center gap-10 group shadow-2xl shadow-blue-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 -mr-20 -mt-20 rounded-full group-hover:scale-110 transition-transform duration-700" />

                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-blue-600 shadow-xl relative z-10">
                        <Globe size={32} strokeWidth={2.5} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] mb-2">Lien public de votre menu :</h3>
                        <p className="text-2xl font-black text-white italic tracking-tighter">
                            tapzy.app/{slug || '...'}
                        </p>
                    </div>
                    <a
                        href={`/menu/${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-blue-600 transition-all active:scale-90 relative z-10 border border-white/20"
                    >
                        <LinkIcon size={24} strokeWidth={2.5} />
                    </a>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 pb-20">
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
                        {saving ? 'Synchronisation...' : 'Enregistrer les paramètres'}
                    </button>
                </div>
            </form>
        </div>
    );
};
