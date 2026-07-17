import { generateId, getJsonDb, saveJsonDb } from './jsonDb';
import type { LeaseRecord, LocalDatabase, TenantRecord } from './database.types';
import type { LeaseDetail } from '../types/leaseDetail';
import { assertNoTenantLeaseConflicts, findTenantLeaseConflicts } from './businessRules';
import { classifyLease, todayIso } from './dataSelectors';
import { assertGeneratedLeasePaymentSchedule, buildLeasePaymentSchedule, ensureLeaseDepositPayment } from './paymentRepository';
import { getLeaseTypeById, leaseTypeLabel, normalizeLeaseTypeId } from '../landlord/leases/data/leaseTypes';
import { leaseFormSchema, normalizeLeaseFormData, type LeaseFormData } from '../landlord/leases/schema/leaseFormSchema';
import {
    LeaseInvalidDateRangeError,
    LeaseArchivedError,
    LeaseDeleteBlockedError,
    LeaseInvalidStatusTransitionError,
    LeaseLockedBySignatureError,
    LeaseNotFoundError,
    LeasePaymentHistoryConflictError,
    LeasePropertyNotFoundError,
    LeaseStorageError,
    LeaseTenantNotFoundError,
    LeaseTypeNotFoundError,
} from './databaseErrors';

export type LeaseInput = LeaseFormData | Partial<LeaseFormData>;

export interface LeaseListItem {
    id: string;
    propertyId: string;
    propertyTitle: string;
    propertyAddress: string;
    tenantIds: string[];
    tenantName: string;
    tenantEmail: string | null;
    leaseTypeValue: string;
    leaseTypeLabel: string;
    periodicAmount: number;
    monthlyAmount: number;
    rentHC: number;
    maintenance: number;
    securityDeposit: number;
    balance: number;
    startDate: string;
    endDate: string;
    temporalStatus: 'current' | 'future' | 'historical' | 'inactive' | 'archived';
    archived: boolean;
    identificativo: string | null;
    numeroRegistrazione: string | null;
    notes: string;
}

function tenantName(tenant: TenantRecord | undefined): string {
    if (!tenant) return 'Inquilino';
    return tenant.type === 'company'
        ? tenant.companyName || 'Società'
        : `${tenant.firstName} ${tenant.lastName}`.replace(/\s+/g, ' ').trim() || 'Inquilino';
}

function propertyAddress(formData: LocalDatabase['properties'][number]['formData']): string {
    return [formData.PropertyAddress, formData.PropertyPostalCode, formData.PropertyCity].filter(Boolean).join(', ');
}

export function rebuildLeaseRelations(database: LocalDatabase): LocalDatabase {
    const db: LocalDatabase = {
        ...database,
        properties: database.properties.map((property) => ({
            ...property,
            relations: { ...property.relations, leaseIds: [], tenantIds: [] },
        })),
        tenants: database.tenants.map((tenant) => ({ ...tenant, leaseIds: [] })),
    };

    db.leases.forEach((lease) => {
        const property = db.properties.find((item) => item.id === lease.propertyId);
        if (property) {
            property.relations.leaseIds = Array.from(new Set([...property.relations.leaseIds, lease.id]));
            property.relations.tenantIds = Array.from(new Set([...property.relations.tenantIds, ...lease.tenantIds]));
        }
        lease.tenantIds.forEach((tenantId) => {
            const tenant = db.tenants.find((item) => item.id === tenantId);
            if (tenant) tenant.leaseIds = Array.from(new Set([...tenant.leaseIds, lease.id]));
        });
    });

    return db;
}

function buildLeaseRecord(formData: LeaseFormData, leaseId: string, timestamp: string): LeaseRecord {
    return {
        id: leaseId,
        propertyId: formData.PropertyID,
        tenantIds: Array.from(new Set(formData.LeaseTenantIds)),
        guarantorIds: Array.from(new Set(formData.LeaseGarantIds)),
        leaseType: normalizeLeaseTypeId(formData.LeaseType),
        leaseTypeLabel: leaseTypeLabel(formData.LeaseType),
        startDate: formData.LeaseStartDate,
        endDate: formData.LeaseEndDate,
        status: 'attiva',
        rentAmount: formData.LeaseRentHC,
        utilitiesAmount: formData.LeaseMaintenance,
        depositAmount: formData.LeaseDeposit,
        billingPeriod: formData.LeaseBillingPeriod,
        formData,
        archived: false,
        createdAt: timestamp,
        updatedAt: timestamp,
        notes: '',
        activity: [{ id: generateId('lease-activity'), type: 'created', description: 'Locazione creata.', createdAt: timestamp }],
        signatureProcess: null,
        termination: null,
        financialState: { depositPaymentId: null, depositReturnPaymentId: null, prepaidAppliedAmount: 0, prepaidAllocations: [] },
    };
}

