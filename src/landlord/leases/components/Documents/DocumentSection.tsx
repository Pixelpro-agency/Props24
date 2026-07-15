import React, { useState } from 'react';
import { Download, FileText, Printer, FileType } from 'lucide-react';
import { DownloadModal } from '../Modals/DownloadModal';

interface DocumentSectionProps {
    leaseId?: number;
}

export const DocumentSection: React.FC<DocumentSectionProps> = ({ leaseId = 1 }) => {
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [activeDocument, setActiveDocument] = useState<'contratto' | 'verbale' | 'allegato'>('contratto');

    // URL mock di un PDF (potrebbe essere un blob URL in un'app reale)
    const mockPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

    const handleDownload = (format: 'pdf' | 'word' | 'odt') => {
        // In un'app reale, chiameremmo l'API per generare/scaricare il file col mimetype giusto
        console.log(`Downloading lease ${leaseId} document as ${format}`);
        alert(`Scaricamento avviato in formato: ${format.toUpperCase()}`);
    };

    const handlePrint = () => {
        const iframe = document.getElementById('pdf-preview-iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 shrink-0">
                <div>
                    <h3 className="text-lg font-semibold text-[#333]">Documenti e Anteprima</h3>
                    <p className="text-sm text-gray-500">Visualizza l'anteprima del contratto generato o scaricalo in vari formati.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                        <Printer className="w-4 h-4" /> Stampa
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsDownloadModalOpen(true)}
                        className="flex items-center gap-2 bg-[#5cb85c] hover:bg-[#449d44] text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" /> Scarica
                    </button>
                </div>
            </div>

            <div className="flex gap-4 h-[600px] bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Sidebar Nav (Left) */}
                <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
                    <div className="p-3 border-b border-gray-200 font-medium text-sm text-gray-700">
                        Fascicolo
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <button
                            onClick={() => setActiveDocument('contratto')}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${activeDocument === 'contratto'
                                    ? 'bg-blue-100 text-[#337ab7] font-medium'
                                    : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="truncate">Contratto Principale</span>
                        </button>
                        <button
                            onClick={() => setActiveDocument('verbale')}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${activeDocument === 'verbale'
                                    ? 'bg-blue-100 text-[#337ab7] font-medium'
                                    : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <FileType className="w-4 h-4 shrink-0" />
                            <span className="truncate">Verbale di Consegna</span>
                        </button>
                        <button
                            onClick={() => setActiveDocument('allegato')}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${activeDocument === 'allegato'
                                    ? 'bg-blue-100 text-[#337ab7] font-medium'
                                    : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="truncate">Attestato (APE)</span>
                        </button>
                    </div>
                </div>

                {/* PDF Viewer (Right) */}
                <div className="flex-1 bg-gray-100 flex flex-col items-center justify-center relative">
                    <iframe
                        id="pdf-preview-iframe"
                        src={`${mockPdfUrl}#toolbar=0`}
                        title="Anteprima PDF"
                        className="w-full h-full border-0 absolute inset-0 z-10"
                        allowFullScreen
                    />
                    {/* Fallback spinner underneath iframe */}
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#337ab7]"></div>
                    </div>
                </div>
            </div>

            <DownloadModal
                isOpen={isDownloadModalOpen}
                onClose={() => setIsDownloadModalOpen(false)}
                onDownload={handleDownload}
            />
        </div>
    );
};
