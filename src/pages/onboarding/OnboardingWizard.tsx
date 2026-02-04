import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChefHat, ArrowRight, Check, CreditCard } from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
    // const navigate = useNavigate(); // Unused
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [authData, setAuthData] = useState({ email: '', password: '' });
    const [restaurantData, setRestaurantData] = useState({ name: '', slug: '' });
    const [setupData, setSetupData] = useState({ tables: 10 });
    const [calculatedPlan, setCalculatedPlan] = useState<'standard' | 'premium'>('standard');
    const [createdRestaurantId, setCreatedRestaurantId] = useState<string | null>(null);

    // Auto-calculate plan when tables change
    useEffect(() => {
        if (setupData.tables > 10) {
            setCalculatedPlan('premium');
        } else {
            setCalculatedPlan('standard');
        }
    }, [setupData.tables]);

    // Step 1: Sign Up & Create Restaurant Identity
    const handleStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Sign Up
            const { data: authResult, error: authError } = await supabase.auth.signUp({
                email: authData.email,
                password: authData.password,
            });
            if (authError) throw authError;
            if (!authResult.user) throw new Error("Erreur lors de la création du compte.");

            // 2. Create Restaurant with ID
            const restaurantId = crypto.randomUUID();
            const { error: resError } = await supabase
                .from('restaurants')
                .insert([{
                    id: restaurantId,
                    name: restaurantData.name,
                    slug: restaurantData.slug,
                    subscription_status: 'trial' // Default until payment
                }]);
            if (resError) throw resError;

            // 3. Link Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    restaurant_id: restaurantId,
                    role: 'admin' // Make them admin
                })
                .eq('id', authResult.user.id);

            if (profileError) throw profileError;

            // 4. Create Default Categories
            const defaultCategories = [
                { name: 'Entrées', display_order: 1 },
                { name: 'Plats', display_order: 2 },
                { name: 'Desserts', display_order: 3 },
                { name: 'Boissons', display_order: 4 }
            ];

            const { error: catError } = await supabase
                .from('menus_categories')
                .insert(defaultCategories.map(cat => ({
                    restaurant_id: restaurantId,
                    name: cat.name,
                    display_order: cat.display_order
                })));

            if (catError) throw catError;

            setCreatedRestaurantId(restaurantId);
            setStep(2); // Move to Config
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Configuration (Tables)
    const handleStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!createdRestaurantId) throw new Error("Restaurant ID manquant.");

            // Create Tables
            const tables = Array.from({ length: setupData.tables }, (_, i) => ({
                restaurant_id: createdRestaurantId,
                table_number: `${i + 1}`,
                qr_code_url: `https://tapzy.app/m/${restaurantData.slug}?table=${i + 1}`
            }));

            const { error } = await supabase.from('tables').insert(tables);
            if (error) throw error;

            setStep(3); // Move to Plan Calculation
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 4: Payment Trigger
    const handlePayment = async () => {
        if (!createdRestaurantId) return;
        setLoading(true);

        try {
            const priceId = calculatedPlan === 'standard'
                ? import.meta.env.VITE_STRIPE_PRICE_ID_STANDARD
                : import.meta.env.VITE_STRIPE_PRICE_ID_PREMIUM;

            const { data, error } = await supabase.functions.invoke('create-subscription', {
                body: {
                    priceId,
                    restaurantId: createdRestaurantId,
                    email: authData.email,
                    planType: calculatedPlan,
                    successUrl: `${window.location.origin}/onboarding/success`,
                    cancelUrl: window.location.href
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("Erreur de redirection Stripe.");
            }
        } catch (err: any) {
            console.error(err);
            setError("Erreur paiement: " + (err.message || 'Erreur inconnue'));
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
            <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-xl p-6 md:p-12 relative overflow-hidden">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${(step / 4) * 100}%` }}
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

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 mb-6">
                        {error}
                    </div>
                )}

                {/* STEP 1: IDENTITY */}
                {step === 1 && (
                    <form onSubmit={handleStep1} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Identité</h2>
                            <p className="text-slate-500 font-medium">Créez votre compte et votre établissement.</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="email"
                                required
                                className="w-full h-14 px-5 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none font-bold text-slate-900 transition-all"
                                placeholder="Email admin"
                                value={authData.email}
                                onChange={e => setAuthData({ ...authData, email: e.target.value })}
                            />
                            <input
                                type="password"
                                required
                                className="w-full h-14 px-5 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none font-bold text-slate-900 transition-all"
                                placeholder="Mot de passe"
                                value={authData.password}
                                onChange={e => setAuthData({ ...authData, password: e.target.value })}
                            />
                            <div className="h-px bg-slate-100 my-4" />
                            <input
                                type="text"
                                required
                                className="w-full h-14 px-5 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none font-bold text-slate-900 transition-all"
                                placeholder="Nom du Restaurant"
                                value={restaurantData.name}
                                onChange={e => setRestaurantData({ ...restaurantData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })}
                            />
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">tapzy.app/m/</span>
                                <input
                                    type="text"
                                    required
                                    className="w-full h-14 pl-28 pr-5 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none font-bold text-slate-900 transition-all"
                                    placeholder="slug"
                                    value={restaurantData.slug}
                                    onChange={e => setRestaurantData({ ...restaurantData, slug: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Création...' : <>Suivant <ArrowRight size={20} /></>}
                        </button>
                    </form>
                )}

                {/* STEP 2: CONFIGURATION */}
                {step === 2 && (
                    <form onSubmit={handleStep2} className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Combien de tables ?</h2>
                            <p className="text-slate-500 font-medium">Cela déterminera votre plan tarifaire.</p>
                        </div>

                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <span className="text-5xl font-black text-slate-900">{setupData.tables}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={setupData.tables}
                                onChange={e => setSetupData({ tables: parseInt(e.target.value) })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Faites glisser pour ajuster</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Configuration...' : <>Voir mon plan <ArrowRight size={20} /></>}
                        </button>
                    </form>
                )}

                {/* STEP 3: PLAN CALCULATION */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 text-center">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Votre Offre Idéale</h2>
                            <p className="text-slate-500 font-medium">Basée sur votre configuration de {setupData.tables} tables.</p>
                        </div>

                        <div className={`p-8 rounded-[2rem] border-4 transition-all transform hover:scale-105 ${calculatedPlan === 'premium' ? 'border-slate-900 bg-slate-900 text-white' : 'border-blue-600 bg-blue-50 text-slate-900'}`}>
                            <div className="uppercase tracking-[0.3em] font-black text-sm mb-4 opacity-75">
                                {calculatedPlan === 'premium' ? 'Business Class' : 'Standard'}
                            </div>
                            <h3 className="text-5xl font-black mb-2">
                                {calculatedPlan === 'premium' ? '89€' : '49€'}
                                <span className="text-lg font-bold opacity-50">/mois</span>
                            </h3>
                            <p className="font-bold text-lg mb-6 opacity-90">
                                {calculatedPlan === 'premium'
                                    ? 'Pour les grands établissements. Tout illimité + Support VIP.'
                                    : 'Parfait pour démarrer. Commandes illimitées.'}
                            </p>

                            <ul className="text-left space-y-3 mb-8 inline-block">
                                <li className="flex items-center gap-3 font-bold text-sm">
                                    <Check size={18} className={calculatedPlan === 'premium' ? 'text-emerald-400' : 'text-blue-600'} />
                                    {setupData.tables} Tables configurées
                                </li>
                                <li className="flex items-center gap-3 font-bold text-sm">
                                    <Check size={18} className={calculatedPlan === 'premium' ? 'text-emerald-400' : 'text-blue-600'} />
                                    Menu Digital & QR Codes
                                </li>
                                <li className="flex items-center gap-3 font-bold text-sm">
                                    <Check size={18} className={calculatedPlan === 'premium' ? 'text-emerald-400' : 'text-blue-600'} />
                                    Paiement à table (Stripe)
                                </li>
                                {calculatedPlan === 'premium' && (
                                    <li className="flex items-center gap-3 font-bold text-sm">
                                        <Check size={18} className="text-emerald-400" />
                                        Multi-comptes & Stats Avancées
                                    </li>
                                )}
                            </ul>
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={loading}
                            className={`w-full h-14 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${calculatedPlan === 'premium' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}
                        >
                            {loading ? 'Redirection...' : <>Activer mon abonnement <CreditCard size={20} /></>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
