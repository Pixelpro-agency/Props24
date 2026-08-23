// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LocalAccount } from '../../src/auth/auth.types';
import {
    defaultPropertyFormStateValues,
    type PropertyFormState,
} from '../../src/components/property-form/schema';
import { propertyDraftDefinition } from '../../src/components/property-form/propertyDraftDefinition';
import type { BuildingRecord, LocalDatabase } from '../../src/db/database.types';
import { createJsonDbAccountScope, setActiveDatabaseAccount } from '../../src/db/jsonDb';
import { createLocalDraftRepository } from '../../src/db/localDraftRepository';
import { DraftRepositoryProvider } from '../../src/drafts/DraftRepositoryContext';
import { BuildingDetailPage } from '../../src/pages/BuildingDetailPage';
import { NewProperty } from '../../src/pages/NewProperty';
import {
    installJsonDbWindow,
    MemoryStorage,
    uninstallJsonDbWindow,
} from '../db/jsonDbStorageHarness';

const ACCOUNT_A = 'user-96201';
const ACCOUNT_B = 'user-96202';
const NOW = '2026-08-23T12:00:00.000Z';

function account(id: string): LocalAccount {
    return {
        id,
        firstName: 'Test',
        lastName: 'Account',
        email: `${id}@example.test`,
        fiscalCode: 'TSTCCT00A00A000A',
        password: 'password',
        createdAt: NOW,
    };
}

let authenticatedAccount: LocalAccount | null = account(ACCOUNT_A);

vi.mock('../../src/auth/AuthContext', () => ({
    useAuth: () => ({ account: authenticatedAccount }),
}));

function building(
    id: string,
    options: Partial<BuildingRecord> = {},
): BuildingRecord {
    return {
        id,
        createdAt: NOW,
        updatedAt: NOW,
        archived: false,
        identifier: `Edificio ${id}`,
        color: '',
        address: `Via ${id} 10`,
        address2: `Scala ${id}`,
        city: 'Milano',
        postalCode: '20100',
        county: 'MI',
        state: 'Lombardia',
        country: 'IT',
        size: null,
        constructionYear: null,
        description: '',
        privateNote: '',
        features: [],
        acquisitionDate: '',
        purchasePrice: null,
        acquisitionCosts: null,
        imu: null,
        unitsCount: 0,
        ...options,
    };
}

function database(buildings: BuildingRecord[] = []): LocalDatabase {
    return {
        meta: {
            schemaVersion: 4,
            seedVersion: 3,
            createdAt: NOW,
            updatedAt: NOW,
            source: 'seed',
        },
        buildings,
        properties: [],
        tenants: [],
        leases: [],
        payments: [],
        contacts: [],
        documents: [],
        reservations: [],
        catalogs: [],
        inventory: [],
        maintenance: [],
        tasks: [],
        notes: [],
        messages: [],
        candidates: [],
        settings: {},
        userProfile: {},
        drafts: [],
    };
}

function install(databaseA: LocalDatabase, databaseB = database()) {
    const storage = new MemoryStorage({
        [`props24.localDb.${ACCOUNT_A}`]: JSON.stringify(databaseA),
        [`props24.localDb.${ACCOUNT_B}`]: JSON.stringify(databaseB),
    });
    const jsdomWindow = window;
    installJsonDbWindow(storage);
    Object.defineProperty(jsdomWindow, 'localStorage', {
        configurable: true,
        value: storage,
    });
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        writable: true,
        value: jsdomWindow,
    });
    setActiveDatabaseAccount(ACCOUNT_A);
}

function appRouter(initialEntry: string) {
    return createMemoryRouter([
        { path: '/properties/buildings/:id', element: <BuildingDetailPage /> },
        { path: '/properties/new', element: <NewProperty /> },
        { path: '/properties/buildings', element: <h1>Edifici</h1> },
        { path: '/properties/units/:id', element: <h1>Dettaglio unità</h1> },
    ], { initialEntries: [initialEntry] });
}

function renderRoute(initialEntry: string) {
    const router = appRouter(initialEntry);
    render(
        <DraftRepositoryProvider accountId={authenticatedAccount!.id}>
            <RouterProvider router={router} />
        </DraftRepositoryProvider>,
    );
    return router;
}

function input(name: keyof PropertyFormState): HTMLInputElement {
    return document.getElementById(name) as HTMLInputElement;
}

async function readyForm() {
    await screen.findByRole('heading', { name: 'Nuova unita' }, { timeout: 3000 });
    await screen.findByRole('button', { name: 'Salva' }, { timeout: 3000 });
}

async function fillUnit(title: string) {
    await userEvent.type(input('PropertyTitle'), title);
    await userEvent.type(input('PropertyFloor'), '3');
    await userEvent.type(input('PropertyDoorNum'), '7');
}

