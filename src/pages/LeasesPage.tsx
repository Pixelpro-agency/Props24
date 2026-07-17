import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useLeasesDb } from '../hooks/useLeasesDb';
import { LEASE_TYPES } from '../landlord/leases/data/leaseTypes';
import { getJsonDb, subscribeJsonDb } from '../db/jsonDb';
import { StatusToast, type StatusToastState } from '../components/ui/StatusToast';
import { LeaseLifecycleModal, type LeaseLifecycleOperation } from '../components/lease-detail/LeaseLifecycleModal';
import { LeaseBulkActionModal, type LeaseBulkOperation } from '../components/lease-detail/LeaseBulkActionModal';
import { LeaseEmailModal } from '../components/lease-detail/LeaseEmailModal';
import { LeaseCsvModal } from '../components/lease-detail/LeaseCsvModal';

const statusLabels = {
    current: 'In corso',
    future: 'Futura',
    historical: 'Terminata',
    inactive: 'Inattiva',
    archived: 'Archiviata',
};

function formatDate(value: string): string {
    if (!value) return '-';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
}

function currency(value: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
}

function activeProperties() {
    return getJsonDb().properties.filter((property) => !property.archived);
}

export function LeasesPage() {
    const location = useLocation();
    const { leases } = useLeasesDb();
    const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
    const [query, setQuery] = useState('');
    const [propertyId, setPropertyId] = useState('');
    const [leaseType, setLeaseType] = useState('');
    const [temporalStatus, setTemporalStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [rowLifecycle, setRowLifecycle] = useState<{ operation: LeaseLifecycleOperation; leaseId: string } | null>(null);
    const [bulkOperation, setBulkOperation] = useState<LeaseBulkOperation | null>(null);
    const [emailLeaseIds, setEmailLeaseIds] = useState<string[] | null>(null);
    const [csvLeases, setCsvLeases] = useState<typeof leases | null>(null);
    const [properties, setProperties] = useState(() => activeProperties());
    const [toast, setToast] = useState<StatusToastState | null>(() => {
        const state = location.state as { toast?: StatusToastState } | null;
        return state?.toast || null;
    });

    useEffect(() => {
        const refresh = () => setProperties(activeProperties());
        refresh();
        return subscribeJsonDb(refresh);
    }, []);

    const typeOptions = useMemo(() => {
        const options = new Map(LEASE_TYPES.map((type) => [type.id, type.label]));
        leases.forEach((lease) => {
            if (lease.leaseTypeValue && !options.has(lease.leaseTypeValue)) options.set(lease.leaseTypeValue, lease.leaseTypeLabel);
        });
        return Array.from(options, ([id, label]) => ({ id, label }));
    }, [leases]);

    const filteredLeases = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return leases
            .filter((lease) => activeTab === 'archive' ? lease.archived : !lease.archived)
            .filter((lease) => !propertyId || lease.propertyId === propertyId)
            .filter((lease) => !leaseType || lease.leaseTypeValue === leaseType)
            .filter((lease) => !temporalStatus || lease.temporalStatus === temporalStatus)
            .filter((lease) => !dateFrom || lease.startDate >= dateFrom)
            .filter((lease) => !dateTo || lease.startDate <= dateTo)
            .filter((lease) => {
                if (!normalizedQuery) return true;
                return [
                    lease.propertyTitle,
                    lease.propertyAddress,
                    lease.tenantName,
                    lease.tenantEmail || '',
                    lease.leaseTypeLabel,
                    lease.identificativo || '',
                    lease.numeroRegistrazione || '',
                ].join(' ').toLowerCase().includes(normalizedQuery);
            });
    }, [activeTab, dateFrom, dateTo, leaseType, leases, propertyId, query, temporalStatus]);

    useEffect(() => {
        const visibleIds = new Set(filteredLeases.map((lease) => lease.id));
        setSelectedIds((current) => current.filter((id) => visibleIds.has(id)));
    }, [filteredLeases]);

    const selectedLeases = filteredLeases.filter((lease) => selectedIds.includes(lease.id));
    const allSelected = filteredLeases.length > 0 && filteredLeases.every((lease) => selectedIds.includes(lease.id));

    const notify = (variant: 'success' | 'error', message: string) => setToast({ variant, title: variant === 'success' ? 'Successo' : 'Errore', message });
    const rowLeaseRecord = rowLifecycle ? getJsonDb().leases.find((lease) => lease.id === rowLifecycle.leaseId) || null : null;
    const selectedForAction = selectedLeases.length > 0 ? selectedLeases : filteredLeases;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-[344px] max-w-full px-2 py-4 sm:px-4 sm:py-6 lg:px-6"
        >
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Locazioni</h1>
                    <p className="text-sm text-gray-500">Elenco collegato al database locale props24.</p>
                </div>
                <Link to="/leases/new" className="inline-flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                    <Plus className="h-4 w-4" /> Nuova locazione
                </Link>
            </div>

            <div className="mb-4 flex gap-2 border-b border-gray-200">
                <button type="button" onClick={() => setActiveTab('active')} className={`border-b-2 px-4 py-2 text-sm font-medium ${activeTab === 'active' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500'}`}>
                    Locazioni
                </button>
                <button type="button" onClick={() => setActiveTab('archive')} className={`border-b-2 px-4 py-2 text-sm font-medium ${activeTab === 'archive' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500'}`}>
                    Archivio
                </button>
            </div>

            <div className="mb-4 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-6">
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Cerca" />
                <select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm">
                    <option value="">Tutte le proprietà</option>
                    {properties.map((property) => <option key={property.id} value={property.id}>{property.formData.PropertyTitle || 'Unità senza nome'}</option>)}
                </select>
                <select value={leaseType} onChange={(event) => setLeaseType(event.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm">
                    <option value="">Tutti i tipi</option>
                    {typeOptions.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                </select>
                <select value={temporalStatus} onChange={(event) => setTemporalStatus(event.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm">
                    <option value="">Tutti gli stati</option>
                    <option value="current">In corso</option>
                    <option value="future">Futura</option>
                    <option value="historical">Terminata</option>
                    <option value="inactive">Inattiva</option>
                    <option value="archived">Archiviata</option>
                </select>
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm" aria-label="Data da" />
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm" aria-label="Data a" />
            </div>

            {selectedIds.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded border border-green-200 bg-green-50 p-3 text-sm">
                    <span className="font-medium">{selectedIds.length} selezionate</span>
                    <button type="button" onClick={() => setBulkOperation('activate')} className="rounded border bg-white px-3 py-1">Attiva</button>
                    <button type="button" onClick={() => setBulkOperation('deactivate')} className="rounded border bg-white px-3 py-1">Disattiva</button>
                    <button type="button" onClick={() => setBulkOperation('archive')} className="rounded border bg-white px-3 py-1">Archivia</button>
                    <button type="button" onClick={() => setBulkOperation('restore')} className="rounded border bg-white px-3 py-1">Ripristina</button>
                    <button type="button" onClick={() => setBulkOperation('delete')} className="rounded border bg-white px-3 py-1 text-red-700">Elimina</button>
                    <button type="button" onClick={() => setEmailLeaseIds(selectedIds)} className="rounded border bg-white px-3 py-1">Prepara email</button>
                    <button type="button" onClick={() => setCsvLeases(selectedLeases)} className="rounded border bg-white px-3 py-1">Esporta CSV</button>
                </div>
            )}
            <div className="mb-4 flex justify-end">
                <button type="button" onClick={() => setCsvLeases(selectedForAction)} className="rounded border bg-white px-3 py-2 text-sm">Esporta risultati CSV</button>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                {filteredLeases.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                        <p className="font-medium text-gray-700">Nessuna locazione trovata.</p>
                        <Link to="/leases/new" className="mt-4 inline-flex rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Crea locazione</Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={(event) => {
                                                if (event.target.checked) {
                                                    setSelectedIds(filteredLeases.map((lease) => lease.id));
                                                } else {
                                                    setSelectedIds([]);
                                                }
                                            }}
                                            aria-label="Seleziona tutte le locazioni filtrate"
                                        />
                                    </th>
                                    <th className="px-4 py-3">Proprietà</th>
                                    <th className="px-4 py-3">Indirizzo</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Inquilino</th>
                                    <th className="px-4 py-3">Canone</th>
                                    <th className="px-4 py-3">Spese</th>
                                    <th className="px-4 py-3">Importo</th>
                                    <th className="px-4 py-3">Inizio</th>
                                    <th className="px-4 py-3">Fine</th>
                                    <th className="px-4 py-3">Stato</th>
                                    <th className="px-4 py-3">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLeases.map((lease) => (
                                    <tr key={lease.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(lease.id)}
                                                onChange={(event) => {
                                                    setSelectedIds((current) => event.target.checked
                                                        ? Array.from(new Set([...current, lease.id]))
                                                        : current.filter((id) => id !== lease.id));
                                                }}
                                                aria-label={`Seleziona locazione ${lease.identificativo || lease.id}`}
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            <Link to={`/properties/units/${lease.propertyId}`} className="text-blue-700 hover:underline">{lease.propertyTitle}</Link>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{lease.propertyAddress || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{lease.leaseTypeLabel}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {lease.tenantIds[0] ? <Link to={`/tenants/${lease.tenantIds[0]}`} className="text-blue-700 hover:underline">{lease.tenantName}</Link> : lease.tenantName}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{currency(lease.rentHC)}</td>
                                        <td className="px-4 py-3 text-gray-600">{currency(lease.maintenance)}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{currency(lease.periodicAmount)}</td>
                                        <td className="px-4 py-3 text-gray-600">{formatDate(lease.startDate)}</td>
                                        <td className="px-4 py-3 text-gray-600">{formatDate(lease.endDate)}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">{statusLabels[lease.temporalStatus]}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link to={`/leases/${lease.id}`} className="text-blue-700 hover:underline">Visualizza</Link>
                                                {!lease.archived && lease.temporalStatus !== 'historical' && <Link to={`/leases/${lease.id}/edit`} className="text-blue-700 hover:underline">Modifica</Link>}
                                                {!lease.archived && lease.temporalStatus === 'inactive' && <button type="button" onClick={() => setRowLifecycle({ operation: 'activate', leaseId: lease.id })} className="text-blue-700 hover:underline">Attiva</button>}
                                                {!lease.archived && lease.temporalStatus !== 'historical' && lease.temporalStatus !== 'inactive' && <button type="button" onClick={() => setRowLifecycle({ operation: 'deactivate', leaseId: lease.id })} className="text-blue-700 hover:underline">Disattiva</button>}
                                                {!lease.archived && lease.temporalStatus !== 'historical' && <button type="button" onClick={() => setRowLifecycle({ operation: 'terminate', leaseId: lease.id })} className="text-blue-700 hover:underline">Termina</button>}
                                                {lease.archived
                                                    ? <button type="button" onClick={() => setRowLifecycle({ operation: 'restore', leaseId: lease.id })} className="text-blue-700 hover:underline">Ripristina</button>
                                                    : <button type="button" onClick={() => setRowLifecycle({ operation: 'archive', leaseId: lease.id })} className="text-blue-700 hover:underline">Archivia</button>}
                                                <button type="button" onClick={() => setRowLifecycle({ operation: 'delete', leaseId: lease.id })} className="text-red-700 hover:underline">Elimina</button>
                                                <button type="button" onClick={() => setEmailLeaseIds([lease.id])} className="text-blue-700 hover:underline">Email</button>
                                                <button type="button" onClick={() => setCsvLeases([lease])} className="text-blue-700 hover:underline">CSV</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <LeaseLifecycleModal
                isOpen={Boolean(rowLifecycle)}
                operation={rowLifecycle?.operation || null}
                lease={rowLeaseRecord}
                title={filteredLeases.find((lease) => lease.id === rowLifecycle?.leaseId)?.propertyTitle || 'Locazione'}
                onClose={() => setRowLifecycle(null)}
                onSuccess={(message) => notify('success', message)}
                onError={(message) => notify('error', message)}
            />
            <LeaseBulkActionModal
                isOpen={Boolean(bulkOperation)}
                operation={bulkOperation}
                leases={selectedLeases}
                onClose={() => setBulkOperation(null)}
                onSuccess={(message) => { setSelectedIds([]); notify('success', message); }}
                onError={(message) => notify('error', message)}
            />
            <LeaseEmailModal
                isOpen={Boolean(emailLeaseIds)}
                leaseIds={emailLeaseIds || []}
                defaultSubject="Locazioni Props24"
                defaultBody="Buongiorno,\n\n"
                onClose={() => setEmailLeaseIds(null)}
                onSuccess={(message) => notify('success', message)}
                onError={(message) => notify('error', message)}
            />
            <LeaseCsvModal
                isOpen={Boolean(csvLeases)}
                leases={csvLeases || []}
                onClose={() => setCsvLeases(null)}
                onSuccess={(message) => notify('success', message)}
            />
            <StatusToast toast={toast} onClose={() => setToast(null)} />
        </motion.div>
    );
}
