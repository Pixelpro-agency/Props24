// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TenantDraftRestoreDialog } from '../../src/components/tenant-form/TenantDraftRestoreDialog';

const handlers = () => ({
    onCancel: vi.fn(),
    onResume: vi.fn(),
    onDelete: vi.fn(),
    onRetry: vi.fn(),
});

afterEach(cleanup);

describe('TenantDraftRestoreDialog', () => {
    it('mostra scelta accessibile e invoca le tre azioni', async () => {
        const actions = handlers();
        const user = userEvent.setup();
        render(<TenantDraftRestoreDialog
            open
            mode="choice"
            {...actions}
        />);
        expect(screen.getByRole('dialog')).toBeTruthy();
        expect(screen.getByText('Bozza inquilino disponibile')).toBeTruthy();
        expect(screen.getByText(
            'È presente una bozza salvata per il nuovo inquilino.',
        )).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Riprendi bozza' }));
        await user.click(screen.getByRole('button', {
            name: 'Elimina e ricomincia',
        }));
        await user.click(screen.getByRole('button', { name: 'Annulla' }));
        expect(actions.onResume).toHaveBeenCalledOnce();
        expect(actions.onDelete).toHaveBeenCalledOnce();
        expect(actions.onCancel).toHaveBeenCalledOnce();
    });

    it('disabilita tutte le azioni durante delete', () => {
        render(<TenantDraftRestoreDialog
            open
            mode="choice"
            isDeleting
            {...handlers()}
        />);
        expect(screen.getAllByRole('button').every(
            (button) => (button as HTMLButtonElement).disabled,
        )).toBe(true);
        expect(screen.getByText('Eliminazione in corso...')).toBeTruthy();
    });

    it('mostra errore bloccante con Esci e Riprova', async () => {
        const actions = handlers();
        const user = userEvent.setup();
        render(<TenantDraftRestoreDialog
            open
            mode="error"
            error="Errore caricamento"
            {...actions}
        />);
        expect(screen.getByRole('alert').textContent)
            .toBe('Errore caricamento');
        await user.click(screen.getByRole('button', { name: 'Riprova' }));
        await user.click(screen.getByRole('button', { name: 'Esci' }));
        expect(actions.onRetry).toHaveBeenCalledOnce();
        expect(actions.onCancel).toHaveBeenCalledOnce();
    });

    it('mostra contenuti e azioni specifici per una bozza edit', async () => {
        const actions = handlers();
        const user = userEvent.setup();
        render(<TenantDraftRestoreDialog open mode="choice" formMode="edit" {...actions} />);
        expect(screen.getByText('Bozza modifica inquilino disponibile')).toBeTruthy();
        expect(screen.getByText('È presente una bozza salvata per la modifica di questo inquilino.')).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Riprendi bozza' }));
        await user.click(screen.getByRole('button', { name: 'Elimina bozza e ripristina' }));
        await user.click(screen.getByRole('button', { name: 'Annulla' }));
        expect(actions.onResume).toHaveBeenCalledOnce();
        expect(actions.onDelete).toHaveBeenCalledOnce();
        expect(actions.onCancel).toHaveBeenCalledOnce();
    });

    it('supporta errore load e retry in edit', async () => {
        const actions = handlers();
        render(<TenantDraftRestoreDialog open mode="error" formMode="edit" error="Errore edit" {...actions} />);
        expect(screen.getByText('Impossibile aprire la bozza')).toBeTruthy();
        expect(screen.getByText(/bozza non può essere caricata/i)).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: 'Riprova' }));
        expect(actions.onRetry).toHaveBeenCalledOnce();
    });

    it('porta il focus su Annulla e ignora Escape e backdrop', async () => {
        const actions = handlers();
        const user = userEvent.setup();
        render(<TenantDraftRestoreDialog
            open
            mode="choice"
            {...actions}
        />);
        const cancel = await screen.findByRole('button', { name: 'Annulla' });
        await waitFor(() => expect(document.activeElement).toBe(cancel));
        await user.keyboard('{Escape}');
        await user.click(document.querySelector('[aria-hidden="true"]') as Element);
        expect(actions.onCancel).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog')).toBeTruthy();
    });
});
