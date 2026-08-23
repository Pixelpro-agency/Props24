// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LocalAccount } from '../../src/auth/auth.types';
import { defaultPropertyValues } from '../../src/components/property-form/schema';
import type { BuildingRecord, LocalDatabase, PropertyRecord } from '../../src/db/database.types';
import { createJsonDbAccountScope } from '../../src/db/jsonDb';
import { BuildingDetailPage } from '../../src/pages/BuildingDetailPage';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';

const ACCOUNT_A = 'user-96401';
const ACCOUNT_B = 'user-96402';
const NOW = '2026-08-24T10:00:00.000Z';

function account(id: string): LocalAccount {
    return { id, firstName: 'Test', lastName: 'Account', email: `${id}@example.test`, fiscalCode: 'TSTCCT00A00A000A', password: 'password', createdAt: NOW };
}

let authenticatedAccount: LocalAccount | null = account(ACCOUNT_A);

vi.mock('../../src/auth/AuthContext', () => ({
    useAuth: () => ({ account: authenticatedAccount }),
}));

function building(id: string, options: Partial<BuildingRecord> = {}): BuildingRecord {
    return {
        id, createdAt: NOW, updatedAt: NOW, archived: false, identifier: `Edificio ${id}`,
        color: '', address: `Via ${id}`, address2: '', city: 'Milano', postalCode: '20100',
        county: '', state: 'Lombardia', country: 'IT', size: null, constructionYear: null,
        description: '', privateNote: '', features: [], acquisitionDate: '', purchasePrice: null,
        acquisitionCosts: null, imu: null, unitsCount: 0, ...options,
    };
}

function property(id: string, buildingId: string): PropertyRecord {
    return {
        id, createdAt: NOW, updatedAt: NOW, archived: false,
        formData: {
            ...defaultPropertyValues, PropertyTitle: `Unità ${id}`, PropertyAddress: 'Via unità 1',
            PropertyCity: 'Milano', PropertyPostalCode: '20100', PropertyCountry: 'IT',
        },
        relations: { buildingId, tenantIds: [], leaseIds: [] }, notes: [], activities: [],
    };
}

function database(buildings: BuildingRecord[] = [], properties: PropertyRecord[] = []): LocalDatabase {
    return {
        meta: { schemaVersion: 4, seedVersion: 3, createdAt: NOW, updatedAt: NOW, source: 'seed' },
        buildings, properties, tenants: [], leases: [], payments: [], contacts: [], documents: [],
        reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [],
        candidates: [], settings: {}, userProfile: {}, drafts: [],
    };
}

function install(databaseA: LocalDatabase, databaseB = database()) {
    const storage = new MemoryStorage({
        [`props24.localDb.${ACCOUNT_A}`]: JSON.stringify(databaseA),
        [`props24.localDb.${ACCOUNT_B}`]: JSON.stringify(databaseB),
    });
    const jsdomWindow = window;
    installJsonDbWindow(storage);
    Object.defineProperty(jsdomWindow, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: jsdomWindow });
}

function renderDetail(id: string) {
    const router = createMemoryRouter([
        { path: '/properties/buildings/:id', element: <BuildingDetailPage /> },
        { path: '/properties/buildings', element: <h1>Lista edifici</h1> },
        { path: '/properties/new', element: <h1>Nuova unità</h1> },
        { path: '/properties/units/:id', element: <h1>Unità</h1> },
    ], { initialEntries: [`/properties/buildings/${id}`] });
    render(<RouterProvider router={router} />);
    return router;
}

async function requestAndConfirm(action: 'Archivia' | 'Ripristina' | 'Elimina') {
    await userEvent.click(await screen.findByRole('button', { name: action }));
    await screen.findByRole('heading', { name: `${action} edificio` });
    await userEvent.click(screen.getByRole('button', { name: 'Conferma' }));
}

beforeEach(() => { authenticatedAccount = account(ACCOUNT_A); });
afterEach(() => { cleanup(); uninstallJsonDbWindow(); vi.clearAllMocks(); });

