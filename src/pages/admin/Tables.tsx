import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, QrCode, Trash2, Edit2, Filter, Printer } from 'lucide-react';

interface Table {
    id: string;
    table_number: string;
    qr_code_url: string | null;
    restaurant_id: string;
}

interface Restaurant {
    id: string;
    name: string;
}

export const TableManagement: React.FC<{ restaurantId?: string }> = ({ restaurantId: propRestaurantId }) => {
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState<{ role: string, restaurant_id: string | null } | null>(null);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedResId, setSelectedResId] = useState<string>('');
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const [tableNumber, setTableNumber] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            if (propRestaurantId) {
                setSelectedResId(propRestaurantId);
                return;
            }
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase.from('profiles').select('role, restaurant_id').eq('id', user.id).single();
                setUserProfile(profile);

                if (profile?.role === 'superadmin') {
                    const { data: resData } = await supabase.from('restaurants').select('id, name');
                    setRestaurants(resData || []);
                    if (resData && resData.length > 0) setSelectedResId(resData[0].id);
                } else if (profile?.restaurant_id) {
                    setSelectedResId(profile.restaurant_id);
                }
            } catch (err) {
                console.error('Error fetching initial table data:', err);
            }
        };
        fetchInitialData();
    }, [propRestaurantId]);

    const fetchTables = async () => {
        if (!selectedResId) return;
        setLoading(true);
        try {
            const { data } = await supabase.from('tables').select('*').eq('restaurant_id', selectedResId).order('table_number', { ascending: true });
            setTables(data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, [selectedResId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedResId) return;

        const tableData = {
            table_number: tableNumber,
            restaurant_id: selectedResId
        };

        let error;
        if (editingTable) {
            ({ error } = await supabase.from('tables').update(tableData).eq('id', editingTable.id));
        } else {
            ({ error } = await supabase.from('tables').insert([tableData]));
        }

        if (error) alert(error.message);
        else {
            setShowModal(false);
            setEditingTable(null);
            setTableNumber('');
            fetchTables();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cette table ?')) return;
        const { error } = await supabase.from('tables').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchTables();
    };

    const isSuperAdmin = userProfile?.role === 'superadmin';

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight italic">
                        TABLES & <span className="text-blue-600 not-italic uppercase">QR Codes</span>
                    </h1>
                    <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[10px] flex items-center gap-2">
                        {isSuperAdmin ? 'MODE SUPERADMIN' : 'GESTION DES ACCÈS CLIENTS'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-6">
                    {isSuperAdmin && (
                        <div className="bg-white border-2 border-slate-200 rounded-2xl px-4 flex items-center gap-2 shadow-sm">
                            <Filter size={18} className="text-gray-400" strokeWidth={2.5} />
                            <select
                                value={selectedResId}
                                onChange={(e) => setSelectedResId(e.target.value)}
                                className="bg-transparent border-none text-slate-900 font-bold text-xs focus:ring-0 py-3.5 pr-8 uppercase tracking-widest cursor-pointer"
                            >
                                {restaurants.map(res => (
                                    <option key={res.id} value={res.id} className="bg-white">{res.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button
                        onClick={() => navigate(`/admin/tables/print?restaurantId=${selectedResId}`)}
                        className="bg-white hover:bg-gray-50 text-slate-900 border-2 border-slate-200 px-6 py-3.5 rounded-2xl font-black text-[10px] shadow-sm transition-all active:scale-95 flex items-center gap-2 w-fit uppercase tracking-widest"
                    >
                        <Printer size={18} strokeWidth={3} /> Imprimer QR
                    </button>
                    <button
                        onClick={() => {
                            setEditingTable(null);
                            setTableNumber('');
                            setShowModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 w-fit uppercase tracking-widest"
                    >
                        <Plus size={18} strokeWidth={3} /> Nouvelle Table
                    </button>
                </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {tables.map(table => (
                    <div key={table.id} className="bg-white rounded-[3rem] border-2 border-slate-200 p-8 relative group hover:border-blue-600 transition-all duration-500 flex flex-col items-center shadow-sm overflow-hidden min-h-[340px] active:scale-[0.992]">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-sm border-2 border-slate-100/50 relative z-10">
                            <QrCode size={36} strokeWidth={1.5} />
                        </div>

                        <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter mb-2 uppercase relative z-10">TABLE {table.table_number}</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-10 text-center px-4 leading-tight relative z-10">REF: <span className="text-slate-900 opacity-60">#{table.id.slice(0, 8)}</span></p>

                        <div className="mt-auto w-full pt-8 flex gap-3 z-10">
                            <button
                                onClick={() => {
                                    setEditingTable(table);
                                    setTableNumber(table.table_number);
                                    setShowModal(true);
                                }}
                                className="flex-1 py-3.5 bg-slate-900 text-white hover:bg-black rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 active:scale-95"
                            >
                                <Edit2 size={13} strokeWidth={3} /> ÉDITER
                            </button>
                            <button
                                onClick={() => handleDelete(table.id)}
                                className="px-4 py-3.5 bg-white text-red-600 hover:bg-red-50 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-red-100 active:scale-95"
                            >
                                <Trash2 size={14} strokeWidth={3} />
                            </button>
                        </div>

                        <span className="absolute -bottom-6 -right-2 text-[120px] font-black text-gray-400/[0.03] pointer-events-none select-none italic leading-none group-hover:text-blue-600/[0.05] transition-colors">
                            {table.table_number}
                        </span>
                    </div>
                ))}

                {tables.length === 0 && !loading && (
                    <div className="col-span-full py-24 text-center bg-gray-50 rounded-[4rem] border-2 border-dashed border-slate-100">
                        <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-sm">
                            <QrCode size={40} strokeWidth={1} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 italic">AUCUNE TABLE</h3>
                        <p className="text-gray-400 font-bold italic mb-8 text-sm">Commencez par ajouter votre première table de service.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-white hover:bg-gray-100 text-slate-900 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border-2 border-slate-100 shadow-sm"
                        >
                            Créer la table n°1
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="col-span-full py-24 text-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-sm" />
                        <p className="text-gray-400 font-bold italic text-sm">Génération des données...</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6">
                    <div className="bg-white w-full max-w-md rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-3xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-6 md:p-10 border-b border-gray-50 flex items-center justify-between shrink-0">
                            <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">
                                {editingTable ? 'MODIFIER LA TABLE' : 'NOUVELLE TABLE'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-slate-900 transition-colors">
                                <X size={28} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 md:p-10 space-y-10 overflow-y-auto">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Numéro de table</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-slate-50 rounded-[2rem] py-6 px-10 text-slate-900 text-4xl font-black italic focus:outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-gray-200 shadow-sm text-center"
                                    placeholder="01"
                                />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center italic">Ce numéro sera utilisé pour les commandes</p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 rounded-2xl bg-gray-100 text-slate-600 font-black uppercase text-[10px] tracking-widest transition-all hover:bg-gray-200"
                                >
                                    Fermer
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                                >
                                    {editingTable ? 'Mettre à jour' : 'Créer la table'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const X: React.FC<{ size: number }> = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
