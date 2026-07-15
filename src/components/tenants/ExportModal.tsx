import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedColumns: string[]) => void;
}

const requiredColumns = [
    'Tipo',
    'Cognome',
    'Data di nascita',
    'Cellulare',
    'Indirizzo',
    'Regione',
    'Paese',
    'Saldo',
    'Nome',
    'Società',
    'Telefono',
    'Email',
    'CAP',
    'Città',
    'Note',
];

const optionalColumns = [
    'RCS / SIREN',
    'Luogo di nascita',
    'Codice fiscale',
    'P.IVA',
];

export function ExportModal({ isOpen, onClose, onConfirm }: ExportModalProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set(optionalColumns));

    function toggleColumn(col: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(col)) {
                next.delete(col);
            } else {
                next.add(col);
            }
            return next;
        });
    }

    function handleConfirm() {
        const all = [...requiredColumns, ...Array.from(selected)];
        onConfirm(all);
        onClose();
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-40 bg-black/40"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden" role="dialog">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">Esporta</h2>
                                    <p className="text-sm text-gray-500">Scegli le colonne da esportare.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
                                {/* Required columns */}
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                        Colonne obbligatorie
                                    </h3>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                        {requiredColumns.map((col) => (
                                            <label
                                                key={col}
                                                className="flex items-center gap-2 text-sm text-gray-500 cursor-not-allowed"
                                                title="Non può essere disabilitato"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked
                                                    disabled
                                                    className="w-4 h-4 rounded border-gray-300 accent-green-600 opacity-60"
                                                />
                                                {col}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Optional columns */}
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                        Colonne opzionali
                                    </h3>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                        {optionalColumns.map((col) => (
                                            <label
                                                key={col}
                                                className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 rounded px-1 py-0.5 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(col)}
                                                    onChange={() => toggleColumn(col)}
                                                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 accent-green-600"
                                                />
                                                {col}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <Button variant="secondary" size="md" onClick={onClose}>
                                    Annulla
                                </Button>
                                <Button variant="primary" size="md" onClick={handleConfirm}>
                                    Conferma
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
