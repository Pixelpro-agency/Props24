import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, Archive, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface FloatingActionsProps {
    selectedCount: number;
    onDelete: () => void;
    onArchive: () => void;
}

type ConfirmAction = 'delete' | 'archive' | null;

export function FloatingActions({ selectedCount, onDelete, onArchive }: FloatingActionsProps) {
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

    function handleConfirm() {
        if (confirmAction === 'delete') onDelete();
        if (confirmAction === 'archive') onArchive();
        setConfirmAction(null);
    }

    return (
        <>
            {/* Floating bar */}
            <AnimatePresence>
                {selectedCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white shadow-lg border border-gray-200 rounded-lg px-5 py-3 flex items-center gap-4"
                    >
                        {/* Label + count */}
                        <span className="text-sm font-medium text-gray-700">
                            Azioni
                            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold">
                                {selectedCount}
                            </span>
                        </span>

                        <div className="w-px h-6 bg-gray-200" />

                        {/* Delete */}
                        <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirmAction('delete')}>
                            Elimina
                        </Button>

                        {/* Archive */}
                        <Button variant="secondary" size="sm" icon={Archive} onClick={() => setConfirmAction('archive')}>
                            Archivia
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmation modal */}
            <AnimatePresence>
                {confirmAction && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
                        onClick={() => setConfirmAction(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Attenzione</h3>
                                <button
                                    type="button"
                                    onClick={() => setConfirmAction(null)}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-600 mb-6">
                                {confirmAction === 'delete'
                                    ? "Conferma l'eliminazione degli edifici selezionati."
                                    : "Conferma l'archiviazione degli edifici selezionati."}
                            </p>

                            <div className="flex items-center justify-end gap-3">
                                <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>
                                    Annulla
                                </Button>
                                <Button
                                    variant={confirmAction === 'delete' ? 'danger' : 'primary'}
                                    size="sm"
                                    onClick={handleConfirm}
                                >
                                    Conferma
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
