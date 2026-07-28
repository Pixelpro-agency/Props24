import { useRef } from 'react';
import {
    Description,
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
} from '@headlessui/react';

import type { UnsavedChangesGuardPhase } from './unsavedChangesGuard';

export interface UnsavedChangesDialogProps {
    open: boolean;
    phase: UnsavedChangesGuardPhase;
    error: string | null;
    actionsDisabled: boolean;
    onStay(): void;
    onDiscard(): void;
    onSave(): void;
}

export function UnsavedChangesDialog({
    open,
    phase,
    error,
    actionsDisabled,
    onStay,
    onDiscard,
    onSave,
}: UnsavedChangesDialogProps) {
    const stayButtonRef = useRef<HTMLButtonElement | null>(null);
    const isBusy = phase === 'saving'
        || phase === 'discarding'
        || phase === 'proceeding';
    const disabled = actionsDisabled || isBusy;

    const closeAsStay = () => {
        if (!disabled) onStay();
    };

    return (
        <Dialog
            open={open}
            onClose={closeAsStay}
            initialFocus={stayButtonRef}
            className="relative z-50"
        >
            <DialogBackdrop
                data-testid="unsaved-changes-backdrop"
                className="fixed inset-0 bg-black/40"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                    <DialogTitle className="text-lg font-semibold text-gray-900">
                        Modifiche non salvate
                    </DialogTitle>
                    <Description className="mt-2 text-sm text-gray-600">
                        Abbandonando perderai soltanto le modifiche successive
                        all&apos;ultimo stato salvato.
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
                            ref={stayButtonRef}
                            type="button"
                            disabled={disabled}
                            onClick={onStay}
                            className="rounded-md border px-4 py-2 disabled:opacity-60"
                        >
                            Resta
                        </button>
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={onDiscard}
                            className="rounded-md border border-red-300 px-4 py-2 text-red-700 disabled:opacity-60"
                        >
                            {phase === 'discarding'
                                ? 'Abbandono in corso…'
                                : 'Abbandona'}
                        </button>
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={onSave}
                            className="rounded-md bg-green-600 px-4 py-2 text-white disabled:opacity-60"
                        >
                            {phase === 'saving'
                                ? 'Salvataggio in corso…'
                                : 'Salva bozza'}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
