import type { TenantDetail, TenantLease } from '../types/tenantDetail';
import type { Tenant } from '../types/tenant';
import type { TenantInvitation } from '../types/tenant';
import { generateId, getJsonDb, saveJsonDb } from './jsonDb';
import type { LeaseRecord, PropertyRecord, TenantRecord } from './database.types';
import { calculateTenantBalance, classifyLease, classifyTenantStatus, currentLeasesForTenant, tenantDisplayName } from './dataSelectors';
import { calculateTenantAttachmentBytes, MAX_TENANT_TOTAL_ATTACHMENT_BYTES, normalizeTenantFormData, type TenantFormData } from '../components/tenant-form/schema';
import { normalizeFiscalCode } from './businessRules';
import { TenantDeleteBlockedByLeaseError, TenantInviteMissingEmailError, TenantStorageQuotaError } from './databaseErrors';

export { findTenantByFiscalCode } from './businessRules';

export type TenantStatus = 'attivo' | 'candidato' | 'inattivo';

export interface TenantListItem {
    id: string;
    type: 'person' | 'company';
    avatarColor: string;
    displayName: string;
    subtitle: string;
    propertyId: string | null;
    propertyName: string | null;
    mobilePhone: string | null;
    email: string | null;
    balance: number;
    status: TenantStatus;
    invitationStatus: TenantInvitation['status'];
    invitationEmail: string | null;
    canSendInvitation: boolean;
    archived: boolean;
}

export const TENANT_STATUS_CONFIG: Record<TenantStatus, { label: string; color: string; textColor: string }> = {
    attivo: { label: 'Attivo', color: 'bg-green-100', textColor: 'text-green-700' },
    candidato: { label: 'Candidato', color: 'bg-yellow-100', textColor: 'text-yellow-700' },
    inattivo: { label: 'Inattivo', color: 'bg-gray-100', textColor: 'text-gray-600' },
};

function propertyTitle(property: PropertyRecord | undefined): string | null {
    return property?.formData.PropertyTitle || null;
}

function leaseStatus(status: LeaseRecord['status']): TenantLease['status'] {
    if (status === 'terminata') return 'Terminata';
    if (status === 'inattiva') return 'Inattiva';
    return 'Attiva';
}

function mapLeaseToTenantLease(db: ReturnType<typeof getJsonDb>, lease: LeaseRecord): TenantLease {
    const property = db.properties.find((item) => item.id === lease.propertyId);
    return {
        id: lease.id,
        propertyName: property?.formData.PropertyTitle || 'Unità senza nome',
        address: property ? [property.formData.PropertyAddress, property.formData.PropertyPostalCode, property.formData.PropertyCity].filter(Boolean).join(', ') : '',
        contractType: lease.leaseTypeLabel || 'Locazione',
        status: leaseStatus(lease.status),
        dateRange: { start: lease.startDate, end: lease.endDate },
        rent: { amount: lease.rentAmount, currency: 'EUR', frequency: lease.billingPeriod },
        expenses: { amount: lease.utilitiesAmount, currency: 'EUR', type: 'Spese' },
    };
}

function mapTenantToListItem(tenant: TenantRecord): TenantListItem {
    const db = getJsonDb();
    const leases = currentLeasesForTenant(db, tenant.id);
    const firstLease = leases[0];
    const property = firstLease ? db.properties.find((item) => item.id === firstLease.propertyId) : undefined;
    const status = classifyTenantStatus(db, tenant);

    return {
        id: tenant.id,
        type: tenant.type,
        avatarColor: tenant.avatarColor,
        displayName: tenantDisplayName(tenant),
        subtitle: [tenant.address1, tenant.zip, tenant.city].filter(Boolean).join(', '),
        propertyId: property?.id || null,
        propertyName: propertyTitle(property),
        mobilePhone: tenant.mobilePhone || tenant.phone || null,
        email: tenant.email || null,
        balance: calculateTenantBalance(db, tenant.id),
        status,
        invitationStatus: tenant.invitation.status,
        invitationEmail: tenant.invitation.email || tenant.email || null,
        canSendInvitation: Boolean((tenant.invitation.email || tenant.email).trim()) && tenant.invitation.status !== 'accepted',
        archived: tenant.archived,
    };
}

function stringValue(value: string | undefined | null): string {
    return String(value ?? '');
}

