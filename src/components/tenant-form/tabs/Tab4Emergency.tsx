// Tab 4: Contatti di Emergenza — lista dinamica con badge "Principale"
// Max 5 contatti, con logica contatto principale auto-gestita
import { useRef, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { TenantFormData } from '../schema';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Info, Star, User, Building2 } from 'lucide-react';
import { Modal } from '../../property-form/ui/Modal';
import { FormSection } from '../../property-form/ui/FormSection';
import { COUNTRIES } from '../../../types/tenant';
import type { EmergencyContact, ContactType } from '../../../types/tenant';
import type { ContactRecord } from '../../../db/database.types';
import { useContactRepository } from '../../../contacts/ContactRepositoryContext';
import { useContactList } from '../../../contacts/useContactList';
import { generateId } from '../../../utils/id';

const MAX_CONTACTS = 5;

const AVATAR_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e'];

function getInitials(c: Omit<EmergencyContact, 'id'>): string {
    if (c.contactType === 'company' && c.companyName) {
        return c.companyName.substring(0, 2).toUpperCase();
    }
    const first = c.firstName?.charAt(0) || '';
    const last = c.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '??';
}

function getDisplayName(c: Omit<EmergencyContact, 'id'>): string {
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
        ...(data.contactId ? { contactId: data.contactId } : {}),
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

function contactSnapshot(
    contact: ContactRecord,
    metadata: Pick<EmergencyContact, 'comments' | 'isPrimary'> = {},
): Omit<EmergencyContact, 'id'> {
    return {
        contactId: contact.id,
        contactType: contact.type,
        companyName: contact.companyName,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        city: contact.city,
        zip: contact.zip,
        country: contact.country,
        comments: metadata.comments || '',
        isPrimary: metadata.isPrimary === true,
    };
}

export function Tab4Emergency() {
    const { control } = useFormContext<TenantFormData>();
    const contactRepository = useContactRepository();
    const { contacts: addressBookContacts, status, error, refresh } = useContactList();
    const { fields: contacts, append, update, replace } = useFieldArray({ control, name: 'TenantEmergencyContacts', keyName: 'fieldId' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState<Omit<EmergencyContact, 'id'>>(emptyContact);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [selectedExisting, setSelectedExisting] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const submitLock = useRef(false);
    const selectableContacts = addressBookContacts.filter(
        (contact) => !contact.archived && contact.phone.trim(),
    );
    const editingLinked = editingIndex !== null && Boolean(contacts[editingIndex]?.contactId);
    const hasSelectedContactIdentity = editingIndex === null
        && selectedExisting !== ''
        && selectedExisting !== 'new';
    const selectedContact = hasSelectedContactIdentity
        ? addressBookContacts.find((contact) => contact.id === selectedExisting)
        : null;
    const editingContact = editingLinked
        ? addressBookContacts.find((contact) => contact.id === contacts[editingIndex!].contactId)
        : null;
    const canonicalContact = selectedContact || editingContact;
    const canonicalFieldsLocked = editingLinked || hasSelectedContactIdentity;
    const primaryIsMandatory = (editingIndex === null && contacts.length === 0)
        || (editingIndex !== null && contacts[editingIndex]?.isPrimary === true);
    const presentedFormData = canonicalContact
        ? contactSnapshot(canonicalContact, formData)
        : formData;

    const handleAdd = () => {
        if (contacts.length >= MAX_CONTACTS) return;
        setEditingIndex(null);
        setFormData({ ...emptyContact, isPrimary: contacts.length === 0 });
        setSelectedExisting('');
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setFormData({ ...contacts[index] });
        setSelectedExisting('');
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleSelectExisting = (contactId: string) => {
        setSelectedExisting(contactId);
        setFormErrors({});
        if (contactId === '' || contactId === 'new') {
            setFormData({ ...emptyContact, isPrimary: contacts.length === 0 });
            return;
        }
        const contact = selectableContacts.find((item) => item.id === contactId);
        if (contact) {
            setFormData(contactSnapshot(contact, {
                comments: formData.comments,
                isPrimary: formData.isPrimary,
            }));
        }
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

    const addEmergencyRelation = (newContact: TenantFormData['TenantEmergencyContacts'][number]) => {
        if (contacts.length === 0) newContact.isPrimary = true;
        if (newContact.isPrimary) {
            replace([...contacts.map(c => ({ ...c, isPrimary: false })), newContact]);
        } else {
            append(newContact);
        }
    };

    const handleSave = async () => {
        if (submitLock.current) return;
        if (editingIndex !== null) {
            const current = contacts[editingIndex];
            if (current.contactId) {
                const next = toFormEmergencyContact(current.id, {
                    ...current,
                    comments: formData.comments,
                    isPrimary: formData.isPrimary,
                });
                if (next.isPrimary) {
                    replace(contacts.map((contact, index) => (
                        index === editingIndex ? next : { ...contact, isPrimary: false }
                    )));
                } else {
                    update(editingIndex, next);
                }
                setIsModalOpen(false);
                return;
            }
            if (!validateForm()) return;
            if (formData.isPrimary) {
                replace(contacts.map((c, i) => (i === editingIndex ? toFormEmergencyContact(c.id, { ...emptyContact, ...formData }) : { ...c, isPrimary: false })));
            } else {
                update(editingIndex, toFormEmergencyContact(current.id, { ...emptyContact, ...formData }));
            }
            setIsModalOpen(false);
            return;
        }

        if (hasSelectedContactIdentity) {
            if (status !== 'ready') {
                setFormErrors({ submit: 'La rubrica è in aggiornamento. Attendi o scegli un altro percorso.' });
                return;
            }
            if (!selectedContact) {
                setFormErrors({ submit: 'Contatto non disponibile. Scegli un altro contatto o creane uno nuovo.' });
                return;
            }
            if (selectedContact.archived) {
                setFormErrors({ submit: 'Il contatto selezionato è archiviato e non può essere collegato.' });
                return;
            }
            if (!selectedContact.phone.trim()) {
                setFormErrors({ submit: 'Il contatto selezionato non ha un telefono e non può essere collegato.' });
                return;
            }
            addEmergencyRelation(toFormEmergencyContact(generateId('tenant-emergency'), contactSnapshot(selectedContact, formData)));
            setIsModalOpen(false);
            return;
        }

        if (!validateForm()) return;
        submitLock.current = true;
        setIsSaving(true);
        setFormErrors({});
        try {
            const created = await contactRepository.create({
                type: formData.contactType,
                companyName: formData.companyName || '',
                firstName: formData.firstName || '',
                lastName: formData.lastName || '',
                birthDate: '',
                birthPlace: '',
                fiscalCode: '',
                vatNumber: '',
                email: formData.email || '',
                phone: formData.phone || '',
                address: formData.address || '',
                city: formData.city || '',
                zip: formData.zip || '',
                country: formData.country || 'IT',
                notes: '',
            });
            addEmergencyRelation(toFormEmergencyContact(generateId('tenant-emergency'), contactSnapshot(created, formData)));
            setIsModalOpen(false);
        } catch (creationError) {
            setFormErrors({
                submit: creationError instanceof Error && creationError.message
                    ? creationError.message
                    : 'Non è stato possibile salvare il contatto. Riprova.',
            });
        } finally {
            submitLock.current = false;
            setIsSaving(false);
        }
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
                            {contacts.map((c, index) => {
                                const resolved = c.contactId
                                    ? addressBookContacts.find((contact) => contact.id === c.contactId)
                                    : null;
                                const presented = resolved ? contactSnapshot(resolved, c) : c;
                                const isMissing = Boolean(c.contactId) && status === 'ready' && !resolved;
                                return (
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
                                        {getInitials(presented)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {presented.contactType === 'company' ? (
                                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                            ) : (
                                                <User className="w-3.5 h-3.5 text-gray-400" />
                                            )}
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {getDisplayName(presented)}
                                            </p>
                                            {resolved?.archived && <span className="text-xs text-amber-700">Archiviato</span>}
                                            {isMissing && <span className="text-xs text-red-600">Contatto non disponibile</span>}
                                            {resolved && !resolved.phone.trim() && <span className="text-xs text-amber-700">Telefono non disponibile</span>}
                                            {c.isPrimary && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                    Principale
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-0.5">
                                            {presented.phone && <p className="text-xs text-gray-500">{presented.phone}</p>}
                                            {presented.email && <p className="text-xs text-gray-500 truncate">{presented.email}</p>}
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
                                );
                            })}
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
                onClose={() => { if (!isSaving) setIsModalOpen(false); }}
                title={editingIndex !== null ? 'Modifica contatto' : 'Nuovo contatto di emergenza'}
                maxWidth="xl"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="button"
                            onClick={() => { void handleSave(); }}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                        >
                            {isSaving ? 'Salvataggio…' : 'Salva'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {editingIndex === null && (
                        <div>
                            <label htmlFor="tenant-emergency-contact" className="block text-sm font-medium text-gray-700 mb-1.5">Contatto</label>
                            <select
                                id="tenant-emergency-contact"
                                value={selectedExisting}
                                onChange={(event) => handleSelectExisting(event.target.value)}
                                disabled={status === 'idle' || status === 'loading'}
                                className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 bg-white"
                            >
                                <option value="">Scegli dalla rubrica o aggiungi nuovo</option>
                                <option value="new">+ Aggiungi nuovo</option>
                                {selectableContacts.map((contact) => (
                                    <option key={contact.id} value={contact.id}>
                                        {contact.type === 'company' ? contact.companyName : `${contact.firstName} ${contact.lastName}`}
                                    </option>
                                ))}
                                {hasSelectedContactIdentity
                                    && !selectableContacts.some((contact) => contact.id === selectedExisting) && (
                                    <option value={selectedExisting} disabled>
                                        {selectedContact?.archived
                                            ? `${getDisplayName(contactSnapshot(selectedContact))} — archiviato`
                                            : 'Contatto non disponibile'}
                                    </option>
                                )}
                            </select>
                            {(status === 'idle' || status === 'loading') && <p className="mt-1 text-sm text-gray-500">Caricamento rubrica…</p>}
                            {status === 'error' && (
                                <div className="mt-2 flex gap-2 text-sm text-red-600">
                                    <span>{error || 'Non è stato possibile caricare la rubrica.'}</span>
                                    <button type="button" onClick={() => { void refresh(); }} className="underline">Riprova</button>
                                </div>
                            )}
                            {hasSelectedContactIdentity && status === 'ready' && selectedContact?.archived && <p className="mt-1 text-sm text-amber-700">Il contatto selezionato è archiviato.</p>}
                            {hasSelectedContactIdentity && status === 'ready' && !selectedContact && <p className="mt-1 text-sm text-red-600">Contatto non disponibile</p>}
                            {hasSelectedContactIdentity && status === 'ready' && selectedContact && !selectedContact.phone.trim() && <p className="mt-1 text-sm text-amber-700">Il contatto selezionato non ha un telefono.</p>}
                        </div>
                    )}

                    {formErrors.submit && <p role="alert" className="text-sm text-red-600">{formErrors.submit}</p>}

                    <fieldset disabled={canonicalFieldsLocked} className="space-y-4">
                    {/* Tipo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                        <select
                            value={presentedFormData.contactType}
                            onChange={(e) => updateField('contactType', e.target.value as ContactType)}
                            className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        >
                            <option value="person">Privato singolo</option>
                            <option value="company">Società / Altro</option>
                        </select>
                    </div>

                    {/* Campi condizionali */}
                    {presentedFormData.contactType === 'company' ? (
                        <div>
                            <label htmlFor="tenant-emergency-company" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Nome <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="tenant-emergency-company"
                                type="text"
                                value={presentedFormData.companyName || ''}
                                onChange={(e) => updateField('companyName', e.target.value)}
                                className={`block w-full rounded-md border text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-opacity-50 ${formErrors.companyName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`}
                            />
                            {formErrors.companyName && <p className="mt-1 text-sm text-red-600">{formErrors.companyName}</p>}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="tenant-emergency-first-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Nome <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="tenant-emergency-first-name"
                                    type="text"
                                    value={presentedFormData.firstName || ''}
                                    onChange={(e) => updateField('firstName', e.target.value)}
                                    className={`block w-full rounded-md border text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-opacity-50 ${formErrors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`}
                                />
                                {formErrors.firstName && <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>}
                            </div>
                            <div>
                                <label htmlFor="tenant-emergency-last-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Cognome <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="tenant-emergency-last-name"
                                    type="text"
                                    value={presentedFormData.lastName || ''}
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
                            <label htmlFor="tenant-emergency-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input
                                id="tenant-emergency-email"
                                type="email"
                                value={presentedFormData.email || ''}
                                onChange={(e) => updateField('email', e.target.value)}
                                className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="tenant-emergency-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Telefono <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="tenant-emergency-phone"
                                type="tel"
                                value={presentedFormData.phone || ''}
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
                            value={presentedFormData.address || ''}
                            onChange={(e) => updateField('address', e.target.value)}
                            className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Città</label>
                            <input
                                type="text"
                                value={presentedFormData.city || ''}
                                onChange={(e) => updateField('city', e.target.value)}
                                className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">CAP</label>
                            <input
                                type="text"
                                value={presentedFormData.zip || ''}
                                onChange={(e) => updateField('zip', e.target.value)}
                                className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Paese</label>
                            <select
                                value={presentedFormData.country || ''}
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

                    </fieldset>

                    {canonicalFieldsLocked && <p className="text-sm text-gray-500">I dati canonici si modificano dalla rubrica. Qui puoi aggiornare solo i metadata della relazione.</p>}

                    {/* Contatto principale toggle */}
                    <div className="flex items-center gap-3 pt-2">
                        <input
                            type="checkbox"
                            id="isPrimary"
                            checked={primaryIsMandatory || !!formData.isPrimary}
                            onChange={(e) => updateField('isPrimary', e.target.checked)}
                            disabled={primaryIsMandatory}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor="isPrimary" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-amber-500" />
                            Imposta come contatto principale
                        </label>
                    </div>
                    {primaryIsMandatory && (
                        <p className="text-sm text-gray-500">
                            {editingIndex === null
                                ? 'Il primo contatto viene impostato automaticamente come principale.'
                                : 'Per cambiare il contatto principale, impostane un altro come principale.'}
                        </p>
                    )}

                    {/* Note */}
                    <div>
                        <label htmlFor="tenant-emergency-comments" className="block text-sm font-medium text-gray-700 mb-1.5">Note</label>
                        <textarea
                            id="tenant-emergency-comments"
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
