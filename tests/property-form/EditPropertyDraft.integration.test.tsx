// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EditPropertyPage } from '../../src/pages/EditPropertyPage';
import { defaultPropertyValues, type PropertyFormState } from '../../src/components/property-form/schema';
import type { DraftRecord, DraftRepository } from '../../src/db/draftRepository.port';
import type { PropertyRecord } from '../../src/db/database.types';

const mocks = vi.hoisted(() => ({
    getRecord: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    repository: null as DraftRepository | null,
}));

vi.mock('../../src/auth/AuthContext', () => ({
    useAuth: () => ({ account: { id: 'user-001' }, isInitializing: false }),
}));
vi.mock('../../src/db/propertyRepository', () => ({
    getPropertyRecordById: (id: string) => mocks.getRecord(id),
    updateProperty: (...args: unknown[]) => mocks.update(...args),
    createProperty: (...args: unknown[]) => mocks.create(...args),
}));
vi.mock('../../src/drafts/DraftRepositoryContext', () => ({
    useDraftRepository: () => mocks.repository,
}));
vi.mock('../../src/components/property-form/ui/AddressAutocomplete', () => ({
    AddressAutocomplete: ({ name, label }: { name: keyof PropertyFormState; label?: string }) => {
        const { register } = useFormContext<PropertyFormState>();
        return <input aria-label={label || 'Indirizzo'} {...register(name)} />;
    },
}));

const nestedFile = (id: string) => ({ id, name: id, type: 'text/plain', size: 1, lastModified: 1, dataUrl: 'data:test' });

function property(id = 'property-A'): PropertyRecord {
    return {
        id,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        archived: true,
        formData: {
            ...defaultPropertyValues,
            PropertyTypeID: 'appartamento',
            PropertyTitle: `Persistita ${id}`,
            PropertyAddress: 'Via Roma 1',
            PropertyCity: 'Roma',
            PropertyPostalCode: '00100',
            PropertyCadastreDocument: nestedFile('cadastre'),
            PropertyKeys: [{ id: 'key', description: '', number: '', quantity: 1, holder: '', comments: '' }],
            PropertyContracts: [{ id: 'contract', type: '', description: '', releaseDate: '', expiryDate: '', comments: '', file: nestedFile('contract-file') }],
            PropertyPhotos: [nestedFile('photo')],
            PropertyContacts: [{ id: 'contact', firstName: '', lastName: '', profession: '', email: '', phone: '', comments: '' }],
            PropertyDocuments: [{ id: 'document', type: '', description: '', releaseDate: '', comments: '', shared: false, file: nestedFile('document-file') }],
        },
        relations: { buildingId: 'building-A', tenantIds: ['tenant-A'], leaseIds: ['lease-A'] },
        notes: [],
        activities: [],
    };
}

function draft(payload: PropertyFormState, entityId = 'property-A'): DraftRecord<PropertyFormState> {
    return {
        id: `draft-${entityId}`,
        accountId: 'user-001',
        formType: 'property',
        mode: 'edit',
        entityId,
        payload: structuredClone(payload),
        schemaVersion: 2,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
}

function makeRepository(initial: DraftRecord<PropertyFormState> | null = null) {
    const records = new Map<string, DraftRecord<PropertyFormState>>();
    if (initial) records.set(`${initial.mode}:${initial.entityId}`, initial);
    const repository: DraftRepository = {
        get: vi.fn(async (_definition, key) => records.get(`${key.mode}:${key.entityId ?? null}`) ?? null),
        list: vi.fn(async () => [...records.values()]),
        save: vi.fn(async (_definition, input) => {
            const saved = draft(input.payload as PropertyFormState, input.entityId as string);
            records.set(`${input.mode}:${input.entityId ?? null}`, saved);
            return saved;
        }),
        delete: vi.fn(async (key) => records.delete(`${key.mode}:${key.entityId}`)),
    };
    mocks.repository = repository;
    return { repository, records };
}

function renderEdit(id = 'property-A') {
    const router = createMemoryRouter([
        { path: '/origin', element: <p>Origine</p> },
        { path: '/properties/units/:id/edit', element: <EditPropertyPage /> },
        { path: '/properties/units/:id', element: <p>Dettaglio</p> },
    ], { initialEntries: ['/origin', `/properties/units/${id}/edit`] });
    render(<RouterProvider router={router} />);
    return router;
}

async function ready() {
    return screen.findByLabelText(/Identificativo/);
}

beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRecord.mockImplementation((id: string) => property(id));
    mocks.update.mockImplementation((id: string, data: PropertyRecord['formData']) => ({ ...property(id), formData: data }));
    makeRepository();
});

afterEach(() => cleanup());

