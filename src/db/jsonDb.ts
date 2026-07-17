import seedDatabase from './database.json';
import type {
    BuildingRecord,
    ContactRecord,
    DatabaseSource,
    DocumentRecord,
    LeaseRecord,
    LocalDatabase,
    LocalDatabaseCollectionName,
    MessageRecord,
    PaymentRecord,
    PropertyRecord,
    TenantRecord,
} from './database.types';
import type { TenantInvitation } from '../types/tenant';
import { defaultPropertyValues, normalizePropertyFormData, type PropertyFormData } from '../components/property-form/schema';
import { assertDatabaseIntegrity } from './databaseValidation';
import { recalculateBuildingUnits, todayIso } from './dataSelectors';
import { normalizePropertyIdentifier } from './businessRules';
import { LocalStorageQuotaError, isQuotaExceededError } from './databaseErrors';
import { leaseTypeLabel } from '../landlord/leases/data/leaseTypes';
import { normalizeLeaseFormData } from '../landlord/leases/schema/leaseFormSchema';
import { ensureAllLeasePaymentSchedules, isGeneratedRentPayment } from './paymentRepository';

export const LOCAL_DB_KEY = 'props24.localDb';
const OLD_DB_KEY_V3 = 'rentila.localDb.v3';
const PREVIOUS_DB_KEY = 'rentila.localDb.v2';
const LEGACY_DB_KEY = 'gestionale.jsonDb.v1';
const TENANT_DRAFT_KEY = 'tenant_form_draft';
const PROPERTY_DRAFT_KEY = 'property_form_draft';
const CORRUPTED_DB_PREFIX = 'rentila.localDb.corrupted.';
const DB_EVENT = 'rentila-local-db-change';
const SEED_VERSION = 3;

const LEGACY_LOCAL_DB_KEYS = [OLD_DB_KEY_V3, PREVIOUS_DB_KEY, LEGACY_DB_KEY, TENANT_DRAFT_KEY, PROPERTY_DRAFT_KEY];
let inMemoryDatabase: LocalDatabase | null = null;
let fallbackIdCounter = 0;

export const LOCATION_DATA: Record<string, { postalCode: string; county: string; state: string; country: string }> = {
    Milano: { postalCode: '20100', county: 'MI', state: 'Lombardia', country: 'IT' },
    Monza: { postalCode: '20900', county: 'MB', state: 'Lombardia', country: 'IT' },
    Bergamo: { postalCode: '24100', county: 'BG', state: 'Lombardia', country: 'IT' },
    Lodi: { postalCode: '26900', county: 'LO', state: 'Lombardia', country: 'IT' },
    Torino: { postalCode: '10100', county: 'TO', state: 'Piemonte', country: 'IT' },
    Roma: { postalCode: '00100', county: 'RM', state: 'Lazio', country: 'IT' },
    Firenze: { postalCode: '50100', county: 'FI', state: 'Toscana', country: 'IT' },
    Rimini: { postalCode: '47921', county: 'RN', state: 'Emilia-Romagna', country: 'IT' },
    Bormio: { postalCode: '23032', county: 'SO', state: 'Lombardia', country: 'IT' },
    Baveno: { postalCode: '28831', county: 'VB', state: 'Piemonte', country: 'IT' },
};

type LegacyProperty = {
    id?: unknown;
    title?: unknown;
    address?: unknown;
    type?: unknown;
    surface?: unknown;
    rooms?: unknown;
    rent?: unknown;
    assetValue?: unknown;
    status?: unknown;
    visibility?: unknown;
    archived?: unknown;
};

function nowIso(): string {
    return new Date().toISOString();
}

function normalizeContactRecord(input: unknown, fallbackId: string): ContactRecord {
    const source = asObject(input);
    const timestamp = nowIso();
    return {
        id: valueAsString(source.id) || fallbackId,
        type: source.type === 'company' ? 'company' : 'person',
        companyName: valueAsString(source.companyName),
        firstName: valueAsString(source.firstName),
        lastName: valueAsString(source.lastName),
        birthDate: normalizeIsoDate(source.birthDate),
        birthPlace: valueAsString(source.birthPlace),
        fiscalCode: valueAsString(source.fiscalCode),
        vatNumber: valueAsString(source.vatNumber),
        email: valueAsString(source.email),
        phone: valueAsString(source.phone),
        address: valueAsString(source.address),
        city: valueAsString(source.city),
        zip: valueAsString(source.zip),
        country: valueAsString(source.country) || 'IT',
        notes: valueAsString(source.notes),
        archived: source.archived === true,
        createdAt: valueAsString(source.createdAt) || timestamp,
        updatedAt: valueAsString(source.updatedAt) || timestamp,
    };
}

function normalizeDocumentRecord(input: unknown, fallbackId: string): DocumentRecord {
    const source = asObject(input);
    const timestamp = nowIso();
    const ownerType = source.ownerType === 'lease' ? 'lease' : 'global';
    return {
        id: valueAsString(source.id) || fallbackId,
        ownerType,
        ownerId: ownerType === 'lease' ? valueAsString(source.ownerId) || null : null,
        sourceDocumentId: valueAsString(source.sourceDocumentId) || null,
        categoryId: valueAsNumber(source.categoryId),
        categoryLabel: valueAsString(source.categoryLabel) || 'Altro',
        title: valueAsString(source.title) || valueAsString(asObject(source.file).name),
        description: valueAsString(source.description),
        isShared: source.isShared === true,
        file: normalizeStoredLocalFile(source.file),
        createdAt: valueAsString(source.createdAt) || timestamp,
        updatedAt: valueAsString(source.updatedAt) || timestamp,
    };
}

function normalizeMessageRecord(input: unknown, fallbackId: string): MessageRecord {
    const source = asObject(input);
    const recipients = Array.isArray(source.recipients) ? source.recipients.map((item) => {
        const recipient = asObject(item);
        return { name: valueAsString(recipient.name), email: valueAsString(recipient.email) };
    }).filter((item) => item.email) : [];
    return {
        id: valueAsString(source.id) || fallbackId,
        entityType: 'lease',
        entityId: valueAsString(source.entityId),
        channel: 'email',
        status: 'prepared',
        recipientTenantIds: Array.isArray(source.recipientTenantIds) ? source.recipientTenantIds.filter((id): id is string => typeof id === 'string') : [],
        recipients,
        subject: valueAsString(source.subject),
        body: valueAsString(source.body),
        createdAt: valueAsString(source.createdAt) || nowIso(),
    };
}

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

