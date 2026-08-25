import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    defaultPropertyValues,
    normalizePropertyFormData,
    type PropertyFormData,
} from '../../src/components/property-form/schema';
import { propertyDraftDefinition } from '../../src/components/property-form/propertyDraftDefinition';
import type { LocalDatabase } from '../../src/db/database.types';
import {
    assertDatabaseIntegrity,
    validateDatabaseRelations,
} from '../../src/db/databaseValidation';
import {
    installJsonDbWindow,
    MemoryStorage,
    uninstallJsonDbWindow,
} from './jsonDbStorageHarness';

const ACCOUNT_A = 'user-001';
const ACCOUNT_B = 'user-002';
const KEY_A = `props24.localDb.${ACCOUNT_A}`;
const KEY_B = `props24.localDb.${ACCOUNT_B}`;
const NOW = '2026-08-21T18:00:00.000Z';

function database(): LocalDatabase {
    return {
        meta: {
            schemaVersion: 4,
            seedVersion: 1,
            createdAt: NOW,
            updatedAt: NOW,
            source: 'seed',
        },
        properties: [], buildings: [], tenants: [], leases: [], payments: [],
        contacts: [], documents: [], reservations: [], catalogs: [], inventory: [],
        maintenance: [], tasks: [], notes: [], messages: [], candidates: [],
        settings: {}, userProfile: {}, drafts: [],
    };
}

function propertyInput(index: number): PropertyFormData {
  return {
    ...defaultPropertyValues,
    PropertyTypeID: 'appartamento',
        PropertyTitle: `Unità gate ${index}`,
        PropertyAddress: `Via Gate ${index}`,
        PropertyCity: 'Milano',
        PropertyPostalCode: `2010${index}`,
        PropertyCountry: 'IT',
    };
}

function buildingInput(identifier: string, index: number) {
    return {
        identifier,
        address: `Via Edificio ${index}`,
        city: 'Milano',
        postalCode: `2020${index}`,
        country: 'IT',
    };
}

function assertIntegral(databaseValue: LocalDatabase) {
    expect(() => assertDatabaseIntegrity(databaseValue)).not.toThrow();
    expect(validateDatabaseRelations(databaseValue).map((issue) => issue.code))
        .not.toEqual(expect.arrayContaining([
            'ORPHAN_BUILDING',
            'BUILDING_UNITS_COUNT_OUT_OF_SYNC',
        ]));
}

async function environment(initial?: Record<string, string>) {
    const storage = new MemoryStorage(initial ?? {
        [KEY_A]: JSON.stringify(database()),
    });
    installJsonDbWindow(storage);
    vi.resetModules();
    const jsonDb = await import('../../src/db/jsonDb');
    const buildings = await import('../../src/db/buildingRepository');
    const properties = await import('../../src/db/propertyRepository');
    jsonDb.setActiveDatabaseAccount(ACCOUNT_A);
    return {
        storage,
        jsonDb,
        properties,
        buildingRepository: buildings.createBuildingRepository({ accountId: ACCOUNT_A }),
        createBuildingRepository: buildings.createBuildingRepository,
    };
}

