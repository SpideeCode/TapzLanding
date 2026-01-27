import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Store,
    Users,
    Menu as MenuIcon,
    X,
    LogOut,
    Settings,
    Coffee,
    QrCode
} from 'lucide-react';

import { supabase } from '../../lib/supabase';

interface SuperAdminLayoutProps {
    children: React.ReactNode;
}

const navigation = [
    { name: 'Tableau de bord', href: '/superadmin', icon: LayoutDashboard },
    { name: 'Restaurants', href: '/superadmin/restaurants', icon: Store },
    { name: 'Staff & Comptes', href: '/superadmin/staff', icon: Users },
    { name: 'Config. Menus', href: '/superadmin/menus', icon: Coffee },
    { name: 'Gestion Tables', href: '/superadmin/tables', icon: QrCode },
    { name: 'Paramètres', href: '/superadmin/settings', icon: Settings },
];

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        shadow-xl lg:shadow-none
      `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-6 flex items-center justify-between border-b border-gray-50 mb-4">
                        <span className="text-2xl font-black text-[#1E293B] tracking-tight">Tapzy <span className="text-blue-600">Admin</span></span>
                        <button className="lg:hidden p-2 text-gray-500 hover:text-gray-900" onClick={() => setSidebarOpen(false)}>
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-1.5 focus:outline-none">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive
                                            ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30'
                                            : 'text-gray-600 hover:bg-gray-100 font-semibold'}
                  `}
                                >
                                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="p-4 border-t">
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 w-full px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors font-semibold"
                        >
                            <LogOut size={20} />
                            <span>Déconnexion</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="bg-white border-b px-4 py-4 flex items-center lg:hidden">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2">
                        <MenuIcon size={24} />
                    </button>
                    <span className="ml-4 font-bold text-lg">Tapzy Admin</span>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};
