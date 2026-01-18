import { QrCode, Smartphone, Zap, Clock, CreditCard, Users, ArrowRight, Check, LogOut } from 'lucide-react';

import InteractiveDemo from './components/InteractiveDemo';

// Mock auth state for the landing page
const auth = undefined; // or { user: { name: 'Demo User' } }
const isAuthenticated = Boolean(auth);

export default function App() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#EAEAEA] font-sans">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center hover:bg-[#2563EB] transition-colors">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#3B82F6]">
              Tapzy
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-[#EAEAEA]">Bonjour, User</span>
                <button
                  className="flex items-center gap-2 px-4 py-2 text-[#A0A0A0] hover:text-[#3B82F6] transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Déconnexion
                </button>
              </>
            ) : (
              <a
                href="#demo"
                className="px-6 py-2 bg-[#3B82F6] text-white rounded-full hover:bg-[#2563EB] hover:shadow-lg transition-all hover:scale-105 font-medium"
              >
                Démo
              </a>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
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
            <div className="flex flex-wrap gap-4">
              <a
                href={isAuthenticated ? '/dashboard' : '/register'}
                className="group px-8 py-4 bg-[#3B82F6] text-white rounded-full font-semibold hover:bg-[#2563EB] hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
              >
                {isAuthenticated ? 'Tableau de bord' : 'Commencer maintenant'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <button className="px-8 py-4 border-2 border-[#3B82F6] text-[#3B82F6] rounded-full font-semibold hover:bg-[#161617] transition-all">
                Voir la démo
              </button>
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
      </section>

      {/* Interactive Demo Section */}
      <div id="demo">
        <InteractiveDemo />
      </div>

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-[#EAEAEA]">
            Pourquoi choisir <span className="text-[#3B82F6]">Tapzy</span> ?
          </h2>
          <p className="text-xl text-[#A0A0A0]">
            Une solution complète pour moderniser votre établissement
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="group p-8 bg-[#161617] rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-[#2A2A2B]">
            <div className="w-16 h-16 bg-[#3B82F6] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#2563EB] group-hover:scale-110 transition-all">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-[#EAEAEA]">Rapidité</h3>
            <p className="text-[#A0A0A0]">
              Réduisez les temps d'attente. Vos clients commandent instantanément sans attendre le serveur.
            </p>
          </div>

          <div className="group p-8 bg-[#161617] rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-[#2A2A2B]">
            <div className="w-16 h-16 bg-[#3B82F6] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#2563EB] group-hover:scale-110 transition-all">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-[#EAEAEA]">Libérez vos équipes</h3>
            <p className="text-[#A0A0A0]">
              Vos serveurs se concentrent sur l'expérience client plutôt que sur la prise de commande.
            </p>
          </div>

          <div className="group p-8 bg-[#161617] rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-[#2A2A2B]">
            <div className="w-16 h-16 bg-[#3B82F6] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#2563EB] group-hover:scale-110 transition-all">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-[#EAEAEA]">Paiement intégré</h3>
            <p className="text-[#A0A0A0]">
              Paiement sécurisé directement depuis l'application. Fini les allers-retours pour l'addition.
            </p>
          </div>

          <div className="group p-8 bg-[#161617] rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-[#2A2A2B]">
            <div className="w-16 h-16 bg-[#3B82F6] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#2563EB] group-hover:scale-110 transition-all">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-[#EAEAEA]">Gain de temps</h3>
            <p className="text-[#A0A0A0]">
              Augmentez votre rotation de tables et servez plus de clients sans stress.
            </p>
          </div>

          <div className="group p-8 bg-[#161617] rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-[#2A2A2B]">
            <div className="w-16 h-16 bg-[#3B82F6] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#2563EB] group-hover:scale-110 transition-all">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-[#EAEAEA]">Zéro installation</h3>
            <p className="text-[#A0A0A0]">
              Aucune application à télécharger pour vos clients. Tout fonctionne depuis le navigateur.
            </p>
          </div>

          <div className="group p-8 bg-[#161617] rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-[#2A2A2B]">
            <div className="w-16 h-16 bg-[#3B82F6] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#2563EB] group-hover:scale-110 transition-all">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-[#EAEAEA]">Simple à mettre en place</h3>
            <p className="text-[#A0A0A0]">
              Imprimez vos QR codes, collez-les sur vos tables. C'est prêt !
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#EAEAEA] mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-[#A0A0A0]">
              En 3 étapes simples pour vos clients
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-3xl font-bold text-[#3B82F6]">1</span>
              </div>
              <h3 className="text-2xl font-bold text-[#EAEAEA] mb-4">Scanner</h3>
              <p className="text-[#A0A0A0]">
                Le client scanne le QR code sur la table avec son smartphone
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-3xl font-bold text-[#3B82F6]">2</span>
              </div>
              <h3 className="text-2xl font-bold text-[#EAEAEA] mb-4">Commander</h3>
              <p className="text-[#A0A0A0]">
                Il parcourt le menu, choisit ses plats et valide sa commande
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-3xl font-bold text-[#3B82F6]">3</span>
              </div>
              <h3 className="text-2xl font-bold text-[#EAEAEA] mb-4">Payer</h3>
              <p className="text-[#A0A0A0]">
                Paiement sécurisé en un clic, sans attendre l'addition
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-[#161617] rounded-3xl p-12 lg:p-20 text-center border-2 border-[#2A2A2B]">
          <h2 className="text-4xl font-bold mb-6 text-[#EAEAEA]">Prêt à révolutionner votre restaurant ?</h2>
          <p className="text-xl text-[#A0A0A0] mb-10 max-w-2xl mx-auto">
            Rejoignez les centaines d'établissements qui font confiance à Tapzy pour moderniser leur service et améliorer l'expérience client.
          </p>
          <button className="px-12 py-5 bg-[#3B82F6] text-white rounded-full font-bold text-lg hover:bg-[#2563EB] hover:shadow-2xl transition-all hover:scale-105">
            Commencer gratuitement
          </button>
          <p className="text-sm text-[#A0A0A0] mt-4">
            Sans engagement • Configuration en 5 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A0A0B] py-12 border-t border-[#2A2A2B]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center hover:bg-[#2563EB] transition-colors">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#3B82F6]">
                Tapzy
              </span>
            </div>
            <div className="text-[#A0A0A0]">
              &copy; 2025 Tapzy. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
