import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultPropertyValues, type PropertyFormData } from '../../src/components/property-form/schema';
import type { LocalDatabase, PropertyRecord } from '../../src/db/database.types';
import { DuplicatePropertyCadastralKeyError } from '../../src/db/databaseErrors';
import { findPropertyByCadastralKey } from '../../src/db/businessRules';
import { assertDatabaseIntegrity, validateDatabaseRelations } from '../../src/db/databaseValidation';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const ACCOUNT_A = 'user-101';
const ACCOUNT_B = 'user-202';
const KEY_A = `props24.localDb.${ACCOUNT_A}`;
const KEY_B = `props24.localDb.${ACCOUNT_B}`;
const NOW = '2026-08-24T10:00:00.000Z';

function database(): LocalDatabase {
    return {
        meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' },
        properties: [], buildings: [], tenants: [], leases: [], payments: [], contacts: [], documents: [],
        reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [],
        candidates: [], settings: {}, userProfile: {}, drafts: [],
    };
}

function property(overrides: Partial<PropertyFormData> = {}): PropertyFormData {
    return {
        ...defaultPropertyValues,
        PropertyTitle: 'Unità condivisa',
        PropertyAddress: 'Via Roma 10',
        PropertyCity: 'Roma',
        PropertyPostalCode: '00100',
        PropertyCountry: 'IT',
        PropertyCadastreMunicipalityCode: 'H501',
        PropertyCadastreRegistryType: 'urbano',
        PropertyCadastreMunicipality: '',
        PropertyUrbanSection: '',
        PropertyCadastreSheet: '001',
        PropertyCadastrePart: '00042',
        PropertyCadastreSub: '',
        ...overrides,
    } as PropertyFormData;
}

function record(id: string, formData: PropertyFormData): PropertyRecord {
    return {
        id, createdAt: NOW, updatedAt: NOW, archived: false, formData,
        relations: { buildingId: null, tenantIds: [], leaseIds: [] }, notes: [], activities: [],
    };
}

async function environment(initial: Record<string, string> = { [KEY_A]: JSON.stringify(database()) }) {
    const storage = new MemoryStorage(initial);
    installJsonDbWindow(storage);
    vi.resetModules();
    const jsonDb = await import('../../src/db/jsonDb');
    const properties = await import('../../src/db/propertyRepository');
    const buildings = await import('../../src/db/buildingRepository');
    jsonDb.setActiveDatabaseAccount(ACCOUNT_A);
    return { storage, jsonDb, properties, buildings };
}

describe('B2.2 business rule catastale', () => {
    it('restituisce null per input incompleto', () => {
        expect(findPropertyByCadastralKey(database(), property({ PropertyCadastrePart: '' }))).toBeNull();
    });

    it('trova chiavi complete identiche ed equivalenti dopo normalizzazione', () => {
        const db = database();
        db.properties.push(record('existing', property()));
        expect(findPropertyByCadastralKey(db, property())?.id).toBe('existing');
        expect(findPropertyByCadastralKey(db, property({
            PropertyCountry: ' i t ',
            PropertyCadastreMunicipalityCode: ' h 5 0 1 ',
            PropertyCadastreSheet: ' 0 0 1 ',
            PropertyCadastrePart: ' 0 0 0 4 2 ',
        }))?.id).toBe('existing');
    });

    it('excludePropertyId esclude il record corrente', () => {
        const db = database();
        db.properties.push(record('current', property()));
        expect(findPropertyByCadastralKey(db, property(), 'current')).toBeNull();
    });
});

