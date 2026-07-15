import { useState, useCallback } from 'react';

export type LeaseModalName =
    | 'export'
    | 'download'
    | 'emailNotification'
    | 'confirmDelete'
    | 'confirmDeactivate'
    | 'confirmActivate'
    | 'confirmArchive';

/**
 * Manages modal visibility and bulk action operations for Leases.
 */
export function useLeaseActions(
    selectedCount: number,
    clearSelection: () => void,
) {
    const [openModal, setOpenModal] = useState<LeaseModalName | null>(null);
    const [activeLeaseId, setActiveLeaseId] = useState<string | undefined>(undefined);

    const openModalByName = useCallback((name: LeaseModalName, leaseId?: string) => {
        setOpenModal(name);
        if (leaseId) {
            setActiveLeaseId(leaseId);
        }
    }, []);

    const closeModal = useCallback(() => {
        setOpenModal(null);
        setActiveLeaseId(undefined);
    }, []);

    const isModalOpen = useCallback(
        (name: LeaseModalName) => openModal === name,
        [openModal],
    );

    // ── Bulk Handlers ─────────────────────────────────────────────────────────

    const handleDelete = useCallback(() => {
        if (window.confirm(`Conferma l'eliminazione delle ${selectedCount} locazioni selezionate.`)) {
            console.log(`Deleted ${selectedCount} leases`);
            clearSelection();
        }
    }, [selectedCount, clearSelection]);

    const handleDeactivate = useCallback(() => {
        if (window.confirm(`Conferma per disattivare le ${selectedCount} locazioni selezionate.`)) {
            console.log(`Deactivated ${selectedCount} leases`);
            clearSelection();
        }
    }, [selectedCount, clearSelection]);

    const handleActivate = useCallback(() => {
        if (window.confirm(`Conferma per attivare le ${selectedCount} locazioni selezionate.`)) {
            console.log(`Activated ${selectedCount} leases`);
            clearSelection();
        }
    }, [selectedCount, clearSelection]);

    const handleArchive = useCallback(() => {
        if (window.confirm(`Conferma l'archiviazione delle ${selectedCount} locazioni selezionate.`)) {
            console.log(`Archived ${selectedCount} leases`);
            clearSelection();
        }
    }, [selectedCount, clearSelection]);

    const handleMessage = useCallback(() => {
        setOpenModal('emailNotification');
    }, []);

    const handleExport = useCallback((columns: string[]) => {
        const exportUrl = `/landlord/leases/?action=exportCSV&columns=${columns.join(',')}`;
        console.log('Export URL:', exportUrl);
        // Trigger download physically in real app
    }, []);

    return {
        openModal,
        openModalByName,
        closeModal,
        isModalOpen,
        activeLeaseId,
        handleDelete,
        handleDeactivate,
        handleActivate,
        handleArchive,
        handleMessage,
        handleExport,
    };
}
