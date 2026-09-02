import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TenantFormProvider } from '../components/tenant-form/TenantFormProvider';
import { TENANT_TABS, type TenantTabId } from '../components/tenant-form/TenantFormTabs';
import { TenantFormContent } from '../components/tenant-form/TenantFormContent';
import type { TenantFormData } from '../components/tenant-form/schema';
import { createTenant } from '../db/tenantRepository';

function navigateBackOrTenants(navigate: ReturnType<typeof useNavigate>): void {
    const historyIndex = (window.history.state as { idx?: unknown } | null)?.idx;
    if (typeof historyIndex === 'number' && historyIndex > 0) navigate(-1);
    else navigate('/tenants', { replace: true });
}

export function NewTenantPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TenantTabId>(TENANT_TABS[0].id);
    const [isFormBusy, setIsFormBusy] = useState(true);
    const [submitError, setSubmitError] = useState<string | null>(null);
    return <div className="flex min-h-full flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4"><div className="flex items-center max-w-7xl mx-auto"><div className="flex items-center gap-4">
            <button type="button" onClick={() => navigateBackOrTenants(navigate)} disabled={isFormBusy} className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-500 disabled:opacity-60" aria-label="Indietro"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-2xl font-normal text-gray-800">Nuovo inquilino</h1>
        </div></div></div>
        <TenantFormProvider
            activeTab={activeTab}
            setActiveTab={(id) => setActiveTab(id as TenantTabId)}
            onCreateTenant={(data: TenantFormData) => { setSubmitError(null); return { id: createTenant(data).id }; }}
            onTenantCreated={({ id }) => navigate(`/tenants/${id}`, { state: { toast: { title: 'Successo', message: 'Creato!' } } })}
            onSubmitError={setSubmitError}
            onExitDraft={() => navigateBackOrTenants(navigate)}
            onFormBusyChange={setIsFormBusy}
        >
            <TenantFormContent mode="create" activeTab={activeTab} submitError={submitError} clearSubmitError={() => setSubmitError(null)} onCancel={() => navigateBackOrTenants(navigate)} />
        </TenantFormProvider>
    </div>;
}
