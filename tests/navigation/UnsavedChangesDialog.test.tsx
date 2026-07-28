// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    UnsavedChangesDialog,
    type UnsavedChangesDialogProps,
} from '../../src/navigation/UnsavedChangesDialog';

function renderDialog(overrides: Partial<UnsavedChangesDialogProps> = {}) {
    const props: UnsavedChangesDialogProps = {
        open: true,
        phase: 'blocked',
        error: null,
        actionsDisabled: false,
        onStay: vi.fn(),
        onDiscard: vi.fn(),
        onSave: vi.fn(),
        ...overrides,
    };
    return { ...render(<UnsavedChangesDialog {...props} />), props };
}

afterEach(cleanup);

describe('UnsavedChangesDialog', () => {
    it('non renderizza il dialog chiuso', () => {
        renderDialog({ open: false });
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('associa titolo e descrizione e mostra tre azioni', () => {
        renderDialog();
        const dialog = screen.getByRole('dialog');
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(screen.getByRole('heading', {
            name: 'Modifiche non salvate',
        })).toBeTruthy();
        expect(screen.getByText(/modifiche successive/)).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Resta' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Abbandona' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Salva bozza' })).toBeTruthy();
    });

    it('porta il focus iniziale su Resta', async () => {
        renderDialog();
        await screen.getByRole('button', { name: 'Resta' }).focus();
        expect(document.activeElement).toBe(
            screen.getByRole('button', { name: 'Resta' }),
        );
    });

    it.each([
        ['Resta', 'onStay'],
        ['Abbandona', 'onDiscard'],
        ['Salva bozza', 'onSave'],
    ] as const)('azione %s chiama una volta %s', async (name, callback) => {
        const { props } = renderDialog();
        await userEvent.click(screen.getByRole('button', { name }));
        expect(props[callback]).toHaveBeenCalledTimes(1);
    });

    it('Escape equivale a Resta', async () => {
        const { props } = renderDialog();
        await userEvent.keyboard('{Escape}');
        expect(props.onStay).toHaveBeenCalledTimes(1);
    });

    it('backdrop equivale a Resta senza click-through', async () => {
        const { props } = renderDialog();
        await userEvent.click(screen.getByTestId('unsaved-changes-backdrop'));
        expect(props.onStay).toHaveBeenCalledTimes(1);
        expect(props.onSave).not.toHaveBeenCalled();
        expect(props.onDiscard).not.toHaveBeenCalled();
    });

    it.each(['saving', 'discarding', 'proceeding'] as const)(
        'Escape e backdrop sono ignorati durante %s',
        async (phase) => {
            const { props } = renderDialog({ phase });
            await userEvent.keyboard('{Escape}');
            await userEvent.click(
                screen.getByTestId('unsaved-changes-backdrop'),
            );
            expect(props.onStay).not.toHaveBeenCalled();
        },
    );

    it('mostra errore con role alert', () => {
        renderDialog({ error: 'Operazione fallita' });
        expect(screen.getByRole('alert').textContent)
            .toBe('Operazione fallita');
    });

    it('disabilita realmente tutte le azioni', () => {
        renderDialog({ actionsDisabled: true });
        for (const button of screen.getAllByRole('button')) {
            expect((button as HTMLButtonElement).disabled).toBe(true);
        }
    });

    it('comunica saving e discarding', () => {
        const view = renderDialog({ phase: 'saving' });
        expect((screen.getByRole('button', {
            name: 'Salvataggio in corso…',
        }) as HTMLButtonElement).disabled).toBe(true);
        view.rerender(<UnsavedChangesDialog
            {...view.props}
            phase="discarding"
        />);
        expect((screen.getByRole('button', {
            name: 'Abbandono in corso…',
        }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('proceeding è completamente inerte', async () => {
        const { props } = renderDialog({ phase: 'proceeding' });
        for (const button of screen.getAllByRole('button')) {
            expect((button as HTMLButtonElement).disabled).toBe(true);
        }
        await userEvent.keyboard('{Escape}');
        expect(props.onStay).not.toHaveBeenCalled();
    });

    it('intrappola il focus e lo restituisce alla chiusura', async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Apri';
        document.body.append(trigger);
        trigger.focus();
        const view = renderDialog();
        await userEvent.tab();
        expect(screen.getByRole('dialog').contains(document.activeElement))
            .toBe(true);
        view.rerender(<UnsavedChangesDialog {...view.props} open={false} />);
        await vi.waitFor(() => {
            expect(document.activeElement).toBe(trigger);
        });
        trigger.remove();
    });
});
