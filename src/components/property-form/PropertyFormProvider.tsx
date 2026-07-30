import {
    createContext,
    useContext,
    useEffect,
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
import { PropertyDraftRestoreDialog } from './PropertyDraftRestoreDialog';
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
import { useFormPersistence } from './hooks/useFormPersistence';

interface PropertyFormContextProps {
    activeTab: string;
    setActiveTab: (tabId: PropertyTabId | string) => void;
    draftPhase: PropertyDraftPhase;
    isSavingDraft: boolean;
    isDeletingDraft: boolean;
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

interface PropertyFormProviderProps {
    children: ReactNode;
    activeTab: string;
    setActiveTab: (tabId: PropertyTabId | string) => void;
    onSubmit: (data: PropertyFormData) => Promise<void>;
    onSubmitError?: (message: string) => void;
    onExitDraft(): void;
    onFormBusyChange?: (busy: boolean) => void;
}

export function PropertyFormProvider({
    children,
    activeTab,
    setActiveTab,
    onSubmit,
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
    const { clearDraft } = useFormPersistence();
    const busy = draft.phase !== 'ready'
        || draft.isSavingDraft
        || draft.isDeletingDraft;

    useEffect(() => {
        onFormBusyChange?.(busy);
    }, [busy, onFormBusyChange]);

    const handleFormSubmit = async (data: PropertyFormData) => {
        try {
            await onSubmit(data);
            clearDraft();
        } catch (error) {
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
        }
    };

    const contextValue: PropertyFormContextProps = {
        activeTab,
        setActiveTab,
        draftPhase: draft.phase,
        isSavingDraft: draft.isSavingDraft,
        isDeletingDraft: draft.isDeletingDraft,
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
            </FormProvider>
        </PropertyFormContext.Provider>
    );
}
