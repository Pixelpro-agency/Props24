import type { PropertyFormData, StoredLocalFile } from '../components/property-form/schema';
import type { EmergencyContact, Guarantor, TenantDocument, TenantInvitation } from '../types/tenant';
import type { LeaseBillingPeriod, LeaseDraftSnapshot, LeaseFormData } from '../landlord/leases/schema/leaseFormSchema';

export type DatabaseSource = 'seed' | 'migration-v1' | 'migration-v2';

export interface DbMeta {
    schemaVersion: 3;
    seedVersion: number;
    createdAt: string;
    updatedAt: string;
    source: DatabaseSource;
}

export interface PropertyNoteRecord {
    id: string;
    text: string;
    createdAt: string;
}

export interface PropertyActivityRecord {
    id: string;
    type: 'payment' | 'lease' | 'maintenance' | 'note' | 'general';
    description: string;
    date: string;
}

export interface BuildingRecord {
    id: string;
    createdAt: string;
    updatedAt: string;
    archived: boolean;
    name: string;
    address: string;
    city: string;
    postalCode: string;
    county: string;
    state: string;
    country: string;
    size: number | null;
    unitsCount: number;
    description: string;
}

export interface PropertyRecord {
    id: string;
    createdAt: string;
    updatedAt: string;
    archived: boolean;
    formData: PropertyFormData;
    relations: {
        buildingId: string | null;
        tenantIds: string[];
        leaseIds: string[];
    };
    notes: PropertyNoteRecord[];
    activities: PropertyActivityRecord[];
    coordinates?: { lat: number; lng: number };
    legacy?: Record<string, unknown>;
}

export interface TenantRecord {
    id: string;
    createdAt: string;
    updatedAt: string;
    type: 'person' | 'company';
    photo: StoredLocalFile | null;
    avatarColor: string;
    title: '' | 'Miss' | 'Mrs' | 'Mr';
    firstName: string;
    middleName: string;
    lastName: string;
    birthDate: string;
    birthPlace: string;
    nationality: string;
    fiscalCode: string;
    vatNumberPersonal: string;
    profession: string;
    monthlyIncome: number | null;
    idType: '' | 'ID' | 'passport' | 'drivinglicense' | 'residencepermit';
    idNumber: string;
    idExpiry: string;
    identityDocumentFile: StoredLocalFile | null;
    companyName: string;
    vatNumber: string;
    siret: string;
    capital: string;
    companyDescription: string;
    email: string;
    emailSecondary: string;
    mobilePhone: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    zip: string;
    state: string;
    country: string;
    proEmployer: string;
    proAddress: string;
    proCity: string;
    proZip: string;
    proState: string;
    proCountry: string;
    proPhone: string;
    bankName: string;
    bankAddress: string;
    bankCity: string;
    bankZip: string;
    bankCountry: string;
    bankIBAN: string;
    bankSwiftBic: string;
    leaveAddress: string;
    notes: string;
    status: 'attivo' | 'candidato' | 'inattivo';
    archived: boolean;
    leaseIds: string[];
    guarantors: Guarantor[];
    emergencyContacts: EmergencyContact[];
    documents: TenantDocument[];
    invitation: TenantInvitation;
    legacy?: Record<string, unknown>;
}

export interface LeaseRecord {
    id: string;
    propertyId: string;
    tenantIds: string[];
    guarantorIds: string[];
    leaseType: string;
    leaseTypeLabel: string;
    startDate: string;
    endDate: string;
    status: 'attiva' | 'inattiva' | 'terminata';
    rentAmount: number;
    utilitiesAmount: number;
    depositAmount: number;
    billingPeriod: LeaseBillingPeriod;
    formData: LeaseFormData;
    archived: boolean;
    createdAt: string;
    updatedAt: string;
    notes: string;
    activity: LeaseActivityRecord[];
    signatureProcess: LeaseSignatureProcess | null;
    termination: LeaseTermination | null;
    financialState: LeaseFinancialState;
    legacy?: Record<string, unknown>;
}

export interface LeaseActivityRecord {
    id: string;
    type: 'created' | 'updated' | 'status' | 'archive' | 'restore' | 'payment' | 'document' | 'signature' | 'communication' | 'note';
    description: string;
    createdAt: string;
}

export interface LeaseSignatureSigner {
    key: string;
    role: 'landlord' | 'tenant' | 'guarantor';
    entityId: string | null;
    nameSnapshot: string;
    status: 'pending' | 'signed';
    signedAt: string | null;
    signatureDataUrl: string | null;
}

export interface LeaseSignatureProcess {
    status: 'in_progress' | 'completed';
    startedAt: string;
    completedAt: string | null;
    contractDocumentId: string;
    signers: LeaseSignatureSigner[];
}

export interface LeaseTermination {
    date: string;
    reason: string;
    createdAt: string;
}

export interface LeaseFinancialState {
    depositPaymentId: string | null;
    depositReturnPaymentId: string | null;
    prepaidAppliedAmount: number;
    prepaidAllocations: Array<{
        paymentId: string;
        amount: number;
        allocatedAt: string;
        appliedAt: string | null;
    }>;
}

export interface PaymentRecord {
    id: string;
    propertyId: string;
    leaseId: string | null;
    tenantId: string | null;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    dueDate: string;
    paidDate: string | null;
    status: 'paid' | 'pending' | 'late';
    description: string;
    source: 'generated' | 'manual' | 'deposit' | 'deposit_return';
    accountingRole: 'revenue' | 'expense' | 'deposit';
    notes: string;
    receiptNumber: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ContactRecord {
    id: string;
    type: 'person' | 'company';
    companyName: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    birthPlace: string;
    fiscalCode: string;
    vatNumber: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
    country: string;
    notes: string;
    archived: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DocumentRecord {
    id: string;
    ownerType: 'lease' | 'global';
    ownerId: string | null;
    sourceDocumentId: string | null;
    categoryId: number;
    categoryLabel: string;
    title: string;
    description: string;
    isShared: boolean;
    file: StoredLocalFile | null;
    createdAt: string;
    updatedAt: string;
}

export interface MessageRecord {
    id: string;
    entityType: 'lease';
    entityId: string;
    channel: 'email';
    status: 'prepared';
    recipientTenantIds: string[];
    recipients: Array<{ name: string; email: string }>;
    subject: string;
    body: string;
    createdAt: string;
}

export interface EmptyRecord {
    id: string;
}

export interface LocalDatabase {
    meta: DbMeta;
    properties: PropertyRecord[];
    buildings: BuildingRecord[];
    tenants: TenantRecord[];
    leases: LeaseRecord[];
    payments: PaymentRecord[];
    contacts: ContactRecord[];
    documents: DocumentRecord[];
    reservations: EmptyRecord[];
    catalogs: EmptyRecord[];
    inventory: EmptyRecord[];
    maintenance: EmptyRecord[];
    tasks: EmptyRecord[];
    notes: EmptyRecord[];
    messages: MessageRecord[];
    candidates: EmptyRecord[];
    settings: Record<string, unknown>;
    userProfile: Record<string, unknown>;
    drafts: {
        tenantForm: unknown | null;
        propertyForm: unknown | null;
        leaseForm: LeaseDraftSnapshot | null;
    };
}

export type LocalDatabaseCollectionName = {
    [Key in keyof LocalDatabase]: LocalDatabase[Key] extends unknown[] ? Key : never;
}[keyof LocalDatabase];