describe('B6.3 draft edit entity-scoped', () => {
    it('mostra il load-error edit e riprova la stessa chiave senza write', async () => {
        const { repository } = makeRepository();
        vi.mocked(repository.get).mockRejectedValue(new Error('generic load failure'));
        renderEdit();
        expect(await screen.findByText('Impossibile caricare la bozza di modifica dell’unità.')).toBeTruthy();
        expect(screen.queryByText(/nuova unità/i)).toBeNull();
        expect(repository.get).toHaveBeenCalledWith(expect.anything(), {
            mode: 'edit',
            entityId: 'property-A',
        });
        await userEvent.click(screen.getByRole('button', { name: 'Riprova' }));
        await waitFor(() => expect(repository.get).toHaveBeenCalledTimes(2));
        expect(repository.get).toHaveBeenLastCalledWith(expect.anything(), {
            mode: 'edit',
            entityId: 'property-A',
        });
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('apre la baseline clean, legge solo la chiave edit e non esegue autosave', async () => {
        const { repository } = makeRepository();
        renderEdit();
        const title = await ready();
        expect((title as HTMLInputElement).value).toBe('Persistita property-A');
        expect(repository.get).toHaveBeenCalledWith(expect.anything(), { mode: 'edit', entityId: 'property-A' });
        await userEvent.type(title, ' nuova');
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(repository.save).not.toHaveBeenCalled();
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('isola draft create e draft edit di Unit differenti', async () => {
        const { repository, records } = makeRepository();
        records.set('create:null', draft({ ...defaultPropertyValues, PropertyBuildingId: '', PropertyTitle: 'Create', PropertyAddress: 'A', PropertyCity: 'C', PropertyPostalCode: 'P' }, 'property-create'));
        records.set('edit:property-B', draft({ ...defaultPropertyValues, PropertyBuildingId: '', PropertyTitle: 'Unit B', PropertyAddress: 'B', PropertyCity: 'C', PropertyPostalCode: 'P' }, 'property-B'));
        renderEdit('property-A');
        expect((await ready() as HTMLInputElement).value).toBe('Persistita property-A');
        expect(repository.get).toHaveBeenCalledWith(expect.anything(), { mode: 'edit', entityId: 'property-A' });
        expect(records.has('create:null')).toBe(true);
        expect(records.has('edit:property-B')).toBe(true);
    });

    it('mostra il dialog edit, riprende la bozza clean e vincola PropertyBuildingId', async () => {
        makeRepository(draft({
            ...property().formData,
            PropertyBuildingId: 'building-manipolato',
            PropertyTitle: 'Titolo bozza',
        }));
        renderEdit();
        expect(await screen.findByText('Bozza modifica unità disponibile')).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: 'Riprendi bozza' }));
        expect((await ready() as HTMLInputElement).value).toBe('Titolo bozza');
        await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
        await waitFor(() => expect(screen.queryByText('Modifiche non salvate')).toBeNull());
    });

    it('elimina esclusivamente la bozza corrente e ripristina la baseline persistita', async () => {
        const { repository, records } = makeRepository(draft({ ...property().formData, PropertyBuildingId: 'evil', PropertyTitle: 'Bozza A' }));
        records.set('edit:property-B', draft({ ...property('property-B').formData, PropertyBuildingId: '', PropertyTitle: 'Bozza B' }, 'property-B'));
        renderEdit();
        await screen.findByText('Bozza modifica unità disponibile');
        await userEvent.click(screen.getByRole('button', { name: 'Elimina bozza e ripristina' }));
        expect((await ready() as HTMLInputElement).value).toBe('Persistita property-A');
        expect(repository.delete).toHaveBeenCalledWith({ formType: 'property', mode: 'edit', entityId: 'property-A' });
        expect(records.has('edit:property-B')).toBe(true);
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('salva manualmente una sola bozza edit, rende clean e preserva gli otto nested ID', async () => {
        const { repository } = makeRepository();
        renderEdit();
        const title = await ready();
        await userEvent.clear(title);
        await userEvent.type(title, 'Bozza manuale');
        await userEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await screen.findByText('Bozza salvata.');
        expect(repository.save).toHaveBeenCalledOnce();
        const input = vi.mocked(repository.save).mock.calls[0][1];
        expect(input).toMatchObject({ mode: 'edit', entityId: 'property-A' });
        const payload = input.payload as PropertyFormState;
        expect(payload.PropertyBuildingId).toBe('building-A');
        expect([payload.PropertyCadastreDocument?.id, payload.PropertyKeys[0].id, payload.PropertyContracts[0].id, payload.PropertyContracts[0].file?.id, payload.PropertyPhotos[0].id, payload.PropertyContacts[0].id, payload.PropertyDocuments[0].id, payload.PropertyDocuments[0].file?.id])
            .toEqual(['cadastre', 'key', 'contract', 'contract-file', 'photo', 'contact', 'document', 'document-file']);
        expect(mocks.update).not.toHaveBeenCalled();
    });
});

describe('B6.3 guard edit', () => {
    it('naviga clean senza dialog e protegge dirty con Resta e Abbandona', async () => {
        const router = renderEdit();
        const title = await ready();
        await userEvent.type(title, ' dirty');
        await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
        expect(await screen.findByText('Modifiche non salvate')).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: 'Resta' }));
        expect(router.state.location.pathname).toBe('/properties/units/property-A/edit');
        expect((title as HTMLInputElement).value).toContain('dirty');
        await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Abbandona' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/origin'));
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('Salva bozza dal guard salva una volta e procede alla destinazione originale', async () => {
        const { repository } = makeRepository();
        const router = renderEdit();
        await userEvent.type(await ready(), ' dirty');
        await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Salva bozza' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/origin'));
        expect(repository.save).toHaveBeenCalledOnce();
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('beforeunload blocca solo quando dirty e torna clean dopo Salva bozza', async () => {
        const listeners: EventListener[] = [];
        const originalAddEventListener = window.addEventListener.bind(window);
        const add = vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
            if (type === 'beforeunload') listeners.push(listener as EventListener);
            return originalAddEventListener(type, listener, options);
        });
        renderEdit();
        const title = await ready();
        const clean = new Event('beforeunload', { cancelable: true });
        listeners.at(-1)?.call(window, clean);
        expect(clean.defaultPrevented).toBe(false);
        await userEvent.type(title, ' dirty');
        const dirty = new Event('beforeunload', { cancelable: true });
        listeners.at(-1)?.call(window, dirty);
        expect(dirty.defaultPrevented).toBe(true);
        await userEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await screen.findByText('Bozza salvata.');
        const saved = new Event('beforeunload', { cancelable: true });
        listeners.at(-1)?.call(window, saved);
        expect(saved.defaultPrevented).toBe(false);
        add.mockRestore();
    });
});

