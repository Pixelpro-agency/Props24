export type UnsavedChangesGuardPhase =
    | 'idle'
    | 'blocked'
    | 'saving'
    | 'discarding'
    | 'proceeding';

export interface UnsavedChangesGuardState {
    phase: UnsavedChangesGuardPhase;
    requestId: string | null;
    error: string | null;
    bypassNextNavigation: boolean;
}

export interface UnsavedChangesGuardConditions {
    enabled: boolean;
    isDirty: boolean;
    isSubmitting: boolean;
    isSavingDraft: boolean;
}

export type UnsavedChangesGuardEvent =
    | { type: 'navigationBlocked'; requestId: string }
    | { type: 'stay' }
    | { type: 'saveStarted' }
    | { type: 'saveSucceeded' }
    | { type: 'saveFailed'; message: string }
    | { type: 'discardStarted' }
    | { type: 'discardSucceeded' }
    | { type: 'discardFailed'; message: string }
    | { type: 'navigationCompleted' }
    | { type: 'allowNextNavigation' }
    | { type: 'consumeNextNavigationAllowance' }
    | { type: 'reset' };

export function createInitialUnsavedChangesGuardState():
UnsavedChangesGuardState {
    return {
        phase: 'idle',
        requestId: null,
        error: null,
        bypassNextNavigation: false,
    };
}

export function normalizeUnsavedChangesGuardError(message: unknown): string {
    if (typeof message !== 'string') return 'Operazione non riuscita.';
    return message.trim() || 'Operazione non riuscita.';
}

export function unsavedChangesGuardReducer(
    state: UnsavedChangesGuardState,
    event: UnsavedChangesGuardEvent,
): UnsavedChangesGuardState {
    switch (event.type) {
        case 'navigationBlocked': {
            if (state.phase !== 'idle') return state;
            const requestId = event.requestId.trim();
            if (!requestId) return state;
            return {
                ...state,
                phase: 'blocked',
                requestId,
                error: null,
            };
        }
        case 'stay':
            return state.phase === 'blocked'
                ? createInitialUnsavedChangesGuardState()
                : state;
        case 'saveStarted':
            return state.phase === 'blocked'
                ? { ...state, phase: 'saving', error: null }
                : state;
        case 'saveSucceeded':
            return state.phase === 'saving'
                ? { ...state, phase: 'proceeding', error: null }
                : state;
        case 'saveFailed':
            return state.phase === 'saving'
                ? {
                    ...state,
                    phase: 'blocked',
                    error: normalizeUnsavedChangesGuardError(event.message),
                }
                : state;
        case 'discardStarted':
            return state.phase === 'blocked'
                ? { ...state, phase: 'discarding', error: null }
                : state;
        case 'discardSucceeded':
            return state.phase === 'discarding'
                ? { ...state, phase: 'proceeding', error: null }
                : state;
        case 'discardFailed':
            return state.phase === 'discarding'
                ? {
                    ...state,
                    phase: 'blocked',
                    error: normalizeUnsavedChangesGuardError(event.message),
                }
                : state;
        case 'navigationCompleted':
            return state.phase === 'proceeding'
                ? createInitialUnsavedChangesGuardState()
                : state;
        case 'allowNextNavigation':
            return state.phase === 'idle' && !state.bypassNextNavigation
                ? { ...state, bypassNextNavigation: true }
                : state;
        case 'consumeNextNavigationAllowance':
            return state.bypassNextNavigation
                ? { ...state, bypassNextNavigation: false }
                : state;
        case 'reset':
            return createInitialUnsavedChangesGuardState();
    }
}

export function shouldBlockUnsavedChangesNavigation(
    state: UnsavedChangesGuardState,
    conditions: UnsavedChangesGuardConditions,
): boolean {
    return conditions.enabled
        && conditions.isDirty
        && !state.bypassNextNavigation;
}

export function isUnsavedChangesDialogOpen(
    state: UnsavedChangesGuardState,
): boolean {
    return state.phase !== 'idle';
}

export function areUnsavedChangesGuardActionsDisabled(
    state: UnsavedChangesGuardState,
    conditions: UnsavedChangesGuardConditions,
): boolean {
    return state.phase !== 'blocked'
        || conditions.isSubmitting
        || conditions.isSavingDraft;
}
