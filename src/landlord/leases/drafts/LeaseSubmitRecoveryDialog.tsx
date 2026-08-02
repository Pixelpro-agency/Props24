import { useRef } from 'react';
import {
    Description,
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
} from '@headlessui/react';

export interface LeaseSubmitRecoveryDialogProps {
    open: boolean;
    error: string;
    isRetrying: boolean;
    onRetry(): void;
}

export function LeaseSubmitRecoveryDialog({
    open,
    error,
    isRetrying,
    onRetry,
}: LeaseSubmitRecoveryDialogProps) {
    const retryButtonRef = useRef<HTMLButtonElement | null>(null);

    return (
        <Dialog
            open={open}
            onClose={() => undefined}
            initialFocus={retryButtonRef}
            className="relative z-[70]"
        >
            <DialogBackdrop
                data-testid="lease-submit-recovery-backdrop"
                className="fixed inset-0 bg-black/50"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                    <DialogTitle className="text-lg font-semibold text-gray-900">
                        Locazione creata, pulizia incompleta
                    </DialogTitle>
                    <Description className="mt-2 text-sm text-gray-600">
                        La locazione è stata creata, ma non è stato possibile
                        eliminare la bozza locale. Riprova la pulizia per tornare
                        all’elenco senza creare duplicati.
                    </Description>
                    <p
                        role="alert"
                        className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
                    >
                        {error}
                    </p>
                    <div className="mt-6 flex justify-end">
                        <button
                            ref={retryButtonRef}
                            type="button"
                            disabled={isRetrying}
                            onClick={onRetry}
                            className="rounded-md bg-green-600 px-4 py-2 text-white disabled:opacity-60"
                        >
                            {isRetrying
                                ? 'Riprovo la pulizia...'
                                : 'Riprova pulizia'}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
