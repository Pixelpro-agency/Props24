// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BuildingForm } from '../../src/components/building-form/BuildingForm';
import {
    DuplicateBuildingIdentifierError,
    DuplicateBuildingLocationError,
} from '../../src/db/databaseErrors';
import {
    BUILDING_FEATURE_VALUES,
    defaultBuildingValues,
    type BuildingFormData,
} from '../../src/components/building-form/schema';

const activeTabs = ['Informazioni generali', 'Unità', 'Informazioni aggiuntive', 'Informazioni finanziarie'];
const futureTabs = ['Password e codice', 'Foto', 'Documenti'];

function fillRequiredBuilding(values: Partial<Record<'identifier' | 'address' | 'city' | 'postalCode' | 'country', string>> = {}) {
    fireEvent.change(document.getElementById('identifier')!, { target: { value: values.identifier ?? 'Edificio test' } });
    fireEvent.change(document.getElementById('address')!, { target: { value: values.address ?? 'Via Test 1' } });
    fireEvent.change(document.getElementById('city')!, { target: { value: values.city ?? 'Roma' } });
    fireEvent.change(document.getElementById('postalCode')!, { target: { value: values.postalCode ?? '00100' } });
    fireEvent.change(document.getElementById('country')!, { target: { value: values.country ?? 'IT' } });
}

afterEach(cleanup);