function activity(type: LeaseRecord['activity'][number]['type'], description: string): LeaseRecord['activity'][number] {
    return { id: generateId('lease-activity'), type, description, createdAt: new Date().toISOString() };
}

function assertFormAgainstDatabase(db: LocalDatabase, formData: LeaseFormData, excludeLeaseId?: string): void {
    const property = db.properties.find((item) => item.id === formData.PropertyID && !item.archived);
    if (!property) throw new LeasePropertyNotFoundError();
    const type = getLeaseTypeById(formData.LeaseType);
    if (!type) throw new LeaseTypeNotFoundError();
    if (formData.LeaseEndDate < formData.LeaseStartDate) throw new LeaseInvalidDateRangeError();
    if (!type.multiTenant && formData.LeaseTenantIds.length > 1) throw new Error('Il tipo di locazione selezionato non consente più inquilini.');
    const tenantSet = new Set(formData.LeaseTenantIds);
    if (tenantSet.size !== formData.LeaseTenantIds.length) throw new LeaseTenantNotFoundError();
    const validTenants = db.tenants.filter((tenant) => formData.LeaseTenantIds.includes(tenant.id) && !tenant.archived);
    if (validTenants.length !== formData.LeaseTenantIds.length) throw new LeaseTenantNotFoundError();
    const validGuarantors = db.contacts.filter((contact) => formData.LeaseGarantIds.includes(contact.id));
    if (validGuarantors.length !== formData.LeaseGarantIds.length) throw new Error('Uno o più garanti selezionati non esistono.');
    assertNoTenantLeaseConflicts(db, formData.LeaseTenantIds, formData.PropertyID, formData.LeaseStartDate, formData.LeaseEndDate, excludeLeaseId);
}

export function listLeases(): LeaseRecord[] {
    return getJsonDb().leases;
}

export function getLeasesByPropertyId(propertyId: string): LeaseRecord[] {
    return getJsonDb().leases.filter((lease) => lease.propertyId === propertyId);
}

export function getLeasesByTenantId(tenantId: string): LeaseRecord[] {
    return getJsonDb().leases.filter((lease) => lease.tenantIds.includes(tenantId));
}

export function assertLeaseCanBeSaved(lease: Pick<LeaseRecord, 'tenantIds' | 'propertyId' | 'startDate' | 'endDate'>, excludeLeaseId?: string): void {
    assertNoTenantLeaseConflicts(getJsonDb(), lease.tenantIds, lease.propertyId, lease.startDate, lease.endDate, excludeLeaseId);
}

export function createLease(input: LeaseInput): LeaseRecord {
    const db = getJsonDb();
    const formData = normalizeLeaseFormData(input);
    const parsed = leaseFormSchema.safeParse(formData);
    if (!parsed.success) throw parsed.error;
    assertFormAgainstDatabase(db, formData);

    const timestamp = new Date().toISOString();
    const record = buildLeaseRecord(formData, generateId('lease'), timestamp);
    let nextDb: LocalDatabase = {
        ...db,
        leases: [...db.leases, record],
    };
    nextDb = {
        ...nextDb,
        payments: [...nextDb.payments, ...(() => {
            const generated = buildLeasePaymentSchedule(record, todayIso());
            assertGeneratedLeasePaymentSchedule(record, generated, todayIso());
            return generated;
        })()],
        drafts: { ...nextDb.drafts, leaseForm: null },
    };
    nextDb = ensureLeaseDepositPayment(nextDb, record, todayIso());
    nextDb = rebuildLeaseRelations(nextDb);

    try {
        const saved = saveJsonDb(nextDb);
        return saved.leases.find((lease) => lease.id === record.id) as LeaseRecord;
    } catch (error) {
        throw new LeaseStorageError(error);
    }
}

function hasHistoricalOrManualPayments(db: LocalDatabase, leaseId: string): boolean {
    return db.payments.some((payment) => payment.leaseId === leaseId && (payment.status === 'paid' || payment.source !== 'generated' || !isGeneratedPaymentForLease(payment)));
}

