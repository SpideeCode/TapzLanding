import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Utensils, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export const StaffLogin = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log('Verifying access for:', { slug, code: code.trim() });
            const { data, error: rpcError } = await supabase.rpc('verify_staff_access', {
                input_slug: slug?.toLowerCase(),
                input_code: code.trim()
            });

            if (rpcError) throw rpcError;

            if (data.success) {
                // Store minimal session info
                sessionStorage.setItem(`staff_session_${slug}`, JSON.stringify({
                    timestamp: new Date().toISOString(),
                    restaurantId: data.restaurant.id
                }));
                navigate(`/staff/${slug}`);
            } else {
                setError('Code d\'accès invalide');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 p-10 border-2 border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />

                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-6 rotate-3">
                        <Utensils size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter mb-2">ACCÈS STAFF</h1>
                    <div className="flex items-center gap-2 mb-2 bg-slate-100 px-3 py-1 rounded-full">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{slug}</span>
                    </div>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Connectez-vous à votre espace</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
                        <AlertCircle size={20} />
                        <span className="font-bold text-xs uppercase tracking-wide">{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Code d'accès</label>
                        <div className="relative">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input
                                type="password"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] py-5 pl-14 pr-6 text-xl font-black text-slate-900 tracking-widest focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-center placeholder:text-slate-300"
                                placeholder="••••"
                                maxLength={6}
                                autoFocus
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {loading ? 'Vérification...' : 'Accéder au service'}
                        {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-8">
                        Demandez votre code à votre manager
                    </p>
                </form>
            </div>
        </div>
    );
};