function asObject(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

function valueAsString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function valueAsNumber(value: unknown, fallback = 0): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function valueAsNumberOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeStoredLocalFile(value: unknown): import('../components/property-form/schema').StoredLocalFile | null {
    const source = asObject(value);
    if (!value || !valueAsString(source.name) || !valueAsString(source.dataUrl)) return null;
    return {
        id: valueAsString(source.id) || generateId('file'),
        name: valueAsString(source.name),
        type: valueAsString(source.type),
        size: valueAsNumber(source.size),
        lastModified: valueAsNumber(source.lastModified),
        dataUrl: valueAsString(source.dataUrl),
    };
}

function normalizeTenantInvitation(value: unknown, email: string): TenantInvitation {
    const source = asObject(value);
    const status: TenantInvitation['status'] = source.status === 'pending' || source.status === 'accepted' ? source.status : 'not_sent';
    return {
        status: email ? status : 'not_sent',
        email,
        sentAt: valueAsString(source.sentAt) || null,
        acceptedAt: valueAsString(source.acceptedAt) || null,
    };
}

function normalizeTenantDocuments(value: unknown): TenantRecord['documents'] {
    return (Array.isArray(value) ? value : []).map((item, index) => {
        const source = asObject(item);
        return {
            id: valueAsString(source.id) || `tenant-document-${index + 1}`,
            existingDocumentId: valueAsString(source.existingDocumentId) || undefined,
            fileName: valueAsString(source.fileName || source.name),
            categoryId: valueAsNumber(source.categoryId, 1),
            categoryLabel: valueAsString(source.categoryLabel) || 'Altro',
            description: valueAsString(source.description) || undefined,
            uploadDate: valueAsString(source.uploadDate) || nowIso(),
            fileSize: valueAsNumber(source.fileSize || asObject(source.file).size),
            isShared: source.isShared === true,
            fileUrl: valueAsString(source.fileUrl),
            file: normalizeStoredLocalFile(source.file),
        };
    });
}

export function generateId(prefix = 'record'): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`;
    fallbackIdCounter += 1;
    return `${prefix}-${Date.now()}-${fallbackIdCounter}`;
}

export function normalizeIsoDate(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) return '';
    const trimmed = value.trim();
    const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
        const year = Number(iso[1]);
        const month = Number(iso[2]);
        const day = Number(iso[3]);
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? trimmed : '';
    }
    const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
        const [, day, month, year] = match;
        const next = `${year}-${month}-${day}`;
        return normalizeIsoDate(next);
    }
    return '';
}

function cityLocation(city: string) {
    return LOCATION_DATA[city] || { postalCode: '', county: '', state: '', country: 'IT' };
}

function splitAddress(address: unknown): Pick<PropertyFormData, 'PropertyAddress' | 'PropertyCity' | 'PropertyPostalCode' | 'PropertyCounty' | 'PropertyState' | 'PropertyCountry'> {
    const raw = valueAsString(address);
    const [street = '', city = ''] = raw.split(',').map((part) => part.trim());
    const location = cityLocation(city);
    return {
        PropertyAddress: street,
        PropertyCity: city,
        PropertyPostalCode: location.postalCode,
        PropertyCounty: location.county,
        PropertyState: location.state,
        PropertyCountry: location.country,
    };
}

function emptyDb(source: DatabaseSource): LocalDatabase {
    const timestamp = nowIso();
    return {
        meta: { schemaVersion: 3, seedVersion: SEED_VERSION, createdAt: timestamp, updatedAt: timestamp, source },
        properties: [],
        buildings: [],
        tenants: [],
        leases: [],
        payments: [],
        contacts: [],
        documents: [],
        reservations: [],
        catalogs: [],
        inventory: [],
        maintenance: [],
        tasks: [],
        notes: [],
        messages: [],
        candidates: [],
        settings: {},
        userProfile: {},
        drafts: {
            tenantForm: null,
            propertyForm: null,
            leaseForm: null,
        },
    };
}

function normalizePropertyRecord(input: unknown, fallbackId: string): PropertyRecord {
    const source = asObject(input);
    if ('formData' in source) {
        const formData = normalizePropertyFormData(source.formData);
        const location = cityLocation(formData.PropertyCity);
        const relations = asObject(source.relations);
        const tenantIds = Array.isArray(relations.tenantIds) ? relations.tenantIds.filter((id): id is string => typeof id === 'string') : [];
        const leaseIds = Array.isArray(relations.leaseIds) ? relations.leaseIds.filter((id): id is string => typeof id === 'string') : [];
        return {
            id: valueAsString(source.id) || fallbackId,
            createdAt: valueAsString(source.createdAt) || nowIso(),
            updatedAt: valueAsString(source.updatedAt) || nowIso(),
            archived: source.archived === true,
            formData: normalizePropertyFormData({
                ...formData,
                PropertyPostalCode: formData.PropertyPostalCode || location.postalCode,
                PropertyCounty: formData.PropertyCounty || location.county,
                PropertyState: formData.PropertyState || location.state,
                PropertyCountry: formData.PropertyCountry || location.country,
            }),
            relations: {
                buildingId: typeof relations.buildingId === 'string' ? relations.buildingId : null,
                tenantIds,
                leaseIds,
            },
            notes: Array.isArray(source.notes) ? source.notes as PropertyRecord['notes'] : [],
            activities: Array.isArray(source.activities) ? source.activities as PropertyRecord['activities'] : [],
            coordinates: typeof source.coordinates === 'object' && source.coordinates !== null ? source.coordinates as PropertyRecord['coordinates'] : undefined,
            legacy: typeof source.legacy === 'object' && source.legacy !== null ? source.legacy as Record<string, unknown> : undefined,
        };
    }

    const legacy = source as LegacyProperty;
    const address = splitAddress(legacy.address);
    return {
        id: valueAsString(legacy.id) || fallbackId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        archived: legacy.archived === true,
        formData: normalizePropertyFormData({
            ...defaultPropertyValues,
            PropertyTitle: valueAsString(legacy.title) || 'UnitÃ  senza nome',
            PropertyTypeID: valueAsString(legacy.type).toLowerCase() || 'altro',
            ...address,
            PropertySize: valueAsNumberOrNull(legacy.surface),
            PropertyRoomsNum: valueAsNumberOrNull(legacy.rooms),
            PropertyRent: valueAsNumberOrNull(legacy.rent),
            PropertyCurrentValue: valueAsNumberOrNull(legacy.assetValue),
            PropertyStatusManual: valueAsString(legacy.status).replace('ricerca_inquilini', 'ricerca') || 'disponibile',
            PropertyPublic: legacy.visibility === 'pubblicato',
            PropertyPublicAddress: legacy.visibility === 'pubblicato',
        }),
        relations: { buildingId: null, tenantIds: [], leaseIds: [] },
        notes: [],
        activities: [],
        legacy: clone(source),
    };
}

function tenantDisplayName(input: Record<string, unknown>): string {
    if (typeof input.displayName === 'string') return input.displayName;
    if (typeof input.companyName === 'string') return input.companyName;
    return [input.firstName, input.lastName].filter((item): item is string => typeof item === 'string').join(' ');
}

function normalizeTenantRecord(input: unknown, fallbackId: string): TenantRecord {
    const source = asObject(input);
    const displayName = tenantDisplayName(source);
    const [first = '', ...rest] = displayName.split(' ');
    const subtitle = valueAsString(source.subtitle);
    const subtitleParts = subtitle.split(',').map((part) => part.trim());
    const city = valueAsString(source.city) || subtitleParts[1] || 'Milano';
    const location = cityLocation(city);
    return {
        id: valueAsString(source.id) || fallbackId,
        createdAt: valueAsString(source.createdAt) || nowIso(),
        updatedAt: valueAsString(source.updatedAt) || nowIso(),
        type: source.type === 'company' ? 'company' : 'person',
        photo: normalizeStoredLocalFile(source.photo),
        avatarColor: valueAsString(source.avatarColor) || '#64748b',
        title: source.title === 'Miss' || source.title === 'Mrs' || source.title === 'Mr' ? source.title : '',
        firstName: valueAsString(source.firstName) || (source.type === 'company' ? '' : first),
        middleName: valueAsString(source.middleName),
        lastName: valueAsString(source.lastName) || (source.type === 'company' ? '' : rest.join(' ')),
        birthDate: normalizeIsoDate(source.birthDate),
        birthPlace: valueAsString(source.birthPlace),
        nationality: valueAsString(source.nationality),
        fiscalCode: valueAsString(source.fiscalCode),
        vatNumberPersonal: valueAsString(source.vatNumberPersonal),
        profession: valueAsString(source.profession),
        monthlyIncome: valueAsNumberOrNull(source.monthlyIncome),
        idType: source.idType === 'ID' || source.idType === 'passport' || source.idType === 'drivinglicense' || source.idType === 'residencepermit' ? source.idType : '',
        idNumber: valueAsString(source.idNumber),
        idExpiry: normalizeIsoDate(source.idExpiry),
        identityDocumentFile: normalizeStoredLocalFile(source.identityDocumentFile),
        companyName: valueAsString(source.companyName) || (source.type === 'company' ? displayName : ''),
        vatNumber: valueAsString(source.vatNumber),
        siret: valueAsString(source.siret),
        capital: valueAsString(source.capital),
        companyDescription: valueAsString(source.companyDescription),
        email: valueAsString(source.email),
        emailSecondary: valueAsString(source.emailSecondary),
        mobilePhone: valueAsString(source.mobilePhone),
        phone: valueAsString(source.phone),
        address1: valueAsString(source.address1) || subtitleParts[0] || '',
        address2: valueAsString(source.address2),
        city,
        zip: valueAsString(source.zip) || location.postalCode,
        state: valueAsString(source.state) || location.state,
        country: valueAsString(source.country) || location.country,
        proEmployer: valueAsString(source.proEmployer),
        proAddress: valueAsString(source.proAddress),
        proCity: valueAsString(source.proCity),
        proZip: valueAsString(source.proZip),
        proState: valueAsString(source.proState),
        proCountry: valueAsString(source.proCountry),
        proPhone: valueAsString(source.proPhone),
        bankName: valueAsString(source.bankName),
        bankAddress: valueAsString(source.bankAddress),
        bankCity: valueAsString(source.bankCity),
        bankZip: valueAsString(source.bankZip),
        bankCountry: valueAsString(source.bankCountry),
        bankIBAN: valueAsString(source.bankIBAN),
        bankSwiftBic: valueAsString(source.bankSwiftBic),
        leaveAddress: valueAsString(source.leaveAddress),
        notes: valueAsString(source.notes),
        status: source.status === 'candidato' || source.status === 'inattivo' ? source.status : 'attivo',
        archived: source.archived === true,
        leaseIds: Array.isArray(source.leaseIds) ? source.leaseIds.filter((id): id is string => typeof id === 'string') : [],
        guarantors: Array.isArray(source.guarantors) ? source.guarantors as TenantRecord['guarantors'] : [],
        emergencyContacts: Array.isArray(source.emergencyContacts) ? source.emergencyContacts as TenantRecord['emergencyContacts'] : [],
        documents: normalizeTenantDocuments(source.documents),
        invitation: normalizeTenantInvitation(source.invitation, valueAsString(source.email)),
        legacy: typeof source.legacy === 'object' && source.legacy !== null ? source.legacy as Record<string, unknown> : undefined,
    };
}

function normalizeLeaseRecord(input: unknown, fallbackId: string): LeaseRecord {
    const source = asObject(input);
    const flatTenantIds = Array.isArray(source.tenantIds)
        ? source.tenantIds.filter((id): id is string => typeof id === 'string')
        : valueAsString(source.tenantId) ? [valueAsString(source.tenantId)] : [];
    const flatGuarantorIds = Array.isArray(source.guarantorIds)
        ? source.guarantorIds.filter((id): id is string => typeof id === 'string')
        : [];
    const formData = normalizeLeaseFormData({
        ...asObject(source.formData),
        PropertyID: asObject(source.formData).PropertyID ?? source.propertyId,
        LeaseTenantIds: asObject(source.formData).LeaseTenantIds ?? flatTenantIds,
        LeaseGarantIds: asObject(source.formData).LeaseGarantIds ?? flatGuarantorIds,
        LeaseType: asObject(source.formData).LeaseType ?? source.leaseType ?? source.leaseTypeValue,
        LeaseStartDate: asObject(source.formData).LeaseStartDate ?? source.startDate,
        LeaseEndDate: asObject(source.formData).LeaseEndDate ?? source.endDate,
        LeaseRentHC: asObject(source.formData).LeaseRentHC ?? source.rentAmount ?? source.rentHC,
        LeaseMaintenance: asObject(source.formData).LeaseMaintenance ?? source.utilitiesAmount ?? source.maintenance,
        LeaseDeposit: asObject(source.formData).LeaseDeposit ?? source.depositAmount ?? source.securityDeposit,
        LeaseBillingPeriod: asObject(source.formData).LeaseBillingPeriod ?? source.billingPeriod,
    });
    const tenantIds = Array.from(new Set(formData.LeaseTenantIds));
    const guarantorIds = Array.from(new Set(formData.LeaseGarantIds));
    const status = source.status === 'terminata' || source.status === 'inattiva' || source.status === 'inattivo'
        ? (source.status === 'inattivo' ? 'inattiva' : source.status)
        : 'attiva';
    const financialState = asObject(source.financialState);
    const termination = asObject(source.termination);
    return {
        id: valueAsString(source.id) || fallbackId,
        propertyId: formData.PropertyID || valueAsString(source.propertyId),
        tenantIds,
        guarantorIds,
        leaseType: formData.LeaseType || valueAsString(source.leaseType) || valueAsString(source.leaseTypeValue),
        leaseTypeLabel: valueAsString(source.leaseTypeLabel) || valueAsString(source.type) || leaseTypeLabel(formData.LeaseType),
        startDate: normalizeIsoDate(formData.LeaseStartDate),
        endDate: normalizeIsoDate(formData.LeaseEndDate),
        status,
        rentAmount: formData.LeaseRentHC,
        utilitiesAmount: formData.LeaseMaintenance,
        depositAmount: formData.LeaseDeposit,
        billingPeriod: formData.LeaseBillingPeriod,
        formData,
        archived: source.archived === true,
        createdAt: valueAsString(source.createdAt) || nowIso(),
        updatedAt: valueAsString(source.updatedAt) || nowIso(),
        notes: valueAsString(source.notes),
        activity: Array.isArray(source.activity) ? source.activity.map((item, index) => {
            const activity = asObject(item);
            return {
                id: valueAsString(activity.id) || `${fallbackId}-activity-${index + 1}`,
                type: ['created', 'updated', 'status', 'archive', 'restore', 'payment', 'document', 'signature', 'communication', 'note'].includes(valueAsString(activity.type))
                    ? valueAsString(activity.type) as LeaseRecord['activity'][number]['type']
                    : 'note',
                description: valueAsString(activity.description),
                createdAt: valueAsString(activity.createdAt) || nowIso(),
            };
        }) : [],
        signatureProcess: typeof source.signatureProcess === 'object' && source.signatureProcess !== null ? source.signatureProcess as LeaseRecord['signatureProcess'] : null,
        termination: source.termination && valueAsString(termination.date) ? {
            date: normalizeIsoDate(termination.date),
            reason: valueAsString(termination.reason),
            createdAt: valueAsString(termination.createdAt) || nowIso(),
        } : null,
        financialState: {
            depositPaymentId: valueAsString(financialState.depositPaymentId) || null,
            depositReturnPaymentId: valueAsString(financialState.depositReturnPaymentId) || null,
            prepaidAppliedAmount: valueAsNumber(financialState.prepaidAppliedAmount),
            prepaidAllocations: (Array.isArray(financialState.prepaidAllocations) ? financialState.prepaidAllocations : []).map((item) => {
                const allocation = asObject(item);
                return {
                    paymentId: valueAsString(allocation.paymentId),
                    amount: valueAsNumber(allocation.amount),
                    allocatedAt: valueAsString(allocation.allocatedAt) || nowIso(),
                    appliedAt: valueAsString(allocation.appliedAt) || null,
                };
            }).filter((allocation, index, list) => allocation.paymentId && list.findIndex((item) => item.paymentId === allocation.paymentId) === index),
        },
        legacy: typeof source.legacy === 'object' && source.legacy !== null ? source.legacy as Record<string, unknown> : undefined,
    };
}

function normalizeBuildingRecord(input: unknown, fallbackId: string): BuildingRecord {
    const source = asObject(input);
    const address = splitAddress(source.address);
    return {
        id: valueAsString(source.id) || fallbackId,
        createdAt: valueAsString(source.createdAt) || nowIso(),
        updatedAt: valueAsString(source.updatedAt) || nowIso(),
        archived: source.archived === true || source.status === 'archived',
        name: valueAsString(source.name) || valueAsString(source.description) || `Edificio ${fallbackId}`,
        address: valueAsString(source.address) || address.PropertyAddress,
        city: valueAsString(source.city) || address.PropertyCity,
        postalCode: valueAsString(source.postalCode) || address.PropertyPostalCode,
        county: valueAsString(source.county) || address.PropertyCounty,
        state: valueAsString(source.state) || address.PropertyState,
        country: valueAsString(source.country) || address.PropertyCountry,
        size: valueAsNumberOrNull(source.size),
        unitsCount: valueAsNumber(source.unitsCount),
        description: valueAsString(source.description),
    };
}

function generateMigrationPayments(leases: LeaseRecord[], source: DatabaseSource): PaymentRecord[] {
    const current = todayIso();
    const startMonth = source === 'migration-v1' ? '2025-08' : '2025-09';
    let counter = 1;
    const payments: PaymentRecord[] = [];
    for (const lease of leases) {
        if (lease.archived) continue;
        let cursor = new Date(`${startMonth}-01T00:00:00Z`);
        const end = new Date('2026-08-01T00:00:00Z');
        while (cursor <= end) {
            const ym = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`;
            const dueDate = `${ym}-05`;
            if (dueDate >= lease.startDate && dueDate <= lease.endDate) {
                const late = counter % 17 === 0;
                const pending = dueDate > current;
                const paid = !late && !pending;
                payments.push({
                    id: `payment-migrated-${String(counter).padStart(3, '0')}`,
                    propertyId: lease.propertyId,
                    leaseId: lease.id,
                    tenantId: lease.tenantIds[0] || null,
                    type: 'income',
                    category: 'rent',
                    amount: lease.rentAmount + lease.utilitiesAmount,
                    dueDate,
                    paidDate: paid ? dueDate : null,
                    status: paid ? 'paid' : pending ? 'pending' : 'late',
                    description: `Canone ${ym}`,
                    source: 'generated',
                    accountingRole: 'revenue',
                    notes: '',
                    receiptNumber: null,
                    createdAt: `${ym}-01T00:00:00.000Z`,
                    updatedAt: `${ym}-01T00:00:00.000Z`,
                });
                counter += 1;
            }
            cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        }
    }
    const expenseProperties = Array.from(new Set(leases.map((lease) => lease.propertyId))).slice(0, 6);
    expenseProperties.forEach((propertyId, index) => {
        const dueDate = `2026-${String(index + 1).padStart(2, '0')}-18`;
        payments.push({
            id: `payment-migrated-expense-${String(index + 1).padStart(3, '0')}`,
            propertyId,
            leaseId: null,
            tenantId: null,
            type: 'expense',
            category: index % 2 === 0 ? 'maintenance' : 'insurance',
            amount: 150 + index * 75,
            dueDate,
            paidDate: dueDate,
            status: 'paid',
            description: index % 2 === 0 ? 'Spesa manutenzione migrata' : 'Spesa assicurazione migrata',
            source: 'manual',
            accountingRole: 'expense',
            notes: '',
            receiptNumber: null,
            createdAt: `${dueDate}T00:00:00.000Z`,
            updatedAt: `${dueDate}T00:00:00.000Z`,
        });
    });
    return payments;
}

