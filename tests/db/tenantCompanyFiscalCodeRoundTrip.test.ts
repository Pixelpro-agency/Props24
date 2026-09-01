import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultTenantValues, normalizeTenantFormData } from '../../src/components/tenant-form/schema';
import { tenantDraftDefinition } from '../../src/components/tenant-form/tenantDraftDefinition';
import type { LocalDatabase } from '../../src/db/database.types';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const KEY = 'props24.localDb.user-001';
const NOW = '2026-09-01T10:00:00.000Z';
const emptyDb = (): LocalDatabase => ({
    meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' },
    properties: [], buildings: [], tenants: [], leases: [], payments: [], contacts: [], documents: [],
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

describe('round-trip companyFiscalCode Tenant', () => {
    it('schema/default/draft acquisiscono il campo senza inferenze legacy', () => {
        expect(defaultTenantValues.TenantCompanyFiscalCode).toBe('');
        expect(normalizeTenantFormData({ TenantType: 'company', TenantCompanyName: 'Acme' }).TenantCompanyFiscalCode).toBe('');
        expect(tenantDraftDefinition.parse({ TenantCompanyFiscalCode: 'ENTE123' }, 1).TenantCompanyFiscalCode).toBe('ENTE123');
        expect(tenantDraftDefinition.parse({}, 1).TenantCompanyFiscalCode).toBe('');
    });

    it('createTenant, JSON, read-side e reload preservano CF ente distinto dal rappresentante', async () => {
        const storage = new MemoryStorage({ [KEY]: JSON.stringify(emptyDb()) });
        const first = await modules(storage);
        const created = first.repo.createTenant(normalizeTenantFormData({
            ...defaultTenantValues,
            TenantType: 'company',
            TenantCompanyName: 'Acme',
            TenantCompanyFiscalCode: ' ente 123 ',
            TenantFiscalCode: ' rep 456 ',
            TenantVatNumber: 'IT12345678901',
        }));
        expect(created).toMatchObject({ type: 'company', companyFiscalCode: 'ENTE123', fiscalCode: 'REP456', vatNumber: 'IT12345678901' });
        expect(first.repo.getTenantById(created.id)).toMatchObject({ companyFiscalCode: 'ENTE123', fiscalCode: 'REP456', vatNumber: 'IT12345678901' });
        const persisted = JSON.parse(storage.getItem(KEY)!).tenants[0];
        expect(persisted).toMatchObject({ companyFiscalCode: 'ENTE123', fiscalCode: 'REP456', vatNumber: 'IT12345678901' });

        uninstallJsonDbWindow();
        const reloaded = await modules(storage);
        expect(reloaded.db.getJsonDb().tenants[0]).toMatchObject({ companyFiscalCode: 'ENTE123', fiscalCode: 'REP456', vatNumber: 'IT12345678901' });
    });

    it('person forza vuoto un company fiscal code stale', async () => {
        const storage = new MemoryStorage({ [KEY]: JSON.stringify(emptyDb()) });
        const { repo } = await modules(storage);
        const created = repo.createTenant(normalizeTenantFormData({
            ...defaultTenantValues,
            TenantType: 'person',
            TenantFirstName: 'Ada',
            TenantLastName: 'Lovelace',
            TenantCompanyFiscalCode: 'STALECOMPANY',
        }));
        expect(created.companyFiscalCode).toBe('');
    });

    it('legacy company senza campo normalizza a vuoto senza copiare il CF rappresentante', async () => {
        const legacy = emptyDb() as LocalDatabase & { tenants: Array<Record<string, unknown>> };
        legacy.tenants = [{
            id: 'legacy-company', type: 'company', companyName: 'Legacy', fiscalCode: 'LEGACYREP', vatNumber: 'VAT-LEGACY',
            createdAt: NOW, updatedAt: NOW,
        }];
        const storage = new MemoryStorage({ [KEY]: JSON.stringify(legacy) });
        const { db } = await modules(storage);
        expect(db.getJsonDb().tenants[0]).toMatchObject({ companyFiscalCode: '', fiscalCode: 'LEGACYREP', vatNumber: 'VAT-LEGACY' });
    });
});
