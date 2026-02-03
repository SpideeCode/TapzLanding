import { QrCode, Loader2 } from 'lucide-react';

export function Loading() {
    return (
        <div className="fixed inset-0 bg-[#0A0A0B] flex flex-col items-center justify-center z-50">
            <div className="relative">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center animate-pulse">
                    <QrCode className="w-8 h-8 text-blue-500" />
                </div>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                    <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">Loading Tapzy</span>
                </div>
            </div>
        </div>
    );
}
