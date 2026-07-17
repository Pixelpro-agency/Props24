import { useState } from 'react';
import type { LeaseSignatureSigner } from '../../db/database.types';
import { resetLocalSignatureProcess, startLocalSignatureProcess } from '../../db/leaseSignatureRepository';
import type { LeaseDetail } from '../../types/leaseDetail';
import { Button } from '../ui/Button';
import { Modal } from '../property-form/ui/Modal';
import { errorMessage, formatDate, type ToastHandler } from './shared';
import { LeaseSignaturePadModal } from './signature/LeaseSignaturePadModal';

interface Props {
    detail: LeaseDetail;
    notify: ToastHandler;
}

export function LeaseSignatureTab({ detail, notify }: Props) {
    const [signer, setSigner] = useState<LeaseSignatureSigner | null>(null);
    const [resetOpen, setResetOpen] = useState(false);
    const [resetError, setResetError] = useState('');
    const process = detail.lease.signatureProcess;

    const start = () => {
        try {
            startLocalSignatureProcess(detail.lease.id);
            notify('success', 'Procedura di firma locale avviata.');
        } catch (error) {
            notify('error', errorMessage(error));
        }
    };

    const reset = () => {
        try {
            resetLocalSignatureProcess(detail.lease.id);
            notify('success', 'Procedura firma annullata.');
            setResetOpen(false);
        } catch (error) {
            const message = errorMessage(error);
            setResetError(message);
            notify('error', message);
        }
    };

    return (
        <section className="space-y-4 rounded border border-gray-200 bg-white p-4 text-sm">
            <p className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">La firma viene salvata esclusivamente nel browser come simulazione locale e non costituisce una firma elettronica qualificata.</p>
            {!process ? <Button type="button" onClick={start}>Avvia firma locale</Button> : (
                <>
                    <div className="grid gap-2 md:grid-cols-3">
                        <p>Stato<br /><b>{process.status}</b></p>
                        <p>Snapshot contratto<br /><b>{process.contractDocumentId}</b></p>
                        <p>Completata<br /><b>{process.completedAt ? new Date(process.completedAt).toLocaleString('it-IT') : '-'}</b></p>
                    </div>
                    <div className="divide-y rounded border">
                        {process.signers.map((item) => (
                            <div key={item.key} className="flex flex-wrap items-center justify-between gap-3 p-3">
                                <span>{item.nameSnapshot} - {item.role}<br /><span className="text-xs text-gray-500">{item.status === 'signed' && item.signedAt ? formatDate(item.signedAt.slice(0, 10)) : 'Da firmare'}</span></span>
                                {item.status === 'pending' && <Button type="button" size="sm" onClick={() => setSigner(item)}>Firma</Button>}
                            </div>
                        ))}
                    </div>
                    <Button type="button" variant="secondary" onClick={() => setResetOpen(true)}>Annulla procedura</Button>
                </>
            )}
            <LeaseSignaturePadModal isOpen={Boolean(signer)} leaseId={detail.lease.id} signer={signer} onClose={() => setSigner(null)} onSuccess={(m) => notify('success', m)} onError={(m) => notify('error', m)} />
            <Modal isOpen={resetOpen} onClose={() => setResetOpen(false)} title="Annulla procedura firma" footer={<><Button type="button" variant="secondary" onClick={() => setResetOpen(false)}>No</Button><Button type="button" variant="danger" onClick={reset}>Annulla procedura</Button></>}>
                <p>La procedura verrà annullata. Lo snapshot del contratto resta nel fascicolo.</p>
                {resetError && <p className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{resetError}</p>}
            </Modal>
        </section>
    );
}
