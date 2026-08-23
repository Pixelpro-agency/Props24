// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LocalAccount } from '../../src/auth/auth.types';
import { defaultPropertyValues } from '../../src/components/property-form/schema';
import type { BuildingRecord, LocalDatabase, PropertyRecord } from '../../src/db/database.types';
import { createJsonDbAccountScope } from '../../src/db/jsonDb';
import { BuildingDetailPage } from '../../src/pages/BuildingDetailPage';
import { BuildingsPage } from '../../src/pages/BuildingsPage';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';

const ACCOUNT_A = 'user-9601';
const ACCOUNT_B = 'user-9602';
const NOW = '2026-08-23T10:00:00.000Z';

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

function property(id: string, buildingId: string | null, options: Partial<PropertyRecord> = {}): PropertyRecord {
    return {
        id, createdAt: NOW, updatedAt: NOW, archived: false,
        formData: {
            ...defaultPropertyValues, PropertyTitle: id, PropertyAddress: `Via ${id}`,
            PropertyCity: 'Milano', PropertyPostalCode: '20100', PropertyCountry: 'IT',
        },
        relations: { buildingId, tenantIds: [], leaseIds: [] }, notes: [], activities: [], ...options,
    } as PropertyRecord;
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

function router(initialEntry: string) {
    return createMemoryRouter([
        { path: '/properties/buildings', element: <BuildingsPage /> },
        { path: '/properties/buildings/:id', element: <BuildingDetailPage /> },
        { path: '/properties/units/:id', element: <h1>Destinazione unità</h1> },
    ], { initialEntries: [initialEntry] });
}

beforeEach(() => { authenticatedAccount = account(ACCOUNT_A); });
afterEach(() => { cleanup(); uninstallJsonDbWindow(); vi.clearAllMocks(); });

describe('A6.1 building detail', () => {
    it('naviga dalla lista al dettaglio usando il vero Building ID', async () => {
        install(database([building('building-real', { address: 'Via Reale 10', identifier: 'Condominio Reale' })]));
        const appRouter = router('/properties/buildings');
        render(<RouterProvider router={appRouter} />);
        const link = await screen.findByRole('link', { name: 'Via Reale 10, Milano' });
        expect(link.getAttribute('href')).toBe('/properties/buildings/building-real');
        await userEvent.click(link);
        await waitFor(() => expect(appRouter.state.location.pathname).toBe('/properties/buildings/building-real'));
        expect(await screen.findByRole('heading', { name: 'Condominio Reale' })).toBeTruthy();
    });

    it('mostra soltanto unità collegate, incluse quelle archiviate', async () => {
        install(database(
            [building('building-target', { identifier: 'Target', unitsCount: 2 }), building('building-other')],
            [property('unit-active', 'building-target'), property('unit-archived', 'building-target', { archived: true }), property('unit-standalone', null), property('unit-other', 'building-other')],
        ));
        render(<RouterProvider router={router('/properties/buildings/building-target')} />);
        expect(await screen.findByRole('link', { name: 'unit-active' })).toBeTruthy();
        const archived = screen.getByRole('link', { name: 'unit-archived' }).closest('li')!;
        expect(within(archived).getByText('Archiviata')).toBeTruthy();
        expect(screen.queryByText('unit-standalone')).toBeNull();
        expect(screen.queryByText('unit-other')).toBeNull();
        expect(screen.getByText('2 unità')).toBeTruthy();
    });

    it('mostra lo stato vuoto per un Building senza unità', async () => {
        install(database([building('building-empty', { identifier: 'Vuoto' })]));
        render(<RouterProvider router={router('/properties/buildings/building-empty')} />);
        expect(await screen.findByRole('heading', { name: 'Unità collegate' })).toBeTruthy();
        expect(screen.getByText('0 unità')).toBeTruthy();
        expect(screen.getByText('Nessuna unità collegata.')).toBeTruthy();
    });

    it('naviga al dettaglio unità usando il vero Property ID', async () => {
        install(database([building('building-one', { unitsCount: 1 })], [property('property-real', 'building-one')]));
        const appRouter = router('/properties/buildings/building-one');
        render(<RouterProvider router={appRouter} />);
        await userEvent.click(await screen.findByRole('link', { name: 'property-real' }));
        await waitFor(() => expect(appRouter.state.location.pathname).toBe('/properties/units/property-real'));
        expect(screen.getByRole('heading', { name: 'Destinazione unità' })).toBeTruthy();
    });

    it('reagisce alla subscription reale quando le relazioni cambiano', async () => {
        install(database([building('building-live', { unitsCount: 1 })], [property('unit-first', 'building-live')]));
        render(<RouterProvider router={router('/properties/buildings/building-live')} />);
        expect(await screen.findByRole('link', { name: 'unit-first' })).toBeTruthy();
        const scope = createJsonDbAccountScope(ACCOUNT_A);
        const added = scope.getDatabase();
        added.properties.push(property('unit-second', 'building-live'));
        added.buildings[0].unitsCount = 2;
        scope.saveDatabase(added);
        expect(await screen.findByRole('link', { name: 'unit-second' })).toBeTruthy();
        expect(screen.getByText('2 unità')).toBeTruthy();
        const detached = scope.getDatabase();
        detached.properties[0].relations.buildingId = null;
        detached.buildings[0].unitsCount = 1;
        scope.saveDatabase(detached);
        await waitFor(() => expect(screen.queryByText('unit-first')).toBeNull());
        expect(screen.getByRole('link', { name: 'unit-second' })).toBeTruthy();
        expect(screen.getByText('1 unità')).toBeTruthy();
    });

    it('isola gli account e restituisce not found per un Building cross-account', async () => {
        install(
            database([building('building-a', { identifier: 'Building A', unitsCount: 1 })], [property('property-a', 'building-a')]),
            database([building('building-b', { identifier: 'Building B', unitsCount: 1 })], [property('property-b', 'building-b')]),
        );
        const first = render(<RouterProvider router={router('/properties/buildings/building-a')} />);
        expect(await screen.findByRole('link', { name: 'property-a' })).toBeTruthy();
        expect(screen.queryByText('property-b')).toBeNull();
        first.unmount();
        authenticatedAccount = account(ACCOUNT_B);
        render(<RouterProvider router={router('/properties/buildings/building-a')} />);
        expect(await screen.findByText('Edificio non trovato.')).toBeTruthy();
        expect(screen.queryByText('Building A')).toBeNull();
        expect(screen.queryByText('property-a')).toBeNull();
    });
});
