// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContactRecord } from '../../src/db/database.types';
import { defaultTenantValues, type TenantFormData } from '../../src/components/tenant-form/schema';
import { Tab4Emergency } from '../../src/components/tenant-form/tabs/Tab4Emergency';

const mocks = vi.hoisted(() => ({
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    archive: vi.fn(),
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
        archive: mocks.archive,
    }),
}));

vi.mock('../../src/contacts/useContactList', () => ({
    useContactList: () => ({ ...mocks.listState, refresh: mocks.refresh }),
}));

function contact(overrides: Partial<ContactRecord> = {}): ContactRecord {
    return {
        id: 'contact-1', type: 'person', companyName: '', firstName: 'Mario', lastName: 'Rossi',
        birthDate: '', birthPlace: '', fiscalCode: '', vatNumber: '', email: 'mario@example.test',
        phone: '333123', address: 'Via Roma 1', city: 'Roma', zip: '00100', country: 'IT',
        notes: 'Globale', archived: false, createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z', ...overrides,
    };
}

function Values() {
    const values = useWatch<TenantFormData>({ name: 'TenantEmergencyContacts' });
    return <output data-testid="values">{JSON.stringify(values)}</output>;
}

function Harness({ contacts = [] }: { contacts?: TenantFormData['TenantEmergencyContacts'] }) {
    const methods = useForm<TenantFormData>({
        defaultValues: { ...defaultTenantValues, TenantEmergencyContacts: contacts },
    });
    return <FormProvider {...methods}><Tab4Emergency /><Values /></FormProvider>;
}

const relation = (
    id: string,
    overrides: Partial<TenantFormData['TenantEmergencyContacts'][number]> = {},
): TenantFormData['TenantEmergencyContacts'][number] => ({
    id, contactType: 'person', firstName: id, lastName: 'Test', phone: '333',
    email: '', companyName: '', address: '', city: '', zip: '', country: 'IT',
    comments: '', isPrimary: false, ...overrides,
});

afterEach(cleanup);
beforeEach(() => {
    vi.clearAllMocks();
    mocks.listState.contacts = [];
    mocks.listState.status = 'ready';
    mocks.listState.error = null;
});

