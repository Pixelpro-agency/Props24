import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

import {
    TenantFormProvider,
    useTenantFormContext,
} from '../components/tenant-form/TenantFormProvider';
import {
    TenantFormTabs,
    TENANT_TABS,
    type TenantTabId,
} from '../components/tenant-form/TenantFormTabs';
import { Tab1General } from '../components/tenant-form/tabs/Tab1General';
import { Tab2Additional } from '../components/tenant-form/tabs/Tab2Additional';
import { Tab3Guarantors } from '../components/tenant-form/tabs/Tab3Guarantors';
import { Tab4Emergency } from '../components/tenant-form/tabs/Tab4Emergency';
import { Tab5Documents } from '../components/tenant-form/tabs/Tab5Documents';
import type { TenantFormData } from '../components/tenant-form/schema';
import { createTenant } from '../db/tenantRepository';
import { StatusToast } from '../components/ui/StatusToast';

function navigateBackOrTenants(
    navigate: ReturnType<typeof useNavigate>,
): void {
    const historyIndex = (
        window.history.state as { idx?: unknown } | null
    )?.idx;
    if (typeof historyIndex === 'number' && historyIndex > 0) {
        navigate(-1);
        return;
    }
    navigate('/tenants', { replace: true });
}

interface TenantFormContentProps {
    activeTab: TenantTabId;
    submitError: string | null;
    clearSubmitError(): void;
}

function TenantFormContent({
    activeTab,
    submitError,
    clearSubmitError,
}: TenantFormContentProps) {
    const navigate = useNavigate();
    const draft = useTenantFormContext();
    const operationsPending =
        draft.isSubmitting || draft.isSavingDraft || draft.isDeletingDraft;
    const toast = submitError
        ? { variant: 'error' as const, title: 'Errore', message: submitError }
        : draft.draftError
            ? {
                variant: 'error' as const,
                title: 'Errore bozza',
                message: draft.draftError,
            }
            : draft.draftSuccess
                ? {
                    variant: 'success' as const,
                    title: 'Bozza',
                    message: draft.draftSuccess,
                }
                : null;

    return (
        <>
            <StatusToast
                toast={toast}
                onClose={() => {
                    clearSubmitError();
                    draft.clearDraftFeedback();
                }}
            />
            <div className="bg-gray-50/50">
                <div className="max-w-7xl mx-auto w-full">
                    <TenantFormTabs />
                    <div className="p-6">
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-[400px]">
                            {activeTab === 'info1' && <Tab1General />}
                            {activeTab === 'info2' && <Tab2Additional />}
                            {activeTab === 'info3' && <Tab3Guarantors />}
                            {activeTab === 'info5' && <Tab4Emergency />}
                            {activeTab === 'info4' && <Tab5Documents />}
                        </div>
                        <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    void draft.saveDraft()
                                        .catch(() => undefined);
                                }}
                                disabled={
                                    draft.draftPhase !== 'ready'
                                    || operationsPending
                                }
                                className="inline-flex items-center justify-center rounded-md border border-green-600 bg-white px-4 py-2.5 text-sm font-medium text-green-700 shadow-sm transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {draft.isSavingDraft
                                    ? 'Salvataggio bozza...'
                                    : 'Salva bozza'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigateBackOrTenants(navigate)}
                                disabled={operationsPending}
                                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                disabled={operationsPending}
                                className="inline-flex min-w-[100px] items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {draft.isSubmitting ? 'Salvataggio...' : (
                                    <>
                                        <Save className="w-4 h-4 ml-[-4px]" />
                                        Salva
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export function NewTenantPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTabId] = useState<TenantTabId>(
        TENANT_TABS[0].id,
    );
    const [isFormBusy, setIsFormBusy] = useState(true);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleCreateTenant = (data: TenantFormData) => {
        setSubmitError(null);
        const tenant = createTenant(data);
        return { id: tenant.id };
    };

    const handleTenantCreated = ({ id }: { id: string }) => {
        navigate(`/tenants/${id}`, {
            state: {
                toast: {
                    title: 'Successo',
                    message: 'Creato!',
                },
            },
        });
    };

    return (
        <div className="flex min-h-full flex-col">
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigateBackOrTenants(navigate)}
                            disabled={isFormBusy}
                            className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-500 disabled:opacity-60"
                            aria-label="Indietro"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-normal text-gray-800">
                            Nuovo inquilino
                        </h1>
                    </div>
                </div>
            </div>
            <TenantFormProvider
                activeTab={activeTab}
                setActiveTab={(id) => setActiveTabId(id as TenantTabId)}
                onCreateTenant={handleCreateTenant}
                onTenantCreated={handleTenantCreated}
                onSubmitError={setSubmitError}
                onExitDraft={() => navigateBackOrTenants(navigate)}
                onFormBusyChange={setIsFormBusy}
            >
                <TenantFormContent
                    activeTab={activeTab}
                    submitError={submitError}
                    clearSubmitError={() => setSubmitError(null)}
                />
            </TenantFormProvider>
        </div>
    );
}
