import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultPropertyValues, type PropertyFormData } from '../../src/components/property-form/schema';
import type { BuildingRecord, LocalDatabase, PropertyRecord } from '../../src/db/database.types';
import { assertDatabaseIntegrity, validateDatabaseRelations } from '../../src/db/databaseValidation';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const ACCOUNT = 'user-001';
const KEY = 'props24.localDb.user-001';
const NOW = '2026-08-21T15:00:00.000Z';

function database(): LocalDatabase {
  return {
    meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' }, properties: [], buildings: [],
    tenants: [], leases: [], payments: [], contacts: [], documents: [], reservations: [], catalogs: [], inventory: [], maintenance: [],
    tasks: [], notes: [], messages: [], candidates: [], settings: {}, userProfile: {}, drafts: [],
  };
}

function propertyInput(index = 1): PropertyFormData {
  return {
    ...defaultPropertyValues,
    PropertyTitle: `Unità ${index}`,
    PropertyAddress: `Via Unità ${index}`,
    PropertyCity: 'Milano',
    PropertyPostalCode: `2010${index}`,
    PropertyCountry: 'IT',
  };
}

function buildingInput(identifier: string, address: string) {
  return { identifier, address, city: 'Milano', postalCode: '20100', country: 'IT' };
}

async function environment() {
  const storage = new MemoryStorage({ [KEY]: JSON.stringify(database()) });
  installJsonDbWindow(storage);
  vi.resetModules();
  const jsonDb = await import('../../src/db/jsonDb');
  const buildings = await import('../../src/db/buildingRepository');
  const properties = await import('../../src/db/propertyRepository');
  jsonDb.setActiveDatabaseAccount(ACCOUNT);
  return { storage, jsonDb, properties, buildingRepository: buildings.createBuildingRepository({ accountId: ACCOUNT }) };
}

