import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantFormProvider } from '../components/tenant-form/TenantFormProvider';
import { TenantFormTabs, TENANT_TABS } from '../components/tenant-form/TenantFormTabs';
import type { TenantTabId } from '../components/tenant-form/TenantFormTabs';
import { Tab1General } from '../components/tenant-form/tabs/Tab1General';
import { Tab2Additional } from '../components/tenant-form/tabs/Tab2Additional';
import { Tab3Guarantors } from '../components/tenant-form/tabs/Tab3Guarantors';
import { Tab4Emergency } from '../components/tenant-form/tabs/Tab4Emergency';
import { Tab5Documents } from '../components/tenant-form/tabs/Tab5Documents';
import type { TenantFormData } from '../components/tenant-form/schema';
import { ArrowLeft, Save } from 'lucide-react';
import { createTenant } from '../db/tenantRepository';
import { StatusToast } from '../components/ui/StatusToast';

export function NewTenantPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTabId] = useState<TenantTabId>(TENANT_TABS[0].id);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [clearDraftError, setClearDraftError] = useState<(() => void) | null>(null);

    const setActiveTab = (id: string | TenantTabId) => {
        setActiveTabId(id as TenantTabId);
    };

    const handleDraftErrorClearReady = useCallback((clear: () => void) => {
        setClearDraftError(() => clear);
    }, []);

    const handleSubmit = async (data: TenantFormData) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const tenant = createTenant(data);
            navigate(`/tenants/${tenant.id}`, {
                state: {
                    toast: {
                        title: 'Successo',
                        message: 'Creato!',
                    },
                },
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <StatusToast
                toast={submitError ? { variant: 'error', title: 'Errore', message: submitError } : null}
                onClose={() => {
                    setSubmitError(null);
                    clearDraftError?.();
                }}
            />
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-normal text-gray-800">Nuovo inquilino</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            form="tenant-form"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors min-w-[100px] justify-center"
                        >
                            {isSubmitting ? 'Salvataggio...' : (
                                <>
                                    <Save className="w-4 h-4 ml-[-4px]" />
                                    Salva
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <TenantFormProvider
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onSubmit={handleSubmit}
                onSubmitError={(message) => setSubmitError(message)}
                onDraftErrorClearReady={handleDraftErrorClearReady}
            >
                <div className="flex-1 min-h-0 bg-gray-50/50 flex flex-col">
                    <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
                        <TenantFormTabs />

                        <div className="flex-1 overflow-y-auto p-6 pb-32 relative">
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-[400px]">
                                {activeTab === 'info1' && <Tab1General />}
                                {activeTab === 'info2' && <Tab2Additional />}
                                {activeTab === 'info3' && <Tab3Guarantors />}
                                {activeTab === 'info5' && <Tab4Emergency />}
                                {activeTab === 'info4' && <Tab5Documents />}
                            </div>
                        </div>
                    </div>
                </div>
            </TenantFormProvider>
        </div>
    );
}
