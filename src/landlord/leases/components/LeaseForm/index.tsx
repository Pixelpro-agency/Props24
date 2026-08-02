import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Calculator, Info, Paperclip, Plus, Save, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react';
import { LeaseTabs } from './LeaseTabs';
import { AddTenantModal } from '../Modals/AddTenantModal';
import { AddGuarantorModal } from '../Modals/AddGuarantorModal';
import { LEASE_TYPES, getLeaseTypeById } from '../../data/leaseTypes';
import { createLease, getLeaseDetail, updateLease } from '../../../../db/leaseRepository';
import { LeaseDocumentsTab } from '../../../../components/lease-detail/LeaseDocumentsTab';
import { LeaseContractTab } from '../../../../components/lease-detail/LeaseContractTab';
import { LeaseSignatureTab } from '../../../../components/lease-detail/LeaseSignatureTab';
import { getJsonDb, subscribeJsonDb } from '../../../../db/jsonDb';
import type { PropertyRecord, TenantRecord } from '../../../../db/database.types';
import { StatusToast, type StatusToastState } from '../../../../components/ui/StatusToast';
import {
    calculateLeaseEndDate,
    calculateLeasePeriodicAmount,
    calculateFirstBillProrata,
    defaultLeaseValues,
    leaseFormSchema,
    normalizeLeaseFormData,
    PAYMENT_GENERATION_OFFSETS,
    proposeFirstBillEndDate,
    type LeaseFormData,
} from '../../schema/leaseFormSchema';
import { TenantLeaseConflictError } from '../../../../db/databaseErrors';
import { ISTAT_INDEX_OPTIONS } from '../../data/istatIndexOptions';
import { useContactList } from '../../../../contacts/useContactList';
import { normalizeLeaseFormTab, type LeaseFormTab } from '../../drafts/leaseDraftDefinition';
import { useLeaseCreateDraftContext, type LeaseCreateDraftContextValue } from '../../drafts/LeaseCreateDraftProvider';
import {
    reconcileGuarantorReferences,
    reconcilePropertyReference,
    reconcileTenantReferences,
} from '../../drafts/leaseDraftReferenceReconciliation';

const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[#337ab7] focus:outline-none focus:ring-2 focus:ring-[#337ab7]/30';
const errorClass = 'mt-1 text-xs text-red-600';

function activeLeaseDataSnapshot() {
    const db = getJsonDb();
    return {
        properties: db.properties,
        tenants: db.tenants,
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

interface LeaseErrorTarget {
    rootField: string;
    fieldName: string;
    tab: LeaseFormTab;
    selector: string;
}

const receiptErrorFields = new Set([
    'LeaseReceiptUseAlternateAddress',
    'LeaseReceiptAlternateAddress',
    'LeaseReceiptDocumentTitle',
    'LeaseReceiptAutoNumbering',
    'LeaseReceiptNumberingPrefix',
    'LeaseReceiptNumberingScope',
    'LeaseReceiptSdiCode',
    'LeaseReceiptPecEmail',
    'LeaseReceiptFooterText',
    'LeaseDueNoticeText',
]);

const settingsErrorFields = new Set([
    'LeaseBalanceCarryMode',
    'LeaseNotifyLandlordRentAvailable',
    'LeaseNotifyTenantRentAvailable',
    'LeaseNotifyLandlordLeaseEnd',
    'LeaseNotifyTenantLeaseEnd',
    'LeaseNotifyTenantLateRent',
]);

const errorMetadataFields = new Set(['message', 'type', 'types', 'ref', 'root']);

function tabForErrorField(fieldName: string): LeaseFormTab {
    if (fieldName === 'LeaseTenantIds') return 'tenants';
    if (fieldName === 'LeaseGarantIds') return 'guarantors';
    if (receiptErrorFields.has(fieldName)) return 'receipts';
    if (settingsErrorFields.has(fieldName)) return 'settings';
    if (fieldName === 'LeaseInsuranceContracts') return 'insurance';
    return 'general';
}

function firstNestedErrorPath(root: string, value: unknown): string | null {
    const visit = (current: unknown, path: string): string | null => {
        if (current === null || current === undefined) return null;
        if (typeof current !== 'object') return path;

        const record = current as Record<string, unknown>;
        const childKeys = Object.keys(record).filter((key) => !errorMetadataFields.has(key));
        if (childKeys.length === 0) return path;

        for (const key of childKeys) {
            const nested = visit(record[key], `${path}.${key}`);
            if (nested) return nested;
        }
        return path;
    };

    return visit(value, root);
}

function selectorForErrorField(rootField: string, fieldName: string): string {
    if (rootField === 'LeaseTenantIds') return '#lease-tenant-selector';
    if (rootField === 'LeaseGarantIds') return '#lease-guarantor-selector';
    if ((rootField === 'PaymentItems' || rootField === 'LeaseInsuranceContracts') && fieldName === rootField) {
        return `[name^="${rootField}."]`;
    }
    return `[name="${fieldName}"]`;
}

function firstErrorTarget(errors: Record<string, unknown>): LeaseErrorTarget | null {
    const rootField = Object.keys(errors)[0];
    if (!rootField) return null;

    const nestedField = rootField === 'PaymentItems' || rootField === 'LeaseInsuranceContracts'
        ? firstNestedErrorPath(rootField, errors[rootField])
        : rootField;
    const fieldName = nestedField || rootField;

    return {
        rootField,
        fieldName,
        tab: tabForErrorField(rootField),
        selector: selectorForErrorField(rootField, fieldName),
    };
}

function toastFromError(error: unknown): string {
    if (error instanceof TenantLeaseConflictError) {
        return "L'inquilino selezionato possiede già una locazione sovrapposta su un'altra proprietà.\nModifica le date oppure seleziona un altro inquilino.";
    }
    if (error instanceof Error && error.message) return error.message;
    return 'Non è stato possibile creare la locazione.';
}

function formatLeaseDuration(startDate: string, endDate: string): string {
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoPattern.test(startDate) || !isoPattern.test(endDate) || endDate < startDate) return '-';
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
        || start.toISOString().slice(0, 10) !== startDate || end.toISOString().slice(0, 10) !== endDate) return '-';

    const inclusiveEnd = new Date(end);
    inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() + 1);
    if (inclusiveEnd.getUTCDate() === start.getUTCDate()) {
        const months = (inclusiveEnd.getUTCFullYear() - start.getUTCFullYear()) * 12
            + inclusiveEnd.getUTCMonth() - start.getUTCMonth();
        if (months > 0) {
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            const yearLabel = `${years} ${years === 1 ? 'anno' : 'anni'}`;
            const monthLabel = `${remainingMonths} ${remainingMonths === 1 ? 'mese' : 'mesi'}`;
            if (years && remainingMonths) return `${yearLabel} e ${monthLabel}`;
            return years ? yearLabel : monthLabel;
        }
    }

    const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
    return `${days} ${days === 1 ? 'giorno' : 'giorni'}`;
}

function formatGenerationOffset(offset: number): string {
    if (offset === 0) return 'Stessa data della ricevuta';
    return offset > 0 ? `G+${offset}` : `G${offset}`;
}

function previewMoney(value: unknown): string {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return '—';
    const amount = Number(value);
    return Number.isFinite(amount)
        ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount)
        : '—';
}

function previewDate(value: unknown): string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '—';
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
        ? date.toLocaleDateString('it-IT', { timeZone: 'UTC' })
        : '—';
}

function previewText(value: unknown, fallback = '—'): string {
    return typeof value === 'string' && value.trim() ? value : fallback;
}

function previewPercent(value: unknown): string {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return '—';
    const amount = Number(value);
    return Number.isFinite(amount)
        ? `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(amount)}%`
        : '—';
}

function previewBillingPeriod(value: unknown): string {
    return ({
        weekly: 'Settimanale',
        biweekly: 'Ogni due settimane',
        monthly: 'Mensile',
        bimonthly: 'Bimestrale',
        quarterly: 'Trimestrale',
        fourmonthly: 'Quadrimestrale',
        semiannual: 'Semestrale',
        annual: 'Annuale',
    } as Record<string, string>)[typeof value === 'string' ? value : ''] || '—';
}

export interface LeaseFormProps {
    mode?: 'create' | 'edit';
    leaseId?: string;
    initialValues?: LeaseFormData;
    onCreateLeaseCreated?: (lease: { id: string }) => Promise<void> | void;
}

interface LeaseFormContentProps extends LeaseFormProps {
    form: UseFormReturn<LeaseFormData>;
    activeTab: LeaseFormTab;
    setActiveTab(tab: LeaseFormTab): void;
    draft?: Pick<LeaseCreateDraftContextValue, 'isSavingDraft' | 'isDeletingDraft' | 'draftError' | 'draftSuccess' | 'saveDraft'>;
}

function CreateLeaseForm({ onCreateLeaseCreated }: LeaseFormProps) {
    const draft = useLeaseCreateDraftContext();
    return <LeaseFormContent form={draft.methods} activeTab={draft.activeTab} setActiveTab={draft.setActiveTab} draft={draft} onCreateLeaseCreated={onCreateLeaseCreated} />;
}

