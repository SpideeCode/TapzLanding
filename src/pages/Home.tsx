import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    QrCode,
    Smartphone,
    Zap,
    Clock,
    CreditCard,
    ArrowRight,
    Check,
    ChevronDown,
    Box,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import InteractiveDemo from '../components/InteractiveDemo';

// --- Components ---

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
        {children}
    </motion.div>
);

const FeatureCard = ({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="group p-8 rounded-3xl bg-[#111113] border border-white/5 hover:border-blue-500/30 hover:bg-[#161618] transition-all duration-300"
    >
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed font-medium">{desc}</p>
    </motion.div>
);

const CheckItem = ({ text }: { text: string }) => (
    <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
            <Check size={14} className="text-blue-500 font-bold" />
        </div>
        <span className="text-gray-300 font-medium">{text}</span>
    </div>
);

export default function Home() {
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    return (
        <div className="bg-[#0A0A0B] text-white overflow-hidden relative selection:bg-blue-500/30">

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[100px]" />
            </div>

            {/* --- HERO SECTION --- */}
            <section className="relative z-10 min-h-[90vh] flex flex-col justify-center pt-20 pb-20">
                <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        style={{ opacity, scale }}
                        className="space-y-8 max-w-2xl"
                    >
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-widest"
                        >
                            <Zap size={14} fill="currentColor" /> Nouveau Standard 2026
                        </motion.div>

                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                            Le menu qui fait <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                                saliver
                            </span> avant <br />
                            la première bouchée.
                        </h1>

                        <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
                            Boostez vos ventes de <span className="text-white font-bold">30%</span> avec la Réalité Augmentée et un système de commande instantané sans friction.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link to="/onboarding" className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-95 overflow-hidden">
                                <span className="relative z-10">Créer mon menu</span>
                                <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#demo" className="px-8 py-4 rounded-full border border-white/10 font-bold text-lg hover:bg-white/5 transition-all flex items-center justify-center gap-3">
                                Voir la démo
                            </a>
                        </div>
                    </motion.div>

                    {/* Visual Hero Component */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative z-10 bg-[#121214] rounded-[3rem] border border-white/10 shadow-2xl shadow-blue-900/20 p-6 rotate-3 hover:rotate-0 transition-transform duration-500">
                            <div className="aspect-[4/5] rounded-[2rem] overflow-hidden relative bg-gradient-to-br from-gray-900 to-black">
                                {/* Simulated Mobile UI */}
                                <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center px-6 gap-2">
                                    <div className="w-12 h-1 bg-white/20 rounded-full mx-auto" />
                                </div>
                                <img
                                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800"
                                    alt="Food Preview"
                                    className="w-full h-full object-cover opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

                                <div className="absolute bottom-0 inset-x-0 p-8 space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/50 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/10 uppercase tracking-wider mb-2">
                                        <Box size={12} className="text-blue-500" /> Mode AR Activé
                                    </div>
                                    <h3 className="text-3xl font-black italic">Poke Bowl Saumon</h3>
                                    <p className="text-gray-300 font-medium line-clamp-2">Avocat frais, mangue, edamame et notre sauce secrète au sésame.</p>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-2xl font-bold">14.90€</span>
                                        <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
                                            <ArrowRight size={24} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* --- PROBLEM / SOLUTION --- */}
            <section className="py-20 lg:py-32 relative z-10 bg-[#0F0F11]">
                <div className="container mx-auto px-6">
                    <FadeIn>
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl lg:text-5xl font-bold mb-6">Marre des menus PDF <br /><span className="text-gray-600 line-through">illisibles</span> ?</h2>
                            <p className="text-xl text-gray-400">Le monde a changé. Vos clients scannent, mais veulent voir ce qu'ils mangent, pas zoomer sur un PDF pixelisé.</p>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-20 items-center">
                        <FadeIn>
                            <div className="space-y-6">
                                <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10">
                                    <h3 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2"><Smartphone size={20} /> L'Enfer du PDF</h3>
                                    <ul className="space-y-3 text-red-200/60 font-medium">
                                        <li className="flex gap-2">❌ Zoom impossible sur mobile</li>
                                        <li className="flex gap-2">❌ Pas de photos des plats</li>
                                        <li className="flex gap-2">❌ Serveurs débordés par les questions</li>
                                    </ul>
                                </div>
                            </div>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <div className="space-y-6">
                                <div className="p-8 rounded-3xl bg-blue-600 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full blur-[80px] opacity-50 pointer-events-none" />
                                    <h3 className="text-3xl font-black italic mb-6 relative z-10 flex items-center gap-3"><Zap size={28} /> L'Expérience Tapzy</h3>
                                    <ul className="space-y-4 text-white relative z-10 font-medium text-lg">
                                        <li className="flex gap-3 items-center"><Check className="text-blue-200" /> Photos HD & Réalité Augmentée</li>
                                        <li className="flex gap-3 items-center"><Check className="text-blue-200" /> Commande envoyée en cuisine</li>
                                        <li className="flex gap-3 items-center"><Check className="text-blue-200" /> Paiement Apple Pay / Google Pay</li>
                                    </ul>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>


            {/* --- KILLER FEATURES --- */}
            <section className="py-20 lg:py-32 relative z-10">
                <div className="container mx-auto px-6">
                    <FadeIn>
                        <div className="mb-20">
                            <h2 className="text-4xl lg:text-5xl font-bold mb-6">Le futur, servi sur un plateau.</h2>
                            <p className="text-xl text-gray-400 max-w-2xl">Des fonctionnalités conçues pour augmenter votre ticket moyen.</p>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard
                            delay={0}
                            icon={<Box size={24} />}
                            title="Réalité Augmentée"
                            desc="Ne laissez plus vos clients deviner. Ils voient le plat en 3D sur leur table avant de commander. L'effet 'Wahou' garanti."
                        />
                        <FeatureCard
                            delay={0.1}
                            icon={<Smartphone size={24} />}
                            title="Zero App Download"
                            desc="Tout se passe dans le navigateur. Un scan, et c'est parti. Aucune friction, aucune installation requise."
                        />
                        <FeatureCard
                            delay={0.2}
                            icon={<CreditCard size={24} />}
                            title="Stripe Connect"
                            desc="Paiements intégrés et sécurisés. L'argent arrive directement sur votre compte bancaire. Pourboires inclus."
                        />
                        <FeatureCard
                            delay={0.3}
                            icon={<TrendingUp size={24} />}
                            title="+30% de Rotation"
                            desc="Les clients commandent et paient plus vite. Vous libérez les tables plus rapidement aux heures de pointe."
                        />
                        <FeatureCard
                            delay={0.4}
                            icon={<ShieldCheck size={24} />}
                            title="Fiabilité 99.9%"
                            desc="Notre infrastructure cloud assure que votre menu est toujours disponible, même en plein rush du samedi soir."
                        />
                        <FeatureCard
                            delay={0.5}
                            icon={<Clock size={24} />}
                            title="Setup en 2 min"
                            desc="Créez votre compte, uploadez vos plats, imprimez vos QR codes. Vous êtes prêt pour le service de ce soir."
                        />
                    </div>
                </div>
            </section>

            {/* --- SOCIAL PROOF --- */}
            <section className="py-20 lg:py-32 bg-[#111113] border-y border-white/5">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <FadeIn>
                            <h2 className="text-4xl font-bold leading-tight mb-8">
                                "On a gagné 20 minutes par service et le ticket moyen a explosé."
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=200" alt="Chef" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-bold text-white text-lg">Marc Dubois</div>
                                    <div className="text-blue-500 font-medium">Propriétaire, Le Bistro Moderne</div>
                                </div>
                            </div>
                        </FadeIn>

                        <div className="grid gap-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <FadeIn delay={0.1}>
                                    <div className="p-6 rounded-2xl bg-[#0A0A0B] border border-white/5 text-center">
                                        <div className="text-3xl font-black text-blue-500 mb-1">+18%</div>
                                        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Ticket Moyen</div>
                                    </div>
                                </FadeIn>
                                <FadeIn delay={0.2}>
                                    <div className="p-6 rounded-2xl bg-[#0A0A0B] border border-white/5 text-center">
                                        <div className="text-3xl font-black text-purple-500 mb-1">-25%</div>
                                        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Temps d'attente</div>
                                    </div>
                                </FadeIn>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PRICING --- */}
            <section className="py-20 lg:py-32" id="pricing">
                <div className="container mx-auto px-6 max-w-5xl">
                    <FadeIn>
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold mb-6">Investissement minuscule. <br />Rentabilité immense.</h2>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        {/* STARTER */}
                        <FadeIn delay={0}>
                            <div className="p-10 rounded-[2.5rem] bg-[#111113] border border-white/5 flex flex-col h-full hover:border-[#3B82F6]/30 transition-colors duration-300">
                                <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                                <p className="text-gray-400 font-medium mb-8">Idéal pour les petits établissements.</p>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-5xl font-bold text-white">49€</span>
                                    <span className="text-xl text-gray-400 font-medium">/mois</span>
                                </div>
                                <div className="text-gray-500 font-medium mb-10">Facturation annuelle</div>

                                <div className="space-y-4 mb-10 flex-grow">
                                    <CheckItem text="Jusqu'à 10 tables" />
                                    <CheckItem text="Menu Digital Complet" />
                                    <CheckItem text="Photos Illimitées" />
                                    <CheckItem text="Support Email" />
                                </div>

                                <Link to="/onboarding" className="block w-full py-4 text-center rounded-2xl font-bold border border-white/10 hover:bg-white hover:text-black transition-all">
                                    Choisir Starter
                                </Link>
                            </div>
                        </FadeIn>

                        {/* PRO */}
                        <FadeIn delay={0.1}>
                            <div className="p-10 rounded-[2.5rem] bg-blue-600 border border-blue-400 relative overflow-hidden text-white shadow-2xl shadow-blue-900/40 flex flex-col h-full transform hover:scale-[1.02] transition-transform duration-300">
                                <div className="absolute top-6 right-6 px-3 py-1 bg-black/20 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-white/20">Populaire</div>

                                <h3 className="text-2xl font-bold mb-2">Unlimited</h3>
                                <p className="text-blue-100 font-medium mb-8">Pour les restaurants sans limite.</p>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-5xl font-bold">89€</span>
                                    <span className="text-xl text-blue-200 font-medium">/mois</span>
                                </div>
                                <div className="text-blue-200 font-medium mb-10">Facturation annuelle</div>

                                <div className="space-y-4 mb-10 flex-grow">
                                    <CheckItem text="Tables Illimitées" />
                                    <CheckItem text="Paiements Intégrés (0% commission)" />
                                    <CheckItem text="Réalité Augmentée (AR)" />
                                    <CheckItem text="Tableau de Bord Analytics" />
                                    <CheckItem text="Support Prioritaire 24/7" />
                                </div>

                                <Link to="/onboarding" className="block w-full py-4 text-center rounded-2xl font-bold bg-white text-blue-600 hover:bg-blue-50 transition-all shadow-lg active:scale-95">
                                    Choisir Unlimited
                                </Link>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* Interactive Demo Section (Kept visible for SEO/Structure but could be seamlessly integrated above) */}
            <div id="demo" className="py-20 bg-[#0F0F11]">
                <div className="container mx-auto px-6 text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-500 uppercase tracking-widest text-sm">Démo Technique</h2>
                </div>
                <InteractiveDemo />
            </div>

            {/* --- CTA FOOTER --- */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5" />
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-5xl md:text-7xl font-bold mb-10 tracking-tighter">
                        Vos tables attendent.
                    </h2>
                    <Link to="/onboarding" className="inline-flex items-center gap-3 px-12 py-6 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-2xl shadow-white/10">
                        Créer mon compte maintenant
                    </Link>
                </div>
            </section>
        </div>
    );
}
