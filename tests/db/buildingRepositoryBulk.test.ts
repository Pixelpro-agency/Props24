import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultPropertyValues } from '../../src/components/property-form/schema';
import type { BuildingRecord, LocalDatabase, PropertyRecord } from '../../src/db/database.types';
import { BuildingDeleteBlockedError, BuildingNotFoundError } from '../../src/db/databaseErrors';
import { createBuildingRepositoryOperations } from '../../src/db/buildingRepository';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const NOW = '2026-08-23T10:00:00.000Z';
const EARLIER = '2026-08-22T10:00:00.000Z';
const ACCOUNT_A = 'user-501';
const ACCOUNT_B = 'user-502';
const KEY_A = `props24.localDb.${ACCOUNT_A}`;
const KEY_B = `props24.localDb.${ACCOUNT_B}`;

function building(id: string, overrides: Partial<BuildingRecord> = {}): BuildingRecord {
    return {
        id,
        createdAt: EARLIER,
        updatedAt: EARLIER,
        archived: false,
        identifier: id,
        color: '',
        address: `Via ${id}`,
        address2: '',
        city: 'Milano',
        postalCode: '20100',
        county: '',
        state: '',
        country: 'IT',
        size: null,
        constructionYear: null,
        description: '',
        privateNote: '',
        features: [],
        acquisitionDate: '',
        purchasePrice: null,
        acquisitionCosts: null,
        imu: null,
        unitsCount: 0,
        ...overrides,
    };
}

function property(buildingId: string, overrides: Partial<PropertyRecord> = {}): PropertyRecord {
    return {
        id: 'property-linked',
        createdAt: EARLIER,
        updatedAt: EARLIER,
        archived: false,
        formData: { ...defaultPropertyValues, PropertyTitle: 'Unit 1' },
        relations: { buildingId, tenantIds: [], leaseIds: [] },
        notes: [],
        activities: [],
        ...overrides,
    };
}

function database(buildings: BuildingRecord[], properties: PropertyRecord[] = []): LocalDatabase {
    return {
        meta: { schemaVersion: 4, seedVersion: 1, createdAt: EARLIER, updatedAt: EARLIER, source: 'seed' },
        buildings,
        properties,
        tenants: [],
        leases: [],
        payments: [],
        contacts: [],
        documents: [],
        reservations: [],
        catalogs: [],
        inventory: [],
        maintenance: [],
        tasks: [],
        notes: [],
        messages: [],
        candidates: [],
        settings: { marker: 'preserved' },
        userProfile: {},
        drafts: [],
    };
}

function fakeRepository(initial: LocalDatabase) {
    let current = initial;
    const saves: LocalDatabase[] = [];
    const repository = createBuildingRepositoryOperations({
        getDatabase: () => current,
        saveDatabase: (next) => {
            saves.push(next);
            current = next;
            return next;
        },
    });
    return { repository, saves, current: () => current };
}

