import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import type { VisibilityState } from '@tanstack/react-table';

import { PageHeader } from '../components/tenants/PageHeader';
import { FilterPanel } from '../components/tenants/FilterPanel';
import { TableToolbar } from '../components/tenants/TableToolbar';
import { DataTable } from '../components/tenants/DataTable';
import { EmptyState } from '../components/tenants/EmptyState';
import { FloatingActions } from '../components/tenants/FloatingActions';
import { ExportModal } from '../components/tenants/ExportModal';
import { DownloadModal } from '../components/tenants/DownloadModal';
import { ImportErrorModal } from '../components/tenants/ImportErrorModal';
import { TerminateLeaseModal } from '../components/tenants/TerminateLeaseModal';
import { EmailNotificationModal } from '../components/tenants/EmailNotificationModal';
import { FeedbackBox } from '../components/tenants/FeedbackBox';
import { StatusToast, type StatusToastState } from '../components/ui/StatusToast';

import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTableSelection } from '../hooks/useTableSelection';
import { useTenantFilters, useTenantRecipients } from '../hooks/useTenantFilters';
import { useTenantActions } from '../hooks/useTenantActions';
import { createTenantRepository, sendTenantInvite } from '../db/tenantRepository';
import { useAuth } from '../auth/AuthContext';
import { TenantActionModal, type TenantActionOperation } from '../components/tenants/TenantActionModal';



// Opzioni locali usate dai modali ancora non collegati.
const leaseOptions = [
    { value: 'lease-001', label: 'Appartamento Centrale - dal 01/01/2025' },
    { value: 'lease-002', label: 'Ufficio Duomo - dal 15/03/2024' },
];

export function TenantsPage() {
    const navigate = useNavigate();
    const { account } = useAuth();
    const repository = useMemo(() => account?.id ? createTenantRepository({ accountId: account.id }) : null, [account?.id]);
    const [pendingAction, setPendingAction] = useState<{ operation: TenantActionOperation; mode: 'single' | 'bulk'; ids: string[] } | null>(null);

    // Tab state
    const [activeTab, setActiveTab] = useState('active');
    const [toast, setToast] = useState<StatusToastState | null>(null);
    const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);

    // Filtering (hook)
    const { filters, setFilters, filteredData, updateQuery } = useTenantFilters({ activeTab });

    // Table state
    const [pageSize, setPageSize] = useState(100);
    const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(
        'tenants-column-visibility',
        {},
    );

    // Row selection
    const { rowSelection, setRowSelection, selectedCount, selectedIds, clearSelection } = useTableSelection();

    // Bulk actions & modals (hook)
    const {
        isModalOpen,
        openModalByName,
        closeModal,
        handleMessage,
        handleExport,
    } = useTenantActions();

    const requestSingleAction = useCallback((operation: TenantActionOperation, tenantId: string) => setPendingAction({ operation, mode: 'single', ids: [tenantId] }), []);
    const requestBulkAction = useCallback((operation: TenantActionOperation) => setPendingAction({ operation, mode: 'bulk', ids: [...selectedIds] }), [selectedIds]);
    const confirmAction = useCallback(() => {
        if (!pendingAction) return;
        if (!repository) { setToast({ variant: 'error', title: 'Errore', message: 'Database locale non disponibile: nessun account autenticato.' }); return; }
        try {
            const { operation, mode, ids } = pendingAction;
            if (mode === 'bulk') { if (operation === 'archive') repository.archiveMany(ids); else if (operation === 'restore') repository.restoreMany(ids); else repository.deleteMany(ids); }
            else if (operation === 'archive') repository.archive(ids[0]); else if (operation === 'restore') repository.restore(ids[0]); else repository.delete(ids[0]);
            setPendingAction(null); clearSelection(); setToast({ title: 'Operazione completata', message: `${ids.length} ${ids.length === 1 ? 'inquilino aggiornato' : 'inquilini aggiornati'}.` });
        } catch (error) { setToast({ variant: 'error', title: 'Errore', message: error instanceof Error ? error.message : 'Operazione non riuscita.' }); }
    }, [clearSelection, pendingAction, repository]);

    // Email recipients from selection
    const emailRecipients = useTenantRecipients(selectedIds, filteredData);

    // Tab change clears selection
    const handleTabChange = useCallback(
        (tab: string) => {
            setActiveTab(tab);
            clearSelection();
        },
        [clearSelection],
    );

    const handleSendInvite = useCallback((tenantId: string) => {
        if (sendingInviteId) return;
        setSendingInviteId(tenantId);
        try {
            // TODO: collegare questa azione a un servizio backend/email reale.
            // Per ora viene registrato soltanto lo stato locale dell'invito.
            sendTenantInvite(tenantId);
            setToast({
                title: 'Invito registrato',
                message: "Lo stato dell'invito è stato aggiornato localmente. L'invio dell'email non è ancora disponibile.",
            });
        } catch (error) {
            setToast({
                variant: 'error',
                title: 'Errore',
                message: error instanceof Error ? error.message : "L'invito non è stato inviato.",
            });
        } finally {
            setSendingInviteId(null);
        }
    }, [sendingInviteId]);

    return (
        <div className="max-w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6 min-h-[344px]">
            <StatusToast toast={toast} onClose={() => setToast(null)} />


            {/* Page Header */}
            <PageHeader activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Filter Bar */}
            <FilterPanel filters={filters} onFilterChange={(next) => { setFilters(next); clearSelection(); }} />

            {/* Table container */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {/* Toolbar */}
                <TableToolbar
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                    searchQuery={filters.query}
                    onSearchChange={(query) => { updateQuery(query); clearSelection(); }}
                    onExportClick={() => openModalByName('export')}
                />

                {/* Table or Empty State */}
                {filteredData.length > 0 ? (
                    <DataTable
                        data={filteredData}
                        pageSize={pageSize}
                        columnVisibility={columnVisibility}
                        onColumnVisibilityChange={setColumnVisibility}
                        rowSelection={rowSelection}
                        onRowSelectionChange={setRowSelection}
                        onSendInvite={handleSendInvite}
                        sendingInviteId={sendingInviteId}
                        onRequestAction={requestSingleAction}
                    />
                ) : (
                    <EmptyState onCreateClick={() => navigate('/tenants/new')} />
                )}
            </div>

            {/* Floating actions */}
            <FloatingActions
                selectedCount={selectedCount}
                view={activeTab === 'archived' ? 'archived' : 'active'}
                onDelete={() => requestBulkAction('delete')}
                onArchive={() => requestBulkAction('archive')}
                onRestore={() => requestBulkAction('restore')}
                onMessage={handleMessage}
            />

            {/* Feedback */}
            <FeedbackBox />

            {/* === Modals === */}
            <ExportModal
                isOpen={isModalOpen('export')}
                onClose={closeModal}
                onConfirm={handleExport}
            />

            <DownloadModal
                isOpen={isModalOpen('download')}
                onClose={closeModal}
            />

            <ImportErrorModal
                isOpen={isModalOpen('importError')}
                onClose={closeModal}
            />

            <TerminateLeaseModal
                isOpen={isModalOpen('terminateLease')}
                onClose={closeModal}
                leaseOptions={leaseOptions}
            />

            <EmailNotificationModal
                isOpen={isModalOpen('emailNotification')}
                onClose={closeModal}
                recipients={emailRecipients}
            />
            <TenantActionModal isOpen={pendingAction !== null} operation={pendingAction?.operation ?? 'archive'} count={pendingAction?.ids.length ?? 0} onClose={() => setPendingAction(null)} onConfirm={confirmAction} />
        </div>
    );
}
