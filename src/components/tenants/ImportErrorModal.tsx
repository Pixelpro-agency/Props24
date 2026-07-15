import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface ImportErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ImportErrorModal({ isOpen, onClose }: ImportErrorModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-40 bg-black/40"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden" role="dialog">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Errore
                                </h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="px-6 py-6">
                                <p className="text-sm text-gray-700">
                                    Si è verificato un errore nel caricamento del tuo file.
                                </p>
                            </div>
                            <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <Button variant="secondary" size="md" onClick={onClose}>
                                    Chiudi
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
