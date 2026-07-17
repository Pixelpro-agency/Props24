import { useEffect, useState } from 'react';
import type { PaymentRecord } from '../../../db/database.types';
import { markPaymentPaid, markPaymentUnpaid } from '../../../db/paymentRepository';
import { Modal } from '../../property-form/ui/Modal';
import { Button } from '../../ui/Button';
import { currency, errorMessage, formatDate, todayIso } from '../shared';

interface Props {
    isOpen: boolean;
    mode: 'paid' | 'unpaid';
    payment: PaymentRecord | null;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export function PaymentStatusModal({ isOpen, mode, payment, onClose, onSuccess, onError }: Props) {
    const [paidDate, setPaidDate] = useState(todayIso());
    const [saving, setSaving] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        setPaidDate(todayIso());
        setLocalError('');
    }, [isOpen, payment, mode]);

    if (!payment) return null;

    const submit = () => {
        if (mode === 'paid' && (!paidDate || paidDate > todayIso())) {
            setLocalError('Inserisci una data pagamento non futura.');
            return;
        }
        setSaving(true);
        try {
            if (mode === 'paid') markPaymentPaid(payment.id, paidDate);
            else markPaymentUnpaid(payment.id);
            onSuccess(mode === 'paid' ? 'Pagamento segnato come pagato.' : 'Pagamento riportato a non pagato.');
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
        <Modal isOpen={isOpen} onClose={saving ? () => undefined : onClose} title={mode === 'paid' ? 'Segna pagamento pagato' : 'Riporta a non pagato'} footer={(
            <>
                <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Annulla</Button>
                <Button type="button" onClick={submit} loading={saving}>Conferma</Button>
            </>
        )}>
            <div className="space-y-3 text-sm">
                <p><b>{payment.description || payment.category}</b></p>
                <p>{currency(payment.amount)} - scadenza {formatDate(payment.dueDate)}</p>
                {mode === 'paid' ? (
                    <label className="grid gap-1">
                        <span>Data pagamento</span>
                        <input type="date" value={paidDate} max={todayIso()} onChange={(e) => setPaidDate(e.target.value)} className="rounded border px-3 py-2" />
                    </label>
                ) : (
                    <p>Il numero ricevuta resta conservato per tracciabilità.</p>
                )}
                {localError && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{localError}</p>}
            </div>
        </Modal>
    );
}