describe('B2.2 repository account-scoped e atomico', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(NOW));
    });

    afterEach(() => {
        uninstallJsonDbWindow();
        vi.useRealTimers();
        vi.resetModules();
    });

    it('crea la prima chiave completa e blocca atomicamente la seconda', async () => {
        const { storage, jsonDb, properties } = await environment();
        const first = properties.createProperty(property());
        storage.resetOperationLogs();
        const before = structuredClone(jsonDb.getJsonDb());
        expect(() => properties.createProperty(property({ PropertyTitle: 'Altro titolo' })))
            .toThrow(new DuplicatePropertyCadastralKeyError(first.id));
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(jsonDb.getJsonDb()).toEqual(before);
    });

    it.each([
        ['Subalterno', { PropertyCadastreSub: '2' }],
        ['Sezione urbana', { PropertyUrbanSection: 'B' }],
        ['Comune catastale', { PropertyCadastreMunicipality: 'Roma Capitale' }],
    ] satisfies Array<[string, Partial<PropertyFormData>]>)('consente %s differente', async (_label, override) => {
        const { properties } = await environment();
        properties.createProperty(property());
        expect(properties.createProperty(property(override))).toBeTruthy();
    });

    it('consente catasto incompleto anche con stesso titolo e indirizzo', async () => {
        const { storage, jsonDb, properties } = await environment();
        const incomplete = property({ PropertyCadastrePart: '' });
        properties.createProperty(incomplete);
        storage.resetOperationLogs();
        properties.createProperty(incomplete);
        expect(storage.writesFor(KEY_A)).toHaveLength(1);
        expect(jsonDb.getJsonDb().properties).toHaveLength(2);
    });

    it('consente stesso titolo con chiave diversa', async () => {
        const { properties } = await environment();
        properties.createProperty(property());
        expect(properties.createProperty(property({ PropertyCadastrePart: '00043' }))).toBeTruthy();
    });

    it('consente stesso indirizzo e Building con chiave diversa e mantiene unitsCount', async () => {
        const { properties, buildings } = await environment();
        const repository = buildings.createBuildingRepository({ accountId: ACCOUNT_A });
        const building = repository.create({ identifier: 'A', address: 'Via Roma 10', city: 'Roma', postalCode: '00100', country: 'IT' });
        properties.createProperty(property(), { buildingId: building.id });
        properties.createProperty(property({ PropertyCadastrePart: '00043' }), { buildingId: building.id });
        expect(repository.getById(building.id)?.unitsCount).toBe(2);
    });

    it('consente lo stesso indirizzo in Building differenti', async () => {
        const { properties, buildings } = await environment();
        const repository = buildings.createBuildingRepository({ accountId: ACCOUNT_A });
        const first = repository.create({ identifier: 'A', address: 'Via A 1', city: 'Roma', postalCode: '00100', country: 'IT' });
        const second = repository.create({ identifier: 'B', address: 'Via B 1', city: 'Roma', postalCode: '00100', country: 'IT' });
        properties.createProperty(property(), { buildingId: first.id });
        expect(properties.createProperty(property({ PropertyCadastrePart: '00043' }), { buildingId: second.id })).toBeTruthy();
    });

    it('applica la regola anche a Unit standalone', async () => {
        const { properties } = await environment();
        const first = properties.createProperty(property(), { buildingId: null });
        expect(first.relations.buildingId).toBeNull();
        expect(() => properties.createProperty(property(), { buildingId: null }))
            .toThrow(expect.objectContaining({ name: 'DuplicatePropertyCadastralKeyError' }));
    });

    it('consente update con propria chiave o soli campi non catastali', async () => {
        const { properties } = await environment();
        const created = properties.createProperty(property());
        expect(properties.updateProperty(created.id, created.formData)?.id).toBe(created.id);
        expect(properties.updateProperty(created.id, { ...created.formData, PropertyTitle: 'Titolo aggiornato' })?.formData.PropertyTitle)
            .toBe('Titolo aggiornato');
    });

    it('blocca atomicamente update verso la chiave di un altro record', async () => {
        const { storage, jsonDb, properties } = await environment();
        const first = properties.createProperty(property());
        const second = properties.createProperty(property({ PropertyCadastrePart: '00043' }));
        storage.resetOperationLogs();
        const before = structuredClone(jsonDb.getJsonDb());
        expect(() => properties.updateProperty(second.id, first.formData))
            .toThrow(new DuplicatePropertyCadastralKeyError(first.id));
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(jsonDb.getJsonDb()).toEqual(before);
    });

    it('non usa fallback in update con catasto incompleto', async () => {
        const { properties } = await environment();
        properties.createProperty(property({ PropertyCadastrePart: '' }));
        const second = properties.createProperty(property({ PropertyCadastrePart: '00043' }));
        expect(properties.updateProperty(second.id, property({ PropertyCadastrePart: '' }))?.id).toBe(second.id);
    });

    it('consente la stessa chiave in account differenti senza cross-scan', async () => {
        const { storage, jsonDb, properties } = await environment({
            [KEY_A]: JSON.stringify(database()),
            [KEY_B]: JSON.stringify(database()),
        });
        properties.createProperty(property());
        const beforeA = storage.getItem(KEY_A);
        jsonDb.setActiveDatabaseAccount(ACCOUNT_B);
        expect(properties.createProperty(property())).toBeTruthy();
        expect(storage.getItem(KEY_A)).toBe(beforeA);
        expect(storage.writesFor(KEY_B)).toHaveLength(1);
    });

    it('reload preserva titoli duplicati senza suffissi automatici', async () => {
        const { storage, properties } = await environment();
        const incomplete = property({ PropertyCadastrePart: '' });
        properties.createProperty(incomplete);
        properties.createProperty(incomplete);
        vi.resetModules();
        const reloaded = await import('../../src/db/jsonDb');
        reloaded.setActiveDatabaseAccount(ACCOUNT_A);
        expect(reloaded.getJsonDb().properties.map((item) => item.formData.PropertyTitle))
            .toEqual(['Unità condivisa', 'Unità condivisa']);
        expect(storage.getItem(KEY_A)).not.toContain('Unità condivisa (2)');
    });

    it('carica e preserva una collisione catastale legacy canonica senza scritture o repair', async () => {
        const persisted = database();
        persisted.properties = [
            record('legacy-one', property({
                PropertyTitle: 'Titolo legacy A',
                PropertyCounty: 'RM',
                PropertyState: 'Lazio',
            })),
            record('legacy-two', property({
                PropertyTitle: 'Titolo legacy B',
                PropertyCounty: 'RM',
                PropertyState: 'Lazio',
            })),
        ];
        const originalCadastralData = persisted.properties.map((item) => ({
            id: item.id,
            title: item.formData.PropertyTitle,
            municipalityCode: item.formData.PropertyCadastreMunicipalityCode,
            registryType: item.formData.PropertyCadastreRegistryType,
            sheet: item.formData.PropertyCadastreSheet,
            part: item.formData.PropertyCadastrePart,
            sub: item.formData.PropertyCadastreSub,
        }));
        const originalRaw = JSON.stringify(persisted);
        const { storage, jsonDb } = await environment({ [KEY_A]: originalRaw });

        const loaded = jsonDb.getJsonDb();

        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(storage.getItem(KEY_A)).toBe(originalRaw);
        expect(loaded.properties).toHaveLength(2);
        expect(loaded.properties.map((item) => item.id)).toEqual(['legacy-one', 'legacy-two']);
        expect(loaded.properties.map((item) => ({
            id: item.id,
            title: item.formData.PropertyTitle,
            municipalityCode: item.formData.PropertyCadastreMunicipalityCode,
            registryType: item.formData.PropertyCadastreRegistryType,
            sheet: item.formData.PropertyCadastreSheet,
            part: item.formData.PropertyCadastrePart,
            sub: item.formData.PropertyCadastreSub,
        }))).toEqual(originalCadastralData);
        expect(() => assertDatabaseIntegrity(loaded)).not.toThrow();
        expect(validateDatabaseRelations(loaded)).toEqual(expect.arrayContaining([
            expect.objectContaining({
                severity: 'warning',
                code: 'PROPERTY_CADASTRAL_KEY_DUPLICATE',
                collection: 'properties',
                recordId: 'legacy-two',
            }),
        ]));
    });
});

