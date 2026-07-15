import { Settings } from 'lucide-react';
import { Newspaper } from 'lucide-react';

/**
 * NewsPanel — pannello placeholder per notizie immobiliari.
 *
 * Struttura predisposta per futura integrazione con un feed di notizie
 * da API esterna. Per ora mostra un messaggio "nessuna notizia".
 */

export interface NewsPanelProps {
    /** Eventuale classe CSS aggiuntiva */
    className?: string;
}

export function NewsPanel({ className }: NewsPanelProps) {
    return (
        <div
            className={`bg-white border border-[#e5e5e5] rounded-sm shadow-sm flex flex-col h-full ${className ?? ''}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#f9f9f9] border-b border-[#e5e5e5]">
                <h2 className="text-gray-800 font-semibold text-[15px]">
                    Notizie immobiliari
                </h2>
                <button
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                    title="Gestire"
                >
                    <Settings className="w-[18px] h-[18px]" />
                </button>
            </div>

            {/* Content — placeholder vuoto */}
            <div className="flex-grow flex flex-col items-center justify-center p-8 min-h-[200px]">
                <Newspaper className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm text-center">
                    Nessuna notizia disponibile
                </p>
                <p className="text-gray-300 text-xs text-center mt-1">
                    Le notizie immobiliari appariranno qui quando saranno disponibili.
                </p>
            </div>
        </div>
    );
}
