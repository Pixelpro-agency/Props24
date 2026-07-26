import { useEffect, useState } from 'react';
import type { PaymentRecord } from '../../../db/database.types';
import { PAYMENT_CONFIRMATION_METHODS } from '../../../db/paymentConfirmation';
import { confirmPaymentPaid, markPaymentUnpaid } from '../../../db/paymentRepository';
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
    const [method, setMethod] = useState('');
    const [paidDate, setPaidDate] = useState(todayIso());
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        setMethod('');
        setPaidDate(todayIso());
        setAmount(payment ? String(payment.amount) : '');
        setNote('');
        setLocalError('');
    }, [isOpen, payment, mode]);

    if (!payment) return null;

    const submit = () => {
        setSaving(true);
        try {
            if (mode === 'paid') confirmPaymentPaid(payment.id, {
                method,
                paidDate,
                amount: Number(amount),
                note,
            });
            else markPaymentUnpaid(payment.id);
            onSuccess(mode === 'paid' ? 'Pagamento completo confermato.' : 'Pagamento riportato a non pagato.');
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
        <Modal isOpen={isOpen} onClose={saving ? () => undefined : onClose} title={mode === 'paid' ? 'Conferma pagamento completo' : 'Riporta a non pagato'} footer={(
            <>
                <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Annulla</Button>
                <Button type="button" onClick={submit} loading={saving}>Conferma</Button>
            </>
        )}>
            <div className="space-y-3 text-sm">
                <p><b>{payment.description || payment.category}</b></p>
                <p>{currency(payment.amount)} - scadenza {formatDate(payment.dueDate)}</p>
                {mode === 'paid' ? (
                    <div className="grid gap-3">
                        <label className="grid gap-1">
                            <span>Metodo effettivo</span>
                            <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded border px-3 py-2">
                                <option value="">Seleziona il metodo</option>
                                {PAYMENT_CONFIRMATION_METHODS.map((value) => (
                                    <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1">
                            <span>Data pagamento</span>
                            <input type="date" value={paidDate} max={todayIso()} onChange={(e) => setPaidDate(e.target.value)} className="rounded border px-3 py-2" />
                        </label>
                        <label className="grid gap-1">
                            <span>Importo confermato</span>
                            <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded border px-3 py-2" />
                        </label>
                        <label className="grid gap-1">
                            <span>Nota facoltativa</span>
                            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20 rounded border px-3 py-2" />
                        </label>
                    </div>
                ) : (
                    <p>Il numero ricevuta resta conservato per tracciabilità.</p>
                )}
                {localError && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{localError}</p>}
            </div>
        </Modal>
    );
}