describe('Tab4Emergency con rubrica reale', () => {
    it('propone solo Contact attivi con telefono e collega il primo come primary', async () => {
        const user = userEvent.setup();
        mocks.listState.contacts = [
            contact(),
            contact({ id: 'archived', firstName: 'Archived', archived: true }),
            contact({ id: 'no-phone', firstName: 'NoPhone', phone: '' }),
        ];
        render(<Harness />);
        await user.click(screen.getByRole('button', { name: 'Aggiungi un contatto di emergenza' }));
        const select = screen.getByLabelText('Contatto');
        expect(screen.getByRole('option', { name: 'Mario Rossi' })).toBeTruthy();
        expect(screen.queryByRole('option', { name: /Archived/ })).toBeNull();
        expect(screen.queryByRole('option', { name: /NoPhone/ })).toBeNull();
        const firstPrimary = screen.getByLabelText('Imposta come contatto principale') as HTMLInputElement;
        expect(firstPrimary.checked).toBe(true);
        expect(firstPrimary.disabled).toBe(true);
        await user.selectOptions(select, 'contact-1');
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).closest('fieldset')?.disabled).toBe(true);
        await user.type(screen.getByLabelText('Note'), 'Metadata');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        const values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values[0]).toMatchObject({ contactId: 'contact-1', phone: '333123', comments: 'Metadata', isPrimary: true });
        expect(values[0].id).not.toBe('contact-1');
        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('non consente di deselezionare un primary linked e normalizza a exactly-one', async () => {
        const user = userEvent.setup();
        mocks.listState.contacts = [contact()];
        render(<Harness contacts={[
            relation('linked', { contactId: 'contact-1', isPrimary: true }),
            relation('second', { isPrimary: false }),
        ]} />);
        await user.click(screen.getAllByTitle('Modifica')[0]);
        const checkbox = screen.getByLabelText('Imposta come contatto principale') as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
        expect(checkbox.disabled).toBe(true);
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).closest('fieldset')?.disabled).toBe(true);
        await user.type(screen.getByLabelText('Note'), ' confermato');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        const values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values[0]).toMatchObject({ id: 'linked', contactId: 'contact-1', isPrimary: true });
        expect(values.filter((item: { isPrimary: boolean }) => item.isPrimary)).toHaveLength(1);
        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('promuove un legacy non-primary preservando id e senza creare Contact', async () => {
        const user = userEvent.setup();
        render(<Harness contacts={[
            relation('primary', { isPrimary: true }),
            relation('legacy', { firstName: 'Legacy', isPrimary: false }),
        ]} />);
        await user.click(screen.getAllByTitle('Modifica')[1]);
        const checkbox = screen.getByLabelText('Imposta come contatto principale') as HTMLInputElement;
        expect(checkbox.checked).toBe(false);
        expect(checkbox.disabled).toBe(false);
        await user.click(checkbox);
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        const values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values[1]).toMatchObject({ id: 'legacy', isPrimary: true });
        expect(values.filter((item: { isPrimary: boolean }) => item.isPrimary)).toHaveLength(1);
        expect(mocks.create).not.toHaveBeenCalled();
    });

    it('preserva il primary esistente e rende unico un nuovo primary', async () => {
        const user = userEvent.setup();
        mocks.listState.contacts = [contact({ id: 'contact-2', firstName: 'Secondo' })];
        const initial = [relation('first', { isPrimary: true })];
        render(<Harness contacts={initial} />);
        await user.click(screen.getByRole('button', { name: 'Aggiungi un contatto di emergenza' }));
        await user.selectOptions(screen.getByLabelText('Contatto'), 'contact-2');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        let values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values.map((item: { isPrimary: boolean }) => item.isPrimary)).toEqual([true, false]);

        await user.click(screen.getAllByTitle('Modifica')[1]);
        await user.click(screen.getByLabelText('Imposta come contatto principale'));
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values.filter((item: { isPrimary: boolean }) => item.isPrimary)).toHaveLength(1);
    });

    it('toggle stella e delete primary modificano solo le relazioni', async () => {
        const user = userEvent.setup();
        render(<Harness contacts={[
            relation('first', { isPrimary: true }), relation('second'),
        ]} />);
        const stars = screen.getAllByTitle('Imposta come principale');
        await user.click(stars[1]);
        let values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values.map((item: { isPrimary: boolean }) => item.isPrimary)).toEqual([false, true]);
        await user.click(screen.getAllByTitle('Elimina')[1]);
        await user.click(screen.getByRole('button', { name: 'Conferma' }));
        values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values).toHaveLength(1);
        expect(values[0].isPrimary).toBe(true);
        expect(mocks.remove).not.toHaveBeenCalled();
        expect(mocks.archive).not.toHaveBeenCalled();
    });

    it('delete non-primary preserva l’unico primary', async () => {
        const user = userEvent.setup();
        render(<Harness contacts={[
            relation('first', { isPrimary: true }), relation('second'),
        ]} />);
        await user.click(screen.getAllByTitle('Elimina')[1]);
        await user.click(screen.getByRole('button', { name: 'Conferma' }));
        const values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values).toHaveLength(1);
        expect(values[0]).toMatchObject({ id: 'first', isPrimary: true });
        expect(values.filter((item: { isPrimary: boolean }) => item.isPrimary)).toHaveLength(1);
        expect(mocks.remove).not.toHaveBeenCalled();
    });

    it('crea un Contact reale con phone required e lock sul doppio submit', async () => {
        const user = userEvent.setup();
        let resolveCreate!: (value: ContactRecord) => void;
        mocks.create.mockReturnValue(new Promise((resolve) => { resolveCreate = resolve; }));
        render(<Harness />);
        await user.click(screen.getByRole('button', { name: 'Aggiungi un contatto di emergenza' }));
        await user.selectOptions(screen.getByLabelText('Contatto'), 'new');
        await user.type(screen.getByLabelText(/Nome/), 'Anna');
        await user.type(screen.getByLabelText(/Cognome/), 'Bianchi');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(await screen.findByText(/telefono è obbligatorio/i)).toBeTruthy();
        expect(mocks.create).not.toHaveBeenCalled();
        await user.type(screen.getByLabelText(/Telefono/), '555');
        const save = screen.getByRole('button', { name: 'Salva' });
        await user.click(save);
        await user.click(save);
        expect(mocks.create).toHaveBeenCalledOnce();
        resolveCreate(contact({ id: 'created', firstName: 'Anna', lastName: 'Bianchi', phone: '555' }));
        await waitFor(() => expect(screen.getByTestId('values').textContent).toContain('created'));
    });

    it('preserva valori e metadata dopo failure e consente retry', async () => {
        const user = userEvent.setup();
        mocks.create.mockRejectedValueOnce(new Error('Create fallita'))
            .mockResolvedValueOnce(contact({ id: 'retry', firstName: 'Ada', lastName: 'Lovelace', phone: '777' }));
        render(<Harness />);
        await user.click(screen.getByRole('button', { name: 'Aggiungi un contatto di emergenza' }));
        await user.selectOptions(screen.getByLabelText('Contatto'), 'new');
        await user.type(screen.getByLabelText(/Nome/), 'Ada');
        await user.type(screen.getByLabelText(/Cognome/), 'Lovelace');
        await user.type(screen.getByLabelText(/Telefono/), '777');
        await user.type(screen.getByLabelText('Note'), 'Persisti');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect((await screen.findByRole('alert')).textContent).toContain('Create fallita');
        expect((screen.getByLabelText('Note') as HTMLTextAreaElement).value).toBe('Persisti');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(screen.getByTestId('values').textContent).toContain('retry'));
        expect(mocks.create).toHaveBeenCalledTimes(2);
    });

    it('aggiorna i dati canonici senza mutare form o metadata', async () => {
        const user = userEvent.setup();
        mocks.listState.contacts = [contact({ email: 'old@test', phone: '111' })];
        const view = render(<Harness />);
        await user.click(screen.getByRole('button', { name: 'Aggiungi un contatto di emergenza' }));
        await user.selectOptions(screen.getByLabelText('Contatto'), 'contact-1');
        await user.type(screen.getByLabelText('Note'), 'Locale');
        mocks.listState.contacts = [contact({ email: 'new@test', phone: '222' })];
        view.rerender(<Harness />);
        expect((screen.getByLabelText(/Email/) as HTMLInputElement).value).toBe('new@test');
        expect((screen.getByLabelText(/Telefono/) as HTMLInputElement).value).toBe('222');
        expect((screen.getByLabelText('Note') as HTMLTextAreaElement).value).toBe('Locale');
        expect(screen.getByTestId('values').textContent).toBe('[]');
    });

    it.each([
        ['archived', contact({ archived: true }), /archiviato/i],
        ['missing', null, /Contatto non disponibile/i],
        ['phone removed', contact({ phone: '' }), /non ha un telefono/i],
    ] as const)('blocca selected %s senza mutation', async (_case, next, message) => {
        const user = userEvent.setup();
        mocks.listState.contacts = [contact()];
        const view = render(<Harness />);
        await user.click(screen.getByRole('button', { name: 'Aggiungi un contatto di emergenza' }));
        await user.selectOptions(screen.getByLabelText('Contatto'), 'contact-1');
        mocks.listState.contacts = next ? [next] : [];
        view.rerender(<Harness />);
        expect(screen.getAllByText(message).length).toBeGreaterThan(0);
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).closest('fieldset')?.disabled).toBe(true);
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(screen.getByTestId('values').textContent).toBe('[]');
        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('preserva selezione durante loading/error e offre retry', async () => {
        const user = userEvent.setup();
        mocks.listState.contacts = [contact()];
        const view = render(<Harness />);
        await user.click(screen.getByRole('button', { name: 'Aggiungi un contatto di emergenza' }));
        await user.selectOptions(screen.getByLabelText('Contatto'), 'contact-1');
        mocks.listState.status = 'loading';
        view.rerender(<Harness />);
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(mocks.create).not.toHaveBeenCalled();
        mocks.listState.status = 'error';
        mocks.listState.error = 'Errore rubrica';
        mocks.listState.contacts = [];
        view.rerender(<Harness />);
        await user.click(screen.getByRole('button', { name: 'Riprova' }));
        expect(mocks.refresh).toHaveBeenCalledOnce();
        expect(screen.getByTestId('values').textContent).toBe('[]');
    });

    it('preserva linked e legacy, edit linked cambia solo metadata', async () => {
        const user = userEvent.setup();
        mocks.listState.contacts = [contact()];
        render(<Harness contacts={[
            relation('linked', { contactId: 'contact-1', firstName: 'Snapshot', isPrimary: true, comments: 'Prima' }),
            relation('legacy', { firstName: 'Legacy' }),
        ]} />);
        expect(screen.getByText('Mario Rossi')).toBeTruthy();
        expect(screen.getByText('Legacy Test')).toBeTruthy();
        await user.click(screen.getAllByTitle('Modifica')[0]);
        expect((screen.getByLabelText(/Nome/) as HTMLInputElement).closest('fieldset')?.disabled).toBe(true);
        await user.clear(screen.getByLabelText('Note'));
        await user.type(screen.getByLabelText('Note'), 'Dopo');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        const values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values[0]).toMatchObject({ id: 'linked', contactId: 'contact-1', comments: 'Dopo' });
        expect(mocks.create).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('impedisce una sesta relazione', () => {
        render(<Harness contacts={Array.from({ length: 5 }, (_, index) => relation(`r-${index}`, { isPrimary: index === 0 }))} />);
        expect(screen.queryByRole('button', { name: 'Aggiungi un contatto di emergenza' })).toBeNull();
        expect(screen.getByText(/numero massimo/)).toBeTruthy();
    });
});
