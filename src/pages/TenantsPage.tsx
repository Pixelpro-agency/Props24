import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { sendTenantInvite } from '../db/tenantRepository';



// Opzioni locali usate dai modali ancora non collegati.
const leaseOptions = [
    { value: 'lease-001', label: 'Appartamento Centrale - dal 01/01/2025' },
    { value: 'lease-002', label: 'Ufficio Duomo - dal 15/03/2024' },
];

export function TenantsPage() {
    const navigate = useNavigate();

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
        handleDelete,
        handleArchive,
        handleMessage,
        handleExport,
    } = useTenantActions(selectedCount, clearSelection);

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
            sendTenantInvite(tenantId);
            setToast({
                title: 'Successo',
                message: "L'invito è stato inviato.\nChiedi al tuo locatario (inquilino) di leggere l'email e cliccare sul link di invito per accettarlo.",
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
            <FilterPanel filters={filters} onFilterChange={setFilters} />

            {/* Table container */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {/* Toolbar */}
                <TableToolbar
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                    searchQuery={filters.query}
                    onSearchChange={updateQuery}
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
                    />
                ) : (
                    <EmptyState onCreateClick={() => navigate('/tenants/new')} />
                )}
            </div>

            {/* Floating actions */}
            <FloatingActions
                selectedCount={selectedCount}
                onDelete={handleDelete}
                onArchive={handleArchive}
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
        </div>
    );
}
