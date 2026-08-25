// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultPropertyValues, type PropertyFormData } from '../../src/components/property-form/schema';
import { Tab2Additional } from '../../src/components/property-form/tabs/Tab2Additional';
import { Tab4Passwords } from '../../src/components/property-form/tabs/Tab4Passwords';
import { Tab5Contracts } from '../../src/components/property-form/tabs/Tab5Contracts';

const mockGenerateId = vi.fn<(prefix?: string) => string>();
vi.mock('../../src/utils/id', () => ({ generateId: (prefix?: string) => mockGenerateId(prefix) }));

function Snapshot() {
    const { watch } = useFormContext<PropertyFormData>();
    return <pre data-testid="state">{JSON.stringify(watch())}</pre>;
}

function Harness({ children }: { children: React.ReactNode }) {
    const methods = useForm<PropertyFormData>({ defaultValues: structuredClone(defaultPropertyValues) });
    return <FormProvider {...methods}>{children}<Snapshot /></FormProvider>;
}

const state = () => JSON.parse(screen.getByTestId('state').textContent || '{}') as PropertyFormData;
const file = (name: string) => new File(['content'], name, { type: 'application/pdf', lastModified: 123 });

beforeEach(() => {
    const counts: Record<string, number> = {};
    mockGenerateId.mockImplementation((prefix = 'record') => {
        counts[prefix] = (counts[prefix] || 0) + 1;
        return `${prefix}-uuid-${counts[prefix]}`;
    });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('ID annidati Unit nei componenti reali', () => {
    it('genera il documento catastale all’acquisizione e lo preserva fino alla sostituzione', async () => {
        const view = render(<Harness><Tab2Additional /></Harness>);
        const input = screen.getByLabelText('Seleziona un documento catastale') as HTMLInputElement;
        await userEvent.upload(input, file('catasto-1.pdf'));
        await waitFor(() => expect(state().PropertyCadastreDocument?.id).toBe('cadastre-file-uuid-1'));
        view.rerender(<Harness><Tab2Additional /></Harness>);
        expect(state().PropertyCadastreDocument?.id).toBe('cadastre-file-uuid-1');
        await userEvent.click(screen.getByRole('button', { name: 'Rimuovi' }));
        await userEvent.upload(screen.getByLabelText('Seleziona un documento catastale'), file('catasto-2.pdf'));
        await waitFor(() => expect(state().PropertyCadastreDocument?.id).toBe('cadastre-file-uuid-2'));
    });

    it('genera una key al salvataggio e preserva l’ID in edit e rerender', async () => {
        const view = render(<Harness><Tab4Passwords /></Harness>);
        await userEvent.click(screen.getByRole('button', { name: 'Aggiungi un altro elemento' }));
        await userEvent.type(screen.getByLabelText('Descrizione'), 'Portone');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(state().PropertyKeys[0]?.id).toBe('key-uuid-1'));
        view.rerender(<Harness><Tab4Passwords /></Harness>);
        const card = screen.getByText('Portone').closest('.group') as HTMLElement;
        await userEvent.click(card.querySelector('button') as HTMLButtonElement);
        await userEvent.clear(screen.getByLabelText('Descrizione'));
        await userEvent.type(screen.getByLabelText('Descrizione'), 'Portone edit');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(state().PropertyKeys[0]).toMatchObject({ id: 'key-uuid-1', description: 'Portone edit' }));
        expect(mockGenerateId).toHaveBeenCalledTimes(1);
    });

    it('preserva contract e file in edit, rigenerando solo il file sostituito', async () => {
        render(<Harness><Tab5Contracts /></Harness>);
        await userEvent.click(screen.getByRole('button', { name: 'Aggiungi un documento' }));
        await userEvent.type(screen.getByLabelText('Descrizione'), 'Contratto');
        await userEvent.upload(document.getElementById('contract-file-input') as HTMLInputElement, file('contract-1.pdf'));
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(state().PropertyContracts[0]).toMatchObject({ id: 'contract-uuid-1', file: { id: 'file-uuid-1' } }));

        let card = screen.getByText('Contratto').closest('.group') as HTMLElement;
        await userEvent.click(card.querySelector('button') as HTMLButtonElement);
        await userEvent.clear(screen.getByLabelText('Descrizione'));
        await userEvent.type(screen.getByLabelText('Descrizione'), 'Contratto edit');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(state().PropertyContracts[0]).toMatchObject({ id: 'contract-uuid-1', file: { id: 'file-uuid-1' } }));

        card = screen.getByText('Contratto edit').closest('.group') as HTMLElement;
        await userEvent.click(card.querySelector('button') as HTMLButtonElement);
        await userEvent.upload(document.getElementById('contract-file-input') as HTMLInputElement, file('contract-2.pdf'));
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(state().PropertyContracts[0]).toMatchObject({ id: 'contract-uuid-1', file: { id: 'file-uuid-2' } }));
    });
});
