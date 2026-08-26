// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import { RouterProvider, createMemoryRouter, matchRoutes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EditPropertyPage } from '../../src/pages/EditPropertyPage';
import { createAppRoutes } from '../../src/router';
import { defaultPropertyValues, type PropertyFormState } from '../../src/components/property-form/schema';
import type { PropertyRecord } from '../../src/db/database.types';
import { getJsonDb } from '../../src/db/jsonDb';
import * as propertyRepository from '../../src/db/propertyRepository';

const storage = vi.hoisted(() => ({ database: null as Record<string, unknown[]> | null }));

vi.mock('../../src/db/jsonDb', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../src/db/jsonDb')>();
    return {
        ...actual,
        getJsonDb: () => storage.database,
        getRecordById: (collection: string, id: string) => storage.database?.[collection]?.find((item) => (item as { id: string }).id === id) ?? null,
        saveJsonDb: (database: Record<string, unknown[]>) => {
            storage.database = structuredClone(database);
            return storage.database;
        },
    };
});

vi.mock('../../src/auth/AuthContext', () => ({
    useAuth: () => ({ account: { id: 'user-001' }, isInitializing: false }),
}));
vi.mock('../../src/components/property-form/ui/AddressAutocomplete', () => ({
    AddressAutocomplete: ({ name, label }: { name: keyof PropertyFormState; label?: string }) => {
        const { register } = useFormContext<PropertyFormState>();
        return <input aria-label={label || 'Indirizzo'} {...register(name)} />;
    },
}));

const file = (id: string) => ({ id, name: `${id}.pdf`, type: 'application/pdf', size: 10, lastModified: 1, dataUrl: 'data:test' });

function seedRecord(): PropertyRecord {
    const formData = {
        ...defaultPropertyValues,
        PropertyTypeID: 'appartamento',
        PropertyTitle: 'Unità originale',
        PropertyAddress: 'Via Originale 1',
        PropertyCity: 'Milano',
        PropertyPostalCode: '20100',
        PropertyRent: 900,
        PropertyCadastreMunicipality: 'Milano',
        PropertyCadastreSheet: '12',
        PropertyCadastreDocument: file('cadastre-file'),
        PropertyKeys: [{ id: 'key-id', description: 'Portone', number: '1', quantity: 1, holder: '', comments: '' }],
        PropertyContracts: [{ id: 'contract-id', type: 'Energia', description: '', releaseDate: '', expiryDate: '', comments: '', file: file('contract-file') }],
        PropertyPhotos: [file('photo-id')],
        PropertyContacts: [{ id: 'contact-id', firstName: 'Mario', lastName: 'Rossi', profession: '', email: '', phone: '', comments: '' }],
        PropertyDocuments: [{ id: 'document-id', type: 'Planimetria', description: '', releaseDate: '', comments: '', shared: false, file: file('document-file') }],
    };
    const record = {
        id: 'property-edit', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z', archived: true,
        formData, relations: { buildingId: 'building-001', tenantIds: ['tenant-001'], leaseIds: ['lease-001'] },
        notes: [], activities: [],
        legacy: { source: 'legacy' }, coordinates: { lat: 45, lng: 9 }, unitsCount: 4,
    } as unknown as PropertyRecord;
    storage.database = {
        properties: [structuredClone(record)], buildings: [], tenants: [], leases: [],
        messages: [], payments: [], contacts: [], documents: [], drafts: [],
    };
    return record;
}

function renderEdit(id = 'property-edit') {
    const router = createMemoryRouter([
        { path: '/properties/units/:id/edit', element: <EditPropertyPage /> },
        { path: '/properties/units/:id', element: <p>Dettaglio unità</p> },
        { path: '/properties/units', element: <p>Lista unità</p> },
    ], { initialEntries: [`/properties/units/${id}/edit`] });
    const result = render(<RouterProvider router={router} />);
    return { router, ...result };
}

beforeEach(() => {
    seedRecord();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    storage.database = null;
});