describe('building repository bulk operations', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(NOW));
    });

    afterEach(() => {
        uninstallJsonDbWindow();
        vi.useRealTimers();
        vi.resetModules();
    });

    it('A5.1-01 archives the complete selection atomically with one timestamp and write', () => {
        const a = building('building-a');
        const b = building('building-b');
        const c = building('building-c');
        const state = fakeRepository(database([a, b, c]));
        const ids = ['building-a', 'building-b'];
        const originalIds = [...ids];

        expect(state.repository.archiveMany(ids)).toEqual({ operation: 'archive', ids: originalIds, count: 2 });
        expect(state.current().buildings[0]).toMatchObject({ archived: true, updatedAt: NOW });
        expect(state.current().buildings[1]).toMatchObject({ archived: true, updatedAt: NOW });
        expect(state.current().buildings[0].updatedAt).toBe(state.current().buildings[1].updatedAt);
        expect(state.current().buildings[2]).toBe(c);
        expect(state.saves).toHaveLength(1);
        expect(ids).toEqual(originalIds);
        expect(a).toEqual(building('building-a'));
    });

    it('A5.1-02 restores the complete selection atomically with one timestamp and write', () => {
        const a = building('building-a', { archived: true });
        const b = building('building-b', { archived: true });
        const c = building('building-c');
        const state = fakeRepository(database([a, b, c]));

        expect(state.repository.restoreMany(['building-a', 'building-b'])).toEqual({
            operation: 'restore', ids: ['building-a', 'building-b'], count: 2,
        });
        expect(state.current().buildings[0]).toMatchObject({ archived: false, updatedAt: NOW });
        expect(state.current().buildings[1]).toMatchObject({ archived: false, updatedAt: NOW });
        expect(state.current().buildings[0].updatedAt).toBe(state.current().buildings[1].updatedAt);
        expect(state.current().buildings[2]).toBe(c);
        expect(state.saves).toHaveLength(1);
    });

    it('A5.1-03 rejects missing IDs for archive and restore without partial writes', () => {
        for (const operation of ['archiveMany', 'restoreMany'] as const) {
            const original = building('building-a');
            const state = fakeRepository(database([original]));
            expect(() => state.repository[operation](['building-a', 'building-missing']))
                .toThrow(BuildingNotFoundError);
            expect(state.saves).toHaveLength(0);
            expect(state.current().buildings[0]).toBe(original);
        }
    });

    it('A5.1-04 deletes all free buildings atomically and preserves the database', () => {
        const c = building('building-c');
        const fixture = database([building('building-a'), building('building-b'), c]);
        const state = fakeRepository(fixture);

        expect(state.repository.deleteMany(['building-a', 'building-b'])).toEqual({
            operation: 'delete', ids: ['building-a', 'building-b'], count: 2,
        });
        expect(state.current().buildings).toEqual([c]);
        expect(state.current().buildings[0]).toBe(c);
        expect(state.current().settings).toBe(fixture.settings);
        expect(state.current().properties).toBe(fixture.properties);
        expect(state.saves).toHaveLength(1);
    });

    it('A5.1-05 blocks the whole delete when an archived property is linked', () => {
        const linked = property('building-linked', { archived: true });
        const fixture = database([building('building-free'), building('building-linked')], [linked]);
        const state = fakeRepository(fixture);

        expect(() => state.repository.deleteMany(['building-free', 'building-linked']))
            .toThrow(BuildingDeleteBlockedError);
        try {
            state.repository.deleteMany(['building-free', 'building-linked']);
        } catch (error) {
            expect(error).toMatchObject({ buildingId: 'building-linked', linkedPropertyIds: ['property-linked'] });
        }
        expect(state.saves).toHaveLength(0);
        expect(state.current()).toBe(fixture);
        expect(state.current().buildings).toHaveLength(2);
        expect(state.current().properties[0]).toBe(linked);
        expect(state.current().properties[0].relations.buildingId).toBe('building-linked');
    });

    it('A5.1-06 reports a missing ID before evaluating delete blockers', () => {
        const fixture = database([building('building-linked')], [property('building-linked')]);
        const state = fakeRepository(fixture);

        expect(() => state.repository.deleteMany(['building-linked', 'building-missing']))
            .toThrow(BuildingNotFoundError);
        expect(state.saves).toHaveLength(0);
        expect(state.current()).toBe(fixture);
    });

    it('A5.1-07 deduplicates in first-occurrence order and treats empty selections as no-ops', () => {
        const state = fakeRepository(database([building('building-a'), building('building-b')]));
        const ids = ['building-a', 'building-a', 'building-b'];

        expect(state.repository.archiveMany(ids)).toEqual({
            operation: 'archive', ids: ['building-a', 'building-b'], count: 2,
        });
        expect(ids).toEqual(['building-a', 'building-a', 'building-b']);
        expect(state.saves).toHaveLength(1);
        expect(state.repository.archiveMany([])).toEqual({ operation: 'archive', ids: [], count: 0 });
        expect(state.repository.restoreMany([])).toEqual({ operation: 'restore', ids: [], count: 0 });
        expect(state.repository.deleteMany([])).toEqual({ operation: 'delete', ids: [], count: 0 });
        expect(state.saves).toHaveLength(1);
    });

    it('A5.1-08 keeps bulk data and subscriptions account-scoped', async () => {
        const recordA = building('building-a');
        const recordB = building('building-b');
        const storage = new MemoryStorage({
            [KEY_A]: JSON.stringify(database([recordA])),
            [KEY_B]: JSON.stringify(database([recordB])),
        });
        installJsonDbWindow(storage);
        vi.resetModules();
        const { createBuildingRepository } = await import('../../src/db/buildingRepository');
        const repositoryA = createBuildingRepository({ accountId: ACCOUNT_A });
        const repositoryB = createBuildingRepository({ accountId: ACCOUNT_B });
        repositoryA.list();
        repositoryB.list();
        storage.resetOperationLogs();
        const notifyA = vi.fn();
        const notifyB = vi.fn();
        repositoryA.subscribe(notifyA);
        repositoryB.subscribe(notifyB);

        repositoryA.archiveMany(['building-a']);
        expect(notifyA).toHaveBeenCalledTimes(1);
        expect(notifyB).not.toHaveBeenCalled();
        expect(JSON.parse(storage.getItem(KEY_A) ?? '').buildings[0].archived).toBe(true);
        expect(JSON.parse(storage.getItem(KEY_B) ?? '').buildings[0]).toEqual(recordB);
        const writesA = storage.writesFor(KEY_A).length;
        const writesB = storage.writesFor(KEY_B).length;

        expect(() => repositoryA.archiveMany(['building-b'])).toThrow(expect.objectContaining({
            name: 'BuildingNotFoundError', buildingId: 'building-b',
        }));
        expect(notifyA).toHaveBeenCalledTimes(1);
        expect(notifyB).not.toHaveBeenCalled();
        expect(storage.writesFor(KEY_A)).toHaveLength(writesA);
        expect(storage.writesFor(KEY_B)).toHaveLength(writesB);
        expect(JSON.parse(storage.getItem(KEY_B) ?? '').buildings[0]).toEqual(recordB);
    });
});
