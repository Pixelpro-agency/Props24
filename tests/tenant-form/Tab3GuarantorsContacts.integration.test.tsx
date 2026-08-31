// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContactRecord } from '../../src/db/database.types';
import type { TenantFormData } from '../../src/components/tenant-form/schema';
import { defaultTenantValues } from '../../src/components/tenant-form/schema';
import { Tab3Guarantors } from '../../src/components/tenant-form/tabs/Tab3Guarantors';

const mocks = vi.hoisted(() => ({
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    refresh: vi.fn(),
    listState: {
        contacts: [] as ContactRecord[],
        status: 'ready' as 'idle' | 'loading' | 'ready' | 'error',
        error: null as string | null,
    },
}));

vi.mock('../../src/contacts/ContactRepositoryContext', () => ({
    useContactRepository: () => ({
        create: mocks.create,
        update: mocks.update,
        delete: mocks.remove,
    }),
}));

vi.mock('../../src/contacts/useContactList', () => ({
    useContactList: () => ({ ...mocks.listState, refresh: mocks.refresh }),
}));

function contact(overrides: Partial<ContactRecord> = {}): ContactRecord {
    return {
        id: 'contact-1',
        type: 'person',
        companyName: '',
        firstName: 'Mario',
        lastName: 'Rossi',
        birthDate: '1980-01-01',
        birthPlace: 'Roma',
        fiscalCode: '',
        vatNumber: '',
        email: 'mario@example.test',
        phone: '333123',
        address: 'Via Roma 1',
        city: 'Roma',
        zip: '00100',
        country: 'IT',
        notes: 'Nota globale',
        archived: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    };
}

function Values() {
    const guarantors = useWatch<TenantFormData>({ name: 'TenantGuarantors' });
    return <output data-testid="values">{JSON.stringify(guarantors)}</output>;
}

function Harness({ guarantors = [] }: { guarantors?: TenantFormData['TenantGuarantors'] }) {
    const methods = useForm<TenantFormData>({
        defaultValues: { ...defaultTenantValues, TenantGuarantors: guarantors },
    });
    return <FormProvider {...methods}><Tab3Guarantors /><Values /></FormProvider>;
}

afterEach(cleanup);

beforeEach(() => {
    vi.clearAllMocks();
    mocks.listState.contacts = [];
    mocks.listState.status = 'ready';
    mocks.listState.error = null;
});

