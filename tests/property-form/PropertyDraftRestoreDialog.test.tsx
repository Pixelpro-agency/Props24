// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PropertyDraftRestoreDialog } from '../../src/components/property-form/PropertyDraftRestoreDialog';

const actions = () => ({
    onCancel: vi.fn(),
    onResume: vi.fn(),
    onDelete: vi.fn(),
    onRetry: vi.fn(),
});

afterEach(cleanup);

describe('PropertyDraftRestoreDialog', () => {
    it('mostra la scelta property-specific e collega le tre azioni', async () => {
        const handlers = actions();
        const user = userEvent.setup();
        render(<PropertyDraftRestoreDialog
            open
            mode="choice"
            {...handlers}
        />);

        expect(screen.getByRole('dialog')).toBeTruthy();
        expect(screen.getByText('Bozza unità disponibile')).toBeTruthy();
        expect(screen.getByText(
            'È presente una bozza salvata per la nuova unità.',
        )).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Annulla' }));
        await user.click(screen.getByRole('button', {
            name: 'Elimina e ricomincia',
        }));
        await user.click(screen.getByRole('button', {
            name: 'Riprendi bozza',
        }));
        expect(handlers.onCancel).toHaveBeenCalledOnce();
        expect(handlers.onDelete).toHaveBeenCalledOnce();
        expect(handlers.onResume).toHaveBeenCalledOnce();
    });

    it('blocca le azioni durante delete e mostra l’errore operativo', () => {
        render(<PropertyDraftRestoreDialog
            open
            mode="choice"
            isDeleting
            error="Impossibile eliminare la bozza. Riprova."
            {...actions()}
        />);

        expect(screen.getByRole('alert').textContent).toContain('Riprova');
        expect((screen.getByRole('button', {
            name: 'Annulla',
        }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole('button', {
            name: 'Eliminazione in corso...',
        }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole('button', {
            name: 'Riprendi bozza',
        }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('mostra load error con Esci, Riprova e focus iniziale', async () => {
        const handlers = actions();
        const user = userEvent.setup();
        render(<PropertyDraftRestoreDialog
            open
            mode="error"
            error="Errore sicuro"
            {...handlers}
        />);

        expect(screen.getByText('Impossibile aprire la bozza')).toBeTruthy();
        expect(screen.getByText(/Puoi riprovare oppure uscire/)).toBeTruthy();
        expect(screen.getByRole('alert').textContent).toBe('Errore sicuro');
        const exit = screen.getByRole('button', { name: 'Esci' });
        await waitFor(() => expect(document.activeElement).toBe(exit));
        await user.click(exit);
        await user.click(screen.getByRole('button', { name: 'Riprova' }));
        expect(handlers.onCancel).toHaveBeenCalledOnce();
        expect(handlers.onRetry).toHaveBeenCalledOnce();
    });

    it('non si chiude con Escape o backdrop', async () => {
        const handlers = actions();
        const user = userEvent.setup();
        render(<PropertyDraftRestoreDialog
            open
            mode="choice"
            {...handlers}
        />);

        await user.keyboard('{Escape}');
        await user.click(document.querySelector('[aria-hidden="true"]')!);
        expect(screen.getByRole('dialog')).toBeTruthy();
        expect(handlers.onCancel).not.toHaveBeenCalled();
        expect(handlers.onDelete).not.toHaveBeenCalled();
    });

    it('non renderizza quando chiuso', () => {
        render(<PropertyDraftRestoreDialog
            open={false}
            mode="choice"
            {...actions()}
        />);
        expect(screen.queryByRole('dialog')).toBeNull();
    });
});
