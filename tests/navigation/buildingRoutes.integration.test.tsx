// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LocalAccount } from '../../src/auth/auth.types';
import { NewBuildingPage } from '../../src/pages/NewBuildingPage';
import { BuildingDetailPage } from '../../src/pages/BuildingDetailPage';
import { createBuildingRepository } from '../../src/db/buildingRepository';
import type { LocalDatabase } from '../../src/db/database.types';
import { isKnownRoute } from '../../src/utils/routes';
import { MemoryStorage, installJsonDbWindow, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';
import { DraftRepositoryProvider } from '../../src/drafts/DraftRepositoryContext';

const ACCOUNT_A = 'user-9501';
const ACCOUNT_B = 'user-9502';
const KEY_A = `props24.localDb.${ACCOUNT_A}`;
const KEY_B = `props24.localDb.${ACCOUNT_B}`;
const EARLIER = '2026-08-20T12:00:00.000Z';

function account(id: string): LocalAccount {
    return {
        id, firstName: 'Test', lastName: 'Account', email: `${id}@example.test`,
        fiscalCode: 'TSTCCT00A00A000A', password: 'test-password', createdAt: EARLIER,
    };
}

let authenticatedAccount: LocalAccount | null = account(ACCOUNT_A);

vi.mock('../../src/auth/AuthContext', () => ({
    useAuth: () => ({ account: authenticatedAccount }),
}));

function emptyDatabase(): LocalDatabase {
    return {
        meta: { schemaVersion: 4, seedVersion: 3, createdAt: EARLIER, updatedAt: EARLIER, source: 'seed' },
        buildings: [], properties: [], tenants: [], leases: [], payments: [], contacts: [], documents: [],
        reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [],
        candidates: [], settings: {}, userProfile: {}, drafts: [],
    };
}

function routes(initialEntry: string) {
    return createMemoryRouter([
        { path: '/properties/buildings/new', element: <DraftRepositoryProvider accountId={ACCOUNT_A}><NewBuildingPage /></DraftRepositoryProvider> },
        { path: '/properties/buildings/:id', element: <BuildingDetailPage /> },
        { path: '/properties/buildings', element: <div>Lista edifici</div> },
    ], { initialEntries: [initialEntry] });
}

function change(id: string, value: string) {
    fireEvent.change(document.getElementById(id)!, { target: { value } });
}

beforeEach(() => {
    authenticatedAccount = account(ACCOUNT_A);
    installJsonDbWindow(new MemoryStorage({
        [KEY_A]: JSON.stringify(emptyDatabase()),
        [KEY_B]: JSON.stringify(emptyDatabase()),
    }));
    Object.defineProperty(window, 'document', { configurable: true, value: document });
});

afterEach(() => {
    cleanup();
    uninstallJsonDbWindow();
    vi.clearAllMocks();
});

describe('building routes integration', () => {
    it('crea in ACCOUNT_A, naviga con l’id reale e rende il dettaglio account-scoped', async () => {
        const user = userEvent.setup();
        const router = routes('/properties/buildings/new');
        render(<RouterProvider router={router} />);
        expect(screen.getByRole('heading', { name: 'Nuovo edificio' })).toBeTruthy();
        await screen.findByRole('button', { name: 'Salva' });
        change('identifier', 'Edificio Route');
        change('address', 'Via Router 10');
        change('city', 'Roma');
        change('postalCode', '00100');
        change('country', 'it');
        await user.click(screen.getByRole('button', { name: 'Salva' }));

        const repositoryA = createBuildingRepository({ accountId: ACCOUNT_A });
        await waitFor(() => expect(repositoryA.list()).toHaveLength(1));
        const created = repositoryA.list()[0];
        expect(createBuildingRepository({ accountId: ACCOUNT_B }).list()).toHaveLength(0);
        await waitFor(() => expect(router.state.location.pathname)
            .toBe(`/properties/buildings/${created.id}`));
        expect(await screen.findByRole('heading', { name: 'Edificio Route' })).toBeTruthy();
        expect(screen.getByText('Via Router 10')).toBeTruthy();
        expect(screen.getByText('00100 Roma')).toBeTruthy();
        expect(screen.getByText('IT')).toBeTruthy();
    });

    it('non espone un edificio di ACCOUNT_A nel dettaglio di ACCOUNT_B', () => {
        const created = createBuildingRepository({ accountId: ACCOUNT_A }).create({
            identifier: 'Edificio Segreto', address: 'Via Privata 1', city: 'Roma', postalCode: '00100', country: 'IT',
        });
        authenticatedAccount = account(ACCOUNT_B);
        render(<RouterProvider router={routes(`/properties/buildings/${created.id}`)} />);
        expect(screen.getByRole('alert').textContent).toBe('Edificio non trovato.');
        expect(screen.queryByText('Edificio Segreto')).toBeNull();
        expect(screen.getByRole('link', { name: 'Torna agli edifici' }).getAttribute('href'))
            .toBe('/properties/buildings');
    });

    it('gestisce un id inesistente senza crash', () => {
        render(<RouterProvider router={routes('/properties/buildings/building-missing')} />);
        expect(screen.getByRole('alert').textContent).toBe('Edificio non trovato.');
        expect(screen.getByRole('link', { name: 'Torna agli edifici' })).toBeTruthy();
    });

    it.each(['Annulla', 'Indietro'])('usa il fallback sicuro della lista con %s', async (control) => {
        const user = userEvent.setup();
        const router = routes('/properties/buildings/new');
        render(<RouterProvider router={router} />);
        await user.click(screen.getByRole('button', { name: control }));
        expect(await screen.findByText('Lista edifici')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/properties/buildings');
    });

    it('riconosce solo le nuove route supportate', () => {
        expect(isKnownRoute('/properties/buildings/new')).toBe(true);
        expect(isKnownRoute('/properties/buildings/building-123')).toBe(true);
        expect(isKnownRoute('/properties/buildings/building-123/edit')).toBe(false);
    });
});
