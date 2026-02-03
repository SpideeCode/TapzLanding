import React, { Suspense, lazy, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
    QrCode,
    Smartphone,
    Zap,
    Clock,
    CreditCard,
    ArrowRight,
    Check,
    Box,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';

// Chargement différé de la démo 3D pour éviter l'écran noir au chargement
const InteractiveDemo = lazy(() => import('../components/InteractiveDemo'));

// --- Components ---

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
        style={{ willChange: "transform, opacity" }} // Force GPU
    >
        {children}
    </motion.div>
);

const FeatureCard = ({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay }}
        className="group p-8 rounded-3xl bg-[#111113] border border-white/5 hover:border-blue-500/30 hover:bg-[#161618] transition-all duration-300"
    >
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed font-medium">{desc}</p>
    </motion.div >
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
    
    // Smooth scroll physics
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // On désactive les transformations lourdes sur mobile pour éviter les saccades
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const opacity = useTransform(smoothProgress, [0, 0.15], [1, isMobile ? 1 : 0]);
    const scale = useTransform(smoothProgress, [0, 0.15], [1, isMobile ? 1 : 0.95]);

    return (
        <div className="bg-[#0A0A0B] text-white overflow-x-hidden relative selection:bg-blue-500/30">

            {/* Background Gradients - Opacité réduite pour mobile */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 md:bg-blue-600/10 rounded-full blur-[80px] md:blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-600/5 md:bg-purple-600/10 rounded-full blur-[80px] md:blur-[100px]" />
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
                                    <ul className="space-y-3 text-red-200/60 font-medium text-sm md:text-base">
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
                                        <li className="flex gap-3 items-center"><Check className="text-blue-200" /> Paiement Apple / Google Pay</li>
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
                            desc="Ne laissez plus vos clients deviner. Ils voient le plat en 3D sur leur table avant de commander."
                        />
                        <FeatureCard
                            delay={0.1}
                            icon={<Smartphone size={24} />}
                            title="Zero App Download"
                            desc="Tout se passe dans le navigateur. Un scan, et c'est parti. Aucune installation requise."
                        />
                        <FeatureCard
                            delay={0.2}
                            icon={<CreditCard size={24} />}
                            title="Stripe Connect"
                            desc="Paiements intégrés et sécurisés. L'argent arrive directement sur votre compte bancaire."
                        />
                    </div>
                </div>
            </section>

            {/* --- PRICING --- */}
            <section className="py-20 lg:py-32" id="pricing">
                <div className="container mx-auto px-6 max-w-7xl">
                    <FadeIn>
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold mb-6">Un tarif adapté à chaque ambition.</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">Choisissez le plan qui correspond à votre établissement.</p>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-3 gap-8 items-stretch relative">
                        {/* BISTRO */}
                        <div className="p-8 rounded-[2rem] bg-[#111113] border border-white/5 flex flex-col h-full">
                            <h3 className="text-xl font-bold text-white mb-2">Bistro</h3>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-4xl font-bold text-white">39€</span>
                                <span className="text-gray-400 font-medium">/mois</span>
                            </div>
                            <div className="space-y-4 mb-8 flex-grow">
                                <CheckItem text="10 Tables maximum" />
                                <CheckItem text="3 Plats en AR (3D)" />
                                <CheckItem text="Stats essentielles" />
                            </div>
                            <Link to="/onboarding" className="block w-full py-3 text-center rounded-xl font-bold border border-white/10 hover:bg-white hover:text-black transition-all text-sm">
                                Essayer gratuitement
                            </Link>
                        </div>

                        {/* PRO */}
                        <div className="p-8 rounded-[2rem] bg-[#161618] border border-blue-500/50 relative overflow-hidden flex flex-col h-full shadow-2xl">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-4xl font-bold text-white">69€</span>
                                <span className="text-gray-400 font-medium">/mois</span>
                            </div>
                            <div className="space-y-4 mb-8 flex-grow">
                                <CheckItem text="25 Tables maximum" />
                                <CheckItem text="10 Plats en AR (3D)" />
                                <CheckItem text="Stats avancées" />
                                <CheckItem text="Support Prioritaire" />
                            </div>
                            <Link to="/onboarding" className="block w-full py-3 text-center rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all text-sm">
                                Essayer gratuitement
                            </Link>
                        </div>

                        {/* ELITE */}
                        <div className="p-8 rounded-[2rem] bg-[#111113] border border-white/5 flex flex-col h-full">
                            <h3 className="text-xl font-bold text-white mb-2">Elite</h3>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-4xl font-bold text-white">99€</span>
                                <span className="text-gray-400 font-medium">/mois</span>
                            </div>
                            <div className="space-y-4 mb-8 flex-grow">
                                <CheckItem text="Tables Illimitées" />
                                <CheckItem text="AR Illimitée" />
                                <CheckItem text="Account Manager" />
                            </div>
                            <Link to="/onboarding" className="block w-full py-3 text-center rounded-xl font-bold border border-white/10 hover:bg-white hover:text-black transition-all text-sm">
                                Essayer gratuitement
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Demo Section - Chargement asynchrone */}
            <div id="demo" className="py-20 bg-[#0F0F11]">
                <div className="container mx-auto px-6 text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-500 uppercase tracking-widest text-xs">Aperçu interactif</h2>
                </div>
                <Suspense fallback={<div className="h-96 w-full flex items-center justify-center text-gray-500">Chargement de la démo 3D...</div>}>
                    <InteractiveDemo />
                </Suspense>
            </div>

            {/* --- CTA FOOTER --- */}
            <section className="py-32 relative overflow-hidden bg-blue-600/5">
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-5xl md:text-7xl font-bold mb-10 tracking-tighter">
                        Vos tables attendent.
                    </h2>
                    <Link to="/onboarding" className="inline-flex items-center gap-3 px-12 py-6 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-2xl">
                        Créer mon compte maintenant
                    </Link>
                </div>
            </section>
        </div>
    );
}