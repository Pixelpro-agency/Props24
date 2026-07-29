import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
    useForm,
    FormProvider,
    type FieldErrors,
    type Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tenantSchema, defaultTenantValues } from './schema';
import type { TenantFormData } from './schema';
import type { TenantTabId } from './TenantFormTabs';
import { clearDraft as clearLegacyDraft } from '../../db/jsonDb';
import {
    useTenantDraftController,
    type TenantDraftController,
    type TenantDraftPhase,
} from './hooks/useTenantDraftController';
import { TenantDraftRestoreDialog } from './TenantDraftRestoreDialog';

interface TenantFormContextProps {
    activeTab: string;
    setActiveTab: (tabId: TenantTabId | string) => void;
    draftPhase: TenantDraftPhase;
    isSavingDraft: boolean;
    isDeletingDraft: boolean;
    draftError: string | null;
    draftSuccess: string | null;
    saveDraft(): Promise<void>;
    discardChanges(): void;
    clearDraftFeedback(): void;
}

const TenantFormContext = createContext<TenantFormContextProps | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useTenantFormContext() {
    const context = useContext(TenantFormContext);
    if (!context) {
        throw new Error('useTenantFormContext must be used within a TenantFormProvider');
    }
    return context;
}

interface TenantFormProviderProps {
    children: ReactNode;
    activeTab: string;
    setActiveTab: (tabId: TenantTabId | string) => void;
    onSubmit: (data: TenantFormData) => Promise<void>;
    onSubmitError?: (message: string) => void;
    onExitDraft(): void;
    onDraftBusyChange?: (busy: boolean) => void;
}

export function TenantFormProvider({
    children,
    activeTab,
    setActiveTab,
    onSubmit,
    onSubmitError,
    onExitDraft,
    onDraftBusyChange,
}: TenantFormProviderProps) {
    const methods = useForm<TenantFormData>({
        resolver: zodResolver(tenantSchema) as Resolver<TenantFormData>,
        defaultValues: defaultTenantValues,
        mode: 'onChange',
        shouldFocusError: true,
    });

    const draft = useTenantDraftController(methods);
    const isDraftBusy = draft.phase !== 'ready'
        || draft.isSavingDraft
        || draft.isDeletingDraft;

    useEffect(() => {
        onDraftBusyChange?.(isDraftBusy);
    }, [isDraftBusy, onDraftBusyChange]);

    const validationMessages = (errors: Record<string, unknown>) => {
        const messages = new Set<string>();
        const seen = new WeakSet<object>();
        const walk = (value: unknown) => {
            if (!value || typeof value !== 'object') return;
            if (value instanceof Element) return;
            if (seen.has(value)) return;
            seen.add(value);
            const record = value as { message?: unknown };
            if (typeof record.message === 'string') messages.add(record.message);
            Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
                if (key !== 'ref') walk(child);
            });
        };
        walk(errors);
        return Array.from(messages).join('\n') || 'Controlla i campi obbligatori prima di salvare.';
    };

    const handleFormSubmit = async (data: TenantFormData) => {
        try {
            await onSubmit(data);
            // Compatibilità temporanea F3.1B: F3.1C sposterà la pulizia
            // asincrona nel flusso submit basato su DraftRepository.
            clearLegacyDraft('tenantForm');
        } catch (error) {
            onSubmitError?.(error instanceof Error ? error.message : 'Errore durante il salvataggio del nuovo inquilino.');
        }
    };

    const contextValue: TenantFormContextProps = {
        activeTab,
        setActiveTab,
        draftPhase: draft.phase,
        isSavingDraft: draft.isSavingDraft,
        isDeletingDraft: draft.isDeletingDraft,
        draftError: draft.draftError,
        draftSuccess: draft.draftSuccess,
        saveDraft: draft.saveDraft,
        discardChanges: draft.discardChanges,
        clearDraftFeedback: draft.clearDraftFeedback,
    };

    const renderBlockingState = (controller: TenantDraftController) => {
        if (controller.phase === 'loading') {
            return (
                <div
                    role="status"
                    className="flex min-h-[320px] items-center justify-center text-sm text-gray-600"
                >
                    Caricamento bozza...
                </div>
            );
        }
        return null;
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
                                onSubmitError?.(
                                    validationMessages(errors),
                                );
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
            </FormProvider>
        </TenantFormContext.Provider>
    );
}
