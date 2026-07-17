import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Plus, Save, Trash2, UserPlus, X } from 'lucide-react';
import { LeaseTabs } from './LeaseTabs';
import { AddTenantModal } from '../Modals/AddTenantModal';
import { AddGuarantorModal } from '../Modals/AddGuarantorModal';
import { LEASE_TYPES, getLeaseTypeById } from '../../data/leaseTypes';
import { createLease, updateLease } from '../../../../db/leaseRepository';
import { getDraft, getJsonDb, setDraft, subscribeJsonDb } from '../../../../db/jsonDb';
import type { ContactRecord, PropertyRecord, TenantRecord } from '../../../../db/database.types';
import { StatusToast, type StatusToastState } from '../../../../components/ui/StatusToast';
import {
    calculateLeasePeriodicAmount,
    defaultLeaseValues,
    isVatEnabled,
    leaseFormSchema,
    normalizeLeaseDraft,
    normalizeLeaseFormData,
    type LeaseFormData,
} from '../../schema/leaseFormSchema';
import { TenantLeaseConflictError } from '../../../../db/databaseErrors';

const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#337ab7] focus:outline-none focus:ring-2 focus:ring-[#337ab7]/30';
const errorClass = 'mt-1 text-xs text-red-600';

function activeDbSnapshot() {
    const db = getJsonDb();
    return {
        properties: db.properties.filter((property) => !property.archived),
        tenants: db.tenants.filter((tenant) => !tenant.archived),
        contacts: db.contacts,
    };
}

function propertyLabel(property: PropertyRecord): string {
    const f = property.formData;
    const address = [f.PropertyAddress, f.PropertyPostalCode, f.PropertyCity].filter(Boolean).join(', ');
    return `${f.PropertyTitle || 'Unità senza nome'}${address ? ` - ${address}` : ''}`;
}

function tenantName(tenant: TenantRecord): string {
    return tenant.type === 'company'
        ? tenant.companyName || 'Società'
        : `${tenant.firstName} ${tenant.lastName}`.replace(/\s+/g, ' ').trim() || 'Inquilino';
}

function firstErrorTab(errors: Record<string, unknown>): 'general' | 'tenants' | 'guarantors' {
    if (errors.LeaseTenantIds) return 'tenants';
    if (errors.LeaseGarantIds) return 'guarantors';
    return 'general';
}

function toastFromError(error: unknown): string {
    if (error instanceof TenantLeaseConflictError) {
        return "L'inquilino selezionato possiede già una locazione sovrapposta su un'altra proprietà.\nModifica le date oppure seleziona un altro inquilino.";
    }
    if (error instanceof Error && error.message) return error.message;
    return 'Non è stato possibile creare la locazione.';
}

export interface LeaseFormProps {
    mode?: 'create' | 'edit';
    leaseId?: string;
    initialValues?: LeaseFormData;
}

function buildLeaseDraftSignature(formData: LeaseFormData, activeTab: string): string {
    return JSON.stringify({
        formData: normalizeLeaseFormData(formData),
        activeTab,
    });
}

