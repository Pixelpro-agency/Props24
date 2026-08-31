// Tab 3: Garanti — lista dinamica con modal aggiungi/modifica
// Gestisce un array di garanti in stato locale con card e azioni
import { useRef, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { TenantFormData } from '../schema';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Info, User, Building2 } from 'lucide-react';
import { Modal } from '../../property-form/ui/Modal';
import { FormSection } from '../../property-form/ui/FormSection';
import { COUNTRIES } from '../../../types/tenant';
import type { Guarantor, ContactType } from '../../../types/tenant';
import type { ContactRecord } from '../../../db/database.types';
import { useContactRepository } from '../../../contacts/ContactRepositoryContext';
import { useContactList } from '../../../contacts/useContactList';

// Genera ID univoco
const generateId = () => `g-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Ottieni iniziali dal garante
function getInitials(g: Omit<Guarantor, 'id'>): string {
    if (g.contactType === 'company' && g.companyName) {
        return g.companyName.substring(0, 2).toUpperCase();
    }
    const first = g.firstName?.charAt(0) || '';
    const last = g.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '??';
}

// Ottieni nome display
function getDisplayName(g: Omit<Guarantor, 'id'>): string {
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
        ...(data.contactId ? { contactId: data.contactId } : {}),
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

function contactSnapshot(contact: ContactRecord, comments = ''): Omit<Guarantor, 'id'> {
    return {
        contactId: contact.id,
        contactType: contact.type,
        companyName: contact.companyName,
        firstName: contact.firstName,
        lastName: contact.lastName,
        birthDate: contact.birthDate,
        birthPlace: contact.birthPlace,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        city: contact.city,
        zip: contact.zip,
        country: contact.country,
        comments,
    };
}

export function Tab3Guarantors() {
    const { control } = useFormContext<TenantFormData>();
    const contactRepository = useContactRepository();
    const { contacts, status, error, refresh } = useContactList();
    const { fields: guarantors, append, update, remove } = useFieldArray({ control, name: 'TenantGuarantors', keyName: 'fieldId' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState<Omit<Guarantor, 'id'>>(emptyGuarantor);
    const [selectedExisting, setSelectedExisting] = useState<string>('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const submitLock = useRef(false);
    const activeContacts = contacts.filter((contact) => !contact.archived);
    const editingLinked = editingIndex !== null && Boolean(guarantors[editingIndex]?.contactId);
    const hasSelectedContactIdentity = editingIndex === null
        && selectedExisting !== ''
        && selectedExisting !== 'new';
    const selectedContact = hasSelectedContactIdentity
        ? contacts.find((contact) => contact.id === selectedExisting)
        : null;
    const canonicalFieldsLocked = editingLinked || hasSelectedContactIdentity;
    const presentedFormData = selectedContact
        ? contactSnapshot(selectedContact, formData.comments)
        : formData;

    // Apri modal per nuovo garante
    const handleAdd = () => {
        setEditingIndex(null);
        setFormData({ ...emptyGuarantor });
        setSelectedExisting('');
        setFormErrors({});
        setIsSaving(false);
        setIsModalOpen(true);
    };

    // Apri modal per modifica garante
    const handleEdit = (index: number) => {
        setEditingIndex(index);
        const g = guarantors[index];
        const canonical = g.contactId ? contacts.find((contact) => contact.id === g.contactId) : null;
        setFormData(canonical ? contactSnapshot(canonical, g.comments) : { ...g });
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
        setFormErrors({});
        if (contactId === '' || contactId === 'new') {
            setFormData({ ...emptyGuarantor });
            return;
        }
        const contact = activeContacts.find(c => c.id === contactId);
        if (contact) {
            setFormData(contactSnapshot(contact));
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
    const handleSave = async () => {
        if (submitLock.current) return;

        if (editingIndex !== null) {
            if (!validateForm()) return;
            const current = guarantors[editingIndex];
            const next = current.contactId
                ? { ...current, comments: formData.comments || '' }
                : { ...emptyGuarantor, ...formData };
            update(editingIndex, toFormGuarantor(current.id, next));
            setIsModalOpen(false);
            return;
        }

        if (hasSelectedContactIdentity) {
            if (status !== 'ready') {
                setFormErrors({ submit: 'La rubrica è in aggiornamento. Attendi o scegli un altro percorso.' });
                return;
            }
            if (!selectedContact) {
                setFormErrors({ submit: 'Contatto non disponibile. Scegli un altro contatto o un nuovo garante.' });
                return;
            }
            if (selectedContact.archived) {
                setFormErrors({ submit: 'Il contatto selezionato è archiviato e non può essere collegato.' });
                return;
            }
            append(toFormGuarantor(generateId(), contactSnapshot(selectedContact, formData.comments)));
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
                birthDate: formData.birthDate || '',
                birthPlace: formData.birthPlace || '',
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
            append(toFormGuarantor(generateId(), contactSnapshot(created, formData.comments)));
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
                            {guarantors.map((g, index) => {
                                const resolved = g.contactId
                                    ? contacts.find((contact) => contact.id === g.contactId)
                                    : null;
                                const presented = resolved ? contactSnapshot(resolved, g.comments) : g;
                                const isMissing = Boolean(g.contactId) && status === 'ready' && !resolved;
                                return (
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
                                        </div>
                                        <div className="flex items-center gap-4 mt-0.5">
                                            {presented.email && (
                                                <p className="text-xs text-gray-500 truncate">{presented.email}</p>
                                            )}
                                            {presented.phone && (
                                                <p className="text-xs text-gray-500">{presented.phone}</p>
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
                                );
                            })}
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
                onClose={() => { if (!isSaving) setIsModalOpen(false); }}
                title={editingIndex !== null ? 'Modifica garante' : 'Nuovo garante'}
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
                            <label htmlFor="tenant-guarantor-contact" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Garante
                            </label>
                            <select
                                id="tenant-guarantor-contact"
                                value={selectedExisting}
                                onChange={(e) => handleSelectExisting(e.target.value)}
                                disabled={status === 'idle' || status === 'loading'}
                                className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                            >
                                <option value="">Scegli dalla rubrica o aggiungi nuovo</option>
                                <option value="new">+ Aggiungi nuovo</option>
                                {activeContacts.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.type === 'company' ? c.companyName : `${c.firstName} ${c.lastName}`}
                                    </option>
                                ))}
                                {hasSelectedContactIdentity
                                    && !activeContacts.some((contact) => contact.id === selectedExisting) && (
                                    <option value={selectedExisting} disabled>
                                        {selectedContact?.archived
                                            ? `${getDisplayName(contactSnapshot(selectedContact))} — archiviato`
                                            : 'Contatto non disponibile'}
                                    </option>
                                )}
                            </select>
                            {(status === 'idle' || status === 'loading') && (
                                <p className="mt-1 text-sm text-gray-500">Caricamento rubrica…</p>
                            )}
                            {status === 'error' && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                                    <span>{error || 'Non è stato possibile caricare la rubrica.'}</span>
                                    <button type="button" onClick={() => { void refresh(); }} className="underline">Riprova</button>
                                </div>
                            )}
                            {hasSelectedContactIdentity && status === 'ready' && selectedContact?.archived && (
                                <p className="mt-1 text-sm text-amber-700">Il contatto selezionato è archiviato e non è più utilizzabile.</p>
                            )}
                            {hasSelectedContactIdentity && status === 'ready' && !selectedContact && (
                                <p className="mt-1 text-sm text-red-600">Contatto non disponibile</p>
                            )}
                        </div>
                    )}

                    {formErrors.submit && <p role="alert" className="text-sm text-red-600">{formErrors.submit}</p>}

                    <fieldset disabled={canonicalFieldsLocked} className="space-y-4">
                    {/* Tipo contatto */}
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

                    {/* Campi condizionali persona/società */}
                    {presentedFormData.contactType === 'company' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Società <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={presentedFormData.companyName || ''}
                                onChange={(e) => updateField('companyName', e.target.value)}
                                className={`block w-full rounded-md border text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-opacity-50 ${formErrors.companyName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`}
                            />
                            {formErrors.companyName && <p className="mt-1 text-sm text-red-600">{formErrors.companyName}</p>}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="tenant-guarantor-first-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Nome <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="tenant-guarantor-first-name"
                                        type="text"
                                        value={presentedFormData.firstName || ''}
                                        onChange={(e) => updateField('firstName', e.target.value)}
                                        className={`block w-full rounded-md border text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-opacity-50 ${formErrors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`}
                                    />
                                    {formErrors.firstName && <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>}
                                </div>
                                <div>
                                    <label htmlFor="tenant-guarantor-last-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Cognome <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="tenant-guarantor-last-name"
                                        type="text"
                                        value={presentedFormData.lastName || ''}
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
                                        value={presentedFormData.birthDate || ''}
                                        onChange={(e) => updateField('birthDate', e.target.value)}
                                        className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Luogo di nascita</label>
                                    <input
                                        type="text"
                                        value={presentedFormData.birthPlace || ''}
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
                            <label htmlFor="tenant-guarantor-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input
                                id="tenant-guarantor-email"
                                type="email"
                                value={presentedFormData.email || ''}
                                onChange={(e) => updateField('email', e.target.value)}
                                className="block w-full rounded-md border border-gray-300 text-base py-2.5 px-3 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cellulare</label>
                            <input
                                type="tel"
                                value={presentedFormData.phone || ''}
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

                    {canonicalFieldsLocked && (
                        <p className="text-sm text-gray-500">I dati del contatto si modificano dalla rubrica. Qui puoi aggiornare solo le note della relazione.</p>
                    )}

                    {/* Note */}
                    <div>
                        <label htmlFor="tenant-guarantor-comments" className="block text-sm font-medium text-gray-700 mb-1.5">Note</label>
                        <textarea
                            id="tenant-guarantor-comments"
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
