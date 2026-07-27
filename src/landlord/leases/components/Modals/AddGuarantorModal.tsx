import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Search, User, X } from 'lucide-react';
import { z } from 'zod';
import { useContactRepository } from '../../../../contacts/ContactRepositoryContext';
import type { ContactListStatus } from '../../../../contacts/contactListStore';
import type { ContactCreateInput } from '../../../../db/contactRepository.port';
import type { ContactRecord } from '../../../../db/database.types';

interface AddGuarantorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGuarantorAdded: (contactId: string) => void;
    onError: (message: string) => void;
    existingGuarantorIds: string[];
    linkedGuarantorIds?: string[];
    contacts: ContactRecord[];
    contactListStatus: ContactListStatus;
    contactListError: string | null;
    onRefreshContacts: () => Promise<void>;
}

const schema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('person'), firstName: z.string().min(1, 'Inserisci il nome.'), lastName: z.string().min(1, 'Inserisci il cognome.'), companyName: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), fiscalCode: z.string().optional(), vatNumber: z.string().optional(), address: z.string().optional(), city: z.string().optional(), zip: z.string().optional(), country: z.string().optional(), notes: z.string().optional() }),
    z.object({ type: z.literal('company'), companyName: z.string().min(1, 'Inserisci la società.'), firstName: z.string().optional(), lastName: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), fiscalCode: z.string().optional(), vatNumber: z.string().optional(), address: z.string().optional(), city: z.string().optional(), zip: z.string().optional(), country: z.string().optional(), notes: z.string().optional() }),
]);

const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#337ab7] focus:outline-none focus:ring-2 focus:ring-[#337ab7]/30';

function label(contact: ContactRecord): string {
    return contact.type === 'company' ? contact.companyName : `${contact.firstName} ${contact.lastName}`.trim();
}

function contactInputFromParsed(
    parsed: z.infer<typeof schema>,
): ContactCreateInput {
    return {
        type: parsed.type,
        companyName: parsed.type === 'company' ? parsed.companyName : '',
        firstName: parsed.type === 'person' ? parsed.firstName : '',
        lastName: parsed.type === 'person' ? parsed.lastName : '',
        birthDate: '',
        birthPlace: '',
        fiscalCode: parsed.fiscalCode || '',
        vatNumber: parsed.vatNumber || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        address: parsed.address || '',
        city: parsed.city || '',
        zip: parsed.zip || '',
        country: parsed.country?.trim() || 'IT',
        notes: parsed.notes || '',
    };
}

