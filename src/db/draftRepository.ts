import {
    DraftCorruptedError,
    DraftInvalidKeyError,
    DraftPayloadValidationError,
} from './databaseErrors';
import {
    DRAFT_FORM_TYPES,
    DRAFT_MODES,
    type DraftDefinition,
    type DraftFilter,
    type DraftFormType,
    type DraftKey,
    type DraftLookupKey,
    type DraftRecord,
    type SaveDraftInput,
} from './draftRepository.port';

export interface DraftUpsertOptions<TPayload> {
    records: readonly DraftRecord<unknown>[];
    accountId: string;
    definition: DraftDefinition<TPayload>;
    input: SaveDraftInput<TPayload>;
    now: () => string;
    generateId: () => string;
}

export interface DraftUpsertResult<TPayload> {
    records: DraftRecord<unknown>[];
    record: DraftRecord<TPayload>;
}

export interface DraftDeleteResult {
    records: DraftRecord<unknown>[];
    deleted: boolean;
}

function clone<T>(value: T): T {
    return structuredClone(value);
}

function isFormType(value: unknown): value is DraftFormType {
    return DRAFT_FORM_TYPES.includes(value as DraftFormType);
}

function isMode(value: unknown): value is DraftKey['mode'] {
    return DRAFT_MODES.includes(value as DraftKey['mode']);
}

function requireCleanString(value: unknown, label: string): string {
    if (
        typeof value !== 'string'
        || value.length === 0
        || value.trim() !== value
    ) {
        throw new DraftInvalidKeyError(`${label} non valido.`);
    }
    return value;
}

function requireSchemaVersion(value: unknown): number {
    if (!Number.isInteger(value) || (value as number) <= 0) {
        throw new DraftPayloadValidationError(
            new TypeError('Versione schema non valida.'),
        );
    }
    return value as number;
}

function validateStoredRecord(record: DraftRecord<unknown>): void {
    try {
        requireCleanString(record.id, 'ID bozza');
        requireCleanString(record.accountId, 'Account');
        normalizeDraftKey(record.formType, {
            mode: record.mode,
            entityId: record.entityId,
        });
        if (!Number.isInteger(record.schemaVersion) || record.schemaVersion <= 0) {
            throw new Error('Versione schema non valida.');
        }
        requireCleanString(record.createdAt, 'Data creazione');
        requireCleanString(record.updatedAt, 'Data aggiornamento');
    } catch (error) {
        throw new DraftCorruptedError(error);
    }
}

function belongsToAccount(
    record: unknown,
    accountId: string,
): record is DraftRecord<unknown> {
    try {
        if (typeof record !== 'object' || record === null) {
            throw new Error('Record bozza non valido.');
        }
        const storedAccountId = requireCleanString(
            (record as { accountId?: unknown }).accountId,
            'Account',
        );
        return storedAccountId === accountId;
    } catch (error) {
        throw new DraftCorruptedError(error);
    }
}

function cloneRecord<TPayload>(
    record: DraftRecord<TPayload>,
): DraftRecord<TPayload> {
    return clone(record);
}

export function normalizeDraftKey(
    formType: DraftFormType,
    key: DraftLookupKey,
): DraftKey {
    if (!isFormType(formType) || !isMode(key.mode)) {
        throw new DraftInvalidKeyError();
    }

    if (key.mode === 'create') {
        if (key.entityId !== undefined && key.entityId !== null) {
            throw new DraftInvalidKeyError(
                'Una bozza di creazione non può avere un ID entità.',
            );
        }
        return { formType, mode: 'create', entityId: null };
    }

    return {
        formType,
        mode: 'edit',
        entityId: requireCleanString(key.entityId, 'ID entità'),
    };
}

export function draftLogicalKey(
    accountId: string,
    key: DraftKey,
): string {
    const validAccountId = requireCleanString(accountId, 'Account');
    const normalized = normalizeDraftKey(key.formType, key);
    return JSON.stringify([
        validAccountId,
        normalized.formType,
        normalized.mode,
        normalized.entityId,
    ]);
}

