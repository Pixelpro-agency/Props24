import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import type { LeaseSignatureSigner } from '../../../db/database.types';
import { signLocalLease } from '../../../db/leaseSignatureRepository';
import { Modal } from '../../property-form/ui/Modal';
import { Button } from '../../ui/Button';
import { errorMessage } from '../shared';

interface Props {
    isOpen: boolean;
    leaseId: string;
    signer: LeaseSignatureSigner | null;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export function LeaseSignaturePadModal({ isOpen, leaseId, signer, onClose, onSuccess, onError }: Props) {
    const padRef = useRef<SignatureCanvas | null>(null);
    const [saving, setSaving] = useState(false);
    const [localError, setLocalError] = useState('');

    if (!signer) return null;

    const save = () => {
        const pad = padRef.current;
        if (!pad || pad.isEmpty()) {
            setLocalError('Inserisci la firma nel riquadro.');
            return;
        }
        const dataUrl = pad.getTrimmedCanvas().toDataURL('image/png');
        if (!dataUrl.startsWith('data:image/png;base64,')) {
            setLocalError('La firma deve essere un PNG.');
            return;
        }
        if (dataUrl.length > 500 * 1024) {
            setLocalError('La firma supera 500 KB.');
            return;
        }
        setSaving(true);
        try {
            signLocalLease(leaseId, signer.key, dataUrl);
            onSuccess('Firma locale salvata.');
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
        <Modal isOpen={isOpen} onClose={saving ? () => undefined : onClose} title={`Firma - ${signer.nameSnapshot}`} maxWidth="2xl" footer={<><Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Annulla</Button><Button type="button" variant="secondary" onClick={() => padRef.current?.clear()} disabled={saving}>Pulisci</Button><Button type="button" onClick={save} loading={saving}>Salva firma</Button></>}>
            <div className="space-y-3">
                <div className="rounded border bg-white">
                    <SignatureCanvas ref={padRef} canvasProps={{ className: 'h-64 w-full' }} />
                </div>
                {localError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{localError}</p>}
            </div>
        </Modal>
    );
}
