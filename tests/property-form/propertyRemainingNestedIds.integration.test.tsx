// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultPropertyValues, type PropertyFormData } from '../../src/components/property-form/schema';
import { Tab7Photos } from '../../src/components/property-form/tabs/Tab7Photos';
import { Tab8Contacts } from '../../src/components/property-form/tabs/Tab8Contacts';
import { Tab9Documents } from '../../src/components/property-form/tabs/Tab9Documents';

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
const image = () => new File(['image'], 'photo.png', { type: 'image/png', lastModified: 123 });
const documentFile = (name: string) => new File(['document'], name, { type: 'application/pdf', lastModified: 456 });

beforeEach(() => {
    const counts: Record<string, number> = {};
    mockGenerateId.mockImplementation((prefix = 'record') => {
        counts[prefix] = (counts[prefix] || 0) + 1;
        return `${prefix}-uuid-${counts[prefix]}`;
    });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('ID canonici restanti nei componenti Unit', () => {
    it('preserva la foto su rerender e duplicato, generandone una nuova dopo remove', async () => {
        const view = render(<Harness><Tab7Photos /></Harness>);
        const input = document.getElementById('photo-upload') as HTMLInputElement;
        await userEvent.upload(input, image());
        await waitFor(() => expect(state().PropertyPhotos[0]?.id).toBe('photo-uuid-1'));
        view.rerender(<Harness><Tab7Photos /></Harness>);
        expect(state().PropertyPhotos[0]?.id).toBe('photo-uuid-1');

        await userEvent.upload(document.getElementById('photo-upload') as HTMLInputElement, image());
        await waitFor(() => expect(state().PropertyPhotos).toHaveLength(1));
        expect(state().PropertyPhotos[0]?.id).toBe('photo-uuid-1');

        const card = screen.getByAltText('photo.png').closest('div.flex.items-center') as HTMLElement;
        await userEvent.click(card.querySelector('button') as HTMLButtonElement);
        await waitFor(() => expect(state().PropertyPhotos).toHaveLength(0));
        await userEvent.upload(document.getElementById('photo-upload') as HTMLInputElement, image());
        await waitFor(() => expect(state().PropertyPhotos[0]?.id).toBe('photo-uuid-2'));
    });

    it('genera il contatto al salvataggio e preserva l’ID in edit e rerender', async () => {
        const view = render(<Harness><Tab8Contacts /></Harness>);
        await userEvent.click(screen.getByRole('button', { name: 'Aggiungere un contatto' }));
        await userEvent.type(screen.getByLabelText('Nome *'), 'Ada');
        await userEvent.type(screen.getByLabelText('Cognome *'), 'Rossi');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(state().PropertyContacts[0]?.id).toBe('contact-uuid-1'));
        view.rerender(<Harness><Tab8Contacts /></Harness>);

        const card = screen.getByText('Ada Rossi').closest('.group') as HTMLElement;
        await userEvent.click(card.querySelector('button') as HTMLButtonElement);
        await userEvent.clear(screen.getByLabelText('Nome *'));
        await userEvent.type(screen.getByLabelText('Nome *'), 'Anna');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(state().PropertyContacts[0]).toMatchObject({ id: 'contact-uuid-1', firstName: 'Anna' }));
        expect(mockGenerateId).toHaveBeenCalledTimes(1);
    });

    it('preserva documento e file in edit, rigenerando solo il file sostituito', async () => {
        render(<Harness><Tab9Documents /></Harness>);
        await userEvent.click(screen.getByRole('button', { name: 'Aggiungi un documento' }));
        await userEvent.type(screen.getByLabelText('Descrizione'), 'Fattura');
        await userEvent.upload(document.getElementById('document-file-input') as HTMLInputElement, documentFile('file-1.pdf'));
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(state().PropertyDocuments[0]).toMatchObject({ id: 'document-uuid-1', file: { id: 'file-uuid-1' } }));

        let card = screen.getByText('Fattura').closest('.group') as HTMLElement;
        await userEvent.click(card.querySelector('button') as HTMLButtonElement);
        await userEvent.clear(screen.getByLabelText('Descrizione'));
        await userEvent.type(screen.getByLabelText('Descrizione'), 'Fattura edit');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(state().PropertyDocuments[0]).toMatchObject({ id: 'document-uuid-1', file: { id: 'file-uuid-1' } }));

        card = screen.getByText('Fattura edit').closest('.group') as HTMLElement;
        await userEvent.click(card.querySelector('button') as HTMLButtonElement);
        await userEvent.upload(document.getElementById('document-file-input') as HTMLInputElement, documentFile('file-2.pdf'));
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(state().PropertyDocuments[0]).toMatchObject({ id: 'document-uuid-1', file: { id: 'file-uuid-2' } }));
    });
});