function EditLeaseForm({ leaseId, initialValues }: LeaseFormProps) {
    const form = useForm<LeaseFormData>({
        resolver: zodResolver(leaseFormSchema) as never,
        defaultValues: initialValues ? normalizeLeaseFormData(initialValues) : defaultLeaseValues,
        mode: 'onSubmit',
    });
    const [activeTab, setActiveTab] = useState<LeaseFormTab>('general');
    return <LeaseFormContent mode="edit" leaseId={leaseId} initialValues={initialValues} form={form} activeTab={activeTab} setActiveTab={setActiveTab} />;
}

export const LeaseForm: React.FC<LeaseFormProps> = ({ mode = 'create', leaseId, initialValues, onCreateLeaseCreated }) => mode === 'edit'
    ? <EditLeaseForm mode={mode} leaseId={leaseId} initialValues={initialValues} />
    : <CreateLeaseForm onCreateLeaseCreated={onCreateLeaseCreated} />;

const LeaseFormContent: React.FC<LeaseFormContentProps> = ({ mode = 'create', leaseId, initialValues, form, activeTab, setActiveTab, draft, onCreateLeaseCreated }) => {
    const isEditMode = mode === 'edit';
    const navigate = useNavigate();
    const [tenantModalOpen, setTenantModalOpen] = useState(false);
    const [guarantorModalOpen, setGuarantorModalOpen] = useState(false);
    const [snapshot, setSnapshot] = useState(activeLeaseDataSnapshot);
    const [pendingPropertyId, setPendingPropertyId] = useState<string | null>(null);
    const [toast, setToast] = useState<StatusToastState | null>(null);
    const {
        contacts,
        status: contactListStatus,
        error: contactListError,
        refresh: refreshContacts,
    } = useContactList();
    /**
     * QA 11B — limitazioni non bloccanti da preservare:
     *
     * - il browser integrato non ha consentito di verificare in modo affidabile
     *   la validazione di una descrizione assicurativa realmente vuota. Il
     *   controllo resta presente nello schema, nel rendering dell'errore e nel
     *   repository. Prima di modificarlo, ripetere il caso con un browser desktop
     *   reale e interazioni umane;
     *
     * - gli eventi sintetici sugli input date non hanno consentito di verificare
     *   in modo affidabile la proposta automatica di LeaseEndDate durante la
     *   creazione. Restano presenti sia handleLeaseTypeChange sia l'effetto
     *   dedicato. Prima di modificarli, ripetere il caso con eventi reali;
     *
     * - LSE-BROWSER-007 non è stato confermato: il record verificato conteneva
     *   realmente LeasePaymentDay = 1 e il calendario ha correttamente generato
     *   le scadenze al giorno 1. Non trattarlo come difetto senza una nuova
     *   riproduzione che dimostri la perdita di un valore diverso realmente
     *   acquisito dal form.
     *
     * Ogni futura limitazione non bloccante accettata durante un collaudo deve
     * essere dichiarata esplicitamente nel report finale e documentata in modo
     * persistente, così da non perdere informazioni utili per audit o fix
     * successivi.
     */
    const editHydratedLeaseIdRef = useRef<string | null>(null);
    const endDateEditedRef = useRef(false);
    const renewEditedRef = useRef(false);

    const { register, control, watch, setValue, getValues, reset, formState: { errors, isSubmitting } } = form;
    const { fields, append, remove } = useFieldArray({ control, name: 'PaymentItems' });
    const insuranceFieldArray = useFieldArray({ control, name: 'LeaseInsuranceContracts' });

    const values = watch();
    const watchedPropertyId = watch('PropertyID');
    const watchedTenantIds = watch('LeaseTenantIds');
    const watchedGuarantorIds = watch('LeaseGarantIds');
    const selectedTenantIds = useMemo(() => watchedTenantIds || [], [watchedTenantIds]);
    const selectedGuarantorIds = useMemo(() => watchedGuarantorIds || [], [watchedGuarantorIds]);
    const activeProperties = useMemo(
        () => snapshot.properties.filter((property) => !property.archived),
        [snapshot.properties],
    );
    const selectedPropertyReference = useMemo(
        () => reconcilePropertyReference(watchedPropertyId, snapshot.properties),
        [snapshot.properties, watchedPropertyId],
    );
    const selectedTenantReferences = useMemo(
        () => reconcileTenantReferences(selectedTenantIds, snapshot.tenants),
        [selectedTenantIds, snapshot.tenants],
    );
    const selectedGuarantorReferences = useMemo(
        () => reconcileGuarantorReferences(selectedGuarantorIds, contacts, contactListStatus),
        [contacts, contactListStatus, selectedGuarantorIds],
    );
    const selectedTenants = useMemo(
        () => selectedTenantReferences.flatMap((reference) => reference.record ? [reference.record] : []),
        [selectedTenantReferences],
    );
    const selectedGuarantors = useMemo(
        () => selectedGuarantorReferences.flatMap((reference) => reference.record ? [reference.record] : []),
        [selectedGuarantorReferences],
    );
    const selectedProperty = selectedPropertyReference?.record ?? null;
    const selectedBillingPeriod = watch('LeaseBillingPeriod');
    const editableLeaseDetail = isEditMode && leaseId ? getLeaseDetail(leaseId) : null;
    const persistedLeaseFormData = editableLeaseDetail ? normalizeLeaseFormData(editableLeaseDetail.lease.formData) : null;
    const hasUnsavedContractChanges = Boolean(isEditMode && persistedLeaseFormData && JSON.stringify(values) !== JSON.stringify(persistedLeaseFormData));
    const isSignatureLocked = Boolean(editableLeaseDetail?.lease.signatureProcess);
    const firstBillProrata = values.LeaseFirstBill ? calculateFirstBillProrata(values) : null;
    const isInitialContactLoading = (
        contactListStatus === 'idle'
        || contactListStatus === 'loading'
    ) && contacts.length === 0;
    const isContactListUnavailable =
        contactListStatus === 'error' && contacts.length === 0;
    const contactLoadError =
        contactListError || 'Non è stato possibile caricare i contatti.';

    useEffect(() => {
        const refresh = () => setSnapshot(activeLeaseDataSnapshot());
        refresh();
        return subscribeJsonDb(refresh);
    }, []);

    useEffect(() => {
        if (!isEditMode || !leaseId || !initialValues) return;
        if (editHydratedLeaseIdRef.current === leaseId) return;

        const next = normalizeLeaseFormData(initialValues);
        editHydratedLeaseIdRef.current = leaseId;
        endDateEditedRef.current = true;
        reset(next);
        setActiveTab('general');
    }, [initialValues, isEditMode, leaseId, reset, setActiveTab]);

    useEffect(() => {
        const next = calculateLeasePeriodicAmount(values);
        if (next !== values.LeaseMonthlyAmount) setValue('LeaseMonthlyAmount', next, { shouldDirty: true });
    }, [setValue, values]);

    useEffect(() => {
        if (!values.LeaseFirstBill || values.LeaseFirstBillEndDate) return;
        const proposed = proposeFirstBillEndDate({
            startDate: values.LeaseStartDate,
            leaseEndDate: values.LeaseEndDate,
            billingPeriod: values.LeaseBillingPeriod,
            receiptPeriodDay: values.LeaseReceiptPeriodDay,
        });
        if (proposed) setValue('LeaseFirstBillEndDate', proposed, { shouldDirty: true, shouldValidate: true });
    }, [setValue, values.LeaseBillingPeriod, values.LeaseEndDate, values.LeaseFirstBill, values.LeaseFirstBillEndDate, values.LeaseReceiptPeriodDay, values.LeaseStartDate]);

    const calculateFirstBillAmounts = () => {
        const result = calculateFirstBillProrata(getValues());
        if (!result) return;
        setValue('LeaseFirstBillAmount', result.rentAmount, { shouldDirty: true, shouldValidate: true });
        setValue('LeaseFirstBillCharges', result.chargesAmount, { shouldDirty: true, shouldValidate: true });
    };

    useEffect(() => {
        if (isEditMode) return;
        const selectedType = getLeaseTypeById(values.LeaseType);
        if (!selectedType || !selectedType.durationMonths || !values.LeaseStartDate || endDateEditedRef.current) return;
        const nextEndDate = calculateLeaseEndDate(values.LeaseStartDate, selectedType.durationMonths);
        if (!nextEndDate || nextEndDate === getValues('LeaseEndDate')) return;
        setValue('LeaseEndDate', nextEndDate, { shouldDirty: true, shouldValidate: true });
    }, [getValues, isEditMode, setValue, values.LeaseStartDate, values.LeaseType]);

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
        const startDate = getValues('LeaseStartDate');
        if (selectedType?.durationMonths && startDate && !endDateEditedRef.current) {
            const nextEndDate = calculateLeaseEndDate(startDate, selectedType.durationMonths);
            if (nextEndDate && nextEndDate !== getValues('LeaseEndDate')) {
                setValue('LeaseEndDate', nextEndDate, { shouldDirty: true, shouldValidate: true });
            }
        }
    };

    const addTenantId = (tenantId: string) => {
        const current = getValues('LeaseTenantIds');
        if (!current.includes(tenantId)) setValue('LeaseTenantIds', [...current, tenantId], { shouldDirty: true, shouldValidate: true });
    };

    const removeTenantId = (index: number) => {
        const current = getValues('LeaseTenantIds');
        setValue('LeaseTenantIds', current.filter((_, itemIndex) => itemIndex !== index), { shouldDirty: true, shouldValidate: true });
    };

    const addGuarantorId = (contactId: string) => {
        const current = getValues('LeaseGarantIds');
        if (!current.includes(contactId)) setValue('LeaseGarantIds', [...current, contactId], { shouldDirty: true, shouldValidate: true });
    };

    const removeGuarantorId = (index: number) => {
        const current = getValues('LeaseGarantIds');
        setValue('LeaseGarantIds', current.filter((_, itemIndex) => itemIndex !== index), { shouldDirty: true, shouldValidate: true });
    };

    const onSubmit = form.handleSubmit(async (data) => {
        try {
            const savedLease = isEditMode && leaseId ? updateLease(leaseId, data) : createLease(data);
            if (!isEditMode) {
                await onCreateLeaseCreated?.(savedLease);
                return;
            }
            navigate(isEditMode ? `/leases/${savedLease.id}` : '/leases', {
                state: {
                    toast: { variant: 'success', title: 'Successo', message: isEditMode ? 'La locazione è stata aggiornata.' : 'La locazione è stata creata.' },
                },
            });
        } catch (error) {
            setToast({ variant: 'error', title: 'Errore', message: toastFromError(error) });
        }
    }, (invalid) => {
        const target = firstErrorTarget(invalid);
        if (target) setActiveTab(target.tab);
        setToast({ variant: 'error', title: 'Errore di validazione', message: 'Controlla i campi evidenziati prima di creare la locazione.' });
        if (!target) return;

        window.setTimeout(() => {
            const element = document.querySelector(target.selector) as HTMLElement | null;
            element?.focus();
        }, 0);
    });

    const renderGeneralTab = () => (
        <div className="space-y-8">
            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-lg font-semibold text-gray-800">Proprietà e tipo</h3>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-property">Proprietà *</label>
                    <select
                        id="lease-property"
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
                        {selectedPropertyReference && selectedPropertyReference.status !== 'active' && (
                            <option value={selectedPropertyReference.id}>
                                {selectedPropertyReference.record
                                    ? `${propertyLabel(selectedPropertyReference.record)} — proprietà archiviata`
                                    : `${selectedPropertyReference.id} — proprietà non disponibile`}
                            </option>
                        )}
                        {activeProperties.map((property) => <option key={property.id} value={property.id}>{propertyLabel(property)}</option>)}
                    </select>
                    {errors.PropertyID && <p className={errorClass}>{errors.PropertyID.message}</p>}
                </div>
                {!isEditMode && selectedPropertyReference?.status === 'archived' && (
                    <p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">La proprietà salvata nella bozza è archiviata. Seleziona una proprietà attiva prima di creare la locazione.</p>
                )}
                {!isEditMode && selectedPropertyReference?.status === 'missing' && (
                    <p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">La proprietà salvata nella bozza non è più disponibile. Il riferimento è stato conservato: {selectedPropertyReference.id}.</p>
                )}
                {selectedProperty && (
                    <p className="rounded bg-gray-50 px-3 py-2 text-sm text-gray-600">{propertyLabel(selectedProperty)}</p>
                )}
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-type">Tipo *</label>
                    <select id="lease-type" {...register('LeaseType')} value={watch('LeaseType')} onChange={(event) => handleLeaseTypeChange(event.target.value)} className={inputClass}>
                        <option value="">Seleziona tipo</option>
                        {LEASE_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                    </select>
                    {errors.LeaseType && <p className={errorClass}>{errors.LeaseType.message}</p>}
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Identificativo / Riferimento</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-identifier">Identificativo</label>
                        <input id="lease-identifier" {...register('LeaseIdentificativo')} className={inputClass} />
                        <p className="mt-1 text-xs text-gray-500">Assegna un nome, un numero o un riferimento univoco alla locazione.</p>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-registration-number">Numero registrazione</label>
                        <input id="lease-registration-number" {...register('LeaseNumeroRegistrazione')} className={inputClass} />
                        <p className="mt-1 text-xs text-gray-500">Numero di registrazione del contratto presso l'Agenzia delle Entrate.</p>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Durata</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-start-date">Inizio della locazione *</label>
                        <input id="lease-start-date" type="date" {...register('LeaseStartDate')} className={inputClass} />
                        {errors.LeaseStartDate && <p className={errorClass}>{errors.LeaseStartDate.message}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-end-date">Fine della locazione *</label>
                        <input id="lease-end-date" type="date" {...register('LeaseEndDate', { onChange: () => { endDateEditedRef.current = true; } })} className={inputClass} />
                        {errors.LeaseEndDate && <p className={errorClass}>{errors.LeaseEndDate.message}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-duration-display">Durata del contratto</label>
                        <input id="lease-duration-display" readOnly aria-readonly="true" value={formatLeaseDuration(values.LeaseStartDate, values.LeaseEndDate)} className={`${inputClass} bg-gray-100 text-gray-700`} />
                    </div>
                </div>
                <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Rinnovo</p>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" {...register('LeaseRinnovoTacito', { onChange: () => { renewEditedRef.current = true; } })} className="accent-green-600 focus:ring-green-500" />
                        Rinnova il contratto tacitamente
                    </label>
                    <p className="mt-1 text-xs text-gray-500">Se questa opzione è attivata, i canoni continueranno a essere generati dopo la data di scadenza della locazione.</p>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Pagamento</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-billing-period">Pagamento *</label>
                        <select id="lease-billing-period" {...register('LeaseBillingPeriod')} className={inputClass}>
                            <option value="weekly">Settimanale</option>
                            <option value="biweekly">Bisettimanale</option>
                            <option value="monthly">Mensile</option>
                            <option value="bimonthly">Bimestrale</option>
                            <option value="quarterly">Trimestrale</option>
                            <option value="fourmonthly">Quadrimestrale</option>
                            <option value="semiannual">Semestrale</option>
                            <option value="annual">Annuale</option>
                        </select>
                    </div>
                    <div>
                        <p className="mb-2 text-sm font-medium text-gray-700">Scadenza del pagamento</p>
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                                <input type="radio" value="anticipato" {...register('LeasePaymentTiming')} className="accent-green-600 focus:ring-green-500" />
                                Pagamento anticipato
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                                <input type="radio" value="arretrato" {...register('LeasePaymentTiming')} className="accent-green-600 focus:ring-green-500" />
                                Pagamento in arretrato
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-payment-method">Modalità di pagamento</label>
                        <select id="lease-payment-method" {...register('LeasePaymentMethod')} className={inputClass}>
                            <option value="">Scegli</option>
                            <option value="addebito">Addebito diretto</option>
                            <option value="assegno">Assegno</option>
                            <option value="bonifico">Bonifico</option>
                            <option value="carta">Carta di credito</option>
                            <option value="contanti">Contante</option>
                        </select>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Date delle ricevute</h3>
                {/* TODO: delegare la generazione programmata e gli eventuali avvisi
                    a un servizio backend attivo anche quando l'applicazione è chiusa. */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-payment-day">Data del pagamento</label>
                        {selectedBillingPeriod === 'weekly' || selectedBillingPeriod === 'biweekly' ? (
                            <p className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">Per le periodicità settimanali la data di pagamento deriva dall'inizio o dalla fine del periodo.</p>
                        ) : (
                            <>
                                <select id="lease-payment-day" {...register('LeasePaymentDay', { valueAsNumber: true })} className={inputClass}>
                                    {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}</option>)}
                                </select>
                                {errors.LeasePaymentDay && <p className={errorClass}>{errors.LeasePaymentDay.message}</p>}
                                <p className="mt-1 text-xs text-gray-500">Giorno di pagamento previsto dal contratto. Per le periodicità mensili o plurimensili corrisponde alla data riportata sulla ricevuta.</p>
                            </>
                        )}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-receipt-period-day">Date delle ricevute / Periodicità</label>
                        {selectedBillingPeriod === 'weekly' || selectedBillingPeriod === 'biweekly' ? (
                            <p className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">Per le periodicit&agrave; settimanali i periodi seguono blocchi di 7 o 14 giorni a partire dalla locazione o dalla fine della prima ricevuta.</p>
                        ) : (
                            <>
                                <select id="lease-receipt-period-day" {...register('LeaseReceiptPeriodDay', { valueAsNumber: true })} className={inputClass}>
                                    {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}</option>)}
                                </select>
                                {errors.LeaseReceiptPeriodDay && <p className={errorClass}>{errors.LeaseReceiptPeriodDay.message}</p>}
                                <p className="mt-1 text-xs text-gray-500">Giorno iniziale dei periodi indicati sulle ricevute. Nei mesi più corti viene usato l'ultimo giorno disponibile.</p>
                            </>
                        )}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-payment-create-offset">Generazione di affitto</label>
                        <select id="lease-payment-create-offset" {...register('LeasePaymentCreateOffsetDays', { valueAsNumber: true })} className={inputClass}>
                            {PAYMENT_GENERATION_OFFSETS.map((offset) => <option key={offset} value={offset}>{formatGenerationOffset(offset)}</option>)}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Se scegli G-5, il pagamento sarà generato cinque giorni prima della data della ricevuta. Con G+5 sarà generato cinque giorni dopo.</p>
                        <p className="mt-1 text-xs text-gray-500">Props24 verifica le date di generazione quando il database locale viene aperto o aggiornato. Non esiste ancora un servizio che operi mentre l'applicazione è chiusa.</p>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Affitto</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    {[
                        ['LeaseRentHC', 'Affitto (spese escluse) *', '€', 0, undefined],
                        ['LeaseRentVatPercent', 'IVA canone', '%', 0, 100],
                        ['LeaseMaintenance', 'Spese accessorie', '€', 0, undefined],
                        ['LeaseMaintenanceVatPercent', 'IVA spese accessorie', '%', 0, 100],
                    ].map(([name, label, suffix, min, max]) => (
                        <div key={String(name)}>
                            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={`lease-${String(name)}`}>{String(label)}</label>
                            <div className="flex rounded border border-gray-300 focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-500/30">
                                <input id={`lease-${String(name)}`} type="number" step="0.01" min={Number(min)} max={max === undefined ? undefined : Number(max)} {...register(name as 'LeaseRentHC' | 'LeaseRentVatPercent' | 'LeaseMaintenance' | 'LeaseMaintenanceVatPercent', { valueAsNumber: true })} className="w-full rounded-l px-3 py-2 text-sm focus:outline-none" />
                                <span className="flex items-center rounded-r bg-gray-50 px-3 text-sm text-gray-500">{String(suffix)}</span>
                            </div>
                            {errors[name as 'LeaseRentHC' | 'LeaseRentVatPercent' | 'LeaseMaintenance' | 'LeaseMaintenanceVatPercent'] && <p className={errorClass}>{errors[name as 'LeaseRentHC' | 'LeaseRentVatPercent' | 'LeaseMaintenance' | 'LeaseMaintenanceVatPercent']?.message}</p>}
                        </div>
                    ))}
                </div>
                <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Gestione delle spese accessorie</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                        <label className="flex items-center gap-2 text-sm text-gray-700"><input type="radio" value="anticipo" {...register('LeaseSpeseType')} className="accent-green-600 focus:ring-green-500" /> Anticipo spese affitto</label>
                        <label className="flex items-center gap-2 text-sm text-gray-700"><input type="radio" value="forfait" {...register('LeaseSpeseType')} className="accent-green-600 focus:ring-green-500" /> Spese pagate a forfait</label>
                    </div>
                </div>
                {values.LeaseSpeseType === 'forfait' && (
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-expense-description">Descrizione delle spese</label>
                        <textarea id="lease-expense-description" {...register('LeaseSpeseDescription')} className={inputClass} rows={3} placeholder="Descrivi le spese incluse nel forfait" />
                        <p className="mt-1 text-xs text-gray-500">Questa descrizione può essere riutilizzata nei documenti e nelle ricevute della locazione.</p>
                    </div>
                )}
                <div className="max-w-md">
                    <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-periodic-total">Canone spese incluse</label>
                    <input id="lease-periodic-total" type="number" step="0.01" value={values.LeaseMonthlyAmount || 0} readOnly aria-readonly="true" className={`${inputClass} bg-gray-100`} />
                    <p className="mt-1 text-xs text-gray-500">Totale periodico comprensivo delle IVA e degli elementi aggiuntivi configurati.</p>
                </div>
            </section>

            <section className="space-y-3">
                <div className="flex flex-col gap-3 border-b border-gray-200 pb-2 sm:flex-row sm:items-center sm:justify-between">
                    <div><h3 className="text-base font-semibold text-gray-800">Altre spese</h3><p className="mt-1 text-sm text-gray-500">Altre spese in capo all'inquilino ma anticipate dal locatore. Gli importi vengono aggiunti al totale periodico.</p></div>
                    <button type="button" onClick={() => append({ LeasePaymentItems_Amount: 0, LeasePaymentItems_TaxPercent: 0, LeasePaymentItems_Type: 'charge', LeasePaymentItems_Description: '' })} className="flex shrink-0 items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
                        <Plus className="h-4 w-4" /> Aggiungi un altro elemento
                    </button>
                </div>
                {fields.map((field, index) => (
                    <div key={field.id} className="grid gap-3 rounded border border-gray-200 p-3 md:grid-cols-[120px_120px_160px_1fr_auto]">
                        <div><label className="mb-1 block text-xs font-medium text-gray-700" htmlFor={`payment-item-${index}-amount`}>Ammontare</label><input id={`payment-item-${index}-amount`} type="number" min="0" step="0.01" {...register(`PaymentItems.${index}.LeasePaymentItems_Amount`, { valueAsNumber: true })} className={inputClass} /></div>
                        <div><label className="mb-1 block text-xs font-medium text-gray-700" htmlFor={`payment-item-${index}-vat`}>IVA</label><input id={`payment-item-${index}-vat`} type="number" min="0" max="100" step="0.01" {...register(`PaymentItems.${index}.LeasePaymentItems_TaxPercent`, { valueAsNumber: true })} className={inputClass} /></div>
                        <div><label className="mb-1 block text-xs font-medium text-gray-700" htmlFor={`payment-item-${index}-type`}>Tipo</label><select id={`payment-item-${index}-type`} {...register(`PaymentItems.${index}.LeasePaymentItems_Type`)} className={inputClass}><option value="charge">Spese accessorie</option><option value="rent">Affitto</option></select></div>
                        <div><label className="mb-1 block text-xs font-medium text-gray-700" htmlFor={`payment-item-${index}-description`}>Descrizione</label><input id={`payment-item-${index}-description`} {...register(`PaymentItems.${index}.LeasePaymentItems_Description`)} className={inputClass} /></div>
                        <button type="button" aria-label={`Rimuovi elemento ${index + 1}`} onClick={() => remove(index)} className="self-end rounded p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                ))}
            </section>

            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Prima ricevuta</h3>
                <div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" {...register('LeaseFirstBill')} className="accent-green-600 focus:ring-green-500" />
                        Calcola una prima ricevuta su base pro-rata
                    </label>
                    <p className="mt-1 text-xs text-gray-500">Usa questa opzione quando il primo periodo della locazione è più breve del periodo contrattuale ordinario.</p>
                </div>
                {values.LeaseFirstBill && (
                    <div className="space-y-4 rounded border border-gray-200 p-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-first-bill-end-date">Data di fine periodo</label>
                            <input id="lease-first-bill-end-date" type="date" {...register('LeaseFirstBillEndDate')} className={inputClass} />
                            <p className="mt-1 text-xs text-gray-500">Data di fine periodo per la prima ricevuta.</p>
                            {errors.LeaseFirstBillEndDate && <p className={errorClass}>{errors.LeaseFirstBillEndDate.message}</p>}
                        </div>
                        <button type="button" onClick={calculateFirstBillAmounts} className="inline-flex items-center gap-2 rounded border border-green-600 px-3 py-2 text-sm text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500/40">
                            <Calculator className="h-4 w-4" /> Calcola gli importi
                        </button>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-first-bill-amount">Affitto (spese escluse)</label>
                                <input id="lease-first-bill-amount" type="number" step="0.01" readOnly aria-readonly="true" {...register('LeaseFirstBillAmount', { valueAsNumber: true })} className={`${inputClass} bg-gray-100`} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-first-bill-charges">Spese accessorie</label>
                                <input id="lease-first-bill-charges" type="number" step="0.01" readOnly aria-readonly="true" {...register('LeaseFirstBillCharges', { valueAsNumber: true })} className={`${inputClass} bg-gray-100`} />
                            </div>
                        </div>
                        {firstBillProrata && <p className="text-sm text-gray-600">{firstBillProrata.coveredDays} giorni su {firstBillProrata.standardPeriodDays} — {(firstBillProrata.ratio * 100).toLocaleString('it-IT', { maximumFractionDigits: 2 })}% del periodo ordinario.</p>}
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Deposito cauzionale</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-deposit">Deposito cauzionale</label>
                        <div className="flex rounded border border-gray-300 focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-500/30">
                            <input id="lease-deposit" type="number" step="0.01" min="0" {...register('LeaseDeposit', { valueAsNumber: true })} className="w-full rounded-l px-3 py-2 text-sm focus:outline-none" />
                            <span className="flex items-center rounded-r bg-gray-50 px-3 text-sm text-gray-500">€</span>
                        </div>
                        {errors.LeaseDeposit && <p className={errorClass}>{errors.LeaseDeposit.message}</p>}
                        <p className="mt-1 text-xs text-gray-500">Importo consegnato come garanzia. Il deposito è tenuto separato dai ricavi della locazione.</p>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-deposit-type">Tipo</label>
                        <select id="lease-deposit-type" {...register('LeaseDepositType')} className={inputClass}>
                            <option value="trattenuto">Trattenuto dal locatore</option>
                            <option value="terzi">Deposito presso terzi</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">{values.LeaseDepositType === 'terzi'
                            ? 'Il deposito è custodito da un soggetto terzo e non genera un movimento finanziario nella contabilità del locatore.'
                            : 'Props24 registra il deposito come movimento separato con ruolo contabile “deposito”. Il movimento resta da incassare finché non viene segnato come pagato nella locazione.'}</p>
                    </div>
                    {values.LeaseDepositType === 'terzi' && (
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-deposit-terms">Informazioni sul deposito</label>
                            <textarea id="lease-deposit-terms" {...register('LeaseDepositTerms')} className={inputClass} placeholder="Per esempio: nome dell'ente, conto, numero o riferimento del deposito" rows={3} />
                            <p className="mt-1 text-xs text-gray-500">Indica il soggetto che custodisce il deposito e l'eventuale riferimento utile.</p>
                        </div>
                    )}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-deposit-date">Data del pagamento</label>
                        <input id="lease-deposit-date" type="date" {...register('LeaseDepositDate')} className={inputClass} />
                        {errors.LeaseDepositDate && <p className={errorClass}>{errors.LeaseDepositDate.message}</p>}
                        <p className="mt-1 text-xs text-gray-500">Se non indichi una data, Props24 usa la data di inizio della locazione.</p>
                    </div>
                    <div>
                        <p className="mb-1 block text-sm font-medium text-gray-700">Documento</p>
                        <input type="hidden" {...register('LeaseDepositDocument')} />
                        {/* TODO: collegare il documento del deposito al sistema locale dei
                            documenti della locazione e, in futuro, allo storage backend. */}
                        <button type="button" disabled title="Funzione non ancora implementata" className="inline-flex cursor-not-allowed items-center gap-2 rounded border border-yellow-400 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 opacity-75">
                            <AlertTriangle aria-hidden="true" className="h-4 w-4" /> Aggiungi documento
                        </button>
                        <p className="mt-1 text-xs text-gray-500">Il caricamento del documento sarà completato insieme ai documenti e alla firma della locazione.</p>
                        {values.LeaseDepositDocument.trim() && <p className="mt-1 text-xs text-gray-500">È presente un riferimento documentale legacy.</p>}
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Affitti prepagati o situazione saldo locatario</h3>
                <div className="max-w-xl">
                    <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-prepaid-rent">Ammontare</label>
                    <div className="flex rounded border border-gray-300 focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-500/30">
                        <input id="lease-prepaid-rent" type="number" step="0.01" min="0" {...register('LeasePrepaidRent', { valueAsNumber: true })} className="w-full rounded-l px-3 py-2 text-sm focus:outline-none" />
                        <span className="flex items-center rounded-r bg-gray-50 px-3 text-sm text-gray-500">€</span>
                    </div>
                    {errors.LeasePrepaidRent && <p className={errorClass}>{errors.LeasePrepaidRent.message}</p>}
                    <p className="mt-1 text-xs text-gray-500">Credito già versato dal locatario. L'importo può essere allocato alle rate dalla pagina della locazione.</p>
                    <p className="mt-1 text-xs text-gray-500">Il prepagato non crea un secondo ricavo e non segna automaticamente le rate come pagate.</p>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Aggiornamento del canone</h3>
                <div className="rounded-md border border-gray-200 p-4">
                    <p className="mb-3 text-sm font-medium text-gray-700">Aggiornamento del canone secondo</p>
                    <div className="space-y-2">
                        {[
                            ['nessuno', 'Non rivedere il canone'],
                            ['indice', 'Indice di riferimento di affitto'],
                            ['percentuale', 'Una percentuale concordata in aumento'],
                        ].map(([value, label]) => (
                            <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                                <input type="radio" value={value} {...register('LeaseUpdateType')} className="accent-green-600 focus:ring-green-500" />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>

                {values.LeaseUpdateType === 'percentuale' && (
                    <div className="max-w-sm">
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-update-percent">Percentuale</label>
                        <div className="relative">
                            <input id="lease-update-percent" type="number" step="0.01" min="0" max="30" {...register('LeaseUpdatePercent', { valueAsNumber: true })} className={`${inputClass} pr-8`} />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">%</span>
                        </div>
                        {errors.LeaseUpdatePercent && <p className={errorClass}>{errors.LeaseUpdatePercent.message}</p>}
                    </div>
                )}

                {values.LeaseUpdateType === 'indice' && (
                    <div className="max-w-xl">
                        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-update-index">Indice di riferimento</label>
                        <select id="lease-update-index" {...register('LeaseUpdateIndex')} className={inputClass}>
                            {values.LeaseUpdateIndex && !ISTAT_INDEX_OPTIONS.some((option) => option.value === values.LeaseUpdateIndex) && (
                                <option value={values.LeaseUpdateIndex}>{values.LeaseUpdateIndex} — valore salvato</option>
                            )}
                            {ISTAT_INDEX_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        {errors.LeaseUpdateIndex && <p className={errorClass}>{errors.LeaseUpdateIndex.message}</p>}
                        <p className="mt-1 text-xs text-gray-500">Snapshot locale degli indici ISTAT. L'aggiornamento automatico dei valori sarà collegato in futuro a un servizio dedicato.</p>
                    </div>
                )}

                {values.LeaseUpdateType !== 'nessuno' && (
                    <div className="space-y-4 rounded-md border border-gray-200 p-4">
                        <div>
                            <p className="mb-2 text-sm font-medium text-gray-700">Aggiornamento automatico</p>
                            {/* TODO: applicare realmente la revisione del canone e inviare le
                                notifiche tramite backend dopo una verifica e conferma del locatore. */}
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" {...register('LeaseUpdateAuto')} className="accent-green-600 focus:ring-green-500" />
                                Attiva aggiornamento automatico
                            </label>
                            <p className="mt-2 text-xs text-gray-500">Se attivi questa opzione, Props24 conserverà la configurazione per l'aggiornamento alla ricorrenza prevista. L'applicazione automatica del nuovo importo e l'invio delle email richiedono ancora un servizio backend.</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-update-amount-type">Aggiornamento su</label>
                                <select id="lease-update-amount-type" {...register('LeaseUpdateAmountType')} className={inputClass}>
                                    <option value="rent_excluding_charges">Affitto (spese escluse)</option>
                                    <option value="rent_including_charges">Canone spese incluse</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-update-years">Periodo</label>
                                <select id="lease-update-years" {...register('LeaseUpdateYears', { valueAsNumber: true })} className={inputClass}>
                                    <option value={1}>1 anno</option>
                                    <option value={2}>2 anni</option>
                                    <option value={3}>3 anni</option>
                                </select>
                                <p className="mt-1 text-xs text-gray-500">Periodo di revisione dell'affitto.</p>
                            </div>
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-medium text-gray-700">Data di aggiornamento</p>
                            <div className="space-y-2">
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                                    <input type="radio" value="anniversario" {...register('LeaseUpdateDateType')} className="accent-green-600 focus:ring-green-500" />
                                    Aggiornamento alla data di anniversario del contratto
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                                    <input type="radio" value="specifica" {...register('LeaseUpdateDateType')} className="accent-green-600 focus:ring-green-500" />
                                    Aggiornamento a una data specifica
                                </label>
                            </div>
                        </div>

                        {values.LeaseUpdateDateType === 'specifica' && (
                            <div className="max-w-sm">
                                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-update-specific-date">Data</label>
                                <input id="lease-update-specific-date" type="date" {...register('LeaseUpdateDateSpecific')} className={inputClass} />
                                {errors.LeaseUpdateDateSpecific && <p className={errorClass}>{errors.LeaseUpdateDateSpecific.message}</p>}
                            </div>
                        )}
                    </div>
                )}
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
                <button id="lease-tenant-selector" type="button" onClick={() => setTenantModalOpen(true)} className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                    <UserPlus className="h-4 w-4" /> Aggiungi inquilino
                </button>
            </div>
            {errors.LeaseTenantIds && <p className={errorClass}>{errors.LeaseTenantIds.message}</p>}
            {selectedTenantIds.length === 0 ? (
                <div className="rounded border border-dashed border-gray-300 bg-gray-50 py-10 text-center text-sm text-gray-500">Nessun inquilino aggiunto.</div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {selectedTenantReferences.map((reference) => (
                        <div key={`${reference.id}-${reference.index}`} className="flex items-center justify-between rounded border border-gray-200 bg-white p-4">
                            <div>
                                <p className="font-medium text-gray-800">{reference.record ? tenantName(reference.record) : 'Inquilino non disponibile'}</p>
                                {reference.record ? (
                                    <p className="text-sm text-gray-500">{reference.record.email || 'Nessuna email'} {reference.record.mobilePhone || reference.record.phone ? `- ${reference.record.mobilePhone || reference.record.phone}` : ''}{reference.status === 'archived' ? ' - archiviato' : ''}</p>
                                ) : (
                                    <p className="text-sm text-amber-700">Riferimento conservato: {reference.id}</p>
                                )}
                            </div>
                            <button type="button" aria-label={`Rimuovi riferimento inquilino ${reference.index + 1}`} onClick={() => removeTenantId(reference.index)} className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
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
                <button id="lease-guarantor-selector" type="button" onClick={() => setGuarantorModalOpen(true)} className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                    <UserPlus className="h-4 w-4" /> Aggiungi garante
                </button>
            </div>
            {errors.LeaseGarantIds && <p className={errorClass}>{errors.LeaseGarantIds.message}</p>}
            {contactListStatus === 'error' && (contacts.length > 0 || selectedGuarantorIds.length > 0) && (
                <div className="flex items-center justify-between gap-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                    <span>{contactLoadError}</span>
                    <button type="button" onClick={() => void refreshContacts()} className="rounded border border-amber-400 px-3 py-1 font-medium hover:bg-amber-100">Riprova</button>
                </div>
            )}
            {isInitialContactLoading && selectedGuarantorIds.length === 0 ? (
                <div className="rounded border border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-500">Caricamento dei garanti...</div>
            ) : isContactListUnavailable && selectedGuarantorIds.length === 0 ? (
                <div className="space-y-3 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                    <p>{contactLoadError}</p>
                    <button type="button" onClick={() => void refreshContacts()} className="rounded border border-red-400 px-3 py-1 font-medium hover:bg-red-100">Riprova</button>
                </div>
            ) : selectedGuarantorIds.length === 0 ? (
                <div className="rounded border border-dashed border-gray-300 bg-gray-50 py-10 text-center text-sm text-gray-500">Nessun garante aggiunto.</div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {selectedGuarantorReferences.map((reference) => (
                        <div key={`${reference.id}-${reference.index}`} className="flex items-center justify-between rounded border border-gray-200 bg-white p-4">
                            <div>
                                <p className="font-medium text-gray-800">{reference.record
                                    ? (reference.record.type === 'company' ? reference.record.companyName : `${reference.record.firstName} ${reference.record.lastName}`.trim())
                                    : reference.status === 'pending' ? 'Verifica del garante in corso'
                                        : reference.status === 'unverified' ? 'Garante non verificabile'
                                            : 'Garante non disponibile'}</p>
                                {reference.record ? (
                                    <p className="text-sm text-gray-500">{reference.record.email || reference.record.phone || 'Nessun contatto'}{reference.status === 'archived' ? ' - archiviato' : ''}</p>
                                ) : reference.status === 'unverified' ? (
                                    <p className="text-sm text-amber-700">Il caricamento dei contatti non è riuscito. Il riferimento {reference.id} è stato conservato.</p>
                                ) : (
                                    <p className="text-sm text-amber-700">Riferimento conservato: {reference.id}</p>
                                )}
                            </div>
                            <button type="button" aria-label={`Rimuovi riferimento garante ${reference.index + 1}`} onClick={() => removeGuarantorId(reference.index)} className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <AddGuarantorModal isOpen={guarantorModalOpen} onClose={() => setGuarantorModalOpen(false)} onGuarantorAdded={addGuarantorId} onError={(message) => setToast({ variant: 'error', title: 'Garante', message })} existingGuarantorIds={selectedGuarantorIds} linkedGuarantorIds={selectedGuarantorIds} contacts={contacts} contactListStatus={contactListStatus} contactListError={contactListError} onRefreshContacts={refreshContacts} />
        </div>
    );

    const renderReceiptsTab = () => (
        <div className="space-y-8">
            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Indirizzo ricevute</h3>
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" {...register('LeaseReceiptUseAlternateAddress')} className="accent-green-600 focus:ring-green-500" /> Usa un indirizzo diverso da quello della proprietà locata</label>
                <p className="text-xs text-gray-500">Quando l'opzione è disattivata, la ricevuta utilizza come riferimento l'indirizzo della proprietà selezionata.</p>
                {values.LeaseReceiptUseAlternateAddress && <div><label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="receipt-alternate-address">Indirizzo alternativo</label><textarea id="receipt-alternate-address" rows={4} maxLength={1000} placeholder="Via, numero civico, CAP, città e ulteriori indicazioni" {...register('LeaseReceiptAlternateAddress')} className={inputClass} />{errors.LeaseReceiptAlternateAddress && <p className={errorClass}>{errors.LeaseReceiptAlternateAddress.message}</p>}</div>}
            </section>
            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Ricevuta</h3>
                {/* TODO: collegare questa configurazione al generatore di ricevute,
                    alla numerazione persistente e agli eventuali servizi SDI/PEC. */}
                <p className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">Queste impostazioni vengono salvate nella locazione. La generazione di fatture, ricevute numerate, file elettronici e invii richiede ancora un servizio documentale dedicato.</p>
                <div className="grid gap-4 md:grid-cols-2">
                    <div><label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-receipt-document-title">Titolo del documento</label><select id="lease-receipt-document-title" {...register('LeaseReceiptDocumentTitle')} className={inputClass}><option value="">Scegli</option><option value="fattura">Fattura</option><option value="ricevuta">Ricevuta</option></select><p className="mt-1 text-xs text-gray-500">Definisce il titolo che sarà utilizzato dai futuri documenti generati per la locazione.</p></div>
                    <div><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" {...register('LeaseReceiptAutoNumbering')} className="accent-green-600 focus:ring-green-500" /> Attiva la numerazione automatica</label><p className="mt-1 text-xs text-gray-500">La configurazione viene salvata, ma i numeri non vengono ancora assegnati automaticamente.</p></div>
                </div>
                {values.LeaseReceiptAutoNumbering && <div className="grid gap-4 md:grid-cols-2"><div><label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-receipt-numbering-prefix">Prefisso e formato del numero</label><input id="lease-receipt-numbering-prefix" maxLength={80} placeholder="Esempio: RIC-AAAA-NNNN" {...register('LeaseReceiptNumberingPrefix')} className={inputClass} /><p className="mt-1 text-xs text-gray-500">Puoi preparare un prefisso o un formato, ma la sostituzione dei segnaposto sarà implementata insieme al generatore dei documenti.</p></div><div><p className="mb-2 text-sm font-medium text-gray-700">Ambito della numerazione</p><label className="mb-2 flex items-center gap-2 text-sm"><input type="radio" value="lease" {...register('LeaseReceiptNumberingScope')} /> Numerazione separata per questa locazione</label><label className="flex items-center gap-2 text-sm"><input type="radio" value="landlord" {...register('LeaseReceiptNumberingScope')} /> Numerazione condivisa per il locatore</label><p className="mt-1 text-xs text-gray-500">L'ambito viene memorizzato come configurazione; nessun contatore viene ancora creato.</p></div></div>}
                {values.LeaseReceiptDocumentTitle === 'fattura' && <div className="grid gap-4 rounded border border-gray-200 p-4 md:grid-cols-2"><div><label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-receipt-sdi-code">Codice SDI</label><input id="lease-receipt-sdi-code" maxLength={7} autoCapitalize="characters" {...register('LeaseReceiptSdiCode', { onChange: (event) => setValue('LeaseReceiptSdiCode', event.target.value.toUpperCase(), { shouldDirty: true, shouldValidate: true }) })} className={inputClass} /><p className="mt-1 text-xs text-gray-500">Codice destinatario di 7 caratteri. Per invio tramite PEC può essere utilizzato 0000000.</p>{errors.LeaseReceiptSdiCode && <p className={errorClass}>{errors.LeaseReceiptSdiCode.message}</p>}</div><div><label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lease-receipt-pec-email">PEC</label><input id="lease-receipt-pec-email" type="email" maxLength={254} {...register('LeaseReceiptPecEmail')} className={inputClass} /><p className="mt-1 text-xs text-gray-500">Indirizzo PEC del destinatario della futura fattura elettronica.</p>{errors.LeaseReceiptPecEmail && <p className={errorClass}>{errors.LeaseReceiptPecEmail.message}</p>}</div><p className="text-xs text-gray-500 md:col-span-2">Props24 non invia ancora fatture al Sistema di Interscambio e non spedisce messaggi PEC.</p></div>}
            </section>
            <section className="space-y-3"><h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Testo per la ricevuta</h3><label className="block text-sm font-medium text-gray-700" htmlFor="lease-receipt-footer-text">Testo</label><textarea id="lease-receipt-footer-text" rows={5} maxLength={4000} {...register('LeaseReceiptFooterText')} className={inputClass} /><p className="text-xs text-gray-500">Testo da mostrare automaticamente in fondo alla futura ricevuta, per esempio termini o istruzioni di pagamento.</p><p className="text-right text-xs text-gray-500">{values.LeaseReceiptFooterText.length} / 4000</p></section>
            <section className="space-y-3"><h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Testo per l'avviso di scadenza</h3><label className="block text-sm font-medium text-gray-700" htmlFor="lease-due-notice-text">Testo</label><textarea id="lease-due-notice-text" rows={5} maxLength={4000} {...register('LeaseDueNoticeText')} className={inputClass} /><p className="text-xs text-gray-500">Testo da utilizzare in futuro nell'avviso di scadenza, per esempio termini o istruzioni di pagamento.</p><p className="text-right text-xs text-gray-500">{values.LeaseDueNoticeText.length} / 4000</p></section>
        </div>
    );

    const renderSettingsTab = () => (
        <div className="space-y-8">
            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Riporto del saldo</h3>
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700"><input type="radio" value="manuale" {...register('LeaseBalanceCarryMode')} className="accent-green-600 focus:ring-green-500" /> Manuale</label>
                    <label className="flex items-center gap-2 text-sm text-gray-700"><input type="radio" value="automatico" {...register('LeaseBalanceCarryMode')} className="accent-green-600 focus:ring-green-500" /> Automatico</label>
                </div>
                <p className="text-sm text-gray-500">Il saldo del locatario viene gestito manualmente attraverso le operazioni finanziarie della locazione.</p>
                {values.LeaseBalanceCarryMode === 'automatico' && <>{/* TODO: applicare il riporto automatico del saldo soltanto dopo aver
                    definito pagamenti parziali, crediti, debiti e riconciliazione contabile. */}<p className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">La preferenza viene salvata, ma Props24 non modifica ancora automaticamente l'importo della rata successiva in base al saldo del locatario.</p></>}
            </section>
            <section className="space-y-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Notifiche</h3>
                {/* TODO: collegare le preferenze di notifica a un servizio backend
                    con consenso, destinatari verificati, log degli invii e gestione errori. */}
                <p className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">Le preferenze vengono salvate nella locazione, ma non esiste ancora un servizio che invii email, notifiche push o messaggi automatici.</p>
                {[
                    ['LeaseNotifyLandlordRentAvailable', "Notificami quando l'affitto e l'avviso di scadenza sono disponibili", "Preferenza futura per il proprietario o gestore collegato all'account."],
                    ['LeaseNotifyTenantRentAvailable', "Notifica gli inquilini quando l'affitto e l'avviso di scadenza sono disponibili", 'Nessun messaggio viene inviato finché non sarà disponibile il servizio di notifica.'],
                    ['LeaseNotifyLandlordLeaseEnd', 'Notificami 6 e 3 mesi prima della fine del contratto', 'La tempistica viene conservata come descrizione della preferenza; non viene ancora pianificato alcun promemoria.'],
                    ['LeaseNotifyTenantLeaseEnd', 'Notifica gli inquilini 3 mesi prima della fine del contratto', ''],
                    ['LeaseNotifyTenantLateRent', 'Notifica gli inquilini in caso di ritardo nel pagamento', 'La futura notifica sarà prevista 8 giorni dopo la data di scadenza. Al momento non viene inviato alcun sollecito.'],
                ].map(([field, label, help]) => <div key={field} className="rounded border border-gray-200 p-3"><label className="flex items-start gap-2 text-sm text-gray-700"><input type="checkbox" {...register(field as 'LeaseNotifyLandlordRentAvailable' | 'LeaseNotifyTenantRentAvailable' | 'LeaseNotifyLandlordLeaseEnd' | 'LeaseNotifyTenantLeaseEnd' | 'LeaseNotifyTenantLateRent')} className="mt-0.5 accent-green-600 focus:ring-green-500" /> {label}</label>{help && <p className="ml-6 mt-1 text-xs text-gray-500">{help}</p>}</div>)}
            </section>
            <section className="space-y-4"><h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Storico dei pagamenti</h3><div className="flex gap-3 rounded border border-blue-200 bg-blue-50 p-4"><Info aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-700" /><div className="space-y-2 text-sm text-blue-900"><p>Props24 genera e riconcilia automaticamente le rate della locazione in base a date, periodicità, prima ricevuta e anticipo di generazione configurati.</p><p>La verifica avviene quando il database locale viene aperto o aggiornato. Non esiste un processo attivo mentre l'applicazione è chiusa.</p><p>I pagamenti già incassati, manuali o protetti dalla cronologia finanziaria non vengono sostituiti automaticamente.</p></div></div></section>
            <section className="space-y-4"><h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">Attivazione della locazione</h3><div className="flex gap-3 rounded border border-blue-200 bg-blue-50 p-4"><Info aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-700" /><p className="text-sm text-blue-900">{isEditMode ? 'Lo stato della locazione non viene modificato da questo form. Usa le azioni Attiva, Disattiva o Termina disponibili nella pagina della locazione.' : 'La locazione sarà creata nello stato attivo. Lo stato potrà essere modificato successivamente dalle azioni della locazione.'}</p></div></section>
        </div>
    );

    const renderInsuranceTab = () => {
        const contracts = values.LeaseInsuranceContracts || [];
        const usedTypes = new Set(contracts.map((contract) => contract.LeaseInsuranceType));
        const firstUnusedType = !usedTypes.has('locativa') ? 'locativa' : !usedTypes.has('affitti_non_pagati') ? 'affitti_non_pagati' : null;
        return <div className="space-y-6">
            <div className="flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-lg font-semibold text-gray-800">Assicurazioni</h3><p className="mt-1 text-sm text-gray-500">Puoi configurare una copertura locativa e una copertura contro gli affitti non pagati.</p></div>{firstUnusedType && <button type="button" onClick={() => insuranceFieldArray.append({ LeaseInsuranceType: firstUnusedType, LeaseInsuranceDescription: '', LeaseInsuranceStartDate: '', LeaseInsuranceEndDate: '', LeaseInsuranceDocumentId: '' })} className="inline-flex shrink-0 items-center gap-2 rounded border border-green-600 px-3 py-2 text-sm text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/40"><ShieldCheck aria-hidden="true" className="h-4 w-4" /> Aggiungi assicurazione</button>}</div>
            {/* TODO: collegare ogni assicurazione a un DocumentRecord della
                locazione dopo il salvataggio o durante la modifica. */}
            <p className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">Le informazioni assicurative vengono salvate nella locazione. Il collegamento dei file sarà completato nella scheda Documenti.</p>
            {insuranceFieldArray.fields.length === 0 && <p className="rounded border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">Nessuna assicurazione configurata.</p>}
            {insuranceFieldArray.fields.map((field, index) => {
                const current = contracts[index];
                const itemErrors = errors.LeaseInsuranceContracts?.[index];
                return <div key={field.id} className="space-y-4 rounded border border-gray-200 p-4">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2 font-medium text-gray-800"><ShieldCheck aria-hidden="true" className="h-5 w-5 text-green-700" /> Assicurazione {index + 1}</div><button type="button" aria-label={`Rimuovi assicurazione ${index + 1}`} onClick={() => insuranceFieldArray.remove(index)} className="rounded p-2 text-red-600 hover:bg-red-50"><Trash2 aria-hidden="true" className="h-4 w-4" /></button></div>
                    <div><label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={`lease-insurance-${index}-type`}>Tipo *</label><select id={`lease-insurance-${index}-type`} {...register(`LeaseInsuranceContracts.${index}.LeaseInsuranceType`)} className={inputClass}><option value="locativa" disabled={current?.LeaseInsuranceType !== 'locativa' && usedTypes.has('locativa')}>Assicurazione locativa</option><option value="affitti_non_pagati" disabled={current?.LeaseInsuranceType !== 'affitti_non_pagati' && usedTypes.has('affitti_non_pagati')}>Assicurazione affitti non pagati</option></select>{itemErrors?.LeaseInsuranceType && <p className={errorClass}>{itemErrors.LeaseInsuranceType.message}</p>}</div>
                    <div><label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={`lease-insurance-${index}-description`}>Descrizione *</label><textarea id={`lease-insurance-${index}-description`} rows={4} maxLength={2000} placeholder="Descrizione, compagnia, numero polizza, durata e altre informazioni" {...register(`LeaseInsuranceContracts.${index}.LeaseInsuranceDescription`)} className={inputClass} /><p className="text-right text-xs text-gray-500">{current?.LeaseInsuranceDescription?.length || 0} / 2000</p>{itemErrors?.LeaseInsuranceDescription && <p className={errorClass}>{itemErrors.LeaseInsuranceDescription.message}</p>}</div>
                    <div className="grid gap-4 md:grid-cols-2"><div><label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={`lease-insurance-${index}-start-date`}>Effettuato in data</label><input id={`lease-insurance-${index}-start-date`} type="date" {...register(`LeaseInsuranceContracts.${index}.LeaseInsuranceStartDate`)} className={inputClass} />{itemErrors?.LeaseInsuranceStartDate && <p className={errorClass}>{itemErrors.LeaseInsuranceStartDate.message}</p>}</div><div><label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={`lease-insurance-${index}-end-date`}>Data scadenza</label><input id={`lease-insurance-${index}-end-date`} type="date" {...register(`LeaseInsuranceContracts.${index}.LeaseInsuranceEndDate`)} className={inputClass} />{itemErrors?.LeaseInsuranceEndDate && <p className={errorClass}>{itemErrors.LeaseInsuranceEndDate.message}</p>}</div></div>
                    <div><label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={`lease-insurance-${index}-document`}>Documento collegato</label>{isEditMode && editableLeaseDetail ? <><select id={`lease-insurance-${index}-document`} {...register(`LeaseInsuranceContracts.${index}.LeaseInsuranceDocumentId`)} className={inputClass}><option value="">Nessun documento</option>{current?.LeaseInsuranceDocumentId && !editableLeaseDetail.documents.some((document) => document.id === current.LeaseInsuranceDocumentId) && <option value={current.LeaseInsuranceDocumentId}>Riferimento documentale legacy</option>}{editableLeaseDetail.documents.map((document) => <option key={document.id} value={document.id}>{document.title || document.categoryLabel} — {document.categoryLabel}</option>)}</select>{current?.LeaseInsuranceDocumentId && !editableLeaseDetail.documents.some((document) => document.id === current.LeaseInsuranceDocumentId) && <p className="mt-1 text-xs text-gray-500">Il riferimento legacy non corrisponde ancora a un documento locale. Puoi conservarlo oppure selezionare un documento della locazione.</p>}<button type="button" onClick={() => setActiveTab('documents')} className="mt-2 inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/40"><Paperclip aria-hidden="true" className="h-4 w-4" /> Gestisci documenti</button>{editableLeaseDetail.documents.length === 0 && <p className="mt-1 text-xs text-gray-500">Nessun documento della locazione disponibile. Usa “Gestisci documenti” per aggiungerne uno.</p>}<p className="mt-1 text-xs text-gray-500">Il collegamento all'assicurazione viene salvato insieme alle modifiche della locazione.</p></> : <><input type="hidden" {...register(`LeaseInsuranceContracts.${index}.LeaseInsuranceDocumentId`)} /><select id={`lease-insurance-${index}-document`} disabled className={`${inputClass} bg-gray-100`}><option>I documenti saranno collegabili dopo il primo salvataggio della locazione.</option></select>{current?.LeaseInsuranceDocumentId?.trim() && <p className="mt-1 text-xs text-gray-500">È presente un riferimento documentale legacy.</p>}</>}</div>
                </div>;
            })}
        </div>;
    };

    const renderDocumentsTab = () => {
        if (!isEditMode) return <section className="space-y-4"><h3 className="border-b border-gray-200 pb-2 text-lg font-semibold text-gray-800">Documenti della locazione</h3>{/* TODO: valutare in futuro un flusso transazionale di creazione
            locazione e documenti senza duplicare file nella bozza. */}<div className="rounded border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900"><p>Crea prima la locazione per poter caricare o collegare documenti. I file vengono salvati come record separati e non vengono inseriti nella bozza del form.</p><p className="mt-2">Dopo la creazione potrai aprire la locazione e usare Nuovo documento oppure Collega esistente.</p></div></section>;
        if (!editableLeaseDetail) return <p className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">La locazione non è più disponibile. Torna all'elenco e riapri il record.</p>;
        return <LeaseDocumentsTab detail={editableLeaseDetail} notify={(variant, message) => setToast({ variant, title: variant === 'success' ? 'Documenti' : 'Errore documenti', message })} />;
    };

    const renderUnsavedContractSummary = (mode: 'create' | 'dirty-edit') => {
        const type = getLeaseTypeById(values.LeaseType);
        const propertyAddress = selectedProperty
            ? [selectedProperty.formData.PropertyAddress, selectedProperty.formData.PropertyPostalCode, selectedProperty.formData.PropertyCity]
                .filter((part) => typeof part === 'string' && part.trim())
                .join(', ')
            : '';
        const rows = [
            ['Identificativo', previewText(values.LeaseIdentificativo)], ['Numero registrazione', previewText(values.LeaseNumeroRegistrazione)], ['Tipo di locazione', type?.label || '—'],
            ['Proprietà', selectedProperty ? previewText(selectedProperty.formData.PropertyTitle) : '—'], ['Indirizzo', previewText(propertyAddress)], ['Inquilini', selectedTenants.map(tenantName).join(', ') || 'Nessuno'], ['Garanti', selectedGuarantors.map((item) => item.type === 'company' ? item.companyName : `${item.firstName} ${item.lastName}`.trim()).join(', ') || 'Nessuno'],
            ['Data iniziale', previewDate(values.LeaseStartDate)], ['Data finale', previewDate(values.LeaseEndDate)], ['Rinnovo tacito', values.LeaseRinnovoTacito ? 'Sì' : 'No'], ['Periodicità', previewBillingPeriod(values.LeaseBillingPeriod)],
            ['Canone escluso spese', previewMoney(values.LeaseRentHC)], ['IVA canone', previewPercent(values.LeaseRentVatPercent)], ['Spese accessorie', previewMoney(values.LeaseMaintenance)], ['IVA spese', previewPercent(values.LeaseMaintenanceVatPercent)], ['Totale periodico', previewMoney(values.LeaseMonthlyAmount)], ['Deposito', previewMoney(values.LeaseDeposit)], ['Affitto prepagato', previewMoney(values.LeasePrepaidRent)],
            ['Assicurazioni', values.LeaseInsuranceContracts.length ? `${values.LeaseInsuranceContracts.length} ${values.LeaseInsuranceContracts.length === 1 ? 'assicurazione configurata' : 'assicurazioni configurate'}` : 'Nessuna assicurazione'],
        ];
        return <section className="space-y-4"><h3 className="border-b border-gray-200 pb-2 text-lg font-semibold">{mode === 'create' ? 'Riepilogo della nuova locazione' : 'Riepilogo delle modifiche non salvate'}</h3><p className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">{mode === 'create' ? 'Questo è un riepilogo dei dati attualmente presenti nel form. Il contratto operativo, il download, la stampa e lo snapshot saranno disponibili dopo la creazione della locazione.' : 'Il riepilogo mostra i valori correnti del form, ma il contratto operativo continua a utilizzare i dati salvati. Salva le modifiche prima di generare, stampare o firmare il contratto.'}</p><dl className="grid gap-3 md:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="rounded border p-3"><dt className="text-xs font-medium text-gray-500">{label}</dt><dd className="mt-1 text-sm text-gray-900">{value}</dd></div>)}</dl></section>;
    };

    const unavailable = <p className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">La locazione non è più disponibile. Torna all'elenco e riapri il record.</p>;
    const renderContractTab = () => !isEditMode ? renderUnsavedContractSummary('create') : hasUnsavedContractChanges ? renderUnsavedContractSummary('dirty-edit') : !editableLeaseDetail ? unavailable : <LeaseContractTab detail={editableLeaseDetail} notify={(variant, message) => setToast({ variant, title: variant === 'success' ? 'Contratto' : 'Errore contratto', message })} />;
    const renderSignatureTab = () => !isEditMode ? <section className="space-y-3"><h3 className="border-b pb-2 text-lg font-semibold">Firma locale</h3><p className="rounded border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">Crea prima la locazione per poter generare lo snapshot del contratto e avviare la procedura di firma locale.<br />Le firme vengono salvate nel database locale del browser e non costituiscono una firma elettronica qualificata.</p></section> : hasUnsavedContractChanges ? <p className="rounded border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">Salva prima le modifiche della locazione. La firma deve utilizzare uno snapshot corrispondente ai dati contrattuali persistiti.</p> : !editableLeaseDetail ? unavailable : <LeaseSignatureTab detail={editableLeaseDetail} notify={(variant, message) => setToast({ variant, title: variant === 'success' ? 'Firma' : 'Errore firma', message })} />;

    const renderActiveTab = () => {
        if (activeTab === 'tenants') return renderTenantsTab();
        if (activeTab === 'guarantors') return renderGuarantorsTab();
        if (activeTab === 'receipts') return renderReceiptsTab();
        if (activeTab === 'settings') return renderSettingsTab();
        if (activeTab === 'insurance') return renderInsuranceTab();
        if (activeTab === 'documents') return renderDocumentsTab();
        if (activeTab === 'contract') return renderContractTab();
        if (activeTab === 'signature') return renderSignatureTab();
        return renderGeneralTab();
    };

    return (
        <>
            <form onSubmit={onSubmit}>
                <LeaseTabs activeTab={activeTab} onTabChange={(tabId) => setActiveTab(normalizeLeaseFormTab(tabId))}>
                    {/* Il rendering delle schede legge ref di dominio solo per calcoli sincroni già esistenti. */}
                    {/* eslint-disable-next-line react-hooks/refs */}
                    {renderActiveTab()}
                </LeaseTabs>

                <div className="mt-8 flex flex-col gap-4 border-t border-gray-200 pt-6 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-gray-500">
                        {isEditMode ? 'Modifica locazione' : draft?.isSavingDraft ? 'Salvataggio bozza...' : draft?.draftError ? (
                            <span role="alert" className="text-red-700">{draft.draftError}</span>
                        ) : draft?.draftSuccess || 'Bozza non ancora salvata'}
                    </div>
                    <div className="flex justify-end gap-3">
                        {isSignatureLocked && <p className="max-w-md text-xs text-amber-700">La procedura di firma locale blocca il salvataggio delle condizioni contrattuali. Puoi annullarla dalla scheda Firma.</p>}
                        <Link to="/leases" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Annulla</Link>
                        {!isEditMode && (
                            <button type="button" disabled={draft?.isSavingDraft || draft?.isDeletingDraft || isSubmitting} onClick={() => { void draft?.saveDraft().catch(() => undefined); }} className="flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                                <Save className="h-4 w-4" /> Salva bozza
                            </button>
                        )}
                        <button type="submit" disabled={isSubmitting || draft?.isSavingDraft || draft?.isDeletingDraft || (isEditMode && isSignatureLocked)} title={isSignatureLocked ? 'Annulla la procedura di firma prima di modificare il contratto.' : undefined} className="rounded bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
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
