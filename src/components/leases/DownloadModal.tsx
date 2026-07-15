import { AnimatePresence, motion } from 'framer-motion';
import { X, FileText, FileDown, File } from 'lucide-react';
import { Button } from '../ui/Button';

interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    leaseId?: string; // which lease we're downloading for
}

export function DownloadModal({ isOpen, onClose, leaseId }: DownloadModalProps) {
    const handleDownload = (format: 'pdf' | 'doc' | 'odt') => {
        console.log(`Downloading lease ${leaseId} in format ${format}`);
        // In a real app, this would trigger an API call or a physical download
        onClose();
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
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" role="dialog">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Scarica</h2>
                                    <p className="text-sm text-gray-500 mt-1">Scegli il formato del documento da scaricare.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-6 flex flex-col gap-3 bg-gray-50/50">
                                {/* PDF Option */}
                                <button
                                    onClick={() => handleDownload('pdf')}
                                    className="flex items-center p-4 border border-gray-200 rounded-lg bg-white hover:border-red-300 hover:shadow-md transition-all group text-left cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mr-4 group-hover:bg-red-100 transition-colors">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-gray-900">Documento PDF</h3>
                                        <p className="text-sm text-gray-500">Scarica in formato Adobe PDF</p>
                                    </div>
                                    <div className="text-gray-300 group-hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                        <FileDown className="w-5 h-5" />
                                    </div>
                                </button>

                                {/* Word Option */}
                                <button
                                    onClick={() => handleDownload('doc')}
                                    className="flex items-center p-4 border border-gray-200 rounded-lg bg-white hover:border-blue-300 hover:shadow-md transition-all group text-left cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mr-4 group-hover:bg-blue-100 transition-colors">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-gray-900">Documento Word</h3>
                                        <p className="text-sm text-gray-500">Scarica in formato Microsoft Word</p>
                                    </div>
                                    <div className="text-gray-300 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100">
                                        <FileDown className="w-5 h-5" />
                                    </div>
                                </button>

                                {/* ODT Option */}
                                <button
                                    onClick={() => handleDownload('odt')}
                                    className="flex items-center p-4 border border-gray-200 rounded-lg bg-white hover:border-slate-400 hover:shadow-md transition-all group text-left cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mr-4 group-hover:bg-slate-200 transition-colors">
                                        <File className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-gray-900">Documento ODT</h3>
                                        <p className="text-sm text-gray-500">Scarica in formato Open Office</p>
                                    </div>
                                    <div className="text-gray-300 group-hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100">
                                        <FileDown className="w-5 h-5" />
                                    </div>
                                </button>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-white">
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
