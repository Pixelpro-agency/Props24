import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultTenantValues, normalizeTenantFormData, type TenantFormData } from '../../src/components/tenant-form/schema';
import { tenantDraftDefinition } from '../../src/components/tenant-form/tenantDraftDefinition';
import type { ContactRecord, LocalDatabase, TenantRecord } from '../../src/db/database.types';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const KEY = 'props24.localDb.user-001';
const NOW = '2026-08-31T12:00:00.000Z';
const PERSON_IDS = [
    'tenant-guarantor-roundtrip-person',
    'tenant-emergency-roundtrip-person',
    'tenant-photo-roundtrip-person',
    'tenant-file-id-front-roundtrip',
    'tenant-file-id-back-roundtrip',
    'tenant-document-roundtrip-person',
    'tenant-file-document-roundtrip-person',
];
const COMPANY_ID = 'tenant-file-registry-roundtrip';

const storedFile = (id: string) => ({
    id,
    name: 'file.pdf',
    type: 'application/pdf',
    size: 7,
    lastModified: 123,
    dataUrl: 'data:application/pdf;base64,WA==',
});

const personPayload = (): TenantFormData => normalizeTenantFormData({
    ...defaultTenantValues,
    TenantType: 'person',
    TenantFirstName: 'Ada',
    TenantLastName: 'Lovelace',
    TenantPhoto: { ...storedFile(PERSON_IDS[2]), name: 'photo.png', type: 'image/png' },
    TenantIDCard: storedFile(PERSON_IDS[3]),
    TenantIDCardBack: storedFile(PERSON_IDS[4]),
    TenantGuarantors: [{
        id: PERSON_IDS[0], contactId: 'contact-guarantor', contactType: 'person', companyName: '',
        firstName: 'Grace', lastName: 'Hopper', birthDate: '', birthPlace: '', email: '', phone: '111',
        address: '', city: '', zip: '', country: 'IT', comments: '',
    }],
    TenantEmergencyContacts: [{
        id: PERSON_IDS[1], contactId: 'contact-emergency', contactType: 'person', companyName: '',
        firstName: 'Alan', lastName: 'Turing', email: '', phone: '222', address: '', city: '', zip: '',
        country: 'IT', comments: '', isPrimary: true,
    }],
    TenantDocuments: [{
        id: PERSON_IDS[5], fileName: 'tenant.pdf', categoryId: 1, categoryLabel: 'Documento',
        description: '', uploadDate: NOW, fileSize: 7, isShared: false, fileUrl: '',
        file: storedFile(PERSON_IDS[6]),
    }],
});

const companyPayload = (): TenantFormData => normalizeTenantFormData({
    ...defaultTenantValues,
    TenantType: 'company',
    TenantCompanyName: 'Analytical Engines Ltd',
    TenantCompanyRegistryFile: storedFile(COMPANY_ID),
});

const idsOfPersonForm = (value: TenantFormData) => [
    value.TenantGuarantors[0]?.id,
    value.TenantEmergencyContacts[0]?.id,
    value.TenantPhoto?.id,
    value.TenantIDCard?.id,
    value.TenantIDCardBack?.id,
    value.TenantDocuments[0]?.id,
    value.TenantDocuments[0]?.file?.id,
];

const idsOfPersonRecord = (value: TenantRecord) => [
    value.guarantors[0]?.id,
    value.emergencyContacts[0]?.id,
    value.photo?.id,
    value.identityDocumentFile?.id,
    value.identityDocumentBackFile?.id,
    value.documents[0]?.id,
    value.documents[0]?.file?.id,
];

const linkedContact = (id: string, firstName: string, lastName: string, phone: string): ContactRecord => ({
    id, type: 'person', companyName: '', firstName, lastName, birthDate: '', birthPlace: '', fiscalCode: '',
    vatNumber: '', email: '', phone, address: '', city: '', zip: '', country: 'IT', notes: '', archived: false,
    createdAt: NOW, updatedAt: NOW,
});

const emptyDb = (): LocalDatabase => ({
    meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' },
    properties: [], buildings: [], tenants: [], leases: [], payments: [], contacts: [
        linkedContact('contact-guarantor', 'Grace', 'Hopper', '111'),
        linkedContact('contact-emergency', 'Alan', 'Turing', '222'),
    ], documents: [],
    reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [],
    candidates: [], settings: {}, userProfile: {}, drafts: [],
});

