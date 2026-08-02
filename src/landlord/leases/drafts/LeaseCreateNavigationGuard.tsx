import type { ReactNode } from 'react';

import { UnsavedChangesDialog } from '../../../navigation/UnsavedChangesDialog';
import { useUnsavedChangesGuard } from '../../../navigation/useUnsavedChangesGuard';
import { useLeaseCreateDraftContext } from './LeaseCreateDraftProvider';

export interface LeaseCreateNavigationGuardRenderProps {
    allowNextNavigation(): void;
}

export interface LeaseCreateNavigationGuardProps {
    children(props: LeaseCreateNavigationGuardRenderProps): ReactNode;
}

export function LeaseCreateNavigationGuard({
    children,
}: LeaseCreateNavigationGuardProps) {
    const draft = useLeaseCreateDraftContext();
    const isSubmitting = draft.methods.formState.isSubmitting;
    const guard = useUnsavedChangesGuard({
        enabled: draft.phase === 'ready',
        isDirty: draft.methods.formState.isDirty || isSubmitting,
        isSubmitting,
        isSavingDraft: draft.isSavingDraft,
        saveDraft: draft.saveDraft,
        discardChanges: draft.discardChanges,
    });

    return (
        <>
            {children({ allowNextNavigation: guard.allowNextNavigation })}
            <UnsavedChangesDialog
                open={guard.isDialogOpen}
                phase={guard.state.phase}
                error={guard.state.error}
                actionsDisabled={guard.actionsDisabled}
                onStay={guard.stay}
                onDiscard={() => { void guard.discardAndProceed(); }}
                onSave={() => { void guard.saveAndProceed(); }}
            />
        </>
    );
}
