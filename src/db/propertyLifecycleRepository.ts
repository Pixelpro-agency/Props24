import type { LocalDatabase, PropertyRecord } from './database.types';
import { PropertyDeleteBlockedError, PropertyNotFoundError, type PropertyDeleteBlocker } from './databaseErrors';
import { recalculateBuildingUnits } from './dataSelectors';
import { createJsonDbAccountScope } from './jsonDb';

export type PropertyLifecycleOperation = 'archive' | 'restore' | 'delete';

export interface PropertyLifecycleBulkResult {
    operation: PropertyLifecycleOperation;
    ids: string[];
    count: number;
}

export interface PropertyLifecycleRepository {
    archive(id: string): PropertyRecord;
    restore(id: string): PropertyRecord;
    delete(id: string): boolean;
    archiveMany(ids: string[]): PropertyLifecycleBulkResult;
    restoreMany(ids: string[]): PropertyLifecycleBulkResult;
    deleteMany(ids: string[]): PropertyLifecycleBulkResult;
    subscribe(callback: () => void): () => void;
}

export interface PropertyLifecycleDatabaseGateway {
    getDatabase(): LocalDatabase;
    saveDatabase(database: LocalDatabase): LocalDatabase;
}

const timestamp = () => new Date().toISOString();
const uniqueIds = (ids: string[]) => [...new Set(ids)];
const bulkResult = (operation: PropertyLifecycleOperation, ids: string[]): PropertyLifecycleBulkResult => ({
    operation,
    ids,
    count: ids.length,
});

function requireProperty(database: LocalDatabase, id: string): PropertyRecord {
    const property = database.properties.find((item) => item.id === id);
    if (!property) throw new PropertyNotFoundError(id);
    return property;
}

function blockersFor(database: LocalDatabase, ids: string[]): PropertyDeleteBlocker[] {
    return ids.flatMap((propertyId) => {
        const leaseIds = database.leases.filter((lease) => lease.propertyId === propertyId).map((lease) => lease.id);
        const paymentIds = database.payments.filter((payment) => payment.propertyId === propertyId).map((payment) => payment.id);
        return leaseIds.length || paymentIds.length ? [{ propertyId, leaseIds, paymentIds }] : [];
    });
}

export function createPropertyLifecycleRepositoryOperations(gateway: PropertyLifecycleDatabaseGateway) {
    function setArchivedMany(ids: string[], archived: boolean): PropertyLifecycleBulkResult {
        const selectedIds = uniqueIds(ids);
        const operation = archived ? 'archive' : 'restore';
        if (selectedIds.length === 0) return bulkResult(operation, selectedIds);

        const database = gateway.getDatabase();
        selectedIds.forEach((id) => requireProperty(database, id));
        const selected = new Set(selectedIds);
        const now = timestamp();
        gateway.saveDatabase({
            ...database,
            properties: database.properties.map((property) => selected.has(property.id)
                ? { ...property, archived, updatedAt: now }
                : property),
        });
        return bulkResult(operation, selectedIds);
    }

    function setArchived(id: string, archived: boolean): PropertyRecord {
        const database = gateway.getDatabase();
        const current = requireProperty(database, id);
        const candidate = { ...current, archived, updatedAt: timestamp() };
        const saved = gateway.saveDatabase({
            ...database,
            properties: database.properties.map((property) => property.id === id ? candidate : property),
        });
        return requireProperty(saved, id);
    }

    return {
        archive(id: string): PropertyRecord {
            return setArchived(id, true);
        },
        restore(id: string): PropertyRecord {
            return setArchived(id, false);
        },
        delete(id: string): boolean {
            const database = gateway.getDatabase();
            requireProperty(database, id);
            const blockers = blockersFor(database, [id]);
            if (blockers.length) throw new PropertyDeleteBlockedError(blockers);
            gateway.saveDatabase(recalculateBuildingUnits({
                ...database,
                properties: database.properties.filter((property) => property.id !== id),
            }));
            return true;
        },
        archiveMany(ids: string[]): PropertyLifecycleBulkResult {
            return setArchivedMany(ids, true);
        },
        restoreMany(ids: string[]): PropertyLifecycleBulkResult {
            return setArchivedMany(ids, false);
        },
        deleteMany(ids: string[]): PropertyLifecycleBulkResult {
            const selectedIds = uniqueIds(ids);
            if (selectedIds.length === 0) return bulkResult('delete', selectedIds);

            const database = gateway.getDatabase();
            selectedIds.forEach((id) => requireProperty(database, id));
            const blockers = blockersFor(database, selectedIds);
            if (blockers.length) throw new PropertyDeleteBlockedError(blockers);
            const selected = new Set(selectedIds);
            gateway.saveDatabase(recalculateBuildingUnits({
                ...database,
                properties: database.properties.filter((property) => !selected.has(property.id)),
            }));
            return bulkResult('delete', selectedIds);
        },
    };
}

export function createPropertyLifecycleRepository(options: { accountId: string }): PropertyLifecycleRepository {
    const scope = createJsonDbAccountScope(options.accountId);
    const operations = createPropertyLifecycleRepositoryOperations(scope);
    return { ...operations, subscribe: (callback) => scope.subscribe(callback) };
}