export function createTenant(formDataInput: TenantFormData): TenantRecord {
    const formData = normalizeTenantFormData(formDataInput);
    const timestamp = new Date().toISOString();
    const db = getJsonDb();
    if (calculateTenantAttachmentBytes(formData) > MAX_TENANT_TOTAL_ATTACHMENT_BYTES) throw new TenantStorageQuotaError();
    const record: TenantRecord = {
        id: generateId('tenant'),
        createdAt: timestamp,
        updatedAt: timestamp,
        type: formData.TenantType,
        photo: formData.TenantPhoto,
        avatarColor: formData.TenantAvatarHexColor || '#3b82f6',
        title: formData.TenantTitle === 'Miss' || formData.TenantTitle === 'Mrs' || formData.TenantTitle === 'Mr' ? formData.TenantTitle : '',
        firstName: formData.TenantFirstName.trim(),
        middleName: stringValue(formData.TenantMiddleName).trim(),
        lastName: formData.TenantLastName.trim(),
        birthDate: stringValue(formData.TenantBirthDate),
        birthPlace: stringValue(formData.TenantBirthPlace),
        nationality: stringValue(formData.TenantNationality),
        fiscalCode: normalizeFiscalCode(formData.TenantFiscalCode),
        vatNumberPersonal: stringValue(formData.TenantVatNumberPersonal),
        profession: stringValue(formData.TenantProfession),
        monthlyIncome: formData.TenantRevenus,
        idType: formData.TenantIDType === 'ID' || formData.TenantIDType === 'passport' || formData.TenantIDType === 'drivinglicense' || formData.TenantIDType === 'residencepermit' ? formData.TenantIDType : '',
        idNumber: stringValue(formData.TenantIDNumber),
        idExpiry: stringValue(formData.TenantIDExpiry),
        identityDocumentFile: formData.TenantIDCard,
        companyName: stringValue(formData.TenantCompanyName),
        vatNumber: stringValue(formData.TenantVatNumber),
        siret: stringValue(formData.TenantSiret),
        capital: stringValue(formData.TenantCapital),
        companyDescription: stringValue(formData.TenantCompanyDescription),
        email: stringValue(formData.TenantEmail),
        emailSecondary: stringValue(formData.TenantEmailSecond),
        mobilePhone: stringValue(formData.TenantMobilePhoneNat),
        phone: stringValue(formData.TenantPhoneNat),
        address1: stringValue(formData.TenantAddress1),
        address2: stringValue(formData.TenantAddress2),
        city: stringValue(formData.TenantCity),
        zip: stringValue(formData.TenantZip),
        state: stringValue(formData.TenantState),
        country: stringValue(formData.TenantCountry),
        proEmployer: stringValue(formData.TenantProEmployer),
        proAddress: stringValue(formData.TenantProAddress),
        proCity: stringValue(formData.TenantProCity),
        proZip: stringValue(formData.TenantProZip),
        proState: stringValue(formData.TenantProState),
        proCountry: stringValue(formData.TenantProCountry),
        proPhone: stringValue(formData.TenantProPhoneNat),
        bankName: stringValue(formData.TenantBankName),
        bankAddress: stringValue(formData.TenantBankAddress),
        bankCity: stringValue(formData.TenantBankCity),
        bankZip: stringValue(formData.TenantBankZip),
        bankCountry: stringValue(formData.TenantBankCountry),
        bankIBAN: stringValue(formData.TenantBankIBAN).toUpperCase(),
        bankSwiftBic: stringValue(formData.TenantBankSwiftBic).toUpperCase(),
        leaveAddress: stringValue(formData.TenantLeaveAddress),
        notes: stringValue(formData.TenantNotes),
        status: 'inattivo',
        archived: false,
        leaseIds: [],
        guarantors: formData.TenantGuarantors,
        emergencyContacts: formData.TenantEmergencyContacts,
        documents: formData.TenantDocuments,
        invitation: {
            status: 'not_sent',
            email: stringValue(formData.TenantEmail),
            sentAt: null,
            acceptedAt: null,
        },
    };

    db.tenants.push(record);
    return saveJsonDb(db).tenants.find((tenant) => tenant.id === record.id) as TenantRecord;
}

export function sendTenantInvite(tenantId: string): TenantRecord {
    const db = getJsonDb();
    const tenant = db.tenants.find((item) => item.id === tenantId);
    if (!tenant) throw new Error('Inquilino non trovato.');
    if (!tenant.email.trim()) throw new TenantInviteMissingEmailError(tenantId);
    const timestamp = new Date().toISOString();
    tenant.invitation = {
        status: 'pending',
        email: tenant.email,
        sentAt: timestamp,
        acceptedAt: null,
    };
    tenant.updatedAt = timestamp;
    return saveJsonDb(db).tenants.find((item) => item.id === tenantId) as TenantRecord;
}

export function deleteTenantById(tenantId: string): void {
    const db = getJsonDb();
    const tenant = db.tenants.find((item) => item.id === tenantId);
    if (!tenant) throw new Error('Inquilino non trovato.');
    const linkedLease = db.leases.find((lease) => lease.tenantIds.includes(tenantId));
    if (linkedLease) throw new TenantDeleteBlockedByLeaseError(tenantId);

    db.tenants = db.tenants.filter((item) => item.id !== tenantId);
    db.payments = db.payments.map((payment) => (
        payment.tenantId === tenantId ? { ...payment, tenantId: null } : payment
    ));
    saveJsonDb(db);
}

export function listTenants(): TenantListItem[] {
    return getJsonDb().tenants.map(mapTenantToListItem);
}

