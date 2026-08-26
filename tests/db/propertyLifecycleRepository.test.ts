import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultPropertyValues } from '../../src/components/property-form/schema';
import type { BuildingRecord, LeaseRecord, LocalDatabase, PaymentRecord, PropertyRecord } from '../../src/db/database.types';
import { PropertyDeleteBlockedError, PropertyNotFoundError } from '../../src/db/databaseErrors';
import { createPropertyLifecycleRepositoryOperations } from '../../src/db/propertyLifecycleRepository';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const NOW = '2026-08-26T10:00:00.000Z';
const EARLIER = '2026-08-25T10:00:00.000Z';
const ACCOUNT_A = 'user-601';
const ACCOUNT_B = 'user-602';
const KEY_A = `props24.localDb.${ACCOUNT_A}`;
const KEY_B = `props24.localDb.${ACCOUNT_B}`;

const file = (id: string) => ({ id, name: 'file.pdf', type: 'application/pdf', size: 1, lastModified: 1, dataUrl: 'data:application/pdf;base64,WA==' });
function property(id: string, overrides: Partial<PropertyRecord> = {}): PropertyRecord {
    return {
        id,
        createdAt: EARLIER,
        updatedAt: EARLIER,
        archived: false,
        formData: {
            ...defaultPropertyValues,
            PropertyTitle: id,
            PropertyTypeID: 'appartamento',
            PropertyAddress: 'Via Roma 1',
            PropertyCity: 'Roma',
            PropertyPostalCode: '00100',
            PropertyCounty: 'RM',
            PropertyState: 'Lazio',
            PropertyCountry: 'IT',
            PropertyCadastreDocument: file('cadastre-old'),
            PropertyKeys: [{ id: 'key-old', description: '', number: '', quantity: 1, holder: '', comments: '' }],
            PropertyContracts: [{ id: 'contract-old', type: '', description: '', releaseDate: '', expiryDate: '', comments: '', file: file('contract-file-old') }],
            PropertyPhotos: [{ ...file('photo-old'), type: 'image/png' }],
            PropertyContacts: [{ id: 'contact-old', firstName: '', lastName: '', profession: '', email: '', phone: '', comments: '' }],
            PropertyDocuments: [{ id: 'document-old', type: '', description: '', releaseDate: '', comments: '', shared: false, file: file('document-file-old') }],
        },
        relations: { buildingId: null, tenantIds: [], leaseIds: [] },
        notes: [{ id: 'note-old', text: 'Nota', createdAt: EARLIER }],
        activities: [{ id: 'activity-old', type: 'general', description: 'Creata', createdAt: EARLIER }],
        legacy: { marker: 'preserved' },
        ...overrides,
    };
}

function building(id: string, unitsCount: number): BuildingRecord {
    return {
        id, createdAt: EARLIER, updatedAt: EARLIER, archived: false, identifier: id, color: '', address: 'Via Roma',
        address2: '', city: 'Roma', postalCode: '00100', county: '', state: '', country: 'IT', size: null,
        constructionYear: null, description: '', privateNote: '', features: [], acquisitionDate: '', purchasePrice: null,
        acquisitionCosts: null, imu: null, unitsCount,
    };
}

function lease(id: string, propertyId: string): LeaseRecord {
    return { id, propertyId, status: 'terminata', archived: true } as LeaseRecord;
}
function payment(id: string, propertyId: string): PaymentRecord {
    return {
        id,
        propertyId,
        leaseId: null,
        tenantId: null,
        type: 'expense',
        category: 'manual',
        amount: 1,
        dueDate: '2026-08-26',
        paidDate: null,
        status: 'pending',
        description: 'Blocker test',
        source: 'manual',
        accountingRole: 'expense',
        notes: '',
        receiptNumber: null,
        confirmation: null,
        createdAt: EARLIER,
        updatedAt: EARLIER,
    };
}
function database(properties: PropertyRecord[], options: { buildings?: BuildingRecord[]; leases?: LeaseRecord[]; payments?: PaymentRecord[] } = {}): LocalDatabase {
    return {
        meta: { schemaVersion: 4, seedVersion: 1, createdAt: EARLIER, updatedAt: EARLIER, source: 'seed' },
        properties, buildings: options.buildings ?? [], tenants: [], leases: options.leases ?? [], payments: options.payments ?? [],
        contacts: [], documents: [], reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [],
        messages: [], candidates: [], settings: { marker: 'preserved' }, userProfile: {}, drafts: [],
    };
}

