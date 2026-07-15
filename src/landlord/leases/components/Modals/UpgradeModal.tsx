import React from 'react';
import { Star, X, CheckCircle } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
    isOpen,
    onClose,
    featureName = 'Questa funzionalità'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-8 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                            <Star className="w-8 h-8 text-white fill-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Passa a Premium</h2>
                        <p className="text-white/90 text-sm max-w-sm">
                            {featureName} è riservata agli utenti con abbonamento Premium. Sblocca tutto il potenziale del gestionale.
                        </p>
                    </div>
                </div>

                {/* Benefits */}
                <div className="px-8 py-6 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 text-center">
                        Cosa include Premium
                    </h3>
                    <ul className="space-y-3">
                        {[
                            'Firme elettroniche illimitate con validità legale',
                            'Gestione completa subentri e risoluzioni anticipate',
                            'Generazione automatica di ricevute e MAV',
                            'Supporto prioritario 7 giorni su 7',
                            'Archivio documenti in cloud da 50GB'
                        ].map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                <span className="text-sm text-gray-700">{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Action */}
                <div className="p-6 bg-white flex flex-col items-center border-t border-gray-100">
                    <button
                        type="button"
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                        onClick={() => {
                            window.location.href = '/landlord/#inscription';
                        }}
                    >
                        Scopri i piani Premium
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-4 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                    >
                        Forse più tardi
                    </button>
                </div>
            </div>
        </div>
    );
};
