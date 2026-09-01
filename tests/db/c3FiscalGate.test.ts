import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultTenantValues, normalizeTenantFormData, type TenantFormData } from '../../src/components/tenant-form/schema';
import type { ContactCreateInput } from '../../src/db/contactRepository.port';
import type { LocalDatabase } from '../../src/db/database.types';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const ACCOUNT = 'user-001';
const KEY = 'props24.localDb.user-001';
const NOW = '2026-09-01T12:00:00.000Z';

const emptyDatabase = (): LocalDatabase => ({
    meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' },
    properties: [], buildings: [], tenants: [], leases: [], payments: [], contacts: [], documents: [],
    reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [],
    candidates: [], settings: {}, userProfile: {}, drafts: [],
});

const contactInput = (overrides: Partial<ContactCreateInput> = {}): ContactCreateInput => ({
    type: 'person', companyName: '', firstName: 'Ada', lastName: 'Lovelace', birthDate: '', birthPlace: '',
    fiscalCode: '', vatNumber: '', email: '', phone: '', address: '', city: '', zip: '', country: 'IT', notes: '',
    ...overrides,
});

const companyContact = (overrides: Partial<ContactCreateInput> = {}) => contactInput({
    type: 'company', companyName: 'Acme', firstName: '', lastName: '', ...overrides,
});

const personTenant = (overrides: Partial<TenantFormData> = {}) => normalizeTenantFormData({
    ...defaultTenantValues, TenantType: 'person', TenantFirstName: 'Ada', TenantLastName: 'Lovelace', ...overrides,
});

const companyTenant = (overrides: Partial<TenantFormData> = {}) => normalizeTenantFormData({
    ...defaultTenantValues, TenantType: 'company', TenantCompanyName: 'Acme', ...overrides,
});

async function arrange(database = emptyDatabase()) {
    const storage = new MemoryStorage({ [KEY]: JSON.stringify(database) });
    installJsonDbWindow(storage);
    vi.resetModules();
    const jsonDb = await import('../../src/db/jsonDb');
    jsonDb.setActiveDatabaseAccount(ACCOUNT);
    const { createLocalContactRepository } = await import('../../src/db/localContactRepository');
    const tenantRepository = await import('../../src/db/tenantRepository');
    return {
        storage,
        jsonDb,
        contacts: createLocalContactRepository({ accountId: ACCOUNT }),
        tenants: tenantRepository,
    };
}

afterEach(() => {
    uninstallJsonDbWindow();
    vi.resetModules();
});

