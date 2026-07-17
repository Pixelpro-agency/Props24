import { useMemo } from 'react';
import type { DocumentRecord } from '../../../db/database.types';
import { resolveDocumentFile } from '../../../db/documentRepository';
import { Modal } from '../../property-form/ui/Modal';
import { Button } from '../../ui/Button';

interface Props {
    isOpen: boolean;
    document: DocumentRecord | null;
    onClose: () => void;
    onDownload: () => void;
}

export function DocumentPreviewModal({ isOpen, document, onClose, onDownload }: Props) {
    const file = useMemo(() => document ? resolveDocumentFile(document.id) : null, [document]);
    if (!document || !file) return null;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    const isText = file.type === 'text/plain';
    const isHtml = file.type === 'text/html';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={document.title || document.categoryLabel} maxWidth="4xl" footer={<><Button type="button" variant="secondary" onClick={onClose}>Chiudi</Button><Button type="button" onClick={onDownload}>Download</Button></>}>
            {isImage && <img src={file.dataUrl} alt={file.name} className="max-h-[560px] max-w-full rounded border object-contain" />}
            {(isPdf || isHtml) && <iframe title={file.name} sandbox="" src={file.dataUrl} className="h-[560px] w-full rounded border" />}
            {isText && <iframe title={file.name} sandbox="" src={file.dataUrl} className="h-[360px] w-full rounded border bg-white" />}
            {!isImage && !isPdf && !isText && !isHtml && <div className="rounded border p-4 text-sm"><p>{file.name}</p><p>{file.type}</p><p>{Math.round(file.size / 1024)} KB</p></div>}
        </Modal>
    );
}
