import type { PaymentRecord } from '../../../db/database.types';
import { buildPaymentReceiptHtml, downloadPaymentReceipt, printPaymentReceipt } from '../../../db/receiptRepository';
import { getJsonDb } from '../../../db/jsonDb';
import { Modal } from '../../property-form/ui/Modal';
import { Button } from '../../ui/Button';

interface Props {
    isOpen: boolean;
    leaseId: string;
    payment: PaymentRecord | null;
    onClose: () => void;
}

export function ReceiptPreviewModal({ isOpen, leaseId, payment, onClose }: Props) {
    if (!payment) return null;
    const html = buildPaymentReceiptHtml(getJsonDb(), leaseId, payment.id);
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Anteprima ricevuta" maxWidth="4xl" footer={(
            <>
                <Button type="button" variant="secondary" onClick={onClose}>Chiudi</Button>
                <Button type="button" variant="secondary" onClick={() => downloadPaymentReceipt(leaseId, payment.id)}>Scarica HTML</Button>
                <Button type="button" onClick={() => printPaymentReceipt(leaseId, payment.id)}>Stampa / Salva come PDF</Button>
            </>
        )}>
            <iframe title="Anteprima ricevuta" sandbox="" srcDoc={html} className="h-[520px] w-full rounded border" />
        </Modal>
    );
}
