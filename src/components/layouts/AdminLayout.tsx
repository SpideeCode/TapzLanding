import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    Menu as MenuIcon,
    X,
    LogOut,
    Settings,
    Coffee,
    Utensils,
    QrCode,
    Store
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const navigation = [
    { name: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
    { name: 'Commandes', href: '/admin/orders', icon: ClipboardList },
    { name: 'Menu & Cartes', href: '/admin/menu', icon: Coffee },
    { name: 'Tables & QR', href: '/admin/tables', icon: QrCode },
    { name: 'Employés', href: '/admin/staff', icon: Users },
    { name: 'Paramètres', href: '/admin/settings', icon: Settings },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
    const location = useLocation();

    React.useEffect(() => {
        const getSlug = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single();
                if (profile?.restaurant_id) {
                    const { data: rest } = await supabase.from('restaurants').select('slug').eq('id', profile.restaurant_id).single();
                    if (rest) setRestaurantSlug(rest.slug);
                }
            }
        };
        getSlug();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login'; // Force full reload/redirect
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 flex font-sans selection:bg-blue-500/30">
            {/* ... (keep mobile overlay) ... */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-all duration-300 ease-in-out
        lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        shadow-2xl lg:shadow-none
      `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-8 flex items-center justify-between mb-6 border-b border-gray-50">
                        <Link to="/admin" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Utensils className="text-white" size={22} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">
                                    TAPZY <span className="text-blue-600 italic uppercase">Admin</span>
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Management Portal</span>
                            </div>
                        </Link>
                        <button className="lg:hidden p-2 text-gray-400 hover:text-slate-900 transition-colors" onClick={() => setSidebarOpen(false)}>
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                        <div className="px-4 mb-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Menu Principal</span>
                        </div>
                        {navigation.map((item) => {
                            if (item.name === 'Paramètres') return null; // Skip Settings here to render later
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`
                                        flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group
                                        ${isActive
                                            ? 'bg-blue-600 text-white font-bold shadow-xl shadow-blue-500/20'
                                            : 'text-slate-600 hover:bg-gray-50 hover:text-blue-600 font-semibold'}
                                    `}
                                >
                                    <div className={`
                                        p-1.5 rounded-lg transition-colors
                                        ${isActive ? 'bg-white/20' : 'bg-transparent group-hover:bg-blue-50'}
                                    `}>
                                        <item.icon size={18} strokeWidth={isActive ? 3 : 2} />
                                    </div>
                                    <span className="tracking-tight">{item.name}</span>
                                </Link>
                            );
                        })}

                        {/* Button "Voir mon Restaurant" */}
                        {restaurantSlug && (
                            <a
                                href={`/m/${restaurantSlug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 font-semibold mt-4"
                            >
                                <div className="p-1.5 rounded-lg transition-colors bg-transparent group-hover:bg-emerald-100/50">
                                    <Store size={18} strokeWidth={2} />
                                </div>
                                <span className="tracking-tight">Voir mon Restaurant</span>
                            </a>
                        )}

                        {/* Paramètres (Settings) explicitly rendered at bottom */}
                        <Link
                            to="/admin/settings"
                            className={`
                                flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group mt-2
                                ${location.pathname === '/admin/settings'
                                    ? 'bg-blue-600 text-white font-bold shadow-xl shadow-blue-500/20'
                                    : 'text-slate-600 hover:bg-gray-50 hover:text-blue-600 font-semibold'}
                            `}
                        >
                            <div className={`
                                p-1.5 rounded-lg transition-colors
                                ${location.pathname === '/admin/settings' ? 'bg-white/20' : 'bg-transparent group-hover:bg-blue-50'}
                            `}>
                                <Settings size={18} strokeWidth={location.pathname === '/admin/settings' ? 3 : 2} />
                            </div>
                            <span className="tracking-tight">Paramètres</span>
                        </Link>

                    </nav>

                    {/* User Profile / Logout */}
                    <div className="p-6 mt-auto">
                        <div className="bg-gray-50 rounded-3xl p-4 mb-4 border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center font-black italic text-slate-900 text-sm shadow-sm">
                                    AD
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-slate-900 leading-none">Administrateur</span>
                                    <span className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-widest">En ligne</span>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest"
                            >
                                <LogOut size={16} />
                                <span>Déconnexion</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header Mobile */}
                <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between lg:hidden sticky top-0 z-30">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 bg-gray-50 rounded-xl text-slate-600 hover:text-blue-600">
                        <MenuIcon size={24} />
                    </button>
                    <span className="font-black text-xl tracking-tighter text-slate-900">TAPZY</span>
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Utensils className="text-blue-600" size={20} />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 lg:p-12 custom-scrollbar bg-white">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
