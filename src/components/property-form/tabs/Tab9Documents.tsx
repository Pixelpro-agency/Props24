import { useEffect, useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormSection } from '../ui/FormSection';
import { PlusCircle, FileText, Edit2, Trash2, X, UploadCloud } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { TextInput } from '../ui/TextInput';
import { Select } from '../ui/Select';
import { TextArea } from '../ui/TextArea';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import type { PropertyDocumentFormData, StoredLocalFile } from '../schema';

function newLocalId(prefix: string): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readFileAsStoredLocalFile(file: File): Promise<StoredLocalFile> {
    if (!['image/png', 'image/jpeg', 'application/pdf'].includes(file.type)) {
        return Promise.reject(new Error('Tipo file non supportato.'));
    }
    if (file.size > 3 * 1024 * 1024) {
        return Promise.reject(new Error('File troppo grande. Limite massimo 3 MB.'));
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error || new Error('Impossibile leggere il file.'));
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                reject(new Error('Formato file non serializzabile.'));
                return;
            }
            resolve({
                id: newLocalId('file'),
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
                dataUrl: reader.result,
            });
        };
        reader.readAsDataURL(file);
    });
}

interface DocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: PropertyDocumentFormData) => void;
    initialData: PropertyDocumentFormData | null;
}

function DocumentModal({ isOpen, onClose, onSave, initialData }: DocumentModalProps) {
    const defaultValues: PropertyDocumentFormData = {
        id: '',
        type: '',
        description: '',
        releaseDate: '',
        comments: '',
        shared: false,
        file: null,
    };
    const methods = useForm<PropertyDocumentFormData>({
        defaultValues,
    });
    const selectedFile = methods.watch('file');
    const [fileError, setFileError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFileError(null);
            methods.reset(initialData || defaultValues);
        }
    }, [isOpen, initialData, methods]);

    if (!isOpen) return null;

    const handleFiles = async (files: FileList | File[]) => {
        const file = Array.from(files)[0];
        if (!file) return;
        try {
            setFileError(null);
            methods.setValue('file', await readFileAsStoredLocalFile(file), { shouldDirty: true });
        } catch (error) {
            setFileError(error instanceof Error ? error.message : 'Errore durante il caricamento del file.');
        }
    };

    const handleSubmit = methods.handleSubmit((data) => {
        onSave({ ...data, id: initialData?.id || data.id || newLocalId('document') });
        onClose();
    });

    return (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">

                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-medium text-gray-900">
                        {initialData ? 'Modifica' : 'Aggiungi'} Documento
                    </h2>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <FormProvider {...methods}>
                        <div className="space-y-6">

                            <Select
                                name="type"
                                label="Tipo di documento"
                                options={[
                                    { value: '', label: 'Seleziona un tipo...' },
                                    { value: 'fattura', label: 'Fattura' },
                                    { value: 'preventivo', label: 'Preventivo' },
                                    { value: 'ricevuta', label: 'Ricevuta' },
                                    { value: 'assicurazione', label: 'Assicurazione' },
                                    { value: 'altro', label: 'Altro...' }
                                ]}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">File</label>
                                <input
                                    id="document-file-input"
                                    type="file"
                                    className="hidden"
                                    accept="image/png,image/jpeg,application/pdf"
                                    onChange={(event) => {
                                        if (event.target.files) void handleFiles(event.target.files);
                                    }}
                                />
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-green-400 transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('document-file-input')?.click()}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        void handleFiles(event.dataTransfer.files);
                                    }}
                                >
                                    <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                                    <p className="text-sm font-medium text-gray-700">Clicca per allegare o trascina il file qui</p>
                                    <p className="text-xs mt-1">PNG, JPG, PDF fino a 3 MB</p>
                                </div>
                                {selectedFile && <p className="mt-2 text-sm text-gray-600">File: {selectedFile.name}</p>}
                                {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
                            </div>

                            <TextInput
                                name="description"
                                label="Descrizione"
                                placeholder="es. Fattura idraulico riparazione"
                            />

                            <TextInput
                                name="releaseDate"
                                label="Data"
                                type="date"
                            />

                            <TextArea
                                name="comments"
                                label="Note opzionali"
                            />

                            <ToggleSwitch
                                name="shared"
                                label="Condividi"
                                sideText="Condividi con l'inquilino"
                            />

                        </div>
                    </FormProvider>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        Annulla
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleSubmit()}
                        className="px-4 py-2 bg-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm"
                    >
                        Salva
                    </button>
                </div>

            </div>
        </div>
    );
}

export function Tab9Documents() {
    const { control } = useFormContext();
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'PropertyDocuments',
        keyName: '_rhfId',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const handleAddClick = () => {
        setEditingIndex(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (index: number) => {
        setEditingIndex(index);
        setIsModalOpen(true);
    };

    const handleSave = (data: PropertyDocumentFormData) => {
        if (editingIndex !== null) {
            update(editingIndex, data);
        } else {
            append(data);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FormSection title="Documenti" defaultOpen={true}>

                <div className="grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4">
                    <div className="text-right pt-2">
                        <span className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase">
                            Documenti
                        </span>
                    </div>

                    <div className="flex-1 w-full max-w-[600px] flex flex-col gap-4">

                        {fields.length > 0 && (
                            <div className="flex flex-col gap-3 mb-4">
                                {fields.map((field: any, index) => (
                                    <div key={field._rhfId} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border shadow-sm text-gray-400">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{field.description || field.type || 'Nuovo Documento'}</p>
                                                {field.releaseDate && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Data: {field.releaseDate} {field.shared && '• Condiviso'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEditClick(index)}
                                                className="p-2 hover:bg-gray-200 rounded-md text-gray-600 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="p-2 hover:bg-red-100 rounded-md text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div>
                            <button
                                type="button"
                                onClick={handleAddClick}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            >
                                <PlusCircle className="w-5 h-5 text-gray-700" />
                                Aggiungi un documento
                            </button>
                            <p className="mt-2 text-sm text-gray-500">
                                È possibile aggiungere diversi documenti. Questi documenti verranno salvati nella sezione Documenti.
                            </p>
                        </div>

                    </div>
                </div>

            </FormSection>

            <DocumentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingIndex !== null ? fields[editingIndex] as unknown as PropertyDocumentFormData : null}
            />
        </div>
    );
}
