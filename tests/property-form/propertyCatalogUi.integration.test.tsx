// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PropertyFormProvider } from '../../src/components/property-form/PropertyFormProvider';
import { Tab1Info } from '../../src/components/property-form/tabs/Tab1Info';
import type { PropertyFormData, PropertyFormState } from '../../src/components/property-form/schema';
import { propertyBillingPeriodCatalog, propertyEnergyClassCatalog, propertyRentTypeCatalog, propertyTypeCatalog } from '../../src/data/propertyCatalogs';

vi.mock('../../src/components/property-form/ui/AddressAutocomplete', () => ({ AddressAutocomplete: () => null }));
const draftRepository = {
    get: vi.fn().mockResolvedValue(null), list: vi.fn().mockResolvedValue([]), save: vi.fn(), delete: vi.fn().mockResolvedValue(false),
};
vi.mock('../../src/drafts/DraftRepositoryContext', () => ({ useDraftRepository: () => draftRepository }));

function Controls() {
    const form = useFormContext<PropertyFormState>();
    return <button type="button" onClick={() => {
        form.setValue('PropertyTitle', 'Unità catalogo'); form.setValue('PropertyAddress', 'Via Roma 1');
        form.setValue('PropertyCity', 'Roma'); form.setValue('PropertyPostalCode', '00100');
    }}>Compila obbligatori</button>;
}

function mount(onCreateProperty = vi.fn((data: PropertyFormData) => ({ id: data.PropertyTitle }))) {
    const router = createMemoryRouter([{ path: '/', element: <PropertyFormProvider activeTab="general" setActiveTab={() => undefined}
        onCreateProperty={onCreateProperty} onPropertyCreated={() => undefined} onExitDraft={() => undefined}>
        <Tab1Info /><Controls /><button type="submit">Salva test</button>
    </PropertyFormProvider> }], { initialEntries: ['/'] });
    render(<RouterProvider router={router} />);
    return onCreateProperty;
}

const select = (id: string) => document.getElementById(id) as HTMLSelectElement;
const options = (id: string) => Array.from(select(id).options);
const energySelect = () => document.getElementById('PropertyEnergyConsumption2') as HTMLSelectElement;
async function choose(id: string, value: string) {
    await waitFor(() => expect(select(id)).toBeTruthy());
    await userEvent.selectOptions(select(id), value);
}

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('cataloghi canonici nella UI Unit', () => {
    it('espone opzioni, ordine e placeholder esatti', async () => {
        mount(); await screen.findByLabelText('Tipo');
        const type = options('PropertyTypeID');
        expect(type.slice(1).map((item) => [item.value, item.text])).toEqual(propertyTypeCatalog.map(({ value, label }) => [value, label]));
        expect(type[0]).toMatchObject({ value: '', disabled: true, hidden: true, text: "Seleziona un'opzione" });
        for (const [id, catalog] of [['PropertyRentType', propertyRentTypeCatalog], ['PropertyBillingPeriod', propertyBillingPeriodCatalog]] as const) {
            const items = options(id); expect(items.filter((item) => item.value === '')).toHaveLength(1);
            expect(items[0]).toMatchObject({ value: '', disabled: false, hidden: false, text: 'Scegli' });
            expect(items.slice(1).map((item) => item.value)).toEqual(catalog.map(({ value }) => value));
        }
        const energy = Array.from(energySelect().options);
        expect(energy[0].text).toBe('Scegli');
        expect(energy.slice(1).map((item) => item.value)).toEqual([...propertyEnergyClassCatalog]);
    });

    it('invia gli ID canonici', async () => {
        const create = mount(); await userEvent.click(await screen.findByRole('button', { name: 'Compila obbligatori' }));
        await waitFor(() => expect(select('PropertyRentType')).toBeTruthy());
        await choose('PropertyTypeID', 'ufficio');
        await choose('PropertyRentType', 'studenti_con_cedolare_secca');
        await choose('PropertyBillingPeriod', 'quarterly');
        await choose('PropertyEnergyConsumption2', 'A2');
        await userEvent.click(screen.getByRole('button', { name: 'Salva test' }));
        await waitFor(() => expect(create).toHaveBeenCalledOnce());
        expect(create.mock.calls[0][0]).toMatchObject({ PropertyTypeID: 'ufficio', PropertyRentType: 'studenti_con_cedolare_secca', PropertyBillingPeriod: 'quarterly', PropertyEnergyConsumption2: 'A2' });
    });

    it('permette di azzerare i campi facoltativi', async () => {
        const resetCreate = mount(); await userEvent.click(await screen.findByRole('button', { name: 'Compila obbligatori' }));
        await choose('PropertyTypeID', 'appartamento');
        await choose('PropertyRentType', 'studenti');
        expect(select('PropertyRentType').value).toBe('studenti');
        await choose('PropertyRentType', '');
        expect(select('PropertyRentType').value).toBe('');
        await choose('PropertyBillingPeriod', 'monthly');
        expect(select('PropertyBillingPeriod').value).toBe('monthly');
        await choose('PropertyBillingPeriod', '');
        expect(select('PropertyBillingPeriod').value).toBe('');
        await choose('PropertyEnergyConsumption2', 'A4');
        expect(select('PropertyEnergyConsumption2').value).toBe('A4');
        await choose('PropertyEnergyConsumption2', '');
        expect(select('PropertyEnergyConsumption2').value).toBe('');
        await userEvent.click(screen.getByRole('button', { name: 'Salva test' }));
        await waitFor(() => expect(resetCreate).toHaveBeenCalledOnce());
        expect(resetCreate.mock.calls[0][0]).toMatchObject({ PropertyRentType: '', PropertyBillingPeriod: '', PropertyEnergyConsumption2: '' });
    });
});
