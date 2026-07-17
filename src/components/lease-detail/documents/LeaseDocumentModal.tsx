import { useEffect, useMemo, useState } from 'react';
import type { DocumentRecord } from '../../../db/database.types';
import { createLeaseDocument, linkExistingDocument, listGlobalDocuments, updateLeaseDocument } from '../../../db/documentRepository';
import type { StoredLocalFile } from '../../property-form/schema';
import { Modal } from '../../property-form/ui/Modal';
import { Button } from '../../ui/Button';
import { errorMessage } from '../shared';

interface Props {
    isOpen: boolean;
    mode: 'new' | 'existing' | 'edit';
    leaseId: string;
    document: DocumentRecord | null;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

function readFile(file: File): Promise<StoredLocalFile> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('File non leggibile.'));
        reader.onload = () => resolve({ id: `file-${Date.now()}`, name: file.name, type: file.type, size: file.size, lastModified: file.lastModified, dataUrl: String(reader.result || '') });
        reader.readAsDataURL(file);
    });
}

export function LeaseDocumentModal({ isOpen, mode, leaseId, document, onClose, onSuccess, onError }: Props) {
    const [categoryLabel, setCategoryLabel] = useState('Contratto');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isShared, setIsShared] = useState(false);
    const [file, setFile] = useState<StoredLocalFile | null>(null);
    const [sourceId, setSourceId] = useState('');
    const [query, setQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        setCategoryLabel(document?.categoryLabel || 'Contratto');
        setTitle(document?.title || '');
        setDescription(document?.description || '');
        setIsShared(document?.isShared || false);
        setFile(null);
        setSourceId('');
        setQuery('');
        setLocalError('');
    }, [document, isOpen, mode]);

    const globals = useMemo(() => {
        const q = query.trim().toLowerCase();
        return listGlobalDocuments().filter((doc) => !q || [doc.title, doc.categoryLabel, doc.file?.name || ''].join(' ').toLowerCase().includes(q));
    }, [query, isOpen]);

    const submit = async () => {
        setLocalError('');
        if (!categoryLabel.trim()) {
            setLocalError('Inserisci la categoria.');
            return;
        }
        setSaving(true);
        try {
            const metadata = { categoryId: 1, categoryLabel: categoryLabel.trim(), title: title.trim(), description, isShared };
            if (mode === 'edit' && document) updateLeaseDocument(document.id, metadata);
            if (mode === 'existing') {
                if (!sourceId) throw new Error('Seleziona un documento esistente.');
                linkExistingDocument(leaseId, sourceId, metadata);
            }
            if (mode === 'new') {
                if (!file) throw new Error('Seleziona un file.');
                createLeaseDocument(leaseId, { ...metadata, file });
            }
            onSuccess(mode === 'edit' ? 'Documento aggiornato.' : 'Documento salvato.');
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
        <Modal isOpen={isOpen} onClose={saving ? () => undefined : onClose} title={mode === 'new' ? 'Nuovo documento' : mode === 'existing' ? 'Collega documento esistente' : 'Modifica documento'} maxWidth="2xl" footer={<><Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Annulla</Button><Button type="button" onClick={submit} loading={saving}>Salva</Button></>}>
            <div className="grid gap-3 text-sm">
                {mode === 'existing' && (
                    <>
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca documento globale" className="rounded border px-3 py-2" />
                        <div className="max-h-48 overflow-auto rounded border">
                            {globals.length === 0 ? <p className="p-3 text-gray-500">Nessun documento globale.</p> : globals.map((doc) => (
                                <label key={doc.id} className="flex items-center justify-between gap-3 border-b p-3">
                                    <span><input type="radio" name="sourceDocumentId" value={doc.id} checked={sourceId === doc.id} onChange={() => setSourceId(doc.id)} /> {doc.title || doc.categoryLabel}</span>
                                    <span className="text-gray-500">{doc.file?.name || '-'} {doc.file ? `${Math.round(doc.file.size / 1024)} KB` : ''}</span>
                                </label>
                            ))}
                        </div>
                    </>
                )}
                {mode === 'new' && (
                    <label className="grid gap-1">
                        <span>File</span>
                        <input type="file" accept=".pdf,image/jpeg,image/png,image/webp,text/plain,.doc,.docx" onChange={async (e) => {
                            const selected = e.target.files?.[0];
                            if (!selected) return;
                            try { setFile(await readFile(selected)); } catch (error) { setLocalError(errorMessage(error)); }
                        }} />
                        {file && <span className="text-gray-500">{file.name} - {file.type} - {Math.round(file.size / 1024)} KB</span>}
                    </label>
                )}
                <label className="grid gap-1"><span>Categoria</span><input value={categoryLabel} onChange={(e) => setCategoryLabel(e.target.value)} className="rounded border px-3 py-2" /></label>
                <label className="grid gap-1"><span>Titolo</span><input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border px-3 py-2" /></label>
                <label className="grid gap-1"><span>Descrizione</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-20 rounded border px-3 py-2" /></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} /> Condiviso</label>
                {localError && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{localError}</p>}
            </div>
        </Modal>
    );
}