describe('B1 consolidated property-building gate', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(NOW));
    });

    afterEach(() => {
        uninstallJsonDbWindow();
        vi.useRealTimers();
        vi.resetModules();
    });

    it('round-trips linked and detached creates through the canonical relation', async () => {
        const { storage, jsonDb, properties, buildingRepository } = await environment();
        const building = buildingRepository.create(buildingInput('Edificio A', 1));
        storage.resetOperationLogs();
        const linked = properties.createProperty(propertyInput(1), { buildingId: building.id });
        expect(storage.writesFor(KEY_A)).toHaveLength(1);
        expect(linked.relations.buildingId).toBe(building.id);
        expect(linked.formData).not.toHaveProperty('PropertyBuildingId');
        expect(linked.formData).not.toHaveProperty('buildingId');
        expect(linked).not.toHaveProperty('building');
        expect(buildingRepository.getById(building.id)?.unitsCount).toBe(1);
        storage.resetOperationLogs();
        const detached = properties.createProperty(propertyInput(2), { buildingId: null });
        expect(storage.writesFor(KEY_A)).toHaveLength(1);
        expect(detached.relations.buildingId).toBeNull();
        assertIntegral(jsonDb.getJsonDb());
    });

    it('preserves, reassigns and detaches with one write and intact relation arrays', async () => {
        const { storage, jsonDb, properties, buildingRepository } = await environment();
        const first = buildingRepository.create(buildingInput('Edificio A', 1));
        const second = buildingRepository.create(buildingInput('Edificio B', 2));
        const created = properties.createProperty(propertyInput(1), { buildingId: first.id });
        for (const [patch, expected, counts] of [
            [undefined, first.id, [1, 0]],
            [{ buildingId: second.id }, second.id, [0, 1]],
            [{ buildingId: null }, null, [0, 0]],
        ] as const) {
            storage.resetOperationLogs();
            const updated = properties.updateProperty(
                created.id,
                { ...created.formData, PropertyDescription: `step-${String(expected)}` },
                patch,
            );
            expect(storage.writesFor(KEY_A)).toHaveLength(1);
            expect(updated?.relations).toEqual({
                buildingId: expected,
                tenantIds: [],
                leaseIds: [],
            });
            expect(buildingRepository.getById(first.id)?.unitsCount).toBe(counts[0]);
            expect(buildingRepository.getById(second.id)?.unitsCount).toBe(counts[1]);
            assertIntegral(jsonDb.getJsonDb());
        }
    });

    it('preserves an archived current relation and atomically rejects archived destinations', async () => {
        const { storage, properties, buildingRepository } = await environment();
        const archived = buildingRepository.create(buildingInput('Archiviato', 1));
        const other = buildingRepository.create(buildingInput('Altro', 2));
        const current = properties.createProperty(propertyInput(1), { buildingId: archived.id });
        const otherProperty = properties.createProperty(propertyInput(2), { buildingId: other.id });
        buildingRepository.archive(archived.id);
        expect(properties.updateProperty(current.id, current.formData)?.relations.buildingId)
            .toBe(archived.id);
        expect(properties.updateProperty(current.id, current.formData, {
            buildingId: archived.id,
        })?.relations.buildingId).toBe(archived.id);
        for (const operation of [
            () => properties.createProperty(propertyInput(3), { buildingId: archived.id }),
            () => properties.updateProperty(otherProperty.id, otherProperty.formData, {
                buildingId: archived.id,
            }),
        ]) {
            storage.resetOperationLogs();
            expect(operation).toThrow(expect.objectContaining({
                name: 'PropertyBuildingArchivedError',
            }));
            expect(storage.writesFor(KEY_A)).toHaveLength(0);
        }
        expect(buildingRepository.getById(archived.id)?.unitsCount).toBe(1);
        expect(buildingRepository.getById(other.id)?.unitsCount).toBe(1);
    });

    it('rejects missing create and reassignment without writes or state loss', async () => {
        const { storage, jsonDb, properties, buildingRepository } = await environment();
        const building = buildingRepository.create(buildingInput('Edificio A', 1));
        const created = properties.createProperty(propertyInput(1), { buildingId: building.id });
        storage.resetOperationLogs();
        expect(() => properties.createProperty(propertyInput(2), {
            buildingId: 'building-missing',
        })).toThrow(expect.objectContaining({ name: 'BuildingNotFoundError' }));
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(jsonDb.getJsonDb().properties).toHaveLength(1);
        storage.resetOperationLogs();
        expect(() => properties.updateProperty(created.id, created.formData, {
            buildingId: 'building-missing',
        })).toThrow(expect.objectContaining({ name: 'BuildingNotFoundError' }));
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(jsonDb.getJsonDb().properties[0].relations.buildingId).toBe(building.id);
    });

    it('keeps relation/count on Property archive and removes only Property on delete', async () => {
        const { jsonDb, properties, buildingRepository } = await environment();
        const building = buildingRepository.create(buildingInput('Edificio A', 1));
        const created = properties.createProperty(propertyInput(1), { buildingId: building.id });
        properties.archiveProperties([created.id]);
        expect(jsonDb.getJsonDb().properties[0]).toMatchObject({
            archived: true,
            relations: { buildingId: building.id },
        });
        expect(buildingRepository.getById(building.id)?.unitsCount).toBe(1);
        expect(properties.deleteProperties([created.id])).toEqual({
            deleted: [created.id],
            blocked: [],
        });
        expect(jsonDb.getJsonDb().properties).toEqual([]);
        expect(buildingRepository.getById(building.id)?.unitsCount).toBe(0);
        expect(buildingRepository.getById(building.id)).not.toBeNull();
        assertIntegral(jsonDb.getJsonDb());
    });

    it('protects deletion of a linked Building with zero writes', async () => {
        const { storage, jsonDb, properties, buildingRepository } = await environment();
        const building = buildingRepository.create(buildingInput('Edificio A', 1));
        const created = properties.createProperty(propertyInput(1), { buildingId: building.id });
        storage.resetOperationLogs();
        expect(() => buildingRepository.delete(building.id)).toThrow(
            expect.objectContaining({ name: 'BuildingDeleteBlockedError' }),
        );
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(buildingRepository.getById(building.id)?.unitsCount).toBe(1);
        expect(jsonDb.getJsonDb().properties[0].relations.buildingId).toBe(building.id);
        expect(jsonDb.getJsonDb().properties[0].id).toBe(created.id);
    });

    it('isolates accounts and rejects a cross-account relation', async () => {
        const { storage, jsonDb, properties, createBuildingRepository } = await environment({
            [KEY_A]: JSON.stringify(database()),
            [KEY_B]: JSON.stringify(database()),
        });
        const repositoryA = createBuildingRepository({ accountId: ACCOUNT_A });
        const repositoryB = createBuildingRepository({ accountId: ACCOUNT_B });
        const buildingA = repositoryA.create(buildingInput('Edificio A', 1));
        const propertyA = properties.createProperty(propertyInput(1), { buildingId: buildingA.id });
        jsonDb.setActiveDatabaseAccount(ACCOUNT_B);
        const buildingB = repositoryB.create(buildingInput('Edificio B', 2));
        const propertyB = properties.createProperty(propertyInput(2), { buildingId: buildingB.id });
        const dbA = JSON.parse(storage.getItem(KEY_A)!) as LocalDatabase;
        const dbB = JSON.parse(storage.getItem(KEY_B)!) as LocalDatabase;
        expect(dbA.properties.map((item) => item.id)).toEqual([propertyA.id]);
        expect(dbB.properties.map((item) => item.id)).toEqual([propertyB.id]);
        expect(dbA.buildings).toEqual([expect.objectContaining({ id: buildingA.id, unitsCount: 1 })]);
        expect(dbB.buildings).toEqual([expect.objectContaining({ id: buildingB.id, unitsCount: 1 })]);
        storage.resetOperationLogs();
        const beforeA = storage.getItem(KEY_A);
        expect(() => properties.createProperty(propertyInput(3), {
            buildingId: buildingA.id,
        })).toThrow(expect.objectContaining({ name: 'BuildingNotFoundError' }));
        expect(storage.writesFor(KEY_B)).toHaveLength(0);
        expect(storage.getItem(KEY_A)).toBe(beforeA);
    });

    it('keeps draft v1/v2 compatible while canonical formData excludes Building', () => {
        const legacy = { ...propertyInput(1) };
        const legacyUntrusted = {
            ...propertyInput(2),
            PropertyBuildingId: 'building-untrusted',
        };
        const current = {
            ...propertyInput(3),
            PropertyBuildingId: 'building-a',
        };
        const copies = structuredClone([legacy, legacyUntrusted, current]);
        expect(propertyDraftDefinition.parse(legacy, 1).PropertyBuildingId).toBe('');
        expect(propertyDraftDefinition.parse(legacyUntrusted, 1).PropertyBuildingId).toBe('');
        expect(propertyDraftDefinition.parse(current, 2).PropertyBuildingId).toBe('building-a');
        expect(normalizePropertyFormData(current)).not.toHaveProperty('PropertyBuildingId');
        expect([legacy, legacyUntrusted, current]).toEqual(copies);
    });

    it('changes persisted relation only on explicit reassign and detach', async () => {
        const { jsonDb, properties, buildingRepository, createBuildingRepository } = await environment();
        const first = buildingRepository.create(buildingInput('Edificio A', 1));
        const second = buildingRepository.create(buildingInput('Edificio B', 2));
        const created = properties.createProperty(propertyInput(1), { buildingId: first.id });
        expect(jsonDb.getJsonDb().properties[0].relations.buildingId).toBe(first.id);
        properties.updateProperty(created.id, {
            ...created.formData,
            PropertyDescription: 'solo dati',
        });
        properties.archiveProperties([created.id]);
        expect(jsonDb.getJsonDb().properties[0].relations.buildingId).toBe(first.id);
        const reconstructed = createBuildingRepository({ accountId: ACCOUNT_A });
        expect(reconstructed.getById(first.id)?.unitsCount).toBe(1);
        properties.updateProperty(created.id, created.formData, { buildingId: second.id });
        expect(jsonDb.getJsonDb().properties[0].relations.buildingId).toBe(second.id);
        properties.updateProperty(created.id, created.formData, { buildingId: null });
        expect(jsonDb.getJsonDb().properties[0].relations.buildingId).toBeNull();
        assertIntegral(jsonDb.getJsonDb());
    });
});
