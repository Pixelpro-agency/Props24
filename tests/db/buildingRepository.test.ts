import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultPropertyValues } from '../../src/components/property-form/schema';
import type { BuildingRecord, LocalDatabase, PropertyRecord } from '../../src/db/database.types';
import {
  BuildingDeleteBlockedError,
  BuildingNotFoundError,
  DuplicateBuildingIdentifierError,
  DuplicateBuildingLocationError,
} from '../../src/db/databaseErrors';
import {
  createBuildingRepositoryOperations,
  type BuildingCreateInput,
  type BuildingUpdateInput,
} from '../../src/db/buildingRepository';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const NOW = '2026-08-21T10:00:00.000Z';
const EARLIER = '2026-08-20T10:00:00.000Z';
const ACCOUNT_A = 'user-001';
const ACCOUNT_B = 'user-002';
const KEY_A = 'props24.localDb.user-001';
const KEY_B = 'props24.localDb.user-002';

function building(overrides: Partial<BuildingRecord> = {}): BuildingRecord {
  return {
    id: 'building-existing', createdAt: EARLIER, updatedAt: EARLIER, archived: false,
    identifier: 'Palazzo Centro', color: '#123456', address: 'Via Roma 10', address2: '', city: 'Milano', postalCode: '20100',
    county: '', state: '', country: 'IT', size: null, constructionYear: null, description: '', privateNote: '', features: [],
    acquisitionDate: '', purchasePrice: null, acquisitionCosts: null, imu: null, unitsCount: 0, ...overrides,
  };
}

function property(buildingId: string, overrides: Partial<PropertyRecord> = {}): PropertyRecord {
  return {
    id: 'property-linked', createdAt: EARLIER, updatedAt: EARLIER, archived: false,
    formData: { ...defaultPropertyValues, PropertyTitle: 'Unità 1' },
    relations: { buildingId, tenantIds: [], leaseIds: [] }, notes: [], activities: [], ...overrides,
  };
}

function database(buildings: BuildingRecord[] = [building()], properties: PropertyRecord[] = []): LocalDatabase {
  return {
    meta: { schemaVersion: 4, seedVersion: 1, createdAt: EARLIER, updatedAt: EARLIER, source: 'seed' }, buildings, properties,
    tenants: [], leases: [], payments: [], contacts: [], documents: [], reservations: [], catalogs: [], inventory: [], maintenance: [],
    tasks: [], notes: [], messages: [], candidates: [], settings: {}, userProfile: {}, drafts: [],
  };
}

function input(overrides: Partial<BuildingCreateInput> = {}): BuildingCreateInput {
  return { identifier: 'Palazzo Nuovo', address: 'Via Verdi 2', city: 'Milano', postalCode: '20121', country: 'IT', ...overrides };
}

function fakeRepository(initial = database()) {
  let current = initial;
  const saves: LocalDatabase[] = [];
  const repository = createBuildingRepositoryOperations({
    getDatabase: () => current,
    saveDatabase: (next) => {
      saves.push(next);
      current = { ...next, buildings: next.buildings.map((item) => ({ ...item, identifier: item.identifier.trim() })) };
      return current;
    },
  });
  return { repository, saves, current: () => current };
}

