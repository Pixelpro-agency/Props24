import { useEffect, useMemo, useState } from 'react';
import { activateLease, archiveLease, deactivateLease, deleteLease, restoreLease, terminateLease } from '../../db/leaseRepository';
import type { LeaseRecord } from '../../db/database.types';
import { Modal } from '../property-form/ui/Modal';
import { Button } from '../ui/Button';
import { errorMessage, todayIso } from './shared';

export type LeaseLifecycleOperation = 'activate' | 'deactivate' | 'terminate' | 'archive' | 'restore' | 'delete';

interface Props {
    isOpen: boolean;
    operation: LeaseLifecycleOperation | null;
    lease: LeaseRecord | null;
    title: string;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

const labels: Record<LeaseLifecycleOperation, string> = {
    activate: 'Attiva locazione',
    deactivate: 'Disattiva locazione',
    terminate: 'Termina locazione',
    archive: 'Archivia locazione',
    restore: 'Ripristina locazione',
    delete: 'Elimina locazione',
};

function clamp(value: string, min: string, max: string): string {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

export function LeaseLifecycleModal({ isOpen, operation, lease, title, onClose, onSuccess, onError }: Props) {
    const defaultTerminationDate = useMemo(() => lease ? clamp(todayIso(), lease.startDate, lease.endDate) : todayIso(), [lease]);
    const [terminationDate, setTerminationDate] = useState(defaultTerminationDate);
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        setTerminationDate(defaultTerminationDate);
        setReason('');
        setLocalError('');
    }, [defaultTerminationDate, isOpen, operation]);

    if (!operation || !lease) return null;

    const submit = () => {
        setLocalError('');
        if (operation === 'terminate') {
            if (!terminationDate) {
                setLocalError('Inserisci la data di terminazione.');
                return;
            }
            if (terminationDate < lease.startDate || terminationDate > lease.endDate) {
                setLocalError('La data deve essere compresa nel periodo della locazione.');
                return;
            }
        }
        setSaving(true);
        try {
            if (operation === 'activate') activateLease(lease.id);
            if (operation === 'deactivate') deactivateLease(lease.id);
            if (operation === 'terminate') terminateLease(lease.id, { terminationDate, reason });
            if (operation === 'archive') archiveLease(lease.id);
            if (operation === 'restore') restoreLease(lease.id);
            if (operation === 'delete') deleteLease(lease.id);
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
        <Modal isOpen={isOpen} onClose={saving ? () => undefined : onClose} title={labels[operation]} maxWidth="lg" footer={(
            <>
                <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Annulla</Button>
                <Button type="button" variant={operation === 'delete' ? 'danger' : 'primary'} onClick={submit} loading={saving}>
                    Conferma
                </Button>
            </>
        )}>
            <div className="space-y-4 text-sm text-gray-700">
                <p className="font-medium text-gray-900">{title}</p>
                {operation === 'activate' && <p>La locazione verrà riattivata dopo i controlli su proprietà, partecipanti e conflitti.</p>}
                {operation === 'deactivate' && <p>I pagamenti esistenti restano conservati. La locazione non verrà estesa automaticamente.</p>}
                {operation === 'archive' && <p>La locazione viene spostata in archivio. Pagamenti, documenti e attività restano conservati.</p>}
                {operation === 'restore' && <p>Proprietà, partecipanti e conflitti verranno ricontrollati prima del ripristino.</p>}
                {operation === 'delete' && <p className="text-red-700">Operazione definitiva. Se la locazione contiene movimenti o documenti, usa Archivia.</p>}
                {operation === 'terminate' && (
                    <div className="grid gap-3">
                        <label className="grid gap-1">
                            <span>Data terminazione</span>
                            <input type="date" value={terminationDate} min={lease.startDate} max={lease.endDate} onChange={(event) => setTerminationDate(event.target.value)} className="rounded border border-gray-300 px-3 py-2" />
                        </label>
                        <label className="grid gap-1">
                            <span>Motivo</span>
                            <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-24 rounded border border-gray-300 px-3 py-2" />
                        </label>
                    </div>
                )}
                {localError && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{localError}</p>}
            </div>
        </Modal>
    );
}