function looksLikeUnreliableLegacyPayments(payments: PaymentRecord[], leases: LeaseRecord[]): boolean {
    if (payments.length === 0) return true;
    const current = todayIso();
    const syntheticGeneratorIds = payments.length > 12 && payments.every((payment) => (
        /^payment-lease-[^-]+-\d{4}-\d{2}$/.test(payment.id)
        || /^payment-migrated-\d{3}$/.test(payment.id)
        || /^payment-migrated-expense-\d{3}$/.test(payment.id)
    ));
    return payments.some((payment) => {
        const lease = payment.leaseId ? leases.find((item) => item.id === payment.leaseId) : null;
        return (lease && (payment.dueDate < lease.startDate || payment.dueDate > lease.endDate))
            || (payment.status === 'paid' && payment.dueDate > current && !payment.paidDate)
            || (lease && payment.tenantId === null && lease.tenantIds.length > 0);
    }) && syntheticGeneratorIds;
}

function migrateFromUnknown(source: unknown, migrationSource: DatabaseSource): LocalDatabase {
    const sourceObject = asObject(source);
    if (asObject(sourceObject.meta).schemaVersion === 3) return normalizeV3Database(sourceObject, true);

    const db = emptyDb(migrationSource);
    db.properties = (Array.isArray(sourceObject.properties) ? sourceObject.properties : []).map((item, index) => normalizePropertyRecord(item, `property-migrated-${index + 1}`));

    const legacyDetails = Array.isArray(sourceObject.propertyDetails) ? sourceObject.propertyDetails : [];
    for (const detail of legacyDetails) {
        const record = normalizePropertyRecord({ id: asObject(detail).id, formData: legacyDetailToFormData(detail), notes: asObject(detail).notes, activities: asObject(detail).activities }, `property-detail-${db.properties.length + 1}`);
        if (!db.properties.some((property) => property.id === record.id)) db.properties.push(record);
    }

    db.buildings = (Array.isArray(sourceObject.buildings) ? sourceObject.buildings : []).map((item, index) => normalizeBuildingRecord(item, `building-migrated-${index + 1}`));
    const tenantsById = new Map<string, TenantRecord>();
    [...(Array.isArray(sourceObject.tenants) ? sourceObject.tenants : []), ...(Array.isArray(sourceObject.tenantList) ? sourceObject.tenantList : [])]
        .forEach((item, index) => {
            const tenant = normalizeTenantRecord(item, `tenant-migrated-${index + 1}`);
            if (!tenantsById.has(tenant.id)) tenantsById.set(tenant.id, tenant);
        });
    db.tenants = Array.from(tenantsById.values());
    db.leases = (Array.isArray(sourceObject.leases) ? sourceObject.leases : []).map((item, index) => normalizeLeaseRecord(item, `lease-migrated-${index + 1}`));

    legacyDetails.forEach((detail) => {
        const detailObject = asObject(detail);
        const propertyId = valueAsString(detailObject.id);
        const tenantObject = asObject(detailObject.tenant);
        const tenantId = valueAsString(tenantObject.id);
        if (tenantId && !db.tenants.some((tenant) => tenant.id === tenantId)) {
            db.tenants.push(normalizeTenantRecord({
                id: tenantId,
                type: 'person',
                displayName: valueAsString(tenantObject.name),
                city: 'Torino',
                zip: '10141',
                state: 'Piemonte',
                country: 'IT',
            }, tenantId));
        }
        (Array.isArray(detailObject.leases) ? detailObject.leases : []).forEach((lease, index) => {
            const leaseObject = asObject(lease);
            const leaseId = valueAsString(leaseObject.id) || `lease-detail-${index + 1}`;
            if (!db.leases.some((item) => item.id === leaseId)) {
                db.leases.push(normalizeLeaseRecord({
                    ...leaseObject,
                    id: leaseId,
                    propertyId,
                    tenantIds: tenantId ? [tenantId] : [],
                    leaseTypeLabel: valueAsString(leaseObject.type),
                    status: leaseObject.status === 'active' ? 'attiva' : leaseObject.status,
                    rentAmount: leaseObject.rentAmount,
                    utilitiesAmount: leaseObject.utilitiesAmount,
                    depositAmount: valueAsNumber(leaseObject.rentAmount) * 2,
                }, leaseId));
            }
        });
    });

    for (const lease of db.leases) {
        for (const tenantId of lease.tenantIds) {
            const tenant = db.tenants.find((item) => item.id === tenantId);
            if (tenant && !tenant.leaseIds.includes(lease.id)) tenant.leaseIds.push(lease.id);
        }
        const property = db.properties.find((item) => item.id === lease.propertyId);
        if (property) {
            property.relations.leaseIds = Array.from(new Set([...property.relations.leaseIds, lease.id]));
            property.relations.tenantIds = Array.from(new Set([...property.relations.tenantIds, ...lease.tenantIds]));
        }
    }

    const migratedPayments = Array.isArray(sourceObject.payments) && sourceObject.payments.length > 0
        ? sourceObject.payments.map((item, index) => normalizePaymentRecord(item, `payment-migrated-${index + 1}`))
        : [];
    db.payments = looksLikeUnreliableLegacyPayments(migratedPayments, db.leases)
        ? generateMigrationPayments(db.leases, migrationSource)
        : migratedPayments;
    db.settings = clone(asObject(sourceObject.settings));
    db.userProfile = clone(asObject(sourceObject.userProfile));
    db.meta.updatedAt = nowIso();
    const normalized = repairRecoverableDatabase(recalculateBuildingUnits(db));
    return normalized;
}