export const AddGuarantorModal: React.FC<AddGuarantorModalProps> = ({
    isOpen,
    onClose,
    onGuarantorAdded,
    onError,
    existingGuarantorIds,
    linkedGuarantorIds = [],
    contacts,
    contactListStatus,
    contactListError,
    onRefreshContacts,
}) => {
    const contactRepository = useContactRepository();
    const [mode, setMode] = useState<'select' | 'create'>('select');
    const [query, setQuery] = useState('');
    const [values, setValues] = useState({ type: 'person' as 'person' | 'company', firstName: '', lastName: '', companyName: '', email: '', phone: '', fiscalCode: '', vatNumber: '', address: '', city: '', zip: '', country: 'IT', notes: '' });
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const available = useMemo(() => {
        const q = query.trim().toLowerCase();
        return contacts
            .filter((contact) => !existingGuarantorIds.includes(contact.id))
            .filter((contact) => !contact.archived || linkedGuarantorIds.includes(contact.id))
            .filter((contact) => !q || [label(contact), contact.email, contact.phone, contact.fiscalCode, contact.vatNumber].join(' ').toLowerCase().includes(q));
    }, [contacts, existingGuarantorIds, linkedGuarantorIds, query]);
    const isInitialLoading = (
        contactListStatus === 'idle'
        || contactListStatus === 'loading'
    ) && contacts.length === 0;
    const isUnavailable =
        contactListStatus === 'error' && contacts.length === 0;
    const loadError =
        contactListError || 'Non è stato possibile caricare i contatti.';

    if (!isOpen) return null;

    const close = () => {
        setError('');
        setQuery('');
        onClose();
    };

    const handleBackdropClick = (
        event: React.MouseEvent<HTMLDivElement>,
    ) => {
        if (
            event.target !== event.currentTarget
            || isCreating
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        close();
    };

    const create = async () => {
        if (isCreating) return;
        const parsed = schema.safeParse(values);
        if (!parsed.success) {
            const message = parsed.error.issues[0]?.message || 'Controlla i dati del garante.';
            setError(message);
            onError(message);
            return;
        }
        setError('');
        setIsCreating(true);
        try {
            const contact = await contactRepository.create(
                contactInputFromParsed(parsed.data),
            );
            onGuarantorAdded(contact.id);
            close();
        } catch (err) {
            const message = err instanceof Error && err.message
                ? err.message
                : 'Non è stato possibile creare il garante.';
            setError(message);
            onError(message);
        } finally {
            setIsCreating(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={handleBackdropClick}>
            <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="text-lg font-semibold">Aggiungi garante</h3>
                    <button type="button" onClick={close} disabled={isCreating} className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"><X className="h-5 w-5" /></button>
                </div>
                <div className="flex gap-2 border-b px-6 py-3">
                    <button type="button" disabled={isCreating} onClick={() => setMode('select')} className={`rounded px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${mode === 'select' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Esistente</button>
                    <button type="button" disabled={isCreating} onClick={() => setMode('create')} className={`rounded px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${mode === 'create' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Nuovo</button>
                </div>
                {mode === 'select' ? (
                    <div className="space-y-4 p-6">
                        <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input className={`${inputClass} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca garante" /></div>
                        {contactListStatus === 'error' && (
                            <div className={`space-y-2 rounded border p-3 text-sm ${isUnavailable ? 'border-red-300 bg-red-50 text-red-700' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
                                <p>{loadError}</p>
                                <button type="button" onClick={() => void onRefreshContacts()} className="rounded border border-current px-3 py-1 font-medium">Riprova</button>
                            </div>
                        )}
                        {isInitialLoading ? <p className="rounded border bg-gray-50 p-8 text-center text-sm text-gray-500">Caricamento dei garanti...</p> : isUnavailable ? null : available.length === 0 ? <p className="rounded border border-dashed p-8 text-center text-sm text-gray-500">Nessun garante disponibile.</p> : available.map((contact) => (
                            <button key={contact.id} type="button" onClick={() => { onGuarantorAdded(contact.id); close(); }} className="flex w-full items-center gap-3 rounded border p-3 text-left hover:border-green-500">
                                {contact.type === 'company' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                <span><span className="font-medium">{label(contact)}</span>{contact.archived ? ' (archiviato)' : ''}<br /><span className="text-xs text-gray-500">{contact.email || contact.phone || 'Nessun contatto'}</span></span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3 p-6">
                        <fieldset disabled={isCreating} className="space-y-3">
                            <div className="flex gap-4 text-sm"><label><input type="radio" checked={values.type === 'person'} onChange={() => setValues((v) => ({ ...v, type: 'person' }))} /> Persona</label><label><input type="radio" checked={values.type === 'company'} onChange={() => setValues((v) => ({ ...v, type: 'company' }))} /> Società</label></div>
                            {values.type === 'person' ? <div className="grid gap-3 sm:grid-cols-2"><input className={inputClass} placeholder="Nome" value={values.firstName} onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))} /><input className={inputClass} placeholder="Cognome" value={values.lastName} onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))} /></div> : <input className={inputClass} placeholder="Società" value={values.companyName} onChange={(e) => setValues((v) => ({ ...v, companyName: e.target.value }))} />}
                            {(['email', 'phone', 'fiscalCode', 'vatNumber', 'address', 'city', 'zip', 'country', 'notes'] as const).map((key) => <input key={key} className={inputClass} placeholder={key} value={values[key]} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))} />)}
                        </fieldset>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <div className="flex justify-end gap-3 border-t pt-4"><button type="button" onClick={close} disabled={isCreating} className="px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">Annulla</button><button type="button" onClick={() => void create()} disabled={isCreating} className="rounded bg-green-600 px-5 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60">{isCreating ? 'Creazione...' : 'Crea garante'}</button></div>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
};
