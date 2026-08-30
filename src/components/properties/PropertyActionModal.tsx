import { Modal } from '../property-form/ui/Modal';
import { Button } from '../ui/Button';

export type PropertyActionOperation = 'archive' | 'restore' | 'delete';

interface PropertyActionModalProps {
    isOpen: boolean;
    operation: PropertyActionOperation;
    count: number;
    onClose(): void;
    onConfirm(): void;
}

const titles: Record<PropertyActionOperation, string> = {
    archive: 'Archivia unità',
    restore: 'Ripristina unità',
    delete: 'Elimina unità',
};

export function PropertyActionModal({ isOpen, operation, count, onClose, onConfirm }: PropertyActionModalProps) {
    const verb = operation === 'archive' ? 'archiviare' : operation === 'restore' ? 'ripristinare' : 'eliminare';
    const subject = count === 1 ? 'questa unità' : `queste ${count} unità`;
    return <Modal isOpen={isOpen} onClose={onClose} title={titles[operation]} maxWidth="sm" footer={<>
        <Button variant="ghost" size="sm" onClick={onClose}>Annulla</Button>
        <Button variant={operation === 'delete' ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>Conferma</Button>
    </>}>
        <p className="text-sm text-gray-600">Confermi di voler {verb} {subject}?</p>
        {operation === 'delete' ? <p className="mt-3 text-sm font-medium text-red-700">L&apos;eliminazione è definitiva e può essere bloccata da locazioni o pagamenti collegati, anche storici. In una selezione multipla, in caso di blocco non viene eliminata alcuna unità.</p> : null}
    </Modal>;
}