export function getDraftRecord<TPayload>(
    records: readonly DraftRecord<unknown>[],
    accountId: string,
    definition: DraftDefinition<TPayload>,
    key: DraftLookupKey,
): DraftRecord<TPayload> | null {
    requireSchemaVersion(definition.schemaVersion);
    const normalized = normalizeDraftKey(definition.formType, key);
    const logicalKey = draftLogicalKey(accountId, normalized);
    const matches = records.filter((record) => {
        if (!belongsToAccount(record, accountId)) return false;
        validateStoredRecord(record);
        return draftLogicalKey(record.accountId, record) === logicalKey;
    });

    if (matches.length > 1) {
        throw new DraftCorruptedError(
            new Error('La chiave logica identifica più bozze.'),
        );
    }
    const found = matches[0];
    if (!found) return null;

    try {
        const payload = definition.parse(
            clone(found.payload),
            found.schemaVersion,
        );
        return cloneRecord({ ...found, payload });
    } catch (error) {
        if (error instanceof DraftCorruptedError) throw error;
        throw new DraftCorruptedError(error);
    }
}

export function listDraftRecords(
    records: readonly DraftRecord<unknown>[],
    accountId: string,
    filter: DraftFilter = {},
): DraftRecord<unknown>[] {
    requireCleanString(accountId, 'Account');
    if (filter.formType !== undefined && !isFormType(filter.formType)) {
        throw new DraftInvalidKeyError('Tipo di form non valido.');
    }
    if (filter.mode !== undefined && !isMode(filter.mode)) {
        throw new DraftInvalidKeyError('Modalità bozza non valida.');
    }
    if (
        filter.entityId !== undefined
        && filter.entityId !== null
        && requireCleanString(filter.entityId, 'ID entità') !== filter.entityId
    ) {
        throw new DraftInvalidKeyError();
    }

    return records.flatMap((record) => {
        if (!belongsToAccount(record, accountId)) return [];
        validateStoredRecord(record);
        if (filter.formType !== undefined && record.formType !== filter.formType) {
            return [];
        }
        if (filter.mode !== undefined && record.mode !== filter.mode) return [];
        if (
            filter.entityId !== undefined
            && record.entityId !== filter.entityId
        ) {
            return [];
        }
        return [cloneRecord(record)];
    });
}

export function upsertDraftRecord<TPayload>(
    options: DraftUpsertOptions<TPayload>,
): DraftUpsertResult<TPayload> {
    const accountId = requireCleanString(options.accountId, 'Account');
    const schemaVersion = requireSchemaVersion(options.definition.schemaVersion);
    const key = normalizeDraftKey(options.definition.formType, options.input);
    const logicalKey = draftLogicalKey(accountId, key);
    let parsedPayload: TPayload;

    try {
        parsedPayload = options.definition.parse(
            clone(options.input.payload),
            schemaVersion,
        );
    } catch (error) {
        throw new DraftPayloadValidationError(error);
    }

    const indexes: number[] = [];
    options.records.forEach((record, index) => {
        if (!belongsToAccount(record, accountId)) return;
        validateStoredRecord(record);
        if (draftLogicalKey(record.accountId, record) === logicalKey) {
            indexes.push(index);
        }
    });
    if (indexes.length > 1) {
        throw new DraftCorruptedError(
            new Error('La chiave logica identifica più bozze.'),
        );
    }

    const now = requireCleanString(options.now(), 'Timestamp');
    const existingIndex = indexes[0];
    const existing = existingIndex === undefined
        ? undefined
        : options.records[existingIndex];
    const record: DraftRecord<TPayload> = existing
        ? {
            ...key,
            id: existing.id,
            accountId,
            payload: clone(parsedPayload),
            schemaVersion,
            createdAt: existing.createdAt,
            updatedAt: now,
        }
        : {
            ...key,
            id: requireCleanString(options.generateId(), 'ID bozza'),
            accountId,
            payload: clone(parsedPayload),
            schemaVersion,
            createdAt: now,
            updatedAt: now,
        };
    const records = options.records.map(cloneRecord);

    if (existingIndex === undefined) records.push(cloneRecord(record));
    else records[existingIndex] = cloneRecord(record);

    return { records, record: cloneRecord(record) };
}

export function deleteDraftRecord(
    records: readonly DraftRecord<unknown>[],
    accountId: string,
    key: DraftKey,
): DraftDeleteResult {
    const logicalKey = draftLogicalKey(accountId, key);
    let deleted = false;
    const next = records.flatMap((record) => {
        if (!belongsToAccount(record, accountId)) {
            return [cloneRecord(record)];
        }
        validateStoredRecord(record);
        if (draftLogicalKey(record.accountId, record) === logicalKey) {
            deleted = true;
            return [];
        }
        return [cloneRecord(record)];
    });
    return { records: next, deleted };
}
