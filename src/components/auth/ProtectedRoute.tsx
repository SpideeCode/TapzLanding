import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'superadmin' | 'admin' | 'staff';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const location = useLocation();

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            try {
                setLoading(true);
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    if (mounted) {
                        setAuthorized(false);
                        setLoading(false);
                    }
                    return;
                }

                if (requiredRole) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    if (mounted) {
                        if (profile?.role === requiredRole || profile?.role === 'superadmin') {
                            setAuthorized(true);
                        } else {
                            setAuthorized(false);
                        }
                    }
                } else {
                    if (mounted) setAuthorized(true);
                }
            } catch (error) {
                console.error('Auth check error:', error);
                if (mounted) setAuthorized(false);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        checkAuth();

        // Safety timeout to clear infinite loading
        const timer = setTimeout(() => {
            if (mounted) setLoading(false);
        }, 5000);

        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, [requiredRole, location.pathname]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                <p className="text-gray-500 font-medium italic">Vérification de l'accès...</p>
                <button
                    onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
                    className="mt-8 text-sm text-gray-400 hover:text-orange-600 underline"
                >
                    Problème de connexion ? Se déconnecter
                </button>
            </div>
        );
    }

    if (!authorized) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
