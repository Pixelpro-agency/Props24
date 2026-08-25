// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NewProperty } from '../../src/pages/NewProperty';
import {
    defaultPropertyFormStateValues,
    type PropertyFormData,
    type PropertyFormState,
} from '../../src/components/property-form/schema';
import type { DraftRecord, DraftRepository } from '../../src/db/draftRepository.port';

let draftRepository: DraftRepository;
const createProperty = vi.fn();
const createBuildingRepository = vi.fn();

vi.mock('../../src/db/buildingRepository', () => ({
    createBuildingRepository: (...args: unknown[]) => createBuildingRepository(...args),
}));
vi.mock('../../src/db/propertyRepository', () => ({
    createProperty: (...args: unknown[]) => createProperty(...args),
}));
vi.mock('../../src/drafts/DraftRepositoryContext', () => ({
    useDraftRepository: () => draftRepository,
}));
vi.mock('../../src/components/property-form/ui/AddressAutocomplete', () => ({
    AddressAutocomplete: ({ name }: { name: keyof PropertyFormState }) => {
        const { register } = useFormContext<PropertyFormState>();
        return <input aria-label="Indirizzo" {...register(name)} />;
    },
}));

function record(payload: PropertyFormState): DraftRecord<PropertyFormState> {
    return {
        id: 'draft-1', accountId: 'user-001', formType: 'property',
        mode: 'create', entityId: null, payload: structuredClone(payload),
        schemaVersion: 2, createdAt: '2026-08-21T00:00:00.000Z',
        updatedAt: '2026-08-21T00:00:00.000Z',
    };
}

function makeDraftRepository(initial: DraftRecord<PropertyFormState> | null = null) {
    draftRepository = {
        get: vi.fn().mockResolvedValue(initial),
        list: vi.fn().mockResolvedValue(initial ? [initial] : []),
        save: vi.fn().mockImplementation(async (_definition, input) => (
            record(input.payload as PropertyFormState)
        )),
        delete: vi.fn().mockResolvedValue(true),
    };
}

function renderPage() {
    const router = createMemoryRouter([
        { path: '/properties/new', element: <NewProperty /> },
        { path: '/properties/units/:id', element: <p>Dettaglio</p> },
    ], { initialEntries: ['/properties/new'] });
    render(<RouterProvider router={router} />);
    return router;
}

async function fillRequired(suffix: string) {
    await userEvent.selectOptions(await screen.findByLabelText('Tipo'), 'appartamento');
    await userEvent.type(await screen.findByLabelText(/Identificativo/), `Unità ${suffix}`);
    await userEvent.type(screen.getByLabelText('Indirizzo'), `Via ${suffix} 1`);
    await userEvent.type(screen.getByLabelText(/Citt/), 'Milano');
    await userEvent.type(screen.getByLabelText(/CAP/), '20100');
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('NewProperty standalone Building contract', () => {
    it('non mostra UI Building e mantiene il Select Tipo standard', async () => {
        makeDraftRepository();
        renderPage();
        expect(await screen.findByLabelText('Tipo')).toBeTruthy();
        expect(screen.queryByLabelText('Edificio')).toBeNull();
        expect(screen.queryByText('Nessun edificio')).toBeNull();
        expect(screen.queryByText('Edificio non disponibile')).toBeNull();
        const type = screen.getByLabelText('Tipo') as HTMLSelectElement;
        expect(type.options[0]).toMatchObject({
            value: '',
            disabled: true,
            hidden: true,
            text: "Seleziona un'opzione",
        });
        expect(createBuildingRepository).not.toHaveBeenCalled();
    });

    it('crea standalone con il solo canonical PropertyFormData', async () => {
        makeDraftRepository();
        createProperty.mockReturnValue({ id: 'property-standalone' });
        const router = renderPage();
        await fillRequired('standalone');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(createProperty).toHaveBeenCalledOnce());
        expect(createProperty.mock.calls[0]).toHaveLength(1);
        const data = createProperty.mock.calls[0][0] as PropertyFormData;
        expect(data).not.toHaveProperty('PropertyBuildingId');
        expect(data).not.toHaveProperty('buildingId');
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/properties/units/property-standalone'));
    });

    it('una bozza v2 B1.3 con Building non crea una relazione nascosta', async () => {
        makeDraftRepository(record({
            ...defaultPropertyFormStateValues,
            PropertyTypeID: 'appartamento',
            PropertyBuildingId: 'building-a',
            PropertyTitle: 'Unità legacy Building',
            PropertyAddress: 'Via Legacy 1',
            PropertyCity: 'Milano',
            PropertyPostalCode: '20100',
        }));
        createProperty.mockReturnValue({ id: 'property-legacy-detached' });
        renderPage();
        await userEvent.click(await screen.findByRole('button', {
            name: 'Riprendi bozza',
        }));
        expect(await screen.findByLabelText('Tipo')).toBeTruthy();
        expect(screen.queryByLabelText('Edificio')).toBeNull();
        expect(draftRepository.save).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(createProperty).toHaveBeenCalledOnce());
        expect(createProperty.mock.calls[0]).toHaveLength(1);
        expect(createProperty.mock.calls[0][0]).not.toHaveProperty('PropertyBuildingId');
        expect(createProperty.mock.calls[0][0]).not.toHaveProperty('buildingId');
    });

    it('mantiene l’indirizzo come normale input standalone', async () => {
        makeDraftRepository();
        renderPage();
        const address = await screen.findByLabelText('Indirizzo') as HTMLInputElement;
        await userEvent.type(address, 'Via autonoma 7');
        expect(address.value).toBe('Via autonoma 7');
        expect(address.readOnly).toBe(false);
        expect(address.disabled).toBe(false);
    });
});
