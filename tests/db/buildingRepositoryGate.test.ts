import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultPropertyValues } from '../../src/components/property-form/schema';
import type { BuildingRecord, LocalDatabase, PropertyRecord } from '../../src/db/database.types';
import {
  BuildingDeleteBlockedError,
  BuildingNotFoundError,
  DuplicateBuildingIdentifierError,
} from '../../src/db/databaseErrors';
import { assertDatabaseIntegrity, validateDatabaseRelations } from '../../src/db/databaseValidation';
import { createBuildingRepositoryOperations, type BuildingCreateInput } from '../../src/db/buildingRepository';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const NOW = '2026-08-21T12:00:00.000Z';
const EARLIER = '2026-08-20T12:00:00.000Z';
const ACCOUNT_A = 'user-001';
const ACCOUNT_B = 'user-002';
const KEY_A = 'props24.localDb.user-001';
const KEY_B = 'props24.localDb.user-002';

function property(buildingId: string, archived = false): PropertyRecord {
  return {
    id: archived ? 'property-archived' : 'property-linked', createdAt: EARLIER, updatedAt: EARLIER, archived,
    formData: { ...defaultPropertyValues, PropertyTitle: archived ? 'Unità archiviata' : 'Unità collegata', PropertyAddress: 'Via Legata 1', PropertyCity: 'Milano', PropertyPostalCode: '20100', PropertyCountry: 'IT' },
    relations: { buildingId, tenantIds: [], leaseIds: [] }, notes: [], activities: [],
  };
}

function database(buildings: BuildingRecord[] = [], properties: PropertyRecord[] = []): LocalDatabase {
  return {
    meta: { schemaVersion: 4, seedVersion: 1, createdAt: EARLIER, updatedAt: EARLIER, source: 'seed' }, buildings, properties,
    tenants: [], leases: [], payments: [], contacts: [], documents: [], reservations: [], catalogs: [], inventory: [], maintenance: [],
    tasks: [], notes: [], messages: [], candidates: [], settings: {}, userProfile: {}, drafts: [],
  };
}

function completeInput(overrides: Partial<BuildingCreateInput> = {}): BuildingCreateInput {
  return {
    identifier: 'Palazzo Completo', color: '#abcdef', address: 'Via Verdi 20', address2: 'Scala B', city: 'Milano', postalCode: '20121',
    county: 'MI', state: 'LOM', country: 'IT', size: 245.5, constructionYear: 1988, description: 'Descrizione completa',
    privateNote: 'Nota privata', features: ['Ascensore', 'Cortile'], acquisitionDate: '2020-05-06', purchasePrice: 500000,
    acquisitionCosts: 25000, imu: 2300, ...overrides,
  };
}

async function realEnvironment(first = database(), second = database()) {
  const storage = new MemoryStorage({ [KEY_A]: JSON.stringify(first), [KEY_B]: JSON.stringify(second) });
  installJsonDbWindow(storage);
  vi.resetModules();
  const jsonDb = await import('../../src/db/jsonDb');
  const repositoryModule = await import('../../src/db/buildingRepository');
  jsonDb.setActiveDatabaseAccount(ACCOUNT_A);
  return { storage, jsonDb, createRepository: repositoryModule.createBuildingRepository };
}

