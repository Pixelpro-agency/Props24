import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultPropertyValues } from '../../src/components/property-form/schema';
import type { LocalDatabase } from '../../src/db/database.types';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const KEY = 'props24.localDb.user-001';
const NOW = '2026-08-25T12:00:00.000Z';
const emptyDb = (): LocalDatabase => ({ meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' }, properties: [], buildings: [], tenants: [], leases: [], payments: [], contacts: [], documents: [], reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [], candidates: [], settings: {}, userProfile: {}, drafts: [] });

async function modules(storage: MemoryStorage) {
    installJsonDbWindow(storage); vi.resetModules();
    const db = await import('../../src/db/jsonDb'); const repo = await import('../../src/db/propertyRepository');
    db.setActiveDatabaseAccount('user-001'); return { db, repo };
}
afterEach(() => { uninstallJsonDbWindow(); vi.resetModules(); });

describe('round-trip cataloghi Property', () => {
    it('persiste gli ID, li ricarica e costruisce label senza write di lettura', async () => {
        const storage = new MemoryStorage({ [KEY]: JSON.stringify(emptyDb()) }); const { repo } = await modules(storage);
        const created = repo.createProperty({ ...defaultPropertyValues, PropertyTypeID: 'ufficio', PropertyTitle: 'Unità', PropertyAddress: 'Via Roma', PropertyCity: 'Roma', PropertyPostalCode: '00100', PropertyRentType: 'studenti_con_cedolare_secca', PropertyBillingPeriod: 'quarterly', PropertyEnergyConsumption2: 'A2' } as never);
        expect(created.formData).toMatchObject({ PropertyTypeID: 'ufficio', PropertyRentType: 'studenti_con_cedolare_secca', PropertyBillingPeriod: 'quarterly', PropertyEnergyConsumption2: 'A2' });
        expect(JSON.parse(storage.getItem(KEY)!).properties[0].formData).toMatchObject(created.formData);
        uninstallJsonDbWindow(); const reloaded = await modules(storage); storage.resetOperationLogs();
        expect(reloaded.repo.getPropertyById(created.id)).toMatchObject({ type: 'ufficio', catalogs: { type: { value: 'ufficio', label: 'Ufficio' }, rentType: { value: 'studenti_con_cedolare_secca', label: 'Studenti con cedolare secca' }, billingPeriod: { value: 'quarterly', label: 'Trimestrale' }, energyClass: { value: 'A2', label: 'A2' } } });
        expect(reloaded.repo.listProperties()[0].type).toBe('ufficio'); expect(storage.writesFor(KEY)).toHaveLength(0);
    });

    it('legge valori legacy conservativamente e senza write', async () => {
        const db = emptyDb(); db.properties.push({ id: 'legacy', createdAt: NOW, updatedAt: NOW, archived: false, formData: { ...defaultPropertyValues, PropertyTypeID: 'appartamento', PropertyTitle: 'Legacy', PropertyAddress: 'Via', PropertyCity: 'Roma', PropertyPostalCode: '00100', PropertyRentType: 'monthly', PropertyBillingPeriod: 'monthly', PropertyEnergyConsumption2: 'A++' } as never, relations: { buildingId: null, tenantIds: [], leaseIds: [] }, notes: [], activities: [] });
        const storage = new MemoryStorage({ [KEY]: JSON.stringify(db) }); const { repo } = await modules(storage); const before = storage.getItem(KEY); storage.resetOperationLogs();
        expect(repo.getPropertyById('legacy')?.catalogs).toEqual({ type: { value: 'appartamento', label: 'Appartamento' }, rentType: { value: 'monthly', label: 'monthly' }, billingPeriod: { value: 'monthly', label: 'Mensile' }, energyClass: { value: 'A++', label: 'A++' } });
        expect(storage.getItem(KEY)).toBe(before); expect(storage.writesFor(KEY)).toHaveLength(0);
    });
});
