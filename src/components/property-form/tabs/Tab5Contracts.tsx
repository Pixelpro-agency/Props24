import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormSection } from '../ui/FormSection';
import { PlusCircle, FileText, Edit2, Trash2, X, UploadCloud } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { TextInput } from '../ui/TextInput';
import { Select } from '../ui/Select';
import { TextArea } from '../ui/TextArea';

interface ContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData: any;
}

function ContractModal({ isOpen, onClose, onSave, initialData }: ContractModalProps) {
    const methods = useForm({
        defaultValues: {
            type: '',
            description: '',
            releaseDate: '',
            expiryDate: '',
            comments: ''
        }
    });

    useState(() => {
        if (isOpen) {
            methods.reset(initialData || {
                type: '',
                description: '',
                releaseDate: '',
                expiryDate: '',
                comments: ''
            });
        }
    });

    import('react').then((React) => {
        React.useEffect(() => {
            if (isOpen) {
                methods.reset(initialData || {
                    type: '',
                    description: '',
                    releaseDate: '',
                    expiryDate: '',
                    comments: ''
                });
            }
        }, [isOpen, initialData, methods]);
    });

    if (!isOpen) return null;

    const handleSubmit = methods.handleSubmit((data) => {
        onSave({ id: initialData?.id || Date.now().toString(), ...data });
        onClose();
    });

    return (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">

                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-medium text-gray-900">
                        {initialData ? 'Modifica' : 'Aggiungi'} Documento
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <FormProvider {...methods}>
                        <form id="contract-modal-form" onSubmit={handleSubmit} className="space-y-6">

                            <Select
                                name="type"
                                label="Tipo di documento"
                                options={[
                                    { value: '', label: 'Seleziona un tipo...' },
                                    { value: 'ape', label: 'Attestato di Prestazione Energetica (APE)' },
                                    { value: 'planimetria', label: 'Planimetria Catastale' },
                                    { value: 'visura', label: 'Visura Catastale' },
                                    { value: 'atto', label: 'Atto di Provenienza' },
                                    { value: 'altro', label: 'Altro...' }
                                ]}
                            />

                            {/* Dropzone mockup */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">File</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-green-400 transition-colors cursor-pointer">
                                    <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                                    <p className="text-sm font-medium text-gray-700">Clicca per allegare o trascina il file qui</p>
                                    <p className="text-xs mt-1">PNG, JPG, PDF fino a 15MB</p>
                                </div>
                            </div>

                            <TextInput
                                name="description"
                                label="Descrizione"
                                placeholder="es. Planimetria aggiornata 2024"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <TextInput
                                    name="releaseDate"
                                    label="Data di rilascio"
                                    type="date"
                                />
                                <TextInput
                                    name="expiryDate"
                                    label="Data di scadenza"
                                    type="date"
                                />
                            </div>

                            <TextArea
                                name="comments"
                                label="Note opzionali"
                                placeholder="..."
                            />

                        </form>
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
                        type="submit"
                        form="contract-modal-form"
                        className="px-4 py-2 bg-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm"
                    >
                        Salva
                    </button>
                </div>

            </div>
        </div>
    );
}

export function Tab5Contracts() {
    const { control } = useFormContext();
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'PropertyContracts'
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

    const handleSave = (data: any) => {
        if (editingIndex !== null) {
            update(editingIndex, data);
        } else {
            append(data);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FormSection title="Certificati e contratti" defaultOpen={true}>

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
                                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border shadow-sm text-gray-400">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{field.description || field.type || 'Nuovo Documento'}</p>
                                                {(field.releaseDate || field.expiryDate) && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {field.releaseDate && `Rilascio: ${field.releaseDate}`}
                                                        {field.releaseDate && field.expiryDate && ' - '}
                                                        {field.expiryDate && `Scadenza: ${field.expiryDate}`}
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
                                È possibile aggiungere diversi contratti. I file verranno salvati nella sezione Documenti.
                            </p>
                        </div>

                    </div>
                </div>

            </FormSection>

            <ContractModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingIndex !== null ? fields[editingIndex] : null}
            />
        </div>
    );
}
