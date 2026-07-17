import { useState } from 'react';
import type { DocumentRecord } from '../../db/database.types';
import { deleteLeaseDocument, downloadDocument } from '../../db/documentRepository';
import type { LeaseDetail } from '../../types/leaseDetail';
import { Button } from '../ui/Button';
import { Modal } from '../property-form/ui/Modal';
import { errorMessage, type ToastHandler } from './shared';
import { LeaseDocumentModal } from './documents/LeaseDocumentModal';
import { DocumentPreviewModal } from './documents/DocumentPreviewModal';

interface Props {
    detail: LeaseDetail;
    notify: ToastHandler;
}

export function LeaseDocumentsTab({ detail, notify }: Props) {
    const [modal, setModal] = useState<{ mode: 'new' | 'existing' | 'edit'; document: DocumentRecord | null } | null>(null);
    const [preview, setPreview] = useState<DocumentRecord | null>(null);
    const [deleteDoc, setDeleteDoc] = useState<DocumentRecord | null>(null);
    const [deleteError, setDeleteError] = useState('');
    const [deleting, setDeleting] = useState(false);

    const confirmDelete = () => {
        if (!deleteDoc) return;
        setDeleting(true);
        setDeleteError('');
        try {
            deleteLeaseDocument(deleteDoc.id);
            notify('success', 'Documento eliminato.');
            setDeleteDoc(null);
        } catch (error) {
            const message = errorMessage(error);
            setDeleteError(message);
            notify('error', message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <section className="space-y-4 rounded border border-gray-200 bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-gray-900">Documenti</h2>
                <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={() => setModal({ mode: 'new', document: null })}>Nuovo documento</Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => setModal({ mode: 'existing', document: null })}>Collega esistente</Button>
                </div>
            </div>
            {detail.documents.length === 0 ? <p className="text-gray-500">Nessun documento.</p> : (
                <div className="divide-y rounded border">
                    {detail.documents.map((doc) => (
                        <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                            <div>
                                <p className="font-medium">{doc.title || doc.categoryLabel}</p>
                                <p className="text-xs text-gray-500">{doc.categoryLabel} - {doc.sourceDocumentId ? 'Collegato' : doc.file?.name || 'File'}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" className="text-blue-700" onClick={() => setPreview(doc)}>Anteprima</button>
                                <button type="button" className="text-blue-700" onClick={() => downloadDocument(doc.id)}>Download</button>
                                <button type="button" className="text-blue-700" onClick={() => setModal({ mode: 'edit', document: doc })}>Modifica</button>
                                <button type="button" className="text-red-700" onClick={() => setDeleteDoc(doc)}>Elimina</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <LeaseDocumentModal isOpen={Boolean(modal)} mode={modal?.mode || 'new'} leaseId={detail.lease.id} document={modal?.document || null} onClose={() => setModal(null)} onSuccess={(m) => notify('success', m)} onError={(m) => notify('error', m)} />
            <DocumentPreviewModal isOpen={Boolean(preview)} document={preview} onClose={() => setPreview(null)} onDownload={() => preview && downloadDocument(preview.id)} />
            <Modal isOpen={Boolean(deleteDoc)} onClose={deleting ? () => undefined : () => setDeleteDoc(null)} title="Elimina documento" footer={<><Button type="button" variant="secondary" onClick={() => setDeleteDoc(null)} disabled={deleting}>Annulla</Button><Button type="button" variant="danger" onClick={confirmDelete} loading={deleting}>Elimina</Button></>}>
                <p>Il record della locazione verrà eliminato. Un eventuale documento globale collegato resta conservato.</p>
                {deleteError && <p className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{deleteError}</p>}
            </Modal>
        </section>
    );
}
