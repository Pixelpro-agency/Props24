import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Search, User, UserPlus, X } from 'lucide-react';
import { createTenant } from '../../../../db/tenantRepository';
import { getJsonDb, subscribeJsonDb } from '../../../../db/jsonDb';
import type { TenantRecord } from '../../../../db/database.types';
import { defaultTenantValues, normalizeTenantFormData } from '../../../../components/tenant-form/schema';

interface AddTenantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTenantAdded: (tenantId: string) => void;
    onError?: (message: string) => void;
    existingTenantIds: string[];
}

const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#337ab7] focus:outline-none focus:ring-2 focus:ring-[#337ab7]/30';

function tenantName(tenant: TenantRecord): string {
    return tenant.type === 'company'
        ? tenant.companyName || 'Società'
        : `${tenant.firstName} ${tenant.lastName}`.replace(/\s+/g, ' ').trim() || 'Inquilino';
}

function activeTenants(): TenantRecord[] {
    return getJsonDb().tenants.filter((tenant) => !tenant.archived);
}

export const AddTenantModal: React.FC<AddTenantModalProps> = ({ isOpen, onClose, onTenantAdded, onError, existingTenantIds }) => {
    const [mode, setMode] = useState<'select' | 'create'>('create');
    const [tenantType, setTenantType] = useState<'person' | 'company'>('person');
    const [query, setQuery] = useState('');
    const [tenants, setTenants] = useState<TenantRecord[]>(() => activeTenants());
    const [values, setValues] = useState({ firstName: '', lastName: '', companyName: '', email: '', phone: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return undefined;
        const refresh = () => setTenants(activeTenants());
        refresh();
        return subscribeJsonDb(refresh);
    }, [isOpen]);

    const availableTenants = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        return tenants
            .filter((tenant) => !existingTenantIds.includes(tenant.id))
            .filter((tenant) => {
                if (!normalized) return true;
                return [tenantName(tenant), tenant.email, tenant.mobilePhone, tenant.phone]
                    .join(' ')
                    .toLowerCase()
                    .includes(normalized);
            });
    }, [existingTenantIds, query, tenants]);

    if (!isOpen) return null;

    const resetAndClose = () => {
        setError('');
        setQuery('');
        setMode('create');
        setValues({ firstName: '', lastName: '', companyName: '', email: '', phone: '' });
        onClose();
    };

    const createQuickTenant = () => {
        setError('');
        if (tenantType === 'person' && !values.firstName.trim()) {
            setError('Inserisci il nome.');
            return;
        }
        if (tenantType === 'person' && !values.lastName.trim()) {
            setError('Inserisci il cognome.');
            return;
        }
        if (tenantType === 'company' && !values.companyName.trim()) {
            setError('Inserisci la società.');
            return;
        }

        try {
            const tenant = createTenant(normalizeTenantFormData({
                ...defaultTenantValues,
                TenantType: tenantType,
                TenantFirstName: values.firstName,
                TenantLastName: values.lastName,
                TenantCompanyName: values.companyName,
                TenantEmail: values.email,
                TenantMobilePhoneNat: values.phone,
                TenantPhoneNat: values.phone,
            }));
            onTenantAdded(tenant.id);
            resetAndClose();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Non è stato possibile creare l’inquilino.';
            setError(message);
            onError?.(message);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onMouseDown={resetAndClose}>
            <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <UserPlus className="h-5 w-5" /> Aggiungi inquilino
                    </h3>
                    <button type="button" onClick={resetAndClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex gap-2 border-b border-gray-100 px-6 py-3">
                    <button type="button" onClick={() => setMode('create')} className={`rounded px-4 py-2 text-sm font-medium ${mode === 'create' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        Nuovo
                    </button>
                    <button type="button" onClick={() => setMode('select')} className={`rounded px-4 py-2 text-sm font-medium ${mode === 'select' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        Esistente
                    </button>
                </div>

                {mode === 'select' ? (
                    <div className="space-y-4 px-6 py-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClass} pl-9`} placeholder="Cerca per nome, email o telefono" />
                        </div>
                        {availableTenants.length === 0 ? (
                            <p className="rounded border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">Nessun inquilino disponibile da selezionare.</p>
                        ) : (
                            <div className="grid gap-2">
                                {availableTenants.map((tenant) => (
                                    <button key={tenant.id} type="button" onClick={() => { onTenantAdded(tenant.id); resetAndClose(); }} className="flex items-center gap-3 rounded border border-gray-200 p-3 text-left hover:border-green-500 hover:bg-green-50">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                                            {tenant.type === 'company' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-800">{tenantName(tenant)}</p>
                                            <p className="truncate text-xs text-gray-500">{tenant.email || 'Nessuna email'} {tenant.mobilePhone || tenant.phone ? `- ${tenant.mobilePhone || tenant.phone}` : ''}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 px-6 py-4">
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="radio" checked={tenantType === 'person'} onChange={() => setTenantType('person')} className="accent-green-600" />
                                Persona
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="radio" checked={tenantType === 'company'} onChange={() => setTenantType('company')} className="accent-green-600" />
                                Società
                            </label>
                        </div>

                        {tenantType === 'person' ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <input className={inputClass} placeholder="Nome" value={values.firstName} onChange={(event) => setValues((prev) => ({ ...prev, firstName: event.target.value }))} />
                                <input className={inputClass} placeholder="Cognome" value={values.lastName} onChange={(event) => setValues((prev) => ({ ...prev, lastName: event.target.value }))} />
                            </div>
                        ) : (
                            <input className={inputClass} placeholder="Società" value={values.companyName} onChange={(event) => setValues((prev) => ({ ...prev, companyName: event.target.value }))} />
                        )}

                        <input className={inputClass} placeholder="Email facoltativa" type="email" value={values.email} onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))} />
                        <input className={inputClass} placeholder="Telefono facoltativo" value={values.phone} onChange={(event) => setValues((prev) => ({ ...prev, phone: event.target.value }))} />
                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                            <button type="button" onClick={resetAndClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Annulla</button>
                            <button type="button" onClick={createQuickTenant} className="rounded bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700">Aggiungi inquilino</button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
};