describe('Tab3Guarantors con rubrica reale', () => {
    it('mostra solo Contact attivi e collega quello esistente senza mutation', async () => {
        const user = userEvent.setup();
        mocks.listState.contacts = [contact(), contact({ id: 'archived-contact', firstName: 'Archiviato', archived: true })];
        render(<Harness />);

        await user.click(screen.getByRole('button', { name: 'Aggiungi un garante' }));
        const select = screen.getByLabelText('Garante');
        expect(screen.getByRole('option', { name: 'Mario Rossi' })).toBeTruthy();
        expect(screen.queryByRole('option', { name: /Archiviato/ })).toBeNull();
        await user.selectOptions(select, 'contact-1');
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).closest('fieldset')?.disabled).toBe(true);
        expect((screen.getByLabelText(/Cognome/) as HTMLInputElement).closest('fieldset')?.disabled).toBe(true);
        expect((screen.getByLabelText('Note') as HTMLTextAreaElement).disabled).toBe(false);
        await user.type(screen.getByLabelText('Note'), 'Metadata relazione');
        await user.click(screen.getByRole('button', { name: 'Salva' }));

        const values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values).toHaveLength(1);
        expect(values[0]).toMatchObject({
            contactId: 'contact-1',
            firstName: 'Mario',
            comments: 'Metadata relazione',
        });
        expect(values[0].id).not.toBe('contact-1');
        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('resetta lo snapshot tornando alla option vuota e crea soltanto dai nuovi dati', async () => {
        const user = userEvent.setup();
        mocks.listState.contacts = [contact()];
        mocks.create.mockResolvedValue(contact({
            id: 'new-contact',
            firstName: 'Nuovo',
            lastName: 'Garante',
            email: '',
        }));
        render(<Harness />);

        await user.click(screen.getByRole('button', { name: 'Aggiungi un garante' }));
        const select = screen.getByLabelText('Garante');
        await user.selectOptions(select, 'contact-1');
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).value).toBe('Mario');
        await user.selectOptions(select, '');
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).value).toBe('');
        expect((screen.getByLabelText(/Cognome/) as HTMLInputElement).value).toBe('');
        expect((screen.getByLabelText(/Email/) as HTMLInputElement).value).toBe('');

        await user.type(screen.getByLabelText(/Nome/), 'Nuovo');
        await user.type(screen.getByLabelText(/Cognome/), 'Garante');
        await user.click(screen.getByRole('button', { name: 'Salva' }));

        expect(mocks.create).toHaveBeenCalledOnce();
        expect(mocks.create.mock.calls[0][0]).toMatchObject({
            firstName: 'Nuovo',
            lastName: 'Garante',
            email: '',
        });
        expect(mocks.create.mock.calls[0][0]).not.toMatchObject({ email: 'mario@example.test' });
        expect(screen.getByTestId('values').textContent).toContain('new-contact');
    });

    it('sostituisce integralmente A con B e collega B senza mutation Contact', async () => {
        const user = userEvent.setup();
        mocks.listState.contacts = [
            contact({ id: 'contact-a', firstName: 'Alice', lastName: 'A', email: 'a@example.test' }),
            contact({ id: 'contact-b', firstName: 'Bruno', lastName: 'B', email: 'b@example.test' }),
        ];
        render(<Harness />);

        await user.click(screen.getByRole('button', { name: 'Aggiungi un garante' }));
        const select = screen.getByLabelText('Garante');
        await user.selectOptions(select, 'contact-a');
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).value).toBe('Alice');
        await user.selectOptions(select, 'contact-b');
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).value).toBe('Bruno');
        expect((screen.getByLabelText(/Cognome/) as HTMLInputElement).value).toBe('B');
        expect((screen.getByLabelText(/Email/) as HTMLInputElement).value).toBe('b@example.test');
        expect(screen.queryByDisplayValue('a@example.test')).toBeNull();
        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();

        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(screen.getByTestId('values').textContent).toContain('contact-b');
        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('riflette i dati canonici aggiornati dopo refresh preservando comments e form', async () => {
        const user = userEvent.setup();
        mocks.listState.contacts = [contact({ email: 'old@example.test' })];
        const view = render(<Harness />);
        await user.click(screen.getByRole('button', { name: 'Aggiungi un garante' }));
        await user.selectOptions(screen.getByLabelText('Garante'), 'contact-1');
        await user.type(screen.getByLabelText('Note'), 'Commento tenant');
        expect((screen.getByLabelText(/Email/) as HTMLInputElement).value).toBe('old@example.test');

        mocks.listState.contacts = [contact({ email: 'new@example.test' })];
        view.rerender(<Harness />);

        expect((screen.getByLabelText(/Email/) as HTMLInputElement).value).toBe('new@example.test');
        expect((screen.getByLabelText('Note') as HTMLTextAreaElement).value).toBe('Commento tenant');
        expect(screen.getByTestId('values').textContent).toBe('[]');
        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('blocca il salvataggio se il Contact selezionato diventa archiviato', async () => {
        const user = userEvent.setup();
        mocks.listState.contacts = [contact()];
        const view = render(<Harness />);
        await user.click(screen.getByRole('button', { name: 'Aggiungi un garante' }));
        await user.selectOptions(screen.getByLabelText('Garante'), 'contact-1');

        mocks.listState.contacts = [contact({ archived: true })];
        view.rerender(<Harness />);

        expect(screen.getByText(/archiviato e non è più utilizzabile/)).toBeTruthy();
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).closest('fieldset')?.disabled).toBe(true);
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(screen.getByTestId('values').textContent).toBe('[]');
        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('mantiene snapshot e identità se il Contact selezionato diventa missing', async () => {
        const user = userEvent.setup();
        mocks.listState.contacts = [contact()];
        const view = render(<Harness />);
        await user.click(screen.getByRole('button', { name: 'Aggiungi un garante' }));
        await user.selectOptions(screen.getByLabelText('Garante'), 'contact-1');

        mocks.listState.contacts = [];
        view.rerender(<Harness />);

        expect(screen.getAllByText('Contatto non disponibile').length).toBeGreaterThan(0);
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).value).toBe('Mario');
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).closest('fieldset')?.disabled).toBe(true);
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(screen.getByTestId('values').textContent).toBe('[]');
        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();

        await user.selectOptions(screen.getByLabelText('Garante'), '');
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).value).toBe('');
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).closest('fieldset')?.disabled).toBe(false);
    });

    it('non converte la selezione in new durante loading o error e consente retry', async () => {
        const user = userEvent.setup();
        mocks.listState.contacts = [contact()];
        const view = render(<Harness />);
        await user.click(screen.getByRole('button', { name: 'Aggiungi un garante' }));
        await user.selectOptions(screen.getByLabelText('Garante'), 'contact-1');

        mocks.listState.status = 'loading';
        view.rerender(<Harness />);
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).closest('fieldset')?.disabled).toBe(true);
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(mocks.create).not.toHaveBeenCalled();
        expect(screen.getByTestId('values').textContent).toBe('[]');

        mocks.listState.status = 'error';
        mocks.listState.error = 'Errore refresh';
        mocks.listState.contacts = [];
        view.rerender(<Harness />);
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).value).toBe('Mario');
        await user.click(screen.getByRole('button', { name: 'Riprova' }));
        expect(mocks.refresh).toHaveBeenCalledOnce();
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
        expect(screen.getByTestId('values').textContent).toBe('[]');
    });

    it('crea il Contact una sola volta e appende soltanto dopo il successo', async () => {
        const user = userEvent.setup();
        let resolveCreate!: (value: ContactRecord) => void;
        mocks.create.mockReturnValue(new Promise((resolve) => { resolveCreate = resolve; }));
        render(<Harness />);

        await user.click(screen.getByRole('button', { name: 'Aggiungi un garante' }));
        await user.selectOptions(screen.getByLabelText('Garante'), 'new');
        await user.type(screen.getByLabelText(/Nome/), 'Anna');
        await user.type(screen.getByLabelText(/Cognome/), 'Bianchi');
        const save = screen.getByRole('button', { name: 'Salva' });
        await user.click(save);
        await user.click(save);
        expect(mocks.create).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('values').textContent).toBe('[]');

        resolveCreate(contact({ id: 'created-contact', firstName: 'Anna', lastName: 'Bianchi' }));
        await waitFor(() => expect(screen.getByTestId('values').textContent).toContain('created-contact'));
        expect(JSON.parse(screen.getByTestId('values').textContent || '[]')).toHaveLength(1);
    });

    it('preserva dati e modal dopo errore, poi consente il retry', async () => {
        const user = userEvent.setup();
        mocks.create
            .mockRejectedValueOnce(new Error('Creazione non riuscita'))
            .mockResolvedValueOnce(contact({ id: 'retry-contact', firstName: 'Ada', lastName: 'Lovelace' }));
        render(<Harness />);

        await user.click(screen.getByRole('button', { name: 'Aggiungi un garante' }));
        await user.selectOptions(screen.getByLabelText('Garante'), 'new');
        await user.type(screen.getByLabelText(/Nome/), 'Ada');
        await user.type(screen.getByLabelText(/Cognome/), 'Lovelace');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect((await screen.findByRole('alert')).textContent).toContain('Creazione non riuscita');
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).value).toBe('Ada');
        expect(screen.getByTestId('values').textContent).toBe('[]');

        await user.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(screen.getByTestId('values').textContent).toContain('retry-contact'));
        expect(mocks.create).toHaveBeenCalledTimes(2);
    });

    it('preserva riferimenti archived, missing e legacy senza matching o create', async () => {
        const archived = contact({ id: 'archived-contact', archived: true, firstName: 'Canonico' });
        mocks.listState.contacts = [archived, contact({ id: 'legacy-relation', firstName: 'Legacy' })];
        render(<Harness guarantors={[
            { id: 'relation-a', contactId: 'archived-contact', contactType: 'person', firstName: 'Snapshot', lastName: 'A' },
            { id: 'relation-m', contactId: 'missing-contact', contactType: 'person', firstName: 'Fallback', lastName: 'M' },
            { id: 'legacy-relation', contactType: 'person', firstName: 'Legacy', lastName: 'Inline' },
        ] as TenantFormData['TenantGuarantors']} />);

        expect(screen.getByText('Canonico Rossi')).toBeTruthy();
        expect(screen.getByText('Archiviato')).toBeTruthy();
        expect(screen.getByText('Fallback M')).toBeTruthy();
        expect(screen.getByText('Contatto non disponibile')).toBeTruthy();
        expect(screen.getByText('Legacy Inline')).toBeTruthy();
        expect(screen.getByTestId('values').textContent).toContain('missing-contact');
        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('mantiene il form durante errore e retry aggiorna solo la rubrica', async () => {
        const user = userEvent.setup();
        mocks.listState.status = 'error';
        mocks.listState.error = 'Rubrica non disponibile';
        render(<Harness guarantors={[
            { id: 'relation-1', contactId: 'missing-contact', contactType: 'person', firstName: 'Mario', lastName: 'Snapshot' },
        ] as TenantFormData['TenantGuarantors']} />);

        await user.click(screen.getByRole('button', { name: 'Aggiungi un garante' }));
        await user.click(screen.getByRole('button', { name: 'Riprova' }));
        expect(mocks.refresh).toHaveBeenCalledOnce();
        expect(screen.getByTestId('values').textContent).toContain('relation-1');
        expect(mocks.create).not.toHaveBeenCalled();
    });

    it('modifica solo i commenti della relazione linked senza aggiornare il Contact', async () => {
        const user = userEvent.setup();
        mocks.listState.contacts = [contact()];
        render(<Harness guarantors={[
            {
                id: 'relation-1',
                contactId: 'contact-1',
                contactType: 'person',
                firstName: 'Snapshot',
                lastName: 'Originale',
                comments: 'Prima',
            },
        ] as TenantFormData['TenantGuarantors']} />);

        await user.click(screen.getByTitle('Modifica'));
        const comments = screen.getByDisplayValue('Prima');
        await user.clear(comments);
        await user.type(comments, 'Dopo');
        await user.click(screen.getByRole('button', { name: 'Salva' }));

        const values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values[0]).toMatchObject({
            id: 'relation-1',
            contactId: 'contact-1',
            firstName: 'Snapshot',
            comments: 'Dopo',
        });
        expect(mocks.update).not.toHaveBeenCalled();
        expect(mocks.create).not.toHaveBeenCalled();
    });
});