describe('property-building relation contract', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(NOW)); });
  afterEach(() => {
    uninstallJsonDbWindow();
    vi.useRealTimers();
    vi.doUnmock('../../src/db/jsonDb');
    vi.resetModules();
  });

  it('creates detached by default or explicitly without changing building counts', async () => {
    const { properties, buildingRepository } = await environment();
    const building = buildingRepository.create(buildingInput('Edificio A', 'Via A 1'));
    expect(properties.createProperty(propertyInput(1)).relations.buildingId).toBeNull();
    expect(properties.createProperty(propertyInput(2), { buildingId: null }).relations.buildingId).toBeNull();
    expect(buildingRepository.getById(building.id)?.unitsCount).toBe(0);
  });

  it('creates a linked property with one write and derives unitsCount without mutating inputs', async () => {
    const { storage, properties, buildingRepository } = await environment();
    const building = buildingRepository.create(buildingInput('Edificio A', 'Via A 1'));
    const formData = propertyInput(1);
    const relation = { buildingId: building.id };
    const formCopy = structuredClone(formData);
    const relationCopy = structuredClone(relation);
    storage.resetOperationLogs();
    const created = properties.createProperty(formData, relation);
    expect(created.relations.buildingId).toBe(building.id);
    expect(buildingRepository.getById(building.id)?.unitsCount).toBe(1);
    expect(storage.writesFor(KEY)).toHaveLength(1);
    expect(formData).toEqual(formCopy);
    expect(formData).not.toHaveProperty('buildingId');
    expect(relation).toEqual(relationCopy);
  });

  it('allows two linked properties with the same title and address without a cadastral collision', async () => {
    const { storage, jsonDb, properties, buildingRepository } = await environment();
    const building = buildingRepository.create(buildingInput('Edificio A', 'Via Comune 1'));
    const sharedLocation = {
      PropertyAddress: 'Via Comune 1',
      PropertyCity: 'Milano',
      PropertyPostalCode: '20100',
    };
    storage.resetOperationLogs();
    const sharedTitle = { PropertyTitle: 'Unità condivisa' };
    const first = properties.createProperty({ ...propertyInput(1), ...sharedLocation, ...sharedTitle }, { buildingId: building.id });
    expect(storage.writesFor(KEY)).toHaveLength(1);
    storage.resetOperationLogs();
    const second = properties.createProperty({ ...propertyInput(2), ...sharedLocation, ...sharedTitle }, { buildingId: building.id });
    expect(storage.writesFor(KEY)).toHaveLength(1);
    expect([first, second].map((item) => item.relations.buildingId)).toEqual([building.id, building.id]);
    expect(buildingRepository.getById(building.id)?.unitsCount).toBe(2);
    const finalDatabase = jsonDb.getJsonDb();
    expect(finalDatabase.properties).toHaveLength(2);
    expect(finalDatabase.properties.map((item) => item.formData.PropertyTitle)).toEqual([
      'Unità condivisa',
      'Unità condivisa',
    ]);
    expect(() => assertDatabaseIntegrity(finalDatabase)).not.toThrow();
    expect(validateDatabaseRelations(finalDatabase).map((issue) => issue.code))
      .not.toContain('PROPERTY_LOCATION_DUPLICATE');
    storage.resetOperationLogs();
    const third = properties.createProperty(
      { ...propertyInput(3), ...sharedLocation, PropertyTitle: first.formData.PropertyTitle },
      { buildingId: building.id },
    );
    expect(third.formData.PropertyTitle).toBe(first.formData.PropertyTitle);
    expect(buildingRepository.getById(building.id)?.unitsCount).toBe(3);
    expect(storage.writesFor(KEY)).toHaveLength(1);
  });

  it.each([
    ['missing', 'building-missing', 'BuildingNotFoundError'],
    ['empty', '', 'BuildingNotFoundError'],
  ])('rejects create toward a %s building without writes', async (_label, buildingId, errorName) => {
    const { storage, properties, buildingRepository } = await environment();
    const before = buildingRepository.list();
    storage.resetOperationLogs();
    expect(() => properties.createProperty(propertyInput(1), { buildingId })).toThrow(expect.objectContaining({ name: errorName, buildingId }));
    expect(properties.listProperties()).toEqual([]);
    expect(buildingRepository.list()).toEqual(before);
    expect(storage.writesFor(KEY)).toHaveLength(0);
  });

  it('rejects create toward an archived building without writes', async () => {
    const { storage, properties, buildingRepository } = await environment();
    const building = buildingRepository.create(buildingInput('Archiviato', 'Via A 1'));
    buildingRepository.archive(building.id);
    storage.resetOperationLogs();
    expect(() => properties.createProperty(propertyInput(1), { buildingId: building.id }))
      .toThrow(expect.objectContaining({ name: 'PropertyBuildingArchivedError', buildingId: building.id }));
    expect(buildingRepository.getById(building.id)?.unitsCount).toBe(0);
    expect(storage.writesFor(KEY)).toHaveLength(0);
  });

  it('preserves an existing relation, including an explicitly same archived building', async () => {
    const { properties, buildingRepository } = await environment();
    const building = buildingRepository.create(buildingInput('Edificio A', 'Via A 1'));
    const created = properties.createProperty(propertyInput(1), { buildingId: building.id });
    buildingRepository.archive(building.id);
    const updatedForm = { ...created.formData, PropertyDescription: 'Aggiornata' };
    expect(properties.updateProperty(created.id, updatedForm)?.relations).toEqual(created.relations);
    expect(properties.updateProperty(created.id, updatedForm, {})?.relations).toEqual(created.relations);
    expect(properties.updateProperty(created.id, updatedForm, { buildingId: building.id })?.relations).toEqual(created.relations);
    expect(buildingRepository.getById(building.id)).toMatchObject({ archived: true, unitsCount: 1 });
  });

  it('reassigns and detaches with one write each while preserving other relation arrays', async () => {
    const { storage, properties, buildingRepository } = await environment();
    const first = buildingRepository.create(buildingInput('Edificio A', 'Via A 1'));
    const second = buildingRepository.create(buildingInput('Edificio B', 'Via B 1'));
    const created = properties.createProperty(propertyInput(1), { buildingId: first.id });
    const patch = { buildingId: second.id };
    const patchCopy = structuredClone(patch);
    storage.resetOperationLogs();
    const reassigned = properties.updateProperty(created.id, created.formData, patch);
    expect(reassigned?.relations).toEqual({ buildingId: second.id, tenantIds: [], leaseIds: [] });
    expect(buildingRepository.getById(first.id)?.unitsCount).toBe(0);
    expect(buildingRepository.getById(second.id)?.unitsCount).toBe(1);
    expect(storage.writesFor(KEY)).toHaveLength(1);
    expect(patch).toEqual(patchCopy);
    storage.resetOperationLogs();
    expect(properties.updateProperty(created.id, created.formData, { buildingId: null })?.relations.buildingId).toBeNull();
    expect(buildingRepository.getById(second.id)?.unitsCount).toBe(0);
    expect(storage.writesFor(KEY)).toHaveLength(1);
  });

  it('rejects missing and archived reassignment atomically without writes', async () => {
    const { storage, jsonDb, properties, buildingRepository } = await environment();
    const first = buildingRepository.create(buildingInput('Edificio A', 'Via A 1'));
    const archived = buildingRepository.create(buildingInput('Edificio B', 'Via B 1'));
    buildingRepository.archive(archived.id);
    const created = properties.createProperty(propertyInput(1), { buildingId: first.id });
    for (const [buildingId, errorName] of [['building-missing', 'BuildingNotFoundError'], [archived.id, 'PropertyBuildingArchivedError']]) {
      storage.resetOperationLogs();
      expect(() => properties.updateProperty(created.id, created.formData, { buildingId })).toThrow(expect.objectContaining({ name: errorName }));
      expect(jsonDb.getJsonDb().properties.find((item) => item.id === created.id)?.relations.buildingId).toBe(first.id);
      expect(buildingRepository.getById(first.id)?.unitsCount).toBe(1);
      expect(buildingRepository.getById(archived.id)?.unitsCount).toBe(0);
      expect(storage.writesFor(KEY)).toHaveLength(0);
    }
  });

  it('keeps the relation and count on archive, then derives zero after free delete', async () => {
    const { jsonDb, properties, buildingRepository } = await environment();
    const building = buildingRepository.create(buildingInput('Edificio A', 'Via A 1'));
    const created = properties.createProperty(propertyInput(1), { buildingId: building.id });
    properties.archiveProperties([created.id]);
    const archived = jsonDb.getJsonDb().properties.find((item) => item.id === created.id);
    expect(archived).toMatchObject({ archived: true, relations: { buildingId: building.id } });
    expect(buildingRepository.getById(building.id)?.unitsCount).toBe(1);
    expect(properties.deleteProperties([created.id])).toEqual({ deleted: [created.id], blocked: [] });
    expect(jsonDb.getJsonDb().properties.find((item) => item.id === created.id)).toBeUndefined();
    expect(buildingRepository.getById(building.id)?.unitsCount).toBe(0);
  });

  it('leaves an integral database after create, reassign and detach', async () => {
    const { jsonDb, properties, buildingRepository } = await environment();
    const first = buildingRepository.create(buildingInput('Edificio A', 'Via A 1'));
    const second = buildingRepository.create(buildingInput('Edificio B', 'Via B 1'));
    const created = properties.createProperty(propertyInput(1), { buildingId: first.id });
    properties.updateProperty(created.id, created.formData, { buildingId: second.id });
    properties.updateProperty(created.id, created.formData, { buildingId: null });
    const finalDatabase = jsonDb.getJsonDb();
    expect(() => assertDatabaseIntegrity(finalDatabase)).not.toThrow();
    expect(validateDatabaseRelations(finalDatabase).map((issue) => issue.code)).not.toEqual(expect.arrayContaining(['ORPHAN_BUILDING', 'BUILDING_UNITS_COUNT_OUT_OF_SYNC']));
  });

  it('preserves non-empty tenantIds and leaseIds when reassigning through the real updateProperty', async () => {
    const buildingRecord = (id: string, identifier: string, address: string): BuildingRecord => ({
      id, identifier, address, city: 'Milano', postalCode: '20100', country: 'IT', createdAt: NOW, updatedAt: NOW, archived: false,
      color: '', address2: '', county: '', state: '', size: null, constructionYear: null, description: '', privateNote: '', features: [],
      acquisitionDate: '', purchasePrice: null, acquisitionCosts: null, imu: null, unitsCount: 0,
    });
    const formData = propertyInput(1);
    const existing: PropertyRecord = {
      id: 'property-existing', createdAt: NOW, updatedAt: NOW, archived: false, formData,
      relations: { buildingId: 'building-a', tenantIds: ['tenant-existing'], leaseIds: ['lease-existing'] },
      notes: [], activities: [],
    };
    const current = database();
    current.buildings = [buildingRecord('building-a', 'Edificio A', 'Via A 1'), buildingRecord('building-b', 'Edificio B', 'Via B 1')];
    current.properties = [existing];
    const saveJsonDb = vi.fn((next: LocalDatabase) => structuredClone(next));
    vi.resetModules();
    vi.doMock('../../src/db/jsonDb', () => ({
      getJsonDb: () => current,
      saveJsonDb,
      generateId: () => 'unused',
      getRecordById: () => null,
      updateRecord: vi.fn(),
      deleteRecord: vi.fn(),
    }));
    const { updateProperty } = await import('../../src/db/propertyRepository');
    const relationPatch = { buildingId: 'building-b' };
    const relationPatchCopy = structuredClone(relationPatch);

    const updated = updateProperty(existing.id, formData, relationPatch);

    expect(saveJsonDb).toHaveBeenCalledTimes(1);
    const savedDatabase = saveJsonDb.mock.calls[0][0];
    expect(savedDatabase.properties[0].relations).toEqual({
      buildingId: 'building-b',
      tenantIds: ['tenant-existing'],
      leaseIds: ['lease-existing'],
    });
    expect(updated?.relations).toEqual(savedDatabase.properties[0].relations);
    expect(relationPatch).toEqual(relationPatchCopy);
  });
});
