import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultTenantValues, normalizeTenantFormData, type TenantFormData } from '../../src/components/tenant-form/schema';
import type { LocalDatabase, TenantRecord } from '../../src/db/database.types';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const ACCOUNT_A = 'user-001';
const ACCOUNT_B = 'user-002';
const KEY_A = 'props24.localDb.user-001';
const KEY_B = 'props24.localDb.user-002';
const NOW = '2026-09-01T12:00:00.000Z';

const database = (tenants: TenantRecord[] = []): LocalDatabase => ({
    meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' },
    properties: [], buildings: [], tenants, leases: [], payments: [], contacts: [], documents: [], reservations: [],
    catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [], candidates: [], settings: {},
    userProfile: {}, drafts: [],
});

const personPayload = (overrides: Partial<TenantFormData> = {}) => normalizeTenantFormData({
    ...defaultTenantValues, TenantType: 'person', TenantFirstName: 'Ada', TenantLastName: 'Lovelace', ...overrides,
});
const companyPayload = (overrides: Partial<TenantFormData> = {}) => normalizeTenantFormData({
    ...defaultTenantValues, TenantType: 'company', TenantCompanyName: 'Acme', ...overrides,
});
const tenant = (id: string, type: 'person' | 'company', fiscalCode = '', companyFiscalCode = '', vatNumber = '', archived = false) => ({
    id, type, fiscalCode, companyFiscalCode, vatNumber, archived,
} as TenantRecord);

async function arrange(dbA: LocalDatabase, dbB = database(), active = ACCOUNT_A) {
    const storage = new MemoryStorage({ [KEY_A]: JSON.stringify(dbA), [KEY_B]: JSON.stringify(dbB) });
    installJsonDbWindow(storage);
    vi.resetModules();
    const jsonDb = await import('../../src/db/jsonDb');
    jsonDb.setActiveDatabaseAccount(active);
    const repo = await import('../../src/db/tenantRepository');
    storage.resetOperationLogs();
    return { storage, jsonDb, repo };
}

afterEach(() => { uninstallJsonDbWindow(); vi.resetModules(); });

describe('createTenant fiscal enforcement C3.3', () => {
    it('blocca CF person duplicato archived senza write o record parziale', async () => {
        const existing = tenant('person-existing', 'person', ' rss 123 ', '', '', true);
        const { repo, storage } = await arrange(database([existing]));
        const before = storage.getItem(KEY_A);
        try { repo.createTenant(personPayload({ TenantFiscalCode: 'RSS123' })); } catch (error) {
            expect(error).toMatchObject({ name: 'DuplicateTenantFiscalIdentityError', field: 'fiscalCode', existingTenantId: existing.id });
        }
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(storage.getItem(KEY_A)).toBe(before);
        expect(JSON.parse(before!).tenants).toHaveLength(1);
    });

    it('person ignora CF/PIVA company stale, TenantVatNumber, P.IVA personale, email e SIRET', async () => {
        const existing = tenant('person-existing', 'person', 'OTHER');
        const { repo, storage } = await arrange(database([existing]));
        const created = repo.createTenant(personPayload({
            TenantFiscalCode: '', TenantCompanyFiscalCode: 'OTHER', TenantVatNumber: 'SAME',
            TenantVatNumberPersonal: 'SAME', TenantEmail: 'same@example.test', TenantSiret: 'SAME',
        }));
        expect(created.type).toBe('person');
        expect(storage.writesFor(KEY_A)).toHaveLength(1);
    });

    it('blocca company per CF ente e P.IVA con zero write', async () => {
        const first = tenant('company-cf', 'company', 'REP-A', 'ENTITY-A', 'VAT-A');
        const second = tenant('company-vat', 'company', 'REP-B', 'ENTITY-B', 'VAT-B');
        const { repo, storage } = await arrange(database([first, second]));
        try { repo.createTenant(companyPayload({ TenantCompanyFiscalCode: ' entity-a ', TenantVatNumber: 'VAT-X' })); } catch (error) {
            expect(error).toMatchObject({ field: 'fiscalCode', existingTenantId: first.id });
        }
        try { repo.createTenant(companyPayload({ TenantCompanyFiscalCode: 'ENTITY-X', TenantVatNumber: ' vat-b ' })); } catch (error) {
            expect(error).toMatchObject({ field: 'vatNumber', existingTenantId: second.id });
        }
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(JSON.parse(storage.getItem(KEY_A)!).tenants).toHaveLength(2);
    });

    it('company ignora CF/PIVA rappresentante, email e SIRET', async () => {
        const existing = tenant('company-a', 'company', 'REP-SAME', 'ENTITY-A', 'VAT-A');
        const { repo } = await arrange(database([existing]));
        expect(() => repo.createTenant(companyPayload({
            TenantFiscalCode: 'REP-SAME', TenantVatNumberPersonal: 'PERSONAL-SAME',
            TenantCompanyFiscalCode: 'ENTITY-B', TenantVatNumber: 'VAT-B', TenantEmail: 'same@example.test', TenantSiret: 'SAME',
        }))).not.toThrow();
    });

    it('matching è type-aware', async () => {
        const existing = tenant('person-a', 'person', 'SAME123');
        const { repo } = await arrange(database([existing]));
        expect(() => repo.createTenant(companyPayload({ TenantCompanyFiscalCode: 'SAME123' }))).not.toThrow();
    });

    it('account scope non confronta Tenant di un altro account', async () => {
        const inA = tenant('person-a', 'person', 'CROSS123');
        const { repo, storage } = await arrange(database([inA]), database(), ACCOUNT_B);
        expect(() => repo.createTenant(personPayload({ TenantFiscalCode: 'CROSS123' }))).not.toThrow();
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(storage.writesFor(KEY_B)).toHaveLength(1);
    });
});
