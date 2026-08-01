import { describe, expect, it } from 'vitest';

import {
    reconcileGuarantorReferences,
    reconcilePropertyReference,
    reconcileTenantReferences,
} from '../../src/landlord/leases/drafts/leaseDraftReferenceReconciliation';

type RecordStub = { id: string; archived: boolean; label: string };

const active: RecordStub = { id: 'active', archived: false, label: 'Attivo' };
const archived: RecordStub = { id: 'archived', archived: true, label: 'Archiviato' };

describe('lease draft reference reconciliation', () => {
    describe('property', () => {
        it('restituisce null per ID vuoto', () => expect(reconcilePropertyReference('', [active])).toBeNull());
        it('classifica active', () => expect(reconcilePropertyReference('active', [active])).toMatchObject({ id: 'active', index: 0, status: 'active', record: active }));
        it('classifica archived', () => expect(reconcilePropertyReference('archived', [archived])).toMatchObject({ status: 'archived', record: archived }));
        it('classifica missing senza lanciare', () => expect(reconcilePropertyReference('missing', [active])).toEqual({ id: 'missing', index: 0, status: 'missing', record: null }));
        it('non muta input o record', () => {
            const records = [active];
            const before = structuredClone(records);
            reconcilePropertyReference('active', records);
            expect(records).toEqual(before);
            expect(records[0]).toBe(active);
        });
    });

    describe('tenants', () => {
        it('gestisce array vuoto', () => expect(reconcileTenantReferences([], [active])).toEqual([]));
        it('classifica active, archived e missing', () => expect(reconcileTenantReferences(['active', 'archived', 'missing'], [active, archived]).map((item) => item.status)).toEqual(['active', 'archived', 'missing']));
        it('preserva ordine, stringhe e indici', () => expect(reconcileTenantReferences(['missing', 'active'], [active]).map(({ id, index }) => ({ id, index }))).toEqual([{ id: 'missing', index: 0 }, { id: 'active', index: 1 }]));
        it('preserva duplicati con indici distinti', () => expect(reconcileTenantReferences(['active', 'active'], [active])).toMatchObject([{ id: 'active', index: 0 }, { id: 'active', index: 1 }]));
        it('non muta array o record', () => {
            const ids = ['active'];
            const records = [active];
            reconcileTenantReferences(ids, records);
            expect(ids).toEqual(['active']);
            expect(records).toEqual([active]);
            expect(records[0]).toBe(active);
        });
    });

    describe('guarantors', () => {
        it.each([
            ['idle', 'pending'],
            ['loading', 'pending'],
            ['ready', 'missing'],
            ['error', 'unverified'],
        ] as const)('classifica un record assente con status %s come %s', (status, expected) => {
            expect(reconcileGuarantorReferences(['missing'], [], status)[0].status).toBe(expected);
        });
        it.each(['idle', 'loading', 'ready', 'error'] as const)('mantiene active durante %s con lista stale', (status) => {
            expect(reconcileGuarantorReferences(['active'], [active], status)[0]).toMatchObject({ status: 'active', record: active });
        });
        it.each(['loading', 'error'] as const)('mantiene archived durante %s con lista stale', (status) => {
            expect(reconcileGuarantorReferences(['archived'], [archived], status)[0]).toMatchObject({ status: 'archived', record: archived });
        });
        it('non tratta missing stale come definitivo durante loading', () => expect(reconcileGuarantorReferences(['missing'], [active], 'loading')[0].status).toBe('pending'));
        it('non tratta missing stale come definitivo durante error', () => expect(reconcileGuarantorReferences(['missing'], [active], 'error')[0].status).toBe('unverified'));
        it('preserva ordine e duplicati', () => expect(reconcileGuarantorReferences(['active', 'missing', 'active'], [active], 'ready').map(({ id, index, status }) => ({ id, index, status }))).toEqual([
            { id: 'active', index: 0, status: 'active' },
            { id: 'missing', index: 1, status: 'missing' },
            { id: 'active', index: 2, status: 'active' },
        ]));
        it('non muta input o record', () => {
            const ids = ['active'];
            const contacts = [active];
            reconcileGuarantorReferences(ids, contacts, 'ready');
            expect(ids).toEqual(['active']);
            expect(contacts).toEqual([active]);
            expect(contacts[0]).toBe(active);
        });
    });
});
