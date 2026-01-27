import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, QrCode, Trash2, Edit2, Filter, X } from 'lucide-react';

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

export const TableManagement: React.FC = () => {
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
    }, []);

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
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestion des Tables</h1>
                    <p className="text-gray-600 font-medium font-mono text-sm uppercase tracking-wider">Configurez vos accès en restaurant.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {isSuperAdmin && (
                        <div className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                            <Filter size={18} className="text-gray-400 ml-2" />
                            <select
                                value={selectedResId}
                                onChange={(e) => setSelectedResId(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-800 pr-8"
                            >
                                {restaurants.map(res => (
                                    <option key={res.id} value={res.id}>{res.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            setEditingTable(null);
                            setTableNumber('');
                            setShowModal(true);
                        }}
                        className={`px-6 py-3 rounded-2xl text-sm font-black transition-all flex items-center justify-center space-x-2 shadow-xl active:scale-95 ${isSuperAdmin
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-500/20'
                            }`}
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span>Nouvelle Table</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tables.map((table) => (
                    <div key={table.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`${isSuperAdmin ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'} p-4 rounded-2xl`}>
                                <QrCode size={28} strokeWidth={2.5} />
                            </div>
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => {
                                        setEditingTable(table);
                                        setTableNumber(table.table_number);
                                        setShowModal(true);
                                    }}
                                    className={`p-2.5 text-gray-400 rounded-xl transition-all ${isSuperAdmin ? 'hover:text-blue-600 hover:bg-blue-50' : 'hover:text-orange-600 hover:bg-orange-50'}`}
                                >
                                    <Edit2 size={18} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => handleDelete(table.id)}
                                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Table {table.table_number}</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Restaurant ID: {table.restaurant_id.slice(0, 8)}</p>
                        </div>

                        <div className="mt-8">
                            <button className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-2 ${isSuperAdmin
                                    ? 'bg-blue-50/50 border-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                                    : 'bg-orange-50/50 border-orange-100 text-orange-700 hover:bg-orange-600 hover:text-white hover:border-orange-600'
                                }`}>
                                <QrCode size={16} strokeWidth={2.5} />
                                Générer QR Code
                            </button>
                        </div>

                        {/* Decorative background number */}
                        <span className="absolute -bottom-4 -right-2 text-9xl font-black text-gray-50 opacity-40 pointer-events-none select-none italic">
                            {table.table_number}
                        </span>
                    </div>
                ))}

                {loading && (
                    <div className="col-span-full py-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-400 font-bold italic">Récupération des tables...</p>
                    </div>
                )}

                {!loading && tables.length === 0 && (
                    <div className="col-span-full py-20 bg-white rounded-[2.5rem] border-4 border-dashed border-gray-50 text-center flex flex-col items-center">
                        <div className="bg-gray-50 p-6 rounded-3xl mb-6">
                            <QrCode size={64} className="text-gray-200" strokeWidth={1} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Aucune table détectée</h3>
                        <p className="text-gray-500 font-medium mb-8 max-w-xs mx-auto">Chaque table doit avoir son propre QR code pour permettre la commande automatique.</p>
                        <button
                            onClick={() => {
                                setEditingTable(null);
                                setTableNumber('');
                                setShowModal(true);
                            }}
                            className={`${isSuperAdmin ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20'} text-white px-8 py-4 rounded-2xl text-sm font-black transition-all flex items-center space-x-2 shadow-xl active:scale-95`}
                        >
                            <Plus size={20} strokeWidth={3} />
                            <span>Ajouter la table n°1</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-200 border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-3xl font-black text-gray-900 italic underline decoration-blue-600 underline-offset-8">
                                {editingTable ? 'Modifier Table' : 'Nouvelle Table'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                                <X size={24} className="text-gray-400" strokeWidth={3} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-900 uppercase tracking-[0.2em] ml-1">Numéro de la table</label>
                                <input
                                    type="text"
                                    required
                                    value={tableNumber}
                                    onChange={e => setTableNumber(e.target.value)}
                                    className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] focus:border-blue-600 focus:bg-white focus:outline-none transition-all font-black text-2xl text-gray-900 placeholder:text-gray-300 shadow-inner"
                                    placeholder="ex: 12"
                                />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-2">Ce numéro sera affiché au client lors de sa commande.</p>
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-5 border-2 border-gray-100 text-gray-500 rounded-3xl font-black hover:bg-gray-50 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
                                >
                                    Fermer
                                </button>
                                <button
                                    type="submit"
                                    className={`${isSuperAdmin ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20'} flex-1 px-6 py-5 text-white rounded-3xl font-black transition-all active:scale-[0.98] shadow-xl uppercase tracking-widest text-xs`}
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
