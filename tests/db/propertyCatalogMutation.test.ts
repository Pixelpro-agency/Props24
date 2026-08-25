import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultPropertyValues, type PropertyFormData } from '../../src/components/property-form/schema';
import type { LocalDatabase } from '../../src/db/database.types';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const ACCOUNT = 'user-001';
const KEY = 'props24.localDb.user-001';
const NOW = '2026-08-25T12:00:00.000Z';

function database(): LocalDatabase {
    return {
        meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' },
        properties: [], buildings: [], tenants: [], leases: [], payments: [], contacts: [], documents: [],
        reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [],
        candidates: [], settings: {}, userProfile: {}, drafts: [],
    };
}

function validProperty(overrides: Partial<PropertyFormData> = {}): PropertyFormData {
    return {
        ...defaultPropertyValues,
        PropertyTypeID: 'appartamento',
        PropertyTitle: 'Unità valida',
        PropertyAddress: 'Via Roma 1',
        PropertyCity: 'Roma',
        PropertyPostalCode: '00100',
        PropertyCountry: 'IT',
        ...overrides,
    } as PropertyFormData;
}

async function environment() {
    const storage = new MemoryStorage({ [KEY]: JSON.stringify(database()) });
    installJsonDbWindow(storage);
    vi.resetModules();
    const jsonDb = await import('../../src/db/jsonDb');
    const properties = await import('../../src/db/propertyRepository');
    jsonDb.setActiveDatabaseAccount(ACCOUNT);
    return { storage, jsonDb, properties };
}

describe('property repository catalog mutation boundary', () => {
    beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(NOW)); });
    afterEach(() => { uninstallJsonDbWindow(); vi.useRealTimers(); vi.resetModules(); });

    it.each([
        ['tipo vuoto', { PropertyTypeID: '' }],
        ['tipo sconosciuto', { PropertyTypeID: 'castello' }],
        ['contratto legacy', { PropertyRentType: 'monthly' }],
        ['periodo Lease', { PropertyBillingPeriod: 'weekly' }],
        ['classe sconosciuta', { PropertyEnergyConsumption2: 'A++' }],
    ])('rifiuta create con %s prima della write senza mutare input', async (_label, override) => {
        const { storage, jsonDb, properties } = await environment();
        const input = validProperty(override);
        const copy = structuredClone(input);
        const before = structuredClone(jsonDb.getJsonDb());
        storage.resetOperationLogs();
        expect(() => properties.createProperty(input)).toThrow();
        expect(storage.writesFor(KEY)).toHaveLength(0);
        expect(jsonDb.getJsonDb()).toEqual(before);
        expect(input).toEqual(copy);
    });

    it('crea con valori canonici', async () => {
        const { storage, properties } = await environment();
        storage.resetOperationLogs();
        const created = properties.createProperty(validProperty({
            PropertyRentType: 'transitorio', PropertyBillingPeriod: 'monthly', PropertyEnergyConsumption2: 'A4',
        }));
        expect(created.formData).toMatchObject({
            PropertyTypeID: 'appartamento', PropertyRentType: 'transitorio',
            PropertyBillingPeriod: 'monthly', PropertyEnergyConsumption2: 'A4',
        });
        expect(storage.writesFor(KEY)).toHaveLength(1);
    });

    it('rifiuta update invalido senza write e senza cambiare record o input', async () => {
        const { storage, jsonDb, properties } = await environment();
        const created = properties.createProperty(validProperty());
        const input = { ...created.formData, PropertyBillingPeriod: 'weekly' };
        const copy = structuredClone(input);
        const before = structuredClone(jsonDb.getJsonDb());
        storage.resetOperationLogs();
        expect(() => properties.updateProperty(created.id, input)).toThrow();
        expect(storage.writesFor(KEY)).toHaveLength(0);
        expect(jsonDb.getJsonDb()).toEqual(before);
        expect(input).toEqual(copy);
    });

    it('aggiorna con valori canonici', async () => {
        const { storage, properties } = await environment();
        const created = properties.createProperty(validProperty());
        storage.resetOperationLogs();
        const updated = properties.updateProperty(created.id, {
            ...created.formData, PropertyRentType: 'studenti', PropertyBillingPeriod: 'annual', PropertyEnergyConsumption2: 'G',
        });
        expect(updated?.formData).toMatchObject({
            PropertyRentType: 'studenti', PropertyBillingPeriod: 'annual', PropertyEnergyConsumption2: 'G',
        });
        expect(storage.writesFor(KEY)).toHaveLength(1);
    });
});