describe('A1 consolidated building repository gate', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(NOW)); });
  afterEach(() => { uninstallJsonDbWindow(); vi.useRealTimers(); vi.resetModules(); });

  it('round-trips a complete record through real storage and repository reconstruction', async () => {
    const { createRepository } = await realEnvironment();
    const input = completeInput();
    const original = structuredClone(input);
    const repository = createRepository({ accountId: ACCOUNT_A });
    const created = repository.create(input);
    const reread = repository.getById(created.id);
    const reconstructed = createRepository({ accountId: ACCOUNT_A }).getById(created.id);

    expect(created).toEqual(reread);
    expect(reconstructed).toEqual(created);
    expect(created).toMatchObject({ ...input, archived: false, unitsCount: 0, createdAt: NOW, updatedAt: NOW });
    expect(created.id).toMatch(/^building-/);
    expect(input).toEqual(original);
  });

  it('returns central normalization and rejects caller control of managed fields', async () => {
    const { createRepository } = await realEnvironment();
    const repository = createRepository({ accountId: ACCOUNT_A });
    const malicious = {
      ...completeInput({ identifier: '  Palazzo Normalizzato  ', features: ['Ascensore', 'Ascensore'], acquisitionDate: '06/05/2020' }),
      id: 'forced-id', createdAt: EARLIER, updatedAt: EARLIER, archived: true, unitsCount: 99, size: Number.POSITIVE_INFINITY,
    } as BuildingCreateInput;
    const created = repository.create(malicious);
    expect(created).toMatchObject({ identifier: '  Palazzo Normalizzato  ', features: ['Ascensore'], acquisitionDate: '2020-05-06', size: null });
    expect(created).toMatchObject({ createdAt: NOW, updatedAt: NOW, archived: false, unitsCount: 0 });
    expect(created.id).not.toBe('forced-id');

    const previous = repository.getById(created.id) as BuildingRecord;
    const patch = { id: 'other', createdAt: 'x', updatedAt: 'x', archived: true, unitsCount: 77, description: 'Aggiornato' };
    const patchCopy = structuredClone(patch);
    const updated = repository.update(created.id, patch as never);
    expect(updated).toMatchObject({ id: created.id, createdAt: NOW, updatedAt: NOW, archived: false, unitsCount: 0, description: 'Aggiornato' });
    expect(patch).toEqual(patchCopy);
    expect(previous).toEqual(created);
  });

  it('enforces ED-01 with self-edit, other records and archived reservations', async () => {
    const { createRepository } = await realEnvironment();
    const repository = createRepository({ accountId: ACCOUNT_A });
    const first = repository.create(completeInput({ identifier: 'Palazzo Centro' }));
    expect(() => repository.create(completeInput({ identifier: ' PALAZZO   CENTRO ', address: 'Via Blu 1' }))).toThrow(expect.objectContaining({ name: 'DuplicateBuildingIdentifierError' }));
    expect(repository.update(first.id, { identifier: ' PALAZZO   CENTRO ' }).identifier).toBe(' PALAZZO   CENTRO ');
    const second = repository.create(completeInput({ identifier: 'Secondo', address: 'Via Blu 1' }));
    expect(() => repository.update(second.id, { identifier: 'palazzo centro' })).toThrow(expect.objectContaining({ name: 'DuplicateBuildingIdentifierError' }));
    repository.archive(first.id);
    expect(() => repository.create(completeInput({ identifier: 'PALAZZO CENTRO', address: 'Via Gialla 3' }))).toThrow(expect.objectContaining({ name: 'DuplicateBuildingIdentifierError' }));
    expect(repository.list()).toHaveLength(2);
  });

  it('enforces ED-02 with self-edit and preserves civic suffix distinctions', async () => {
    const { createRepository } = await realEnvironment();
    const repository = createRepository({ accountId: ACCOUNT_A });
    const first = repository.create(completeInput({ identifier: 'Dieci', address: 'Via Roma 10' }));
    expect(() => repository.create(completeInput({ identifier: 'Duplicato', address: ' VIA  ROMA 10 ', address2: 'Scala X', county: 'XX', state: 'YY' })))
      .toThrow(expect.objectContaining({ name: 'DuplicateBuildingLocationError' }));
    expect(repository.update(first.id, { address: ' VIA ROMA 10 ' }).id).toBe(first.id);
    const bis = repository.create(completeInput({ identifier: 'Dieci bis', address: 'Via Roma 10 bis' }));
    const ter = repository.create(completeInput({ identifier: 'Dieci ter', address: 'Via Roma 10 ter' }));
    expect(() => repository.update(ter.id, { address: bis.address })).toThrow(expect.objectContaining({ name: 'DuplicateBuildingLocationError' }));
    expect(repository.list().map((item) => item.address)).toEqual([' VIA ROMA 10 ', 'Via Roma 10 bis', 'Via Roma 10 ter']);
  });

  it('isolates physical account storage and keeps a captured repository bound after global retargeting', async () => {
    const { storage, jsonDb, createRepository } = await realEnvironment();
    const repositoryA = createRepository({ accountId: ACCOUNT_A });
    const repositoryB = createRepository({ accountId: ACCOUNT_B });
    jsonDb.setActiveDatabaseAccount(ACCOUNT_B);
    const writesA = storage.writesFor(KEY_A).length;
    const writesB = storage.writesFor(KEY_B).length;
    const createdA = repositoryA.create(completeInput());
    const createdB = repositoryB.create(completeInput());
    repositoryA.update(createdA.id, { description: 'Solo A' });
    expect(storage.writesFor(KEY_A)).toHaveLength(writesA + 2);
    expect(storage.writesFor(KEY_B)).toHaveLength(writesB + 1);
    const storedA = JSON.parse(storage.getItem(KEY_A) as string) as LocalDatabase;
    const storedB = JSON.parse(storage.getItem(KEY_B) as string) as LocalDatabase;
    expect(storedA.buildings).toHaveLength(1);
    expect(storedB.buildings).toHaveLength(1);
    expect(storedA.buildings[0]).toMatchObject({ id: createdA.id, description: 'Solo A' });
    expect(storedB.buildings[0].id).toBe(createdB.id);
  });

  it('reconstructs lifecycle state, derives unitsCount and protects linked deletion without cascade', async () => {
    const { jsonDb, createRepository } = await realEnvironment();
    const repository = createRepository({ accountId: ACCOUNT_A });
    const free = repository.create(completeInput({ identifier: 'Libero' }));
    repository.update(free.id, { description: 'Persistito' });
    expect(createRepository({ accountId: ACCOUNT_A }).getById(free.id)?.description).toBe('Persistito');
    repository.archive(free.id);
    expect(createRepository({ accountId: ACCOUNT_A }).getById(free.id)?.archived).toBe(true);
    repository.restore(free.id);
    expect(createRepository({ accountId: ACCOUNT_A }).getById(free.id)?.archived).toBe(false);
    expect(repository.delete(free.id)).toBe(true);
    expect(createRepository({ accountId: ACCOUNT_A }).getById(free.id)).toBeNull();

    const linked = repository.create(completeInput({ identifier: 'Collegato', address: 'Via Legata 1' }));
    const scope = jsonDb.createJsonDbAccountScope(ACCOUNT_A);
    const linkedProperty = property(linked.id, true);
    const beforeLink = scope.getDatabase();
    scope.saveDatabase({ ...beforeLink, buildings: beforeLink.buildings.map((item) => ({ ...item, unitsCount: 999 })), properties: [linkedProperty] });
    expect(createRepository({ accountId: ACCOUNT_A }).getById(linked.id)?.unitsCount).toBe(1);
    expect(() => repository.delete(linked.id)).toThrow(expect.objectContaining({ name: 'BuildingDeleteBlockedError' }));
    try { repository.delete(linked.id); } catch (error) {
      expect(error).toMatchObject({ buildingId: linked.id, linkedPropertyIds: ['property-archived'] });
    }
    const after = scope.getDatabase();
    expect(after.buildings.some((item) => item.id === linked.id)).toBe(true);
    expect(after.properties).toHaveLength(1);
    expect(after.properties[0]).toMatchObject({ id: linkedProperty.id, archived: true, relations: linkedProperty.relations });
  });

  it('consolidates zero-write and one-write contracts with a spy gateway', () => {
    let current = database();
    let writes = 0;
    const repository = createBuildingRepositoryOperations({ getDatabase: () => current, saveDatabase: (next) => { writes += 1; current = next; return next; } });
    const delta = (action: () => unknown, expected: number) => { const before = writes; action(); expect(writes - before).toBe(expected); };
    delta(() => repository.list(), 0);
    delta(() => repository.getById('missing'), 0);
    let first!: BuildingRecord;
    delta(() => { first = repository.create(completeInput()); }, 1);
    delta(() => expect(() => repository.create(completeInput({ identifier: ' PALAZZO   COMPLETO ', address: 'Via Altra 1' }))).toThrow(DuplicateBuildingIdentifierError), 0);
    delta(() => repository.update(first.id, { description: 'Update' }), 1);
    let second!: BuildingRecord;
    delta(() => { second = repository.create(completeInput({ identifier: 'Secondo', address: 'Via Seconda 2' })); }, 1);
    delta(() => expect(() => repository.update(second.id, { identifier: first.identifier })).toThrow(DuplicateBuildingIdentifierError), 0);
    delta(() => repository.archive(first.id), 1);
    delta(() => repository.restore(first.id), 1);
    delta(() => repository.delete(second.id), 1);
    current = { ...current, properties: [property(first.id)] };
    delta(() => expect(() => repository.delete(first.id)).toThrow(BuildingDeleteBlockedError), 0);
    for (const operation of ['update', 'archive', 'restore', 'delete'] as const) {
      delta(() => expect(() => operation === 'update' ? repository.update('missing', {}) : repository[operation]('missing')).toThrow(BuildingNotFoundError), 0);
    }
  });

  it('preserves prior records, supports unsubscribe and leaves a valid database after lifecycle', async () => {
    const { jsonDb, createRepository } = await realEnvironment();
    const repository = createRepository({ accountId: ACCOUNT_A });
    const callback = vi.fn();
    const unsubscribe = repository.subscribe(callback);
    const created = repository.create(completeInput());
    const snapshot = structuredClone(created);
    expect(callback).toHaveBeenCalledTimes(1);
    repository.update(created.id, { description: 'Nuova' });
    expect(created).toEqual(snapshot);
    repository.archive(created.id);
    expect(created).toEqual(snapshot);
    repository.restore(created.id);
    expect(created).toEqual(snapshot);
    unsubscribe();
    repository.update(created.id, { privateNote: 'Dopo unsubscribe' });
    expect(callback).toHaveBeenCalledTimes(4);

    const finalDatabase = jsonDb.createJsonDbAccountScope(ACCOUNT_A).getDatabase();
    expect(() => assertDatabaseIntegrity(finalDatabase)).not.toThrow();
    const forbidden = ['BUILDING_IDENTIFIER_REQUIRED', 'BUILDING_IDENTIFIER_DUPLICATE', 'BUILDING_LOCATION_DUPLICATE', 'BUILDING_COUNTRY_REQUIRED', 'BUILDING_UNITS_COUNT_OUT_OF_SYNC'];
    expect(validateDatabaseRelations(finalDatabase).map((issue) => issue.code)).not.toEqual(expect.arrayContaining(forbidden));
  });
});
