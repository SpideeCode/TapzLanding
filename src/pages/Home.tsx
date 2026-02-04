import React from 'react';
import { Link } from 'react-router-dom';
import { LazyMotion, domAnimation, m, useScroll, useTransform, useSpring, Variants } from 'framer-motion';
import {
    QrCode,
    Smartphone,
    Zap,
    Clock,
    CreditCard,
    ArrowRight,
    Check,
    TrendingUp,
    ShieldCheck,
    Ban,
    Sparkles
} from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';

// --- Animations ---

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const floatingAnimation: Variants = {
    animate: {
        y: [0, -15, 0],
        rotate: [0, 1, 0],
        transition: {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

// --- Components ---

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
    <m.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: "easeOut" } }
        }}
    >
        {children}
    </m.div>
);

const BenefitCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <m.div
        variants={fadeInUp}
        whileHover={{ y: -10, transition: { duration: 0.2 } }}
        className="group relative p-8 rounded-3xl bg-[#111113] border border-white/5 overflow-hidden hover:border-blue-500/30 transition-all duration-300"
    >
        <div className="absolute top-0 right-0 p-24 bg-blue-500/5 blur-[80px] rounded-full group-hover:bg-blue-500/10 transition-colors duration-500" />
        <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 group-hover:text-white group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-300 shadow-lg shadow-blue-500/5 group-hover:shadow-blue-500/20">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">{title}</h3>
            <p className="text-gray-400 font-medium leading-relaxed">{desc}</p>
        </div>
    </m.div>
);

const PriceCard = ({ title, price, subtitle, features, highlighted = false, cta }: any) => (
    <m.div
        variants={fadeInUp}
        whileHover={{ y: -15 }}
        className={`p-8 rounded-[2.5rem] h-full flex flex-col relative transition-all duration-500 group ${highlighted
            ? 'bg-[#161618] border-2 border-blue-500/30 shadow-2xl shadow-blue-900/20 z-10'
            : 'bg-[#111113] border border-white/5 hover:border-white/10 hover:bg-[#161618]'
            }`}
    >
        {highlighted && (
            <div className="absolute inset-0 bg-blue-500/5 rounded-[2.5rem] pointer-events-none" />
        )}

        {highlighted && (
            <div className="absolute top-6 right-6 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 shadow-lg shadow-blue-500/10 animate-pulse">
                Best Seller
            </div>
        )}

        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm font-medium mb-8">{subtitle}</p>

        <div className="flex items-baseline gap-1 mb-8">
            <span className={`text-5xl font-black ${highlighted ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200' : 'text-white'}`}>{price}€</span>
            <span className="text-gray-500 font-medium">/mois</span>
        </div>

        <div className="space-y-5 mb-10 flex-grow">
            {features.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${highlighted ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-800 text-gray-400'}`}>
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-gray-300 font-medium text-sm">{f}</span>
                </div>
            ))}
        </div>

        <Link to="/onboarding" className={`relative overflow-hidden block w-full py-4 text-center rounded-2xl font-bold transition-all duration-300 ${highlighted
            ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-[1.02]'
            : 'bg-white text-black hover:bg-gray-200 hover:scale-[1.02]'
            }`}>
            <span className="relative z-10 flex items-center justify-center gap-2">
                {cta} <ArrowRight size={18} />
            </span>
        </Link>
    </m.div>
);