async function seedDraft(payload: Partial<PropertyFormState>) {
    const repository = createLocalDraftRepository({ accountId: ACCOUNT_A });
    await repository.save(propertyDraftDefinition, {
        mode: 'create',
        payload: { ...defaultPropertyFormStateValues, ...payload },
    });
}

beforeEach(() => {
    authenticatedAccount = account(ACCOUNT_A);
});

afterEach(() => {
    cleanup();
    setActiveDatabaseAccount(null);
    uninstallJsonDbWindow();
    vi.clearAllMocks();
});

describe('A6.2 add unit from Building', () => {
    it('naviga dalla CTA del Building al form con il vero buildingId', async () => {
        install(database([building('building-a')]));
        const router = renderRoute('/properties/buildings/building-a');
        const link = await screen.findByRole('link', { name: 'Aggiungi unità' });
        expect(link.getAttribute('href')).toBe('/properties/new?buildingId=building-a');
        await userEvent.click(link);
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/new'));
        expect(router.state.location.search).toBe('?buildingId=building-a');
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings).toHaveLength(1);
    });

    it('precompila e blocca l’indirizzo lasciando editabili i campi unità', async () => {
        const target = building('building-a');
        install(database([target]));
        renderRoute('/properties/new?buildingId=building-a');
        await readyForm();
        const expected = {
            PropertyAddress: target.address,
            PropertyAddress2: target.address2,
            PropertyCity: target.city,
            PropertyPostalCode: target.postalCode,
            PropertyCounty: target.county,
            PropertyState: target.state,
            PropertyCountry: target.country,
        } as const;
        for (const [name, value] of Object.entries(expected)) {
            expect(input(name as keyof PropertyFormState).value).toBe(value);
            expect(input(name as keyof PropertyFormState).readOnly).toBe(true);
        }
        await fillUnit('Unità contestuale');
        expect(input('PropertyTitle').value).toBe('Unità contestuale');
        expect(input('PropertyFloor').value).toBe('3');
        expect(input('PropertyDoorNum').value).toBe('7');
    });

    it('crea due Property figlie allo stesso indirizzo e aggiorna unitsCount', async () => {
        const target = building('building-a');
        install(database([target]));
        const router = renderRoute('/properties/new?buildingId=building-a');
        await readyForm();
        await fillUnit('Unità figlia 1');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toMatch(/^\/properties\/units\/.+/));
        let stored = createJsonDbAccountScope(ACCOUNT_A).getDatabase();
        expect(stored.buildings[0].unitsCount).toBe(1);
        await screen.findByRole('heading', { name: 'Dettaglio unità' });
        await router.navigate('/properties/new?buildingId=building-a');
        await readyForm();
        await fillUnit('Unità figlia 2');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toMatch(/^\/properties\/units\/.+/));
        stored = createJsonDbAccountScope(ACCOUNT_A).getDatabase();
        expect(stored.buildings).toHaveLength(1);
        expect(stored.properties).toHaveLength(2);
        expect(stored.properties.map((item) => item.formData.PropertyTitle))
            .toEqual(['Unità figlia 1', 'Unità figlia 2']);
        for (const property of stored.properties) {
            expect(property.relations.buildingId).toBe(target.id);
            expect(property.formData).toMatchObject({
                PropertyAddress: target.address,
                PropertyAddress2: target.address2,
                PropertyCity: target.city,
                PropertyPostalCode: target.postalCode,
                PropertyCountry: target.country,
            });
        }
        expect(stored.buildings[0].unitsCount).toBe(2);
    });

    it('salva e riprende dopo remount la bozza Building v2 con entityId null', async () => {
        const target = building('building-a');
        install(database([target]));
        const first = renderRoute('/properties/new?buildingId=building-a');
        await readyForm();
        await fillUnit('Unità in bozza');
        await userEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await screen.findByText('Bozza salvata.');
        const saved = createJsonDbAccountScope(ACCOUNT_A).getDatabase().drafts[0];
        expect(saved).toMatchObject({ schemaVersion: 2, mode: 'create', entityId: null });
        expect(saved.payload).toMatchObject({
            PropertyBuildingId: target.id,
            PropertyAddress: target.address,
            PropertyTitle: 'Unità in bozza',
            PropertyFloor: '3',
            PropertyDoorNum: '7',
        });
        first.dispose();
        cleanup();
        renderRoute('/properties/new?buildingId=building-a');
        await userEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));
        expect(input('PropertyTitle').value).toBe('Unità in bozza');
        expect(input('PropertyFloor').value).toBe('3');
        expect(input('PropertyDoorNum').value).toBe('7');
        expect(input('PropertyAddress').value).toBe(target.address);
        expect(input('PropertyAddress').readOnly).toBe(true);
    });

    it('ribasa sul Building corrente una bozza proveniente da un altro Building', async () => {
        const target = building('building-a');
        const previous = building('building-b');
        install(database([target, previous]));
        await seedDraft({
            PropertyBuildingId: previous.id,
            PropertyTitle: 'Bozza da B',
            PropertyFloor: '5',
            PropertyDoorNum: '9',
            PropertyAddress: previous.address,
            PropertyAddress2: previous.address2,
            PropertyCity: previous.city,
            PropertyPostalCode: previous.postalCode,
            PropertyCounty: previous.county,
            PropertyState: previous.state,
            PropertyCountry: previous.country,
        });
        renderRoute('/properties/new?buildingId=building-a');
        await userEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));
        expect(input('PropertyTitle').value).toBe('Bozza da B');
        expect(input('PropertyFloor').value).toBe('5');
        expect(input('PropertyAddress').value).toBe(target.address);
        expect(input('PropertyAddress').readOnly).toBe(true);
        await userEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await screen.findByText('Bozza salvata.');
        const payload = createJsonDbAccountScope(ACCOUNT_A).getDatabase().drafts[0]
            .payload as PropertyFormState;
        expect(payload.PropertyBuildingId).toBe(target.id);
        expect(payload.PropertyAddress).toBe(target.address);
        expect(payload.PropertyAddress2).toBe(target.address2);
    });

    it('elimina la bozza e ricomincia dalla baseline Building pulita', async () => {
        const target = building('building-a');
        install(database([target]));
        await seedDraft({
            PropertyBuildingId: 'building-old',
            PropertyTitle: 'Da eliminare',
            PropertyFloor: '8',
            PropertyAddress: 'Via vecchia',
        });
        renderRoute('/properties/new?buildingId=building-a');
        await userEvent.click(await screen.findByRole('button', {
            name: 'Elimina e ricomincia',
        }));
        await readyForm();
        expect(input('PropertyTitle').value).toBe('');
        expect(input('PropertyFloor').value).toBe('');
        expect(input('PropertyAddress').value).toBe(target.address);
        expect(input('PropertyAddress').readOnly).toBe(true);
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().drafts).toHaveLength(0);
    });

    it('blocca missing, cross-account e archiviato e nasconde la CTA archiviata', async () => {
        const active = building('building-a');
        const archived = building('building-archived', { archived: true });
        install(database([active, archived]));
        const missing = renderRoute('/properties/new?buildingId=building-missing');
        expect((await screen.findByRole('alert')).textContent)
            .toContain('Edificio non disponibile.');
        expect(screen.queryByRole('heading', { name: 'Nuova unita' })).toBeNull();
        missing.dispose();
        cleanup();
        authenticatedAccount = account(ACCOUNT_B);
        setActiveDatabaseAccount(ACCOUNT_B);
        const cross = renderRoute('/properties/new?buildingId=building-a');
        expect((await screen.findByRole('alert')).textContent)
            .toContain('Edificio non disponibile.');
        expect(createJsonDbAccountScope(ACCOUNT_B).getDatabase().properties).toHaveLength(0);
        cross.dispose();
        cleanup();
        authenticatedAccount = account(ACCOUNT_A);
        setActiveDatabaseAccount(ACCOUNT_A);
        const blocked = renderRoute('/properties/new?buildingId=building-archived');
        expect((await screen.findByRole('alert')).textContent).toContain('archiviato');
        expect(screen.queryByRole('heading', { name: 'Nuova unita' })).toBeNull();
        blocked.dispose();
        cleanup();
        renderRoute('/properties/buildings/building-archived');
        expect(await screen.findByRole('heading', { name: 'Edificio building-archived' })).toBeTruthy();
        expect(screen.queryByRole('link', { name: 'Aggiungi unità' })).toBeNull();
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().properties).toHaveLength(0);
    });

    it('mantiene invariato il flusso standalone senza relazione Building', async () => {
        install(database());
        const router = renderRoute('/properties/new');
        await readyForm();
        expect(input('PropertyAddress').readOnly).toBe(false);
        await fillUnit('Unità standalone');
        await userEvent.type(input('PropertyAddress'), 'Via autonoma 1');
        await userEvent.type(input('PropertyCity'), 'Roma');
        await userEvent.type(input('PropertyPostalCode'), '00100');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toMatch(/^\/properties\/units\/.+/));
        const stored = createJsonDbAccountScope(ACCOUNT_A).getDatabase();
        expect(stored.buildings).toHaveLength(0);
        expect(stored.properties).toHaveLength(1);
        expect(stored.properties[0].relations.buildingId).toBeNull();
    });
});
