import { useMemo, useState } from 'react';
import type { LeaseDetail } from '../../../types/leaseDetail';
import { applyPrepaidRent } from '../../../db/paymentRepository';
import { Modal } from '../../property-form/ui/Modal';
import { Button } from '../../ui/Button';
import { currency, errorMessage, formatDate, todayIso } from '../shared';

interface Props {
    isOpen: boolean;
    detail: LeaseDetail;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export function PrepaidRentModal({ isOpen, detail, onClose, onSuccess, onError }: Props) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [allocationDate, setAllocationDate] = useState(todayIso());
    const [saving, setSaving] = useState(false);
    const [localError, setLocalError] = useState('');
    const allocated = new Set(detail.lease.financialState.prepaidAllocations.map((item) => item.paymentId));
    const residual = Math.max(0, (detail.lease.formData.LeasePrepaidRent || 0) - detail.lease.financialState.prepaidAppliedAmount);
    const eligible = detail.payments.filter((payment) => payment.source === 'generated' && ['rent', 'rent-first'].includes(payment.category) && payment.status !== 'paid' && !allocated.has(payment.id));
    const total = useMemo(() => eligible.filter((payment) => selectedIds.includes(payment.id)).reduce((sum, payment) => sum + payment.amount, 0), [eligible, selectedIds]);

    const submit = () => {
        if (selectedIds.length === 0) {
            setLocalError('Seleziona almeno una rata.');
            return;
        }
        if (total > residual) {
            setLocalError('Il totale selezionato supera il residuo prepagato.');
            return;
        }
        setSaving(true);
        try {
            applyPrepaidRent(detail.lease.id, selectedIds, allocationDate);
            onSuccess('Affitto prepagato allocato.');
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
        <Modal isOpen={isOpen} onClose={saving ? () => undefined : onClose} title="Applica affitto prepagato" maxWidth="3xl" footer={(
            <>
                <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Annulla</Button>
                <Button type="button" onClick={submit} loading={saving}>Applica</Button>
            </>
        )}>
            <div className="space-y-4 text-sm">
                <div className="grid gap-2 md:grid-cols-4">
                    <p>Previsto<br /><b>{currency(detail.lease.formData.LeasePrepaidRent || 0)}</b></p>
                    <p>Allocato<br /><b>{currency(detail.lease.financialState.prepaidAppliedAmount)}</b></p>
                    <p>Residuo<br /><b>{currency(residual)}</b></p>
                    <label>Data allocazione<input type="date" value={allocationDate} onChange={(e) => setAllocationDate(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" /></label>
                </div>
                <div className="max-h-72 overflow-auto rounded border">
                    {eligible.length === 0 ? <p className="p-3 text-gray-500">Nessuna rata eleggibile.</p> : eligible.map((payment) => (
                        <label key={payment.id} className="flex items-center justify-between gap-3 border-b p-3">
                            <span><input type="checkbox" checked={selectedIds.includes(payment.id)} onChange={(e) => setSelectedIds((current) => e.target.checked ? [...current, payment.id] : current.filter((id) => id !== payment.id))} /> {payment.description}</span>
                            <span>{formatDate(payment.dueDate)} - {currency(payment.amount)} {payment.dueDate > todayIso() ? '(futura)' : ''}</span>
                        </label>
                    ))}
                </div>
                <p>Totale selezionato: <b>{currency(total)}</b></p>
                {localError && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{localError}</p>}
            </div>
        </Modal>
    );
}
