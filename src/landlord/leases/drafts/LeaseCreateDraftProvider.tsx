import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { FormProvider, useForm, type Resolver, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { defaultLeaseValues, leaseFormSchema, type LeaseFormData } from '../schema/leaseFormSchema';
import { type LeaseFormTab } from './leaseDraftDefinition';
import { LeaseDraftRestoreDialog } from './LeaseDraftRestoreDialog';
import { useLeaseDraftController, type LeaseDraftPhase } from './useLeaseDraftController';

export interface LeaseCreateDraftContextValue {
    methods: UseFormReturn<LeaseFormData>;
    activeTab: LeaseFormTab;
    setActiveTab(tab: LeaseFormTab): void;
    phase: LeaseDraftPhase;
    isSavingDraft: boolean;
    isDeletingDraft: boolean;
    loadError: string | null;
    operationError: string | null;
    draftError: string | null;
    draftSuccess: string | null;
    saveDraft(): Promise<void>;
    deletePersistedDraft(): Promise<void>;
    discardChanges(): void;
    clearDraftFeedback(): void;
}

const LeaseCreateDraftContext = createContext<LeaseCreateDraftContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useLeaseCreateDraftContext() {
    const value = useContext(LeaseCreateDraftContext);
    if (!value) throw new Error('useLeaseCreateDraftContext richiede LeaseCreateDraftProvider.');
    return value;
}

export function LeaseCreateDraftProvider({ children, onExitDraft }: { children: ReactNode; onExitDraft(): void }) {
    const methods = useForm<LeaseFormData>({
        resolver: zodResolver(leaseFormSchema) as Resolver<LeaseFormData>,
        defaultValues: defaultLeaseValues,
        mode: 'onSubmit',
    });
    const [activeTab, setActiveTab] = useState<LeaseFormTab>('general');
    const draft = useLeaseDraftController(methods, activeTab, setActiveTab);
    const value = useMemo<LeaseCreateDraftContextValue>(() => ({
        methods, activeTab, setActiveTab, phase: draft.phase,
        isSavingDraft: draft.isSavingDraft, isDeletingDraft: draft.isDeletingDraft,
        loadError: draft.loadError, operationError: draft.operationError,
        draftError: draft.draftError, draftSuccess: draft.draftSuccess,
        saveDraft: draft.saveDraft,
        deletePersistedDraft: draft.deletePersistedDraft,
        discardChanges: draft.discardChanges,
        clearDraftFeedback: draft.clearDraftFeedback,
    }), [activeTab, draft, methods]);

    return <LeaseCreateDraftContext.Provider value={value}>
        <FormProvider {...methods}>
            {draft.phase === 'loading' ? <div role="status" className="flex min-h-[320px] items-center justify-center text-sm text-gray-600">Caricamento bozza...</div> : null}
            {draft.phase === 'ready' ? children : null}
            <LeaseDraftRestoreDialog
                open={draft.phase === 'choice_required' || draft.phase === 'load_error'}
                mode={draft.phase === 'load_error' ? 'error' : 'choice'}
                isDeleting={draft.isDeletingDraft}
                error={draft.phase === 'load_error' ? draft.loadError : draft.operationError}
                onCancel={onExitDraft}
                onResume={draft.resumeDraft}
                onDelete={() => { void draft.deleteAndRestart(); }}
                onRetry={draft.retryLoad}
            />
        </FormProvider>
    </LeaseCreateDraftContext.Provider>;
}
