import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ChefHat, ArrowRight, Check, LayoutDashboard, QrCode, CreditCard, Star, ShieldCheck } from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [authData, setAuthData] = useState({ email: '', password: '' });
    const [restaurantData, setRestaurantData] = useState({ name: '', slug: '' });
    const [setupData, setSetupData] = useState({ tables: 10, categoryName: 'Entrées', itemName: 'Salade César', itemPrice: '12' });
    const [createdRestaurantId, setCreatedRestaurantId] = useState<string | null>(null);

    const handleSelectPlan = async (plan: 'free' | 'standard' | 'premium') => {
        if (!createdRestaurantId) return;
        setLoading(true);

        try {
            if (plan === 'free') {
                // Already set to trial/free by default, just finish
                navigate('/onboarding/success');
                return;
            }

            // For Paid Plans
            const priceId = plan === 'standard'
                ? import.meta.env.VITE_STRIPE_PRICE_ID_STANDARD
                : import.meta.env.VITE_STRIPE_PRICE_ID_PREMIUM;

            // Call Backend API
            const res = await fetch('/api/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId,
                    restaurantId: createdRestaurantId,
                    email: authData.email,
                    successUrl: `${window.location.origin}/onboarding/success`,
                    cancelUrl: window.location.href
                })
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("Erreur lors de la création du paiement");
            }

        } catch (err: any) {
            console.error(err);
            setError("Erreur avec Stripe: " + err.message);
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: authData.email,
                password: authData.password,
            });
            if (error) throw error;
            if (data.user) {
                // Determine next step - ideally wait for session? 
                // For simplicity, we assume auto-signin works or we catch them.
                // If email confirm is off, we are good.
                setStep(2);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRestaurant = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Utilisateur non authentifié. Veuillez vous reconnecter.");

            // 1. Generate ID and Create Restaurant
            // We use client-side ID generation to avoid selecting the row immediately, 
            // bypassing RLS race conditions where the user isn't 'admin' of the restaurant yet.
            const restaurantId = crypto.randomUUID();

            const { error: resError } = await supabase
                .from('restaurants')
                .insert([{
                    id: restaurantId,
                    name: restaurantData.name,
                    slug: restaurantData.slug,
                    subscription_status: 'trial'
                }]);

            if (resError) throw resError;

            // 2. Update Profile with Restaurant ID & Role
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    restaurant_id: restaurantId,
                    role: 'admin'
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 3. Create Basic Data (Tables, Category, Item)
            // Tables
            const tables = Array.from({ length: setupData.tables }, (_, i) => ({
                restaurant_id: restaurantId,
                table_number: `${i + 1}`,
                qr_code_url: `https://tapzy.app/m/${restaurantData.slug}?table=${i + 1}`
            }));
            await supabase.from('tables').insert(tables);

            // Category
            const { data: category } = await supabase
                .from('menus_categories')
                .insert([{
                    restaurant_id: restaurantId,
                    name: setupData.categoryName,
                    display_order: 1
                }])
                .select()
                .single();

            // Item
            if (category) {
                await supabase.from('items').insert([{
                    restaurant_id: restaurantId,
                    category_id: category.id,
                    name: setupData.itemName,
                    price: parseFloat(setupData.itemPrice),
                    is_available: true
                }]);
            }

            setCreatedRestaurantId(restaurantId);
            setStep(3); // Go to Plan Selection

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
            <a href="/" className="absolute top-6 left-6 text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                ← Accueil
            </a>
            <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 relative overflow-hidden">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <ChefHat size={28} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">
                        TAPZY <span className="text-blue-600">SETUP</span>
                    </h1>
                </div>

                {step === 1 && (
                    <form onSubmit={handleSignUp} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Commençons !</h2>
                            <p className="text-slate-500 font-medium">Créez votre compte administrateur pour gérer votre restaurant.</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full h-12 md:h-14 px-4 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-blue-600 focus:ring-0 font-bold text-slate-900 transition-all outline-none placeholder:text-slate-300 placeholder:font-medium"
                                    placeholder="jean@restaurant.com"
                                    value={authData.email}
                                    onChange={e => setAuthData({ ...authData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Mot de passe</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full h-12 md:h-14 px-4 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-blue-600 focus:ring-0 font-bold text-slate-900 transition-all outline-none placeholder:text-slate-300 placeholder:font-medium"
                                    placeholder="••••••••"
                                    value={authData.password}
                                    onChange={e => setAuthData({ ...authData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
                        >
                            {loading ? 'Création...' : (
                                <>
                                    Continuer <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleCreateRestaurant} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Votre Restaurant</h2>
                            <p className="text-slate-500 font-medium">Configurez les informations de base.</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Nom du Restaurant</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full h-12 md:h-14 px-4 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-blue-600 focus:ring-0 font-bold text-slate-900 transition-all outline-none placeholder:text-slate-300 placeholder:font-medium"
                                    placeholder="Le Petit Bistro"
                                    value={restaurantData.name}
                                    onChange={e => setRestaurantData({ ...restaurantData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Identifiant (Slug)</label>
                                <div className="flex items-center">
                                    <span className="h-12 md:h-14 flex items-center px-4 bg-slate-100 rounded-l-xl border-y-2 border-l-2 border-slate-100 text-slate-500 font-bold text-xs md:text-sm whitespace-nowrap">tapzy.app/m/</span>
                                    <input
                                        type="text"
                                        required
                                        className="flex-1 h-12 md:h-14 px-4 bg-slate-50 rounded-r-xl border-2 border-l-0 border-slate-100 focus:border-blue-600 focus:border-l-2 focus:ring-0 font-bold text-slate-900 transition-all outline-none placeholder:text-slate-300 placeholder:font-medium min-w-0"
                                        placeholder="le-petit-bistro"
                                        value={restaurantData.slug}
                                        onChange={e => setRestaurantData({ ...restaurantData, slug: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>



                        <div className="p-6 bg-blue-50/50 rounded-2xl border-2 border-blue-100/50 space-y-4">
                            <p className="text-xs font-black uppercase tracking-widest text-blue-400">Configuration Rapide (modifiable plus tard)</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nombre de tables</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full h-12 px-3 bg-white rounded-lg border-2 border-slate-100 font-bold text-slate-900 focus:border-blue-600 outline-none transition-colors"
                                        value={setupData.tables}
                                        onChange={e => setSetupData({ ...setupData, tables: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">1er article (ex: Café)</label>
                                    <input
                                        type="text"
                                        className="w-full h-12 px-3 bg-white rounded-lg border-2 border-slate-100 font-bold text-slate-900 focus:border-blue-600 outline-none transition-colors"
                                        value={setupData.itemName}
                                        onChange={e => setSetupData({ ...setupData, itemName: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
                        >
                            {loading ? 'Configuration...' : (
                                <>
                                    Terminer & Tester <Check size={20} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Choisissez votre Offre</h2>
                            <p className="text-slate-500 font-medium">Démarrez gratuitement ou passez à la vitesse supérieure.</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {/* FREE */}
                            <button
                                onClick={() => handleSelectPlan('free')}
                                disabled={loading}
                                className="group relative p-6 rounded-2xl border-2 border-slate-100 hover:border-slate-300 transition-all text-left bg-white hover:shadow-lg"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 uppercase">Gratuit</h3>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Jusqu'à 50 commandes/mois</p>
                                    </div>
                                    <span className="text-2xl font-black text-slate-900">0€</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                    <Check size={16} className="text-emerald-500" /> Gestion de base
                                </div>
                            </button>

                            {/* STANDARD */}
                            <button
                                onClick={() => handleSelectPlan('standard')}
                                disabled={loading}
                                className="group relative p-6 rounded-2xl border-2 border-blue-100 hover:border-blue-600 transition-all text-left bg-blue-50/30 hover:shadow-xl hover:shadow-blue-500/10"
                            >
                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-xl">Populaire</div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg font-black text-blue-900 uppercase flex items-center gap-2">Standard <Star size={16} fill="currentColor" className="text-amber-400" /></h3>
                                        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Commandes illimitées</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-slate-900">49€</span>
                                        <span className="text-xs font-bold text-slate-400 block">/mois</span>
                                    </div>
                                </div>
                                <ul className="space-y-1">
                                    <li className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                                        <Check size={14} className="text-blue-500" /> Menu Digital QR
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                                        <Check size={14} className="text-blue-500" /> Paiement à table (Commissions 1%)
                                    </li>
                                </ul>
                            </button>

                            {/* PREMIUM */}
                            <button
                                onClick={() => handleSelectPlan('premium')}
                                disabled={loading}
                                className="group relative p-6 rounded-2xl border-2 border-slate-900 bg-slate-900 text-white hover:scale-[1.01] transition-all text-left shadow-2xl"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase flex items-center gap-2">Premium <ShieldCheck size={16} className="text-emerald-400" /></h3>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tout inclus + Support VIP</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-white">89€</span>
                                        <span className="text-xs font-bold text-slate-500 block">/mois</span>
                                    </div>
                                </div>
                                <ul className="space-y-1">
                                    <li className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                                        <Check size={14} className="text-emerald-400" /> Multi-comptes Staff
                                    </li>
                                    <li className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                                        <Check size={14} className="text-emerald-400" /> Analytics avancés
                                    </li>
                                </ul>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <p className="mt-8 text-slate-400 font-medium text-sm">
                Une question ? <a href="#" className="text-blue-600 font-bold hover:underline">Contactez le support</a>
            </p>
        </div >
    );
};