describe('BuildingForm', () => {
    it('mostra sette tab, quattro attive e tre future disabled in stile amber', () => {
        render(<BuildingForm onSubmit={vi.fn()} />);
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(7);
        for (const name of activeTabs) expect(screen.getByRole<HTMLButtonElement>('tab', { name }).disabled).toBe(false);
        for (const name of futureTabs) {
            const tab = screen.getByRole('tab', { name });
            expect((tab as HTMLButtonElement).disabled).toBe(true);
            expect(tab.className).toMatch(/amber/);
        }
        expect(screen.getByText(/Password e codice richiede backend, autorizzazione e storage sicuro/)).toBeTruthy();
        expect(screen.getByText(/Foto e Documenti richiedono storage sicuro e backend/)).toBeTruthy();
    });

    it('mostra i tredici campi generali con i cinque required visuali', () => {
        render(<BuildingForm onSubmit={vi.fn()} />);
        const labels = [
            'Identificativo', 'Colore', 'Indirizzo 2', 'Città', 'CAP',
            'Provincia', 'Regione', 'Paese', 'Superficie m²', 'Anno di costruzione',
            'Descrizione', 'Nota privata',
        ];
        for (const label of labels) expect(screen.getByLabelText(label, { exact: false })).toBeTruthy();
        expect(screen.getByRole('textbox', { name: /^Indirizzo \*$/i })).toBeTruthy();
        for (const label of ['Identificativo', 'Indirizzo', 'Città', 'CAP', 'Paese']) {
            expect(screen.getByText(label).parentElement?.textContent).toContain('*');
        }
        expect(screen.getByLabelText('Anno di costruzione').getAttribute('type')).toBe('number');
        expect(screen.getByLabelText('Anno di costruzione').getAttribute('step')).toBe('1');
    });

    it('rende Unità solo informativa senza azioni', async () => {
        const user = userEvent.setup();
        render(<BuildingForm onSubmit={vi.fn()} />);
        await user.click(screen.getByRole('tab', { name: 'Unità' }));
        expect(screen.getByText(/può essere salvato senza unità/)).toBeTruthy();
        expect(screen.getByText('Dopo la creazione, le unità potranno essere aggiunte dal dettaglio edificio.')).toBeTruthy();
        expect(screen.getByText(/normale form Nuova unità/)).toBeTruthy();
        expect(screen.queryByText(/aggiunte o collegate/)).toBeNull();
        expect(screen.queryByRole('button', { name: 'Aggiungi unità' })).toBeNull();
        expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('rende tutte e sole le feature canoniche come checkbox', async () => {
        const user = userEvent.setup();
        render(<BuildingForm onSubmit={vi.fn()} />);
        await user.click(screen.getByRole('tab', { name: 'Informazioni aggiuntive' }));
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes).toHaveLength(BUILDING_FEATURE_VALUES.length);
        BUILDING_FEATURE_VALUES.forEach((feature) => {
            const checkbox = screen.getByRole('checkbox', { name: feature });
            expect(checkbox.getAttribute('id')).toBe(feature);
            expect(checkbox.getAttribute('value')).toBe(feature);
        });
        expect(screen.queryByText('Sicuro')).toBeNull();
    });

    it('mostra esattamente i quattro campi finanziari con tipi corretti', async () => {
        const user = userEvent.setup();
        render(<BuildingForm onSubmit={vi.fn()} />);
        await user.click(screen.getByRole('tab', { name: 'Informazioni finanziarie' }));
        expect(screen.getByLabelText('Data di acquisto').getAttribute('type')).toBe('date');
        for (const label of ["Prezzo d'acquisto", 'Spese di acquisto', 'IMU']) {
            const input = screen.getByLabelText(label);
            expect(input.getAttribute('type')).toBe('number');
            expect(input.getAttribute('min')).toBe('0');
            expect(input.getAttribute('step')).toBe('any');
        }
        expect(screen.queryAllByRole('textbox')).toHaveLength(0);
        expect(screen.getAllByRole('spinbutton')).toHaveLength(3);
    });

    it('non invia il form vuoto e mostra gli errori required', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<BuildingForm onSubmit={onSubmit} />);
        await user.clear(screen.getByLabelText('Paese', { exact: false }));
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(onSubmit).not.toHaveBeenCalled();
        for (const message of [
            'Inserisci un identificativo.', "Inserisci l'indirizzo dell'edificio.",
            'Inserisci la città.', 'Inserisci il CAP.', 'Inserisci il paese.',
        ]) expect(await screen.findByText(message)).toBeTruthy();
    });

    it('preserva general, feature e valori finanziari fra i cambi tab', async () => {
        const user = userEvent.setup();
        render(<BuildingForm onSubmit={vi.fn()} />);
        await user.type(screen.getByLabelText('Identificativo', { exact: false }), 'Edificio persistente');
        await user.click(screen.getByRole('tab', { name: 'Informazioni aggiuntive' }));
        await user.click(screen.getByRole('checkbox', { name: 'Garage' }));
        await user.click(screen.getByRole('tab', { name: 'Informazioni finanziarie' }));
        await user.type(screen.getByLabelText("Prezzo d'acquisto"), '1234');
        await user.click(screen.getByRole('tab', { name: 'Informazioni generali' }));
        expect((screen.getByLabelText('Identificativo', { exact: false }) as HTMLInputElement).value).toBe('Edificio persistente');
        await user.click(screen.getByRole('tab', { name: 'Informazioni aggiuntive' }));
        expect((screen.getByRole('checkbox', { name: 'Garage' }) as HTMLInputElement).checked).toBe(true);
        await user.click(screen.getByRole('tab', { name: 'Informazioni finanziarie' }));
        expect((screen.getByLabelText("Prezzo d'acquisto") as HTMLInputElement).valueAsNumber).toBe(1234);
    });

    it('esegue il round-trip canonico di tutti i diciotto campi senza mutare i default', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const defaultsBefore = structuredClone(defaultBuildingValues);
        render(<BuildingForm onSubmit={onSubmit} />);
        const values: Record<string, string> = {
            identifier: '  Edificio A  ', color: '#ABC', address: '  Via Roma 1  ',
            address2: '  Scala B  ', city: '  Roma  ', postalCode: ' 00100 ', county: ' RM ',
            state: ' Lazio ', country: ' it ', size: '125.5', constructionYear: '1980',
            description: '  Descrizione  interna  ', privateNote: '  Nota  riservata  ',
        };
        for (const [id, value] of Object.entries(values)) {
            const input = document.getElementById(id)!;
            fireEvent.change(input, { target: { value } });
        }
        await user.click(screen.getByRole('tab', { name: 'Informazioni aggiuntive' }));
        const representativeFeatures = [
            BUILDING_FEATURE_VALUES[0],
            BUILDING_FEATURE_VALUES[Math.floor(BUILDING_FEATURE_VALUES.length / 2)],
            BUILDING_FEATURE_VALUES[BUILDING_FEATURE_VALUES.length - 1],
        ];
        for (const feature of representativeFeatures) {
            await user.click(screen.getByRole('checkbox', { name: feature }));
        }
        await user.click(screen.getByRole('tab', { name: 'Informazioni finanziarie' }));
        const financial = {
            'Data di acquisto': '2024-02-29', "Prezzo d'acquisto": '200000',
            'Spese di acquisto': '10000.5', IMU: '900',
        };
        for (const [label, value] of Object.entries(financial)) {
            fireEvent.change(screen.getByLabelText(label), { target: { value } });
        }
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0]).toHaveLength(1);
        expect(onSubmit.mock.calls[0][0]).toEqual({
            identifier: 'Edificio A', color: '#abc', address: 'Via Roma 1', address2: 'Scala B',
            city: 'Roma', postalCode: '00100', county: 'RM', state: 'Lazio', country: 'IT',
            size: 125.5, constructionYear: 1980, description: 'Descrizione  interna',
            privateNote: 'Nota  riservata',
            features: representativeFeatures,
            acquisitionDate: '2024-02-29', purchasePrice: 200000, acquisitionCosts: 10000.5, imu: 900,
        } satisfies BuildingFormData);
        expect(defaultBuildingValues).toEqual(defaultsBefore);
    });

    it('non mostra criteri di ripartizione o millesimi', () => {
        render(<BuildingForm onSubmit={vi.fn()} />);
        expect(screen.queryByText(/Criteri di ripartizione/i)).toBeNull();
        expect(screen.queryByText(/millesimi/i)).toBeNull();
    });

    it('disabilita Salva e mostra Salvataggio durante onSubmit async', async () => {
        const user = userEvent.setup();
        let resolveSubmit!: () => void;
        const onSubmit = vi.fn(() => new Promise<void>((resolve) => { resolveSubmit = resolve; }));
        render(<BuildingForm onSubmit={onSubmit} />);
        await user.type(screen.getByLabelText('Identificativo', { exact: false }), 'Edificio A');
        await user.type(document.getElementById('address')!, 'Via Roma 1');
        await user.type(screen.getByLabelText('Città', { exact: false }), 'Roma');
        await user.type(screen.getByLabelText('CAP', { exact: false }), '00100');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect((await screen.findByRole<HTMLButtonElement>('button', { name: 'Salvataggio...' })).disabled).toBe(true);
        await act(async () => resolveSubmit());
        expect((await screen.findByRole<HTMLButtonElement>('button', { name: 'Salva' })).disabled).toBe(false);
    });

    it('gestisce il duplicato identificativo con errore, focus e valori preservati', async () => {
        const user = userEvent.setup();
        const error = new DuplicateBuildingIdentifierError('Edificio test', 'building-existing');
        const onSubmit = vi.fn(() => { throw error; });
        render(<BuildingForm onSubmit={onSubmit} />);
        fillRequiredBuilding();
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(document.activeElement).toBe(document.getElementById('identifier')));
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(screen.getAllByText(error.message).length).toBeGreaterThanOrEqual(2);
        expect((document.getElementById('address') as HTMLInputElement).value).toBe('Via Test 1');
    });

    it('gestisce il duplicato localizzazione su quattro campi con focus address', async () => {
        const user = userEvent.setup();
        const error = new DuplicateBuildingLocationError('building-existing');
        render(<BuildingForm onSubmit={() => { throw error; }} />);
        fillRequiredBuilding({ identifier: 'Edificio diverso' });
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(document.activeElement).toBe(document.getElementById('address')));
        expect(screen.getAllByText(error.message)).toHaveLength(5);
        for (const id of ['address', 'city', 'postalCode', 'country']) {
            expect(document.getElementById(id)?.parentElement?.textContent).toContain(error.message);
        }
        expect((document.getElementById('identifier') as HTMLInputElement).value).toBe('Edificio diverso');
    });

    it('mostra un alert per errore generico senza crash o perdita dati', async () => {
        const user = userEvent.setup();
        render(<BuildingForm onSubmit={() => { throw new Error('Servizio temporaneamente non disponibile.'); }} />);
        fillRequiredBuilding();
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        await screen.findByRole('alert');
        expect(screen.getByRole('alert').textContent).toBe('Servizio temporaneamente non disponibile.');
        expect((document.getElementById('identifier') as HTMLInputElement).value).toBe('Edificio test');
    });
});