function legacyDetailToFormData(detail: unknown): Partial<PropertyFormData> {
    const source = asObject(detail);
    const address = asObject(source.address);
    const specs = asObject(source.specs);
    const rent = asObject(source.rent);
    const visibility = asObject(source.visibility);
    const location = cityLocation(valueAsString(address.city));
    return normalizePropertyFormData({
        ...defaultPropertyValues,
        PropertyTitle: valueAsString(source.title),
        PropertyTypeID: valueAsString(source.type).toLowerCase() || 'appartamento',
        PropertyAddress: valueAsString(address.street),
        PropertyCity: valueAsString(address.city),
        PropertyPostalCode: valueAsString(address.postalCode) || location.postalCode,
        PropertyCounty: location.county,
        PropertyState: location.state,
        PropertyCountry: valueAsString(address.country) === 'Italia' ? 'IT' : valueAsString(address.country) || location.country,
        PropertySize: valueAsNumberOrNull(specs.surface),
        PropertyRoomsNum: valueAsNumberOrNull(specs.rooms),
        PropertyRoomsNumChambres: valueAsNumberOrNull(specs.bedrooms),
        PropertyRoomsNumBaths: valueAsNumberOrNull(specs.bathrooms),
        PropertyFloor: specs.floor == null ? '' : String(specs.floor),
        PropertyRent: valueAsNumberOrNull(rent.base),
        PropertyMaintenance: valueAsNumberOrNull(rent.utilities),
        PropertyStatusManual: 'affittato',
        PropertyPublic: visibility.isPublic === true,
        PropertyPublicAddress: visibility.addressPublic === true,
        PropertyPublicPhone: visibility.phonePublic === true,
    });
}