function fakeRepository(initial: LocalDatabase) {
    let current = initial;
    const saves: LocalDatabase[] = [];
    const repository = createPropertyLifecycleRepositoryOperations({
        getDatabase: () => current,
        saveDatabase: (next) => { saves.push(next); current = next; return next; },
    });
    return { repository, saves, current: () => current };
}

describe('Property lifecycle repository', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(NOW));
    });
    afterEach(() => {
        uninstallJsonDbWindow();
        vi.useRealTimers();
        vi.resetModules();
    });

    it('archivia e ripristina una Unit con una sola write preservando B1-B4', () => {
        const original = property('property-a', { relations: { buildingId: 'building-a', tenantIds: ['tenant-a'], leaseIds: ['lease-a'] } });
        const state = fakeRepository(database([original], { buildings: [building('building-a', 1)] }));

        const archived = state.repository.archive('property-a');
        expect(archived).toEqual({ ...original, archived: true, updatedAt: NOW });
        expect(state.current().buildings[0].unitsCount).toBe(1);
        expect(state.saves).toHaveLength(1);

        const restored = state.repository.restore('property-a');
        expect(restored).toEqual({ ...original, archived: false, updatedAt: NOW });
        expect(state.current().buildings[0].unitsCount).toBe(1);
        expect(state.saves).toHaveLength(2);
        expect(restored.formData).toEqual(original.formData);
        expect(restored.relations).toEqual(original.relations);
    });

    it('rifiuta archive, restore e delete singole mancanti senza write', () => {
        const state = fakeRepository(database([property('property-a')]));
        for (const operation of ['archive', 'restore', 'delete'] as const) {
            expect(() => state.repository[operation]('missing')).toThrow(PropertyNotFoundError);
            try { state.repository[operation]('missing'); } catch (error) {
                expect(error).toMatchObject({ propertyId: 'missing' });
            }
        }
        expect(state.saves).toHaveLength(0);
    });

    it('archivia e ripristina bulk atomicamente con deduplica, timestamp unico e input immutato', () => {
        const state = fakeRepository(database([property('a'), property('b'), property('c')]));
        const ids = ['a', 'a', 'b'];
        expect(state.repository.archiveMany(ids)).toEqual({ operation: 'archive', ids: ['a', 'b'], count: 2 });
        expect(ids).toEqual(['a', 'a', 'b']);
        expect(state.current().properties.slice(0, 2).map((item) => [item.archived, item.updatedAt])).toEqual([[true, NOW], [true, NOW]]);
        expect(state.saves).toHaveLength(1);
        expect(state.repository.restoreMany(['a', 'b'])).toEqual({ operation: 'restore', ids: ['a', 'b'], count: 2 });
        expect(state.current().properties.slice(0, 2).map((item) => [item.archived, item.updatedAt])).toEqual([[false, NOW], [false, NOW]]);
        expect(state.saves).toHaveLength(2);
    });

    it('rifiuta bulk con ID mancante prima di mutare', () => {
        for (const operation of ['archiveMany', 'restoreMany', 'deleteMany'] as const) {
            const fixture = database([property('a')]);
            const state = fakeRepository(fixture);
            expect(() => state.repository[operation](['a', 'missing'])).toThrow(PropertyNotFoundError);
            expect(state.saves).toHaveLength(0);
            expect(state.current()).toBe(fixture);
        }
    });

    it('tratta le selezioni bulk vuote come no-op', () => {
        const state = fakeRepository(database([property('a')]));
        expect(state.repository.archiveMany([])).toEqual({ operation: 'archive', ids: [], count: 0 });
        expect(state.repository.restoreMany([])).toEqual({ operation: 'restore', ids: [], count: 0 });
        expect(state.repository.deleteMany([])).toEqual({ operation: 'delete', ids: [], count: 0 });
        expect(state.saves).toHaveLength(0);
    });

    it('elimina una Unit standalone libera con una sola write', () => {
        const untouched = property('b');
        const state = fakeRepository(database([property('a'), untouched]));
        expect(state.repository.delete('a')).toBe(true);
        expect(state.current().properties).toEqual([untouched]);
        expect(state.saves).toHaveLength(1);
    });

    it('elimina una Unit libera collegata e ricalcola building.unitsCount', () => {
        const linked = property('a', { relations: { buildingId: 'building-a', tenantIds: [], leaseIds: [] } });
        const remaining = property('b', { relations: { buildingId: 'building-a', tenantIds: [], leaseIds: [] } });
        const state = fakeRepository(database([linked, remaining], { buildings: [building('building-a', 2)] }));
        expect(state.repository.delete('a')).toBe(true);
        expect(state.current().properties).toEqual([remaining]);
        expect(state.current().buildings).toEqual([building('building-a', 1)]);
        expect(state.saves).toHaveLength(1);
    });

    it('blocca delete con qualunque Lease e struttura leaseIds', () => {
        const fixture = database([property('a')], { leases: [lease('lease-ended', 'a')] });
        const state = fakeRepository(fixture);
        expect(() => state.repository.delete('a')).toThrow(PropertyDeleteBlockedError);
        try { state.repository.delete('a'); } catch (error) {
            expect(error).toMatchObject({ blockedPropertyIds: ['a'], blockers: [{ propertyId: 'a', leaseIds: ['lease-ended'], paymentIds: [] }] });
        }
        expect(state.saves).toHaveLength(0);
        expect(state.current()).toBe(fixture);
    });

    it('blocca delete con Payment e struttura paymentIds', () => {
        const state = fakeRepository(database([property('a')], { payments: [payment('payment-a', 'a')] }));
        expect(() => state.repository.delete('a')).toThrow(PropertyDeleteBlockedError);
        try { state.repository.delete('a'); } catch (error) {
            expect(error).toMatchObject({ blockers: [{ propertyId: 'a', leaseIds: [], paymentIds: ['payment-a'] }] });
        }
        expect(state.saves).toHaveLength(0);
    });

    it('blocca integralmente una bulk mista e riporta tutti i blocker', () => {
        const fixture = database([property('free'), property('lease-blocked'), property('payment-blocked')], {
            leases: [lease('lease-a', 'lease-blocked')],
            payments: [payment('payment-a', 'payment-blocked')],
        });
        const state = fakeRepository(fixture);
        expect(() => state.repository.deleteMany(['free', 'lease-blocked', 'payment-blocked'])).toThrow(PropertyDeleteBlockedError);
        try { state.repository.deleteMany(['free', 'lease-blocked', 'payment-blocked']); } catch (error) {
            expect(error).toMatchObject({ blockedPropertyIds: ['lease-blocked', 'payment-blocked'] });
        }
        expect(state.saves).toHaveLength(0);
        expect(state.current()).toBe(fixture);
    });

    it('elimina una bulk libera con una sola write e deduplica', () => {
        const state = fakeRepository(database([property('a'), property('b'), property('c')]));
        expect(state.repository.deleteMany(['a', 'a', 'b'])).toEqual({ operation: 'delete', ids: ['a', 'b'], count: 2 });
        expect(state.current().properties.map((item) => item.id)).toEqual(['c']);
        expect(state.saves).toHaveLength(1);
    });

    it('isola account, subscription e account globale dopo la factory', async () => {
        const recordA = property('property-a');
        const recordB = property('property-b');
        const storage = new MemoryStorage({ [KEY_A]: JSON.stringify(database([recordA])), [KEY_B]: JSON.stringify(database([recordB])) });
        installJsonDbWindow(storage);
        vi.resetModules();
        const jsonDb = await import('../../src/db/jsonDb');
        const { createPropertyLifecycleRepository } = await import('../../src/db/propertyLifecycleRepository');
        const repositoryA = createPropertyLifecycleRepository({ accountId: ACCOUNT_A });
        const repositoryB = createPropertyLifecycleRepository({ accountId: ACCOUNT_B });
        jsonDb.createJsonDbAccountScope(ACCOUNT_A).getDatabase();
        jsonDb.createJsonDbAccountScope(ACCOUNT_B).getDatabase();
        storage.resetOperationLogs();
        const notifyA = vi.fn();
        const notifyB = vi.fn();
        repositoryA.subscribe(notifyA);
        repositoryB.subscribe(notifyB);

        jsonDb.setActiveDatabaseAccount(ACCOUNT_B);
        repositoryA.archive('property-a');
        expect(notifyA).toHaveBeenCalledTimes(1);
        expect(notifyB).not.toHaveBeenCalled();
        expect(JSON.parse(storage.getItem(KEY_A)!).properties[0].archived).toBe(true);
        expect(JSON.parse(storage.getItem(KEY_B)!).properties[0]).toEqual(recordB);
        expect(() => repositoryA.archive('property-b')).toThrow(expect.objectContaining({
            name: 'PropertyNotFoundError', propertyId: 'property-b',
        }));
        expect(storage.writesFor(KEY_B)).toHaveLength(0);
    });

    it('mantiene atomici i wrapper legacy e non nasconde missing ID', async () => {
        const fixture = database([property('free'), property('blocked')], { payments: [payment('payment-a', 'blocked')] });
        const storage = new MemoryStorage({ [KEY_A]: JSON.stringify(fixture) });
        installJsonDbWindow(storage);
        vi.resetModules();
        const jsonDb = await import('../../src/db/jsonDb');
        const repository = await import('../../src/db/propertyRepository');
        jsonDb.setActiveDatabaseAccount(ACCOUNT_A);
        jsonDb.getJsonDb();
        storage.resetOperationLogs();

        repository.archiveProperties(['free', 'free']);
        expect(storage.writesFor(KEY_A)).toHaveLength(1);
        repository.restoreProperties(['free']);
        expect(storage.writesFor(KEY_A)).toHaveLength(2);
        storage.resetOperationLogs();
        expect(repository.deleteProperties(['free', 'blocked'])).toEqual({ deleted: [], blocked: ['blocked'] });
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(JSON.parse(storage.getItem(KEY_A)!).properties).toHaveLength(2);
        expect(() => repository.deleteProperties(['missing'])).toThrow(expect.objectContaining({
            name: 'PropertyNotFoundError', propertyId: 'missing',
        }));
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
    });

    it('wrapper delete restituisce tutte le Unit libere deduplicate', async () => {
        const storage = new MemoryStorage({ [KEY_A]: JSON.stringify(database([property('a'), property('b')])) });
        installJsonDbWindow(storage);
        vi.resetModules();
        const jsonDb = await import('../../src/db/jsonDb');
        const repository = await import('../../src/db/propertyRepository');
        jsonDb.setActiveDatabaseAccount(ACCOUNT_A);
        jsonDb.getJsonDb();
        storage.resetOperationLogs();
        expect(repository.deleteProperties(['a', 'a', 'b'])).toEqual({ deleted: ['a', 'b'], blocked: [] });
        expect(storage.writesFor(KEY_A)).toHaveLength(1);
    });
});
