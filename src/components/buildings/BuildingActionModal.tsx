import { Modal } from '../property-form/ui/Modal';
import { Button } from '../ui/Button';

export type BuildingActionOperation = 'archive' | 'restore' | 'delete';

interface BuildingActionModalProps {
    isOpen: boolean;
    operation: BuildingActionOperation;
    count: number;
    onClose: () => void;
    onConfirm: () => void;
}

const labels: Record<BuildingActionOperation, { singular: string; plural: string }> = {
    archive: { singular: 'Archivia edificio', plural: 'Archivia edifici' },
    restore: { singular: 'Ripristina edificio', plural: 'Ripristina edifici' },
    delete: { singular: 'Elimina edificio', plural: 'Elimina edifici' },
};

export function BuildingActionModal({
    isOpen,
    operation,
    count,
    onClose,
    onConfirm,
}: BuildingActionModalProps) {
    const title = count === 1 ? labels[operation].singular : labels[operation].plural;
    const subject = count === 1 ? 'questo edificio' : `questi ${count} edifici`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            maxWidth="sm"
            footer={(
                <>
                    <Button variant="ghost" size="sm" onClick={onClose}>Annulla</Button>
                    <Button variant={operation === 'delete' ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
                        Conferma
                    </Button>
                </>
            )}
        >
            <p className="text-sm text-gray-600">
                Confermi di voler {operation === 'archive' ? 'archiviare' : operation === 'restore' ? 'ripristinare' : 'eliminare'} {subject}?
            </p>
            {operation === 'delete' && (
                <p className="mt-3 text-sm font-medium text-red-700">
                    L&apos;eliminazione è definitiva e può essere bloccata se sono presenti unità collegate.
                </p>
            )}
        </Modal>
    );
}