function normalizePaymentRecord(input: unknown, fallbackId: string): PaymentRecord {
    const source = asObject(input);
    const paidDate = normalizeIsoDate(source.paidDate);
    const type = source.type === 'expense' ? 'expense' : 'income';
    const category = valueAsString(source.category);
    const legacyGenerated = /^payment-(rent|rent-first|lease)-/.test(valueAsString(source.id));
    const paymentSource: PaymentRecord['source'] = source.source === 'deposit' || source.source === 'deposit_return' || source.source === 'manual' || source.source === 'generated'
        ? source.source
        : legacyGenerated ? 'generated' : 'manual';
    const accountingRole: PaymentRecord['accountingRole'] = source.accountingRole === 'revenue' || source.accountingRole === 'expense' || source.accountingRole === 'deposit'
        ? source.accountingRole
        : category === 'deposit' || category === 'deposit_return' || paymentSource === 'deposit' || paymentSource === 'deposit_return'
            ? 'deposit'
            : type === 'expense' ? 'expense' : 'revenue';
    return {
        id: valueAsString(source.id) || fallbackId,
        propertyId: valueAsString(source.propertyId),
        leaseId: valueAsString(source.leaseId) || null,
        tenantId: valueAsString(source.tenantId) || null,
        type,
        category,
        amount: valueAsNumber(source.amount),
        dueDate: normalizeIsoDate(source.dueDate),
        paidDate: paidDate || null,
        status: source.status === 'pending' || source.status === 'late' ? source.status : 'paid',
        description: valueAsString(source.description),
        source: paymentSource,
        accountingRole,
        notes: valueAsString(source.notes),
        receiptNumber: valueAsString(source.receiptNumber) || null,
        createdAt: valueAsString(source.createdAt) || nowIso(),
        updatedAt: valueAsString(source.updatedAt) || nowIso(),
    };
}

