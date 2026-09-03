import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export type TenantActionOperation = 'archive' | 'restore' | 'delete';

export function TenantActionModal({ isOpen, operation, count, onClose, onConfirm }: { isOpen: boolean; operation: TenantActionOperation; count: number; onClose(): void; onConfirm(): void | Promise<void> }) {
    const [busy, setBusy] = useState(false);
    if (!isOpen) return null;
    const plural = count !== 1;
    const labels = { archive: plural ? 'Archivia inquilini' : 'Archivia inquilino', restore: plural ? 'Ripristina inquilini' : 'Ripristina inquilino', delete: plural ? 'Elimina inquilini' : 'Elimina inquilino' };
    const confirm = async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } };
    return <div role="dialog" aria-modal="true" aria-labelledby="tenant-action-title" className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <button aria-label="Chiudi" className="absolute inset-0 bg-black/40" disabled={busy} onClick={onClose} />
        <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 id="tenant-action-title" className="text-lg font-semibold">{labels[operation]}</h2>
            <p className="mt-2 text-sm text-gray-600">Confermi l'operazione su {count} {plural ? 'inquilini' : 'inquilino'}?</p>
            {operation === 'delete' && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800"><AlertTriangle className="mr-2 inline h-4 w-4" />L'eliminazione è definitiva e può essere bloccata da locazioni o pagamenti collegati, anche storici. Nel bulk l'operazione è atomica: se un inquilino è bloccato, nessuno viene eliminato. In alternativa puoi archiviare.</div>}
            <div className="mt-6 flex justify-end gap-3"><button disabled={busy} onClick={onClose} className="rounded-md border px-4 py-2">Annulla</button><button disabled={busy} onClick={() => void confirm()} className="rounded-md bg-green-600 px-4 py-2 text-white">{busy ? 'Operazione in corso...' : labels[operation]}</button></div>
        </div>
    </div>;
}
