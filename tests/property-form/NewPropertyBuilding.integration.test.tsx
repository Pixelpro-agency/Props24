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
import {
    BuildingNotFoundError,
    PropertyBuildingArchivedError,
} from '../../src/db/databaseErrors';

let draftRepository: DraftRepository;
const createProperty = vi.fn();
const createBuildingRepository = vi.fn();
const buildingList = vi.fn();

vi.mock('../../src/auth/AuthContext', () => ({
    useAuth: () => ({ account: { id: 'user-001' } }),
}));
vi.mock('../../src/db/buildingRepository', () => ({
    createBuildingRepository: (options: unknown) => createBuildingRepository(options),
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

const buildings = [
    { id: 'building-a', identifier: 'Building A', archived: false },
    { id: 'building-b', identifier: 'Building B', archived: true },
    { id: 'building-c', identifier: 'Building C', archived: false },
] as never[];

function record(payload: PropertyFormState): DraftRecord<PropertyFormState> {
    return {
        id: 'draft-1', accountId: 'user-001', formType: 'property',
        mode: 'create', entityId: null, payload: structuredClone(payload),
        schemaVersion: 2, createdAt: '2026-08-21T00:00:00.000Z',
        updatedAt: '2026-08-21T00:00:00.000Z',
    };
}

function makeDraftRepository(initial: DraftRecord<PropertyFormState> | null = null) {
    let stored = initial;
    draftRepository = {
        get: vi.fn(async () => stored ? structuredClone(stored) : null),
        list: vi.fn(async () => stored ? [structuredClone(stored)] : []),
        save: vi.fn(async (_definition, input) => {
            stored = record(input.payload as PropertyFormState);
            return structuredClone(stored);
        }),
        delete: vi.fn(async () => {
            stored = null;
            return true;
        }),
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
    await userEvent.type(await screen.findByLabelText(/Identificativo/), `Unità ${suffix}`);
    await userEvent.type(screen.getByLabelText('Indirizzo'), `Via ${suffix} 1`);
    await userEvent.type(screen.getByLabelText(/Citt/), 'Milano');
    await userEvent.type(screen.getByLabelText(/CAP/), '20100');
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('NewProperty Building integration', () => {
    it('usa repository account-scoped, mostra solo Building attivi e preserva il Select standard', async () => {
        makeDraftRepository();
        buildingList.mockReturnValue(buildings);
        createBuildingRepository.mockReturnValue({ list: buildingList });
        renderPage();

        const building = await screen.findByLabelText('Edificio') as HTMLSelectElement;
        expect(createBuildingRepository).toHaveBeenCalledWith({ accountId: 'user-001' });
        expect(building.value).toBe('');
        expect(Array.from(building.options).map((option) => option.textContent))
            .toEqual(['Nessun edificio', 'Building A', 'Building C']);
        expect(building.options[0]).toMatchObject({ disabled: false, hidden: false });
        expect(screen.queryByRole('option', { name: 'Building B' })).toBeNull();
        const type = screen.getByLabelText('Tipo') as HTMLSelectElement;
        expect(type.options[0]).toMatchObject({ disabled: true, hidden: true });
    });

    it.each([
        ['', null],
        ['building-a', 'building-a'],
    ])('crea con mapping Building %s, canonical data pulito e navigazione', async (selected, expected) => {
        makeDraftRepository();
        buildingList.mockReturnValue(buildings);
        createBuildingRepository.mockReturnValue({ list: buildingList });
        createProperty.mockReturnValue({ id: `property-${expected ?? 'none'}` });
        const router = renderPage();
        await fillRequired(String(expected ?? 'none'));
        if (selected) await userEvent.selectOptions(screen.getByLabelText('Edificio'), selected);
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(createProperty).toHaveBeenCalledOnce());
        const [data, relation] = createProperty.mock.calls[0] as [PropertyFormData, { buildingId: string | null }];
        expect(data).not.toHaveProperty('PropertyBuildingId');
        expect(relation).toEqual({ buildingId: expected });
        await waitFor(() => expect(router.state.location.pathname)
            .toBe(`/properties/units/property-${expected ?? 'none'}`));
        expect(draftRepository.delete).toHaveBeenCalledOnce();
    });

    it('non sincronizza l’indirizzo quando cambia Building', async () => {
        makeDraftRepository();
        buildingList.mockReturnValue(buildings);
        createBuildingRepository.mockReturnValue({ list: buildingList });
        renderPage();
        const address = await screen.findByLabelText('Indirizzo') as HTMLInputElement;
        await userEvent.type(address, 'Via autonoma 7');
        await userEvent.selectOptions(screen.getByLabelText('Edificio'), 'building-a');
        expect(address.value).toBe('Via autonoma 7');
        expect(address.readOnly).toBe(false);
    });

    it('salva e riprende Building nel vero Select senza autosave supplementare', async () => {
        makeDraftRepository();
        buildingList.mockReturnValue(buildings);
        createBuildingRepository.mockReturnValue({ list: buildingList });
        const first = renderPage();
        await userEvent.selectOptions(await screen.findByLabelText('Edificio'), 'building-a');
        await userEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await waitFor(() => expect(draftRepository.save).toHaveBeenCalledOnce());
        first.dispose();
        cleanup();
        renderPage();
        await userEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));
        expect((await screen.findByLabelText('Edificio') as HTMLSelectElement).value)
            .toBe('building-a');
        expect(draftRepository.save).toHaveBeenCalledOnce();
        expect(createProperty).not.toHaveBeenCalled();
    });

    it('rappresenta una relazione draft non disponibile senza cancellarla o autosalvarla', async () => {
        makeDraftRepository(record({
            ...defaultPropertyFormStateValues,
            PropertyBuildingId: 'building-old',
        }));
        buildingList.mockReturnValue(buildings);
        createBuildingRepository.mockReturnValue({ list: buildingList });
        renderPage();
        await userEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));
        const select = await screen.findByLabelText('Edificio') as HTMLSelectElement;
        expect(select.value).toBe('building-old');
        expect(screen.getByRole('option', { name: 'Edificio non disponibile' }))
            .toMatchObject({ disabled: true, selected: true });
        expect(screen.getByRole('option', { name: 'Nessun edificio' }))
            .toMatchObject({ disabled: false });
        expect(draftRepository.save).not.toHaveBeenCalled();
    });

    it.each([
        [new BuildingNotFoundError('building-a'), "L'edificio selezionato non è più disponibile. Scegli un altro edificio o Nessun edificio."],
        [new PropertyBuildingArchivedError('building-a'), "L'edificio selezionato è archiviato. Scegli un altro edificio o Nessun edificio."],
    ])('gestisce il race Building senza navigazione o cleanup', async (failure, message) => {
        makeDraftRepository();
        buildingList.mockReturnValue(buildings);
        createBuildingRepository.mockReturnValue({ list: buildingList });
        createProperty.mockImplementation(() => {
            throw failure;
        });
        const router = renderPage();
        await fillRequired(failure.name);
        await userEvent.selectOptions(screen.getByLabelText('Edificio'), 'building-a');
        await userEvent.click(screen.getByRole('button', { name: 'Informazioni aggiuntive' }));
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        expect(await screen.findAllByText(message)).toHaveLength(2);
        const building = await screen.findByLabelText('Edificio');
        expect(document.activeElement).toBe(building);
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(createProperty).toHaveBeenCalledOnce();
        expect(draftRepository.delete).not.toHaveBeenCalled();
        createProperty.mockReturnValue({ id: 'property-retry' });
        await userEvent.selectOptions(building, 'building-c');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(createProperty).toHaveBeenCalledTimes(2));
    });
});
