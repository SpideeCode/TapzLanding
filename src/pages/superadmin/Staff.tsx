import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, Store } from 'lucide-react';

interface Profile {
    id: string;
    email: string;
    role: 'superadmin' | 'admin' | 'staff';
    restaurant_id: string | null;
    restaurants: { name: string } | null;
}

export const StaffManagement: React.FC = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfiles = async () => {
            setLoading(true);
            // Joining with restaurants to see which restaurant the user belongs to
            const { data, error } = await supabase
                .from('profiles')
                .select(`
          id, 
          email, 
          role, 
          restaurant_id,
          restaurants ( name )
        `)
                .order('role', { ascending: true });

            if (error) console.error(error);
            else setProfiles(data as any || []);
            setLoading(false);
        };

        fetchProfiles();
    }, []);

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'superadmin': return 'bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-500/20 px-3 py-1';
            case 'admin': return 'bg-indigo-100 text-indigo-700 border-indigo-200 px-3 py-1';
            case 'staff': return 'bg-gray-100 text-gray-700 border-gray-200 px-3 py-1';
            default: return 'bg-gray-50 text-gray-500 px-3 py-1';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Utilisateurs & Staff</h1>
                <p className="text-gray-600 font-medium">Gérez les comptes utilisateurs et leurs permissions globales.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Utilisateur</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Rôle</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Affectation</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Chargement...</td></tr>
                        ) : (
                            profiles.map((profile) => (
                                <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-lg shadow-inner">
                                                {profile.email[0].toUpperCase()}
                                            </div>
                                            <div className="text-sm font-bold text-gray-900">{profile.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`rounded-full text-xs font-black border uppercase tracking-wider ${getRoleBadge(profile.role)}`}>
                                            {profile.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center space-x-2 text-sm font-bold text-gray-700">
                                            <Store size={16} className="text-blue-600" strokeWidth={2.5} />
                                            <span>{profile.restaurants?.name || 'Accès Global (Tous)'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-blue-600 hover:text-blue-800 cursor-pointer text-sm">
                                        Modifier
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start space-x-3">
                <Shield className="text-orange-600 mt-0.5" size={20} />
                <div>
                    <p className="text-sm font-semibold text-orange-900">Note sur la création de comptes</p>
                    <p className="text-xs text-orange-800 mt-1">
                        Pour créer de nouveaux utilisateurs, vous devez utiliser le système d'invitation ou une fonction Edge Supabase (admin-api) afin de garantir la sécurité des mots de passe.
                    </p>
                </div>
            </div>
        </div>
    );
};
