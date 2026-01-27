import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // Assuming a supabase client is configured

interface Item {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    is_available: boolean;
    category_id: string;
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

            if (itemError) console.error('Error fetching items:', itemError);
            else setItems(itemData || []);

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
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-24 h-24 object-cover"
                                        />
                                    )}
                                    <div className="p-4 flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-lg">{item.name}</h3>
                                            <span className="font-bold text-orange-600">{item.price} €</span>
                                        </div>
                                        {item.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                                        )}
                                        <button className="mt-2 text-xs font-medium px-3 py-1 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors">
                                            Ajouter au panier
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </section>
            ))}
        </div>
    );
};
