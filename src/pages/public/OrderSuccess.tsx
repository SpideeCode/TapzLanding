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
    const [loading, setLoading] = useState(true);
    const { clearCart } = useCart(restaurantId || '');

    useEffect(() => {
        if (!sessionId || !restaurantId) {
            // Invalid access, maybe redirect home?
            setLoading(false);
            return;
        }

        // 1. Clear Cart
        clearCart();

        // 2. Trigger Confetti
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

        setLoading(false);

    }, [sessionId, restaurantId]);

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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 animate-bounce">
                    <CheckCircle2 size={40} strokeWidth={3} />
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">Paiement Réussi !</h1>
                <p className="text-slate-500 mb-8">
                    Votre commande a bien été reçue et est en cours de préparation en cuisine.
                </p>

                <div className="bg-slate-50 rounded-xl p-4 mb-8 border border-slate-100">
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm font-medium">
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
        </div>
    );
};
