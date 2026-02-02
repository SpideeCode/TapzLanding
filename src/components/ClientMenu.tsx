import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DishARView } from './DishARView';
import { X, Box } from 'lucide-react'; // Assuming a supabase client is configured

interface Item {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    is_available: boolean;
    category_id: string;
    model_3d_glb?: string;
    model_3d_usdz?: string;
}

interface Category {
    id: string;
    name: string;
    display_order: number;
}

interface ClientMenuProps {
    restaurantId: string;
}

export const ClientMenu: React.FC<ClientMenuProps> = ({ restaurantId }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    useEffect(() => {
        const fetchMenu = async () => {
            setLoading(true);

            // Fetch categories
            const { data: catData, error: catError } = await supabase
                .from('menus_categories')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('display_order', { ascending: true });

            if (catError) console.error('Error fetching categories:', catError);
            else setCategories(catData || []);

            // Fetch items
            const { data: itemData, error: itemError } = await supabase
                .from('items')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('is_available', true);

            if (itemError) {
                console.error('Error fetching items:', itemError);
            } else {
                console.log('Fetched items:', itemData); // Debug log
                setItems(itemData || []);
            }

            setLoading(false);
        };

        if (restaurantId) {
            fetchMenu();
        }
    }, [restaurantId]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Chargement du menu...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8">
            {categories.map((category) => (
                <section key={category.id} className="space-y-4">
                    <h2 className="text-2xl font-bold border-b pb-2 text-gray-800">{category.name}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items
                            .filter((item) => item.category_id === category.id)
                            .map((item) => (
                                <div
                                    key={item.id}
                                    className="flex bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {item.image_url && (
                                        <div onClick={() => {
                                            console.log('Selected Item:', item); // Debug log
                                            setSelectedItem(item);
                                        }} className="cursor-pointer relative group">
                                            {item.model_3d_glb && (
                                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 z-10 shadow-sm border border-white/10">
                                                    <Box size={12} className="text-blue-400" /> 3D
                                                </div>
                                            )}
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-24 h-24 object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                    <div className="p-4 flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3
                                                className="font-semibold text-lg cursor-pointer hover:text-blue-600 transition-colors"
                                                onClick={() => {
                                                    console.log('Selected Item (Text):', item); // Debug log
                                                    setSelectedItem(item);
                                                }}
                                            >
                                                {item.name}
                                            </h3>
                                            <span className="font-bold text-blue-600">{item.price} €</span>
                                        </div>
                                        {item.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                                        )}
                                        <div className="mt-2 flex items-center gap-2">
                                            <button className="text-xs font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors">
                                                Ajouter (+)
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (item.model_3d_glb) setSelectedItem(item);
                                                }}
                                                disabled={!item.model_3d_glb}
                                                className={`text-xs font-bold px-3 py-1 rounded-full transition-colors flex items-center gap-1 shadow-sm ${item.model_3d_glb
                                                        ? 'bg-slate-900 text-white hover:bg-slate-700'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                <Box size={12} className={item.model_3d_glb ? "text-blue-400" : "text-gray-300"} />
                                                {item.model_3d_glb ? '3D' : 'No 3D'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </section>
            ))}

            {/* Item Detail Modal with AR */}
            {
                selectedItem && (
                    <div className="fixed inset-0 bg-black/80 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-lg rounded-t-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh]">

                            {/* Header Image or AR View */}
                            <div className="relative bg-gray-100 shrink-0">
                                {selectedItem.model_3d_glb ? (
                                    <div className="aspect-[4/3] w-full">
                                        <DishARView
                                            glbUrl={selectedItem.model_3d_glb as string}
                                            usdzUrl={selectedItem.model_3d_usdz || undefined}
                                            posterUrl={selectedItem.image_url}
                                            altText={selectedItem.name}
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-video w-full">
                                        <img src={selectedItem.image_url} className="w-full h-full object-cover" alt={selectedItem.name} />
                                    </div>
                                )}

                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="absolute top-4 right-4 bg-white/50 backdrop-blur-md p-2 rounded-full text-slate-900 shadow-sm z-50 hover:bg-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-tight">
                                        {selectedItem.name}
                                    </h2>
                                    <span className="text-2xl font-black text-blue-600 tracking-tighter shrink-0">
                                        {selectedItem.price}€
                                    </span>
                                </div>

                                <p className="text-gray-500 font-medium leading-relaxed mb-8">
                                    {selectedItem.description}
                                </p>

                                <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                                    Ajouter au panier
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};
