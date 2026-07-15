import React from 'react';
import { X, FileSignature } from 'lucide-react';

interface SignatureStartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export const SignatureStartModal: React.FC<SignatureStartModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FileSignature className="w-5 h-5 text-[#337ab7]" /> Avvia procedura di firma
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                    <p className="text-sm text-gray-600">
                        Avviando la procedura di firma elettronica, verrà generata la versione finale del contratto in PDF.
                        Il documento verrà poi inoltrato a tutti i firmatari via email per l'apposizione della firma.
                    </p>
                    <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm">
                        <strong className="block mb-1">Attenzione:</strong>
                        Una volta avviata la procedura, il contratto in bozza verrà <strong>bloccato</strong> e non potrà più essere modificato.
                        Se sarà necessario apportare modifiche, la procedura andrà annullata e riavviata.
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Annulla
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-6 py-2 bg-[#5cb85c] hover:bg-[#449d44] text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Avvio in corso...' : 'Conferma avvio'}
                    </button>
                </div>
            </div>
        </div>
    );
};
