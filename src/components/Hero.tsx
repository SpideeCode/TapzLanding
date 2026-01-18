import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

export default function Hero() {
  const scrollToWaitlist = () => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,79,24,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,79,24,0.05),transparent_50%)]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-[#FF4F18]/10 border border-[#FF4F18]/20 rounded-full text-[#FF4F18] text-sm font-medium">
              Le futur de la restauration rapide
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            De la table à la cuisine
            <br />
            <span className="text-[#FF4F18]">en 30 secondes</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Tapzy transforme l'expérience restaurant. Vos clients scannent, commandent et paient instantanément.
            Zéro friction, maximum de satisfaction.
          </p>

          <motion.button
            onClick={scrollToWaitlist}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group px-8 py-4 bg-[#FF4F18] text-white text-lg font-semibold rounded-xl shadow-lg shadow-[#FF4F18]/30 hover:shadow-[#FF4F18]/50 transition-all duration-300"
          >
            Réserver un accès anticipé
            <ArrowDown className="inline-block ml-2 w-5 h-5 group-hover:translate-y-1 transition-transform" />
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-20"
        >
          <div className="flex justify-center items-center gap-12 text-gray-400">
            <div>
              <div className="text-3xl font-bold text-white">30s</div>
              <div className="text-sm">Temps moyen</div>
            </div>
            <div className="h-12 w-px bg-gray-700" />
            <div>
              <div className="text-3xl font-bold text-white">+40%</div>
              <div className="text-sm">Rotation tables</div>
            </div>
            <div className="h-12 w-px bg-gray-700" />
            <div>
              <div className="text-3xl font-bold text-white">+25%</div>
              <div className="text-sm">Panier moyen</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