function isGeneratedPaymentForLease(payment: LocalDatabase['payments'][number]): boolean {
    return payment.source === 'generated' || payment.id.startsWith('payment-rent-') || payment.id.startsWith('payment-rent-first-') || payment.id.startsWith('payment-lease-');
}

function reconcileGeneratedPayments(db: LocalDatabase, oldLease: LeaseRecord, nextLease: LeaseRecord): LocalDatabase {
    const today = todayIso();
    const protectedPayments = db.payments.filter((payment) => {
        if (payment.leaseId !== oldLease.id) return true;
        if (!isGeneratedPaymentForLease(payment)) return true;
        if (payment.status === 'paid') return true;
        if (payment.dueDate < today) return true;
        return false;
    });
    const existingKeys = new Set(protectedPayments.map((payment) => `${payment.leaseId}|${payment.category}|${payment.dueDate}`));
    const generated = buildLeasePaymentSchedule(nextLease, today).filter((payment) => payment.dueDate >= today && !existingKeys.has(`${payment.leaseId}|${payment.category}|${payment.dueDate}`));
    assertGeneratedLeasePaymentSchedule(nextLease, generated, today);
    return { ...db, payments: [...protectedPayments, ...generated] };
}

export function getLeaseById(id: string): LeaseRecord | null {
    return getJsonDb().leases.find((lease) => lease.id === id) || null;
}

export function leaseRecordToDetail(lease: LeaseRecord, database = getJsonDb()): LeaseDetail {
    const payments = database.payments.filter((payment) => payment.leaseId === lease.id);
    return {
        lease,
        property: database.properties.find((property) => property.id === lease.propertyId) || null,
        tenants: lease.tenantIds.map((id) => database.tenants.find((tenant) => tenant.id === id)).filter((tenant): tenant is TenantRecord => Boolean(tenant)),
        guarantors: lease.guarantorIds.map((id) => database.contacts.find((contact) => contact.id === id)).filter((contact): contact is LeaseDetail['guarantors'][number] => Boolean(contact)),
        payments,
        documents: database.documents.filter((document) => document.ownerType === 'lease' && document.ownerId === lease.id),
        communications: database.messages.filter((message) => message.entityType === 'lease' && message.entityId === lease.id),
        balance: payments.filter((payment) => payment.accountingRole === 'revenue' && payment.status !== 'paid').reduce((sum, payment) => sum + payment.amount, 0),
        depositAmount: lease.depositAmount,
        prepaidAppliedAmount: lease.financialState?.prepaidAppliedAmount || 0,
        temporalStatus: classifyLease(lease),
    };
}

export function getLeaseDetail(id: string): LeaseDetail | null {
    const db = getJsonDb();
    const lease = db.leases.find((item) => item.id === id);
    return lease ? leaseRecordToDetail(lease, db) : null;
}

export function updateLease(id: string, input: LeaseInput): LeaseRecord {
    const db = getJsonDb();
    const current = db.leases.find((lease) => lease.id === id);
    if (!current) throw new LeaseNotFoundError();
    if (current.archived) throw new LeaseArchivedError();
    if (current.signatureProcess) throw new LeaseLockedBySignatureError();
    if (current.status === 'terminata') throw new LeaseInvalidStatusTransitionError('Le condizioni contrattuali di una locazione terminata non possono essere modificate.');

    const formData = normalizeLeaseFormData(input);
    const parsed = leaseFormSchema.safeParse(formData);
    if (!parsed.success) throw parsed.error;
    assertFormAgainstDatabase(db, formData, id);

    const changingParties = current.propertyId !== formData.PropertyID
        || JSON.stringify([...current.tenantIds].sort()) !== JSON.stringify([...formData.LeaseTenantIds].sort());
    if (changingParties && hasHistoricalOrManualPayments(db, id)) {
        throw new LeasePaymentHistoryConflictError('Non puoi cambiare proprietà o inquilini perché esistono pagamenti storici o manuali.');
    }

    const timestamp = new Date().toISOString();
    const nextRecord: LeaseRecord = {
        ...buildLeaseRecord(formData, id, current.createdAt),
        status: current.status,
        archived: current.archived,
        createdAt: current.createdAt,
        updatedAt: timestamp,
        notes: current.notes,
        activity: [...current.activity, activity('updated', 'Locazione aggiornata.')],
        signatureProcess: current.signatureProcess,
        termination: current.termination,
        financialState: current.financialState,
    };
    let nextDb: LocalDatabase = {
        ...db,
        leases: db.leases.map((lease) => lease.id === id ? nextRecord : lease),
    };
    nextDb = reconcileGeneratedPayments(nextDb, current, nextRecord);
    nextDb = ensureLeaseDepositPayment(nextDb, nextRecord, todayIso());
    nextDb = rebuildLeaseRelations(nextDb);
    try {
        return saveJsonDb(nextDb).leases.find((lease) => lease.id === id) as LeaseRecord;
    } catch (error) {
        throw new LeaseStorageError(error);
    }
}

