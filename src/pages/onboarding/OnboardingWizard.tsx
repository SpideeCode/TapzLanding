import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ChefHat, ArrowRight, Check, LayoutDashboard, QrCode } from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [authData, setAuthData] = useState({ email: '', password: '' });
    const [restaurantData, setRestaurantData] = useState({ name: '', slug: '' });
    const [setupData, setSetupData] = useState({ tables: 10, categoryName: 'Entrées', itemName: 'Salade César', itemPrice: '12' });

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

            // Redirect to success
            navigate('/onboarding/success');

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 relative overflow-hidden">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${(step / 2) * 100}%` }}
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
                                    className="w-full h-14 px-4 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-blue-600 focus:ring-0 font-bold text-slate-900 transition-all outline-none"
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
                                    className="w-full h-14 px-4 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-blue-600 focus:ring-0 font-bold text-slate-900 transition-all outline-none"
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
                                    className="w-full h-14 px-4 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-blue-600 focus:ring-0 font-bold text-slate-900 transition-all outline-none"
                                    placeholder="Le Petit Bistro"
                                    value={restaurantData.name}
                                    onChange={e => setRestaurantData({ ...restaurantData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Identifiant (Slug)</label>
                                <div className="flex items-center">
                                    <span className="h-14 flex items-center px-4 bg-slate-100 rounded-l-xl border-y-2 border-l-2 border-slate-100 text-slate-500 font-bold text-sm">tapzy.app/m/</span>
                                    <input
                                        type="text"
                                        required
                                        className="flex-1 h-14 px-4 bg-slate-50 rounded-r-xl border-2 border-slate-100 focus:border-blue-600 focus:ring-0 font-bold text-slate-900 transition-all outline-none"
                                        placeholder="le-petit-bistro"
                                        value={restaurantData.slug}
                                        onChange={e => setRestaurantData({ ...restaurantData, slug: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-blue-50/50 rounded-2xl border-2 border-blue-100/50 space-y-4">
                            <p className="text-xs font-black uppercase tracking-widest text-blue-400">Configuration Rapide (modifiable plus tard)</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nombre de tables</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full h-10 px-3 bg-white rounded-lg border-2 border-slate-100 font-bold text-slate-900"
                                        value={setupData.tables}
                                        onChange={e => setSetupData({ ...setupData, tables: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">1er article (ex: Café)</label>
                                    <input
                                        type="text"
                                        className="w-full h-10 px-3 bg-white rounded-lg border-2 border-slate-100 font-bold text-slate-900"
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
            </div>

            <p className="mt-8 text-slate-400 font-medium text-sm">
                Une question ? <a href="#" className="text-blue-600 font-bold hover:underline">Contactez le support</a>
            </p>
        </div>
    );
};
