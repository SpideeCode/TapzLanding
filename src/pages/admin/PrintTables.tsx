import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { supabase } from '../../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Box } from 'lucide-react';
import { TablePDFDocument } from '../../components/TablePDFDocument';
import { QRCodeCanvas } from 'qrcode.react';

export const PrintTables: React.FC = () => {
    const [restaurant, setRestaurant] = useState<any>(null);
    const [tables, setTables] = useState<any[]>([]);
    const [pdfTables, setPdfTables] = useState<any[]>([]); // Tables with QR data URLs
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const restaurantIdParam = searchParams.get('restaurantId');

    const baseUrl = window.location.origin;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let targetRestaurantId = restaurantIdParam;

            if (!targetRestaurantId) {
                const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single();
                if (profile?.restaurant_id) {
                    targetRestaurantId = profile.restaurant_id;
                }
            }

            if (!targetRestaurantId) throw new Error("Impossible de trouver le restaurant associé.");

            const { data: resData } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', targetRestaurantId)
                .single();

            if (resData) {
                setRestaurant(resData);
                const { data: tableData } = await supabase
                    .from('tables')
                    .select('*')
                    .eq('restaurant_id', resData.id)
                    .order('table_number', { ascending: true });

                const sortedTables = (tableData || []).sort((a, b) => {
                    return a.table_number.localeCompare(b.table_number, undefined, { numeric: true });
                });

                setTables(sortedTables);

                // Generate QR Code Data URLs for the PDF
                const tablesWithQr = await Promise.all(sortedTables.map(async (table) => {
                    const url = `${baseUrl}/m/${resData.slug}?t=${table.table_number}`;
                    try {
                        const qrDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 1 });
                        return { ...table, qrDataUrl };
                    } catch (e) {
                        console.error('Error generating QR', e);
                        return table;
                    }
                }));
                setPdfTables(tablesWithQr);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setRestaurant(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;
    if (!restaurant) return <div className="p-8 text-center text-red-500">Erreur: Restaurant non trouvé.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
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

                    {pdfTables.length > 0 && (
                        <PDFDownloadLink
                            document={<TablePDFDocument restaurant={restaurant} tables={pdfTables} />}
                            fileName={`QR_Codes_${restaurant?.name || 'Tapzy'}.pdf`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 shadow-lg font-bold transition-all active:scale-95 no-underline"
                        >
                            {/* @ts-ignore - loading is a valid prop in some versions but children function logic is safer if types mismatch. 
                                Using simpler string toggle approach within the child render function is standard but PDFDownloadLink supports direct children too.
                            */}
                            {({ loading }) => (
                                <>
                                    <Download size={20} />
                                    {loading ? 'Génération...' : 'Télécharger le PDF'}
                                </>
                            )}
                        </PDFDownloadLink>
                    )}
                </div>
            </div>

            {/* Visual Preview (HTML) - Not for printing anymore, just visual feedback */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Box className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Ceci est un aperçu. Pour un résultat optimal (A4), veuillez cliquer sur <strong>Télécharger le PDF</strong> ci-dessus.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {tables.map(table => (
                        <div key={table.id} className="bg-white border-2 border-slate-900 rounded-2xl p-4 flex flex-col items-center justify-between aspect-[3/4] relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-900" />
                            <div className="text-center w-full mt-1">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 truncate px-1">{restaurant.name}</h3>
                                <div className="text-2xl font-black text-slate-900">{table.table_number}</div>
                            </div>
                            <div className="bg-white p-1.5 rounded-lg border-2 border-slate-900 my-2">
                                <QRCodeCanvas
                                    value={`${baseUrl}/m/${restaurant.slug}?t=${table.table_number}`}
                                    size={100}
                                    style={{ width: '100%', height: 'auto' }}
                                />
                            </div>
                            <div className="w-full text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Scannez pour commander</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