describe('C3.4 fiscal contract gate', () => {
    it('consente Contact person con CF differente o vuoto', async () => {
        const { contacts } = await arrange();
        await contacts.create(contactInput({ fiscalCode: 'PERSON-A' }));
        await expect(contacts.create(contactInput({ fiscalCode: 'PERSON-B' }))).resolves.toMatchObject({ fiscalCode: 'PERSON-B' });
        await expect(contacts.create(contactInput({ fiscalCode: '' }))).resolves.toMatchObject({ fiscalCode: '' });
    });

    it('isola CF e VAT company Contact e consente identity vuota con email uguale', async () => {
        const { contacts } = await arrange();
        const existing = await contacts.create(companyContact({ fiscalCode: 'CONTACT-CF', vatNumber: 'CONTACT-VAT', email: 'same@example.test' }));

        await expect(contacts.create(companyContact({ fiscalCode: 'CONTACT-CF', vatNumber: '' }))).rejects.toMatchObject({
            name: 'DuplicateContactFiscalIdentityError', field: 'fiscalCode', existingContactId: existing.id,
        });
        await expect(contacts.create(companyContact({ fiscalCode: '', vatNumber: 'CONTACT-VAT' }))).rejects.toMatchObject({
            name: 'DuplicateContactFiscalIdentityError', field: 'vatNumber', existingContactId: existing.id,
        });
        await expect(contacts.create(companyContact({ fiscalCode: '', vatNumber: '', email: 'same@example.test' }))).resolves.toMatchObject({
            type: 'company', fiscalCode: '', vatNumber: '', email: 'same@example.test',
        });
    });

    it('isola CF ente e VAT company Tenant e consente identity vuota, email e SIRET uguali', async () => {
        const { tenants } = await arrange();
        const existing = tenants.createTenant(companyTenant({
            TenantCompanyFiscalCode: 'ENTITY-CF', TenantVatNumber: 'ENTITY-VAT',
            TenantEmail: 'same@example.test', TenantSiret: 'SAME-SIRET',
        }));

        expect(() => tenants.createTenant(companyTenant({ TenantCompanyFiscalCode: 'ENTITY-CF', TenantVatNumber: '' }))).toThrowError(
            expect.objectContaining({ name: 'DuplicateTenantFiscalIdentityError', field: 'fiscalCode', existingTenantId: existing.id }),
        );
        expect(() => tenants.createTenant(companyTenant({ TenantCompanyFiscalCode: '', TenantVatNumber: 'ENTITY-VAT' }))).toThrowError(
            expect.objectContaining({ name: 'DuplicateTenantFiscalIdentityError', field: 'vatNumber', existingTenantId: existing.id }),
        );
        expect(tenants.createTenant(companyTenant({
            TenantCompanyFiscalCode: '', TenantVatNumber: '', TenantEmail: 'same@example.test', TenantSiret: 'SAME-SIRET',
        }))).toMatchObject({ type: 'company', companyFiscalCode: '', vatNumber: '', email: 'same@example.test', siret: 'SAME-SIRET' });
    });

    it('consente CF person vuoto e nessun hard block Contact-Tenant in entrambi i versi', async () => {
        const { contacts, tenants, jsonDb } = await arrange();
        const contactFirst = await contacts.create(contactInput({ fiscalCode: 'CROSS-CONTACT' }));
        const tenantAfter = tenants.createTenant(personTenant({ TenantFiscalCode: 'CROSS-CONTACT' }));
        const tenantFirst = tenants.createTenant(personTenant({ TenantFiscalCode: 'CROSS-TENANT' }));
        const contactAfter = await contacts.create(contactInput({ fiscalCode: 'CROSS-TENANT' }));
        const empty = tenants.createTenant(personTenant({ TenantFiscalCode: '' }));
        const database = jsonDb.getJsonDb();

        expect(database.contacts.map((record) => record.id)).toEqual(expect.arrayContaining([contactFirst.id, contactAfter.id]));
        expect(database.tenants.map((record) => record.id)).toEqual(expect.arrayContaining([tenantAfter.id, tenantFirst.id, empty.id]));
        expect(database.contacts.find((record) => record.id === contactFirst.id)?.fiscalCode).toBe('CROSS-CONTACT');
        expect(database.tenants.find((record) => record.id === tenantAfter.id)?.fiscalCode).toBe('CROSS-CONTACT');
        expect(database.tenants.find((record) => record.id === tenantFirst.id)?.fiscalCode).toBe('CROSS-TENANT');
        expect(database.contacts.find((record) => record.id === contactAfter.id)?.fiscalCode).toBe('CROSS-TENANT');
        expect(empty.fiscalCode).toBe('');
    });

    it('preserva il CF rappresentante legacy senza inferirlo come CF ente', async () => {
        const database = emptyDatabase() as LocalDatabase & { tenants: Array<Record<string, unknown>> };
        database.tenants = [{
            id: 'legacy-company', type: 'company', companyName: 'Legacy', fiscalCode: 'LEGACY-REP', vatNumber: 'LEGACY-VAT',
            createdAt: NOW, updatedAt: NOW,
        }];
        const { tenants, jsonDb } = await arrange(database);
        const legacy = jsonDb.getJsonDb().tenants[0];

        expect(legacy).toMatchObject({ id: 'legacy-company', companyFiscalCode: '', fiscalCode: 'LEGACY-REP', vatNumber: 'LEGACY-VAT' });
        expect(() => tenants.createTenant(companyTenant({
            TenantCompanyFiscalCode: 'LEGACY-REP', TenantVatNumber: 'NEW-VAT',
        }))).not.toThrow();
    });
});
