import { useState } from 'react';
import { activateLeases, archiveLeases, deactivateLeases, deleteLeases, restoreLeases, type LeaseListItem } from '../../db/leaseRepository';
import { Modal } from '../property-form/ui/Modal';
import { Button } from '../ui/Button';
import { errorMessage } from './shared';

export type LeaseBulkOperation = 'activate' | 'deactivate' | 'archive' | 'restore' | 'delete';

interface Props {
    isOpen: boolean;
    operation: LeaseBulkOperation | null;
    leases: LeaseListItem[];
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

const labels: Record<LeaseBulkOperation, string> = {
    activate: 'Attiva locazioni',
    deactivate: 'Disattiva locazioni',
    archive: 'Archivia locazioni',
    restore: 'Ripristina locazioni',
    delete: 'Elimina locazioni',
};

export function LeaseBulkActionModal({ isOpen, operation, leases, onClose, onSuccess, onError }: Props) {
    const [saving, setSaving] = useState(false);
    const [localError, setLocalError] = useState('');
    if (!operation) return null;
    const submit = () => {
        setSaving(true);
        setLocalError('');
        try {
            const ids = leases.map((lease) => lease.id);
            if (operation === 'activate') activateLeases(ids);
            if (operation === 'deactivate') deactivateLeases(ids);
            if (operation === 'archive') archiveLeases(ids);
            if (operation === 'restore') restoreLeases(ids);
            if (operation === 'delete') deleteLeases(ids);
            onSuccess(`${labels[operation]} completata.`);
            onClose();
        } catch (error) {
            const message = errorMessage(error);
            setLocalError(message);
            onError(message);
        } finally {
            setSaving(false);
        }
    };
    return (
        <Modal isOpen={isOpen} onClose={saving ? () => undefined : onClose} title={labels[operation]} maxWidth="2xl" footer={<><Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Annulla</Button><Button type="button" variant={operation === 'delete' ? 'danger' : 'primary'} onClick={submit} loading={saving}>Conferma</Button></>}>
            <div className="space-y-3 text-sm">
                <p>{leases.length} locazioni selezionate. L'operazione è atomica: se una locazione fallisce, nessuna viene modificata.</p>
                {operation === 'delete' && <p className="text-red-700">Eliminazione definitiva. Le locazioni con pagamenti, documenti o firme verranno bloccate.</p>}
                <div className="max-h-48 overflow-auto rounded border">
                    {leases.map((lease) => <p key={lease.id} className="border-b px-3 py-2">{lease.identificativo || lease.propertyTitle || lease.id}</p>)}
                </div>
                {localError && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{localError}</p>}
            </div>
        </Modal>
    );
}
