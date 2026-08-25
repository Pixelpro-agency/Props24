// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LocalAccount } from '../../src/auth/auth.types';
import { defaultPropertyValues, type PropertyFormState } from '../../src/components/property-form/schema';
import type { BuildingRecord, LocalDatabase, PropertyRecord } from '../../src/db/database.types';
import { createJsonDbAccountScope, setActiveDatabaseAccount } from '../../src/db/jsonDb';
import { DraftRepositoryProvider } from '../../src/drafts/DraftRepositoryContext';
import { BuildingDetailPage } from '../../src/pages/BuildingDetailPage';
import { BuildingsPage } from '../../src/pages/BuildingsPage';
import { NewProperty } from '../../src/pages/NewProperty';
import { PropertyDetailPage } from '../../src/pages/PropertyDetailPage';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';

class TestResizeObserver implements ResizeObserver {
    observe() {} unobserve() {} disconnect() {}
}
vi.stubGlobal('ResizeObserver', TestResizeObserver);

const ACCOUNT_A = 'user-96501';
const ACCOUNT_B = 'user-96502';
const NOW = '2026-08-24T12:00:00.000Z';

function account(id: string): LocalAccount {
    return { id, firstName: 'Gate', lastName: 'A6', email: `${id}@example.test`, fiscalCode: 'TSTGAT00A00A000A', password: 'password', createdAt: NOW };
}
let authenticatedAccount: LocalAccount | null = account(ACCOUNT_A);
vi.mock('../../src/auth/AuthContext', () => ({ useAuth: () => ({ account: authenticatedAccount }) }));

function building(id: string, options: Partial<BuildingRecord> = {}): BuildingRecord {
    return { id, createdAt: NOW, updatedAt: NOW, archived: false, identifier: `Edificio ${id}`, color: '', address: `Via ${id}`, address2: '', city: 'Milano', postalCode: '20100', county: '', state: 'Lombardia', country: 'IT', size: null, constructionYear: null, description: '', privateNote: '', features: [], acquisitionDate: '', purchasePrice: null, acquisitionCosts: null, imu: null, unitsCount: 0, ...options };
}
function property(id: string, buildingId: string | null, options: Partial<PropertyRecord> = {}): PropertyRecord {
    return { id, createdAt: NOW, updatedAt: NOW, archived: false, formData: { ...defaultPropertyValues, PropertyTitle: id, PropertyAddress: 'Via condivisa 1', PropertyCity: 'Milano', PropertyPostalCode: '20100', PropertyCountry: 'IT' }, relations: { buildingId, tenantIds: [], leaseIds: [] }, notes: [], activities: [], ...options } as PropertyRecord;
}
function database(buildings: BuildingRecord[] = [], properties: PropertyRecord[] = []): LocalDatabase {
    return { meta: { schemaVersion: 4, seedVersion: 3, createdAt: NOW, updatedAt: NOW, source: 'seed' }, buildings, properties, tenants: [], leases: [], payments: [], contacts: [], documents: [], reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [], candidates: [], settings: {}, userProfile: {}, drafts: [] };
}
function install(a: LocalDatabase, b = database()) {
    const storage = new MemoryStorage({ [`props24.localDb.${ACCOUNT_A}`]: JSON.stringify(a), [`props24.localDb.${ACCOUNT_B}`]: JSON.stringify(b) });
    const jsdomWindow = window;
    installJsonDbWindow(storage);
    Object.defineProperty(jsdomWindow, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: jsdomWindow });
    setActiveDatabaseAccount(ACCOUNT_A);
}
function makeRouter(entry: string) {
    return createMemoryRouter([
        { path: '/properties/buildings', element: <BuildingsPage /> },
        { path: '/properties/buildings/:id', element: <BuildingDetailPage /> },
        { path: '/properties/new', element: <NewProperty /> },
        { path: '/properties/units/:id', element: <PropertyDetailPage /> },
        { path: '/properties/units', element: <h1>Unità</h1> },
    ], { initialEntries: [entry] });
}
function mount(entry: string) {
    const router = makeRouter(entry);
    const view = render(<DraftRepositoryProvider accountId={authenticatedAccount!.id}><RouterProvider router={router} /></DraftRepositoryProvider>);
    return { router, view };
}
function input(name: keyof PropertyFormState) { return document.getElementById(name) as HTMLInputElement; }
async function readyProperty() { await screen.findByRole('button', { name: 'Salva' }, { timeout: 3000 }); }
async function fillUnit(title: string) {
    await userEvent.selectOptions(document.getElementById('PropertyTypeID') as HTMLSelectElement, 'appartamento');
    await userEvent.type(input('PropertyTitle'), title);
    await userEvent.type(input('PropertyFloor'), '2');
    await userEvent.type(input('PropertyDoorNum'), '4');
}
async function confirm(action: 'Archivia' | 'Ripristina' | 'Elimina') {
    await userEvent.click(await screen.findByRole('button', { name: action }));
    await screen.findByRole('heading', { name: `${action} edificio` });
    await userEvent.click(screen.getByRole('button', { name: 'Conferma' }));
}

