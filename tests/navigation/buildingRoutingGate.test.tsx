// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryRouter, matchRoutes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../src/auth/AuthContext';
import { AUTH_ACCOUNTS_STORAGE_KEY, AUTH_SESSION_STORAGE_KEY } from '../../src/auth/authStorage';
import type { LocalAccount } from '../../src/auth/auth.types';
import { MenuItem } from '../../src/components/layout/MenuItem';
import { menuData } from '../../src/data/menu';
import type { LocalDatabase } from '../../src/db/database.types';
import { createBuildingRepository } from '../../src/db/buildingRepository';
import { createAppRoutes } from '../../src/router';
import { isKnownRoute } from '../../src/utils/routes';
import { MemoryStorage, installJsonDbWindow, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';

vi.mock('../../src/components/auth/AuthModal', () => ({
    AuthModal: () => <div data-testid="auth-modal">Autenticazione richiesta</div>,
}));
vi.mock('../../src/components/layout/Layout', () => ({
    Layout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../src/contacts/ContactRepositoryContext', () => ({
    ContactRepositoryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../src/drafts/DraftRepositoryContext', () => ({
    DraftRepositoryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const ACCOUNT_A = 'user-9701';
const ACCOUNT_B = 'user-9702';
const KEY_A = `props24.localDb.${ACCOUNT_A}`;
const KEY_B = `props24.localDb.${ACCOUNT_B}`;
const EARLIER = '2026-08-20T12:00:00.000Z';
let storage: MemoryStorage;

function account(id: string): LocalAccount {
    return {
        id, firstName: 'Test', lastName: 'Account', email: `${id}@example.test`,
        fiscalCode: 'TSTCCT00A00A000A', password: 'test-password', createdAt: EARLIER,
    };
}

function emptyDatabase(): LocalDatabase {
    return {
        meta: { schemaVersion: 4, seedVersion: 3, createdAt: EARLIER, updatedAt: EARLIER, source: 'seed' },
        buildings: [], properties: [], tenants: [], leases: [], payments: [], contacts: [], documents: [],
        reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [],
        candidates: [], settings: {}, userProfile: {}, drafts: [],
    };
}

function authenticate(accountId: string) {
    storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({ accountId }));
}

function renderApp(pathname: string) {
    const router = createMemoryRouter(createAppRoutes(), { initialEntries: [pathname] });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </QueryClientProvider>,
    );
    return router;
}

function change(id: string, value: string) {
    fireEvent.change(document.getElementById(id)!, { target: { value } });
}

beforeEach(() => {
    storage = new MemoryStorage({
        [AUTH_ACCOUNTS_STORAGE_KEY]: JSON.stringify([account(ACCOUNT_A), account(ACCOUNT_B)]),
        [KEY_A]: JSON.stringify(emptyDatabase()),
        [KEY_B]: JSON.stringify(emptyDatabase()),
    });
    installJsonDbWindow(storage);
    Object.defineProperty(window, 'document', { configurable: true, value: document });
});

afterEach(() => {
    cleanup();
    uninstallJsonDbWindow();
    vi.restoreAllMocks();
});

describe('A3 consolidated building routing gate', () => {
    it('consolida route statiche/dinamiche, route note e protezione auth reale', async () => {
        expect(matchRoutes(createAppRoutes(), '/properties/buildings/new')?.at(-1)?.route.path)
            .toBe('/properties/buildings/new');
        expect(matchRoutes(createAppRoutes(), '/properties/buildings/building-gate')?.at(-1)?.route.path)
            .toBe('/properties/buildings/:id');
        expect(isKnownRoute('/properties/buildings/new')).toBe(true);
        expect(isKnownRoute('/properties/buildings/building-gate')).toBe(true);
        expect(isKnownRoute('/properties/buildings/building-gate/edit')).toBe(false);
        expect(isKnownRoute('/buildings/new')).toBe(false);

        renderApp('/properties/buildings/new');
        expect(await screen.findByTestId('auth-modal')).toBeTruthy();
        expect(screen.queryByRole('heading', { name: 'Nuovo edificio' })).toBeNull();
        cleanup();
        renderApp('/properties/buildings/building-gate');
        expect(await screen.findByTestId('auth-modal')).toBeTruthy();
        expect(screen.queryByText('Edificio non trovato.')).toBeNull();
    });

    it('attraversa header, create reale e dettaglio reale con ID e account corretti', async () => {
        authenticate(ACCOUNT_A);
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        const user = userEvent.setup();
        const router = renderApp('/properties/buildings');
        await user.click(await screen.findByRole('button', { name: 'Nuovo edificio' }));
        expect(router.state.location.pathname).toBe('/properties/buildings/new');
        expect(await screen.findByRole('heading', { name: 'Nuovo edificio' })).toBeTruthy();
        change('identifier', 'Edificio Gate A3');
        change('address', 'Via Gate 30');
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
        expect(await screen.findByRole('heading', { name: 'Edificio Gate A3' })).toBeTruthy();
        expect(screen.getByText('Via Gate 30')).toBeTruthy();
        expect(screen.getByText('00100 Roma')).toBeTruthy();
        expect(screen.getByText('IT')).toBeTruthy();
        expect(consoleSpy).not.toHaveBeenCalledWith('Naviga a: /buildings/new');
    });

    it('attraversa empty state e CTA fino alla pagina Nuovo edificio reale', async () => {
        authenticate(ACCOUNT_A);
        const user = userEvent.setup();
        const router = renderApp('/properties/buildings');
        await user.click(await screen.findByTitle('Cerca'));
        await user.type(screen.getByRole('searchbox'), '__a3_3_gate_empty__');
        const heading = await screen.findByRole('heading', { name: "Qui non c'è nulla…" });
        const emptyState = heading.parentElement!;
        expect(within(emptyState).getByText(
            'Questa sezione ti consente di gestire i tuoi edifici. Puoi creare un nuovo edificio in qualsiasi momento.',
        )).toBeTruthy();
        expect(within(emptyState).queryByText(/millesimi|spese comuni/i)).toBeNull();
        await user.click(within(emptyState).getByRole('button', { name: 'Nuovo edificio' }));
        expect(router.state.location.pathname).toBe('/properties/buildings/new');
        expect(await screen.findByRole('heading', { name: 'Nuovo edificio' })).toBeTruthy();
    });

    it('attraversa il quick-add reale del menu senza missing route', async () => {
        const properties = menuData.flatMap((group) => group.items)
            .find((item) => item.id === 'properties');
        const buildings = properties?.children?.find((item) => item.id === 'buildings');
        expect(buildings).toMatchObject({
            id: 'buildings', quickAdd: true, quickAddHref: '/properties/buildings/new',
        });
        const router = createMemoryRouter([
            { path: '/properties/buildings', element: <MenuItem item={buildings!} /> },
            { path: '/properties/buildings/new', element: <div>Nuovo edificio destinazione</div> },
        ], { initialEntries: ['/properties/buildings'] });
        render(<RouterProvider router={router} />);
        const quickAdd = screen.getByRole('button', { name: 'Nuovo' });
        expect(quickAdd.className).not.toContain('missing-route-text');
        await userEvent.click(quickAdd);
        expect(await screen.findByText('Nuovo edificio destinazione')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/properties/buildings/new');
    });

    it('usa il fallback reale sia per Annulla sia per Indietro', async () => {
        authenticate(ACCOUNT_A);
        const user = userEvent.setup();
        const router = renderApp('/properties/buildings/new');
        expect(await screen.findByRole('heading', { name: 'Nuovo edificio' })).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Annulla' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/buildings'));
        await router.navigate('/properties/buildings/new');
        expect(await screen.findByRole('heading', { name: 'Nuovo edificio' })).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Indietro' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/buildings'));
    });

    it('isola il dettaglio ACCOUNT_B dal Building reale di ACCOUNT_A', async () => {
        const created = createBuildingRepository({ accountId: ACCOUNT_A }).create({
            identifier: 'Edificio Solo A', address: 'Via Riservata 9', city: 'Roma', postalCode: '00100', country: 'IT',
        });
        authenticate(ACCOUNT_B);
        renderApp(`/properties/buildings/${created.id}`);
        expect((await screen.findByRole('alert')).textContent).toBe('Edificio non trovato.');
        expect(screen.queryByText('Edificio Solo A')).toBeNull();
        expect(screen.queryByText('Via Riservata 9')).toBeNull();
        expect(screen.getByRole('link', { name: 'Torna agli edifici' })).toBeTruthy();
    });
});
