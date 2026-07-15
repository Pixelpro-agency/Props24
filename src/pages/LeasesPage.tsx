/**
 * LeasesPage — Main listing page for lease management.
 *
 * Follows the same pattern as TenantsPage / PropertiesPage:
 *   PageHeader → FilterPanel → TableContainer (Toolbar + DataTable | EmptyState)
 *   → FloatingActions → FeedbackBox → Modals
 *
 * Components are stubbed as placeholders until Tasks 3–13 flesh them out.
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { VisibilityState } from '@tanstack/react-table';

import { mockLeases } from '../data/mockLeases';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTableSelection } from '../hooks/useTableSelection';
import { useLeaseActions } from '../hooks/useLeaseActions';

import type { LeaseFilters, LeaseListItem } from '../landlord/leases/types/leaseListing.types';
import { EMPTY_LEASE_FILTERS } from '../landlord/leases/types/leaseListing.types';
import { PageHeader } from '../components/leases/PageHeader';
import { FilterPanel } from '../components/leases/FilterPanel';
import { TableToolbar } from '../components/leases/TableToolbar';
import { DataTable } from '../components/leases/DataTable';
import { EmptyState } from '../components/leases/EmptyState';
import { FloatingActions } from '../components/leases/FloatingActions';
import { ExportModal } from '../components/leases/ExportModal';
import { DownloadModal } from '../components/leases/DownloadModal';
import { EmailNotificationModal } from '../components/leases/EmailNotificationModal';
import { FeedbackBox } from '../components/leases/FeedbackBox';
import { ActionModal } from '../components/leases/ActionModal';
import { useLeaseRecipients } from '../hooks/useLeaseRecipients';

import { motion } from 'framer-motion';

// ── main page ───────────────────────────────────────────────────────────────

export function LeasesPage() {
    const navigate = useNavigate();

    // ── Tab state ────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('active');

    // ── Filters ──────────────────────────────────────────────────────────────
    const [filters, setFilters] = useState<LeaseFilters>(EMPTY_LEASE_FILTERS);

    // ── Derived data ─────────────────────────────────────────────────────────
    const filteredData: LeaseListItem[] = useMemo(() => {
        let data = mockLeases.filter((l) =>
            activeTab === 'active' ? !l.archived : l.archived,
        );

        // Free-text search
        if (filters.query) {
            const q = filters.query.toLowerCase();
            data = data.filter(
                (l) =>
                    l.propertyTitle.toLowerCase().includes(q) ||
                    (l.tenantName ?? '').toLowerCase().includes(q) ||
                    l.leaseTypeLabel.toLowerCase().includes(q),
            );
        }

        // Lease type filter
        if (filters.leaseType) {
            data = data.filter((l) => l.leaseTypeValue === filters.leaseType);
        }

        // Status filter
        if (filters.status === '1') {
            data = data.filter((l) => l.status === 'attiva');
        } else if (filters.status === '0') {
            data = data.filter((l) => l.status === 'inattivo');
        }

        return data;
    }, [activeTab, filters]);

    // ── Table state ──────────────────────────────────────────────────────────    // 2. Local State
    const [pageSize, setPageSize] = useState(() => {
        const saved = localStorage.getItem('leases-page-size');
        return saved ? Number(saved) : 100;
    });

    // 1. Table Selection Hook (must be before useLeaseActions)
    const { rowSelection, setRowSelection, selectedCount, selectedIds, clearSelection } =
        useTableSelection();

    // Modals and Actions hook
    const {
        openModalByName,
        closeModal,
        isModalOpen,
        activeLeaseId,
        handleExport,
        handleDelete,
        handleDeactivate,
        handleActivate,
        handleArchive,
    } = useLeaseActions(selectedCount, clearSelection);

    // Compute recipients based on current table selection
    const recipients = useLeaseRecipients(selectedIds, filteredData);

    const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(
        'leases-column-visibility',
        { LeaseBalance: false },
    );

    // ── Tab change clears selection ──────────────────────────────────────────
    const handleTabChange = useCallback(
        (tab: string) => {
            setActiveTab(tab);
            clearSelection();
        },
        [clearSelection],
    );

    // ── Stub handlers (will be wired to modals in Task 14) ──────────────────
    const updateQuery = useCallback(
        (q: string) => setFilters((prev) => ({ ...prev, query: q })),
        [],
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6 min-h-[344px]"
        >
            {/* Page Header */}
            <PageHeader activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Filter Panel */}
            <FilterPanel filters={filters} onFilterChange={setFilters} />

            {/* Table container */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <TableToolbar
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                    searchQuery={filters.query}
                    onSearchChange={updateQuery}
                    onExportClick={() => openModalByName('export')}
                />

                {filteredData.length > 0 ? (
                    <>
                        <DataTable
                            data={filteredData}
                            pageSize={pageSize}
                            columnVisibility={columnVisibility}
                            onColumnVisibilityChange={setColumnVisibility}
                            rowSelection={rowSelection}
                            onRowSelectionChange={setRowSelection}
                            onDownloadClick={(leaseId) => openModalByName('download', leaseId)}
                        />
                        {/* Floating Actions */}
                        <FloatingActions
                            selectedCount={selectedCount}
                            onDelete={() => openModalByName('confirmDelete')}
                            onDeactivate={() => openModalByName('confirmDeactivate')}
                            onActivate={() => openModalByName('confirmActivate')}
                            onArchive={() => openModalByName('confirmArchive')}
                            onMessage={() => openModalByName('emailNotification')}
                        />
                    </>
                ) : (
                    <EmptyState onCreateClick={() => navigate('/leases/new')} />
                )}
            </div>

            <div className="mt-8">
                <FeedbackBox />
            </div>

            {/* Modals */}
            <ExportModal
                isOpen={isModalOpen('export')}
                onClose={closeModal}
                onConfirm={handleExport}
            />
            <DownloadModal
                isOpen={isModalOpen('download')}
                onClose={closeModal}
                leaseId={activeLeaseId}
            />
            <EmailNotificationModal
                isOpen={isModalOpen('emailNotification')}
                onClose={closeModal}
                recipients={recipients}
            />

            {/* Confirmation Modals */}
            <ActionModal
                isOpen={isModalOpen('confirmDelete')}
                onClose={closeModal}
                onConfirm={handleDelete}
                title="Attenzione"
                message="Conferma la eliminazione delle locazioni selezionate."
                variant="danger"
            />
            <ActionModal
                isOpen={isModalOpen('confirmDeactivate')}
                onClose={closeModal}
                onConfirm={handleDeactivate}
                title="Attenzione"
                message="Conferma per disattivare le locazioni selezionate."
                variant="warning"
            />
            <ActionModal
                isOpen={isModalOpen('confirmActivate')}
                onClose={closeModal}
                onConfirm={handleActivate}
                title="Attenzione"
                message="Conferma per attivare le locazioni selezionate."
                variant="primary"
            />
            <ActionModal
                isOpen={isModalOpen('confirmArchive')}
                onClose={closeModal}
                onConfirm={handleArchive}
                title="Attenzione"
                message="Conferma l'archiviazione delle locazioni selezionate."
                variant="warning"
            />
        </motion.div>
    );
}
