import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import {
    FormProvider,
    useForm,
    type FieldErrors,
    type Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { UnsavedChangesDialog } from '../../navigation/UnsavedChangesDialog';
import { useUnsavedChangesGuard } from '../../navigation/useUnsavedChangesGuard';
import { TenantDraftRestoreDialog } from './TenantDraftRestoreDialog';
import { TenantSubmitRecoveryDialog } from './TenantSubmitRecoveryDialog';
import type { TenantTabId } from './TenantFormTabs';
import {
    useTenantDraftController,
    type TenantDraftController,
    type TenantDraftPhase,
} from './hooks/useTenantDraftController';
import {
    defaultTenantValues,
    tenantSchema,
    type TenantFormData,
} from './schema';
import { DuplicateTenantFiscalIdentityError, TenantNotFoundError } from '../../db/databaseErrors';

const CLEANUP_ERROR =
    'Non è stato possibile eliminare la bozza locale. Riprova la pulizia.';

interface TenantFormContextProps {
    activeTab: string;
    setActiveTab: (tabId: TenantTabId | string) => void;
    draftPhase: TenantDraftPhase;
    isSavingDraft: boolean;
    isDeletingDraft: boolean;
    isSubmitting: boolean;
    isSubmitRecovery: boolean;
    draftError: string | null;
    draftSuccess: string | null;
    saveDraft(): Promise<void>;
    clearDraftFeedback(): void;
}

const TenantFormContext =
    createContext<TenantFormContextProps | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useTenantFormContext() {
    const context = useContext(TenantFormContext);
    if (!context) {
        throw new Error(
            'useTenantFormContext must be used within a TenantFormProvider',
        );
    }
    return context;
}

interface CreatedTenant {
    id: string;
}

interface TenantFormProviderProps {
    children: ReactNode;
    activeTab: string;
    setActiveTab: (tabId: TenantTabId | string) => void;
    onCreateTenant(
        data: TenantFormData,
    ): CreatedTenant | Promise<CreatedTenant>;
    onTenantCreated(tenant: CreatedTenant): void;
    onSubmitError?: (message: string) => void;
    onExitDraft(): void;
    onFormBusyChange?: (busy: boolean) => void;
}

function validationMessages(errors: Record<string, unknown>): string {
    const messages = new Set<string>();
    const seen = new WeakSet<object>();
    const walk = (value: unknown) => {
        if (!value || typeof value !== 'object') return;
        if (value instanceof Element) return;
        if (seen.has(value)) return;
        seen.add(value);
        const record = value as { message?: unknown };
        if (typeof record.message === 'string') messages.add(record.message);
        Object.entries(value as Record<string, unknown>)
            .forEach(([key, child]) => {
                if (key !== 'ref') walk(child);
            });
    };
    walk(errors);
    return Array.from(messages).join('\n')
        || 'Controlla i campi obbligatori prima di salvare.';
}

export function TenantFormProvider({
    children,
    activeTab,
    setActiveTab,
    onCreateTenant,
    onTenantCreated,
    onSubmitError,
    onExitDraft,
    onFormBusyChange,
}: TenantFormProviderProps) {
    const methods = useForm<TenantFormData>({
        resolver: zodResolver(tenantSchema) as Resolver<TenantFormData>,
        defaultValues: defaultTenantValues,
        mode: 'onChange',
        shouldFocusError: true,
    });
    const draft = useTenantDraftController(methods);
    const [isCleaningDraft, setIsCleaningDraft] = useState(false);
    const [recoveryError, setRecoveryError] = useState<string | null>(null);
    const [isRetryingCleanup, setIsRetryingCleanup] = useState(false);
    const [isCompletingCreation, setIsCompletingCreation] = useState(false);
    const submitLockRef = useRef(false);
    const retryLockRef = useRef(false);
    const createdTenantIdRef = useRef<string | null>(null);
    const pendingCompletionIdRef = useRef<string | null>(null);
    const mountedRef = useRef(true);
    const isSubmitRecovery = recoveryError !== null;
    const isSubmitting = methods.formState.isSubmitting
        || isCleaningDraft
        || isSubmitRecovery
        || isCompletingCreation;
    const requiresNavigationProtection =
        methods.formState.isDirty || isSubmitting;

    const guard = useUnsavedChangesGuard({
        enabled: draft.phase === 'ready',
        isDirty: requiresNavigationProtection,
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

    const finishCreatedTenant = useCallback((id: string) => {
        setIsCompletingCreation(true);
        setIsCleaningDraft(false);
        setIsRetryingCleanup(false);
        setRecoveryError(null);
        methods.reset(methods.getValues());
        pendingCompletionIdRef.current = id;
    }, [methods]);

    useEffect(() => {
        const id = pendingCompletionIdRef.current;
        if (!id) return;
        if (guard.state.phase !== 'idle') {
            guard.resetGuard();
            return;
        }
        pendingCompletionIdRef.current = null;
        guard.allowNextNavigation();
        onTenantCreated({ id });
    }, [
        guard,
        guard.state.phase,
        onTenantCreated,
    ]);

    const handleFormSubmit = async (data: TenantFormData) => {
        if (submitLockRef.current) return;
        submitLockRef.current = true;
        onSubmitError?.('');
        let created: CreatedTenant;
        try {
            created = await onCreateTenant(data);
            createdTenantIdRef.current = created.id;
        } catch (error) {
            submitLockRef.current = false;
            if (error instanceof DuplicateTenantFiscalIdentityError) {
                const field = error.field === 'vatNumber'
                    ? 'TenantVatNumber'
                    : data.TenantType === 'company'
                        ? 'TenantCompanyFiscalCode'
                        : 'TenantFiscalCode';
                methods.setError(field, {
                    type: 'manual',
                    message: error.message,
                });
                setActiveTab('info1');
                onSubmitError?.(error.message);
                return;
            }
            onSubmitError?.(
                error instanceof Error
                    ? error.message
                    : 'Errore durante il salvataggio del nuovo inquilino.',
            );
            return;
        }

        setIsCleaningDraft(true);
        try {
            await draft.deletePersistedDraft();
            if (!mountedRef.current) return;
            finishCreatedTenant(created.id);
        } catch {
            if (!mountedRef.current) return;
            setIsCleaningDraft(false);
            setRecoveryError(CLEANUP_ERROR);
        }
    };

    const retryCleanup = useCallback(async () => {
        const id = createdTenantIdRef.current;
        if (!id || retryLockRef.current) return;
        retryLockRef.current = true;
        setIsRetryingCleanup(true);
        try {
            await draft.deletePersistedDraft();
            if (!mountedRef.current) return;
            finishCreatedTenant(id);
        } catch {
            if (!mountedRef.current) return;
            setRecoveryError(CLEANUP_ERROR);
            setIsRetryingCleanup(false);
        } finally {
            retryLockRef.current = false;
        }
    }, [draft, finishCreatedTenant]);

    const isFormBusy = draft.phase !== 'ready'
        || draft.isSavingDraft
        || draft.isDeletingDraft
        || isSubmitting;

    useEffect(() => {
        onFormBusyChange?.(isFormBusy);
    }, [isFormBusy, onFormBusyChange]);

    const contextValue: TenantFormContextProps = {
        activeTab,
        setActiveTab,
        draftPhase: draft.phase,
        isSavingDraft: draft.isSavingDraft,
        isDeletingDraft: draft.isDeletingDraft,
        isSubmitting,
        isSubmitRecovery,
        draftError: draft.draftError,
        draftSuccess: draft.draftSuccess,
        saveDraft: draft.saveDraft,
        clearDraftFeedback: draft.clearDraftFeedback,
    };

    const renderBlockingState = (controller: TenantDraftController) => {
        if (controller.phase !== 'loading') return null;
        return (
            <div
                role="status"
                className="flex min-h-[320px] items-center justify-center text-sm text-gray-600"
            >
                Caricamento bozza...
            </div>
        );
    };

    return (
        <TenantFormContext.Provider value={contextValue}>
            <FormProvider {...methods}>
                {renderBlockingState(draft)}
                {draft.phase === 'ready' ? (
                    <form
                        id="tenant-form"
                        onSubmit={methods.handleSubmit(
                            handleFormSubmit,
                            (errors: FieldErrors<TenantFormData>) => {
                                onSubmitError?.(validationMessages(errors));
                            },
                        )}
                        className="flex flex-col flex-1 h-full"
                    >
                        {children}
                    </form>
                ) : null}
                <TenantDraftRestoreDialog
                    open={
                        draft.phase === 'choice_required'
                        || draft.phase === 'load_error'
                    }
                    mode={
                        draft.phase === 'load_error' ? 'error' : 'choice'
                    }
                    isDeleting={draft.isDeletingDraft}
                    error={
                        draft.phase === 'load_error'
                            ? draft.loadError
                            : draft.operationError
                    }
                    onCancel={onExitDraft}
                    onResume={draft.resumeDraft}
                    onDelete={() => void draft.deleteAndRestart()}
                    onRetry={draft.retryLoad}
                />
                <UnsavedChangesDialog
                    open={guard.isDialogOpen && !isSubmitRecovery}
                    phase={guard.state.phase}
                    error={guard.state.error}
                    actionsDisabled={guard.actionsDisabled}
                    onStay={guard.stay}
                    onDiscard={() => void guard.discardAndProceed()}
                    onSave={() => void guard.saveAndProceed()}
                />
                <TenantSubmitRecoveryDialog
                    open={isSubmitRecovery}
                    error={recoveryError ?? CLEANUP_ERROR}
                    isRetrying={isRetryingCleanup}
                    onRetry={() => void retryCleanup()}
                />
            </FormProvider>
        </TenantFormContext.Provider>
    );
}

interface TenantEditFormProviderProps {
    children: ReactNode;
    initialState: TenantFormData;
    activeTab: string;
    setActiveTab: (tabId: TenantTabId | string) => void;
    onUpdateTenant(data: TenantFormData): unknown | Promise<unknown>;
    onTenantUpdated(): void;
    onSubmitError?: (message: string) => void;
    onFormBusyChange?: (busy: boolean) => void;
    entityId: string;
    onExitDraft(): void;
}

export function TenantEditFormProvider({
    children, initialState, activeTab, setActiveTab, onUpdateTenant,
    onTenantUpdated, onSubmitError, onFormBusyChange, entityId, onExitDraft,
}: TenantEditFormProviderProps) {
    const methods = useForm<TenantFormData>({
        resolver: zodResolver(tenantSchema) as Resolver<TenantFormData>,
        defaultValues: initialState,
        mode: 'onChange',
        shouldFocusError: true,
    });
    const draft = useTenantDraftController(methods, undefined, { initialState, target: { mode: 'edit', entityId } });
    const [isCleaningDraft, setIsCleaningDraft] = useState(false);
    const [recoveryError, setRecoveryError] = useState<string | null>(null);
    const [isRetryingCleanup, setIsRetryingCleanup] = useState(false);
    const [isCompletingUpdate, setIsCompletingUpdate] = useState(false);
    const submitLockRef = useRef(false);
    const retryLockRef = useRef(false);
    const updateCompletedRef = useRef(false);
    const pendingCompletionRef = useRef(false);
    const mountedRef = useRef(true);
    const isSubmitRecovery = recoveryError !== null;
    const isSubmitting = methods.formState.isSubmitting || isCleaningDraft || isSubmitRecovery || isCompletingUpdate;
    const guard = useUnsavedChangesGuard({
        enabled: draft.phase === 'ready',
        isDirty: methods.formState.isDirty || isSubmitting,
        isSubmitting,
        isSavingDraft: draft.isSavingDraft,
        saveDraft: draft.saveDraft,
        discardChanges: draft.discardChanges,
    });
    const busy = draft.phase !== 'ready' || draft.isSavingDraft || draft.isDeletingDraft || isSubmitting || guard.state.phase !== 'idle';

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        onFormBusyChange?.(busy);
    }, [busy, onFormBusyChange]);

    const finishUpdatedTenant = useCallback(() => {
        setIsCompletingUpdate(true);
        setIsCleaningDraft(false);
        setIsRetryingCleanup(false);
        setRecoveryError(null);
        methods.reset(methods.getValues());
        pendingCompletionRef.current = true;
    }, [methods]);

    useEffect(() => {
        if (!pendingCompletionRef.current) return;
        if (guard.state.phase !== 'idle') { guard.resetGuard(); return; }
        pendingCompletionRef.current = false;
        guard.allowNextNavigation();
        onTenantUpdated();
    }, [guard, guard.state.phase, onTenantUpdated]);

    const handleSubmit = async (data: TenantFormData) => {
        if (submitLockRef.current) return;
        submitLockRef.current = true;
        onSubmitError?.('');
        try {
            await onUpdateTenant(data);
            updateCompletedRef.current = true;
        } catch (error) {
            submitLockRef.current = false;
            if (error instanceof DuplicateTenantFiscalIdentityError) {
                const field = error.field === 'vatNumber'
                    ? 'TenantVatNumber'
                    : data.TenantType === 'company'
                        ? 'TenantCompanyFiscalCode'
                        : 'TenantFiscalCode';
                methods.setError(field, { type: 'manual', message: error.message });
                setActiveTab('info1');
                onSubmitError?.(error.message);
                return;
            }
            onSubmitError?.(error instanceof TenantNotFoundError
                ? 'Inquilino non più disponibile.'
                : error instanceof Error
                    ? error.message
                    : 'Errore durante il salvataggio delle modifiche.');
            return;
        }
        setIsCleaningDraft(true);
        try {
            await draft.deletePersistedDraft();
            if (!mountedRef.current) return;
            finishUpdatedTenant();
        } catch {
            if (!mountedRef.current) return;
            setIsCleaningDraft(false);
            setRecoveryError(CLEANUP_ERROR);
        }
    };

    const retryCleanup = useCallback(async () => {
        if (!updateCompletedRef.current || retryLockRef.current) return;
        retryLockRef.current = true;
        setIsRetryingCleanup(true);
        try {
            await draft.deletePersistedDraft();
            if (!mountedRef.current) return;
            finishUpdatedTenant();
        } catch {
            if (!mountedRef.current) return;
            setRecoveryError(CLEANUP_ERROR);
            setIsRetryingCleanup(false);
        } finally { retryLockRef.current = false; }
    }, [draft, finishUpdatedTenant]);

    const contextValue: TenantFormContextProps = {
        activeTab, setActiveTab, draftPhase: draft.phase, isSavingDraft: draft.isSavingDraft,
        isDeletingDraft: draft.isDeletingDraft, isSubmitting, isSubmitRecovery,
        draftError: draft.draftError, draftSuccess: draft.draftSuccess,
        saveDraft: draft.saveDraft, clearDraftFeedback: draft.clearDraftFeedback,
    };

    return (
        <TenantFormContext.Provider value={contextValue}>
            <FormProvider {...methods}>
                {draft.phase === 'loading' ? <div role="status">Caricamento bozza...</div> : null}
                {draft.phase === 'ready' ? <form
                    id="tenant-form"
                    onSubmit={methods.handleSubmit(handleSubmit, (errors) => {
                        onSubmitError?.(validationMessages(errors));
                    })}
                    className="flex flex-col flex-1 h-full"
                >
                    {children}
                </form> : null}
                <TenantDraftRestoreDialog formMode="edit" open={draft.phase === 'choice_required' || draft.phase === 'load_error'} mode={draft.phase === 'load_error' ? 'error' : 'choice'} isDeleting={draft.isDeletingDraft} error={draft.phase === 'load_error' ? draft.loadError : draft.operationError} onCancel={onExitDraft} onResume={draft.resumeDraft} onDelete={() => { void draft.deleteAndRestart(); }} onRetry={draft.retryLoad} />
                <UnsavedChangesDialog open={guard.isDialogOpen && !isSubmitRecovery} phase={guard.state.phase} error={guard.state.error} actionsDisabled={guard.actionsDisabled} onStay={guard.stay} onDiscard={() => { void guard.discardAndProceed(); }} onSave={() => { void guard.saveAndProceed(); }} />
                <TenantSubmitRecoveryDialog mode="edit" open={isSubmitRecovery} error={recoveryError ?? CLEANUP_ERROR} isRetrying={isRetryingCleanup} onRetry={() => { void retryCleanup(); }} />
            </FormProvider>
        </TenantFormContext.Provider>
    );
}
