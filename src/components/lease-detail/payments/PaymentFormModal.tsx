import { useEffect, useState } from 'react';
import type { PaymentRecord } from '../../../db/database.types';
import { createManualPayment, updateManualPayment } from '../../../db/paymentRepository';
import { Modal } from '../../property-form/ui/Modal';
import { Button } from '../../ui/Button';
import { errorMessage, todayIso } from '../shared';

interface Props {
    isOpen: boolean;
    leaseId: string;
    payment: PaymentRecord | null;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export function PaymentFormModal({ isOpen, leaseId, payment, onClose, onSuccess, onError }: Props) {
    const [type, setType] = useState<'income' | 'expense'>('income');
    const [category, setCategory] = useState('other');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState(todayIso());
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [paid, setPaid] = useState(false);
    const [paidDate, setPaidDate] = useState(todayIso());
    const [saving, setSaving] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setType(payment?.type || 'income');
        setCategory(payment?.category || 'other');
        setAmount(payment ? String(payment.amount) : '');
        setDueDate(payment?.dueDate || todayIso());
        setDescription(payment?.description || '');
        setNotes(payment?.notes || '');
        setPaid(payment?.status === 'paid');
        setPaidDate(payment?.paidDate || todayIso());
        setLocalError('');
    }, [isOpen, payment]);

    const submit = () => {
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            setLocalError('Inserisci un importo maggiore di zero.');
            return;
        }
        if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
            setLocalError('Inserisci una scadenza valida.');
            return;
        }
        if (!description.trim()) {
            setLocalError('Inserisci una descrizione.');
            return;
        }
        if (category === 'deposit' || category === 'deposit_return') {
            setLocalError('Usa la sezione deposito per questa categoria.');
            return;
        }
        if (paid && (!paidDate || paidDate > todayIso())) {
            setLocalError('Inserisci una data pagamento non futura.');
            return;
        }
        setSaving(true);
        try {
            const input = { type, category, amount: numericAmount, dueDate, description: description.trim(), notes, paidDate: paid ? paidDate : null };
            if (payment) updateManualPayment(payment.id, input);
            else createManualPayment({ leaseId, ...input });
            onSuccess(payment ? 'Movimento manuale aggiornato.' : 'Movimento manuale salvato.');
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
        <Modal isOpen={isOpen} onClose={saving ? () => undefined : onClose} title={payment ? 'Modifica pagamento manuale' : 'Nuovo pagamento manuale'} maxWidth="2xl" footer={(
            <>
                <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Annulla</Button>
                <Button type="button" onClick={submit} loading={saving}>Salva</Button>
            </>
        )}>
            <div className="grid gap-3 text-sm md:grid-cols-2">
                <label className="grid gap-1"><span>Tipo</span><select value={type} onChange={(e) => setType(e.target.value as 'income' | 'expense')} className="rounded border px-3 py-2"><option value="income">Entrata</option><option value="expense">Spesa</option></select></label>
                <label className="grid gap-1"><span>Categoria</span><input value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border px-3 py-2" /></label>
                <label className="grid gap-1"><span>Importo</span><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded border px-3 py-2" /></label>
                <label className="grid gap-1"><span>Scadenza</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded border px-3 py-2" /></label>
                <label className="grid gap-1 md:col-span-2"><span>Descrizione</span><input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded border px-3 py-2" /></label>
                <label className="grid gap-1 md:col-span-2"><span>Note</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-20 rounded border px-3 py-2" /></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} /> Pagato</label>
                {paid && <label className="grid gap-1"><span>Data pagamento</span><input type="date" value={paidDate} max={todayIso()} onChange={(e) => setPaidDate(e.target.value)} className="rounded border px-3 py-2" /></label>}
                {localError && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700 md:col-span-2">{localError}</p>}
            </div>
        </Modal>
    );
}
