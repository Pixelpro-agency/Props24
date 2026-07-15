import { useState, useCallback } from 'react';

export type ModalName =
    | 'export'
    | 'download'
    | 'importError'
    | 'terminateLease'
    | 'emailNotification';

/**
 * Hook that manages modal visibility and bulk action handlers
 * for the tenants page.
 */
export function useTenantActions(
    selectedCount: number,
    clearSelection: () => void,
) {
    const [openModal, setOpenModal] = useState<ModalName | null>(null);

    const openModalByName = useCallback((name: ModalName) => {
        setOpenModal(name);
    }, []);

    const closeModal = useCallback(() => {
        setOpenModal(null);
    }, []);

    const isModalOpen = useCallback(
        (name: ModalName) => openModal === name,
        [openModal],
    );

    // Bulk action handlers
    const handleDelete = useCallback(() => {
        if (window.confirm(`Sei sicuro di voler eliminare ${selectedCount} inquilini selezionati?`)) {
            console.log(`Deleted ${selectedCount} tenants`);
            clearSelection();
        }
    }, [selectedCount, clearSelection]);

    const handleArchive = useCallback(() => {
        if (window.confirm(`Conferma prima di archiviare ${selectedCount} locatari selezionati`)) {
            console.log(`Archived ${selectedCount} tenants`);
            clearSelection();
        }
    }, [selectedCount, clearSelection]);

    const handleMessage = useCallback(() => {
        setOpenModal('emailNotification');
    }, []);

    const handleExport = useCallback((columns: string[]) => {
        const exportUrl = `/landlord/tenants/?action=exportHTML&columns=${columns.join(',')}`;
        console.log('Export URL:', exportUrl);
    }, []);

    return {
        openModal,
        openModalByName,
        closeModal,
        isModalOpen,
        handleDelete,
        handleArchive,
        handleMessage,
        handleExport,
    };
}
