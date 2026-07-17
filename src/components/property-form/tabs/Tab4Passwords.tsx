import { useEffect, useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormSection } from '../ui/FormSection';
import { PlusCircle, Key, Edit2, Trash2, X } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { TextInput } from '../ui/TextInput';
import { NumberInput } from '../ui/NumberInput';
import { TextArea } from '../ui/TextArea';
import { Select } from '../ui/Select';
import type { PropertyKeyFormData } from '../schema';

function newLocalId(prefix: string): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface KeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: PropertyKeyFormData) => void;
    initialData: PropertyKeyFormData | null;
}

function KeyModal({ isOpen, onClose, onSave, initialData }: KeyModalProps) {
    const defaultValues: PropertyKeyFormData = {
        id: '',
        description: '',
        number: '',
        quantity: 1,
        holder: '',
        comments: '',
    };
    const methods = useForm<PropertyKeyFormData>({
        defaultValues: {
            ...defaultValues,
        }
    });

    useEffect(() => {
        if (isOpen) methods.reset(initialData || defaultValues);
    }, [isOpen, initialData, methods]);

    if (!isOpen) return null;

    const handleSubmit = methods.handleSubmit((data) => {
        onSave({ ...data, id: initialData?.id || data.id || newLocalId('key') });
        onClose();
    });

    return (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">

                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-medium text-gray-900">
                        {initialData ? 'Modifica' : 'Aggiungi'} Password o codice
                    </h2>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <FormProvider {...methods}>
                        <div className="space-y-6">

                            <TextInput
                                name="description"
                                label="Descrizione"
                                placeholder="es. Allarme, Cassetta postale, ecc."
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <TextInput
                                    name="number"
                                    label="Numero o Codice"
                                />
                                <NumberInput
                                    name="quantity"
                                    label="Quantità"
                                />
                            </div>

                            <Select
                                name="holder"
                                label="Detentore"
                                options={[
                                    { value: '', label: 'Nessuno' },
                                    { value: 'prop2', label: 'Proprietario 1' },
                                    { value: 'inquilino1', label: 'Inquilino 1' }
                                ]}
                            />

                            <TextArea
                                name="comments"
                                label="Commenti"
                                placeholder="Note aggiuntive..."
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

export function Tab4Passwords() {
    const { control } = useFormContext();
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'PropertyKeys',
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

    const handleSave = (data: PropertyKeyFormData) => {
        if (editingIndex !== null) {
            update(editingIndex, data);
        } else {
            append(data);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FormSection title="Password e codice" defaultOpen={true}>

                <div className="grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4">
                    <div className="text-right pt-2">
                        <span className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase">
                            Password o codice
                        </span>
                    </div>

                    <div className="flex-1 w-full max-w-[600px] flex flex-col gap-4">

                        {/* Lista Elementi */}
                        {fields.length > 0 && (
                            <div className="flex flex-col gap-3 mb-4">
                                {fields.map((field: any, index) => (
                                    <div key={field._rhfId} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border shadow-sm text-gray-400">
                                                <Key className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{field.description || 'Nessuna descrizione'}</p>
                                                <p className="text-sm text-gray-500">Codice/Numero: {field.number || 'N/A'}</p>
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

                        {/* Pulsante Aggiungi */}
                        <div>
                            <button
                                type="button"
                                onClick={handleAddClick}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            >
                                <PlusCircle className="w-5 h-5 text-gray-700" />
                                Aggiungi un altro elemento
                            </button>
                            <p className="mt-2 text-sm text-gray-500">
                                Puoi aggiungere più password e codici di accesso se ne hai bisogno.
                            </p>
                        </div>

                    </div>
                </div>

            </FormSection>

            {/* Modal */}
            <KeyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingIndex !== null ? fields[editingIndex] as unknown as PropertyKeyFormData : null}
            />
        </div>
    );
}