function saveLeaseMutation(db: LocalDatabase, leaseId: string): LeaseRecord {
    const saved = saveJsonDb(rebuildLeaseRelations(db));
    return saved.leases.find((lease) => lease.id === leaseId) as LeaseRecord;
}

function assertRestorable(db: LocalDatabase, lease: LeaseRecord): void {
    const property = db.properties.find((item) => item.id === lease.propertyId && !item.archived);
    if (!property) throw new LeasePropertyNotFoundError();
    if (lease.tenantIds.some((id) => !db.tenants.some((tenant) => tenant.id === id && !tenant.archived))) throw new LeaseTenantNotFoundError();
    if (lease.guarantorIds.some((id) => !db.contacts.some((contact) => contact.id === id))) throw new Error('Uno o più garanti non esistono.');
    if (lease.endDate < lease.startDate) throw new LeaseInvalidDateRangeError();
    assertNoTenantLeaseConflicts(db, lease.tenantIds, lease.propertyId, lease.startDate, lease.endDate, lease.id);
}

export function activateLease(id: string): LeaseRecord {
    const db = getJsonDb();
    const lease = db.leases.find((item) => item.id === id);
    if (!lease) throw new LeaseNotFoundError();
    if (lease.archived) throw new LeaseArchivedError();
    if (lease.status === 'terminata' || lease.endDate < todayIso()) throw new LeaseInvalidStatusTransitionError('Non puoi attivare una locazione terminata o storica.');
    assertRestorable(db, lease);
    let nextDb: LocalDatabase = { ...db, leases: db.leases.map((item) => item.id === id ? { ...item, status: 'attiva' as const, updatedAt: new Date().toISOString(), activity: [...item.activity, activity('status', 'Locazione attivata.')] } : item) };
    const nextLease = nextDb.leases.find((item) => item.id === id) as LeaseRecord;
    nextDb = ensureLeaseDepositPayment(nextDb, nextLease, todayIso());
    return saveLeaseMutation(nextDb, id);
}

export function deactivateLease(id: string): LeaseRecord {
    const db = getJsonDb();
    const lease = db.leases.find((item) => item.id === id);
    if (!lease) throw new LeaseNotFoundError();
    if (lease.archived) throw new LeaseArchivedError();
    if (lease.status === 'terminata') throw new LeaseInvalidStatusTransitionError('La locazione è già terminata.');
    const next = { ...lease, status: 'inattiva' as const, updatedAt: new Date().toISOString(), activity: [...lease.activity, activity('status', 'Locazione disattivata.')] };
    return saveLeaseMutation({ ...db, leases: db.leases.map((item) => item.id === id ? next : item) }, id);
}

