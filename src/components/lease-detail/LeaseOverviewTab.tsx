import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';
import { updateLeaseNotes } from '../../db/leaseRepository';
import type { LeaseDetail } from '../../types/leaseDetail';
import { Button } from '../ui/Button';
import { currency, errorMessage, type ToastHandler } from './shared';

export function LeaseOverviewTab({ detail, notify }: { detail: LeaseDetail; notify: ToastHandler }) {
    const [editing, setEditing] = useState(false);
    const [notes, setNotes] = useState(detail.lease.notes);
    const { lease } = detail;
    const save = () => {
        try {
            updateLeaseNotes(lease.id, notes);
            notify('success', 'Note aggiornate.');
            setEditing(false);
        } catch (error) {
            notify('error', errorMessage(error));
        }
    };
    return (
        <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded border border-gray-200 bg-white p-4">
                <h2 className="font-semibold text-gray-900">Contratto</h2>
                <dl className="mt-3 space-y-2 text-sm">
                    <div><dt className="text-gray-500">Proprietà</dt><dd>{detail.property ? <Link to={`/properties/units/${detail.property.id}`} className="text-blue-700 hover:underline">{detail.property.formData.PropertyTitle || 'Unità senza nome'}</Link> : '-'}</dd></div>
                    <div><dt className="text-gray-500">Identificativo</dt><dd>{lease.formData.LeaseIdentificativo || '-'}</dd></div>
                    <div><dt className="text-gray-500">Registrazione</dt><dd>{lease.formData.LeaseNumeroRegistrazione || '-'}</dd></div>
                    <div><dt className="text-gray-500">Tipo</dt><dd>{lease.leaseTypeLabel}</dd></div>
                    <div><dt className="text-gray-500">PeriodicitÃ </dt><dd>{lease.billingPeriod}</dd></div>
                    <div><dt className="text-gray-500">Metodo</dt><dd>{lease.formData.LeasePaymentMethod || '-'}</dd></div>
                    <div><dt className="text-gray-500">Canone</dt><dd>{currency(lease.rentAmount)}</dd></div>
                    <div><dt className="text-gray-500">Spese</dt><dd>{currency(lease.utilitiesAmount)}</dd></div>
                    <div><dt className="text-gray-500">Importo periodo</dt><dd>{currency(lease.formData.LeaseMonthlyAmount)}</dd></div>
                    <div><dt className="text-gray-500">Deposito</dt><dd>{currency(detail.depositAmount)}</dd></div>
                    <div><dt className="text-gray-500">Prepagato</dt><dd>{currency(lease.formData.LeasePrepaidRent)} / allocato {currency(detail.prepaidAppliedAmount)}</dd></div>
                    <div><dt className="text-gray-500">Saldo affitto</dt><dd>{currency(detail.balance)}</dd></div>
                </dl>
            </div>
            <div className="rounded border border-gray-200 bg-white p-4">
                <h2 className="font-semibold text-gray-900">Note</h2>
                {!editing ? (
                    <>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{lease.notes || 'Nessuna nota.'}</p>
                        <Button type="button" variant="secondary" className="mt-3" onClick={() => { setNotes(lease.notes); setEditing(true); }}>Modifica</Button>
                    </>
                ) : (
                    <div className="mt-3 space-y-3">
                        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-28 w-full rounded border p-3 text-sm" />
                        <div className="flex gap-2">
                            <Button type="button" icon={Save} onClick={save}>Salva</Button>
                            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Annulla</Button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
