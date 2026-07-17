import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Archive, CheckCircle, Edit, Mail, RotateCcw, XCircle } from 'lucide-react';
import { useLeaseDetail } from '../hooks/useLeaseDetail';
import { leaseRecordToListItem } from '../db/leaseRepository';
import { StatusToast, type StatusToastState } from '../components/ui/StatusToast';
import { Button } from '../components/ui/Button';
import { LeaseOverviewTab } from '../components/lease-detail/LeaseOverviewTab';
import { LeaseParticipantsTab } from '../components/lease-detail/LeaseParticipantsTab';
import { LeasePaymentsTab } from '../components/lease-detail/LeasePaymentsTab';
import { LeaseDocumentsTab } from '../components/lease-detail/LeaseDocumentsTab';
import { LeaseContractTab } from '../components/lease-detail/LeaseContractTab';
import { LeaseSignatureTab } from '../components/lease-detail/LeaseSignatureTab';
import { LeaseActivityTab } from '../components/lease-detail/LeaseActivityTab';
import { LeaseLifecycleModal, type LeaseLifecycleOperation } from '../components/lease-detail/LeaseLifecycleModal';
import { LeaseEmailModal } from '../components/lease-detail/LeaseEmailModal';
import { LeaseCsvModal } from '../components/lease-detail/LeaseCsvModal';
import { formatDate, leaseTitle } from '../components/lease-detail/shared';

const tabs = [
    ['overview', 'Panoramica'],
    ['payments', 'Pagamenti'],
    ['participants', 'Partecipanti'],
    ['documents', 'Documenti'],
    ['contract', 'Contratto'],
    ['signature', 'Firma locale'],
    ['activity', 'Attività'],
] as const;

export function LeaseDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { detail } = useLeaseDetail(id);
    const [tab, setTab] = useState<(typeof tabs)[number][0]>('overview');
    const [lifecycleOperation, setLifecycleOperation] = useState<LeaseLifecycleOperation | null>(null);
    const [emailOpen, setEmailOpen] = useState(false);
    const [csvOpen, setCsvOpen] = useState(false);
    const [toast, setToast] = useState<StatusToastState | null>(() => {
        const state = location.state as { toast?: StatusToastState } | null;
        return state?.toast || null;
    });

    const title = useMemo(() => detail ? leaseTitle(detail) : 'Locazione', [detail]);
    const notify = (variant: 'success' | 'error', message: string) => setToast({ variant, title: variant === 'success' ? 'Successo' : 'Errore', message });

    if (!detail) {
        return (
            <div className="mx-auto max-w-4xl p-6">
                <h1 className="text-2xl font-semibold text-gray-900">Locazione non trovata</h1>
                <Link to="/leases" className="mt-4 inline-flex text-blue-700 hover:underline">Torna alle locazioni</Link>
            </div>
        );
    }

    const { lease } = detail;
    const canEdit = !lease.archived && !lease.signatureProcess && lease.status !== 'terminata';
    const canActivate = !lease.archived && lease.status === 'inattiva';
    const canDeactivate = !lease.archived && lease.status === 'attiva';
    const canTerminate = !lease.archived && lease.status !== 'terminata';
    const listItem = leaseRecordToListItem(lease);

    return (
        <div className="mx-auto max-w-7xl p-4 md:p-6">
            <div className="mb-5 flex flex-col gap-4 border-b border-gray-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <Link to="/leases" className="text-sm text-blue-700 hover:underline">Locazioni</Link>
                    <h1 className="mt-1 text-2xl font-semibold text-gray-900">{title}</h1>
                    <p className="text-sm text-gray-500">{lease.leaseTypeLabel} - {formatDate(lease.startDate)} / {formatDate(lease.endDate)}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">{detail.temporalStatus}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">{lease.status}</span>
                        {lease.archived && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">Archiviata</span>}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {canEdit && <Button type="button" variant="secondary" icon={Edit} onClick={() => navigate(`/leases/${lease.id}/edit`)}>Modifica</Button>}
                    {canActivate && <Button type="button" variant="secondary" icon={CheckCircle} onClick={() => setLifecycleOperation('activate')}>Attiva</Button>}
                    {canDeactivate && <Button type="button" variant="secondary" icon={XCircle} onClick={() => setLifecycleOperation('deactivate')}>Disattiva</Button>}
                    {canTerminate && <Button type="button" variant="secondary" onClick={() => setLifecycleOperation('terminate')}>Termina</Button>}
                    {lease.archived
                        ? <Button type="button" variant="secondary" icon={RotateCcw} onClick={() => setLifecycleOperation('restore')}>Ripristina</Button>
                        : <Button type="button" variant="secondary" icon={Archive} onClick={() => setLifecycleOperation('archive')}>Archivia</Button>}
                    <Button type="button" variant="secondary" icon={Mail} onClick={() => setEmailOpen(true)}>Email</Button>
                    <Button type="button" variant="secondary" onClick={() => setCsvOpen(true)}>CSV</Button>
                </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200">
                {tabs.map(([key, label]) => (
                    <button key={key} type="button" onClick={() => setTab(key)} className={`border-b-2 px-3 py-2 text-sm ${tab === key ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500'}`}>{label}</button>
                ))}
            </div>

            {tab === 'overview' && <LeaseOverviewTab detail={detail} notify={notify} />}
            {tab === 'payments' && <LeasePaymentsTab detail={detail} notify={notify} />}
            {tab === 'participants' && <LeaseParticipantsTab detail={detail} />}
            {tab === 'documents' && <LeaseDocumentsTab detail={detail} notify={notify} />}
            {tab === 'contract' && <LeaseContractTab detail={detail} notify={notify} />}
            {tab === 'signature' && <LeaseSignatureTab detail={detail} notify={notify} />}
            {tab === 'activity' && <LeaseActivityTab detail={detail} />}

            <LeaseLifecycleModal isOpen={Boolean(lifecycleOperation)} operation={lifecycleOperation} lease={lease} title={title} onClose={() => setLifecycleOperation(null)} onSuccess={(message) => notify('success', message)} onError={(message) => notify('error', message)} />
            <LeaseEmailModal isOpen={emailOpen} leaseIds={[lease.id]} defaultSubject={`Locazione ${title}`} defaultBody={`Buongiorno,\n\n`} onClose={() => setEmailOpen(false)} onSuccess={(message) => notify('success', message)} onError={(message) => notify('error', message)} />
            <LeaseCsvModal isOpen={csvOpen} leases={[listItem]} onClose={() => setCsvOpen(false)} onSuccess={(message) => notify('success', message)} />
            <StatusToast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
}