export function terminateLease(id: string, input: string | { terminationDate: string; reason: string }, legacyReason = ''): LeaseRecord {
    const date = typeof input === 'string' ? input : input.terminationDate;
    const reason = typeof input === 'string' ? legacyReason : input.reason;
    const db = getJsonDb();
    const lease = db.leases.find((item) => item.id === id);
    if (!lease) throw new LeaseNotFoundError();
    if (lease.archived) throw new LeaseArchivedError();
    if (lease.status === 'terminata') throw new LeaseInvalidStatusTransitionError('La locazione è già terminata.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < lease.startDate || date > lease.endDate) throw new LeaseInvalidDateRangeError();
    const futurePaid = db.payments.some((payment) => payment.leaseId === id && payment.status === 'paid' && payment.dueDate > date);
    if (futurePaid) throw new LeasePaymentHistoryConflictError('Esiste un pagamento incassato dopo la data di terminazione.');
    const nextLease = {
        ...lease,
        status: 'terminata' as const,
        endDate: date,
        formData: normalizeLeaseFormData({ ...lease.formData, LeaseEndDate: date, LeaseRinnovoTacito: false }),
        termination: { date, reason, createdAt: new Date().toISOString() },
        updatedAt: new Date().toISOString(),
        activity: [...lease.activity, activity('status', 'Locazione terminata.')],
    };
    const payments = db.payments.filter((payment) => payment.leaseId !== id || !isGeneratedPaymentForLease(payment) || payment.status === 'paid' || payment.dueDate <= date);
    return saveLeaseMutation({ ...db, leases: db.leases.map((item) => item.id === id ? nextLease : item), payments }, id);
}

export function archiveLease(id: string): LeaseRecord {
    const db = getJsonDb();
    const lease = db.leases.find((item) => item.id === id);
    if (!lease) throw new LeaseNotFoundError();
    const next = { ...lease, archived: true, updatedAt: new Date().toISOString(), activity: [...lease.activity, activity('archive', 'Locazione archiviata.')] };
    return saveLeaseMutation({ ...db, leases: db.leases.map((item) => item.id === id ? next : item) }, id);
}

export function restoreLease(id: string): LeaseRecord {
    const db = getJsonDb();
    const lease = db.leases.find((item) => item.id === id);
    if (!lease) throw new LeaseNotFoundError();
    assertRestorable(db, lease);
    const next = { ...lease, archived: false, updatedAt: new Date().toISOString(), activity: [...lease.activity, activity('restore', 'Locazione ripristinata.')] };
    return saveLeaseMutation({ ...db, leases: db.leases.map((item) => item.id === id ? next : item) }, id);
}

export function deleteLease(id: string): boolean {
    const db = getJsonDb();
    const lease = db.leases.find((item) => item.id === id);
    if (!lease) throw new LeaseNotFoundError();
    const reasons: string[] = [];
    if (db.payments.some((payment) => payment.leaseId === id && payment.status === 'paid')) reasons.push('pagamenti già incassati');
    if (db.payments.some((payment) => payment.leaseId === id && payment.source !== 'generated')) reasons.push('movimenti manuali, deposito o restituzione');
    if (db.documents.some((document) => document.ownerType === 'lease' && document.ownerId === id)) reasons.push('documenti');
    if (lease.signatureProcess) reasons.push('procedura di firma');
    if (reasons.length > 0) throw new LeaseDeleteBlockedError(reasons);
    saveJsonDb(rebuildLeaseRelations({
        ...db,
        leases: db.leases.filter((item) => item.id !== id),
        payments: db.payments.filter((payment) => payment.leaseId !== id || (payment.source !== 'generated' && payment.status === 'paid')),
        messages: db.messages.filter((message) => message.entityId !== id),
    }));
    return true;
}

export interface BulkLeaseResult {
    operation: 'activate' | 'deactivate' | 'archive' | 'restore' | 'delete';
    ids: string[];
    count: number;
}

function uniqueIds(ids: string[]): string[] {
    const out = Array.from(new Set(ids.filter(Boolean)));
    if (out.length === 0) throw new LeaseInvalidStatusTransitionError('Seleziona almeno una locazione.');
    return out;
}

function mutateBulk(ids: string[], operation: BulkLeaseResult['operation']): BulkLeaseResult {
    const selected = uniqueIds(ids);
    const before = getJsonDb();
    for (const id of selected) {
        const lease = before.leases.find((item) => item.id === id);
        if (!lease) throw new LeaseNotFoundError();
        if (operation === 'restore') assertRestorable(before, lease);
        if (operation === 'delete') {
            const reasons: string[] = [];
            if (before.payments.some((payment) => payment.leaseId === id && payment.status === 'paid')) reasons.push('pagamenti già incassati');
            if (before.payments.some((payment) => payment.leaseId === id && payment.source !== 'generated')) reasons.push('movimenti manuali, deposito o restituzione');
            if (before.documents.some((doc) => doc.ownerType === 'lease' && doc.ownerId === id)) reasons.push('documenti');
            if (lease.signatureProcess) reasons.push('procedura di firma');
            if (reasons.length) throw new LeaseDeleteBlockedError(reasons);
        }
    }
    const now = new Date().toISOString();
    let next: LocalDatabase = { ...before };
    if (operation === 'delete') {
        next = { ...next, leases: next.leases.filter((lease) => !selected.includes(lease.id)), payments: next.payments.filter((payment) => !payment.leaseId || !selected.includes(payment.leaseId)), messages: next.messages.filter((message) => !selected.includes(message.entityId)) };
    } else {
        next = {
            ...next,
            leases: next.leases.map((lease) => {
                if (!selected.includes(lease.id)) return lease;
                if (operation === 'activate') {
                    if (lease.archived || lease.status === 'terminata' || lease.endDate < todayIso()) throw new LeaseInvalidStatusTransitionError('Attivazione non consentita.');
                    return { ...lease, status: 'attiva', updatedAt: now, activity: [...lease.activity, activity('status', 'Locazione attivata.')] };
                }
                if (operation === 'deactivate') {
                    if (lease.archived || lease.status === 'terminata') throw new LeaseInvalidStatusTransitionError('Disattivazione non consentita.');
                    return { ...lease, status: 'inattiva', updatedAt: now, activity: [...lease.activity, activity('status', 'Locazione disattivata.')] };
                }
                if (operation === 'archive') return { ...lease, archived: true, updatedAt: now, activity: [...lease.activity, activity('archive', 'Locazione archiviata.')] };
                return { ...lease, archived: false, updatedAt: now, activity: [...lease.activity, activity('restore', 'Locazione ripristinata.')] };
            }),
        };
    }
    saveJsonDb(rebuildLeaseRelations(next));
    return { operation, ids: selected, count: selected.length };
}

export const activateLeases = (ids: string[]) => mutateBulk(ids, 'activate');
export const deactivateLeases = (ids: string[]) => mutateBulk(ids, 'deactivate');
export const archiveLeases = (ids: string[]) => mutateBulk(ids, 'archive');
export const restoreLeases = (ids: string[]) => mutateBulk(ids, 'restore');
export const deleteLeases = (ids: string[]) => mutateBulk(ids, 'delete');

export function updateLeaseNotes(id: string, notes: string): LeaseRecord {
    const db = getJsonDb();
    const lease = db.leases.find((item) => item.id === id);
    if (!lease) throw new LeaseNotFoundError();
    const next = { ...lease, notes, updatedAt: new Date().toISOString(), activity: [...lease.activity, activity('note', 'Note aggiornate.')] };
    return saveLeaseMutation({ ...db, leases: db.leases.map((item) => item.id === id ? next : item) }, id);
}

export function leaseRecordToListItem(lease: LeaseRecord, database = getJsonDb()): LeaseListItem {
    const property = database.properties.find((item) => item.id === lease.propertyId);
    const tenants = lease.tenantIds
        .map((id) => database.tenants.find((tenant) => tenant.id === id))
        .filter((tenant): tenant is TenantRecord => Boolean(tenant));
    const firstTenant = tenants[0];
    const firstTenantName = tenantName(firstTenant);
    return {
        id: lease.id,
        propertyId: lease.propertyId,
        propertyTitle: property?.formData.PropertyTitle || 'Unità senza nome',
        propertyAddress: property ? propertyAddress(property.formData) : '',
        tenantIds: lease.tenantIds,
        tenantName: tenants.length > 1 ? `${firstTenantName} +${tenants.length - 1}` : firstTenantName,
        tenantEmail: firstTenant?.email || null,
        leaseTypeValue: lease.leaseType,
        leaseTypeLabel: lease.leaseTypeLabel,
        periodicAmount: lease.formData.LeaseMonthlyAmount,
        monthlyAmount: lease.formData.LeaseMonthlyAmount,
        rentHC: lease.rentAmount,
        maintenance: lease.utilitiesAmount,
        securityDeposit: lease.depositAmount,
        balance: database.payments
            .filter((payment) => payment.leaseId === lease.id && payment.status === 'late')
            .reduce((sum, payment) => sum - payment.amount, 0),
        startDate: lease.startDate,
        endDate: lease.endDate,
        temporalStatus: classifyLease(lease),
        archived: lease.archived,
        identificativo: lease.formData.LeaseIdentificativo || null,
        numeroRegistrazione: lease.formData.LeaseNumeroRegistrazione || null,
        notes: lease.notes,
    };
}

export function listLeaseItems(): LeaseListItem[] {
    const db = getJsonDb();
    return db.leases.map((lease) => leaseRecordToListItem(lease, db));
}

export { findTenantLeaseConflicts };
