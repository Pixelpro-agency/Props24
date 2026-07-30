// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PropertySubmitRecoveryDialog } from '../../src/components/property-form/PropertySubmitRecoveryDialog';

afterEach(cleanup);

describe('PropertySubmitRecoveryDialog', () => {
    it('chiuso non renderizza contenuto o azioni', () => {
        const onRetry = vi.fn();
        render(<PropertySubmitRecoveryDialog
            open={false}
            error="Pulizia fallita"
            isRetrying={false}
            onRetry={onRetry}
        />);
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.queryByText('Unità creata, pulizia incompleta'))
            .toBeNull();
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.queryByRole('button')).toBeNull();
        expect(onRetry).not.toHaveBeenCalled();
    });

    it('mostra contenuto, errore e una sola azione operativa', async () => {
        const onRetry = vi.fn();
        render(<PropertySubmitRecoveryDialog
            open
            error="Pulizia fallita"
            isRetrying={false}
            onRetry={onRetry}
        />);
        expect(screen.getByRole('dialog')).toBeTruthy();
        expect(screen.getByText('Unità creata, pulizia incompleta'))
            .toBeTruthy();
        expect(screen.getByText(/senza creare duplicati/)).toBeTruthy();
        expect(screen.getByRole('alert').textContent).toBe('Pulizia fallita');
        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(screen.queryByText(/Continua comunque|Chiudi|Annulla/))
            .toBeNull();
        const retry = screen.getByRole('button', {
            name: 'Riprova pulizia',
        });
        await waitFor(() => expect(document.activeElement).toBe(retry));
        await userEvent.click(retry);
        expect(onRetry).toHaveBeenCalledOnce();
    });

    it('ignora Escape e backdrop', async () => {
        const onRetry = vi.fn();
        render(<PropertySubmitRecoveryDialog
            open
            error="Pulizia fallita"
            isRetrying={false}
            onRetry={onRetry}
        />);
        await userEvent.keyboard('{Escape}');
        await userEvent.click(screen.getByTestId(
            'property-submit-recovery-backdrop',
        ));
        expect(screen.getByRole('dialog')).toBeTruthy();
        expect(onRetry).not.toHaveBeenCalled();
    });

    it('disabilita doppi click durante retry', () => {
        const onRetry = vi.fn();
        render(<PropertySubmitRecoveryDialog
            open
            error="Pulizia fallita"
            isRetrying
            onRetry={onRetry}
        />);
        const retry = screen.getByRole('button', {
            name: 'Riprovo la pulizia...',
        });
        expect((retry as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(retry);
        fireEvent.click(retry);
        expect(onRetry).not.toHaveBeenCalled();
    });
});
