import { useEffect, useState } from 'react';
import type { LeaseListItem } from '../../db/leaseRepository';
import { exportLeasesCsv } from '../../utils/leaseCsv';
import { Modal } from '../property-form/ui/Modal';
import { Button } from '../ui/Button';

const columns = [
    ['identificativo', 'Identificativo'],
    ['proprieta', 'Proprietà'],
    ['inquilini', 'Inquilini'],
    ['tipo', 'Tipo'],
    ['stato', 'Stato'],
    ['inizio', 'Inizio'],
    ['fine', 'Fine'],
    ['importo periodico', 'Importo periodico'],
    ['saldo', 'Saldo'],
    ['registrazione', 'Registrazione'],
    ['indirizzo', 'Indirizzo'],
    ['canone', 'Canone'],
    ['spese', 'Spese'],
    ['deposito', 'Deposito'],
    ['note', 'Note'],
];
const defaults = ['identificativo', 'proprieta', 'inquilini', 'tipo', 'stato', 'inizio', 'fine', 'importo periodico', 'saldo'];

interface Props {
    isOpen: boolean;
    leases: LeaseListItem[];
    onClose: () => void;
    onSuccess: (message: string) => void;
}

export function LeaseCsvModal({ isOpen, leases, onClose, onSuccess }: Props) {
    const [selected, setSelected] = useState<string[]>(defaults);
    const [error, setError] = useState('');

    useEffect(() => {
        setSelected(defaults);
        setError('');
    }, [isOpen]);

    const submit = () => {
        if (selected.length === 0) {
            setError('Seleziona almeno una colonna.');
            return;
        }
        exportLeasesCsv(leases, selected);
        onSuccess('CSV esportato.');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Esporta CSV" footer={<><Button type="button" variant="secondary" onClick={onClose}>Annulla</Button><Button type="button" onClick={submit}>Esporta</Button></>}>
            <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => setSelected(columns.map(([id]) => id))}>Seleziona tutte</Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => setSelected([])}>Deseleziona tutte</Button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                    {columns.map(([id, label]) => (
                        <label key={id} className="flex items-center gap-2">
                            <input type="checkbox" checked={selected.includes(id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, id] : current.filter((item) => item !== id))} />
                            {label}
                        </label>
                    ))}
                </div>
                {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
            </div>
        </Modal>
    );
}
