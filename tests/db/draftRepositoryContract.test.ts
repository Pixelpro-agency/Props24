import { describe, expect, it, vi } from 'vitest';

import {
    DraftCorruptedError,
    DraftInvalidKeyError,
    DraftPayloadValidationError,
} from '../../src/db/databaseErrors';
import {
    deleteDraftRecord,
    draftLogicalKey,
    getDraftRecord,
    listDraftRecords,
    normalizeDraftKey,
    upsertDraftRecord,
} from '../../src/db/draftRepository';
import {
    DRAFT_FORM_TYPES,
    DRAFT_MODES,
    type DraftDefinition,
    type DraftRecord,
    type DraftRepository,
} from '../../src/db/draftRepository.port';

type Payload = { value: string; nested?: { count: number } };

const definition: DraftDefinition<Payload> = {
    formType: 'tenant',
    schemaVersion: 1,
    parse(payload, schemaVersion) {
        if (
            schemaVersion < 1
            || typeof payload !== 'object'
            || payload === null
            || typeof (payload as { value?: unknown }).value !== 'string'
        ) {
            throw new Error('Payload non valido');
        }
        return structuredClone(payload as Payload);
    },
};

function record(
    patch: Partial<DraftRecord<Payload>> = {},
): DraftRecord<Payload> {
    return {
        id: 'draft-1',
        accountId: 'account-1',
        formType: 'tenant',
        mode: 'edit',
        entityId: 'tenant-1',
        payload: { value: 'original', nested: { count: 1 } },
        schemaVersion: 1,
        createdAt: '2026-01-01T10:00:00.000Z',
        updatedAt: '2026-01-01T10:00:00.000Z',
        ...patch,
    };
}

