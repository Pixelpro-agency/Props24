import { assertUniqueBuildingIdentifier, assertUniqueBuildingLocation } from './businessRules';
import type { BuildingRecord, LocalDatabase } from './database.types';
import { BuildingDeleteBlockedError, BuildingNotFoundError } from './databaseErrors';
import { createJsonDbAccountScope, generateId } from './jsonDb';

type EditableBuildingFields = Omit<
    BuildingRecord,
    'id' | 'createdAt' | 'updatedAt' | 'archived' | 'unitsCount'
>;

export type BuildingCreateInput = Pick<
    EditableBuildingFields,
    'identifier' | 'address' | 'city' | 'postalCode' | 'country'
> & Partial<Omit<EditableBuildingFields, 'identifier' | 'address' | 'city' | 'postalCode' | 'country'>>;

export type BuildingUpdateInput = Partial<EditableBuildingFields>;

export interface BuildingRepository {
    list(): BuildingRecord[];
    getById(id: string): BuildingRecord | null;
    create(input: BuildingCreateInput): BuildingRecord;
    update(id: string, input: BuildingUpdateInput): BuildingRecord;
    archive(id: string): BuildingRecord;
    restore(id: string): BuildingRecord;
    delete(id: string): boolean;
    subscribe(callback: () => void): () => void;
}

export type BuildingDatabaseGateway = {
    getDatabase(): LocalDatabase;
    saveDatabase(database: LocalDatabase): LocalDatabase;
};

function timestamp(): string {
    return new Date().toISOString();
}

function requireBuilding(database: LocalDatabase, id: string): BuildingRecord {
    const building = database.buildings.find((item) => item.id === id);
    if (!building) throw new BuildingNotFoundError(id);
    return building;
}

function verifiedBuilding(database: LocalDatabase, id: string): BuildingRecord {
    return requireBuilding(database, id);
}

function createCandidate(input: BuildingCreateInput, now: string): BuildingRecord {
    return {
        id: generateId('building'),
        createdAt: now,
        updatedAt: now,
        archived: false,
        identifier: input.identifier,
        color: input.color ?? '',
        address: input.address,
        address2: input.address2 ?? '',
        city: input.city,
        postalCode: input.postalCode,
        county: input.county ?? '',
        state: input.state ?? '',
        country: input.country,
        size: input.size ?? null,
        constructionYear: input.constructionYear ?? null,
        description: input.description ?? '',
        privateNote: input.privateNote ?? '',
        features: input.features ? [...input.features] : [],
        acquisitionDate: input.acquisitionDate ?? '',
        purchasePrice: input.purchasePrice ?? null,
        acquisitionCosts: input.acquisitionCosts ?? null,
        imu: input.imu ?? null,
        unitsCount: 0,
    };
}

export function createBuildingRepositoryOperations(gateway: BuildingDatabaseGateway) {
    function saveBuilding(database: LocalDatabase, candidate: BuildingRecord): BuildingRecord {
        const saved = gateway.saveDatabase(database);
        return verifiedBuilding(saved, candidate.id);
    }

    function setArchived(id: string, archived: boolean): BuildingRecord {
        const database = gateway.getDatabase();
        const current = requireBuilding(database, id);
        const candidate = { ...current, archived, updatedAt: timestamp() };
        const buildings = database.buildings.map((item) => item.id === id ? candidate : item);
        return saveBuilding({ ...database, buildings }, candidate);
    }

    return {
        list(): BuildingRecord[] {
            return [...gateway.getDatabase().buildings];
        },
        getById(id: string): BuildingRecord | null {
            return gateway.getDatabase().buildings.find((building) => building.id === id) ?? null;
        },
        create(input: BuildingCreateInput): BuildingRecord {
            const database = gateway.getDatabase();
            const candidate = createCandidate(input, timestamp());
            assertUniqueBuildingIdentifier(database, candidate.identifier);
            assertUniqueBuildingLocation(database, candidate);
            return saveBuilding({ ...database, buildings: [...database.buildings, candidate] }, candidate);
        },
        update(id: string, input: BuildingUpdateInput): BuildingRecord {
            const database = gateway.getDatabase();
            const current = requireBuilding(database, id);
            const candidate: BuildingRecord = {
                ...current,
                ...input,
                features: input.features ? [...input.features] : current.features,
                id: current.id,
                createdAt: current.createdAt,
                archived: current.archived,
                unitsCount: current.unitsCount,
                updatedAt: timestamp(),
            };
            assertUniqueBuildingIdentifier(database, candidate.identifier, id);
            assertUniqueBuildingLocation(database, candidate, id);
            const buildings = database.buildings.map((item) => item.id === id ? candidate : item);
            return saveBuilding({ ...database, buildings }, candidate);
        },
        archive(id: string): BuildingRecord {
            return setArchived(id, true);
        },
        restore(id: string): BuildingRecord {
            return setArchived(id, false);
        },
        delete(id: string): boolean {
            const database = gateway.getDatabase();
            requireBuilding(database, id);
            const linkedPropertyIds = database.properties
                .filter((property) => property.relations.buildingId === id)
                .map((property) => property.id);
            if (linkedPropertyIds.length > 0) {
                throw new BuildingDeleteBlockedError(id, linkedPropertyIds);
            }
            gateway.saveDatabase({
                ...database,
                buildings: database.buildings.filter((building) => building.id !== id),
            });
            return true;
        },
    };
}

export function createBuildingRepository(options: { accountId: string }): BuildingRepository {
    const scope = createJsonDbAccountScope(options.accountId);
    const operations = createBuildingRepositoryOperations(scope);
    return { ...operations, subscribe: (callback) => scope.subscribe(callback) };
}
