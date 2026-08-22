// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BuildingCreateForm } from '../../src/components/building-form/BuildingCreateForm';
import { BUILDING_FEATURE_VALUES } from '../../src/components/building-form/schema';
import type { LocalDatabase } from '../../src/db/database.types';
import { assertDatabaseIntegrity } from '../../src/db/databaseValidation';
import { createBuildingRepository } from '../../src/db/buildingRepository';
import { MemoryStorage, installJsonDbWindow, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';

const EARLIER = '2026-08-20T12:00:00.000Z';

function emptyDatabase(): LocalDatabase {
    return {
        meta: { schemaVersion: 4, seedVersion: 3, createdAt: EARLIER, updatedAt: EARLIER, source: 'seed' },
        buildings: [], properties: [], tenants: [], leases: [], payments: [], contacts: [], documents: [],
        reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [],
        candidates: [], settings: {}, userProfile: {}, drafts: [],
    };
}

function installAccounts(accountA: string, accountB: string) {
    const keyA = `props24.localDb.${accountA}`;
    const keyB = `props24.localDb.${accountB}`;
    const storage = new MemoryStorage({
        [keyA]: JSON.stringify(emptyDatabase()),
        [keyB]: JSON.stringify(emptyDatabase()),
    });
    installJsonDbWindow(storage);
    Object.defineProperty(window, 'document', { configurable: true, value: document });
    return { storage, keyA, keyB };
}

function change(id: string, value: string) {
    fireEvent.change(document.getElementById(id)!, { target: { value } });
}

function fillRequired(identifier: string, address: string, city = 'Roma', postalCode = '00100', country = 'it') {
    change('identifier', identifier);
    change('address', address);
    change('city', city);
    change('postalCode', postalCode);
    change('country', country);
}

afterEach(() => {
    cleanup();
    uninstallJsonDbWindow();
    vi.restoreAllMocks();
});

describe('A2 consolidated building form gate', () => {
    it('attraversa UI, resolver, mapping, repository e storage per tutti i campi e le feature', async () => {
        const accountA = 'user-9401';
        const accountB = 'user-9402';
        const { storage, keyA } = installAccounts(accountA, accountB);
        createBuildingRepository({ accountId: accountA }).list();
        createBuildingRepository({ accountId: accountB }).list();
        storage.resetOperationLogs();
        const onCreated = vi.fn();
        render(<BuildingCreateForm accountId={accountA} onCreated={onCreated} />);

        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(7);
        for (const name of ['Informazioni generali', 'Unità', 'Informazioni aggiuntive', 'Informazioni finanziarie']) {
            expect(screen.getByRole<HTMLButtonElement>('tab', { name }).disabled).toBe(false);
        }
        for (const name of ['Password e codice', 'Foto', 'Documenti']) {
            const tab = screen.getByRole<HTMLButtonElement>('tab', { name });
            expect(tab.disabled).toBe(true);
            expect(tab.className).toMatch(/amber/);
            fireEvent.click(tab);
            expect(screen.getByRole('tab', { name: 'Informazioni generali' }).getAttribute('aria-selected')).toBe('true');
        }
        expect(screen.queryByText(/Criteri di ripartizione/i)).toBeNull();
        expect(screen.queryByText(/millesimi/i)).toBeNull();

        fireEvent.click(screen.getByRole('tab', { name: 'Unità' }));
        expect(screen.getByRole('note').textContent).toContain("L'edificio può essere salvato senza unità.");
        expect(screen.queryByRole('button', { name: /Aggiungi unità/i })).toBeNull();
        expect(screen.queryByLabelText(/buildingId|edificio associato/i)).toBeNull();
        fireEvent.click(screen.getByRole('tab', { name: 'Informazioni generali' }));

        const generalValues: Record<string, string> = {
            identifier: '  Palazzo Gate A2  ', color: '#ABCDEF', address: '  Via Roma 10  ',
            address2: '  Scala B  ', city: '  Roma  ', postalCode: ' 00100 ', county: ' RM ',
            state: ' Lazio ', country: ' it ', size: '245.5', constructionYear: '1988',
            description: '  Descrizione  interna  completa  ', privateNote: '  Nota  privata distinta  ',
        };
        Object.entries(generalValues).forEach(([id, value]) => change(id, value));

        fireEvent.click(screen.getByRole('tab', { name: 'Informazioni aggiuntive' }));
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes).toHaveLength(BUILDING_FEATURE_VALUES.length);
        BUILDING_FEATURE_VALUES.forEach((feature, index) => {
            const checkbox = checkboxes[index] as HTMLInputElement;
            expect(checkbox.id).toBe(feature);
            expect(checkbox.value).toBe(feature);
            fireEvent.click(checkbox);
        });
        expect(screen.queryByText('Sicuro')).toBeNull();

        fireEvent.click(screen.getByRole('tab', { name: 'Informazioni finanziarie' }));
        fireEvent.change(screen.getByLabelText('Data di acquisto'), { target: { value: '2020-05-06' } });
        fireEvent.change(screen.getByLabelText("Prezzo d'acquisto"), { target: { value: '500000' } });
        fireEvent.change(screen.getByLabelText('Spese di acquisto'), { target: { value: '25000.5' } });
        fireEvent.change(screen.getByLabelText('IMU'), { target: { value: '2300' } });

        fireEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
        expect(storage.writesFor(keyA)).toHaveLength(1);
        expect(screen.getAllByRole('status')).toHaveLength(1);

        const created = onCreated.mock.calls[0][0];
        expect(created).toMatchObject({
            identifier: 'Palazzo Gate A2', color: '#abcdef', address: 'Via Roma 10', address2: 'Scala B',
            city: 'Roma', postalCode: '00100', county: 'RM', state: 'Lazio', country: 'IT', size: 245.5,
            constructionYear: 1988, description: 'Descrizione  interna  completa',
            privateNote: 'Nota  privata distinta', acquisitionDate: '2020-05-06', purchasePrice: 500000,
            acquisitionCosts: 25000.5, imu: 2300, archived: false, unitsCount: 0,
        });
        expect(created.features).toEqual([...BUILDING_FEATURE_VALUES]);
        expect(new Set(created.features).size).toBe(BUILDING_FEATURE_VALUES.length);
        expect(created.id).toMatch(/^building-/);
        expect(created.createdAt).toBeTruthy();
        expect(created.updatedAt).toBeTruthy();

        const repositoryA = createBuildingRepository({ accountId: accountA });
        const repositoryB = createBuildingRepository({ accountId: accountB });
        expect(repositoryA.getById(created.id)).toEqual(created);
        expect(repositoryA.list()).toHaveLength(1);
        expect(repositoryB.list()).toHaveLength(0);
        assertDatabaseIntegrity(JSON.parse(storage.getItem(keyA)!));
    });

    it('rifiuta ED-01 senza write, successo o perdita dei valori', async () => {
        const accountA = 'user-9411';
        const { storage, keyA } = installAccounts(accountA, 'user-9412');
        const repository = createBuildingRepository({ accountId: accountA });
        repository.create({ identifier: 'Palazzo Centro', address: 'Via Uno 1', city: 'Roma', postalCode: '00100', country: 'IT' });
        storage.resetOperationLogs();
        const user = userEvent.setup();
        render(<BuildingCreateForm accountId={accountA} />);
        fillRequired('  PALAZZO CENTRO  ', '  Via Due 2  ');
        await user.click(screen.getByRole('button', { name: 'Salva' }));

        await waitFor(() => expect(document.activeElement).toBe(document.getElementById('identifier')));
        expect(repository.list()).toHaveLength(1);
        expect(storage.writesFor(keyA)).toHaveLength(0);
        expect(screen.queryByRole('status')).toBeNull();
        expect(screen.getByRole('alert').textContent).toContain("Esiste già un edificio con l'identificativo");
        expect((document.getElementById('identifier') as HTMLInputElement).value).toBe('  PALAZZO CENTRO  ');
        expect((document.getElementById('address') as HTMLInputElement).value).toBe('  Via Due 2  ');
    });

    it('rifiuta la localizzazione canonica duplicata senza write e segnala quattro campi', async () => {
        const accountA = 'user-9421';
        const { storage, keyA } = installAccounts(accountA, 'user-9422');
        const repository = createBuildingRepository({ accountId: accountA });
        repository.create({ identifier: 'Esistente', address: 'Via Roma 10', city: 'Roma', postalCode: '00100', country: 'IT' });
        storage.resetOperationLogs();
        const user = userEvent.setup();
        render(<BuildingCreateForm accountId={accountA} />);
        fillRequired('Nuovo edificio', '  VIA   ROMA 10  ', '  roma ', ' 00100 ', ' it ');
        await user.click(screen.getByRole('button', { name: 'Salva' }));

        await waitFor(() => expect(document.activeElement).toBe(document.getElementById('address')));
        const message = 'Esiste già un edificio allo stesso indirizzo.';
        expect(repository.list()).toHaveLength(1);
        expect(storage.writesFor(keyA)).toHaveLength(0);
        expect(screen.queryByRole('status')).toBeNull();
        expect(screen.getByRole('alert').textContent).toBe(message);
        for (const id of ['address', 'city', 'postalCode', 'country']) {
            expect(document.getElementById(id)?.parentElement?.textContent).toContain(message);
        }
        expect((document.getElementById('identifier') as HTMLInputElement).value).toBe('Nuovo edificio');
        expect((document.getElementById('address') as HTMLInputElement).value).toBe('  VIA   ROMA 10  ');
    });
});