export function getTenantById(id: string): TenantDetail | null {
    const db = getJsonDb();
    const tenant = db.tenants.find((item) => item.id === id);
    if (!tenant) return null;

    const leases = db.leases.filter((lease) => lease.tenantIds.includes(tenant.id));
    const currentLeaseRecord = leases.find((lease) => classifyLease(lease) === 'current') || null;
    const futureLeaseRecords = leases.filter((lease) => classifyLease(lease) === 'future');
    const historicalLeaseRecords = leases.filter((lease) => classifyLease(lease) === 'historical');
    const archivedLeaseRecords = leases.filter((lease) => classifyLease(lease) === 'archived');
    const balance = calculateTenantBalance(db, tenant.id);
    const baseTenant: Tenant = {
        id: tenant.id,
        type: tenant.type,
        avatarColor: tenant.avatarColor,
        photo: tenant.photo,
        avatarUrl: tenant.photo?.dataUrl,
        title: tenant.title,
        firstName: tenant.firstName,
        middleName: tenant.middleName,
        lastName: tenant.lastName,
        birthDate: tenant.birthDate,
        birthPlace: tenant.birthPlace,
        nationality: tenant.nationality,
        fiscalCode: tenant.fiscalCode,
        vatNumberPersonal: tenant.vatNumberPersonal,
        companyName: tenant.companyName,
        vatNumber: tenant.vatNumber,
        siret: tenant.siret,
        capital: tenant.capital,
        companyDescription: tenant.companyDescription,
        email: tenant.email,
        emailSecondary: tenant.emailSecondary,
        mobilePhone: tenant.mobilePhone,
        phone: tenant.phone,
        address1: tenant.address1,
        address2: tenant.address2,
        city: tenant.city,
        zip: tenant.zip,
        state: tenant.state,
        country: tenant.country,
        profession: tenant.profession,
        monthlyIncome: tenant.monthlyIncome ?? undefined,
        idType: tenant.idType,
        idNumber: tenant.idNumber,
        idExpiry: tenant.idExpiry,
        identityDocumentFile: tenant.identityDocumentFile,
        proEmployer: tenant.proEmployer,
        proAddress: tenant.proAddress,
        proCity: tenant.proCity,
        proZip: tenant.proZip,
        proState: tenant.proState,
        proCountry: tenant.proCountry,
        proPhone: tenant.proPhone,
        bankName: tenant.bankName,
        bankAddress: tenant.bankAddress,
        bankCity: tenant.bankCity,
        bankZip: tenant.bankZip,
        bankCountry: tenant.bankCountry,
        bankIBAN: tenant.bankIBAN,
        bankSwiftBic: tenant.bankSwiftBic,
        leaveAddress: tenant.leaveAddress,
        notes: tenant.notes,
        guarantors: tenant.guarantors as Tenant['guarantors'],
        emergencyContacts: tenant.emergencyContacts as Tenant['emergencyContacts'],
        documents: tenant.documents as Tenant['documents'],
        invitation: tenant.invitation,
    };

    return {
        ...baseTenant,
        addresses: {
            tenantAddress: {
                street: [tenant.address1, tenant.address2].filter(Boolean).join(' '),
                city: tenant.city,
                zip: tenant.zip,
                country: tenant.country,
                displayName: [tenant.address1, tenant.zip, tenant.city].filter(Boolean).join(', '),
            },
            rentedProperty: currentLeaseRecord ? (() => {
                const property = db.properties.find((item) => item.id === currentLeaseRecord.propertyId);
                return property ? {
                    street: property.formData.PropertyAddress,
                    city: property.formData.PropertyCity,
                    zip: property.formData.PropertyPostalCode,
                    country: property.formData.PropertyCountry,
                    displayName: [property.formData.PropertyAddress, property.formData.PropertyPostalCode, property.formData.PropertyCity].filter(Boolean).join(', '),
                } : null;
            })() : null,
        },
        employment: tenant.profession ? { profession: tenant.profession } : undefined,
        loginStatus: { status: tenant.invitation.status === 'pending' ? 'pending_invitation' : classifyTenantStatus(db, tenant) === 'attivo' ? 'active' : 'inactive' },
        inviteLink: tenant.invitation.status === 'pending' ? {
            url: `${window.location.origin}/tenant/invite/${tenant.id}`,
            description: "Link di invito per l'accesso del locatario.",
        } : undefined,
        finances: {
            income: { amount: tenant.monthlyIncome ?? 0, type: 'income' },
            balance: {
                amount: balance,
                type: balance < 0 ? 'debt' : balance > 0 ? 'credit' : 'neutral',
                status: balance < 0 ? 'negative' : balance > 0 ? 'positive' : 'neutral',
            },
        },
        currentLease: currentLeaseRecord ? mapLeaseToTenantLease(db, currentLeaseRecord) : null,
        futureLeases: futureLeaseRecords.map((lease) => mapLeaseToTenantLease(db, lease)),
        historicalLeases: historicalLeaseRecords.map((lease) => mapLeaseToTenantLease(db, lease)),
        archivedLeases: archivedLeaseRecords.map((lease) => mapLeaseToTenantLease(db, lease)),
        leases: leases.map((lease) => mapLeaseToTenantLease(db, lease)),
        messages: [],
        activityHistory: [],
    };
}