describe('building repository operations', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(NOW)); });
  afterEach(() => vi.useRealTimers());

  it('lists and gets buildings without writes', () => {
    const { repository, saves } = fakeRepository();
    expect(repository.list()).toEqual([building()]);
    expect(repository.getById('building-existing')).toEqual(building());
    expect(repository.getById('missing')).toBeNull();
    expect(saves).toHaveLength(0);
  });

  it('creates all canonical fields, returns the saved record and does not mutate input', () => {
    const { repository, saves } = fakeRepository(database([]));
    const value = input({ identifier: ' Palazzo Nuovo ', color: '#fff', address2: 'Scala B', county: 'MI', state: 'LOM', size: 120,
      constructionYear: 1990, description: 'Descrizione', privateNote: 'Nota', features: ['Ascensore'], acquisitionDate: '2020-01-02',
      purchasePrice: 300000, acquisitionCosts: 10000, imu: 1200 });
    const original = structuredClone(value);
    const created = repository.create(value);
    expect(created).toMatchObject({ identifier: 'Palazzo Nuovo', archived: false, unitsCount: 0, createdAt: NOW, updatedAt: NOW });
    expect(created.id).toMatch(/^building-/);
    expect(created).toMatchObject({ color: '#fff', address2: 'Scala B', size: 120, features: ['Ascensore'], purchasePrice: 300000 });
    expect(saves).toHaveLength(1);
    expect(value).toEqual(original);
    expect(created).not.toBe(saves[0].buildings[0]);
  });

  it('rejects duplicate identifier and location, including archived records, without writing', () => {
    const fixture = database([building({ archived: true })]);
    const first = fakeRepository(fixture);
    expect(() => first.repository.create(input({ identifier: ' palazzo centro ' }))).toThrow(DuplicateBuildingIdentifierError);
    expect(first.saves).toHaveLength(0);
    const second = fakeRepository(fixture);
    expect(() => second.repository.create(input({ identifier: 'Altro', address: ' VIA  ROMA 10 ', postalCode: '20100' }))).toThrow(DuplicateBuildingLocationError);
    expect(second.saves).toHaveLength(0);
  });

  it('updates authorized fields, preserves managed fields and does not mutate inputs', () => {
    const originalRecord = building({ archived: true, unitsCount: 2 });
    const { repository, saves } = fakeRepository(database([originalRecord], [property(originalRecord.id), property(originalRecord.id, { id: 'property-2' })]));
    const patch: BuildingUpdateInput = { identifier: 'Palazzo Centro', description: 'Aggiornato', features: ['Cortile'] };
    const originalPatch = structuredClone(patch);
    const updated = repository.update(originalRecord.id, patch);
    expect(updated).toMatchObject({ id: originalRecord.id, createdAt: EARLIER, archived: true, unitsCount: 2, updatedAt: NOW, description: 'Aggiornato' });
    expect(saves).toHaveLength(1);
    expect(patch).toEqual(originalPatch);
    expect(originalRecord).toEqual(building({ archived: true, unitsCount: 2 }));
  });

  it('rejects an update conflict without writing', () => {
    const { repository, saves } = fakeRepository(database([building(), building({ id: 'building-2', identifier: 'Altro', address: 'Via Blu 1' })]));
    expect(() => repository.update('building-2', { identifier: 'PALAZZO CENTRO' })).toThrow(DuplicateBuildingIdentifierError);
    expect(saves).toHaveLength(0);
  });

  it.each(['update', 'archive', 'restore', 'delete'] as const)('%s rejects a missing building without writes', (operation) => {
    const { repository, saves } = fakeRepository(database([]));
    const call = operation === 'update' ? () => repository.update('missing', {}) : () => repository[operation]('missing');
    expect(call).toThrow(BuildingNotFoundError);
    expect(saves).toHaveLength(0);
  });

  it('archives and restores with one write each while preserving other fields', () => {
    const state = fakeRepository();
    const archived = state.repository.archive('building-existing');
    expect(archived).toEqual({ ...building(), archived: true, updatedAt: NOW });
    const restored = state.repository.restore('building-existing');
    expect(restored).toEqual({ ...building(), updatedAt: NOW });
    expect(state.saves).toHaveLength(2);
  });

  it('deletes a free building with one write', () => {
    const { repository, saves, current } = fakeRepository();
    expect(repository.delete('building-existing')).toBe(true);
    expect(current().buildings).toEqual([]);
    expect(saves).toHaveLength(1);
  });

  it.each([false, true])('blocks delete for a linked property (archived=%s)', (archived) => {
    const linked = property('building-existing', { archived });
    const fixture = database([building()], [linked]);
    const { repository, saves, current } = fakeRepository(fixture);
    expect(() => repository.delete('building-existing')).toThrow(BuildingDeleteBlockedError);
    try { repository.delete('building-existing'); } catch (error) {
      expect(error).toMatchObject({ buildingId: 'building-existing', linkedPropertyIds: ['property-linked'] });
    }
    expect(current().buildings).toHaveLength(1);
    expect(current().properties).toEqual([linked]);
    expect(saves).toHaveLength(0);
  });
});

describe('account-scoped building repository', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(NOW)); });
  afterEach(() => { uninstallJsonDbWindow(); vi.useRealTimers(); vi.resetModules(); });

  it('keeps data, global retargeting and subscriptions isolated by account', async () => {
    const storage = new MemoryStorage({ [KEY_A]: JSON.stringify(database([])), [KEY_B]: JSON.stringify(database([])) });
    installJsonDbWindow(storage);
    vi.resetModules();
    const jsonDb = await import('../../src/db/jsonDb');
    const { createBuildingRepository } = await import('../../src/db/buildingRepository');
    jsonDb.setActiveDatabaseAccount(ACCOUNT_A);
    const repositoryA = createBuildingRepository({ accountId: ACCOUNT_A });
    const repositoryB = createBuildingRepository({ accountId: ACCOUNT_B });
    const notifyA = vi.fn();
    const notifyB = vi.fn();
    repositoryA.subscribe(notifyA);
    repositoryB.subscribe(notifyB);
    jsonDb.setActiveDatabaseAccount(ACCOUNT_B);
    notifyA.mockClear();
    notifyB.mockClear();
    const writesA = storage.writesFor(KEY_A).length;
    const writesB = storage.writesFor(KEY_B).length;

    const createdA = repositoryA.create(input());
    expect(repositoryB.list()).toEqual([]);
    expect(notifyA).toHaveBeenCalledTimes(1);
    expect(notifyB).not.toHaveBeenCalled();
    const createdB = repositoryB.create(input());
    expect(notifyA).toHaveBeenCalledTimes(1);
    expect(notifyB).toHaveBeenCalledTimes(1);
    repositoryA.update(createdA.id, { description: 'Solo A' });
    repositoryB.update(createdB.id, { description: 'Solo B' });
    expect(repositoryA.getById(createdA.id)?.description).toBe('Solo A');
    expect(repositoryA.getById(createdB.id)).toBeNull();
    expect(repositoryB.getById(createdB.id)?.description).toBe('Solo B');
    expect(repositoryB.getById(createdA.id)).toBeNull();
    expect(storage.writesFor(KEY_A)).toHaveLength(writesA + 2);
    expect(storage.writesFor(KEY_B)).toHaveLength(writesB + 2);
  });
});
