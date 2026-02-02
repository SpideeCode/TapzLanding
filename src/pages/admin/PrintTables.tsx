import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Box } from 'lucide-react';

export const PrintTables: React.FC = () => {
    const [restaurant, setRestaurant] = useState<any>(null);
    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const componentRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Use current origin for the QR code base URL
    const baseUrl = window.location.origin;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get restaurant
            const { data: resData } = await supabase
                .from('restaurants')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            if (resData) {
                setRestaurant(resData);
                // Get tables
                const { data: tableData } = await supabase
                    .from('tables')
                    .select('*')
                    .eq('restaurant_id', resData.id)
                    .order('table_number', { ascending: true }); // Ensure alphanumeric sort might need custom sort if mixed, but standard is fine

                // Sort numerically if possible
                const sortedTables = (tableData || []).sort((a, b) => {
                    return a.table_number.localeCompare(b.table_number, undefined, { numeric: true });
                });

                setTables(sortedTables);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `QR_Codes_${restaurant?.name || 'Tapzy'}`,
    });

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;
    if (!restaurant) return <div className="p-8 text-center text-red-500">Erreur: Restaurant non trouvé.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header (No Print) */}
            <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <button
                    onClick={() => navigate('/admin/tables')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Retour aux Tables
                </button>
                <div className="flex gap-4">
                    <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium">
                        {tables.length} tables générées
                    </div>
                    <button
                        onClick={() => handlePrint()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 shadow-lg font-bold transition-all active:scale-95"
                    >
                        <Printer size={20} />
                        Imprimer les QR Codes
                    </button>
                </div>
            </div>

            {/* Print Preview Area */}
            <div className="max-w-[21cm] mx-auto bg-white p-8 shadow-2xl min-h-screen print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0">
                <div ref={componentRef} className="print:w-full">

                    {/* Print Header (Only visible when printing or in preview) */}
                    <div className="mb-8 text-center hidden print:block">
                        <h1 className="text-2xl font-bold">{restaurant.name} - QR Codes Tables</h1>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-4 print:break-inside-avoid">
                        {tables.map(table => (
                            <div
                                key={table.id}
                                className="border-2 border-slate-900 rounded-[2rem] p-6 flex flex-col items-center justify-between aspect-[3/4] relative overflow-hidden break-inside-avoid page-break-inside-avoid"
                                style={{ pageBreakInside: 'avoid' }}
                            >
                                {/* Background decoration */}
                                <div className="absolute top-0 inset-x-0 h-2 bg-slate-900" />

                                {/* Header */}
                                <div className="text-center w-full mt-2">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 truncate px-2">
                                        {restaurant.name}
                                    </h3>
                                    <div className="text-4xl font-black text-slate-900 mt-1">
                                        {table.table_number}
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="bg-white p-2 rounded-xl border-4 border-slate-900 my-4 shadow-sm">
                                    <QRCodeCanvas
                                        value={`${baseUrl}/m/${restaurant.slug}?t=${table.table_number}`}
                                        size={180}
                                        level={"H"}
                                        includeMargin={true}
                                        style={{ width: '100%', height: 'auto', maxWidth: '150px' }}
                                    />
                                </div>

                                {/* Footer / Call to action */}
                                <div className="w-full text-center space-y-2 mb-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                        Scannez pour commander
                                    </p>

                                    {/* AR Promo Badge */}
                                    <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mx-auto border border-blue-100">
                                        <Box size={14} strokeWidth={3} />
                                        Plats en 3D
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                    body {
                        background: white;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:block {
                        display: block !important;
                    }
                    .print\\:w-full {
                        width: 100% !important;
                    }
                    .print\\:max-w-none {
                        max-width: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:grid-cols-3 {
                        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                    }
                    .print\\:gap-4 {
                        gap: 1rem !important;
                    }
                }
            `}</style>
        </div>
    );
};
