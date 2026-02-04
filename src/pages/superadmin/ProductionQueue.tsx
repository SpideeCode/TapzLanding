import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Box, Upload, CheckCircle2, Clock } from 'lucide-react';

export const ProductionQueue: React.FC = () => {
    const [queue, setQueue] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, completed: 0 });
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
        setLoading(true);
        // Fetch items that are flagged for 3D modeling OR just missing the model but are "premium" or something?
        // For now, let's just fetch ALL items where model_3d_glb is NULL, but maybe filter by paid restaurants?
        // Assuming we have a 'needs_3d' flag or just process all items.
        // Let's assume we want to track ALL items for now.

        const { data: items } = await supabase
            .from('items')
            .select('id, name, price, model_3d_glb, restaurant:restaurants(name)');

        const allItems = items || [];
        const completed = allItems.filter(i => i.model_3d_glb).length;
        const pendingItems = allItems.filter(i => !i.model_3d_glb).slice(0, 50); // Limit to 50 for UI

        setStats({ total: allItems.length, completed });
        setQueue(pendingItems);
        setLoading(false);
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleUpload = async (itemId: string, file: File) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${itemId}.${fileExt}`;
            const filePath = `models/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('ar-models')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('ar-models').getPublicUrl(filePath);

            await supabase.from('items').update({ model_3d_glb: publicUrl }).eq('id', itemId);
            fetchQueue();
            alert('Modèle uploadé avec succès !');

        } catch (error: any) {
            alert('Erreur upload: ' + error.message);
        }
    };

    const progress = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Studio <span className="text-purple-600">3D</span></h1>
                    <p className="text-gray-600 font-medium">Gestion de la production AR.</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Progression</span>
                        <span className="block text-2xl font-black text-purple-600">{progress}%</span>
                    </div>
                </div>
            </div>

            {/* Queue List */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <Box className="text-purple-600" />
                        File d'attente ({stats.total - stats.completed} restants)
                    </h3>
                </div>
                <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 italic">Chargement...</div>
                    ) : queue.length === 0 ? (
                        <div className="p-8 text-center text-emerald-500 font-bold flex flex-col items-center gap-2">
                            <CheckCircle2 size={32} />
                            Tout est à jour !
                        </div>
                    ) : (
                        queue.map(item => (
                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-purple-50 transition-colors group">
                                <div>
                                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                                    <p className="text-xs text-gray-500 font-medium">{item.restaurant?.name || 'Restaurant Inconnu'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono text-gray-400">{item.price}€</span>
                                    <label className="cursor-pointer bg-purple-100 hover:bg-purple-600 hover:text-white text-purple-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2">
                                        <Upload size={14} />
                                        GLB
                                        <input
                                            type="file"
                                            accept=".glb, .usdz"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) handleUpload(item.id, e.target.files[0]);
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
