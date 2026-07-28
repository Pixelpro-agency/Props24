import {
    DraftCorruptedError,
    DraftInvalidKeyError,
    DraftMigrationError,
    DraftPayloadValidationError,
    DraftStorageError,
    DraftStorageQuotaError,
    LocalStorageQuotaError,
    isQuotaExceededError,
} from './databaseErrors';
import {
    deleteDraftRecord,
    getDraftRecord,
    listDraftRecords,
    normalizeDraftKey,
    upsertDraftRecord,
} from './draftRepository';
import type {
    DraftRepository,
} from './draftRepository.port';
import {
    createJsonDbAccountScope,
    generateId,
} from './jsonDb';

export interface LocalDraftRepositoryOptions {
    accountId: string;
}

function isDraftDomainError(error: unknown): error is Error {
    return error instanceof DraftInvalidKeyError
        || error instanceof DraftPayloadValidationError
        || error instanceof DraftCorruptedError
        || error instanceof DraftMigrationError
        || error instanceof DraftStorageError
        || error instanceof DraftStorageQuotaError;
}

function translateStorageError(error: unknown): Error {
    if (isDraftDomainError(error)) return error;
    if (
        error instanceof LocalStorageQuotaError
        || isQuotaExceededError(error)
    ) {
        return new DraftStorageQuotaError(error);
    }
    return new DraftStorageError(error);
}

export function createLocalDraftRepository(
    options: LocalDraftRepositoryOptions,
): DraftRepository {
    let database;
    try {
        database = createJsonDbAccountScope(options.accountId);
    } catch (error) {
        throw translateStorageError(error);
    }
    const accountId = options.accountId;

    return {
        get: async (definition, key) => {
            let current;
            try {
                current = database.getDatabase();
            } catch (error) {
                throw translateStorageError(error);
            }
            return getDraftRecord(current.drafts, accountId, definition, key);
        },

        list: async (filter) => {
            let current;
            try {
                current = database.getDatabase();
            } catch (error) {
                throw translateStorageError(error);
            }
            return listDraftRecords(current.drafts, accountId, filter);
        },

        save: async (definition, input) => {
            let current;
            try {
                current = database.getDatabase();
            } catch (error) {
                throw translateStorageError(error);
            }
            const result = upsertDraftRecord({
                records: current.drafts,
                accountId,
                definition,
                input,
                now: () => new Date().toISOString(),
                generateId: () => generateId('draft'),
            });
            let persisted;
            try {
                persisted = database.saveDatabase({
                    ...current,
                    drafts: result.records,
                });
            } catch (error) {
                throw translateStorageError(error);
            }
            const saved = getDraftRecord(
                persisted.drafts,
                accountId,
                definition,
                normalizeDraftKey(definition.formType, input),
            );
            if (!saved) {
                throw new DraftStorageError(
                    new Error('Bozza non reperibile dopo il salvataggio.'),
                );
            }
            return saved;
        },

        delete: async (key) => {
            let current;
            try {
                current = database.getDatabase();
            } catch (error) {
                throw translateStorageError(error);
            }
            const result = deleteDraftRecord(current.drafts, accountId, key);
            if (!result.deleted) return false;
            try {
                database.saveDatabase({
                    ...current,
                    drafts: result.records,
                });
            } catch (error) {
                throw translateStorageError(error);
            }
            return true;
        },
    };
}
