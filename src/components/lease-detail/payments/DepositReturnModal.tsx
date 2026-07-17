import { useEffect, useState } from 'react';
import { registerDepositReturn } from '../../../db/paymentRepository';
import { Modal } from '../../property-form/ui/Modal';
import { Button } from '../../ui/Button';
import { errorMessage, todayIso } from '../shared';

interface Props {
    isOpen: boolean;
    leaseId: string;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export function DepositReturnModal({ isOpen, leaseId, onClose, onSuccess, onError }: Props) {
    const [returnDate, setReturnDate] = useState(todayIso());
    const [saving, setSaving] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        setReturnDate(todayIso());
        setLocalError('');
    }, [isOpen]);

    const submit = () => {
        if (!returnDate || returnDate > todayIso()) {
            setLocalError('Inserisci una data restituzione non futura.');
            return;
        }
        setSaving(true);
        try {
            registerDepositReturn(leaseId, returnDate);
            onSuccess('Restituzione deposito registrata.');
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
        <Modal isOpen={isOpen} onClose={saving ? () => undefined : onClose} title="Registra restituzione deposito" footer={(
            <>
                <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Annulla</Button>
                <Button type="button" onClick={submit} loading={saving}>Registra</Button>
            </>
        )}>
            <label className="grid gap-1 text-sm">
                <span>Data restituzione</span>
                <input type="date" value={returnDate} max={todayIso()} onChange={(e) => setReturnDate(e.target.value)} className="rounded border px-3 py-2" />
            </label>
            {localError && <p className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{localError}</p>}
        </Modal>
    );
}
