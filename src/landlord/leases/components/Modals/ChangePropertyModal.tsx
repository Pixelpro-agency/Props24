import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ChangePropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    newPropertyName?: string;
}

export const ChangePropertyModal: React.FC<ChangePropertyModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    newPropertyName
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" /> Attenzione
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4">
                    <p className="text-sm text-gray-600 mb-4">
                        Stai per cambiare la proprietà associata a questo contratto {newPropertyName ? `in "${newPropertyName}"` : ''}.
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                        Questa operazione sovrascriverà i dati finanziari attualmente inseriti (canone, spese) per adeguarli a quelli predefiniti della nuova unità immobiliare.
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                        Sei sicuro di voler procedere?
                    </p>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Annulla
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded transition-colors"
                    >
                        Sì, cambia proprietà
                    </button>
                </div>
            </div>
        </div>
    );
};
