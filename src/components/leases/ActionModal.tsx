import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
}

export function ActionModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Conferma',
    cancelText = 'Annulla',
    variant = 'primary',
}: ActionModalProps) {

    const handleConfirm = () => {
        onConfirm();
    };

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
                        <div
                            className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="modal-title"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2 text-gray-800">
                                    <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
                                    <h2 id="modal-title" className="text-lg font-semibold">
                                        {title}
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-6">
                                <p className="text-gray-600 text-[15px] leading-relaxed">
                                    {message}
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end items-center gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                                <Button variant="secondary" onClick={onClose}>
                                    {cancelText}
                                </Button>
                                <Button
                                    variant={variant === 'danger' ? 'danger' : 'primary'}
                                    onClick={handleConfirm}
                                >
                                    {confirmText}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
