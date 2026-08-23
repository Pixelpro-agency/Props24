// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LocalAccount } from '../../src/auth/auth.types';
import { BUILDING_FEATURE_VALUES } from '../../src/components/building-form/schema';
import { defaultPropertyValues } from '../../src/components/property-form/schema';
import type { BuildingRecord, LocalDatabase, PropertyRecord } from '../../src/db/database.types';
import { createJsonDbAccountScope } from '../../src/db/jsonDb';
import { BuildingDetailPage } from '../../src/pages/BuildingDetailPage';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';

const ACCOUNT_A = 'user-96301';
const ACCOUNT_B = 'user-96302';
const NOW = '2026-08-24T08:00:00.000Z';

function account(id: string): LocalAccount {
    return { id, firstName: 'Test', lastName: 'Account', email: `${id}@example.test`, fiscalCode: 'TSTCCT00A00A000A', password: 'password', createdAt: NOW };
}

let authenticatedAccount: LocalAccount | null = account(ACCOUNT_A);

vi.mock('../../src/auth/AuthContext', () => ({
    useAuth: () => ({ account: authenticatedAccount }),
}));

function building(id: string, options: Partial<BuildingRecord> = {}): BuildingRecord {
    return {
        id, createdAt: NOW, updatedAt: NOW, archived: false,
        identifier: `Edificio ${id}`, color: '#123456', address: `Via ${id} 10`,
        address2: 'Scala A', city: 'Milano', postalCode: '20100', county: 'MI',
        state: 'Lombardia', country: 'IT', size: 450, constructionYear: 1999,
        description: 'Descrizione completa', privateNote: 'Nota privata',
        features: [BUILDING_FEATURE_VALUES[0], 'Garage'], acquisitionDate: '2020-02-20',
        purchasePrice: 500000, acquisitionCosts: 25000, imu: 1800, unitsCount: 0,
        ...options,
    };
}

