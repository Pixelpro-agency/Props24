import React from 'react';
import { Download, FileText, X } from 'lucide-react';

interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDownload: (format: 'pdf' | 'word' | 'odt') => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
    isOpen,
    onClose,
    onDownload
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Download className="w-5 h-5 text-[#337ab7]" /> Scarica Contratto
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4">
                    <p className="text-sm text-gray-600 mb-6">
                        Scegli il formato in cui desideri esportare e scaricare l'attuale versione del contratto e dei suoi allegati.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => { onDownload('pdf'); onClose(); }}
                            className="w-full flex items-center justify-between px-4 py-3 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg group transition-colors"
                        >
                            <div className="flex items-center gap-3 text-red-700">
                                <FileText className="w-5 h-5" />
                                <span className="font-medium">Documento PDF</span>
                            </div>
                            <span className="text-xs text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">Consigliato</span>
                        </button>
                        <button
                            onClick={() => { onDownload('word'); onClose(); }}
                            className="w-full flex items-center justify-between px-4 py-3 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                            <div className="flex items-center gap-3 text-blue-800">
                                <FileText className="w-5 h-5" />
                                <span className="font-medium">Microsoft Word (.docx)</span>
                            </div>
                        </button>
                        <button
                            onClick={() => { onDownload('odt'); onClose(); }}
                            className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <div className="flex items-center gap-3 text-gray-700">
                                <FileText className="w-5 h-5" />
                                <span className="font-medium">OpenDocument (.odt)</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
