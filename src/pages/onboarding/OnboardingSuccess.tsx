import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CheckCircle, LayoutDashboard, QrCode, ArrowRight, Star, ShieldCheck, Zap } from 'lucide-react';

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

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
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
                        Votre restaurant <span className="text-slate-900 font-black">{restaurant?.name}</span> est configuré en mode <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-black text-sm uppercase tracking-wider">Essai</span>.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Test Zone */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border-2 border-slate-100 relative overflow-hidden group hover:border-blue-600 transition-all duration-300">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-2 rounded-bl-2xl font-black text-[10px] uppercase tracking-widest z-10">
                            Action Requise
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                            <QrCode className="text-blue-600" />
                            Start Test
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
                            Accédez à votre tableau de bord pour voir les commandes arriver en temps réel.
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

                {/* Pricing Plans */}
                <div className="pt-12 border-t-2 border-slate-100">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-slate-900 mb-4">Passez au niveau supérieur</h2>
                        <p className="text-slate-500 font-medium">Choisissez un plan pour activer votre restaurant en production.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Starter */}
                        <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Démarrage</span>
                            <div className="mt-4 mb-6">
                                <span className="text-4xl font-black text-slate-900">29€</span>
                                <span className="text-slate-400 font-bold">/mois</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <CheckCircle size={16} className="text-emerald-500" /> Jusqu'à 15 tables
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <CheckCircle size={16} className="text-emerald-500" /> Menu illimité
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <CheckCircle size={16} className="text-emerald-500" /> Support email
                                </li>
                            </ul>
                            <button className="w-full py-4 rounded-xl border-2 border-slate-200 font-black text-xs uppercase tracking-widest hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all">
                                Choisir ce plan
                            </button>
                        </div>

                        {/* Pro (Highlighted) */}
                        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden transform md:-translate-y-4">
                            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
                            <div className="flex justify-between items-start">
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Recommandé</span>
                                <Star className="text-yellow-400 fill-yellow-400" size={20} />
                            </div>
                            <div className="mt-4 mb-6">
                                <span className="text-5xl font-black">49€</span>
                                <span className="text-slate-400 font-bold">/mois</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-200">
                                    <CheckCircle size={16} className="text-blue-400" /> Tables illimitées
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-200">
                                    <CheckCircle size={16} className="text-blue-400" /> Statistiques Avancées
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-200">
                                    <CheckCircle size={16} className="text-blue-400" /> Support Prioritaire 24/7
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-200">
                                    <CheckCircle size={16} className="text-blue-400" /> Personnalisation QR
                                </li>
                            </ul>
                            <button className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30">
                                Commencer l'essai gratuit
                            </button>
                        </div>

                        {/* Enterprise */}
                        <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Entreprise</span>
                            <div className="mt-4 mb-6">
                                <span className="text-4xl font-black text-slate-900">Sur mesure</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <ShieldCheck size={16} className="text-purple-500" /> Multi-restaurants
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <ShieldCheck size={16} className="text-purple-500" /> API Access
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                    <ShieldCheck size={16} className="text-purple-500" /> Account Manager dédié
                                </li>
                            </ul>
                            <button className="w-full py-4 rounded-xl border-2 border-slate-200 font-black text-xs uppercase tracking-widest hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all">
                                Contacter l'équipe
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
