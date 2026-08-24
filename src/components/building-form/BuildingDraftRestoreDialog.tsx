import { useRef } from 'react';
import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

interface Props {
    mode: 'choice' | 'error';
    open: boolean;
    isDeleting: boolean;
    error: string | null;
    onCancel(): void;
    onResume(): void;
    onDelete(): void;
    onRetry(): void;
}

export function BuildingDraftRestoreDialog(props: Props) {
    const focusRef = useRef<HTMLButtonElement>(null);
    return (
        <Dialog open={props.open} onClose={() => undefined} initialFocus={focusRef} className="relative z-50">
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                    <DialogTitle className="text-lg font-semibold">
                        {props.mode === 'choice' ? 'Bozza edificio disponibile' : 'Impossibile aprire la bozza'}
                    </DialogTitle>
                    <Description className="mt-2 text-sm text-gray-600">
                        {props.mode === 'choice'
                            ? 'È presente una bozza salvata per il nuovo edificio.'
                            : 'La bozza non può essere caricata. Puoi riprovare oppure uscire senza modificarla.'}
                    </Description>
                    {props.error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{props.error}</p>}
                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                        <button ref={focusRef} type="button" disabled={props.isDeleting} onClick={props.onCancel} className="rounded-md border px-4 py-2 disabled:opacity-60">
                            {props.mode === 'choice' ? 'Annulla' : 'Esci'}
                        </button>
                        {props.mode === 'choice' ? <>
                            <button type="button" disabled={props.isDeleting} onClick={props.onDelete} className="rounded-md border border-red-300 px-4 py-2 text-red-700 disabled:opacity-60">
                                {props.isDeleting ? 'Eliminazione in corso...' : 'Elimina e ricomincia'}
                            </button>
                            <button type="button" disabled={props.isDeleting} onClick={props.onResume} className="rounded-md bg-green-600 px-4 py-2 text-white">Riprendi bozza</button>
                        </> : <button type="button" onClick={props.onRetry} className="rounded-md bg-green-600 px-4 py-2 text-white">Riprova</button>}
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
