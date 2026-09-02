// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TenantSubmitRecoveryDialog } from '../../src/components/tenant-form/TenantSubmitRecoveryDialog';

afterEach(cleanup);

describe('TenantSubmitRecoveryDialog', () => {
    it('mostra contenuto, errore e una sola azione operativa', async () => {
        const onRetry = vi.fn();
        render(<TenantSubmitRecoveryDialog
            open
            error="Pulizia fallita"
            isRetrying={false}
            onRetry={onRetry}
        />);
        expect(screen.getByRole('dialog')).toBeTruthy();
        expect(screen.getByText('Inquilino creato, pulizia incompleta'))
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
        render(<TenantSubmitRecoveryDialog
            open
            error="Pulizia fallita"
            isRetrying={false}
            onRetry={onRetry}
        />);
        await userEvent.keyboard('{Escape}');
        await userEvent.click(screen.getByTestId(
            'tenant-submit-recovery-backdrop',
        ));
        expect(screen.getByRole('dialog')).toBeTruthy();
        expect(onRetry).not.toHaveBeenCalled();
    });

    it('disabilita doppi click durante retry', () => {
        const onRetry = vi.fn();
        render(<TenantSubmitRecoveryDialog
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

    it('descrive recovery delete-only in edit e invoca retry una volta', async () => {
        const onRetry = vi.fn();
        render(<TenantSubmitRecoveryDialog open mode="edit" error="Pulizia fallita" isRetrying={false} onRetry={onRetry} />);
        expect(screen.getByText('Inquilino aggiornato, pulizia incompleta')).toBeTruthy();
        const description = screen.getByText(/aggiornato.*bozza locale/i).textContent ?? '';
        expect(description).toMatch(/non è stato possibile eliminare la bozza locale/i);
        expect(description).toMatch(/senza ripetere l’aggiornamento/i);
        expect(description).not.toMatch(/creato|duplicati/i);
        await userEvent.click(screen.getByRole('button', { name: 'Riprova pulizia' }));
        expect(onRetry).toHaveBeenCalledOnce();
    });

    it('disabilita retry edit mentre la pulizia è in corso', () => {
        render(<TenantSubmitRecoveryDialog open mode="edit" error="Errore" isRetrying onRetry={vi.fn()} />);
        expect((screen.getByRole('button', { name: 'Riprovo la pulizia...' }) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.queryByText(/creato|duplicati/i)).toBeNull();
    });
});
