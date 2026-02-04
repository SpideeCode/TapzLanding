import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, ArrowRight, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../hooks/useCart';

export const OrderSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get('session_id');
    const restaurantId = searchParams.get('restaurantId');

    // State to hold the order summary
    const [orderSummary, setOrderSummary] = useState<any[]>([]);
    const [summaryCaptured, setSummaryCaptured] = useState(false);

    // Get cart methods, including the cart contents and loading state
    const { cart, clearCart, isLoaded } = useCart(restaurantId || '');

    useEffect(() => {
        if (!sessionId || !restaurantId) {
            // Only redirect if effectively invalid params, but give it a moment? 
            // In a real flow, we might want to check the session against Supabase/Stripe.
            return;
        }

        // Wait until cart is loaded from localStorage
        if (isLoaded && !summaryCaptured) {
            if (cart.length > 0) {
                // 1. Capture the cart for display
                setOrderSummary([...cart]);
                setSummaryCaptured(true);

                // 2. Clear the cart (persistently)
                clearCart();
            } else {
                // If cart is already empty (e.g. reload), maybe try to fetch from an API or just show "Start"
                // For now, if we already captured, we are good. If empty, maybe previous session.
                setSummaryCaptured(true);
            }
        }
    }, [sessionId, restaurantId, isLoaded, cart, summaryCaptured, clearCart]);

    // Cleanup / Animation effect
    useEffect(() => {
        if (summaryCaptured) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => {
                return Math.random() * (max - min) + min;
            }

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        }
    }, [summaryCaptured]);

    const handleReturn = async () => {
        if (restaurantId) {
            const { data } = await supabase.from('restaurants').select('slug').eq('id', restaurantId).single();
            if (data?.slug) {
                navigate(`/m/${data.slug}`);
            } else {
                navigate('/');
            }
        } else {
            navigate('/');
        }
    };

    const totalAmount = orderSummary.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white p-8 rounded-3xl shadow-xl w-full border border-slate-100 text-center mb-6">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 animate-bounce">
                        <CheckCircle2 size={40} strokeWidth={3} />
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Paiement Réussi !</h1>
                    <p className="text-slate-500 mb-8">
                        Votre commande est en cuisine.
                    </p>

                    {/* Order Summary */}
                    {orderSummary.length > 0 && (
                        <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 text-left">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                                Récapitulatif
                            </h3>
                            <div className="space-y-3 mb-4">
                                {orderSummary.map((item, i) => (
                                    <div key={i} className="flex justify-between items-start text-sm">
                                        <div className="flex gap-2">
                                            <span className="font-bold text-slate-900">{item.quantity}x</span>
                                            <span className="text-slate-600">{item.name}</span>
                                        </div>
                                        <span className="font-medium text-slate-900">{(item.price * item.quantity).toFixed(2)}€</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                                <span className="font-bold text-slate-900">Total</span>
                                <span className="text-xl font-bold text-emerald-600">{totalAmount.toFixed(2)}€</span>
                            </div>
                        </div>
                    )}

                    {!summaryCaptured && (
                        <div className="p-4 text-sm text-gray-400 italic">Chargement du détail...</div>
                    )}

                    <div className="bg-emerald-50 rounded-xl p-4 mb-8 border border-emerald-100">
                        <div className="flex items-center justify-center gap-2 text-emerald-700 text-sm font-bold">
                            <ShoppingBag size={16} />
                            <span>Commande envoyée au restaurant</span>
                        </div>
                    </div>

                    <button
                        onClick={handleReturn}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        Retour au menu <ArrowRight size={18} />
                    </button>
                </div>

                {/* Powered By Footer */}
                <div className="text-center">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1.5 opacity-60">
                        Powered by
                        <span className="font-black text-slate-600 flex items-center gap-1">
                            Tapzy
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};