function rebuildRelationsFromLeases(database: LocalDatabase): LocalDatabase {
    const db = clone(database);
    db.properties = db.properties.map((property) => ({
        ...property,
        relations: { ...property.relations, tenantIds: [], leaseIds: [] },
    }));
    db.tenants = db.tenants.map((tenant) => ({ ...tenant, leaseIds: [] }));
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

function makePropertyIdentifiersUnique(database: LocalDatabase): LocalDatabase {
    const seen = new Map<string, number>();
    return {
        ...database,
        properties: database.properties.map((property) => {
            const normalized = normalizePropertyIdentifier(property.formData.PropertyTitle);
            if (!normalized) return property;
            const count = seen.get(normalized) || 0;
            seen.set(normalized, count + 1);
            if (count === 0) return property;
            return {
                ...property,
                formData: normalizePropertyFormData({
                    ...property.formData,
                    PropertyTitle: `${property.formData.PropertyTitle} (${count + 1})`,
                }),
            };
        }),
    };
}

function repairRecoverableDatabase(database: LocalDatabase): LocalDatabase {
    return ensureAllLeasePaymentSchedules(
        repairRecoverablePayments(
            recalculateBuildingUnits(makePropertyIdentifiersUnique(rebuildRelationsFromLeases(database))),
        ),
    );
}

function generatedDedupScore(payment: PaymentRecord): string {
    const statusScore = payment.status === 'paid' ? '2' : payment.status === 'late' ? '1' : '0';
    return `${statusScore}|${payment.updatedAt || ''}|${payment.id}`;
}

export function repairRecoverablePayments(database: LocalDatabase, referenceDate = todayIso()): LocalDatabase {
    const leasesById = new Map(database.leases.map((lease) => [lease.id, lease]));
    const dedupedGenerated = new Map<string, PaymentRecord>();
    const manualPayments: PaymentRecord[] = [];

    for (const payment of database.payments) {
        const lease = payment.leaseId ? leasesById.get(payment.leaseId) : undefined;
        const generated = isGeneratedRentPayment(payment);
        const outOfContract = Boolean(lease && (payment.dueDate < lease.startDate || (payment.dueDate > lease.endDate && !lease.formData.LeaseRinnovoTacito)));
        if (generated && outOfContract) continue;

        let next: PaymentRecord = { ...payment };
        const futurePaid = next.status === 'paid' && (next.dueDate > referenceDate || Boolean(next.paidDate && next.paidDate > referenceDate));
        if (futurePaid) {
            next = { ...next, status: 'pending', paidDate: null };
        } else if (next.status !== 'paid' && next.paidDate) {
            next = { ...next, paidDate: null };
        } else if (next.status === 'paid' && !next.paidDate) {
            if (lease?.formData.LeasePaymentMethod === 'addebito' && next.dueDate <= referenceDate) {
                next = { ...next, paidDate: next.dueDate };
            } else {
                next = { ...next, status: next.dueDate < referenceDate ? 'late' : 'pending', paidDate: null };
            }
        }
        if (next.type === 'income' && next.status !== 'paid') {
            next = { ...next, status: next.dueDate < referenceDate ? 'late' : 'pending', paidDate: null };
        }

        if (!generated) {
            manualPayments.push(next);
            continue;
        }

        const key = `${next.leaseId}|${next.category}|${next.dueDate}`;
        const existing = dedupedGenerated.get(key);
        if (!existing || generatedDedupScore(next) > generatedDedupScore(existing)) {
            dedupedGenerated.set(key, next);
        }
    }

    return { ...database, payments: [...manualPayments, ...dedupedGenerated.values()] };
}

function normalizeV3Database(input: Record<string, unknown>, repair = false): LocalDatabase {
    const db = emptyDb(asObject(input.meta).source === 'migration-v1' || asObject(input.meta).source === 'migration-v2' ? asObject(input.meta).source as DatabaseSource : 'seed');
    db.meta = {
        schemaVersion: 3,
        seedVersion: valueAsNumber(asObject(input.meta).seedVersion, SEED_VERSION),
        createdAt: valueAsString(asObject(input.meta).createdAt) || nowIso(),
        updatedAt: valueAsString(asObject(input.meta).updatedAt) || nowIso(),
        source: db.meta.source,
    };
    db.properties = (Array.isArray(input.properties) ? input.properties : []).map((item, index) => normalizePropertyRecord(item, `property-${index + 1}`));
    db.buildings = (Array.isArray(input.buildings) ? input.buildings : []).map((item, index) => normalizeBuildingRecord(item, `building-${index + 1}`));
    db.tenants = (Array.isArray(input.tenants) ? input.tenants : []).map((item, index) => normalizeTenantRecord(item, `tenant-${index + 1}`));
    db.leases = (Array.isArray(input.leases) ? input.leases : []).map((item, index) => normalizeLeaseRecord(item, `lease-${index + 1}`));
    db.payments = (Array.isArray(input.payments) ? input.payments : []).map((item, index) => normalizePaymentRecord(item, `payment-${index + 1}`));
    db.contacts = (Array.isArray(input.contacts) ? input.contacts : []).map((item, index) => normalizeContactRecord(item, `contact-${index + 1}`));
    db.documents = (Array.isArray(input.documents) ? input.documents : []).map((item, index) => normalizeDocumentRecord(item, `document-${index + 1}`));
    db.reservations = Array.isArray(input.reservations) ? input.reservations as LocalDatabase['reservations'] : [];
    db.catalogs = Array.isArray(input.catalogs) ? input.catalogs as LocalDatabase['catalogs'] : [];
    db.inventory = Array.isArray(input.inventory) ? input.inventory as LocalDatabase['inventory'] : [];
    db.maintenance = Array.isArray(input.maintenance) ? input.maintenance as LocalDatabase['maintenance'] : [];
    db.tasks = Array.isArray(input.tasks) ? input.tasks as LocalDatabase['tasks'] : [];
    db.notes = Array.isArray(input.notes) ? input.notes as LocalDatabase['notes'] : [];
    db.messages = (Array.isArray(input.messages) ? input.messages : []).map((item, index) => normalizeMessageRecord(item, `message-${index + 1}`));
    db.candidates = Array.isArray(input.candidates) ? input.candidates as LocalDatabase['candidates'] : [];
    db.settings = clone(asObject(input.settings));
    db.userProfile = clone(asObject(input.userProfile));
    const drafts = asObject(input.drafts);
    db.drafts = {
        tenantForm: drafts.tenantForm ?? null,
        propertyForm: drafts.propertyForm ?? null,
        leaseForm: (drafts.leaseForm ?? null) as LocalDatabase['drafts']['leaseForm'],
    };
    validateStoredShape(db);
    const normalized = repair ? repairRecoverableDatabase(db) : recalculateBuildingUnits(db);
    if (!repair) assertDatabaseIntegrity(normalized);
    return normalized;
}

function validateStoredShape(database: LocalDatabase): void {
    if (database.meta.schemaVersion !== 3) throw new Error('Schema database non valido.');
    if (!Array.isArray(database.properties) || !Array.isArray(database.buildings) || !Array.isArray(database.tenants) || !Array.isArray(database.leases) || !Array.isArray(database.payments)) {
        throw new Error('Collezioni database essenziali mancanti.');
    }
}

function parseStoredDb(raw: string): LocalDatabase {
    const parsed = normalizeV3Database(JSON.parse(raw) as Record<string, unknown>, true);
    return parsed;
}

function emitDbChange(): void {
    window.dispatchEvent(new Event(DB_EVENT));
}

function setCachedDatabase(database: LocalDatabase): LocalDatabase {
    inMemoryDatabase = clone(database);
    return clone(database);
}

function localStorageKeys(): string[] {
    return Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
        .filter((key): key is string => Boolean(key));
}

function corruptedBackupKeys(): string[] {
    return localStorageKeys().filter((key) => key.startsWith(CORRUPTED_DB_PREFIX));
}

function writeLocalStorage(key: string, value: string): void {
    try {
        window.localStorage.setItem(key, value);
    } catch (error) {
        if (isQuotaExceededError(error)) throw new LocalStorageQuotaError('write', key, error);
        throw error;
    }
}

function readJsonKey(key: string): unknown | null {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as unknown;
    } catch (error) {
        console.warn('[local-db] sorgente ignorata: JSON non leggibile', { key, error });
        return null;
    }
}