export const LeaseForm: React.FC<LeaseFormProps> = ({ mode = 'create', leaseId, initialValues }) => {
    const isEditMode = mode === 'edit';
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('general');
    const [tenantModalOpen, setTenantModalOpen] = useState(false);
    const [guarantorModalOpen, setGuarantorModalOpen] = useState(false);
    const [snapshot, setSnapshot] = useState(activeDbSnapshot);
    const [pendingPropertyId, setPendingPropertyId] = useState<string | null>(null);
    const [toast, setToast] = useState<StatusToastState | null>(null);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const restoredDraftRef = useRef(false);
    const draftHydratedRef = useRef(false);
    const draftTimerRef = useRef<number | null>(null);
    const lastSavedSignatureRef = useRef('');
    const isCreatingLeaseRef = useRef(false);
    const endDateEditedRef = useRef(false);
    const renewEditedRef = useRef(false);

    const form = useForm<LeaseFormData>({
        resolver: zodResolver(leaseFormSchema) as never,
        defaultValues: initialValues ? normalizeLeaseFormData(initialValues) : defaultLeaseValues,
        mode: 'onSubmit',
    });
    const { register, control, watch, setValue, getValues, reset, formState: { errors, isSubmitting } } = form;
    const { fields, append, remove } = useFieldArray({ control, name: 'PaymentItems' });

    const values = watch();
    const draftSignature = buildLeaseDraftSignature(values, activeTab);
    const selectedTenantIds = watch('LeaseTenantIds') || [];
    const selectedGuarantorIds = watch('LeaseGarantIds') || [];
    const selectedTenants = useMemo(() => selectedTenantIds
        .map((id: string) => snapshot.tenants.find((tenant: TenantRecord) => tenant.id === id))
        .filter((tenant): tenant is TenantRecord => Boolean(tenant)), [selectedTenantIds, snapshot.tenants]);
    const selectedGuarantors = useMemo(() => selectedGuarantorIds
        .map((id: string) => snapshot.contacts.find((contact: ContactRecord) => contact.id === id))
        .filter((contact): contact is ContactRecord => Boolean(contact)), [selectedGuarantorIds, snapshot.contacts]);
    const selectedProperty = snapshot.properties.find((property) => property.id === watch('PropertyID'));
    const selectedBillingPeriod = watch('LeaseBillingPeriod');

    useEffect(() => {
        const refresh = () => setSnapshot(activeDbSnapshot());
        refresh();
        return subscribeJsonDb(refresh);
    }, []);

    useEffect(() => {
        if (isEditMode) return;
        if (restoredDraftRef.current) return;
        try {
            const draft = normalizeLeaseDraft(getDraft('leaseForm'));
            restoredDraftRef.current = true;
            if (!draft) {
                lastSavedSignatureRef.current = buildLeaseDraftSignature(getValues(), activeTab);
                draftHydratedRef.current = true;
                return;
            }
            const nextActiveTab = draft.activeTab === 'tenants' || draft.activeTab === 'guarantors' ? draft.activeTab : 'general';
            const next = normalizeLeaseFormData({
                ...draft.formData,
                PropertyID: snapshot.properties.some((property) => property.id === draft.formData.PropertyID) ? draft.formData.PropertyID : '',
                LeaseTenantIds: (draft.formData.LeaseTenantIds || []).filter((id: string) => snapshot.tenants.some((tenant: TenantRecord) => tenant.id === id)),
                LeaseGarantIds: (draft.formData.LeaseGarantIds || []).filter((id: string) => snapshot.contacts.some((contact: ContactRecord) => contact.id === id)),
            });
            reset(next);
            setActiveTab(nextActiveTab);
            lastSavedSignatureRef.current = buildLeaseDraftSignature(next, nextActiveTab);
            draftHydratedRef.current = true;
        } catch {
            restoredDraftRef.current = true;
            lastSavedSignatureRef.current = buildLeaseDraftSignature(getValues(), activeTab);
            draftHydratedRef.current = true;
            setToast({ variant: 'error', title: 'Bozza', message: 'Una parte della bozza non era più valida ed è stata ignorata.' });
        }
    }, [activeTab, getValues, isEditMode, reset, snapshot.contacts, snapshot.properties, snapshot.tenants]);

    useEffect(() => {
        if (!isEditMode || !initialValues) return;
        const next = normalizeLeaseFormData(initialValues);
        reset(next);
        lastSavedSignatureRef.current = buildLeaseDraftSignature(next, activeTab);
        draftHydratedRef.current = true;
    }, [activeTab, initialValues, isEditMode, reset]);

    useEffect(() => {
        const next = calculateLeasePeriodicAmount(values);
        if (next !== values.LeaseMonthlyAmount) setValue('LeaseMonthlyAmount', next, { shouldDirty: true });
    }, [setValue, values]);

    useEffect(() => {
        const selectedType = getLeaseTypeById(values.LeaseType);
        if (!selectedType || !selectedType.durationMonths || !values.LeaseStartDate || endDateEditedRef.current) return;
        const start = new Date(`${values.LeaseStartDate}T00:00:00Z`);
        start.setUTCMonth(start.getUTCMonth() + selectedType.durationMonths);
        start.setUTCDate(start.getUTCDate() - 1);
        setValue('LeaseEndDate', start.toISOString().slice(0, 10), { shouldDirty: true });
    }, [setValue, values.LeaseEndDate, values.LeaseStartDate, values.LeaseType]);

    useEffect(() => {
        if (isEditMode) return undefined;
        if (!draftHydratedRef.current || isCreatingLeaseRef.current) return undefined;
        if (draftSignature === lastSavedSignatureRef.current) return undefined;
        if (draftTimerRef.current !== null) window.clearTimeout(draftTimerRef.current);

        draftTimerRef.current = window.setTimeout(() => {
            setIsSavingDraft(true);
            try {
                const formData = normalizeLeaseFormData(getValues());
                setDraft('leaseForm', {
                    formData,
                    activeTab,
                    updatedAt: new Date().toISOString(),
                });
                setLastSavedAt(new Date().toLocaleTimeString());
                lastSavedSignatureRef.current = buildLeaseDraftSignature(formData, activeTab);
            } catch {
                setToast({ variant: 'error', title: 'Bozza', message: 'Non è stato possibile salvare la bozza.' });
            } finally {
                setIsSavingDraft(false);
                draftTimerRef.current = null;
            }
        }, 1000);

        return () => {
            if (draftTimerRef.current !== null) {
                window.clearTimeout(draftTimerRef.current);
                draftTimerRef.current = null;
            }
        };
    }, [activeTab, draftSignature, getValues, isEditMode]);

    const applyProperty = (propertyId: string) => {
        const property = snapshot.properties.find((item) => item.id === propertyId);
        setValue('PropertyID', propertyId, { shouldDirty: true, shouldValidate: true });
        if (property) {
            setValue('LeaseRentHC', property.formData.PropertyRent ?? 0, { shouldDirty: true });
            setValue('LeaseMaintenance', property.formData.PropertyMaintenance ?? 0, { shouldDirty: true });
        }
        setPendingPropertyId(null);
    };

    const handleLeaseTypeChange = (leaseTypeId: string) => {
        const selectedType = getLeaseTypeById(leaseTypeId);
        setValue('LeaseType', leaseTypeId, { shouldDirty: true, shouldValidate: true });
        if (selectedType && !renewEditedRef.current) {
            setValue('LeaseRinnovoTacito', selectedType.autoRenewDefault, { shouldDirty: true });
        }
        if (selectedType?.durationMonths && values.LeaseStartDate && !endDateEditedRef.current) {
            const start = new Date(`${values.LeaseStartDate}T00:00:00Z`);
            start.setUTCMonth(start.getUTCMonth() + selectedType.durationMonths);
            start.setUTCDate(start.getUTCDate() - 1);
            setValue('LeaseEndDate', start.toISOString().slice(0, 10), { shouldDirty: true, shouldValidate: true });
        }
    };

    const addTenantId = (tenantId: string) => {
        const current = getValues('LeaseTenantIds');
        if (!current.includes(tenantId)) setValue('LeaseTenantIds', [...current, tenantId], { shouldDirty: true, shouldValidate: true });
    };

    const removeTenantId = (tenantId: string) => {
        setValue('LeaseTenantIds', getValues('LeaseTenantIds').filter((id) => id !== tenantId), { shouldDirty: true, shouldValidate: true });
    };

    const addGuarantorId = (contactId: string) => {
        const current = getValues('LeaseGarantIds');
        if (!current.includes(contactId)) setValue('LeaseGarantIds', [...current, contactId], { shouldDirty: true, shouldValidate: true });
    };

    const removeGuarantorId = (contactId: string) => {
        setValue('LeaseGarantIds', getValues('LeaseGarantIds').filter((id) => id !== contactId), { shouldDirty: true, shouldValidate: true });
    };

    const saveDraftNow = () => {
        if (isEditMode) return;
        if (draftTimerRef.current !== null) {
            window.clearTimeout(draftTimerRef.current);
            draftTimerRef.current = null;
        }

        try {
            const formData = normalizeLeaseFormData(getValues());
            setDraft('leaseForm', { formData, activeTab, updatedAt: new Date().toISOString() });
            lastSavedSignatureRef.current = buildLeaseDraftSignature(formData, activeTab);
            setLastSavedAt(new Date().toLocaleTimeString());
            setToast({ variant: 'success', title: 'Bozza', message: 'La bozza è stata salvata.' });
        } catch {
            setToast({ variant: 'error', title: 'Bozza', message: 'Non è stato possibile salvare la bozza.' });
        }
    };

    const onSubmit = form.handleSubmit((data) => {
        try {
            isCreatingLeaseRef.current = true;
            if (draftTimerRef.current !== null) {
                window.clearTimeout(draftTimerRef.current);
                draftTimerRef.current = null;
            }
            const savedLease = isEditMode && leaseId ? updateLease(leaseId, data) : createLease(data);
            navigate(isEditMode ? `/leases/${savedLease.id}` : '/leases', {
                state: {
                    toast: { variant: 'success', title: 'Successo', message: isEditMode ? 'La locazione è stata aggiornata.' : 'La locazione è stata creata.' },
                },
            });
        } catch (error) {
            isCreatingLeaseRef.current = false;
            setToast({ variant: 'error', title: 'Errore', message: toastFromError(error) });
        }
    }, (invalid) => {
        const tab = firstErrorTab(invalid);
        setActiveTab(tab);
        setToast({ variant: 'error', title: 'Errore di validazione', message: 'Controlla i campi evidenziati prima di creare la locazione.' });
            const firstName = Object.keys(invalid)[0];
        window.setTimeout(() => {
            const element = document.querySelector(firstName === 'PaymentItems' ? '[name^="PaymentItems"]' : `[name="${firstName}"]`) as HTMLElement | null;
            element?.focus();
        }, 0);
    });

    const renderGeneralTab = () => (
        <div className="space-y-8">
            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-lg font-semibold text-gray-800">Proprietà e tipo</h3>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Proprietà *</label>
                    <select
                        {...register('PropertyID')}
                        value={watch('PropertyID')}
                        className={inputClass}
                        onChange={(event) => {
                            const nextId = event.target.value;
                            const current = getValues('PropertyID');
                            if (current && current !== nextId) setPendingPropertyId(nextId);
                            else applyProperty(nextId);
                        }}
                    >
                        <option value="">Seleziona proprietà</option>
                        {snapshot.properties.map((property) => <option key={property.id} value={property.id}>{propertyLabel(property)}</option>)}
                    </select>
                    {errors.PropertyID && <p className={errorClass}>{errors.PropertyID.message}</p>}
                </div>
                {selectedProperty && (
                    <p className="rounded bg-gray-50 px-3 py-2 text-sm text-gray-600">{propertyLabel(selectedProperty)}</p>
                )}
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Tipo *</label>
                    <select {...register('LeaseType')} value={watch('LeaseType')} onChange={(event) => handleLeaseTypeChange(event.target.value)} className={inputClass}>
                        <option value="">Seleziona tipo</option>
                        {LEASE_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                    </select>
                    {errors.LeaseType && <p className={errorClass}>{errors.LeaseType.message}</p>}
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Identificativo</label>
                    <input {...register('LeaseIdentificativo')} className={inputClass} />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Numero registrazione</label>
                    <input {...register('LeaseNumeroRegistrazione')} className={inputClass} />
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Inizio *</label>
                    <input type="date" {...register('LeaseStartDate')} className={inputClass} />
                    {errors.LeaseStartDate && <p className={errorClass}>{errors.LeaseStartDate.message}</p>}
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Fine *</label>
                    <input type="date" {...register('LeaseEndDate', { onChange: () => { endDateEditedRef.current = true; } })} className={inputClass} />
                    {errors.LeaseEndDate && <p className={errorClass}>{errors.LeaseEndDate.message}</p>}
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm text-gray-700">
                    <input type="checkbox" {...register('LeaseRinnovoTacito', { onChange: () => { renewEditedRef.current = true; } })} className="accent-green-600" />
                    Tacito rinnovo
                </label>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Periodicità *</label>
                    <select {...register('LeaseBillingPeriod')} className={inputClass}>
                        <option value="weekly">Settimanale</option>
                        <option value="biweekly">Bisettimanale</option>
                        <option value="monthly">Mensile</option>
                        <option value="quarterly">Trimestrale</option>
                        <option value="semiannual">Semestrale</option>
                        <option value="annual">Annuale</option>
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Scadenza</label>
                    <select {...register('LeasePaymentTiming')} className={inputClass}>
                        <option value="anticipato">Anticipato</option>
                        <option value="arretrato">Arretrato</option>
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Metodo</label>
                    <select {...register('LeasePaymentMethod')} className={inputClass}>
                        <option value="">Scegli</option>
                        <option value="bonifico">Bonifico</option>
                        <option value="addebito">Addebito diretto</option>
                        <option value="contanti">Contanti</option>
                    </select>
                </div>
                {selectedBillingPeriod !== 'weekly' && selectedBillingPeriod !== 'biweekly' && (
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Giorno</label>
                        <input type="number" min={1} max={31} {...register('LeasePaymentDay', { valueAsNumber: true })} className={inputClass} />
                        {errors.LeasePaymentDay && <p className={errorClass}>{errors.LeasePaymentDay.message}</p>}
                    </div>
                )}
            </section>

            <section className="grid gap-4 md:grid-cols-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Canone</label>
                    <input type="number" step="0.01" {...register('LeaseRentHC', { valueAsNumber: true })} className={inputClass} />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Spese</label>
                    <input type="number" step="0.01" {...register('LeaseMaintenance', { valueAsNumber: true })} className={inputClass} />
                    {errors.LeaseMaintenance && <p className={errorClass}>{errors.LeaseMaintenance.message}</p>}
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Tipo IVA</label>
                    <select {...register('LeaseVatType')} className={inputClass}>
                        <option value="0">Nessuna IVA</option>
                        <option value="percent">Percentuale</option>
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Importo periodico</label>
                    <input value={values.LeaseMonthlyAmount || 0} readOnly className={`${inputClass} bg-gray-50`} />
                </div>
            </section>

            {isVatEnabled(values.LeaseVatType) && (
                <section className="grid gap-4 md:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">IVA %</label>
                        <input type="number" step="0.01" {...register('LeaseVatPercent', { valueAsNumber: true })} className={inputClass} />
                        {errors.LeaseVatPercent && <p className={errorClass}>{errors.LeaseVatPercent.message}</p>}
                    </div>
                </section>
            )}

            <section className="grid gap-4 md:grid-cols-3">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Tipo spese</label>
                    <select {...register('LeaseSpeseType')} className={inputClass}>
                        <option value="anticipo">Anticipo</option>
                        <option value="forfait">Forfait</option>
                    </select>
                </div>
            </section>

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-800">Elementi ricorrenti</h3>
                    <button type="button" onClick={() => append({ LeasePaymentItems_Amount: 0, LeasePaymentItems_TaxPercent: 0, LeasePaymentItems_Type: 'recurring', LeasePaymentItems_Description: '' })} className="flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
                        <Plus className="h-4 w-4" /> Aggiungi
                    </button>
                </div>
                {fields.map((field, index) => (
                    <div key={field.id} className="grid gap-3 rounded border border-gray-200 p-3 md:grid-cols-[1fr_120px_120px_140px_auto]">
                        <input {...register(`PaymentItems.${index}.LeasePaymentItems_Description`)} className={inputClass} placeholder="Descrizione" />
                        <input type="number" step="0.01" {...register(`PaymentItems.${index}.LeasePaymentItems_Amount`, { valueAsNumber: true })} className={inputClass} placeholder="Importo" />
                        <input type="number" step="0.01" {...register(`PaymentItems.${index}.LeasePaymentItems_TaxPercent`, { valueAsNumber: true })} className={inputClass} placeholder="IVA %" />
                        <select {...register(`PaymentItems.${index}.LeasePaymentItems_Type`)} className={inputClass}>
                            <option value="recurring">Ricorrente</option>
                            <option value="charge">Spesa</option>
                            <option value="service">Servizio</option>
                        </select>
                        <button type="button" onClick={() => remove(index)} className="rounded p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                ))}
            </section>

            <section className="grid gap-4 md:grid-cols-4">
                <label className="flex items-end gap-2 pb-2 text-sm text-gray-700">
                    <input type="checkbox" {...register('LeaseFirstBill')} className="accent-green-600" />
                    Prima ricevuta
                </label>
                {values.LeaseFirstBill && (
                    <>
                        <input type="date" {...register('LeaseFirstBillEndDate')} className={inputClass} />
                        <input type="number" step="0.01" {...register('LeaseFirstBillAmount', { valueAsNumber: true })} className={inputClass} placeholder="Canone prima rata" />
                        <input type="number" step="0.01" {...register('LeaseFirstBillCharges', { valueAsNumber: true })} className={inputClass} placeholder="Spese prima rata" />
                    </>
                )}
            </section>

            <section className="grid gap-4 md:grid-cols-4">
                <input type="number" step="0.01" {...register('LeaseDeposit', { valueAsNumber: true })} className={inputClass} placeholder="Deposito" />
                <select {...register('LeaseDepositType')} className={inputClass}>
                    <option value="trattenuto">Trattenuto</option>
                    <option value="versato">Versato</option>
                </select>
                <input type="date" {...register('LeaseDepositDate')} className={inputClass} />
                <input type="number" step="0.01" {...register('LeasePrepaidRent', { valueAsNumber: true })} className={inputClass} placeholder="Affitti prepagati" />
            </section>

            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Aggiornamento del canone</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    <select {...register('LeaseUpdateType')} className={inputClass}>
                        <option value="nessuno">Nessuno</option>
                        <option value="indice">In base all'indice</option>
                        <option value="percentuale">Percentuale fissa</option>
                    </select>
                    <input {...register('LeaseUpdateIndex')} className={inputClass} placeholder="Indice base" />
                    <select {...register('LeaseUpdatePeriod')} className={inputClass}>
                        <option value="annual">Annuale</option>
                        <option value="semiannual">Semestrale</option>
                    </select>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" {...register('LeaseUpdateAuto')} className="accent-green-600" />
                        Automatico
                    </label>
                    <select {...register('LeaseUpdateDateType')} className={inputClass}>
                        <option value="anniversario">Anniversario</option>
                        <option value="specifica">Data specifica</option>
                    </select>
                    <input type="date" {...register('LeaseUpdateDateSpecific')} className={inputClass} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <input {...register('LeaseIrlIndex')} className={inputClass} placeholder="IRL" />
                    <input {...register('LeaseIlcIndex')} className={inputClass} placeholder="ILC" />
                    <input {...register('LeaseIccIndex')} className={inputClass} placeholder="ICC" />
                </div>
            </section>
        </div>
    );

    const renderTenantsTab = () => (
        <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Inquilini</h3>
                    <p className="text-sm text-gray-500">Seleziona o crea gli inquilini collegati alla locazione.</p>
                </div>
                <button type="button" onClick={() => setTenantModalOpen(true)} className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                    <UserPlus className="h-4 w-4" /> Aggiungi inquilino
                </button>
            </div>
            {errors.LeaseTenantIds && <p className={errorClass}>{errors.LeaseTenantIds.message}</p>}
            {selectedTenants.length === 0 ? (
                <div className="rounded border border-dashed border-gray-300 bg-gray-50 py-10 text-center text-sm text-gray-500">Nessun inquilino aggiunto.</div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {selectedTenants.map((tenant: TenantRecord) => (
                        <div key={tenant.id} className="flex items-center justify-between rounded border border-gray-200 bg-white p-4">
                            <div>
                                <p className="font-medium text-gray-800">{tenantName(tenant)}</p>
                                <p className="text-sm text-gray-500">{tenant.email || 'Nessuna email'} {tenant.mobilePhone || tenant.phone ? `- ${tenant.mobilePhone || tenant.phone}` : ''}</p>
                            </div>
                            <button type="button" onClick={() => removeTenantId(tenant.id)} className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <AddTenantModal isOpen={tenantModalOpen} onClose={() => setTenantModalOpen(false)} onTenantAdded={addTenantId} onError={(message) => setToast({ variant: 'error', title: 'Inquilino', message })} existingTenantIds={selectedTenantIds} />
        </div>
    );

    const renderGuarantorsTab = () => (
        <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Garanti</h3>
                    <p className="text-sm text-gray-500">Seleziona contatti esistenti o crea un nuovo garante.</p>
                </div>
                <button type="button" onClick={() => setGuarantorModalOpen(true)} className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                    <UserPlus className="h-4 w-4" /> Aggiungi garante
                </button>
            </div>
            {selectedGuarantors.length === 0 ? (
                <div className="rounded border border-dashed border-gray-300 bg-gray-50 py-10 text-center text-sm text-gray-500">Nessun garante aggiunto.</div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {selectedGuarantors.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between rounded border border-gray-200 bg-white p-4">
                            <div>
                                <p className="font-medium text-gray-800">{contact.type === 'company' ? contact.companyName : `${contact.firstName} ${contact.lastName}`.trim()}</p>
                                <p className="text-sm text-gray-500">{contact.email || contact.phone || 'Nessun contatto'}{contact.archived ? ' - archiviato' : ''}</p>
                            </div>
                            <button type="button" onClick={() => removeGuarantorId(contact.id)} className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <AddGuarantorModal isOpen={guarantorModalOpen} onClose={() => setGuarantorModalOpen(false)} onGuarantorAdded={addGuarantorId} onError={(message) => setToast({ variant: 'error', title: 'Garante', message })} existingGuarantorIds={selectedGuarantorIds} linkedGuarantorIds={selectedGuarantorIds} />
        </div>
    );

    return (
        <>
            <form onSubmit={onSubmit}>
                <LeaseTabs activeTab={activeTab} onTabChange={setActiveTab}>
                    {activeTab === 'tenants' ? renderTenantsTab() : activeTab === 'guarantors' ? renderGuarantorsTab() : renderGeneralTab()}
                </LeaseTabs>

                <div className="mt-8 flex flex-col gap-4 border-t border-gray-200 pt-6 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-gray-500">
                        {isEditMode ? 'Modifica locazione' : isSavingDraft ? 'Salvataggio bozza...' : lastSavedAt ? (
                            <span className="inline-flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Bozza aggiornata alle {lastSavedAt}</span>
                        ) : 'Bozza non ancora salvata'}
                    </div>
                    <div className="flex justify-end gap-3">
                        <Link to="/leases" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Annulla</Link>
                        {!isEditMode && (
                            <button type="button" onClick={saveDraftNow} className="flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                <Save className="h-4 w-4" /> Salva bozza
                            </button>
                        )}
                        <button type="submit" disabled={isSubmitting} className="rounded bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                            {isSubmitting ? (isEditMode ? 'Salvataggio...' : 'Creazione...') : (isEditMode ? 'Salva modifiche' : 'Crea locazione')}
                        </button>
                    </div>
                </div>
            </form>

            {pendingPropertyId !== null && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-3 flex items-center gap-2 text-amber-700">
                            <AlertTriangle className="h-5 w-5" />
                            <h3 className="font-semibold">Cambio proprietà</h3>
                        </div>
                        <p className="text-sm text-gray-600">Vuoi aggiornare canone, spese e importo periodico con i valori della nuova proprietà?</p>
                        <div className="mt-5 flex justify-end gap-3">
                            <button type="button" onClick={() => setPendingPropertyId(null)} className="px-4 py-2 text-sm text-gray-600">Annulla</button>
                            <button type="button" onClick={() => applyProperty(pendingPropertyId)} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Conferma</button>
                        </div>
                    </div>
                </div>
            )}

            <StatusToast toast={toast} onClose={() => setToast(null)} />
        </>
    );
};
