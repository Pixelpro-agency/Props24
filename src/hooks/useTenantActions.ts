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
export function useTenantActions() {
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
        handleMessage,
        handleExport,
    };
}