describe('B2.2 integrità database', () => {
    it('non segnala titoli duplicati con chiavi differenti o incomplete', () => {
        const db = database();
        db.properties.push(
            record('one', property({ PropertyCadastrePart: '' })),
            record('two', property({ PropertyCadastrePart: '00043' })),
        );
        const codes = validateDatabaseRelations(db).map((issue) => issue.code);
        expect(codes).not.toContain('PROPERTY_IDENTIFIER_DUPLICATE');
        expect(codes).not.toContain('PROPERTY_CADASTRAL_KEY_DUPLICATE');
    });

    it('segnala chiavi catastali complete duplicate', () => {
        const db = database();
        db.properties.push(record('one', property()), record('two', property()));
        expect(validateDatabaseRelations(db)).toEqual(expect.arrayContaining([
            expect.objectContaining({
                severity: 'warning',
                code: 'PROPERTY_CADASTRAL_KEY_DUPLICATE',
                collection: 'properties',
                recordId: 'two',
            }),
        ]));
        expect(() => assertDatabaseIntegrity(db)).not.toThrow();
    });

    it('non segnala chiavi incomplete duplicate', () => {
        const db = database();
        const incomplete = property({ PropertyCadastrePart: '' });
        db.properties.push(record('one', incomplete), record('two', incomplete));
        expect(validateDatabaseRelations(db).map((issue) => issue.code))
            .not.toContain('PROPERTY_CADASTRAL_KEY_DUPLICATE');
    });
});