function readDraftKey(key: string): unknown | null {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as unknown;
    } catch (error) {
        console.warn('[local-db] bozza legacy ignorata: JSON non leggibile', { key, error });
        return null;
    }
}

function tryNormalizeSource(key: string, source: DatabaseSource): LocalDatabase | null {
    const stored = readJsonKey(key);
    if (!stored) return null;
    try {
        return migrateFromUnknown(stored, source);
    } catch (error) {
        console.warn('[local-db] sorgente non utilizzabile', { key, source, error });
        return null;
    }
}

function legacyCorruptedSources(): Array<{ key: string; source: DatabaseSource }> {
    return corruptedBackupKeys().sort().reverse().map((key) => ({ key, source: 'migration-v2' as DatabaseSource }));
}

function attachLegacyDrafts(database: LocalDatabase): LocalDatabase {
    return {
        ...database,
        drafts: {
            tenantForm: database.drafts.tenantForm ?? readDraftKey(TENANT_DRAFT_KEY),
            propertyForm: database.drafts.propertyForm ?? readDraftKey(PROPERTY_DRAFT_KEY),
            leaseForm: database.drafts.leaseForm ?? null,
        },
    };
}

function legacyKeysToRemove(): string[] {
    return [...LEGACY_LOCAL_DB_KEYS, ...corruptedBackupKeys()];
}

function removeLegacyKeysAfterVerifiedCanonical(): void {
    for (const key of legacyKeysToRemove()) {
        window.localStorage.removeItem(key);
    }
}

function persistCanonicalDatabase(database: LocalDatabase): boolean {
    try {
        writeLocalStorage(LOCAL_DB_KEY, JSON.stringify(database));
        const verified = window.localStorage.getItem(LOCAL_DB_KEY);
        if (!verified) throw new Error('Database canonico non rileggibile dopo la scrittura.');
        parseStoredDb(verified);
        removeLegacyKeysAfterVerifiedCanonical();
        setCachedDatabase(database);
        emitDbChange();
        return true;
    } catch (error) {
        console.warn('[local-db] persistenza canonica non riuscita, uso cache in memoria', {
            key: LOCAL_DB_KEY,
            quota: isQuotaExceededError(error),
            error,
        });
        setCachedDatabase(database);
        return false;
    }
}

