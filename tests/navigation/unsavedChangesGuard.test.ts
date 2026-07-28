import { describe, expect, it } from 'vitest';

import {
    areUnsavedChangesGuardActionsDisabled,
    createInitialUnsavedChangesGuardState,
    isUnsavedChangesDialogOpen,
    normalizeUnsavedChangesGuardError,
    shouldBlockUnsavedChangesNavigation,
    unsavedChangesGuardReducer,
    type UnsavedChangesGuardConditions,
    type UnsavedChangesGuardEvent,
    type UnsavedChangesGuardPhase,
    type UnsavedChangesGuardState,
} from '../../src/navigation/unsavedChangesGuard';

const readyConditions: UnsavedChangesGuardConditions = {
    enabled: true,
    isDirty: true,
    isSubmitting: false,
    isSavingDraft: false,
};

function blocked(requestId = 'request-1'): UnsavedChangesGuardState {
    return unsavedChangesGuardReducer(
        createInitialUnsavedChangesGuardState(),
        { type: 'navigationBlocked', requestId },
    );
}

function reduce(
    state: UnsavedChangesGuardState,
    ...events: UnsavedChangesGuardEvent[]
): UnsavedChangesGuardState {
    return events.reduce(unsavedChangesGuardReducer, state);
}

describe('unsaved changes guard state machine', () => {
    it('crea stati iniziali corretti e distinti', () => {
        const first = createInitialUnsavedChangesGuardState();
        const second = createInitialUnsavedChangesGuardState();

        expect(first).toEqual({
            phase: 'idle',
            requestId: null,
            error: null,
            bypassNextNavigation: false,
        });
        expect(first).not.toBe(second);
    });

    it.each([
        ['dirty e abilitato', readyConditions, false, true],
        ['form clean', { ...readyConditions, isDirty: false }, false, false],
        ['guard disabilitato', { ...readyConditions, enabled: false }, false, false],
        ['bypass attivo', readyConditions, true, false],
        ['submit dirty', { ...readyConditions, isSubmitting: true }, false, true],
        ['save dirty', { ...readyConditions, isSavingDraft: true }, false, true],
    ])('calcola il blocco: %s', (
        _label,
        conditions,
        bypassNextNavigation,
        expected,
    ) => {
        const state = {
            ...createInitialUnsavedChangesGuardState(),
            bypassNextNavigation,
        };
        expect(shouldBlockUnsavedChangesNavigation(state, conditions)).toBe(expected);
    });

    it('apre il blocco con request ID normalizzato', () => {
        expect(blocked('  request-1  ')).toEqual({
            phase: 'blocked',
            requestId: 'request-1',
            error: null,
            bypassNextNavigation: false,
        });
    });

    it.each(['', '   '])('ignora request ID vuoto: %j', (requestId) => {
        const state = createInitialUnsavedChangesGuardState();
        expect(unsavedChangesGuardReducer(state, {
            type: 'navigationBlocked',
            requestId,
        })).toBe(state);
    });

    it.each<UnsavedChangesGuardPhase>([
        'blocked',
        'saving',
        'discarding',
        'proceeding',
    ])('preserva la prima navigazione durante %s', (phase) => {
        const state = { ...blocked(), phase, error: 'errore precedente' };
        const result = unsavedChangesGuardReducer(state, {
            type: 'navigationBlocked',
            requestId: 'request-2',
        });
        expect(result).toBe(state);
        expect(result.requestId).toBe('request-1');
        expect(result.error).toBe('errore precedente');
    });

    it('Resta torna idle senza bypass', () => {
        expect(unsavedChangesGuardReducer(blocked(), { type: 'stay' }))
            .toEqual(createInitialUnsavedChangesGuardState());
    });

    it.each<UnsavedChangesGuardPhase>([
        'idle',
        'saving',
        'discarding',
        'proceeding',
    ])('ignora Resta in fase %s', (phase) => {
        const state = { ...blocked(), phase };
        expect(unsavedChangesGuardReducer(state, { type: 'stay' })).toBe(state);
    });

    it('gestisce avvio, successo e completamento del save', () => {
        const saving = unsavedChangesGuardReducer(blocked(), {
            type: 'saveStarted',
        });
        const proceeding = unsavedChangesGuardReducer(saving, {
            type: 'saveSucceeded',
        });
        expect(saving).toMatchObject({
            phase: 'saving',
            requestId: 'request-1',
            error: null,
        });
        expect(proceeding).toMatchObject({
            phase: 'proceeding',
            requestId: 'request-1',
            error: null,
        });
        expect(unsavedChangesGuardReducer(proceeding, {
            type: 'navigationCompleted',
        })).toEqual(createInitialUnsavedChangesGuardState());
    });

    it('ignora doppia save e discard durante save', () => {
        const saving = reduce(blocked(), { type: 'saveStarted' });
        expect(unsavedChangesGuardReducer(saving, {
            type: 'saveStarted',
        })).toBe(saving);
        expect(unsavedChangesGuardReducer(saving, {
            type: 'discardStarted',
        })).toBe(saving);
    });

    it('torna blocked dopo save fallita e consente il retry', () => {
        const failed = reduce(
            blocked(),
            { type: 'saveStarted' },
            { type: 'saveFailed', message: '  errore save  ' },
        );
        expect(failed).toMatchObject({
            phase: 'blocked',
            requestId: 'request-1',
            error: 'errore save',
        });
        expect(unsavedChangesGuardReducer(failed, {
            type: 'saveStarted',
        })).toMatchObject({ phase: 'saving', error: null });
    });

    it('gestisce avvio e successo del discard', () => {
        const discarding = reduce(blocked(), { type: 'discardStarted' });
        expect(discarding).toMatchObject({
            phase: 'discarding',
            requestId: 'request-1',
            error: null,
        });
        expect(unsavedChangesGuardReducer(discarding, {
            type: 'discardSucceeded',
        })).toMatchObject({
            phase: 'proceeding',
            requestId: 'request-1',
            error: null,
        });
    });

    it('ignora doppio discard e save durante discard', () => {
        const discarding = reduce(blocked(), { type: 'discardStarted' });
        expect(unsavedChangesGuardReducer(discarding, {
            type: 'discardStarted',
        })).toBe(discarding);
        expect(unsavedChangesGuardReducer(discarding, {
            type: 'saveStarted',
        })).toBe(discarding);
    });

    it('torna blocked dopo discard fallito e consente retry o Resta', () => {
        const failed = reduce(
            blocked(),
            { type: 'discardStarted' },
            { type: 'discardFailed', message: '  errore discard  ' },
        );
        expect(failed).toMatchObject({
            phase: 'blocked',
            requestId: 'request-1',
            error: 'errore discard',
        });
        expect(unsavedChangesGuardReducer(failed, {
            type: 'discardStarted',
        })).toMatchObject({ phase: 'discarding', error: null });
        expect(unsavedChangesGuardReducer(failed, {
            type: 'stay',
        })).toEqual(createInitialUnsavedChangesGuardState());
    });

    it.each<UnsavedChangesGuardPhase>([
        'idle',
        'blocked',
        'saving',
        'discarding',
    ])('ignora navigationCompleted in fase %s', (phase) => {
        const state = { ...blocked(), phase };
        expect(unsavedChangesGuardReducer(state, {
            type: 'navigationCompleted',
        })).toBe(state);
    });

    it('abilita il bypass soltanto da idle e lo consuma una volta', () => {
        const idle = createInitialUnsavedChangesGuardState();
        const allowed = unsavedChangesGuardReducer(idle, {
            type: 'allowNextNavigation',
        });
        const repeated = unsavedChangesGuardReducer(allowed, {
            type: 'allowNextNavigation',
        });
        const consumed = unsavedChangesGuardReducer(repeated, {
            type: 'consumeNextNavigationAllowance',
        });
        expect(allowed.bypassNextNavigation).toBe(true);
        expect(repeated).toBe(allowed);
        expect(consumed.bypassNextNavigation).toBe(false);
        expect(unsavedChangesGuardReducer(consumed, {
            type: 'consumeNextNavigationAllowance',
        })).toBe(consumed);
        expect(unsavedChangesGuardReducer(blocked(), {
            type: 'allowNextNavigation',
        })).toEqual(blocked());
    });

    it.each<UnsavedChangesGuardPhase>([
        'idle',
        'blocked',
        'saving',
        'discarding',
        'proceeding',
    ])('reset produce un nuovo stato iniziale da %s', (phase) => {
        const state = {
            ...blocked(),
            phase,
            bypassNextNavigation: true,
            error: 'errore',
        };
        const result = unsavedChangesGuardReducer(state, { type: 'reset' });
        expect(result).toEqual(createInitialUnsavedChangesGuardState());
        expect(result).not.toBe(state);
    });

    it.each([
        ['idle', false],
        ['blocked', true],
        ['saving', true],
        ['discarding', true],
        ['proceeding', true],
    ] satisfies [UnsavedChangesGuardPhase, boolean][])(
        'dialog in fase %s: %s',
        (phase, expected) => {
            expect(isUnsavedChangesDialogOpen({ ...blocked(), phase }))
                .toBe(expected);
        },
    );

    it.each([
        ['idle', readyConditions, true],
        ['blocked', readyConditions, false],
        ['blocked submitting', { ...readyConditions, isSubmitting: true }, true],
        ['blocked saving', { ...readyConditions, isSavingDraft: true }, true],
        ['saving', readyConditions, true],
        ['discarding', readyConditions, true],
        ['proceeding', readyConditions, true],
    ] satisfies [
        string,
        UnsavedChangesGuardConditions,
        boolean,
    ][])('azioni disabilitate: %s', (phaseLabel, conditions, expected) => {
        const phase = phaseLabel.split(' ')[0] as UnsavedChangesGuardPhase;
        expect(areUnsavedChangesGuardActionsDisabled(
            { ...blocked(), phase },
            conditions,
        )).toBe(expected);
    });

    it.each(['', '   '])('normalizza failure vuota: %j', (message) => {
        expect(normalizeUnsavedChangesGuardError(message))
            .toBe('Operazione non riuscita.');
        expect(reduce(
            blocked(),
            { type: 'saveStarted' },
            { type: 'saveFailed', message },
        ).error).toBe('Operazione non riuscita.');
    });

    it('non muta lo stato precedente', () => {
        const state = blocked();
        const before = structuredClone(state);
        const result = unsavedChangesGuardReducer(state, {
            type: 'saveStarted',
        });
        expect(state).toEqual(before);
        expect(result).not.toBe(state);
    });

    it('ignora semanticamente gli eventi validi ma non applicabili', () => {
        const idle = createInitialUnsavedChangesGuardState();
        const events: UnsavedChangesGuardEvent[] = [
            { type: 'stay' },
            { type: 'saveStarted' },
            { type: 'saveSucceeded' },
            { type: 'saveFailed', message: 'x' },
            { type: 'discardStarted' },
            { type: 'discardSucceeded' },
            { type: 'discardFailed', message: 'x' },
            { type: 'navigationCompleted' },
        ];
        for (const event of events) {
            expect(unsavedChangesGuardReducer(idle, event)).toBe(idle);
        }
    });

    it('non apre un nuovo blocco durante proceeding', () => {
        const proceeding = reduce(
            blocked(),
            { type: 'saveStarted' },
            { type: 'saveSucceeded' },
        );
        expect(unsavedChangesGuardReducer(proceeding, {
            type: 'navigationBlocked',
            requestId: 'request-2',
        })).toBe(proceeding);
    });
});
