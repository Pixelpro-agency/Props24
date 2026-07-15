import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

interface TerminateLeaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Lease options for the selected tenant */
    leaseOptions: { value: string; label: string }[];
}

export function TerminateLeaseModal({ isOpen, onClose, leaseOptions }: TerminateLeaseModalProps) {
    const [selectedLease, setSelectedLease] = useState('');
    const [error, setError] = useState('');

    function handleConfirm() {
        if (!selectedLease) {
            setError('Seleziona una locazione');
            return;
        }
        setError('');
        console.log('Terminate lease:', selectedLease);
        onClose();
    }

    function handleClose() {
        setSelectedLease('');
        setError('');
        onClose();
    }

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
                        onClick={handleClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden" role="dialog">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">Terminare la locazione</h2>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-4 space-y-3">
                                <Select
                                    id="editdeparture-lease"
                                    value={selectedLease}
                                    onChange={(val) => {
                                        setSelectedLease(val);
                                        setError('');
                                    }}
                                    options={leaseOptions}
                                    placeholder="Scegli la locazione..."
                                    className="w-full"
                                />
                                {error && <p className="text-sm text-red-500">{error}</p>}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <Button variant="secondary" size="md" onClick={handleClose}>
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
