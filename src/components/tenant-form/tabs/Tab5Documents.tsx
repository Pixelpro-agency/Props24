// Tab 5: Documenti — upload file con categoria e tabella documenti
// Senza drag & drop, solo file input standard con selezione categoria
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Download, Share2, FileText, Info, FolderOpen } from 'lucide-react';
import { Modal } from '../../property-form/ui/Modal';
import { FormSection } from '../../property-form/ui/FormSection';
import { DOCUMENT_CATEGORIES } from '../../../types/tenant';
import type { TenantDocument } from '../../../types/tenant';

const generateId = () => `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function Tab5Documents() {
    const [documents, setDocuments] = useState<TenantDocument[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number>(1); // Default: "Altro"
    const [uploadError, setUploadError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const MAX_SIZE_MB = 15;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validazione dimensione
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setUploadError(`Il file supera la dimensione massima di ${MAX_SIZE_MB}MB`);
            return;
        }

        setUploadError(null);

        const categoryObj = DOCUMENT_CATEGORIES.find(c => c.id === selectedCategory);

        const newDoc: TenantDocument = {
            id: generateId(),
            fileName: file.name,
            categoryId: selectedCategory,
            categoryLabel: categoryObj?.label || 'Altro',
            uploadDate: new Date().toISOString(),
            fileSize: file.size,
            isShared: false,
        };

        setDocuments(prev => [newDoc, ...prev]);

        // Reset input
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (deleteId) {
            setDocuments(prev => prev.filter(d => d.id !== deleteId));
        }
        setIsDeleteModalOpen(false);
        setDeleteId(null);
    };

    const toggleShared = (id: string) => {
        setDocuments(prev =>
            prev.map(d => d.id === id ? { ...d, isShared: !d.isShared } : d)
        );
    };

    const handleDownload = (doc: TenantDocument) => {
        // Mock download — in produzione scaricherà il file dal server
        console.log('Download:', doc.fileName);
        alert(`Download di "${doc.fileName}" (mock — nessun file reale)`);
    };

    return (
        <div className="p-6">
            <FormSection title="Documenti">
                {/* Info */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">
                        Carica i documenti relativi all'inquilino. Seleziona una categoria prima di caricare il file.
                        Dimensione massima: {MAX_SIZE_MB}MB per file.
                    </p>
                </div>

                {/* Upload area */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-6 p-5 bg-gray-50 border border-gray-200 rounded-lg">
                    {/* Selezione categoria */}
                    <div className="flex-1 w-full sm:max-w-xs">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Categoria documento
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(Number(e.target.value))}
                            className="block w-full rounded-md border border-gray-300 text-sm py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        >
                            {DOCUMENT_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Bottone upload */}
                    <div>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".gif,.png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                            onChange={handleFileChange}
                            className="hidden"
                            id="doc-upload-input"
                        />
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Carica documento
                        </button>
                    </div>
                </div>

                {uploadError && (
                    <p className="text-sm text-red-600 font-medium mb-4">{uploadError}</p>
                )}

                {/* Tabella documenti */}
                {documents.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">Nessun documento caricato</p>
                        <p className="text-xs text-gray-400 mt-1">Seleziona una categoria e carica un file per iniziare</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Nome
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Categoria
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                                        Data
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                                        Dimensione
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Condiviso
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Azioni
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                <AnimatePresence>
                                    {documents.map((doc) => (
                                        <motion.tr
                                            key={doc.id}
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            {/* Nome */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                                        {doc.fileName}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Categoria */}
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                    {doc.categoryLabel}
                                                </span>
                                            </td>
                                            {/* Data */}
                                            <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                                                {formatDate(doc.uploadDate)}
                                            </td>
                                            {/* Dimensione */}
                                            <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                                                {formatFileSize(doc.fileSize)}
                                            </td>
                                            {/* Condiviso toggle */}
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShared(doc.id)}
                                                    className={`p-1.5 rounded-md transition-colors ${doc.isShared
                                                        ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                    title={doc.isShared ? 'Condiviso con inquilino' : 'Non condiviso'}
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                            {/* Azioni */}
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownload(doc)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                        title="Scarica"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteClick(doc.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Elimina"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </FormSection>

            {/* === Modal Conferma Elimina === */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Attenzione"
                maxWidth="sm"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                        >
                            Conferma
                        </button>
                    </>
                }
            >
                <p className="text-sm text-gray-600">
                    Conferma l'eliminazione di questo documento. L'azione non può essere annullata.
                </p>
            </Modal>
        </div>
    );
}
