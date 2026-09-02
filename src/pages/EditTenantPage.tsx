import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { TenantEditFormProvider } from '../components/tenant-form/TenantFormProvider';
import { TenantFormContent } from '../components/tenant-form/TenantFormContent';
import { TENANT_TABS, type TenantTabId } from '../components/tenant-form/TenantFormTabs';
import { tenantRecordToFormData } from '../components/tenant-form/tenantRecordFormMapping';
import { createTenantRepository } from '../db/tenantRepository';

export function EditTenantPage() {
    const { id = '' } = useParams();
    const { account } = useAuth();
    const accountId = account?.id ?? null;
    const hydrationKey = `${accountId ?? 'missing'}:${id}`;

    return <EditTenantPageForRecord key={hydrationKey} accountId={accountId} tenantId={id} />;
}

interface EditTenantPageForRecordProps {
    accountId: string | null;
    tenantId: string;
}

function EditTenantPageForRecord({ accountId, tenantId }: EditTenantPageForRecordProps) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TenantTabId>(TENANT_TABS[0].id);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const repository = useMemo(() => accountId ? createTenantRepository({ accountId }) : null, [accountId]);
    const record = useMemo(() => repository?.getById(tenantId) ?? null, [repository, tenantId]);
    const initialState = useMemo(() => record ? tenantRecordToFormData(record) : null, [record]);

    if (!repository || !record || !initialState) return <div className="p-6">
        <p role="alert">Inquilino non trovato.</p>
        <Link to="/tenants">Torna agli inquilini</Link>
    </div>;

    const detailPath = `/tenants/${tenantId}`;
    return <div className="flex min-h-full flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4"><div className="flex items-center max-w-7xl mx-auto"><div className="flex items-center gap-4">
            <button type="button" aria-label="Indietro" disabled={busy} onClick={() => navigate(detailPath)} className="p-2 hover:bg-gray-100 rounded-md text-gray-500 disabled:opacity-60"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-2xl font-normal text-gray-800">Modifica inquilino</h1>
        </div></div></div>
        <TenantEditFormProvider
            initialState={initialState}
            entityId={tenantId}
            activeTab={activeTab}
            setActiveTab={(tab) => setActiveTab(tab as TenantTabId)}
            onUpdateTenant={(data) => repository.update(tenantId, data)}
            onTenantUpdated={() => navigate(detailPath, { replace: true })}
            onSubmitError={setSubmitError}
            onFormBusyChange={setBusy}
            onExitDraft={() => navigate(detailPath, { replace: true })}
        >
            <TenantFormContent mode="edit" activeTab={activeTab} submitError={submitError} clearSubmitError={() => setSubmitError(null)} onCancel={() => navigate(detailPath)} />
        </TenantEditFormProvider>
    </div>;
}
