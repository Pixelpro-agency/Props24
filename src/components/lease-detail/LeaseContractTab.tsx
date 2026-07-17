import { useMemo, useState } from 'react';
import { buildLeaseContractHtml, downloadLeaseContract, printLeaseContract, saveLeaseContractSnapshot } from '../../db/leaseContractRepository';
import { getJsonDb } from '../../db/jsonDb';
import type { LeaseDetail } from '../../types/leaseDetail';
import { Button } from '../ui/Button';
import { errorMessage, type ToastHandler } from './shared';

export function LeaseContractTab({ detail, notify }: { detail: LeaseDetail; notify: ToastHandler }) {
    const [refresh, setRefresh] = useState(0);
    const [generatedAt, setGeneratedAt] = useState(() => new Date().toLocaleString('it-IT'));
    const html = useMemo(() => buildLeaseContractHtml(getJsonDb(), detail.lease.id), [detail.lease.id, refresh]);
    const lastSnapshot = detail.documents
        .filter((doc) => doc.file?.type === 'text/html' && doc.categoryLabel === 'Contratto di locazione')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const saveSnapshot = () => {
        try {
            saveLeaseContractSnapshot(detail.lease.id);
            notify('success', 'Contratto salvato nel fascicolo.');
        } catch (error) {
            notify('error', errorMessage(error));
        }
    };
    return (
        <section className="space-y-3 rounded border border-gray-200 bg-white p-4 text-sm">
            <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => { setRefresh((value) => value + 1); setGeneratedAt(new Date().toLocaleString('it-IT')); }}>Aggiorna anteprima</Button>
                <Button type="button" variant="secondary" onClick={() => downloadLeaseContract(detail.lease.id)}>Scarica HTML</Button>
                <Button type="button" variant="secondary" onClick={() => printLeaseContract(detail.lease.id)}>Stampa / Salva come PDF</Button>
                <Button type="button" onClick={saveSnapshot}>Salva nel fascicolo</Button>
            </div>
            <p>Anteprima generata: {generatedAt}</p>
            <p>Ultimo snapshot: {lastSnapshot ? new Date(lastSnapshot.createdAt).toLocaleString('it-IT') : '-'}</p>
            <iframe title="Anteprima contratto" sandbox="" srcDoc={html} className="h-96 w-full rounded border" />
        </section>
    );
}