describe('EditProperty route e form', () => {
    it('registra la route edit nel router applicativo prima del dettaglio', () => {
        const matches = matchRoutes(createAppRoutes(), '/properties/units/property-edit/edit');
        expect(matches?.at(-1)?.route.path).toBe('/properties/units/:id/edit');
    });

    it('idrata una sola volta campi generali, indirizzo, canone, catasto e dati annidati', async () => {
        const { router, rerender } = renderEdit();
        expect(await screen.findByRole('heading', { name: 'Modifica unità' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Salva bozza' })).toBeNull();
        expect((screen.getByLabelText('Tipo') as HTMLSelectElement).value).toBe('appartamento');
        expect((screen.getByLabelText(/Identificativo/) as HTMLInputElement).value).toBe('Unità originale');
        expect((screen.getByLabelText('Indirizzo') as HTMLInputElement).value).toBe('Via Originale 1');
        expect((screen.getByLabelText(/Affitto/) as HTMLInputElement).value).toBe('900');
        expect((screen.getByLabelText('Indirizzo') as HTMLInputElement).readOnly).toBe(false);
        await userEvent.clear(screen.getByLabelText(/Identificativo/));
        await userEvent.type(screen.getByLabelText(/Identificativo/), 'Modifica locale');
        rerender(<RouterProvider router={router} />);
        expect((screen.getByLabelText(/Identificativo/) as HTMLInputElement).value).toBe('Modifica locale');
        await userEvent.click(screen.getByRole('button', { name: 'Informazioni aggiuntive' }));
        expect(screen.getByDisplayValue('Milano')).toBeTruthy();
        expect(screen.getByDisplayValue('12')).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: 'Password e codice' }));
        expect(screen.getByText('Portone')).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: 'Contatti' }));
        expect(screen.getByText('Mario Rossi')).toBeTruthy();
    });

    it('mostra il missing state senza form né scritture', async () => {
        const update = vi.spyOn(propertyRepository, 'updateProperty');
        renderEdit('missing');
        expect((await screen.findByRole('alert')).textContent).toContain('Unità non trovata.');
        expect(screen.getByRole('link', { name: 'Torna alle unità' }).getAttribute('href')).toBe('/properties/units');
        expect(document.getElementById('property-form')).toBeNull();
        expect(update).not.toHaveBeenCalled();
    });

    it('esegue update reale, naviga e preserva relazioni, lifecycle, side data e tutti gli ID annidati', async () => {
        const before = structuredClone(getJsonDb().properties[0]) as PropertyRecord & { unitsCount: number };
        const { router } = renderEdit();
        await userEvent.clear(await screen.findByLabelText(/Identificativo/));
        await userEvent.type(screen.getByLabelText(/Identificativo/), 'Unità aggiornata');
        fireEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/units/property-edit'));
        expect(router.state.historyAction).toBe('REPLACE');
        const after = getJsonDb().properties[0] as PropertyRecord & { unitsCount: number };
        expect(after.formData.PropertyTitle).toBe('Unità aggiornata');
        expect(after.relations).toEqual(before.relations);
        expect(after.archived).toBe(true);
        expect(after.createdAt).toBe(before.createdAt);
        expect(after.notes).toEqual(before.notes);
        expect(after.activities).toEqual(before.activities);
        expect(after.legacy).toEqual(before.legacy);
        expect(after.coordinates).toEqual(before.coordinates);
        expect(after.unitsCount).toBe(4);
        expect([
            after.formData.PropertyCadastreDocument?.id,
            after.formData.PropertyKeys[0].id,
            after.formData.PropertyContracts[0].id,
            after.formData.PropertyContracts[0].file?.id,
            after.formData.PropertyPhotos[0].id,
            after.formData.PropertyContacts[0].id,
            after.formData.PropertyDocuments[0].id,
            after.formData.PropertyDocuments[0].file?.id,
        ]).toEqual(['cadastre-file', 'key-id', 'contract-id', 'contract-file', 'photo-id', 'contact-id', 'document-id', 'document-file']);
        expect(after.formData).not.toHaveProperty('PropertyBuildingId');
    });

    it('mantiene il form e libera il lock su errore e su record scomparso, consentendo retry', async () => {
        const update = vi.spyOn(propertyRepository, 'updateProperty')
            .mockImplementationOnce(() => { throw new Error('Errore temporaneo'); })
            .mockReturnValueOnce(null)
            .mockImplementationOnce((id, data) => {
                update.mockRestore();
                return propertyRepository.updateProperty(id, data);
            });
        const { router } = renderEdit();
        const title = await screen.findByLabelText(/Identificativo/);
        await userEvent.clear(title);
        await userEvent.type(title, 'Valore preservato');
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        expect(await screen.findByText('Errore temporaneo')).toBeTruthy();
        expect((title as HTMLInputElement).value).toBe('Valore preservato');
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        expect(await screen.findByText('Unità non più disponibile.')).toBeTruthy();
        expect((title as HTMLInputElement).value).toBe('Valore preservato');
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/units/property-edit'));
    });

    it('serializza submit sincroni e non crea mai una nuova unità', async () => {
        const actual = propertyRepository.updateProperty;
        const update = vi.spyOn(propertyRepository, 'updateProperty').mockImplementation(actual);
        const create = vi.spyOn(propertyRepository, 'createProperty');
        const { router } = renderEdit();
        await screen.findByLabelText(/Identificativo/);
        const form = document.getElementById('property-form')!;
        fireEvent.submit(form);
        fireEvent.submit(form);
        fireEvent.submit(form);
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/units/property-edit'));
        expect(update).toHaveBeenCalledOnce();
        expect(create).not.toHaveBeenCalled();
    });
});
