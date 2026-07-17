// Tab 3: Garanti — lista dinamica con modal aggiungi/modifica
// Gestisce un array di garanti in stato locale con card e azioni
import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { TenantFormData } from '../schema';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Info, User, Building2 } from 'lucide-react';
import { Modal } from '../../property-form/ui/Modal';
import { FormSection } from '../../property-form/ui/FormSection';
import { COUNTRIES } from '../../../types/tenant';
import type { Guarantor, ContactType } from '../../../types/tenant';
import { existingContacts } from '../../../data/mockTenants';

// Genera ID univoco
const generateId = () => `g-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Ottieni iniziali dal garante
function getInitials(g: Guarantor): string {
    if (g.contactType === 'company' && g.companyName) {
        return g.companyName.substring(0, 2).toUpperCase();
    }
    const first = g.firstName?.charAt(0) || '';
    const last = g.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '??';
}

// Ottieni nome display
function getDisplayName(g: Guarantor): string {
    if (g.contactType === 'company' && g.companyName) return g.companyName;
    return [g.firstName, g.lastName].filter(Boolean).join(' ') || 'Senza nome';
}

// Colori avatar predefiniti per i garanti
const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

// Form state vuoto
const emptyGuarantor: Omit<Guarantor, 'id'> = {
    contactType: 'person',
    companyName: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    birthPlace: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    country: '',
    comments: '',
};

function toFormGuarantor(id: string, data: Omit<Guarantor, 'id'>): TenantFormData['TenantGuarantors'][number] {
    return {
        id,
        contactType: data.contactType,
        companyName: data.companyName || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        birthDate: data.birthDate || '',
        birthPlace: data.birthPlace || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        zip: data.zip || '',
        country: data.country || '',
        comments: data.comments || '',
    };
}

export function Tab3Guarantors() {
    const { control } = useFormContext<TenantFormData>();
    const { fields: guarantors, append, update, remove } = useFieldArray({ control, name: 'TenantGuarantors', keyName: 'fieldId' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState<Omit<Guarantor, 'id'>>(emptyGuarantor);
    const [selectedExisting, setSelectedExisting] = useState<string>('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Apri modal per nuovo garante
    const handleAdd = () => {
        setEditingIndex(null);
        setFormData({ ...emptyGuarantor });
        setSelectedExisting('');
        setFormErrors({});
        setIsModalOpen(true);
    };

    // Apri modal per modifica garante
    const handleEdit = (index: number) => {
        setEditingIndex(index);
        const g = guarantors[index];
        setFormData({ ...g });
        setSelectedExisting('');
        setFormErrors({});
        setIsModalOpen(true);
    };

    // Conferma eliminazione garante
    const handleDeleteClick = (index: number) => {
        setDeleteIndex(index);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (deleteIndex !== null) {
            remove(deleteIndex);
        }
        setIsDeleteModalOpen(false);
        setDeleteIndex(null);
    };

    // Seleziona garante esistente dalla rubrica
    const handleSelectExisting = (contactId: string) => {
        setSelectedExisting(contactId);
        if (contactId === 'new') {
            setFormData({ ...emptyGuarantor });
            return;
        }
        const contact = existingContacts.find(c => c.id === contactId);
        if (contact) {
            setFormData({
                contactType: contact.contactType,
                companyName: contact.contactType === 'company' ? contact.companyName : '',
                firstName: contact.contactType === 'person' ? contact.firstName : '',
                lastName: contact.contactType === 'person' ? contact.lastName : '',
                birthDate: '',
                birthPlace: '',
                email: contact.email || '',
                phone: contact.phone || '',
                address: '',
                city: '',
                zip: '',
                country: '',
                comments: '',
            });
        }
    };

    // Update campo form
    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Rimuovi errore quando l'utente compila
        if (formErrors[field]) {
            setFormErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    // Validazione form garante
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (formData.contactType === 'person') {
            if (!formData.firstName?.trim()) errors.firstName = 'Il nome è obbligatorio';
            if (!formData.lastName?.trim()) errors.lastName = 'Il cognome è obbligatorio';
        } else {
            if (!formData.companyName?.trim()) errors.companyName = 'Il nome della società è obbligatorio';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Salva garante
    const handleSave = () => {
        if (!validateForm()) return;

        if (editingIndex !== null) {
            update(editingIndex, toFormGuarantor(guarantors[editingIndex].id, { ...emptyGuarantor, ...formData }));
        } else {
            append(toFormGuarantor(generateId(), { ...emptyGuarantor, ...formData }));
        }
        setIsModalOpen(false);
    };

    return (
        <div className="p-6">
            <FormSection title="Garanti">
                {/* Info alert */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg mb-4">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">
                        Se ne hai bisogno puoi aggiungere più garanti. Il contatto sarà salvato nella rubrica.
                    </p>
                </div>

                {/* Lista garanti */}
                <AnimatePresence>
                    {guarantors.length > 0 && (
                        <div className="space-y-3 mb-4">
                            {guarantors.map((g, index) => (
                                <motion.div
                                    key={g.id}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                                >
                                    {/* Avatar con iniziali */}
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                                        style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
                                    >
                                        {getInitials(g)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {g.contactType === 'company' ? (
                                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                            ) : (
                                                <User className="w-3.5 h-3.5 text-gray-400" />
                                            )}
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {getDisplayName(g)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-0.5">
                                            {g.email && (
                                                <p className="text-xs text-gray-500 truncate">{g.email}</p>
                                            )}
                                            {g.phone && (
                                                <p className="text-xs text-gray-500">{g.phone}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Azioni */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(index)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                            title="Modifica"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteClick(index)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            title="Elimina"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>

                {/* Bottone Aggiungi */}
                <button
                    type="button"
                    onClick={handleAdd}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Aggiungi un garante
                </button>
            </FormSection>

            {/* === Modal Aggiungi/Modifica Garante === */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingIndex !== null ? 'Modifica garante' : 'Nuovo garante'}
                maxWidth="xl"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                        >
                            Salva
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Info alert */}
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700">
                            Creane uno nuovo o scegline uno esistente dalla rubrica.
                        </p>
                    </div>

                    {/* Select garante esistente (solo in aggiunta) */}
                    {editingIndex === null && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Garante
                            </label>
                            <select
                                value={selectedExisting}
                                onChange={(e) => handleSelectExisting(e.target.value)}
                                className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                            >
                                <option value="">Scegli dalla rubrica o aggiungi nuovo</option>
                                <option value="new">+ Aggiungi nuovo</option>
                                {existingContacts.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.contactType === 'company' ? c.companyName : `${c.firstName} ${c.lastName}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Tipo contatto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                        <select
                            value={formData.contactType}
                            onChange={(e) => updateField('contactType', e.target.value as ContactType)}
                            className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        >
                            <option value="person">Privato singolo</option>
                            <option value="company">Società / Altro</option>
                        </select>
                    </div>

                    {/* Campi condizionali persona/società */}
                    {formData.contactType === 'company' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Società <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.companyName || ''}
                                onChange={(e) => updateField('companyName', e.target.value)}
                                className={`block w-full rounded-md border text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-opacity-50 ${formErrors.companyName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`}
                            />
                            {formErrors.companyName && <p className="mt-1 text-sm text-red-600">{formErrors.companyName}</p>}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Nome <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.firstName || ''}
                                        onChange={(e) => updateField('firstName', e.target.value)}
                                        className={`block w-full rounded-md border text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-opacity-50 ${formErrors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`}
                                    />
                                    {formErrors.firstName && <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Cognome <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lastName || ''}
                                        onChange={(e) => updateField('lastName', e.target.value)}
                                        className={`block w-full rounded-md border text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-opacity-50 ${formErrors.lastName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`}
                                    />
                                    {formErrors.lastName && <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Data di nascita</label>
                                    <input
                                        type="date"
                                        value={formData.birthDate || ''}
                                        onChange={(e) => updateField('birthDate', e.target.value)}
                                        className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Luogo di nascita</label>
                                    <input
                                        type="text"
                                        value={formData.birthPlace || ''}
                                        onChange={(e) => updateField('birthPlace', e.target.value)}
                                        className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Email e telefono (sempre) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => updateField('email', e.target.value)}
                                className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cellulare</label>
                            <input
                                type="tel"
                                value={formData.phone || ''}
                                onChange={(e) => updateField('phone', e.target.value)}
                                className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>

                    {/* Indirizzo (sempre) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Indirizzo</label>
                        <input
                            type="text"
                            value={formData.address || ''}
                            onChange={(e) => updateField('address', e.target.value)}
                            className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Città</label>
                            <input
                                type="text"
                                value={formData.city || ''}
                                onChange={(e) => updateField('city', e.target.value)}
                                className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">CAP</label>
                            <input
                                type="text"
                                value={formData.zip || ''}
                                onChange={(e) => updateField('zip', e.target.value)}
                                className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Paese</label>
                            <select
                                value={formData.country || ''}
                                onChange={(e) => updateField('country', e.target.value)}
                                className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                            >
                                <option value="">Scegli il paese</option>
                                {COUNTRIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Note</label>
                        <textarea
                            value={formData.comments || ''}
                            onChange={(e) => updateField('comments', e.target.value)}
                            rows={3}
                            className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                        />
                    </div>
                </div>
            </Modal>

            {/* === Modal Conferma Eliminazione === */}
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
                    Conferma l'eliminazione di questo garante.
                </p>
            </Modal>
        </div>
    );
}