function property(id: string, buildingId: string): PropertyRecord {
    return {
        id, createdAt: NOW, updatedAt: NOW, archived: false,
        formData: {
            ...defaultPropertyValues, PropertyTitle: 'Unità collegata',
            PropertyAddress: 'Via Vecchia 10', PropertyAddress2: 'Scala Vecchia',
            PropertyCity: 'Milano', PropertyPostalCode: '20100', PropertyCounty: 'MI',
            PropertyState: 'Lombardia', PropertyCountry: 'IT',
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

function router(id: string) {
    return createMemoryRouter([
        { path: '/properties/buildings/:id', element: <BuildingDetailPage /> },
        { path: '/properties/buildings', element: <h1>Edifici</h1> },
        { path: '/properties/new', element: <h1>Nuova unità</h1> },
        { path: '/properties/units/:id', element: <h1>Unità</h1> },
    ], { initialEntries: [`/properties/buildings/${id}`] });
}

function renderDetail(id: string) {
    const appRouter = router(id);
    const view = render(<RouterProvider router={appRouter} />);
    return { appRouter, view };
}

async function openEdit() {
    await userEvent.click(await screen.findByRole('button', { name: 'Modifica' }));
    await screen.findByRole('button', { name: 'Salva modifiche' });
}

function field(id: string): HTMLInputElement | HTMLTextAreaElement {
    return document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
}

function change(id: string, value: string) {
    fireEvent.change(field(id), { target: { value } });
}

beforeEach(() => { authenticatedAccount = account(ACCOUNT_A); });
afterEach(() => { cleanup(); uninstallJsonDbWindow(); vi.clearAllMocks(); });

describe('A6.3 Building edit', () => {
    it('apre il form edit con tutti i 18 campi precompilati e tab Unità informativo', async () => {
        const target = building('target');
        install(database([target]));
        renderDetail(target.id);
        await openEdit();
        const scalar = ['identifier', 'color', 'address', 'address2', 'city', 'postalCode', 'county', 'state', 'country', 'size', 'constructionYear', 'description', 'privateNote'] as const;
        for (const key of scalar) expect(field(key).value).toBe(String(target[key]));
        await userEvent.click(screen.getByRole('tab', { name: 'Informazioni aggiuntive' }));
        for (const feature of target.features) expect((screen.getByRole('checkbox', { name: feature }) as HTMLInputElement).checked).toBe(true);
        await userEvent.click(screen.getByRole('tab', { name: 'Informazioni finanziarie' }));
        expect(field('acquisitionDate').value).toBe(target.acquisitionDate);
        expect(field('purchasePrice').value).toBe(String(target.purchasePrice));
        expect(field('acquisitionCosts').value).toBe(String(target.acquisitionCosts));
        expect(field('imu').value).toBe(String(target.imu));
        await userEvent.click(screen.getByRole('tab', { name: 'Unità' }));
        expect(screen.getByText('Le unità collegate non si modificano inline.')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Aggiungi unità' })).toBeNull();
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings).toHaveLength(1);
    });

    it('annulla senza scritture o feedback e conserva Building e Property', async () => {
        const target = building('target', { unitsCount: 1 });
        const linked = property('unit-1', target.id);
        install(database([target], [linked]));
        renderDetail(target.id);
        await openEdit();
        change('identifier', 'Modificato'); change('address', 'Via nuova'); change('description', 'Nuova');
        await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
        expect(await screen.findByRole('heading', { name: target.identifier })).toBeTruthy();
        expect(screen.queryByText('Edificio aggiornato correttamente.')).toBeNull();
        const stored = createJsonDbAccountScope(ACCOUNT_A).getDatabase();
        expect(stored.buildings[0]).toEqual(target);
        expect(stored.properties[0]).toEqual(linked);
    });

    it('aggiorna tutti i 18 campi con self-exclusion e preserva metadata', async () => {
        const target = building('target', { unitsCount: 0 });
        install(database([target]));
        renderDetail(target.id);
        await openEdit();
        const next = {
            identifier: target.identifier, color: '#abcdef', address: target.address,
            address2: 'Scala Z', city: target.city, postalCode: target.postalCode,
            county: 'PV', state: 'Nuovo stato', country: target.country,
            size: '999', constructionYear: '2010', description: 'Descrizione nuova',
            privateNote: 'Nota nuova', acquisitionDate: '2024-01-15', purchasePrice: '700000',
            acquisitionCosts: '30000', imu: '2200',
        };
        for (const [key, value] of Object.entries(next).slice(0, 13)) change(key, value);
        await userEvent.click(screen.getByRole('tab', { name: 'Informazioni aggiuntive' }));
        for (const feature of target.features) await userEvent.click(screen.getByRole('checkbox', { name: feature }));
        await userEvent.click(screen.getByRole('checkbox', { name: 'Piscina' }));
        await userEvent.click(screen.getByRole('tab', { name: 'Informazioni finanziarie' }));
        for (const key of ['acquisitionDate', 'purchasePrice', 'acquisitionCosts', 'imu']) change(key, next[key as keyof typeof next]);
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        expect(await screen.findByText('Edificio aggiornato correttamente.')).toBeTruthy();
        const stored = createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings[0];
        expect(stored).toMatchObject({
            ...next, size: 999, constructionYear: 2010, purchasePrice: 700000,
            acquisitionCosts: 30000, imu: 2200, features: ['Piscina'], id: target.id,
            createdAt: target.createdAt, archived: target.archived, unitsCount: target.unitsCount,
        });
        expect(stored.updatedAt).not.toBe(target.updatedAt);
        expect(screen.getByRole('heading', { name: target.identifier })).toBeTruthy();
    });

    it('blocca un identificativo appartenente a un altro Building senza update parziale', async () => {
        const target = building('target');
        const existing = building('existing', { identifier: 'Identificativo occupato', address: 'Via altra 1' });
        install(database([target, existing]));
        renderDetail(target.id); await openEdit();
        change('identifier', existing.identifier);
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(document.activeElement).toBe(field('identifier'));
        expect(screen.queryByText('Edificio aggiornato correttamente.')).toBeNull();
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings).toEqual([target, existing]);
    });

    it('blocca la location di un altro Building senza update parziale', async () => {
        const target = building('target');
        const existing = building('existing', { address: 'Via occupata 1', city: 'Roma', postalCode: '00100', country: 'IT' });
        install(database([target, existing]));
        renderDetail(target.id); await openEdit();
        for (const key of ['address', 'city', 'postalCode', 'country'] as const) change(key, existing[key]);
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(document.activeElement).toBe(field('address'));
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings).toEqual([target, existing]);
    });

    it('cambia la location Building senza propagare dati alla Property collegata', async () => {
        const target = building('target', { address: 'Via Vecchia 10', unitsCount: 1 });
        const linked = property('unit-1', target.id);
        install(database([target], [linked]));
        renderDetail(target.id); await openEdit();
        const location = { address: 'Via Nuova 20', address2: 'Scala Nuova', city: 'Torino', postalCode: '10100', county: 'TO', state: 'Piemonte', country: 'IT' };
        for (const [key, value] of Object.entries(location)) change(key, value);
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await screen.findByText('Edificio aggiornato correttamente.');
        const stored = createJsonDbAccountScope(ACCOUNT_A).getDatabase();
        expect(stored.buildings[0]).toMatchObject({ ...location, unitsCount: 1 });
        expect(stored.properties[0]).toEqual(linked);
        expect(stored.properties[0].relations.buildingId).toBe(target.id);
        expect(screen.getByRole('link', { name: 'Unità collegata' })).toBeTruthy();
    });

    it('isola gli account e non espone edit per un Building cross-account', async () => {
        const target = building('target-a');
        const other = building('target-b', { identifier: 'Account B' });
        install(database([target]), database([other]));
        const first = renderDetail(target.id);
        await openEdit(); change('description', 'Aggiornato A');
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await screen.findByText('Edificio aggiornato correttamente.');
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings[0].description).toBe('Aggiornato A');
        expect(createJsonDbAccountScope(ACCOUNT_B).getDatabase().buildings[0]).toEqual(other);
        first.view.unmount(); authenticatedAccount = account(ACCOUNT_B);
        renderDetail(target.id);
        expect(await screen.findByText('Edificio non trovato.')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Modifica' })).toBeNull();
    });

    it('modifica un Building archiviato preservando lifecycle e CTA nascosta', async () => {
        const target = building('archived', { archived: true });
        install(database([target]));
        renderDetail(target.id);
        expect(await screen.findByText('Archiviato')).toBeTruthy();
        expect(screen.queryByRole('link', { name: 'Aggiungi unità' })).toBeNull();
        await openEdit(); change('description', 'Descrizione archiviata aggiornata');
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await screen.findByText('Edificio aggiornato correttamente.');
        const stored = createJsonDbAccountScope(ACCOUNT_A).getDatabase();
        expect(stored.buildings).toHaveLength(1);
        expect(stored.buildings[0]).toMatchObject({ id: target.id, archived: true, description: 'Descrizione archiviata aggiornata' });
        expect(screen.getByText('Archiviato')).toBeTruthy();
        expect(screen.queryByRole('link', { name: 'Aggiungi unità' })).toBeNull();
    });
});
