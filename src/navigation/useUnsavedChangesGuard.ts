import {
    useCallback,
    useEffect,
    useReducer,
    useRef,
} from 'react';
import {
    useBeforeUnload,
    useBlocker,
    useLocation,
} from 'react-router-dom';

import {
    areUnsavedChangesGuardActionsDisabled,
    createInitialUnsavedChangesGuardState,
    isUnsavedChangesDialogOpen,
    shouldBlockUnsavedChangesNavigation,
    unsavedChangesGuardReducer,
    type UnsavedChangesGuardConditions,
    type UnsavedChangesGuardState,
} from './unsavedChangesGuard';

export interface UseUnsavedChangesGuardOptions
    extends UnsavedChangesGuardConditions {
    saveDraft: () => Promise<void>;
    discardChanges: () => void | Promise<void>;
}

export interface UnsavedChangesGuardController {
    state: UnsavedChangesGuardState;
    isDialogOpen: boolean;
    actionsDisabled: boolean;
    stay(): void;
    saveAndProceed(): Promise<void>;
    discardAndProceed(): Promise<void>;
    allowNextNavigation(): void;
    resetGuard(): void;
}

function errorMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return '';
}

export function useUnsavedChangesGuard(
    options: UseUnsavedChangesGuardOptions,
): UnsavedChangesGuardController {
    const [state, dispatch] = useReducer(
        unsavedChangesGuardReducer,
        undefined,
        createInitialUnsavedChangesGuardState,
    );
    const location = useLocation();
    const stateRef = useRef(state);
    const conditionsRef = useRef<UnsavedChangesGuardConditions>(options);
    const saveDraftRef = useRef(options.saveDraft);
    const discardChangesRef = useRef(options.discardChanges);
    const bypassRef = useRef(false);
    const bypassLocationKeyRef = useRef<string | null>(null);
    const activeBlockerRef = useRef<ReturnType<typeof useBlocker> | null>(null);
    const operationPendingRef = useRef(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        stateRef.current = state;
        conditionsRef.current = options;
        saveDraftRef.current = options.saveDraft;
        discardChangesRef.current = options.discardChanges;
    }, [options, state]);

    const blocker = useBlocker(() => shouldBlockUnsavedChangesNavigation(
        {
            ...stateRef.current,
            bypassNextNavigation: bypassRef.current,
        },
        conditionsRef.current,
    ));

    useBeforeUnload(useCallback((event: BeforeUnloadEvent) => {
        if (shouldBlockUnsavedChangesNavigation(
            {
                ...stateRef.current,
                bypassNextNavigation: bypassRef.current,
            },
            conditionsRef.current,
        )) {
            event.preventDefault();
            event.returnValue = '';
        }
    }, []));

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
            activeBlockerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (blocker.state !== 'blocked' || activeBlockerRef.current) return;
        activeBlockerRef.current = blocker;
        const nextLocation = blocker.location;
        const requestId = nextLocation.key
            || `${nextLocation.pathname}${nextLocation.search}${nextLocation.hash}`;
        dispatch({ type: 'navigationBlocked', requestId });
    }, [blocker]);

    useEffect(() => {
        if (
            bypassRef.current
            && bypassLocationKeyRef.current !== null
            && location.key !== bypassLocationKeyRef.current
        ) {
            bypassRef.current = false;
            bypassLocationKeyRef.current = null;
            dispatch({ type: 'consumeNextNavigationAllowance' });
        }

        if (
            stateRef.current.phase === 'proceeding'
            && activeBlockerRef.current !== null
        ) {
            activeBlockerRef.current = null;
            operationPendingRef.current = false;
            dispatch({ type: 'navigationCompleted' });
        }
    }, [location.key]);

    const stay = useCallback(() => {
        const activeBlocker = activeBlockerRef.current;
        if (
            stateRef.current.phase !== 'blocked'
            || activeBlocker?.state !== 'blocked'
            || operationPendingRef.current
        ) return;

        operationPendingRef.current = true;
        activeBlockerRef.current = null;
        dispatch({ type: 'stay' });
        activeBlocker.reset();
        operationPendingRef.current = false;
    }, []);

    const saveAndProceed = useCallback(async () => {
        const activeBlocker = activeBlockerRef.current;
        if (
            stateRef.current.phase !== 'blocked'
            || activeBlocker?.state !== 'blocked'
            || operationPendingRef.current
            || areUnsavedChangesGuardActionsDisabled(
                stateRef.current,
                conditionsRef.current,
            )
        ) return;

        operationPendingRef.current = true;
        dispatch({ type: 'saveStarted' });
        try {
            await saveDraftRef.current();
            if (!mountedRef.current) return;
            dispatch({ type: 'saveSucceeded' });
            activeBlocker.proceed();
        } catch (error) {
            if (!mountedRef.current) return;
            dispatch({ type: 'saveFailed', message: errorMessage(error) });
            operationPendingRef.current = false;
        }
    }, []);

    const discardAndProceed = useCallback(async () => {
        const activeBlocker = activeBlockerRef.current;
        if (
            stateRef.current.phase !== 'blocked'
            || activeBlocker?.state !== 'blocked'
            || operationPendingRef.current
            || areUnsavedChangesGuardActionsDisabled(
                stateRef.current,
                conditionsRef.current,
            )
        ) return;

        operationPendingRef.current = true;
        dispatch({ type: 'discardStarted' });
        try {
            await discardChangesRef.current();
            if (!mountedRef.current) return;
            dispatch({ type: 'discardSucceeded' });
            activeBlocker.proceed();
        } catch (error) {
            if (!mountedRef.current) return;
            dispatch({ type: 'discardFailed', message: errorMessage(error) });
            operationPendingRef.current = false;
        }
    }, []);

    const allowNextNavigation = useCallback(() => {
        if (stateRef.current.phase !== 'idle') return;
        bypassRef.current = true;
        bypassLocationKeyRef.current = location.key;
        dispatch({ type: 'allowNextNavigation' });
    }, [location.key]);

    const resetGuard = useCallback(() => {
        const activeBlocker = activeBlockerRef.current;
        activeBlockerRef.current = null;
        operationPendingRef.current = false;
        bypassRef.current = false;
        bypassLocationKeyRef.current = null;
        dispatch({ type: 'reset' });
        if (activeBlocker?.state === 'blocked') activeBlocker.reset();
    }, []);

    return {
        state,
        isDialogOpen: isUnsavedChangesDialogOpen(state),
        actionsDisabled: areUnsavedChangesGuardActionsDisabled(state, options),
        stay,
        saveAndProceed,
        discardAndProceed,
        allowNextNavigation,
        resetGuard,
    };
}
