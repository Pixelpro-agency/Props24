import { useMemo, useRef, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, FileText, FolderOpen, Info, Pencil, Plus, Share2, Trash2, Upload } from 'lucide-react';
import { Modal } from '../../property-form/ui/Modal';
import { FormSection } from '../../property-form/ui/FormSection';
import { DOCUMENT_CATEGORIES } from '../../../types/tenant';
import { getJsonDb } from '../../../db/jsonDb';
import { StatusToast } from '../../ui/StatusToast';
import {
    calculateTenantAttachmentBytes,
    MAX_TENANT_DOCUMENT_BYTES,
    MAX_TENANT_TOTAL_ATTACHMENT_BYTES,
    type TenantFormData,
} from '../schema';

type DocumentMode = 'new' | 'existing';
type TenantDocumentForm = TenantFormData['TenantDocuments'][number];

const generateId = () => `doc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function downloadDataUrl(dataUrl: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

export function Tab5Documents() {
    const { control, getValues } = useFormContext<TenantFormData>();
    const { fields: documents, prepend, remove, update } = useFieldArray({ control, name: 'TenantDocuments', keyName: 'fieldId' });
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [documentMode, setDocumentMode] = useState<DocumentMode>('new');
    const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number>(0);
    const [description, setDescription] = useState('');
    const [isShared, setIsShared] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedExistingId, setSelectedExistingId] = useState('');
    const [documentError, setDocumentError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const existingDocuments = useMemo(() => getJsonDb().documents.filter((document) => document.file?.dataUrl), []);
    const selectedCategoryLabel = DOCUMENT_CATEGORIES.find((category) => category.id === selectedCategory)?.label || '';
    const editingIndex = editingDocumentId ? documents.findIndex((document) => document.id === editingDocumentId) : -1;
    const editingDocument = editingIndex !== -1 ? documents[editingIndex] : null;

    const showDocumentError = (message: string) => setDocumentError(message);

    const resetModal = () => {
        setDocumentMode('new');
        setEditingDocumentId(null);
        setSelectedCategory(0);
        setDescription('');
        setIsShared(false);
        setSelectedFile(null);
        setSelectedExistingId('');
        setDocumentError(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const closeDocumentModal = () => {
        setIsDocumentModalOpen(false);
        resetModal();
    };

    const openNewDocumentModal = () => {
        resetModal();
        setIsDocumentModalOpen(true);
    };

    const openEditDocumentModal = (id: string) => {
        const document = documents.find((item) => item.id === id);
        if (!document) return;
        setEditingDocumentId(document.id);
        setDocumentMode(document.existingDocumentId ? 'existing' : 'new');
        setSelectedCategory(document.categoryId || 0);
        setDescription(document.description || '');
        setIsShared(document.isShared);
        setSelectedFile(null);
        setSelectedExistingId(document.existingDocumentId || '');
        setDocumentError(null);
        if (inputRef.current) inputRef.current.value = '';
        setIsDocumentModalOpen(true);
    };

    const validateFile = (file: File): boolean => {
        if (!validTypes.includes(file.type)) {
            showDocumentError('Formato file non supportato. Usa PDF, JPG, PNG o WebP.');
            return false;
        }
        if (file.size > MAX_TENANT_DOCUMENT_BYTES) {
            showDocumentError('Il file supera la dimensione massima di 2MB.');
            return false;
        }
        setDocumentError(null);
        return true;
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        if (!file) return;
        if (!validateFile(file)) {
            setSelectedFile(null);
            if (inputRef.current) inputRef.current.value = '';
            return;
        }
        setSelectedFile(file);
    };

    const commitDocument = (nextDocument: TenantDocumentForm) => {
        const nextDocuments = editingIndex !== -1
            ? getValues().TenantDocuments.map((document) => document.id === editingDocumentId ? nextDocument : document)
            : [nextDocument, ...getValues().TenantDocuments];
        const nextValues = { ...getValues(), TenantDocuments: nextDocuments };
        if (calculateTenantAttachmentBytes(nextValues) > MAX_TENANT_TOTAL_ATTACHMENT_BYTES) {
            showDocumentError("Limite allegati superato.\nLa dimensione totale dei file dell'inquilino non può superare 3 MB.");
            return;
        }
        if (editingIndex !== -1) update(editingIndex, nextDocument);
        else prepend(nextDocument);
        closeDocumentModal();
    };

    const saveNewDocument = () => {
        if (!selectedCategory) {
            showDocumentError('Seleziona un tipo documento.');
            return;
        }
        if (!selectedFile && !editingDocument?.file) {
            showDocumentError('Seleziona un file prima di salvare.');
            return;
        }

        const buildDocument = (file: NonNullable<TenantDocumentForm['file']>) => ({
            id: editingDocumentId || generateId(),
            fileName: file.name,
            existingDocumentId: undefined,
            categoryId: selectedCategory,
            categoryLabel: selectedCategoryLabel,
            description: description.trim(),
            uploadDate: editingDocument?.uploadDate || new Date().toISOString(),
            fileSize: file.size,
            isShared,
            fileUrl: '',
            file,
        });

        if (!selectedFile && editingDocument?.file) {
            commitDocument(buildDocument(editingDocument.file));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (!selectedFile) return;
            commitDocument(buildDocument({
                id: `tenant-doc-${selectedFile.lastModified}-${selectedFile.size}`,
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size,
                lastModified: selectedFile.lastModified,
                dataUrl: event.target?.result as string,
            }));
        };
        if (selectedFile) reader.readAsDataURL(selectedFile);
    };

    const saveExistingDocument = () => {
        if (!selectedExistingId) {
            showDocumentError('Seleziona un documento esistente.');
            return;
        }
        if (documents.some((document) => document.existingDocumentId === selectedExistingId && document.id !== editingDocumentId)) {
            showDocumentError('Questo documento è già collegato a questo inquilino.');
            return;
        }
        const existing = existingDocuments.find((document) => document.id === selectedExistingId);
        if (!existing?.file) {
            showDocumentError('Il contenuto del documento selezionato non è disponibile.');
            return;
        }
        commitDocument({
            id: editingDocumentId || generateId(),
            existingDocumentId: existing.id,
            fileName: existing.file.name,
            categoryId: selectedCategory || editingDocument?.categoryId || 1,
            categoryLabel: selectedCategoryLabel || editingDocument?.categoryLabel || 'Documento esistente',
            description: description.trim(),
            uploadDate: editingDocument?.uploadDate || new Date().toISOString(),
            fileSize: existing.file.size,
            isShared,
            fileUrl: '',
            file: existing.file,
        });
    };

    const handleSaveDocument = () => {
        if (documentMode === 'new') saveNewDocument();
        else saveExistingDocument();
    };

    const confirmDelete = () => {
        if (deleteId) {
            const index = documents.findIndex((document) => document.id === deleteId);
            if (index !== -1) remove(index);
        }
        setIsDeleteModalOpen(false);
        setDeleteId(null);
    };

    const toggleShared = (id: string) => {
        const index = documents.findIndex((document) => document.id === id);
        if (index !== -1) update(index, { ...documents[index], isShared: !documents[index].isShared });
    };

    const handleDownload = (doc: TenantDocumentForm) => {
        if (!doc.file?.dataUrl) {
            showDocumentError('Il contenuto del documento non è disponibile.');
            return;
        }
        downloadDataUrl(doc.file.dataUrl, doc.file.name || doc.fileName);
    };

    return (
        <div className="p-6">
            <StatusToast
                toast={documentError ? { variant: 'error', title: 'Errore', message: documentError } : null}
                onClose={() => setDocumentError(null)}
            />
            <FormSection title="Documenti">
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                    <p className="text-sm text-blue-700">Aggiungi documenti nuovi o collega documenti esistenti. Dimensione massima: 2MB per file.</p>
                </div>

                <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800">Archivio documenti inquilino</h3>
                        <p className="mt-1 text-sm text-gray-500">Tipo, descrizione, condivisione e download restano salvati nella bozza.</p>
                    </div>
                    <button type="button" onClick={openNewDocumentModal} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700">
                        <Plus className="h-4 w-4" />
                        Nuovo documento
                    </button>
                </div>

                {documentError && <p className="mb-4 whitespace-pre-line text-sm font-medium text-red-600">{documentError}</p>}

                {documents.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                        <FolderOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">Nessun documento caricato</p>
                        <p className="mt-1 text-xs text-gray-400">Aggiungi un documento nuovo o collegane uno esistente</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Nome</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Tipo</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Descrizione</th>
                                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 sm:table-cell">Data</th>
                                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 md:table-cell">Dimensione</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">Condiviso</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                <AnimatePresence>
                                    {documents.map((doc) => (
                                        <motion.tr key={doc.id} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="transition-colors hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                                    <span className="max-w-[200px] truncate text-sm font-medium text-gray-900">{doc.fileName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3"><span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">{doc.categoryLabel}</span></td>
                                            <td className="max-w-[220px] truncate px-4 py-3 text-sm text-gray-500">{doc.description || '—'}</td>
                                            <td className="hidden px-4 py-3 text-sm text-gray-500 sm:table-cell">{formatDate(doc.uploadDate)}</td>
                                            <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">{formatFileSize(doc.fileSize)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button type="button" onClick={() => toggleShared(doc.id)} className={`rounded-md p-1.5 transition-colors ${doc.isShared ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`} title={doc.isShared ? 'Condiviso con inquilino' : 'Non condiviso'}>
                                                    <Share2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button type="button" onClick={() => handleDownload(doc)} className="rounded-md p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600" title="Scarica"><Download className="h-4 w-4" /></button>
                                                    <button type="button" onClick={() => openEditDocumentModal(doc.id)} className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700" title="Modifica"><Pencil className="h-4 w-4" /></button>
                                                    <button type="button" onClick={() => { setDeleteId(doc.id); setIsDeleteModalOpen(true); }} className="rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Elimina"><Trash2 className="h-4 w-4" /></button>
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

            <Modal
                isOpen={isDocumentModalOpen}
                onClose={closeDocumentModal}
                title={editingDocumentId ? 'Modifica documento' : 'Nuovo documento'}
                maxWidth="lg"
                footer={
                    <>
                        <button type="button" onClick={closeDocumentModal} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Annulla</button>
                        <button type="button" onClick={handleSaveDocument} disabled={documentMode === 'existing' && existingDocuments.length === 0} className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">Salva</button>
                    </>
                }
            >
                <div className="space-y-5">
                    <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-1">
                        {(['new', 'existing'] as DocumentMode[]).map((mode) => (
                            <button key={mode} type="button" onClick={() => { setDocumentMode(mode); setDocumentError(null); }} className={`rounded px-3 py-1.5 text-sm font-medium ${documentMode === mode ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                                {mode === 'new' ? 'Nuovo' : 'Esistente'}
                            </button>
                        ))}
                    </div>

                    {documentMode === 'new' && (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo documento</label>
                            <select value={selectedCategory} onChange={(event) => setSelectedCategory(Number(event.target.value))} className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500">
                                <option value={0}>Scegli</option>
                                {DOCUMENT_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                            </select>
                        </div>
                    )}

                    {documentMode === 'new' ? (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">File</label>
                            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} className="hidden" id="tenant-document-upload" />
                            <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                                <Upload className="h-4 w-4" />
                                Scegli file
                            </button>
                            {selectedFile && <p className="mt-2 text-sm text-gray-600">{selectedFile.name} - {formatFileSize(selectedFile.size)} - {selectedFile.type}</p>}
                            {!selectedFile && editingDocument?.file && <p className="mt-2 text-sm text-gray-600">{editingDocument.file.name} - {formatFileSize(editingDocument.file.size)} - {editingDocument.file.type}</p>}
                        </div>
                    ) : (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">Documento esistente</label>
                            {existingDocuments.length === 0 ? (
                                <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">Nessun documento esistente disponibile</p>
                            ) : (
                                <select value={selectedExistingId} onChange={(event) => setSelectedExistingId(event.target.value)} className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500">
                                    <option value="">Seleziona documento</option>
                                    {existingDocuments.map((document) => <option key={document.id} value={document.id}>{document.file?.name || document.id}</option>)}
                                </select>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Descrizione</label>
                        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500" />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={isShared} onChange={(event) => setIsShared(event.target.checked)} className="h-4 w-4 accent-green-600" />
                        Condividi con l'inquilino
                    </label>
                    {documentError && <p className="whitespace-pre-line text-sm font-medium text-red-600">{documentError}</p>}
                </div>
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Attenzione"
                maxWidth="sm"
                footer={
                    <>
                        <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Annulla</button>
                        <button type="button" onClick={confirmDelete} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700">Conferma</button>
                    </>
                }
            >
                <p className="text-sm text-gray-600">Conferma l'eliminazione di questo documento. L'azione non può essere annullata.</p>
            </Modal>
        </div>
    );
}
