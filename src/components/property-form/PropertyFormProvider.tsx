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
    type Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
    DuplicatePropertyIdentifierError,
    DuplicatePropertyLocationError,
} from '../../db/databaseErrors';
import { UnsavedChangesDialog } from '../../navigation/UnsavedChangesDialog';
import { useUnsavedChangesGuard } from '../../navigation/useUnsavedChangesGuard';
import { PropertyDraftRestoreDialog } from './PropertyDraftRestoreDialog';
import { PropertySubmitRecoveryDialog } from './PropertySubmitRecoveryDialog';
import type { PropertyTabId } from './PropertyFormTabs';
import {
    defaultPropertyValues,
    propertySchema,
    type PropertyFormData,
} from './schema';
import {
    usePropertyDraftController,
    type PropertyDraftPhase,
} from './hooks/usePropertyDraftController';

const PROPERTY_CLEANUP_ERROR =
    'Non è stato possibile eliminare la bozza locale. Riprova la pulizia.';

interface PropertyFormContextProps {
    activeTab: string;
    setActiveTab: (tabId: PropertyTabId | string) => void;
    draftPhase: PropertyDraftPhase;
    isSavingDraft: boolean;
    isDeletingDraft: boolean;
    isSubmitting: boolean;
    isSubmitRecovery: boolean;
    draftError: string | null;
    draftSuccess: string | null;
    saveDraft(): Promise<void>;
    clearDraftFeedback(): void;
}

const PropertyFormContext =
    createContext<PropertyFormContextProps | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function usePropertyFormContext() {
    const context = useContext(PropertyFormContext);
    if (!context) {
        throw new Error(
            'usePropertyFormContext must be used within a PropertyFormProvider',
        );
    }
    return context;
}

interface CreatedProperty {
    id: string;
}

interface PropertyFormProviderProps {
    children: ReactNode;
    activeTab: string;
    setActiveTab: (tabId: PropertyTabId | string) => void;
    onCreateProperty(
        data: PropertyFormData,
    ): CreatedProperty | Promise<CreatedProperty>;
    onPropertyCreated(property: CreatedProperty): void;
    onSubmitError?: (message: string) => void;
    onExitDraft(): void;
    onFormBusyChange?: (busy: boolean) => void;
}

