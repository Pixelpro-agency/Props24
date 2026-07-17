import { useEffect, useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormSection } from '../ui/FormSection';
import { PlusCircle, User, Edit2, Trash2, X } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { TextInput } from '../ui/TextInput';
import { TextArea } from '../ui/TextArea';
import { Select } from '../ui/Select';
import type { PropertyContactFormData } from '../schema';

function newLocalId(prefix: string): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: PropertyContactFormData) => void;
    initialData: PropertyContactFormData | null;
}

function ContactModal({ isOpen, onClose, onSave, initialData }: ContactModalProps) {
    const defaultValues: PropertyContactFormData = {
        id: '',
        firstName: '',
        lastName: '',
        profession: '',
        email: '',
        phone: '',
        comments: '',
    };
    const methods = useForm<PropertyContactFormData>({
        defaultValues,
    });

    useEffect(() => {
        if (isOpen) methods.reset(initialData || defaultValues);
    }, [isOpen, initialData, methods]);

    if (!isOpen) return null;

    const handleSubmit = methods.handleSubmit((data) => {
        onSave({ ...data, id: initialData?.id || data.id || newLocalId('contact') });
        onClose();
    });

    return (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">

                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-medium text-gray-900">
                        {initialData ? 'Modifica' : 'Aggiungi'} Contatto
                    </h2>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <FormProvider {...methods}>
                        <div className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <TextInput
                                    name="firstName"
                                    label="Nome"
                                    required
                                />
                                <TextInput
                                    name="lastName"
                                    label="Cognome"
                                    required
                                />
                            </div>

                            <Select
                                name="profession"
                                label="Professione / Categoria"
                                options={[
                                    { value: '', label: 'Seleziona...' },
                                    { value: 'idraulico', label: 'Idraulico' },
                                    { value: 'elettricista', label: 'Elettricista' },
                                    { value: 'impresa_pulizie', label: 'Impresa di pulizie' },
                                    { value: 'amministratore', label: 'Amministratore' },
                                    { value: 'altro', label: 'Altro...' }
                                ]}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <TextInput
                                    name="email"
                                    label="Email"
                                    type="email"
                                />
                                <TextInput
                                    name="phone"
                                    label="Telefono"
                                    type="tel"
                                />
                            </div>

                            <TextArea
                                name="comments"
                                label="Note opzionali"
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

export function Tab8Contacts() {
    const { control } = useFormContext();
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'PropertyContacts',
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

    const handleSave = (data: PropertyContactFormData) => {
        if (editingIndex !== null) {
            update(editingIndex, data);
        } else {
            append(data);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FormSection title="Contatti" defaultOpen={true}>

                <div className="grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4">
                    <div className="text-right pt-2">
                        <span className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase">
                            Contatti
                        </span>
                    </div>

                    <div className="flex-1 w-full max-w-[600px] flex flex-col gap-4">

                        {fields.length > 0 && (
                            <div className="flex flex-col gap-3 mb-4">
                                {fields.map((field: any, index) => (
                                    <div key={field._rhfId} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold border shadow-sm">
                                                {field.firstName ? field.firstName.charAt(0).toUpperCase() : <User className="w-5 h-5 text-indigo-500" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{field.firstName} {field.lastName}</p>
                                                <p className="text-sm text-gray-500">
                                                    {field.profession && <span className="mr-2 capitalize">{field.profession.replace('_', ' ')}</span>}
                                                    {field.phone && <span>{field.phone}</span>}
                                                </p>
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
                                Aggiungere un contatto
                            </button>
                            <p className="mt-2 text-sm text-gray-500">
                                Se ne hai bisogno puoi aggiungere più contatti. Ogni contatto sarà salvato nella rubrica.
                            </p>
                        </div>

                    </div>
                </div>

            </FormSection>

            <ContactModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingIndex !== null ? fields[editingIndex] as unknown as PropertyContactFormData : null}
            />
        </div>
    );
}
