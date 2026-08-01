// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LeaseDraftRestoreDialog, type LeaseDraftRestoreDialogProps } from '../../src/landlord/leases/drafts/LeaseDraftRestoreDialog';

const actions = () => ({ onCancel: vi.fn(), onResume: vi.fn(), onDelete: vi.fn(), onRetry: vi.fn() });
function renderDialog(overrides: Partial<LeaseDraftRestoreDialogProps> = {}) {
    const callbacks = actions();
    render(<LeaseDraftRestoreDialog mode="choice" open {...callbacks} {...overrides} />);
    return callbacks;
}

afterEach(cleanup);

describe('LeaseDraftRestoreDialog', () => {
    it('non renderizza quando chiuso', () => {
        renderDialog({ open: false });
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('mostra testi, azioni e focus iniziale della scelta', async () => {
        renderDialog();
        expect(screen.getByRole('heading', { name: 'Bozza locazione disponibile' })).toBeTruthy();
        expect(screen.getByText('È presente una bozza salvata per la nuova locazione.')).toBeTruthy();
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Annulla' })));
        expect(screen.getByRole('button', { name: 'Elimina e ricomincia' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Riprendi bozza' })).toBeTruthy();
    });

    it('inoltra una volta Annulla, Riprendi ed Elimina senza submit', () => {
        const callbacks = renderDialog();
        fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
        fireEvent.click(screen.getByRole('button', { name: 'Riprendi bozza' }));
        fireEvent.click(screen.getByRole('button', { name: 'Elimina e ricomincia' }));
        expect(callbacks.onCancel).toHaveBeenCalledOnce();
        expect(callbacks.onResume).toHaveBeenCalledOnce();
        expect(callbacks.onDelete).toHaveBeenCalledOnce();
    });

    it('durante delete disabilita tutte le azioni e mostra avanzamento', () => {
        renderDialog({ isDeleting: true });
        screen.getAllByRole('button').forEach((button) => expect((button as HTMLButtonElement).disabled).toBe(true));
        expect(screen.getByText('Eliminazione in corso...')).toBeTruthy();
    });

    it('mostra errore accessibile con Esci e Riprova', () => {
        const callbacks = renderDialog({ mode: 'error', error: 'Errore leggibile' });
        expect(screen.getByRole('heading', { name: 'Impossibile aprire la bozza' })).toBeTruthy();
        expect(screen.getByText('La bozza non può essere caricata. Puoi riprovare oppure uscire senza modificarla.')).toBeTruthy();
        expect(screen.getByRole('alert').textContent).toBe('Errore leggibile');
        fireEvent.click(screen.getByRole('button', { name: 'Esci' }));
        fireEvent.click(screen.getByRole('button', { name: 'Riprova' }));
        expect(callbacks.onCancel).toHaveBeenCalledOnce();
        expect(callbacks.onRetry).toHaveBeenCalledOnce();
    });

    it('Escape non sceglie alcuna azione', () => {
        const callbacks = renderDialog();
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
        Object.values(callbacks).forEach((callback) => expect(callback).not.toHaveBeenCalled());
    });

    it('il backdrop non sceglie alcuna azione', () => {
        const callbacks = renderDialog();
        fireEvent.click(document.querySelector('[aria-hidden="true"]') as HTMLElement);
        Object.values(callbacks).forEach((callback) => expect(callback).not.toHaveBeenCalled());
    });
});
