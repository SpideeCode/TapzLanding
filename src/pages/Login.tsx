import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { QrCode, Mail, Lock, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Fetch role to know where to redirect
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', (await supabase.auth.getUser()).data.user?.id).single();
            const role = profile?.role;

            let from = (location.state as any)?.from?.pathname;
            if (!from || from === '/login' || from === '/') {
                from = role === 'superadmin' ? '/superadmin' : '/admin';
            }
            navigate(from, { replace: true });
        }
    };

    // Redirect if already logged in
    const [checking, setChecking] = useState(true);
    React.useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
                    const from = profile?.role === 'superadmin' ? '/superadmin' : '/admin';
                    navigate(from, { replace: true });
                }
            } finally {
                setChecking(false);
            }
        };
        checkSession();
    }, [navigate]);

    if (checking) return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3B82F6] rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
                        <QrCode className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Connexion Admin</h1>
                    <p className="text-gray-400 mt-2">Gérez votre plateforme Tapzy</p>
                </div>

                {/* Card */}
                <div className="bg-[#141415] border border-[#2A2A2B] rounded-3xl p-8 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#1A1A1B] border border-[#2A2A2B] text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:outline-none transition-all placeholder:text-gray-600"
                                    placeholder="admin@tapzy.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 ml-1">Mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#1A1A1B] border border-[#2A2A2B] text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:outline-none transition-all placeholder:text-gray-600"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>
                </div>

                {/* Support Link */}
                <p className="text-center text-gray-500 text-sm mt-8">
                    Problème d'accès ? <a href="/contact" className="text-[#3B82F6] hover:underline">Contactez le support</a>
                </p>
            </div>
        </div>
    );
};