async function modules(storage: MemoryStorage) {
    installJsonDbWindow(storage);
    vi.resetModules();
    const db = await import('../../src/db/jsonDb');
    const repo = await import('../../src/db/tenantRepository');
    db.setActiveDatabaseAccount('user-001');
    return { db, repo };
}

afterEach(() => {
    uninstallJsonDbWindow();
    vi.resetModules();
});

describe('round-trip consolidato degli ID annidati Tenant C2', () => {
    it('normalization è idempotente e draft preserva ID canonici e legacy byte-for-byte', () => {
        const person = personPayload();
        const once = normalizeTenantFormData(person);
        const twice = normalizeTenantFormData(once);
        expect(idsOfPersonForm(once)).toEqual(PERSON_IDS);
        expect(idsOfPersonForm(twice)).toEqual(PERSON_IDS);
        expect(idsOfPersonForm(tenantDraftDefinition.parse(person, 1))).toEqual(PERSON_IDS);
        expect(tenantDraftDefinition.parse(companyPayload(), 1).TenantCompanyRegistryFile?.id).toBe(COMPANY_ID);

        const legacy = personPayload();
        legacy.TenantGuarantors[0].id = 'g-old-123';
        legacy.TenantEmergencyContacts[0].id = 'ec-old-123';
        legacy.TenantPhoto!.id = 'photo-old-123';
        legacy.TenantIDCard!.id = 'front-old-123';
        legacy.TenantIDCardBack!.id = 'back-old-123';
        legacy.TenantDocuments[0].id = 'document-old-123';
        legacy.TenantDocuments[0].file!.id = 'document-file-old-123';
        const legacyCompany = companyPayload();
        legacyCompany.TenantCompanyRegistryFile!.id = 'registry-old-123';
        expect(idsOfPersonForm(normalizeTenantFormData(legacy))).toEqual([
            'g-old-123', 'ec-old-123', 'photo-old-123', 'front-old-123', 'back-old-123',
            'document-old-123', 'document-file-old-123',
        ]);
        expect(tenantDraftDefinition.parse(legacyCompany, 1).TenantCompanyRegistryFile?.id).toBe('registry-old-123');
    });

    it('createTenant person/company e il JSON persistito conservano tutti gli otto ID', async () => {
        const storage = new MemoryStorage({ [KEY]: JSON.stringify(emptyDb()) });
        const { repo } = await modules(storage);
        const createdPerson = repo.createTenant(personPayload());
        const createdCompany = repo.createTenant(companyPayload());
        expect(idsOfPersonRecord(createdPerson)).toEqual(PERSON_IDS);
        expect(createdCompany.companyRegistryFile?.id).toBe(COMPANY_ID);
        expect(createdCompany.identityDocumentFile).toBeNull();
        expect(createdCompany.identityDocumentBackFile).toBeNull();

        const persisted = JSON.parse(storage.getItem(KEY)!) as LocalDatabase;
        expect(idsOfPersonRecord(persisted.tenants.find((tenant) => tenant.id === createdPerson.id)!)).toEqual(PERSON_IDS);
        expect(persisted.tenants.find((tenant) => tenant.id === createdCompany.id)?.companyRegistryFile?.id).toBe(COMPANY_ID);
    });

    it('reload jsonDb conserva gli otto ID e non effettua read-repair sul database canonico', async () => {
        const storage = new MemoryStorage({ [KEY]: JSON.stringify(emptyDb()) });
        const first = await modules(storage);
        const createdPerson = first.repo.createTenant(personPayload());
        const createdCompany = first.repo.createTenant(companyPayload());
        storage.resetOperationLogs();

        uninstallJsonDbWindow();
        const reloaded = await modules(storage);
        const tenants = reloaded.db.getJsonDb().tenants;
        expect(idsOfPersonRecord(tenants.find((tenant) => tenant.id === createdPerson.id)!)).toEqual(PERSON_IDS);
        expect(tenants.find((tenant) => tenant.id === createdCompany.id)?.companyRegistryFile?.id).toBe(COMPANY_ID);
        expect(storage.writesFor(KEY)).toHaveLength(0);
    });
});
