import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { BuildingRecord } from '../../db/database.types';
import { createBuildingRepository } from '../../db/buildingRepository';
import { UnsavedChangesDialog } from '../../navigation/UnsavedChangesDialog';
import { useUnsavedChangesGuard } from '../../navigation/useUnsavedChangesGuard';
import { BuildingDraftRestoreDialog } from './BuildingDraftRestoreDialog';
import { BuildingSubmitRecoveryDialog } from './BuildingSubmitRecoveryDialog';
import { BuildingForm } from './BuildingForm';
import { useBuildingDraftController } from './hooks/useBuildingDraftController';
import {
    buildingFormSchema,
    defaultBuildingValues,
    toBuildingCreateInput,
    type BuildingFormData,
} from './schema';

const CLEANUP_ERROR = 'Non è stato possibile eliminare la bozza locale. Riprova la pulizia.';

export interface BuildingCreateFormProps {
    accountId: string;
    onCreated?: (building: BuildingRecord) => void;
    onCancel?: () => void;
    onExitDraft?: () => void;
    onFormBusyChange?: (busy: boolean) => void;
}

export function BuildingCreateForm({
    accountId,
    onCreated,
    onCancel,
    onExitDraft,
    onFormBusyChange,
}: BuildingCreateFormProps) {
    const repository = useMemo(() => createBuildingRepository({ accountId }), [accountId]);
    const methods = useForm<BuildingFormData>({
        resolver: zodResolver(buildingFormSchema) as Resolver<BuildingFormData>,
        defaultValues: { ...defaultBuildingValues, features: [] },
        mode: 'onChange',
    });
    const draft = useBuildingDraftController(methods);
    const [isCleaningDraft, setIsCleaningDraft] = useState(false);
    const [recoveryError, setRecoveryError] = useState<string | null>(null);
    const [isRetryingCleanup, setIsRetryingCleanup] = useState(false);
    const [isCompletingCreation, setIsCompletingCreation] = useState(false);
    const [createdBuilding, setCreatedBuilding] = useState<BuildingRecord | null>(null);
    const submitLock = useRef(false);
    const retryLock = useRef(false);
    const createdRef = useRef<BuildingRecord | null>(null);
    const pendingCompletionRef = useRef<BuildingRecord | null>(null);
    const isSubmitRecovery = recoveryError !== null;
    const isSubmitting = methods.formState.isSubmitting
        || isCleaningDraft || isSubmitRecovery || isCompletingCreation;
    const guard = useUnsavedChangesGuard({
        enabled: draft.phase === 'ready',
        isDirty: methods.formState.isDirty || isSubmitting,
        isSubmitting,
        isSavingDraft: draft.isSavingDraft,
        saveDraft: draft.saveDraft,
        discardChanges: draft.discardChanges,
    });
    const busy = draft.phase !== 'ready'
        || draft.isSavingDraft || draft.isDeletingDraft
        || isSubmitting || guard.state.phase !== 'idle';

    useEffect(() => { onFormBusyChange?.(busy); }, [busy, onFormBusyChange]);

    const finishCreation = useCallback((building: BuildingRecord) => {
        setIsCompletingCreation(true);
        setIsCleaningDraft(false);
        setIsRetryingCleanup(false);
        setRecoveryError(null);
        methods.reset(methods.getValues());
        pendingCompletionRef.current = building;
    }, [methods]);

    useEffect(() => {
        const building = pendingCompletionRef.current;
        if (!building) return;
        if (guard.state.phase !== 'idle') { guard.resetGuard(); return; }
        pendingCompletionRef.current = null;
        guard.allowNextNavigation();
        onCreated?.(building);
    }, [guard, guard.state.phase, onCreated]);

    const handleSubmit = async (data: BuildingFormData) => {
        if (submitLock.current) return;
        submitLock.current = true;
        setCreatedBuilding(null);
        let created: BuildingRecord;
        try {
            created = repository.create(toBuildingCreateInput(data));
            createdRef.current = created;
            setCreatedBuilding(created);
        } catch (error) {
            submitLock.current = false;
            throw error;
        }
        setIsCleaningDraft(true);
        try {
            await draft.deletePersistedDraft();
            finishCreation(created);
        } catch {
            setIsCleaningDraft(false);
            setRecoveryError(CLEANUP_ERROR);
        }
    };

    const retryCleanup = useCallback(async () => {
        const created = createdRef.current;
        if (!created || retryLock.current) return;
        retryLock.current = true; setIsRetryingCleanup(true);
        try { await draft.deletePersistedDraft(); finishCreation(created); }
        catch { setRecoveryError(CLEANUP_ERROR); setIsRetryingCleanup(false); }
        finally { retryLock.current = false; }
    }, [draft, finishCreation]);

    if (draft.phase === 'loading') {
        return <div role="status" className="flex min-h-[320px] items-center justify-center text-sm text-gray-600">Caricamento bozza...</div>;
    }

    return (
        <div className="flex flex-col gap-4">
            {draft.phase === 'ready' ? (
                <BuildingForm
                    methods={methods}
                    onSubmit={handleSubmit}
                    onCancel={onCancel}
                    onSaveDraft={() => { void draft.saveDraft().catch(() => undefined); }}
                    isSavingDraft={draft.isSavingDraft}
                    actionsDisabled={busy}
                />
            ) : null}
            {draft.draftError && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{draft.draftError}</div>}
            {draft.draftSuccess && <div role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{draft.draftSuccess}</div>}
            {createdBuilding && !isSubmitRecovery && (
                <div role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Edificio salvato correttamente.</div>
            )}
            <BuildingDraftRestoreDialog
                open={draft.phase === 'choice_required' || draft.phase === 'load_error'}
                mode={draft.phase === 'load_error' ? 'error' : 'choice'}
                isDeleting={draft.isDeletingDraft}
                error={draft.phase === 'load_error' ? draft.loadError : draft.operationError}
                onCancel={onExitDraft ?? onCancel ?? (() => undefined)}
                onResume={draft.resumeDraft}
                onDelete={() => { void draft.deleteAndRestart(); }}
                onRetry={draft.retryLoad}
            />
            <UnsavedChangesDialog
                open={guard.isDialogOpen && !isSubmitRecovery}
                phase={guard.state.phase}
                error={guard.state.error}
                actionsDisabled={guard.actionsDisabled}
                onStay={guard.stay}
                onDiscard={() => { void guard.discardAndProceed(); }}
                onSave={() => { void guard.saveAndProceed(); }}
            />
            <BuildingSubmitRecoveryDialog
                open={isSubmitRecovery}
                error={recoveryError ?? CLEANUP_ERROR}
                isRetrying={isRetryingCleanup}
                onRetry={() => { void retryCleanup(); }}
            />
        </div>
    );
}