export function PropertyFormProvider({
    children,
    activeTab,
    setActiveTab,
    onCreateProperty,
    onPropertyCreated,
    onSubmitError,
    onExitDraft,
    onFormBusyChange,
}: PropertyFormProviderProps) {
    const methods = useForm<PropertyFormData>({
        resolver: zodResolver(propertySchema) as Resolver<PropertyFormData>,
        defaultValues: defaultPropertyValues,
        mode: 'onChange',
    });
    const draft = usePropertyDraftController(methods);
    const [isCleaningDraft, setIsCleaningDraft] = useState(false);
    const [recoveryError, setRecoveryError] = useState<string | null>(null);
    const [isRetryingCleanup, setIsRetryingCleanup] = useState(false);
    const [isCompletingCreation, setIsCompletingCreation] = useState(false);
    const submitLockRef = useRef(false);
    const retryLockRef = useRef(false);
    const createdPropertyIdRef = useRef<string | null>(null);
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
    const busy = draft.phase !== 'ready'
        || draft.isSavingDraft
        || draft.isDeletingDraft
        || isSubmitting
        || guard.state.phase !== 'idle';

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        onFormBusyChange?.(busy);
    }, [busy, onFormBusyChange]);

    const finishCreatedProperty = useCallback((id: string) => {
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
        onPropertyCreated({ id });
    }, [guard, guard.state.phase, onPropertyCreated]);

    const handleFormSubmit = async (data: PropertyFormData) => {
        if (submitLockRef.current) return;
        submitLockRef.current = true;
        onSubmitError?.('');
        let created: CreatedProperty;
        try {
            created = await onCreateProperty(data);
            createdPropertyIdRef.current = created.id;
        } catch (error) {
            submitLockRef.current = false;
            if (error instanceof DuplicatePropertyIdentifierError) {
                const message = "Esiste gia un'unita con questo identificativo.";
                methods.setError('PropertyTitle', {
                    type: 'manual',
                    message,
                });
                methods.setFocus('PropertyTitle');
                onSubmitError?.(message);
                return;
            }
            if (error instanceof DuplicatePropertyLocationError) {
                const message = "Immobile gia registrato. Esiste gia un'unita con lo stesso indirizzo, citta e CAP.";
                methods.setError('PropertyAddress', {
                    type: 'manual',
                    message,
                });
                methods.setError('PropertyCity', {
                    type: 'manual',
                    message,
                });
                methods.setError('PropertyPostalCode', {
                    type: 'manual',
                    message,
                });
                methods.setFocus('PropertyAddress');
                onSubmitError?.(message);
                return;
            }
            onSubmitError?.(
                error instanceof Error
                    ? error.message
                    : 'Errore durante il salvataggio della nuova unita.',
            );
            return;
        }

        setIsCleaningDraft(true);
        try {
            await draft.deletePersistedDraft();
            if (!mountedRef.current) return;
            finishCreatedProperty(created.id);
        } catch {
            if (!mountedRef.current) return;
            setIsCleaningDraft(false);
            setRecoveryError(PROPERTY_CLEANUP_ERROR);
        }
    };

    const retryCleanup = useCallback(async () => {
        const id = createdPropertyIdRef.current;
        if (!id || retryLockRef.current) return;
        retryLockRef.current = true;
        setIsRetryingCleanup(true);
        try {
            await draft.deletePersistedDraft();
            if (!mountedRef.current) return;
            finishCreatedProperty(id);
        } catch {
            if (!mountedRef.current) return;
            setRecoveryError(PROPERTY_CLEANUP_ERROR);
            setIsRetryingCleanup(false);
        } finally {
            retryLockRef.current = false;
        }
    }, [draft, finishCreatedProperty]);

    const contextValue: PropertyFormContextProps = {
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

    return (
        <PropertyFormContext.Provider value={contextValue}>
            <FormProvider {...methods}>
                {draft.phase === 'loading' ? (
                    <div
                        role="status"
                        className="flex min-h-[320px] items-center justify-center text-sm text-gray-600"
                    >
                        Caricamento bozza...
                    </div>
                ) : null}
                {draft.phase === 'ready' ? (
                    <form
                        id="property-form"
                        onSubmit={methods.handleSubmit(handleFormSubmit)}
                        className="flex flex-col flex-1 h-full"
                    >
                        {children}
                    </form>
                ) : null}
                <PropertyDraftRestoreDialog
                    open={
                        draft.phase === 'choice_required'
                        || draft.phase === 'load_error'
                    }
                    mode={draft.phase === 'load_error' ? 'error' : 'choice'}
                    isDeleting={draft.isDeletingDraft}
                    error={
                        draft.phase === 'load_error'
                            ? draft.loadError
                            : draft.operationError
                    }
                    onCancel={onExitDraft}
                    onResume={draft.resumeDraft}
                    onDelete={() => {
                        void draft.deleteAndRestart().catch(() => undefined);
                    }}
                    onRetry={draft.retryLoad}
                />
                <UnsavedChangesDialog
                    open={guard.isDialogOpen && !isSubmitRecovery}
                    phase={guard.state.phase}
                    error={guard.state.error}
                    actionsDisabled={guard.actionsDisabled}
                    onStay={guard.stay}
                    onDiscard={() => {
                        void guard.discardAndProceed();
                    }}
                    onSave={() => {
                        void guard.saveAndProceed();
                    }}
                />
                <PropertySubmitRecoveryDialog
                    open={isSubmitRecovery}
                    error={recoveryError ?? PROPERTY_CLEANUP_ERROR}
                    isRetrying={isRetryingCleanup}
                    onRetry={() => {
                        void retryCleanup();
                    }}
                />
            </FormProvider>
        </PropertyFormContext.Provider>
    );
}
