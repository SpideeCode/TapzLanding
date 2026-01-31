import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CheckCircle, LayoutDashboard, QrCode, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

export const OnboardingSuccess: React.FC = () => {
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const origin = window.location.origin;

    useEffect(() => {
        const fetchRestaurant = async () => {
            try {
                // Force session refresh to ensure latest claims/profile data
                await supabase.auth.refreshSession();

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    navigate('/login');
                    return;
                }
                const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single();

                if (profile?.restaurant_id) {
                    const { data: res, error } = await supabase.from('restaurants').select('*').eq('id', profile.restaurant_id).single();
                    if (error) console.error("Error fetching restaurant:", error);
                    setRestaurant(res);
                } else {
                    console.warn("No restaurant_id found in profile");
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurant();
    }, [navigate]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-slate-400 font-bold">Finalisation de la configuration...</p>
        </div>
    );

    const qrUrl = restaurant ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${origin}/m/${restaurant.slug}?table=1` : '';
    const planName = restaurant?.plan_type === 'premium' ? 'Premium' : 'Standard';

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6 relative">
            <a href="/" className="absolute top-6 left-6 text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest z-50">
                ← Accueil
            </a>
            <div className="max-w-5xl mx-auto space-y-12">

                {/* Header Success */}
                <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-emerald-500/30">
                        <CheckCircle size={40} strokeWidth={3} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4 italic">
                        C'EST <span className="text-emerald-500 not-italic">PRÊT !</span>
                    </h1>
                    <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                        Votre restaurant <span className="text-slate-900 font-black">{restaurant?.name}</span> est actif.
                    </p>

                    <div className="mt-8 flex justify-center gap-4">
                        <span className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest border border-slate-200 flex items-center gap-2 ${restaurant?.subscription_status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {restaurant?.subscription_status === 'active' ? <CheckCircle size={16} /> : <Zap size={16} />}
                            {restaurant?.subscription_status === 'active' ? 'Abonnement Actif' : 'En attente de paiement'}
                        </span>
                        <span className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 text-sm font-black uppercase tracking-widest border border-slate-200 flex items-center gap-2">
                            <ShieldCheck size={16} /> Plan {planName}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Test Zone */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border-2 border-slate-100 relative overflow-hidden group hover:border-blue-600 transition-all duration-300">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-2 rounded-bl-2xl font-black text-[10px] uppercase tracking-widest z-10">
                            Action Requise
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                            <QrCode className="text-blue-600" />
                            Tester mon QR Code
                        </h2>

                        <div className="flex flex-col items-center justify-center space-y-6">
                            <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm group-hover:scale-105 transition-transform duration-500">
                                {restaurant?.slug ? (
                                    <img src={qrUrl} alt="QR Code Test" className="w-48 h-48 rounded-xl" />
                                ) : (
                                    <div className="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center p-4">
                                        {loading ? "Génération..." : "QR non disponible"}
                                    </div>
                                )}
                            </div>
                            <p className="text-center text-slate-400 text-sm font-bold max-w-xs">
                                Scannez ce code avec votre téléphone pour voir le menu client et passer une commande test.
                            </p>
                            {restaurant?.slug && (
                                <a
                                    href={`/m/${restaurant.slug}?table=1`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 font-black text-sm uppercase tracking-widest hover:underline"
                                >
                                    Ou cliquez ici pour ouvrir
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Dashboard Access */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col justify-center text-white group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-20 -mr-20 -mt-20 rounded-full blur-3xl group-hover:opacity-30 transition-opacity duration-700" />

                        <h2 className="text-2xl font-black mb-6 flex items-center gap-3 relative z-10">
                            <LayoutDashboard className="text-blue-400" />
                            Espace Administrateur
                        </h2>
                        <p className="text-slate-300 font-medium mb-8 relative z-10 leading-relaxed">
                            Accédez à votre tableau de bord pour configurer votre menu, gérer vos tables et suivre vos commandes.
                        </p>

                        {/* Use standard anchor to force refresh and break SPA loops */}
                        <a
                            href="/admin"
                            className="bg-blue-600 hover:bg-blue-500 text-white py-4 px-8 rounded-2xl font-black text-center uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/30 relative z-10 flex items-center justify-center gap-2"
                        >
                            Accéder au Dashboard <ArrowRight size={20} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