describe('A6.4 Building detail lifecycle', () => {
    it('mostra le azioni active e annulla il modal senza mutazioni', async () => {
        const target = building('target');
        install(database([target]));
        const router = renderDetail(target.id);
        expect(await screen.findByRole('link', { name: 'Aggiungi unità' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Modifica' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Archivia' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Elimina' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Ripristina' })).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Archivia' }));
        expect(await screen.findByRole('heading', { name: 'Archivia edificio' })).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
        await waitFor(() => expect(screen.queryByRole('heading', { name: 'Archivia edificio' })).toBeNull());
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings[0]).toEqual(target);
        expect(router.state.location.pathname).toBe(`/properties/buildings/${target.id}`);
        expect(screen.queryByText('Edificio archiviato.')).toBeNull();
    });

    it('archivia realmente con unità collegata senza modificare la Property', async () => {
        const target = building('target', { unitsCount: 1 });
        const linked = property('one', target.id);
        install(database([target], [linked]));
        const propertyBefore = createJsonDbAccountScope(ACCOUNT_A).getDatabase().properties[0];
        renderDetail(target.id);
        await requestAndConfirm('Archivia');
        expect(await screen.findByText('Edificio archiviato.')).toBeTruthy();
        const stored = createJsonDbAccountScope(ACCOUNT_A).getDatabase();
        expect(stored.buildings[0]).toMatchObject({ archived: true, unitsCount: 1 });
        expect(stored.properties[0]).toEqual(propertyBefore);
        expect(screen.getByText('Archiviato')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Ripristina' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Archivia' })).toBeNull();
        expect(screen.queryByRole('link', { name: 'Aggiungi unità' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Modifica' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Elimina' })).toBeTruthy();
    });

    it('ripristina realmente e aggiorna action set tramite subscription', async () => {
        const target = building('target', { archived: true });
        install(database([target]));
        const router = renderDetail(target.id);
        expect(await screen.findByRole('button', { name: 'Ripristina' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Archivia' })).toBeNull();
        expect(screen.queryByRole('link', { name: 'Aggiungi unità' })).toBeNull();
        await requestAndConfirm('Ripristina');
        expect(await screen.findByText('Edificio ripristinato.')).toBeTruthy();
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings[0].archived).toBe(false);
        expect(screen.getByText('Attivo')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Archivia' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Ripristina' })).toBeNull();
        expect(screen.getByRole('link', { name: 'Aggiungi unità' })).toBeTruthy();
        expect(router.state.location.pathname).toBe(`/properties/buildings/${target.id}`);
    });

    it('elimina un Building libero e naviga alla lista senza toccare gli altri', async () => {
        const target = building('target');
        const other = building('other');
        install(database([target, other]));
        const router = renderDetail(target.id);
        await userEvent.click(await screen.findByRole('button', { name: 'Elimina' }));
        expect(await screen.findByRole('heading', { name: 'Elimina edificio' })).toBeTruthy();
        expect(screen.getByText(/eliminazione è definitiva.*unità collegate/i)).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: 'Conferma' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/buildings'));
        expect(await screen.findByRole('heading', { name: 'Lista edifici' })).toBeTruthy();
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings).toEqual([other]);
        expect(screen.queryByText('Edificio non trovato.')).toBeNull();
    });

    it('mantiene aperto il modal e mostra l’errore dominio per delete bloccata', async () => {
        const target = building('target', { unitsCount: 1 });
        const linked = property('one', target.id);
        install(database([target], [linked]));
        const propertyBefore = createJsonDbAccountScope(ACCOUNT_A).getDatabase().properties[0];
        const router = renderDetail(target.id);
        await requestAndConfirm('Elimina');
        const alert = await screen.findByRole('alert');
        expect(alert.textContent).toContain('non può essere eliminato perché contiene unità collegate');
        expect(screen.getByRole('heading', { name: 'Elimina edificio' })).toBeTruthy();
        const stored = createJsonDbAccountScope(ACCOUNT_A).getDatabase();
        expect(stored.buildings[0]).toEqual(target);
        expect(stored.properties[0]).toEqual(propertyBefore);
        expect(router.state.location.pathname).toBe(`/properties/buildings/${target.id}`);
        expect(screen.queryByText('Successo')).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
        await waitFor(() => expect(screen.queryByRole('heading', { name: 'Elimina edificio' })).toBeNull());
    });

    it('elimina un Building archiviato libero senza ripristino preventivo', async () => {
        const target = building('target', { archived: true });
        install(database([target]));
        const router = renderDetail(target.id);
        expect(await screen.findByRole('button', { name: 'Ripristina' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Modifica' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Elimina' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Archivia' })).toBeNull();
        expect(screen.queryByRole('link', { name: 'Aggiungi unità' })).toBeNull();
        await requestAndConfirm('Elimina');
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/buildings'));
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings).toHaveLength(0);
    });

    it('archivia soltanto il Building omonimo dell’account autenticato', async () => {
        const targetA = building('building-shared', { identifier: 'Account A' });
        const targetB = building('building-shared', { identifier: 'Account B', address: 'Via B' });
        install(database([targetA]), database([targetB]));
        renderDetail(targetA.id);
        await requestAndConfirm('Archivia');
        expect(await screen.findByText('Edificio archiviato.')).toBeTruthy();
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings[0].archived).toBe(true);
        expect(createJsonDbAccountScope(ACCOUNT_B).getDatabase().buildings[0]).toEqual(targetB);
        expect(screen.getByText('Archiviato')).toBeTruthy();
    });
});
