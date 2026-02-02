import React from 'react';
import '@google/model-viewer';

// Declare the custom element for TypeScript
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
                src?: string;
                'ios-src'?: string;
                poster?: string;
                alt?: string;
                ar?: boolean;
                'ar-modes'?: string;
                'camera-controls'?: boolean;
                'touch-action'?: string;
                'shadow-intensity'?: string;
                'shadow-softness'?: string;
                exposure?: string;
                'auto-rotate'?: boolean;
            }, HTMLElement>;
        }
    }
}

interface DishARViewProps {
    glbUrl: string;
    usdzUrl?: string; // Optional for iOS
    posterUrl?: string;
    altText?: string;
}

export const DishARView: React.FC<DishARViewProps> = ({ glbUrl, usdzUrl, posterUrl, altText }) => {
    return (
        <div className="w-full h-[400px] bg-gray-50 rounded-3xl overflow-hidden relative shadow-inner border border-gray-100">
            <model-viewer
                src={glbUrl}
                ios-src={usdzUrl}
                poster={posterUrl}
                alt={altText || "Modèle 3D du plat"}
                style={{ width: '100%', height: '100%' }}

                // AR Configuration
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                touch-action="pan-y"

                // Aesthetics
                shadow-intensity="1"
                shadow-softness="1"
                exposure="1.2"
                auto-rotate
            >
                {/* Custom AR Button */}
                <button slot="ar-button" className="absolute bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 uppercase tracking-widest text-xs z-10">
                    <span>Voir en AR 🍽️</span>
                </button>
            </model-viewer>

            {/* Hint for user */}
            <div className="absolute top-4 left-0 right-0 text-center pointer-events-none">
                <span className="bg-white/80 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                    👆 Touchez pour interagir
                </span>
            </div>
        </div>
    );
};