beforeEach(() => { authenticatedAccount = account(ACCOUNT_A); });
afterEach(() => { cleanup(); setActiveDatabaseAccount(null); uninstallJsonDbWindow(); vi.clearAllMocks(); });

describe('A6.5 consolidated Building detail gate', () => {
    it('attraversa lista, dettaglio, sole unità collegate e PropertyDetailPage reale', async () => {
        const target = building('building-a6-gate', { identifier: 'Target gate', address: 'Via Target', unitsCount: 2 });
        const other = building('building-other', { address: 'Via Other' });
        install(database([target, other], [property('unit-active', target.id), property('unit-archived', target.id, { archived: true }), property('unit-other', other.id), property('unit-standalone', null)]));
        const { router } = mount('/properties/buildings');
        await userEvent.click(await screen.findByRole('link', { name: 'Via Target, Milano' }));
        await waitFor(() => expect(router.state.location.pathname).toBe(`/properties/buildings/${target.id}`));
        expect(screen.getByRole('heading', { name: 'Target gate' })).toBeTruthy();
        expect(screen.getByRole('link', { name: 'unit-active' })).toBeTruthy();
        expect(within(screen.getByRole('link', { name: 'unit-archived' }).closest('li')!).getByText('Archiviata')).toBeTruthy();
        expect(screen.queryByText('unit-other')).toBeNull(); expect(screen.queryByText('unit-standalone')).toBeNull();
        expect(screen.getByText('2 unità')).toBeTruthy();
        await userEvent.click(screen.getByRole('link', { name: 'unit-active' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/units/unit-active'));
        expect((await screen.findAllByRole('heading', { name: 'unit-active' })).length).toBeGreaterThan(0);
    });

    it('crea due unità reali nello stesso Building e indirizzo', async () => {
        const target = building('building-a6-gate', { address: 'Via Gate 10' }); install(database([target]));
        const { router } = mount(`/properties/buildings/${target.id}`);
        await userEvent.click(await screen.findByRole('link', { name: 'Aggiungi unità' }));
        expect(router.state.location.search).toBe(`?buildingId=${target.id}`); await readyProperty();
        expect(input('PropertyAddress').value).toBe(target.address); expect(input('PropertyAddress').readOnly).toBe(true);
        await fillUnit('Unità gate 1'); await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/properties\/units\/.+/));
        expect((await screen.findAllByRole('heading', { name: 'Unità gate 1' })).length).toBeGreaterThan(0);
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings[0].unitsCount).toBe(1);
        await router.navigate(`/properties/new?buildingId=${target.id}`); await readyProperty();
        await fillUnit('Unità gate 2'); await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/properties\/units\/.+/));
        expect((await screen.findAllByRole('heading', { name: 'Unità gate 2' })).length).toBeGreaterThan(0);
        const stored = createJsonDbAccountScope(ACCOUNT_A).getDatabase();
        expect(stored.buildings).toHaveLength(1); expect(stored.properties).toHaveLength(2); expect(stored.buildings[0].unitsCount).toBe(2);
        for (const unit of stored.properties) { expect(unit.relations.buildingId).toBe(target.id); expect(unit.formData.PropertyAddress).toBe(target.address); }
    });

    it('reagisce alla subscription e conserva i dati dopo remount', async () => {
        const target = building('building-a6-gate', { unitsCount: 1 }); install(database([target], [property('unit-one', target.id)]));
        const first = mount(`/properties/buildings/${target.id}`); expect(await screen.findByRole('link', { name: 'unit-one' })).toBeTruthy();
        const scope = createJsonDbAccountScope(ACCOUNT_A); const next = scope.getDatabase(); next.properties.push(property('unit-two', target.id)); next.buildings[0].unitsCount = 2; scope.saveDatabase(next);
        expect(await screen.findByRole('link', { name: 'unit-two' })).toBeTruthy(); expect(screen.getByText('2 unità')).toBeTruthy();
        first.view.unmount(); mount(`/properties/buildings/${target.id}`);
        expect(await screen.findByRole('link', { name: 'unit-one' })).toBeTruthy(); expect(screen.getByRole('link', { name: 'unit-two' })).toBeTruthy(); expect(screen.getByText('2 unità')).toBeTruthy();
    });

    it('modifica il Building senza propagare e usa la nuova location per Add Unit', async () => {
        const target = building('building-a6-gate', { address: 'Via Vecchia 10', unitsCount: 1 }); const linked = property('unit-linked', target.id); linked.formData.PropertyAddress = target.address;
        install(database([target], [linked])); const { router } = mount(`/properties/buildings/${target.id}`);
        await userEvent.click(await screen.findByRole('button', { name: 'Modifica' }));
        const changes = { identifier: 'Target aggiornato', address: 'Via Nuova 20', address2: 'Scala N', city: 'Torino', postalCode: '10100', county: 'TO', state: 'Piemonte', description: 'Aggiornato' };
        for (const [id, value] of Object.entries(changes)) fireEvent.change(document.getElementById(id)!, { target: { value } });
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' })); await screen.findByText('Edificio aggiornato correttamente.');
        const stored = createJsonDbAccountScope(ACCOUNT_A).getDatabase(); expect(stored.buildings[0]).toMatchObject({ id: target.id, ...changes, unitsCount: 1 }); expect(stored.properties[0].formData.PropertyAddress).toBe('Via Vecchia 10'); expect(stored.properties[0].relations.buildingId).toBe(target.id);
        const add = screen.getByRole('link', { name: 'Aggiungi unità' }); expect(add.getAttribute('href')).toBe(`/properties/new?buildingId=${target.id}`); await userEvent.click(add); await readyProperty(); expect(input('PropertyAddress').value).toBe('Via Nuova 20'); expect(input('PropertyAddress').readOnly).toBe(true); expect(router.state.location.search).toBe(`?buildingId=${target.id}`);
    });

    it('archivia e ripristina con unità senza modificarla', async () => {
        const target = building('building-a6-gate', { unitsCount: 1 }); const linked = property('unit-linked', target.id); install(database([target], [linked])); const before = createJsonDbAccountScope(ACCOUNT_A).getDatabase().properties[0]; const { router } = mount(`/properties/buildings/${target.id}`);
        await confirm('Archivia'); expect(await screen.findByText('Edificio archiviato.')).toBeTruthy(); let stored = createJsonDbAccountScope(ACCOUNT_A).getDatabase(); expect(stored.buildings[0]).toMatchObject({ archived: true, unitsCount: 1 }); expect(stored.properties[0]).toEqual(before); expect(screen.queryByRole('link', { name: 'Aggiungi unità' })).toBeNull();
        await confirm('Ripristina'); expect(await screen.findByText('Edificio ripristinato.')).toBeTruthy(); stored = createJsonDbAccountScope(ACCOUNT_A).getDatabase(); expect(stored.buildings[0].archived).toBe(false); expect(stored.properties[0]).toEqual(before); expect(screen.getByRole('link', { name: 'Aggiungi unità' })).toBeTruthy(); expect(router.state.location.pathname).toBe(`/properties/buildings/${target.id}`);
    });

    it('mantiene atomica la delete bloccata e il modal aperto', async () => {
        const target = building('building-a6-gate', { unitsCount: 1 }); const linked = property('unit-linked', target.id); install(database([target], [linked])); const before = createJsonDbAccountScope(ACCOUNT_A).getDatabase(); const { router } = mount(`/properties/buildings/${target.id}`);
        await confirm('Elimina'); expect((await screen.findByRole('alert')).textContent).toContain('non può essere eliminato perché contiene unità collegate'); expect(screen.getByRole('heading', { name: 'Elimina edificio' })).toBeTruthy(); expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase()).toEqual(before); expect(router.state.location.pathname).toBe(`/properties/buildings/${target.id}`); await userEvent.click(screen.getByRole('button', { name: 'Annulla' })); await waitFor(() => expect(screen.queryByRole('heading', { name: 'Elimina edificio' })).toBeNull());
    });

    it('elimina il Building libero e mostra la lista reale con gli altri record', async () => {
        const target = building('building-a6-gate', { address: 'Via Target' }); const other = building('building-other', { address: 'Via Other' }); install(database([target, other])); const { router } = mount(`/properties/buildings/${target.id}`);
        await confirm('Elimina'); await waitFor(() => expect(router.state.location.pathname).toBe('/properties/buildings')); expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings).toEqual([other]); expect(await screen.findByRole('link', { name: 'Via Other, Milano' })).toBeTruthy(); expect(screen.queryByText('Via Target, Milano')).toBeNull(); expect(screen.queryByText('Edificio non trovato.')).toBeNull();
    });

    it('isola account omonimi e resetta toast e contesto al remount', async () => {
        const targetA = building('building-shared', { identifier: 'Building account A' }); const targetB = building('building-shared', { identifier: 'Building account B', address: 'Via B' }); install(database([targetA]), database([targetB])); const first = mount('/properties/buildings/building-shared');
        expect(await screen.findByRole('heading', { name: 'Building account A' })).toBeTruthy(); await confirm('Archivia'); expect(await screen.findByText('Edificio archiviato.')).toBeTruthy(); expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings[0].archived).toBe(true); expect(createJsonDbAccountScope(ACCOUNT_B).getDatabase().buildings[0]).toEqual(targetB);
        first.view.unmount(); authenticatedAccount = account(ACCOUNT_B); setActiveDatabaseAccount(ACCOUNT_B); mount('/properties/buildings/building-shared'); expect(await screen.findByRole('heading', { name: 'Building account B' })).toBeTruthy(); expect(screen.getByText('Attivo')).toBeTruthy(); expect(screen.queryByText('Edificio archiviato.')).toBeNull(); expect(screen.getByRole('button', { name: 'Archivia' })).toBeTruthy(); expect(screen.queryByRole('button', { name: 'Ripristina' })).toBeNull();
    });
});
