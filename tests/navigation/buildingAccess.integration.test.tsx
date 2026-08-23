// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BuildingsPage } from '../../src/pages/BuildingsPage';
import { MenuItem } from '../../src/components/layout/MenuItem';
import { menuData } from '../../src/data/menu';

vi.mock('../../src/auth/AuthContext', () => ({
    useAuth: () => ({
        account: {
            id: 'user-9801', firstName: 'Test', lastName: 'Account',
            email: 'user-9801@example.test', fiscalCode: 'TSTCCT00A00A000A',
            password: 'test-password', createdAt: '2026-08-23T00:00:00.000Z',
        },
        isAuthenticated: true,
        isInitializing: false,
        login: vi.fn(), register: vi.fn(), logout: vi.fn(),
    }),
}));

function buildingsRouter(element: React.ReactNode) {
    return createMemoryRouter([
        { path: '/properties/buildings', element },
        { path: '/properties/buildings/new', element: <div>Destinazione Nuovo edificio</div> },
    ], { initialEntries: ['/properties/buildings'] });
}

beforeEach(() => localStorage.clear());
afterEach(() => {
    cleanup();
    localStorage.clear();
});

describe('building create UI access', () => {
    it('naviga dal pulsante Nuovo edificio dell’header', async () => {
        const user = userEvent.setup();
        const router = buildingsRouter(<BuildingsPage />);
        render(<RouterProvider router={router} />);
        expect(screen.getByRole('heading', { name: "Qui non c'è nulla…" })).toBeTruthy();
        const heading = screen.getByRole('heading', { name: 'Edifici' });
        const header = heading.parentElement!;
        await user.click(within(header).getByRole('button', { name: 'Nuovo edificio' }));
        expect(await screen.findByText('Destinazione Nuovo edificio')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/properties/buildings/new');
    });

    it('mostra la nuova copy e naviga dalla CTA dell’empty state reale', async () => {
        const user = userEvent.setup();
        const router = buildingsRouter(<BuildingsPage />);
        render(<RouterProvider router={router} />);
        await user.click(screen.getByTitle('Cerca'));
        await user.type(screen.getByRole('searchbox'), '__a3_2_nessun_edificio__');
        const heading = await screen.findByRole('heading', { name: "Qui non c'è nulla…" });
        const emptyState = heading.parentElement!;
        expect(within(emptyState).getByText(
            'Questa sezione ti consente di gestire i tuoi edifici. Puoi creare un nuovo edificio in qualsiasi momento.',
        )).toBeTruthy();
        expect(within(emptyState).queryByText(/millesimi/i)).toBeNull();
        expect(within(emptyState).queryByText(/spese comuni/i)).toBeNull();
        expect(screen.getAllByRole('button', { name: 'Nuovo edificio' })).toHaveLength(2);
        await user.click(within(emptyState).getByRole('button', { name: 'Nuovo edificio' }));
        expect(await screen.findByText('Destinazione Nuovo edificio')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/properties/buildings/new');
    });

    it('naviga dal quick-add reale Edifici senza missing route o assorbimento del NavLink', async () => {
        const properties = menuData.flatMap((group) => group.items)
            .find((item) => item.id === 'properties');
        const buildings = properties?.children?.find((item) => item.id === 'buildings');
        expect(buildings).toBeTruthy();
        expect(buildings?.quickAdd).toBe(true);
        expect(buildings?.quickAddHref).toBe('/properties/buildings/new');

        const router = buildingsRouter(<MenuItem item={buildings!} />);
        render(<RouterProvider router={router} />);
        const quickAdd = screen.getByRole('button', { name: 'Nuovo' });
        expect(quickAdd.className).not.toContain('missing-route-text');
        await userEvent.click(quickAdd);
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/buildings/new'));
        expect(router.state.location.pathname).not.toBe('/properties/buildings');
        expect(await screen.findByText('Destinazione Nuovo edificio')).toBeTruthy();
    });
});
