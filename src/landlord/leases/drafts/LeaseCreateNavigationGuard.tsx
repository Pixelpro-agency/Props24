import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { UnsavedChangesDialog } from '../../../navigation/UnsavedChangesDialog';
import { useUnsavedChangesGuard } from '../../../navigation/useUnsavedChangesGuard';
import { useLeaseCreateDraftContext } from './LeaseCreateDraftProvider';
import { LeaseSubmitRecoveryDialog } from './LeaseSubmitRecoveryDialog';

const CLEANUP_ERROR =
    'Non è stato possibile eliminare la bozza locale. Riprova la pulizia.';

export interface LeaseCreateNavigationGuardRenderProps {
    completeCreatedLease(lease: { id: string }): Promise<void>;
}

export interface LeaseCreateNavigationGuardProps {
    children(props: LeaseCreateNavigationGuardRenderProps): ReactNode;
}

export function LeaseCreateNavigationGuard({
    children,
}: LeaseCreateNavigationGuardProps) {
    const navigate = useNavigate();
    const draft = useLeaseCreateDraftContext();
    const [isCleaningDraft, setIsCleaningDraft] = useState(false);
    const [recoveryError, setRecoveryError] = useState<string | null>(null);
    const [isRetryingCleanup, setIsRetryingCleanup] = useState(false);
    const [isCompletingCreation, setIsCompletingCreation] = useState(false);
    const createdLeaseIdRef = useRef<string | null>(null);
    const retryLockRef = useRef(false);
    const mountedRef = useRef(true);
    const pendingCompletionIdRef = useRef<string | null>(null);
    const isSubmitRecovery = recoveryError !== null;
    const isSubmitting = draft.methods.formState.isSubmitting
        || isCleaningDraft
        || isSubmitRecovery
        || isCompletingCreation;

    const guard = useUnsavedChangesGuard({
        enabled: draft.phase === 'ready',
        isDirty: draft.methods.formState.isDirty || isSubmitting,
        isSubmitting,
        isSavingDraft: draft.isSavingDraft,
        saveDraft: draft.saveDraft,
        discardChanges: draft.discardChanges,
    });

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const finishCreatedLease = useCallback((id: string) => {
        setIsCompletingCreation(true);
        setIsCleaningDraft(false);
        setIsRetryingCleanup(false);
        setRecoveryError(null);
        draft.methods.reset(draft.methods.getValues());
        pendingCompletionIdRef.current = id;
    }, [draft.methods]);

    useEffect(() => {
        const id = pendingCompletionIdRef.current;
        if (!id) return;
        if (guard.state.phase !== 'idle') {
            guard.resetGuard();
            return;
        }
        pendingCompletionIdRef.current = null;
        guard.allowNextNavigation();
        navigate('/leases', {
            state: {
                toast: {
                    variant: 'success',
                    title: 'Successo',
                    message: 'La locazione è stata creata.',
                },
            },
        });
    }, [guard, guard.state.phase, navigate]);

    const completeCreatedLease = useCallback(async (lease: { id: string }) => {
        createdLeaseIdRef.current = lease.id;
        setIsCleaningDraft(true);
        setRecoveryError(null);
        try {
            await draft.deletePersistedDraft();
            if (!mountedRef.current) return;
            finishCreatedLease(lease.id);
        } catch {
            if (!mountedRef.current) return;
            setIsCleaningDraft(false);
            setRecoveryError(CLEANUP_ERROR);
        }
    }, [draft, finishCreatedLease]);

    const retryCleanup = useCallback(async () => {
        const id = createdLeaseIdRef.current;
        if (!id || retryLockRef.current) return;
        retryLockRef.current = true;
        setIsRetryingCleanup(true);
        try {
            await draft.deletePersistedDraft();
            if (!mountedRef.current) return;
            finishCreatedLease(id);
        } catch {
            if (!mountedRef.current) return;
            setRecoveryError(CLEANUP_ERROR);
            setIsRetryingCleanup(false);
        } finally {
            retryLockRef.current = false;
        }
    }, [draft, finishCreatedLease]);

    return (
        <>
            {children({ completeCreatedLease })}
            <UnsavedChangesDialog
                open={guard.isDialogOpen && !isSubmitRecovery}
                phase={guard.state.phase}
                error={guard.state.error}
                actionsDisabled={guard.actionsDisabled}
                onStay={guard.stay}
                onDiscard={() => { void guard.discardAndProceed(); }}
                onSave={() => { void guard.saveAndProceed(); }}
            />
            <LeaseSubmitRecoveryDialog
                open={isSubmitRecovery}
                error={recoveryError ?? CLEANUP_ERROR}
                isRetrying={isRetryingCleanup}
                onRetry={() => { void retryCleanup(); }}
            />
        </>
    );
}
