// Tab 4: Contatti di Emergenza — lista dinamica con badge "Principale"
// Max 5 contatti, con logica contatto principale auto-gestita
import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { TenantFormData } from '../schema';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Info, Star, User, Building2 } from 'lucide-react';
import { Modal } from '../../property-form/ui/Modal';
import { FormSection } from '../../property-form/ui/FormSection';
import { COUNTRIES } from '../../../types/tenant';
import type { EmergencyContact, ContactType } from '../../../types/tenant';

const MAX_CONTACTS = 5;
const generateId = () => `ec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const AVATAR_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e'];

function getInitials(c: EmergencyContact): string {
    if (c.contactType === 'company' && c.companyName) {
        return c.companyName.substring(0, 2).toUpperCase();
    }
    const first = c.firstName?.charAt(0) || '';
    const last = c.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '??';
}

function getDisplayName(c: EmergencyContact): string {
    if (c.contactType === 'company' && c.companyName) return c.companyName;
    return [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Senza nome';
}

const emptyContact: Omit<EmergencyContact, 'id'> = {
    contactType: 'person',
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    country: '',
    comments: '',
    isPrimary: false,
};

function toFormEmergencyContact(id: string, data: Omit<EmergencyContact, 'id'>): TenantFormData['TenantEmergencyContacts'][number] {
    return {
        id,
        contactType: data.contactType,
        companyName: data.companyName || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        zip: data.zip || '',
        country: data.country || '',
        comments: data.comments || '',
        isPrimary: data.isPrimary === true,
    };
}

export function Tab4Emergency() {
    const { control } = useFormContext<TenantFormData>();
    const { fields: contacts, append, update, replace } = useFieldArray({ control, name: 'TenantEmergencyContacts', keyName: 'fieldId' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState<Omit<EmergencyContact, 'id'>>(emptyContact);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const handleAdd = () => {
        if (contacts.length >= MAX_CONTACTS) return;
        setEditingIndex(null);
        setFormData({ ...emptyContact, isPrimary: contacts.length === 0 });
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setFormData({ ...contacts[index] });
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleDeleteClick = (index: number) => {
        setDeleteIndex(index);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (deleteIndex !== null) {
            const wasMain = contacts[deleteIndex].isPrimary;
            const updated = contacts.filter((_, i) => i !== deleteIndex);
            // Se il principale è stato eliminato, promuovi il primo rimasto
            if (wasMain && updated.length > 0) {
                updated[0] = { ...updated[0], isPrimary: true };
            }
            replace(updated);
        }
        setIsDeleteModalOpen(false);
        setDeleteIndex(null);
    };

    // Imposta come principale
    const togglePrimary = (index: number) => {
        replace(contacts.map((c, i) => ({ ...c, isPrimary: i === index })));
    };

    const updateField = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (typeof value === 'string' && formErrors[field]) {
            setFormErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (formData.contactType === 'person') {
            if (!formData.firstName?.trim()) errors.firstName = 'Il nome è obbligatorio';
            if (!formData.lastName?.trim()) errors.lastName = 'Il cognome è obbligatorio';
        } else {
            if (!formData.companyName?.trim()) errors.companyName = 'Il nome è obbligatorio';
        }
        if (!formData.phone?.trim()) errors.phone = 'Il telefono è obbligatorio';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) return;

        if (editingIndex !== null) {
            if (formData.isPrimary) {
                replace(contacts.map((c, i) => (i === editingIndex ? toFormEmergencyContact(c.id, { ...emptyContact, ...formData }) : { ...c, isPrimary: false })));
            } else {
                update(editingIndex, toFormEmergencyContact(contacts[editingIndex].id, { ...emptyContact, ...formData }));
            }
        } else {
            const newContact = toFormEmergencyContact(generateId(), { ...emptyContact, ...formData });
            // Se è il primo, diventa automaticamente principale
            if (contacts.length === 0) newContact.isPrimary = true;
            // Se è marcato come principale, rimuovi dagli altri
            if (newContact.isPrimary) {
                replace([...contacts.map(c => ({ ...c, isPrimary: false })), newContact]);
            } else {
                append(newContact);
            }
        }
        setIsModalOpen(false);
    };

    return (
        <div className="p-6">
            <FormSection title="Contatti di emergenza">
                {/* Info */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg mb-4">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">
                        Puoi aggiungere fino a {MAX_CONTACTS} contatti di emergenza. Clicca la stella per impostare il contatto principale.
                    </p>
                </div>

                {/* Lista contatti */}
                <AnimatePresence>
                    {contacts.length > 0 && (
                        <div className="space-y-3 mb-4">
                            {contacts.map((c, index) => (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex items-center gap-4 p-4 bg-white border rounded-lg hover:border-gray-300 transition-colors ${c.isPrimary ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}
                                >
                                    {/* Avatar */}
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                                        style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
                                    >
                                        {getInitials(c)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {c.contactType === 'company' ? (
                                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                            ) : (
                                                <User className="w-3.5 h-3.5 text-gray-400" />
                                            )}
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {getDisplayName(c)}
                                            </p>
                                            {c.isPrimary && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                    Principale
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-0.5">
                                            {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
                                            {c.email && <p className="text-xs text-gray-500 truncate">{c.email}</p>}
                                        </div>
                                    </div>

                                    {/* Azioni */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => togglePrimary(index)}
                                            className={`p-2 rounded-md transition-colors ${c.isPrimary ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
                                            title="Imposta come principale"
                                        >
                                            <Star className={`w-4 h-4 ${c.isPrimary ? 'fill-amber-500' : ''}`} />
                                        </button>
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
                {contacts.length < MAX_CONTACTS && (
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Aggiungi un contatto di emergenza
                    </button>
                )}
                {contacts.length >= MAX_CONTACTS && (
                    <p className="text-sm text-gray-500 italic">
                        Hai raggiunto il numero massimo di contatti di emergenza ({MAX_CONTACTS}).
                    </p>
                )}
            </FormSection>

            {/* === Modal Aggiungi/Modifica === */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingIndex !== null ? 'Modifica contatto' : 'Nuovo contatto di emergenza'}
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
                    {/* Tipo */}
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

                    {/* Campi condizionali */}
                    {formData.contactType === 'company' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Nome <span className="text-red-500">*</span>
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
                    )}

                    {/* Email e telefono */}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Telefono <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.phone || ''}
                                onChange={(e) => updateField('phone', e.target.value)}
                                className={`block w-full rounded-md border text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-opacity-50 ${formErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`}
                            />
                            {formErrors.phone && <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>}
                        </div>
                    </div>

                    {/* Indirizzo */}
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

                    {/* Contatto principale toggle */}
                    <div className="flex items-center gap-3 pt-2">
                        <input
                            type="checkbox"
                            id="isPrimary"
                            checked={!!formData.isPrimary}
                            onChange={(e) => updateField('isPrimary', e.target.checked)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor="isPrimary" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-amber-500" />
                            Imposta come contatto principale
                        </label>
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
                    Conferma l'eliminazione di questo contatto di emergenza.
                    {deleteIndex !== null && contacts[deleteIndex]?.isPrimary && (
                        <span className="block mt-2 text-amber-600 font-medium">
                            Attenzione: questo è il contatto principale. Il prossimo contatto verrà promosso automaticamente.
                        </span>
                    )}
                </p>
            </Modal>
        </div>
    );
}