describe('draft repository contract', () => {
    it('espone i form e le modalità supportati', () => {
        expect(DRAFT_FORM_TYPES).toEqual([
            'building',
            'property',
            'tenant',
            'lease',
        ]);
        expect(DRAFT_MODES).toEqual(['create', 'edit']);
    });

    it('normalizza create senza entityId e accetta edit valido', () => {
        expect(normalizeDraftKey('building', { mode: 'create' })).toEqual({
            formType: 'building',
            mode: 'create',
            entityId: null,
        });
        expect(normalizeDraftKey('lease', {
            mode: 'edit',
            entityId: 'lease-1',
        })).toEqual({
            formType: 'lease',
            mode: 'edit',
            entityId: 'lease-1',
        });
    });

    it.each([
        ['create vuoto', 'tenant', { mode: 'create', entityId: '' }],
        ['create valorizzato', 'tenant', { mode: 'create', entityId: 'x' }],
        ['edit omesso', 'tenant', { mode: 'edit' }],
        ['edit vuoto', 'tenant', { mode: 'edit', entityId: '' }],
        ['edit spazi esterni', 'tenant', { mode: 'edit', entityId: ' x ' }],
        ['form sconosciuto', 'unknown', { mode: 'create' }],
        ['mode sconosciuta', 'tenant', { mode: 'unknown' }],
    ])('rifiuta chiave runtime non valida: %s', (_label, formType, key) => {
        expect(() => normalizeDraftKey(
            formType as 'tenant',
            key as { mode: 'create' },
        )).toThrow(DraftInvalidKeyError);
    });

    it('rifiuta account non valido e crea chiavi collision-safe', () => {
        const key = normalizeDraftKey('tenant', {
            mode: 'edit',
            entityId: 'a|b',
        });
        expect(() => draftLogicalKey('', key)).toThrow(DraftInvalidKeyError);
        expect(() => draftLogicalKey(' account ', key)).toThrow(
            DraftInvalidKeyError,
        );
        expect(draftLogicalKey('a|b', key)).not.toBe(draftLogicalKey(
            'a',
            normalizeDraftKey('tenant', {
                mode: 'edit',
                entityId: 'b|a|b',
            }),
        ));
    });

    it('restituisce null senza mutare la collezione', () => {
        const records = [record()];
        const before = structuredClone(records);
        expect(getDraftRecord(records, 'account-1', definition, {
            mode: 'edit',
            entityId: 'missing',
        })).toBeNull();
        expect(records).toEqual(before);
    });

    it('legge account e chiave corretti usando parser e versione', () => {
        const parse = vi.fn(definition.parse);
        const localDefinition = { ...definition, parse };
        const found = getDraftRecord([
            record({ accountId: 'account-2', payload: { value: 'other' } }),
            record(),
        ], 'account-1', localDefinition, {
            mode: 'edit',
            entityId: 'tenant-1',
        });
        expect(found?.payload.value).toBe('original');
        expect(parse).toHaveBeenCalledWith(
            { value: 'original', nested: { count: 1 } },
            1,
        );
    });

    it('restituisce un clone indipendente in lettura', () => {
        const source = record();
        const found = getDraftRecord([source], 'account-1', definition, {
            mode: 'edit',
            entityId: 'tenant-1',
        });
        expect(found).not.toBe(source);
        expect(found?.payload).not.toBe(source.payload);
        if (found) found.payload.nested!.count = 99;
        expect(source.payload.nested!.count).toBe(1);
    });

    it('converte parser e metadati corrotti in DraftCorruptedError', () => {
        expect(() => getDraftRecord(
            [record({ payload: { value: 1 } as unknown as Payload })],
            'account-1',
            definition,
            { mode: 'edit', entityId: 'tenant-1' },
        )).toThrow(DraftCorruptedError);
        expect(() => listDraftRecords([
            record({ schemaVersion: 0 }),
        ], 'account-1')).toThrow(DraftCorruptedError);
    });

    it('elenca in ordine, isola account e applica tutti i filtri', () => {
        const records: DraftRecord<unknown>[] = [
            record({ id: 'one', mode: 'create', entityId: null }),
            record({ id: 'two', entityId: 'tenant-2' }),
            record({ id: 'three', accountId: 'account-2' }),
            record({ id: 'four', formType: 'lease', entityId: 'lease-1' }),
        ];
        expect(listDraftRecords(records, 'account-1').map(({ id }) => id))
            .toEqual(['one', 'two', 'four']);
        expect(listDraftRecords(records, 'account-1', {
            formType: 'lease',
        }).map(({ id }) => id)).toEqual(['four']);
        expect(listDraftRecords(records, 'account-1', {
            mode: 'create',
        }).map(({ id }) => id)).toEqual(['one']);
        expect(listDraftRecords(records, 'account-1', {
            entityId: null,
        }).map(({ id }) => id)).toEqual(['one']);
        expect(listDraftRecords(records, 'account-1', {
            entityId: 'tenant-2',
        }).map(({ id }) => id)).toEqual(['two']);
        expect(listDraftRecords(records, 'account-1', {
            entityId: undefined,
        })).toEqual(listDraftRecords(records, 'account-1'));
    });

    it('isola tutte le operazioni da metadati corrotti di un altro account', () => {
        const own = record();
        const corruptedForeign = record({
            id: 'foreign',
            accountId: 'account-2',
            schemaVersion: 0,
        });
        const records = [own, corruptedForeign];

        expect(getDraftRecord(records, 'account-1', definition, {
            mode: 'edit',
            entityId: 'tenant-1',
        })?.id).toBe('draft-1');
        expect(listDraftRecords(records, 'account-1')).toEqual([own]);

        const upserted = upsertDraftRecord({
            records,
            accountId: 'account-1',
            definition,
            input: {
                mode: 'edit',
                entityId: 'tenant-1',
                payload: { value: 'updated' },
            },
            now: () => '2026-02-01T10:00:00.000Z',
            generateId: () => 'unused',
        });
        expect(upserted.records[1]).toEqual(corruptedForeign);
        expect(upserted.records[1]).not.toBe(corruptedForeign);

        const deleted = deleteDraftRecord(records, 'account-1', {
            formType: 'tenant',
            mode: 'edit',
            entityId: 'tenant-1',
        });
        expect(deleted.deleted).toBe(true);
        expect(deleted.records).toEqual([corruptedForeign]);
        expect(deleted.records[0]).not.toBe(corruptedForeign);
    });

    it('non rende permissiva la corruzione dell’account corrente', () => {
        const corrupted = record({ schemaVersion: 0 });
        expect(() => getDraftRecord(
            [corrupted],
            'account-1',
            definition,
            { mode: 'edit', entityId: 'tenant-1' },
        )).toThrow(DraftCorruptedError);
        expect(() => listDraftRecords(
            [corrupted],
            'account-1',
        )).toThrow(DraftCorruptedError);
        expect(() => upsertDraftRecord({
            records: [corrupted],
            accountId: 'account-1',
            definition,
            input: {
                mode: 'edit',
                entityId: 'tenant-1',
                payload: { value: 'updated' },
            },
            now: () => '2026-02-01T10:00:00.000Z',
            generateId: () => 'unused',
        })).toThrow(DraftCorruptedError);
        expect(() => deleteDraftRecord(
            [corrupted],
            'account-1',
            {
                formType: 'tenant',
                mode: 'edit',
                entityId: 'tenant-1',
            },
        )).toThrow(DraftCorruptedError);
    });

    it.each([
        ['mancante', { id: 'invalid' }],
        ['vuoto', { id: 'invalid', accountId: '' }],
        ['con spazi', { id: 'invalid', accountId: ' account-2 ' }],
        ['non stringa', { id: 'invalid', accountId: 2 }],
        ['non oggetto', null],
    ])('rifiuta record con account non attribuibile: %s', (_label, value) => {
        // Il cast locale simula dati runtime corrotti oltre il contratto statico.
        const records = [value] as unknown as DraftRecord<unknown>[];
        expect(() => listDraftRecords(records, 'account-1'))
            .toThrow(DraftCorruptedError);
    });

    it('non espone array, record o payload sorgente durante list', () => {
        const source = record();
        const listed = listDraftRecords([source], 'account-1');
        expect(listed[0]).not.toBe(source);
        expect(listed[0].payload).not.toBe(source.payload);
        (listed[0].payload as Payload).nested!.count = 9;
        expect(source.payload.nested!.count).toBe(1);
    });

    it('crea usando ID e timestamp iniettati', () => {
        const generateId = vi.fn(() => 'draft-new');
        const result = upsertDraftRecord({
            records: [],
            accountId: 'account-1',
            definition,
            input: { mode: 'create', payload: { value: 'new' } },
            now: () => '2026-02-01T10:00:00.000Z',
            generateId,
        });
        expect(result.record).toEqual({
            id: 'draft-new',
            accountId: 'account-1',
            formType: 'tenant',
            mode: 'create',
            entityId: null,
            payload: { value: 'new' },
            schemaVersion: 1,
            createdAt: '2026-02-01T10:00:00.000Z',
            updatedAt: '2026-02-01T10:00:00.000Z',
        });
        expect(result.records).toEqual([result.record]);
        expect(generateId).toHaveBeenCalledTimes(1);
    });

    it('sostituisce senza duplicare preservando identità e creazione', () => {
        const generateId = vi.fn(() => 'unused');
        const source = record();
        const result = upsertDraftRecord({
            records: [source],
            accountId: 'account-1',
            definition,
            input: {
                mode: 'edit',
                entityId: 'tenant-1',
                payload: { value: 'updated' },
            },
            now: () => '2026-02-01T10:00:00.000Z',
            generateId,
        });
        expect(result.records).toHaveLength(1);
        expect(result.record).toMatchObject({
            id: 'draft-1',
            createdAt: '2026-01-01T10:00:00.000Z',
            updatedAt: '2026-02-01T10:00:00.000Z',
            payload: { value: 'updated' },
        });
        expect(generateId).not.toHaveBeenCalled();
    });

    it('mantiene separate chiavi e account differenti', () => {
        const records = [
            record(),
            record({ id: 'other-entity', entityId: 'tenant-2' }),
            record({ id: 'other-account', accountId: 'account-2' }),
        ];
        const result = upsertDraftRecord({
            records,
            accountId: 'account-1',
            definition,
            input: {
                mode: 'edit',
                entityId: 'tenant-1',
                payload: { value: 'updated' },
            },
            now: () => '2026-02-01T10:00:00.000Z',
            generateId: () => 'unused',
        });
        expect(result.records).toHaveLength(3);
        expect((result.records[1].payload as Payload).value).toBe('original');
        expect((result.records[2].payload as Payload).value).toBe('original');
    });

    it('non muta input, payload, record o collezione e separa il risultato', () => {
        const records = [record()];
        const payload = { value: 'updated', nested: { count: 2 } };
        const input = { mode: 'edit' as const, entityId: 'tenant-1', payload };
        const beforeRecords = structuredClone(records);
        const beforeInput = structuredClone(input);
        const result = upsertDraftRecord({
            records,
            accountId: 'account-1',
            definition,
            input,
            now: () => '2026-02-01T10:00:00.000Z',
            generateId: () => 'unused',
        });
        expect(records).toEqual(beforeRecords);
        expect(input).toEqual(beforeInput);
        expect(result.records).not.toBe(records);
        expect(result.record).not.toBe(result.records[0]);
        expect(result.record.payload).not.toBe(payload);
    });

    it.each([0, -1, 1.5])(
        'rifiuta schemaVersion non positivo o non intero: %s',
        (schemaVersion) => {
            expect(() => upsertDraftRecord({
                records: [],
                accountId: 'account-1',
                definition: { ...definition, schemaVersion },
                input: { mode: 'create', payload: { value: 'new' } },
                now: () => '2026-02-01T10:00:00.000Z',
                generateId: () => 'draft-new',
            })).toThrow(DraftPayloadValidationError);
        },
    );

    it('converte errore parser in validation error senza mutazioni', () => {
        const records = [record()];
        const before = structuredClone(records);
        expect(() => upsertDraftRecord({
            records,
            accountId: 'account-1',
            definition,
            input: {
                mode: 'edit',
                entityId: 'tenant-1',
                payload: { value: 1 } as unknown as Payload,
            },
            now: () => '2026-02-01T10:00:00.000Z',
            generateId: () => 'unused',
        })).toThrow(DraftPayloadValidationError);
        expect(records).toEqual(before);
    });

    it('elimina solo chiave, entità e account esatti senza mutare', () => {
        const records = [
            record(),
            record({ id: 'other-entity', entityId: 'tenant-2' }),
            record({ id: 'other-account', accountId: 'account-2' }),
        ];
        const before = structuredClone(records);
        const first = deleteDraftRecord(records, 'account-1', {
            formType: 'tenant',
            mode: 'edit',
            entityId: 'tenant-1',
        });
        expect(first.deleted).toBe(true);
        expect(first.records.map(({ id }) => id)).toEqual([
            'other-entity',
            'other-account',
        ]);
        expect(records).toEqual(before);
        const second = deleteDraftRecord(first.records, 'account-1', {
            formType: 'tenant',
            mode: 'edit',
            entityId: 'tenant-1',
        });
        expect(second.deleted).toBe(false);
        expect(second.records).toEqual(first.records);
        expect(second.records).not.toBe(first.records);
    });

    it('definisce una porta esclusivamente asincrona senza subscribe', async () => {
        const repository: DraftRepository = {
            async get() { return null; },
            async list() { return []; },
            async save(localDefinition, input) {
                return {
                    id: 'draft',
                    accountId: 'account-1',
                    formType: localDefinition.formType,
                    mode: input.mode,
                    entityId: input.entityId ?? null,
                    payload: input.payload,
                    schemaVersion: localDefinition.schemaVersion,
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                };
            },
            async delete() { return false; },
        };
        await expect(repository.get(definition, {
            mode: 'create',
        })).resolves.toBeNull();
        await expect(repository.list()).resolves.toEqual([]);
        await expect(repository.save(definition, {
            mode: 'create',
            payload: { value: 'x' },
        })).resolves.toMatchObject({ payload: { value: 'x' } });
        await expect(repository.delete({
            formType: 'tenant',
            mode: 'create',
            entityId: null,
        })).resolves.toBe(false);
        expect('subscribe' in repository).toBe(false);
    });
});
