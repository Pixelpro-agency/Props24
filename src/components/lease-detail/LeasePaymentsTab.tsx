import { useMemo, useState } from 'react';
import type { PaymentRecord } from '../../db/database.types';
import { deleteManualPayment } from '../../db/paymentRepository';
import type { LeaseDetail } from '../../types/leaseDetail';
import { Button } from '../ui/Button';
import { currency, errorMessage, formatDate, type ToastHandler } from './shared';
import { PaymentFormModal } from './payments/PaymentFormModal';
import { PaymentStatusModal } from './payments/PaymentStatusModal';
import { DepositReturnModal } from './payments/DepositReturnModal';
import { PrepaidRentModal } from './payments/PrepaidRentModal';
import { ReceiptPreviewModal } from './payments/ReceiptPreviewModal';
import { Modal } from '../property-form/ui/Modal';

interface Props {
    detail: LeaseDetail;
    notify: ToastHandler;
}

export function LeasePaymentsTab({ detail, notify }: Props) {
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [formPayment, setFormPayment] = useState<PaymentRecord | null | undefined>(undefined);
    const [statusModal, setStatusModal] = useState<{ mode: 'paid' | 'unpaid'; payment: PaymentRecord } | null>(null);
    const [deletePayment, setDeletePayment] = useState<PaymentRecord | null>(null);
    const [depositOpen, setDepositOpen] = useState(false);
    const [prepaidOpen, setPrepaidOpen] = useState(false);
    const [receiptPayment, setReceiptPayment] = useState<PaymentRecord | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const filtered = detail.payments
        .filter((payment) => !statusFilter || payment.status === statusFilter)
        .filter((payment) => !typeFilter || payment.type === typeFilter)
        .filter((payment) => !sourceFilter || payment.source === sourceFilter)
        .filter((payment) => !categoryFilter || payment.category === categoryFilter);

    const summary = useMemo(() => {
        const revenueDue = detail.payments.filter((p) => p.accountingRole === 'revenue' && p.status !== 'paid');
        const overdue = revenueDue.filter((p) => p.status === 'late');
        const deposit = detail.payments.find((p) => p.source === 'deposit');
        const depositReturn = detail.payments.find((p) => p.source === 'deposit_return');
        return {
            toCollect: revenueDue.reduce((sum, p) => sum + p.amount, 0),
            overdue: overdue.reduce((sum, p) => sum + p.amount, 0),
            deposit,
            depositReturn,
        };
    }, [detail.payments]);

    const confirmDelete = () => {
        if (!deletePayment) return;
        setDeleting(true);
        setDeleteError('');
        try {
            deleteManualPayment(deletePayment.id);
            notify('success', 'Pagamento manuale eliminato.');
            setDeletePayment(null);
        } catch (error) {
            const message = errorMessage(error);
            setDeleteError(message);
            notify('error', message);
        } finally {
            setDeleting(false);
        }
    };

    const categories = Array.from(new Set(detail.payments.map((p) => p.category))).sort();

    return (
        <section className="space-y-4 rounded border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-gray-900">Pagamenti</h2>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={() => setFormPayment(null)}>Nuovo manuale</Button>
                    {summary.deposit?.status === 'paid' && !summary.depositReturn && <Button type="button" size="sm" variant="secondary" onClick={() => setDepositOpen(true)}>Registra restituzione deposito</Button>}
                    {(detail.lease.formData.LeasePrepaidRent || 0) > detail.lease.financialState.prepaidAppliedAmount && <Button type="button" size="sm" variant="secondary" onClick={() => setPrepaidOpen(true)}>Applica prepagato</Button>}
                </div>
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-4">
                <div className="rounded border p-3">Totale da incassare<br /><b>{currency(summary.toCollect)}</b></div>
                <div className="rounded border p-3">Totale scaduto<br /><b>{currency(summary.overdue)}</b></div>
                <div className="rounded border p-3">Deposito previsto<br /><b>{currency(detail.depositAmount)}</b></div>
                <div className="rounded border p-3">Deposito incassato<br /><b>{currency(summary.deposit?.status === 'paid' ? summary.deposit.amount : 0)}</b></div>
                <div className="rounded border p-3">Deposito restituito<br /><b>{currency(summary.depositReturn?.amount || 0)}</b></div>
                <div className="rounded border p-3">Prepagato previsto<br /><b>{currency(detail.lease.formData.LeasePrepaidRent || 0)}</b></div>
                <div className="rounded border p-3">Prepagato allocato<br /><b>{currency(detail.lease.financialState.prepaidAppliedAmount)}</b></div>
                <div className="rounded border p-3">Prepagato residuo<br /><b>{currency(Math.max(0, (detail.lease.formData.LeasePrepaidRent || 0) - detail.lease.financialState.prepaidAppliedAmount))}</b></div>
            </div>

            <div className="grid gap-2 md:grid-cols-4">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border px-3 py-2 text-sm"><option value="">Tutti gli stati</option><option value="pending">Pending</option><option value="late">Late</option><option value="paid">Paid</option></select>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded border px-3 py-2 text-sm"><option value="">Tutti i tipi</option><option value="income">Entrata</option><option value="expense">Spesa</option></select>
                <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="rounded border px-3 py-2 text-sm"><option value="">Tutte le origini</option><option value="generated">Generated</option><option value="manual">Manual</option><option value="deposit">Deposit</option><option value="deposit_return">Deposit return</option></select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded border px-3 py-2 text-sm"><option value="">Tutte le categorie</option>{categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}</select>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-3 py-2">Descrizione</th><th className="px-3 py-2">Categoria</th><th className="px-3 py-2">Origine</th><th className="px-3 py-2">Ruolo</th><th className="px-3 py-2">Importo</th><th className="px-3 py-2">Scadenza</th><th className="px-3 py-2">Pagamento</th><th className="px-3 py-2">Stato</th><th className="px-3 py-2">Ricevuta</th><th className="px-3 py-2">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtered.map((payment) => (
                            <tr key={payment.id}>
                                <td className="px-3 py-2">{payment.description || '-'}</td>
                                <td className="px-3 py-2">{payment.category}</td>
                                <td className="px-3 py-2">{payment.source}</td>
                                <td className="px-3 py-2">{payment.accountingRole}</td>
                                <td className="px-3 py-2">{currency(payment.amount)}</td>
                                <td className="px-3 py-2">{formatDate(payment.dueDate)}</td>
                                <td className="px-3 py-2">{payment.paidDate ? formatDate(payment.paidDate) : '-'}</td>
                                <td className="px-3 py-2">{payment.status}</td>
                                <td className="px-3 py-2">{payment.receiptNumber || '-'}</td>
                                <td className="px-3 py-2">
                                    <div className="flex flex-wrap gap-2">
                                        {payment.status !== 'paid' && <button type="button" className="text-blue-700" onClick={() => setStatusModal({ mode: 'paid', payment })}>Segna pagato</button>}
                                        {payment.status === 'paid' && <button type="button" className="text-blue-700" onClick={() => setStatusModal({ mode: 'unpaid', payment })}>Non pagato</button>}
                                        {payment.source === 'manual' && <button type="button" className="text-blue-700" onClick={() => setFormPayment(payment)}>Modifica</button>}
                                        {payment.source === 'manual' && payment.status !== 'paid' && <button type="button" className="text-red-700" onClick={() => setDeletePayment(payment)}>Elimina</button>}
                                        {payment.accountingRole === 'revenue' && payment.status === 'paid' && payment.receiptNumber && <button type="button" className="text-blue-700" onClick={() => setReceiptPayment(payment)}>Ricevuta</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <PaymentFormModal isOpen={formPayment !== undefined} leaseId={detail.lease.id} payment={formPayment || null} onClose={() => setFormPayment(undefined)} onSuccess={(m) => notify('success', m)} onError={(m) => notify('error', m)} />
            <PaymentStatusModal isOpen={Boolean(statusModal)} mode={statusModal?.mode || 'paid'} payment={statusModal?.payment || null} onClose={() => setStatusModal(null)} onSuccess={(m) => notify('success', m)} onError={(m) => notify('error', m)} />
            <DepositReturnModal isOpen={depositOpen} leaseId={detail.lease.id} onClose={() => setDepositOpen(false)} onSuccess={(m) => notify('success', m)} onError={(m) => notify('error', m)} />
            <PrepaidRentModal isOpen={prepaidOpen} detail={detail} onClose={() => setPrepaidOpen(false)} onSuccess={(m) => notify('success', m)} onError={(m) => notify('error', m)} />
            <ReceiptPreviewModal isOpen={Boolean(receiptPayment)} leaseId={detail.lease.id} payment={receiptPayment} onClose={() => setReceiptPayment(null)} />
            <Modal isOpen={Boolean(deletePayment)} onClose={deleting ? () => undefined : () => setDeletePayment(null)} title="Elimina pagamento manuale" footer={<><Button type="button" variant="secondary" onClick={() => setDeletePayment(null)} disabled={deleting}>Annulla</Button><Button type="button" variant="danger" onClick={confirmDelete} loading={deleting}>Elimina</Button></>}>
                <p className="text-sm">Confermi l'eliminazione del pagamento manuale non incassato?</p>
                {deleteError && <p className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{deleteError}</p>}
            </Modal>
        </section>
    );
}