function canonicalFromSources(): LocalDatabase {
    const canonicalRaw = window.localStorage.getItem(LOCAL_DB_KEY);
    if (canonicalRaw) {
        try {
            const parsed = parseStoredDb(canonicalRaw);
            const normalizedRaw = JSON.stringify(parsed);
            if (normalizedRaw !== canonicalRaw) persistCanonicalDatabase(parsed);
            else {
                removeLegacyKeysAfterVerifiedCanonical();
                setCachedDatabase(parsed);
            }
            return clone(inMemoryDatabase || parsed);
        } catch (error) {
            console.warn('[local-db] props24.localDb non utilizzabile, provo sorgenti legacy', { error });
        }
    }

    const sources: Array<{ key: string; source: DatabaseSource }> = [
        { key: OLD_DB_KEY_V3, source: 'migration-v2' },
        { key: PREVIOUS_DB_KEY, source: 'migration-v2' },
        { key: LEGACY_DB_KEY, source: 'migration-v1' },
        ...legacyCorruptedSources(),
    ];

    for (const item of sources) {
        const migrated = tryNormalizeSource(item.key, item.source);
        if (migrated) {
            const database = attachLegacyDrafts(migrated);
            persistCanonicalDatabase(database);
            return clone(inMemoryDatabase || database);
        }
    }

    const seeded = attachLegacyDrafts(migrateFromUnknown(seedDatabase, 'seed'));
    persistCanonicalDatabase(seeded);
    return clone(inMemoryDatabase || seeded);
}

export function initializeJsonDb(): LocalDatabase {
    if (inMemoryDatabase) return clone(inMemoryDatabase);
    return canonicalFromSources();
}

export function getJsonDb(): LocalDatabase {
    return initializeJsonDb();
}

export function saveJsonDb(database: LocalDatabase): LocalDatabase {
    const nextDb = normalizeV3Database({ ...database, meta: { ...database.meta, updatedAt: nowIso() } }, false);
    assertDatabaseIntegrity(nextDb);
    writeLocalStorage(LOCAL_DB_KEY, JSON.stringify(nextDb));
    setCachedDatabase(nextDb);
    emitDbChange();
    return clone(nextDb);
}

export function resetJsonDb(): LocalDatabase {
    const seeded = migrateFromUnknown(seedDatabase, 'seed');
    writeLocalStorage(LOCAL_DB_KEY, JSON.stringify(seeded));
    setCachedDatabase(seeded);
    emitDbChange();
    return clone(seeded);
}

export function getDraft<Name extends keyof LocalDatabase['drafts']>(name: Name): LocalDatabase['drafts'][Name] {
    return clone(getJsonDb().drafts[name]) as LocalDatabase['drafts'][Name];
}

export function setDraft<Name extends keyof LocalDatabase['drafts']>(name: Name, value: LocalDatabase['drafts'][Name]): void {
    const db = getJsonDb();
    db.drafts = { ...db.drafts, [name]: clone(value) };
    saveJsonDb(db);
}

export function clearDraft<Name extends keyof LocalDatabase['drafts']>(name: Name): void {
    setDraft(name, null);
}
export function getCollection<Name extends LocalDatabaseCollectionName>(name: Name): LocalDatabase[Name] {
    return clone(getJsonDb()[name]);
}

export function getRecordById<Name extends LocalDatabaseCollectionName>(
    name: Name,
    id: string,
): LocalDatabase[Name][number] | null {
    const collection = getJsonDb()[name] as Array<{ id?: string }>;
    const record = collection.find((item) => item.id === id);
    return record ? clone(record as LocalDatabase[Name][number]) : null;
}

export function createRecord<Name extends LocalDatabaseCollectionName>(
    name: Name,
    record: LocalDatabase[Name][number] & { id?: string },
): LocalDatabase[Name][number] {
    const db = getJsonDb();
    const collection = db[name] as Array<{ id?: string }>;
    if (record.id && collection.some((item) => item.id === record.id)) throw new Error(`Record duplicato nella collezione ${String(name)}: ${record.id}`);
    (db[name] as Array<LocalDatabase[Name][number]>).push(clone(record as LocalDatabase[Name][number]));
    saveJsonDb(db);
    return clone(record as LocalDatabase[Name][number]);
}

export function updateRecord<Name extends LocalDatabaseCollectionName>(
    name: Name,
    id: string,
    patch: Partial<LocalDatabase[Name][number]>,
): LocalDatabase[Name][number] | null {
    const db = getJsonDb();
    const collection = db[name] as Array<{ id?: string }>;
    const index = collection.findIndex((item) => item.id === id);
    if (index === -1) return null;
    collection[index] = { ...collection[index], ...clone(patch) };
    saveJsonDb(db);
    return clone(collection[index] as LocalDatabase[Name][number]);
}

export function deleteRecord<Name extends LocalDatabaseCollectionName>(name: Name, id: string): boolean {
    const db = getJsonDb();
    const collection = db[name] as Array<{ id?: string }>;
    const nextCollection = collection.filter((item) => item.id !== id);
    if (nextCollection.length === collection.length) return false;
    (db[name] as Array<LocalDatabase[Name][number]>) = nextCollection as Array<LocalDatabase[Name][number]>;
    saveJsonDb(db);
    return true;
}

export function upsertRecord<Name extends LocalDatabaseCollectionName>(
    name: Name,
    record: LocalDatabase[Name][number] & { id?: string },
): LocalDatabase[Name][number] {
    if (record.id && getRecordById(name, record.id)) {
        const updated = updateRecord(name, record.id, record);
        if (!updated) throw new Error(`Impossibile aggiornare il record ${record.id}`);
        return updated;
    }
    return createRecord(name, record);
}

export function replaceCollection<Name extends LocalDatabaseCollectionName>(
    name: Name,
    records: LocalDatabase[Name],
): LocalDatabase[Name] {
    const db = getJsonDb();
    db[name] = clone(records) as LocalDatabase[Name];
    saveJsonDb(db);
    return clone(records);
}

export function subscribeJsonDb(callback: () => void): () => void {
    const handleLocal = () => callback();
    const handleStorage = (event: StorageEvent) => {
        if (event.key === LOCAL_DB_KEY) {
            inMemoryDatabase = null;
            callback();
        }
    };
    window.addEventListener(DB_EVENT, handleLocal);
    window.addEventListener('storage', handleStorage);
    return () => {
        window.removeEventListener(DB_EVENT, handleLocal);
        window.removeEventListener('storage', handleStorage);
    };
}
