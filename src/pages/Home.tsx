import { QrCode, Smartphone, Zap, Clock, CreditCard, Users, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import FadeIn from '../components/FadeIn';
import InteractiveDemo from '../components/InteractiveDemo';
import WaitlistForm from '../components/WaitlistForm';

export default function Home() {
    const auth = undefined;
    const isAuthenticated = Boolean(auth);

    return (
        <>
            {/* Hero Section */}
            <section className="container mx-auto px-6 py-20">
                <FadeIn>
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="inline-block px-4 py-2 bg-[#161617] rounded-full text-[#3B82F6] text-sm font-semibold border border-[#2A2A2B]">
                                ✨ La nouvelle ère de la restauration
                            </div>
                            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                                Commandez et payez{' '}
                                <span className="text-[#3B82F6]">
                                    en un scan
                                </span>
                            </h1>
                            <p className="text-xl text-[#A0A0A0] leading-relaxed">
                                Tapzy révolutionne l'expérience restaurant. Scannez le QR code sur votre table,
                                commandez, et payez directement depuis votre smartphone. Simple, rapide, fluide.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link
                                    to="/onboarding"
                                    className="px-8 py-4 bg-[#3B82F6] text-white rounded-full font-bold text-lg hover:bg-[#2563EB] hover:shadow-lg hover:shadow-blue-600/20 transition-all flex items-center gap-2"
                                >
                                    Commencer maintenant <ArrowRight size={20} />
                                </Link>
                                <a
                                    href="#demo"
                                    className="px-8 py-4 border-2 border-[#2A2A2B] text-white rounded-full font-semibold hover:bg-[#161617] hover:border-white transition-all"
                                >
                                    Voir la démo
                                </a>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] rounded-3xl blur-3xl opacity-20"></div>
                            <div className="relative bg-[#161617] rounded-3xl shadow-2xl p-8 border border-[#2A2A2B]">
                                <div className="aspect-square bg-[#1E1E1F] rounded-2xl flex items-center justify-center">
                                    <QrCode className="w-64 h-64 text-[#3B82F6]" strokeWidth={1.5} />
                                </div>
                                <div className="mt-6 space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-[#0A0A0B] rounded-xl border border-[#2A2A2B]">
                                        <div className="w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center hover:bg-[#2563EB] transition-colors">
                                            <Smartphone className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-[#EAEAEA]">Scannez</div>
                                            <div className="text-sm text-[#A0A0A0]">Le QR code sur votre table</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-[#0A0A0B] rounded-xl border border-[#2A2A2B]">
                                        <div className="w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center hover:bg-[#2563EB] transition-colors">
                                            <Check className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-[#EAEAEA]">Commandez</div>
                                            <div className="text-sm text-[#A0A0A0]">Parcourez le menu et validez</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </section>

            {/* Interactive Demo Section */}
            <div id="demo">
                <InteractiveDemo />
            </div>

            {/* Features */}
            <section className="container mx-auto px-6 py-20">
                <FadeIn>
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4 text-[#EAEAEA]">
                            Pourquoi choisir <span className="text-[#3B82F6]">Tapzy</span> ?
                        </h2>
                        <p className="text-xl text-[#A0A0A0]">
                            Une solution complète pour moderniser votre établissement
                        </p>
                    </div>
                </FadeIn>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Zap className="w-8 h-8 text-white" />,
                            title: "Rapidité",
                            desc: "Réduisez les temps d'attente. Vos clients commandent instantanément sans attendre le serveur."
                        },
                        {
                            icon: <Users className="w-8 h-8 text-white" />,
                            title: "Libérez vos équipes",
                            desc: "Vos serveurs se concentrent sur l'expérience client plutôt que sur la prise de commande."
                        },
                        {
                            icon: <CreditCard className="w-8 h-8 text-white" />,
                            title: "Paiement intégré",
                            desc: "Paiement sécurisé directement depuis l'application. Fini les allers-retours pour l'addition."
                        },
                        {
                            icon: <Clock className="w-8 h-8 text-white" />,
                            title: "Gain de temps",
                            desc: "Augmentez votre rotation de tables et servez plus de clients sans stress."
                        },
                        {
                            icon: <Smartphone className="w-8 h-8 text-white" />,
                            title: "Zéro installation",
                            desc: "Aucune application à télécharger pour vos clients. Tout fonctionne depuis le navigateur."
                        },
                        {
                            icon: <QrCode className="w-8 h-8 text-white" />,
                            title: "Simple à mettre en place",
                            desc: "Imprimez vos QR codes, collez-les sur vos tables. C'est prêt !"
                        }
                    ].map((feature, index) => (
                        <FadeIn key={index} delay={index * 0.1}>
                            <div className="group p-8 bg-[#161617] rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-[#2A2A2B] h-full">
                                <div className="w-16 h-16 bg-[#3B82F6] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#2563EB] group-hover:scale-110 transition-all">
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-[#EAEAEA]">{feature.title}</h3>
                                <p className="text-[#A0A0A0]">{feature.desc}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] py-20">
                <div className="container mx-auto px-6">
                    <FadeIn>
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-[#EAEAEA] mb-4">
                                Comment ça marche ?
                            </h2>
                            <p className="text-xl text-[#A0A0A0]">
                                En 3 étapes simples pour vos clients
                            </p>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { id: 1, title: 'Scanner', desc: 'Le client scanne le QR code sur la table avec son smartphone' },
                            { id: 2, title: 'Commander', desc: 'Il parcourt le menu, choisit ses plats et valide sa commande' },
                            { id: 3, title: 'Payer', desc: 'Paiement sécurisé en un clic, sans attendre l\'addition' }
                        ].map((step, index) => (
                            <FadeIn key={step.id} delay={index * 0.2}>
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                                        <span className="text-3xl font-bold text-[#3B82F6]">{step.id}</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-[#EAEAEA] mb-4">{step.title}</h3>
                                    <p className="text-[#A0A0A0]">{step.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="container mx-auto px-6 py-20">
                <FadeIn>
                    <div className="bg-[#161617] rounded-3xl p-6 md:p-12 lg:p-20 text-center border-2 border-[#2A2A2B]">
                        <h2 className="text-4xl font-bold mb-6 text-[#EAEAEA]">Prêt à digitaliser votre restaurant ?</h2>
                        <p className="text-xl text-[#A0A0A0] mb-10 max-w-2xl mx-auto">
                            Rejoignez les restaurants qui font confiance à Tapzy pour améliorer leur service.
                        </p>

                        <div className="flex justify-center">
                            <Link
                                to="/onboarding"
                                className="px-8 py-4 bg-[#3B82F6] text-white rounded-full font-bold text-lg hover:bg-[#2563EB] hover:shadow-lg hover:shadow-blue-600/20 transition-all flex items-center gap-2"
                            >
                                Configurer mon restaurant <ArrowRight size={20} />
                            </Link>
                        </div>

                        <p className="text-sm text-[#A0A0A0] mt-8">
                            Essai gratuit • Sans engagement • Installation en 2 min
                        </p>
                    </div>
                </FadeIn>
            </section>
        </>
    );
}
