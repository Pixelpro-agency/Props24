import { useRef } from 'react';
import {
    Description,
    Dialog,
    DialogPanel,
    DialogTitle,
} from '@headlessui/react';

export interface TenantDraftRestoreDialogProps {
    mode: 'choice' | 'error';
    open: boolean;
    isDeleting?: boolean;
    error?: string | null;
    onCancel(): void;
    onResume(): void;
    onDelete(): void;
    onRetry(): void;
    formMode?: 'create' | 'edit';
}

export function TenantDraftRestoreDialog({
    mode,
    open,
    isDeleting = false,
    error,
    onCancel,
    onResume,
    onDelete,
    onRetry,
    formMode = 'create',
}: TenantDraftRestoreDialogProps) {
    const initialFocusRef = useRef<HTMLButtonElement>(null);
    const disabled = isDeleting;

    return (
        <Dialog
            open={open}
            onClose={() => undefined}
            initialFocus={initialFocusRef}
            className="relative z-50"
        >
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                    <DialogTitle className="text-lg font-semibold text-gray-900">
                        {mode === 'choice'
                            ? formMode === 'edit' ? 'Bozza modifica inquilino disponibile' : 'Bozza inquilino disponibile'
                            : 'Impossibile aprire la bozza'}
                    </DialogTitle>
                    <Description className="mt-2 text-sm text-gray-600">
                        {mode === 'choice'
                            ? formMode === 'edit' ? 'È presente una bozza salvata per la modifica di questo inquilino.' : 'È presente una bozza salvata per il nuovo inquilino.'
                            : 'La bozza non può essere caricata. Puoi riprovare oppure uscire senza modificarla.'}
                    </Description>
                    {error ? (
                        <p
                            role="alert"
                            className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    ) : null}
                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                        <button
                            ref={initialFocusRef}
                            type="button"
                            disabled={disabled}
                            onClick={onCancel}
                            className="rounded-md border px-4 py-2 disabled:opacity-60"
                        >
                            {mode === 'choice' ? 'Annulla' : 'Esci'}
                        </button>
                        {mode === 'choice' ? (
                            <>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={onDelete}
                                    className="rounded-md border border-red-300 px-4 py-2 text-red-700 disabled:opacity-60"
                                >
                                    {isDeleting
                                        ? 'Eliminazione in corso...'
                                        : formMode === 'edit' ? 'Elimina bozza e ripristina' : 'Elimina e ricomincia'}
                                </button>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={onResume}
                                    className="rounded-md bg-green-600 px-4 py-2 text-white disabled:opacity-60"
                                >
                                    Riprendi bozza
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={onRetry}
                                className="rounded-md bg-green-600 px-4 py-2 text-white"
                            >
                                Riprova
                            </button>
                        )}
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