describe('B6.3 submit cleanup e recovery', () => {
    it.each([true, false])('ordina update, delete %s e navigate', async (deleted) => {
        const events: string[] = [];
        const { repository } = makeRepository();
        vi.mocked(repository.delete).mockImplementation(async () => { events.push('delete'); return deleted; });
        mocks.update.mockImplementation(() => { events.push('update'); return property(); });
        const router = renderEdit();
        await ready();
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/units/property-A'));
        expect(events).toEqual(['update', 'delete']);
        expect(mocks.update).toHaveBeenCalledOnce();
    });

    it('update failure e null non eliminano la bozza e liberano il lock', async () => {
        const { repository } = makeRepository();
        mocks.update.mockImplementationOnce(() => { throw new Error('Update fallito'); }).mockReturnValueOnce(null).mockReturnValueOnce(property());
        const router = renderEdit();
        await ready();
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        expect(await screen.findByText('Update fallito')).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        expect(await screen.findByText('Unità non più disponibile.')).toBeTruthy();
        expect(repository.delete).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/units/property-A'));
        expect(mocks.update).toHaveBeenCalledTimes(3);
    });

    it('cleanup fallito entra in recovery e retry ripete solo delete', async () => {
        const { repository } = makeRepository();
        vi.mocked(repository.delete).mockRejectedValueOnce(new Error('storage')).mockResolvedValueOnce(true);
        const router = renderEdit();
        await ready();
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        expect(await screen.findByText('Unità aggiornata, pulizia incompleta')).toBeTruthy();
        expect(screen.getByText(
            'Non è stato possibile eliminare la bozza locale. Riprova la pulizia.',
        )).toBeTruthy();
        expect(router.state.location.pathname).toBe('/properties/units/property-A/edit');
        await userEvent.click(screen.getByRole('button', { name: 'Riprova pulizia' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/units/property-A'));
        expect(mocks.update).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledTimes(2);
    });

    it('serializza submit concorrenti anche con cleanup pending', async () => {
        let resolveDelete!: (value: boolean) => void;
        const pending = new Promise<boolean>((resolve) => { resolveDelete = resolve; });
        const { repository } = makeRepository();
        vi.mocked(repository.delete).mockReturnValue(pending);
        const router = renderEdit();
        await ready();
        const form = document.getElementById('property-form')!;
        fireEvent.submit(form);
        fireEvent.submit(form);
        fireEvent.submit(form);
        await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
        expect(repository.delete).toHaveBeenCalledOnce();
        await act(async () => { resolveDelete(true); await pending; });
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/units/property-A'));
        expect(mocks.update).toHaveBeenCalledOnce();
    });
});
