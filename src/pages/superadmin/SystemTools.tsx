import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { QrCode, AlertTriangle, FileTerminal, Download } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

export const SystemTools: React.FC = () => {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [selectedResId, setSelectedResId] = useState('');
    const [generating, setGenerating] = useState(false);
    const [mockLogs] = useState([
        { id: 1, type: 'error', msg: 'Payment failed for Order #123: Insufficient funds', time: '10 min ago' },
        { id: 2, type: 'critical', msg: 'Webhook Error: Signature verification failed', time: '1 hour ago' },
        { id: 3, type: 'warning', msg: 'High latency detected on eu-west-1', time: '2 hours ago' },
    ]);

    useEffect(() => {
        supabase.from('restaurants').select('id, name').then(({ data }) => setRestaurants(data || []));
    }, []);

    const generateQRPDF = async () => {
        if (!selectedResId) return alert('Sélectionnez un restaurant');
        setGenerating(true);

        try {
            // Fetch tables for this restaurant
            const { data: tables } = await supabase.from('tables').select('*').eq('restaurant_id', selectedResId);
            const { data: res } = await supabase.from('restaurants').select('slug, name').eq('id', selectedResId).single();

            if (!tables || tables.length === 0) return alert('Aucune table trouvée');

            const doc = new jsPDF();
            let x = 20;
            let y = 20;

            doc.setFontSize(22);
            doc.text(`QR Codes - ${res?.name}`, 20, 20);
            y += 20;

            for (const table of tables) {
                const url = `${import.meta.env.VITE_APP_URL}/m/${res?.slug}?table=${table.table_number}`;
                const qrDataUrl = await QRCode.toDataURL(url, { width: 300 });

                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }

                doc.setFontSize(16);
                doc.text(`Table ${table.table_number}`, x, y);
                doc.addImage(qrDataUrl, 'PNG', x, y + 5, 50, 50);

                // Grid logic
                x += 80;
                if (x > 150) {
                    x = 20;
                    y += 70;
                }
            }

            doc.save(`qrcodes_${res?.slug}.pdf`);

        } catch (error: any) {
            console.error(error);
            alert('Erreur: ' + error.message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Outils <span className="text-slate-500">Système</span></h1>
                <p className="text-gray-600 font-medium">Maintenance et utilitaires.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* QR Generator */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                        <QrCode className="text-blue-600" />
                        Générateur PDF
                    </h3>
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700">Restaurant Cible</label>
                        <select
                            className="w-full p-4 bg-gray-50 rounded-xl border-none font-bold text-gray-700"
                            value={selectedResId}
                            onChange={(e) => setSelectedResId(e.target.value)}
                        >
                            <option value="">Choisir...</option>
                            {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <button
                            onClick={generateQRPDF}
                            disabled={generating}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {generating ? 'Génération...' : <>
                                <Download size={18} />
                                Télécharger PDF
                            </>}
                        </button>
                    </div>
                </div>

                {/* Error Logs */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                        <FileTerminal className="text-red-500" />
                        Logs Système
                    </h3>
                    <div className="space-y-4 font-mono text-xs">
                        {mockLogs.map(log => (
                            <div key={log.id} className="bg-white/5 p-3 rounded-lg border border-white/10">
                                <div className="flex justify-between text-gray-400 mb-1">
                                    <span className={`uppercase font-bold ${log.type === 'error' ? 'text-red-400' : 'text-amber-400'}`}>{log.type}</span>
                                    <span>{log.time}</span>
                                </div>
                                <p className="text-gray-200 leading-relaxed">{log.msg}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