export default function Home() {
    const { scrollYProgress } = useScroll();
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    const yParallax = useTransform(smoothProgress, [0, 1], [0, -100]);
    const opacityHero = useTransform(smoothProgress, [0, 0.2], [1, 0]);
    const scaleHero = useTransform(smoothProgress, [0, 0.2], [1, 0.95]);

    const isDesktop = useMediaQuery('(min-width: 1024px)');

    return (
        <LazyMotion features={domAnimation}>
            <div className="bg-[#0A0A0B] text-white selection:bg-blue-500/30 overflow-x-hidden relative">

                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse duration-1000" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[100px]" />
                </div>

                {/* --- HERO SECTION --- */}
                <section className="relative min-h-[95vh] flex flex-col justify-center py-20 overflow-hidden">
                    <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center relative z-10">
                        <m.div style={{ opacity: opacityHero, scale: scaleHero }} className="space-y-10 max-w-2xl">
                            <m.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900/10 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-widest rounded-full hover:bg-blue-900/20 transition-colors cursor-default"
                            >
                                <Sparkles size={14} className="text-blue-400 animate-spin-slow" />
                                Version 2026 Live
                            </m.div>

                            <h1 className="text-5xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-white">
                                LE CASH.<br />
                                <m.span
                                    initial={{ backgroundSize: "0% 100%" }}
                                    animate={{ backgroundSize: "100% 100%" }}
                                    transition={{ duration: 1, delay: 0.5, ease: "circOut" }}
                                    className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 bg-no-repeat bg-left-bottom"
                                >
                                    SUR LA TABLE.
                                </m.span><br />
                                VRAIMENT.
                            </h1>

                            <m.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="text-xl text-gray-400 leading-relaxed font-medium max-w-lg border-l-2 border-blue-500/30 pl-6"
                            >
                                Vos clients sont pressés, vos serveurs débordés.
                                Tapzy supprime la friction entre "J'ai faim" et "C'est payé".
                                <span className="text-white font-bold mt-2 block">+30% de ticket moyen. Zéro blabla.</span>
                            </m.p>

                            <m.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="flex flex-col sm:flex-row gap-5 items-start sm:items-center"
                            >
                                <Link to="/onboarding" className="group relative px-9 py-5 bg-white text-black rounded-full font-black text-lg flex items-center gap-3 hover:bg-gray-100 hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-white/10">
                                    CRÉER MON MENU
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <span className="text-sm font-mono text-gray-500 flex items-center gap-2">
                                    <Clock size={14} className="text-blue-500" /> Setup: 2 minutes chrono
                                </span>
                            </m.div>
                        </m.div>

                        {/* Performance-First Visual: SVG Composition with Floating Animation */}
                        {isDesktop && (
                            <m.div
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="relative hidden lg:block perspective-1000"
                            >
                                <m.div
                                    variants={floatingAnimation}
                                    animate="animate"
                                    className="relative z-10 bg-[#161618] rounded-[3rem] p-8 border border-white/5 shadow-2xl group cursor-pointer hover:border-blue-500/30 transition-colors"
                                >
                                    <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-700" />

                                    <div className="aspect-[4/5] bg-[#0A0A0B] rounded-[2.5rem] relative overflow-hidden flex flex-col border border-white/5 shadow-inner">
                                        {/* Abstract UI Header */}
                                        <div className="h-20 border-b border-white/5 flex items-center px-8 justify-between bg-white/[0.02]">
                                            <div className="flex gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                                                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                                                <div className="w-3 h-3 rounded-full bg-green-500/20" />
                                            </div>
                                            <div className="w-24 h-4 bg-white/10 rounded-full" />
                                        </div>

                                        {/* QR Hero */}
                                        <div className="flex-1 flex items-center justify-center p-12 relative">
                                            <m.div
                                                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 4, repeat: Infinity }}
                                                className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent"
                                            />
                                            <QrCode className="w-full h-full text-white/90 drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]" strokeWidth={1} />

                                            {/* Scan tag */}
                                            <m.div
                                                whileHover={{ scale: 1.1 }}
                                                className="absolute bottom-12 bg-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-blue-500/40 flex items-center gap-3"
                                            >
                                                <Smartphone size={20} /> SCAN ME
                                            </m.div>
                                        </div>
                                    </div>
                                </m.div>

                                {/* Decor elements */}
                                <m.div
                                    animate={{ y: [0, 20, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                                    className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl opacity-20 blur-xl animate-pulse"
                                />
                                <m.div
                                    animate={{ y: [0, -20, 0] }}
                                    transition={{ duration: 7, repeat: Infinity, delay: 0 }}
                                    className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-600 rounded-full opacity-10 blur-2xl"
                                />
                            </m.div>
                        )}
                    </div>
                </section>

                {/* --- THE PDF PROBLEM --- */}
                <section className="py-32 bg-[#0F0F11] border-y border-white/5 relative overflow-hidden">
                    <m.div style={{ y: yParallax }} className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 blur-[150px] rounded-full pointer-events-none" />

                    <div className="container mx-auto px-6 relative z-10">
                        <FadeIn>
                            <div className="max-w-4xl mx-auto text-center mb-20">
                                <h2 className="text-4xl md:text-7xl font-bold mb-8 tracking-tight">Le PDF est <span className="text-red-500 line-through decoration-4 decoration-white/20">mort</span>.</h2>
                                <p className="text-2xl text-gray-400 font-light">
                                    En 2026, personne n'a envie de pincher/zoomer sur l'écran gras de son téléphone.
                                    <span className="text-white font-medium block mt-2">C'est moche. C'est lent. Ça tue vos ventes.</span>
                                </p>
                            </div>
                        </FadeIn>

                        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
                            <FadeIn delay={0.2}>
                                <m.div
                                    whileHover={{ scale: 0.98, rotate: -1 }}
                                    className="p-10 rounded-[2.5rem] bg-gradient-to-b from-red-900/10 to-transparent border border-red-500/10 hover:border-red-500/30 transition-all cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-4 text-red-500 mb-8 font-mono text-sm uppercase tracking-widest">
                                        <Ban size={20} /> Old School
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-6">Le Menu PDF</h3>
                                    <ul className="space-y-4 text-gray-400 text-lg">
                                        <li className="flex gap-4 items-center"><span className="text-red-500 text-xl">✕</span> Illisible sur mobile</li>
                                        <li className="flex gap-4 items-center"><span className="text-red-500 text-xl">✕</span> Pas de photos = Pas d'envie</li>
                                        <li className="flex gap-4 items-center"><span className="text-red-500 text-xl">✕</span> Zéro upsell possible</li>
                                    </ul>
                                </m.div>
                            </FadeIn>

                            <FadeIn delay={0.4}>
                                <m.div
                                    whileHover={{ scale: 1.02, rotate: 1 }}
                                    className="p-10 rounded-[2.5rem] bg-gradient-to-b from-blue-900/20 to-transparent border border-blue-500/20 hover:border-blue-500/50 transition-all shadow-2xl shadow-blue-900/10 cursor-default"
                                >
                                    <div className="flex items-center gap-4 text-blue-400 mb-8 font-mono text-sm uppercase tracking-widest">
                                        <Zap size={20} /> The New Way
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-6">L'Expérience Tapzy</h3>
                                    <ul className="space-y-4 text-white text-lg">
                                        <li className="flex gap-4 items-center"><Check className="text-blue-500 w-6 h-6" /> Interface App-Native (sans install)</li>
                                        <li className="flex gap-4 items-center"><Check className="text-blue-500 w-6 h-6" /> Photos HD qui font baver</li>
                                        <li className="flex gap-4 items-center"><Check className="text-blue-500 w-6 h-6" /> Suggestion automatique</li>
                                    </ul>
                                </m.div>
                            </FadeIn>
                        </div>
                    </div>
                </section>

                {/* --- FEATURES GRID --- */}
                <section className="py-32 relative">
                    <div className="container mx-auto px-6 relative z-10">
                        <FadeIn>
                            <div className="mb-24">
                                <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">BRUTALEMENT<br />EFFICACE.</h2>
                                <p className="text-xl text-gray-400 max-w-2xl border-l-4 border-white pl-6">
                                    On a enlevé tout le superflu. <br />Il ne reste que ce qui fait sonner la caisse.
                                </p>
                            </div>
                        </FadeIn>

                        <m.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            className="grid md:grid-cols-3 gap-6"
                        >
                            <BenefitCard
                                icon={<Smartphone size={28} />}
                                title="Zero App. Zero Friction."
                                desc="Vos clients scannent. C'est ouvert. Pas de téléchargement, pas de création de compte obligatoire. On va droit au but."
                            />
                            <BenefitCard
                                icon={<TrendingUp size={28} />}
                                title="+25% sur les Desserts"
                                desc="Quand on voit une belle photo de Tiramisu juste avant de payer, on craque. C'est scientifique. Tapzy le fait pour vous."
                            />
                            <BenefitCard
                                icon={<Clock size={28} />}
                                title="Vitesse Lumière"
                                desc="Le client commande dès qu'il s'assoit. Les boissons partent en 30 secondes. La rotation de vos tables explose."
                            />
                            <BenefitCard
                                icon={<CreditCard size={28} />}
                                title="Cashflow Immédiat"
                                desc="L'argent arrive sur votre Stripe instantanément. Plus d'erreurs d'addition, plus de 'je n'ai pas de monnaie'."
                            />
                            <BenefitCard
                                icon={<ShieldCheck size={28} />}
                                title="Serveurs Soulagés"
                                desc="Fini les allers-retours pour donner la carte. Fini l'attente pour le TPE. Vos serveurs font du relationnel, pas de la logistique."
                            />
                            <BenefitCard
                                icon={<QrCode size={28} />}
                                title="QR Code Factory"
                                desc="Votre back-office génère les QR pour chaque table. Imprimez, collez, encaissez. On ne peut pas faire plus simple."
                            />
                        </m.div>
                    </div>
                </section>

                {/* --- PRICING --- */}
                <section className="py-32 bg-[#0F0F11] relative overflow-hidden" id="pricing">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/5 blur-[120px] rounded-full pointer-events-none" />

                    <div className="container mx-auto px-6 max-w-7xl relative z-10">
                        <FadeIn>
                            <div className="text-center mb-24 space-y-4">
                                <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Investissez dans votre croissance.</h2>
                                <p className="text-xl text-gray-400">Pas de coûts cachés. Rentabilisé en 2 services.</p>
                            </div>
                        </FadeIn>

                        <m.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch"
                        >
                            <PriceCard
                                title="Bistro"
                                price="39"
                                subtitle="Pour les démarrages agiles"
                                features={[
                                    "Jusqu'à 10 tables",
                                    "Photos HD Illimitées",
                                    "Dashboard Intuitif",
                                    "Support Email"
                                ]}
                                cta="Lancer le service"
                            />
                            <PriceCard
                                title="Pro"
                                price="69"
                                subtitle="La machine de guerre"
                                highlighted={true}
                                features={[
                                    "Jusqu'à 25 tables",
                                    "Stats de Ventes Avancées",
                                    "Gestion des Stocks",
                                    "Support Prioritaire WhatsApp",
                                    "Multi-utilisateurs (Serveurs)"
                                ]}
                                cta="Passer en Pro"
                            />
                            <PriceCard
                                title="Elite"
                                price="99"
                                subtitle="Empire mode activated"
                                features={[
                                    "Tables Illimitées",
                                    "API Access",
                                    "Account Manager Dédié",
                                    "Formation Équipe sur site",
                                    "Custom Branding"
                                ]}
                                cta="Contacter Sales"
                            />
                        </m.div>

                        <FadeIn delay={0.5}>
                            <div className="mt-20 text-center border-t border-white/5 pt-12">
                                <p className="text-xs font-mono text-gray-600 uppercase tracking-[0.2em] mb-6">Transparence Totale</p>
                                <div className="flex flex-col md:flex-row justify-center gap-10 text-sm text-gray-400">
                                    <span className="flex items-center justify-center gap-3"><CreditCard size={16} className="text-blue-500" /> Frais de setup : 20€ / table (one-off)</span>
                                    <span className="flex items-center justify-center gap-3"><TrendingUp size={16} className="text-blue-500" /> Commission technique : 1% par transaction</span>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* --- FINAL CTA --- */}
                <section className="py-40 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-600/5 animate-pulse duration-[3000ms]" />
                    <div className="container mx-auto px-6 relative z-10 text-center">
                        <m.h2
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 0.1, scale: 1 }}
                            transition={{ duration: 1 }}
                            className="text-6xl md:text-9xl font-black mb-10 tracking-tighter text-white select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full whitespace-nowrap"
                        >
                            TAPZY 2026
                        </m.h2>
                        <FadeIn>
                            <h2 className="text-5xl md:text-7xl font-bold mb-12 tracking-tighter relative z-10 leading-tight">
                                Vos tables attendent.<br />
                                <span className="text-blue-500">Pas vos clients.</span>
                            </h2>
                            <Link to="/onboarding" className="group relative z-10 inline-flex items-center gap-4 px-14 py-7 bg-white text-black text-xl font-black rounded-full hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:shadow-[0_0_80px_rgba(255,255,255,0.4)]">
                                CRÉER MON COMPTE
                                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center group-hover:rotate-45 transition-transform">
                                    <ArrowRight size={16} />
                                </div>
                            </Link>
                        </FadeIn>
                    </div>
                </section>
            </div>
        </LazyMotion>
    );
}