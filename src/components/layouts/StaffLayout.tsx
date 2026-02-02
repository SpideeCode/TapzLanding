import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
    ClipboardList,
    LogOut,
    Utensils,
    Menu as MenuIcon,
    X,
    Bell,
    History
} from 'lucide-react';


interface StaffLayoutProps {
    children: React.ReactNode;
}

export const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
    const { slug } = useParams<{ slug: string }>();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const handleLogout = async () => {
        if (slug) {
            sessionStorage.removeItem(`staff_session_${slug}`);
            window.location.href = `/staff/${slug}/login`;
        }
    };

    const navigation = [
        { name: 'Commandes Live', href: `/staff/${slug}`, icon: ClipboardList },
        { name: 'Historique', href: `/staff/${slug}/history`, icon: History },
        // Future additions: { name: 'Stock / Menu', href: `/staff/${slug}/menu`, icon: Utensils },
    ];

    return (
        <div className="h-[100dvh] bg-white flex text-slate-900 overflow-hidden">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-md"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-white border-r-2 border-slate-200 transform transition-transform duration-300 ease-in-out
                lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
            `}>
                <div className="h-full flex flex-col p-8">
                    {/* Brand */}
                    <div className="flex items-center justify-between mb-12">
                        <span className="text-2xl font-black text-slate-900 tracking-tighter italic flex items-center gap-2">
                            <span className="bg-blue-600 p-2 rounded-xl text-white shadow-xl shadow-blue-500/20">
                                <Utensils size={20} strokeWidth={3} />
                            </span>
                            TAPZY <span className="text-blue-600">STAFF</span>
                        </span>
                        <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
                            <X size={24} />
                        </button>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 space-y-3">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`
                                        flex items-center gap-3 px-5 py-4 rounded-[1.5rem] transition-all
                                        ${isActive
                                            ? 'bg-slate-900 text-white font-black shadow-2xl shadow-slate-900/10 active:scale-95'
                                            : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50 font-bold'}
                                    `}
                                >
                                    <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
                                    <span className="text-xs uppercase tracking-widest">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer / User */}
                    <div className="mt-auto pt-8 border-t-2 border-slate-200">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-5 py-4 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[1.5rem] transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                            <LogOut size={20} strokeWidth={2.5} />
                            <span>Quitter le service</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar (Mobile Only) */}
                <header className="bg-white/80 backdrop-blur-md border-b-2 border-slate-200 h-20 flex items-center px-6 lg:hidden shrink-0 sticky top-0 z-30">
                    <button onClick={() => setSidebarOpen(true)} className="p-3 bg-white rounded-2xl text-slate-900 border-2 border-slate-200 shadow-sm">
                        <MenuIcon size={20} />
                    </button>
                    <span className="ml-4 font-black italic tracking-tighter text-slate-900 uppercase text-sm">Staff Dashboard</span>
                    <button className="ml-auto p-3 bg-white rounded-2xl text-slate-900 relative border-2 border-slate-200 shadow-sm">
                        <Bell size={20} />
                        <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto w-full max-w-[1600px] mx-auto bg-white p-6 lg:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
};
