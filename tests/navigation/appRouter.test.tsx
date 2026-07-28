// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    RouterProvider,
    createMemoryRouter,
    matchRoutes,
    useNavigate,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '../../src/auth/AuthContext';
import {
    AUTH_ACCOUNTS_STORAGE_KEY,
    AUTH_SESSION_STORAGE_KEY,
} from '../../src/auth/authStorage';
import type { LocalAccount } from '../../src/auth/auth.types';
import { createAppRoutes } from '../../src/router';

vi.mock('../../src/db/jsonDb', () => ({
    setActiveDatabaseAccount: vi.fn(),
}));

vi.mock('../../src/components/auth/AuthModal', () => ({
    AuthModal: () => <div data-testid="auth-modal">Auth modal</div>,
}));

vi.mock('../../src/contacts/ContactRepositoryContext', () => ({
    ContactRepositoryProvider: ({
        accountId,
        children,
    }: {
        accountId: string;
        children: React.ReactNode;
    }) => (
        <div data-testid="contact-provider" data-account-id={accountId}>
            {children}
        </div>
    ),
}));

vi.mock('../../src/components/layout/Layout', () => ({
    Layout: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="layout">
            <button
                type="button"
                onClick={() => {
                    const event = new CustomEvent('test-navigation');
                    window.dispatchEvent(event);
                }}
            >
                Layout
            </button>
            {children}
        </div>
    ),
}));

function page(name: string) {
    return function MockPage() {
        const navigate = useNavigate();
        return (
            <div data-testid={`page-${name}`}>
                {name}
                {name === 'dashboard' ? (
                    <button type="button" onClick={() => navigate('/tenants')}>
                        Vai a inquilini
                    </button>
                ) : null}
            </div>
        );
    };
}

vi.mock('../../src/pages/DashboardPage', () => ({
    DashboardPage: page('dashboard'),
}));
vi.mock('../../src/pages/PropertiesPage', () => ({
    PropertiesPage: page('properties'),
}));
vi.mock('../../src/pages/BuildingsPage', () => ({
    BuildingsPage: page('buildings'),
}));
vi.mock('../../src/pages/NewProperty', () => ({
    NewProperty: page('new-property'),
}));
vi.mock('../../src/pages/ImportUnitsPage', () => ({
    ImportUnitsPage: page('import-units'),
}));
vi.mock('../../src/pages/PropertyDetailPage', () => ({
    PropertyDetailPage: page('property-detail'),
}));
vi.mock('../../src/pages/NewTenantPage', () => ({
    NewTenantPage: page('new-tenant'),
}));
vi.mock('../../src/pages/TenantsPage', () => ({
    TenantsPage: page('tenants'),
}));
vi.mock('../../src/pages/TenantDetailPage', () => ({
    TenantDetailPage: page('tenant-detail'),
}));
vi.mock('../../src/landlord/leases/pages/NewLeasePage', () => ({
    NewLeasePage: page('new-lease'),
}));
vi.mock('../../src/pages/LeasesPage', () => ({
    LeasesPage: page('leases'),
}));
vi.mock('../../src/pages/LeaseDetailPage', () => ({
    LeaseDetailPage: page('lease-detail'),
}));
vi.mock('../../src/pages/EditLeasePage', () => ({
    EditLeasePage: page('edit-lease'),
}));
vi.mock('../../src/pages/DocumentTemplatesPage', () => ({
    DocumentTemplatesPage: page('document-templates'),
}));

const account: LocalAccount = {
    id: 'user-001',
    firstName: 'Francesco',
    lastName: 'Svara',
    email: 'francesco.svara@gmail.com',
    fiscalCode: 'SVRFNC90L20L219E',
    password: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
};

function authenticate(): void {
    localStorage.setItem(AUTH_ACCOUNTS_STORAGE_KEY, JSON.stringify([account]));
    localStorage.setItem(
        AUTH_SESSION_STORAGE_KEY,
        JSON.stringify({ accountId: account.id }),
    );
}

function renderRouter(initialEntry: string, authenticated = false) {
    if (authenticated) authenticate();
    const router = createMemoryRouter(createAppRoutes(), {
        initialEntries: [initialEntry],
    });
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    const result = render(
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </QueryClientProvider>,
    );
    return { ...result, queryClient, router };
}

afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
});

describe('app Data Router', () => {
    it.each([
        ['/', '/'],
        ['/dashboard', '/dashboard'],
        ['/properties', '/properties'],
        ['/properties/units', '/properties/units'],
        ['/properties/units/property-1', '/properties/units/:id'],
        ['/properties/buildings', '/properties/buildings'],
        ['/properties/new', '/properties/new'],
        ['/properties/units/import', '/properties/units/import'],
        ['/tenants', '/tenants'],
        ['/tenants/new', '/tenants/new'],
        ['/tenants/tenant-1', '/tenants/:id'],
        ['/leases', '/leases'],
        ['/leases/new', '/leases/new'],
        ['/leases/lease-1/edit', '/leases/:id/edit'],
        ['/leases/lease-1', '/leases/:id'],
        ['/documents/all-templates', '/documents/all-templates'],
        ['/logout', '/logout'],
    ])('riconosce %s con la route %s', (pathname, expectedPath) => {
        const matches = matchRoutes(createAppRoutes(), pathname);
        expect(matches?.at(-1)?.route.path).toBe(expectedPath);
    });

    it.each([
        ['/', '/dashboard', 'page-dashboard'],
        ['/properties', '/properties/units', 'page-properties'],
    ])('preserva il redirect %s verso %s', async (
        initialEntry,
        expectedPath,
        pageTestId,
    ) => {
        const { router } = renderRouter(initialEntry, true);
        await screen.findByTestId(pageTestId);
        expect(router.state.location.pathname).toBe(expectedPath);
      });

    it('mostra solo AuthModal quando non autenticato', async () => {
        renderRouter('/dashboard');
        expect(await screen.findByTestId('auth-modal')).toBeTruthy();
        expect(screen.queryByTestId('layout')).toBeNull();
        expect(screen.queryByTestId('page-dashboard')).toBeNull();
    });

    it('reindirizza /logout non autenticato senza creare una sessione', async () => {
        const { router } = renderRouter('/logout');
        await screen.findByTestId('auth-modal');
        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/dashboard');
        });
        expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
        expect(screen.queryByTestId('layout')).toBeNull();
    });

    it('monta provider account-scoped, Layout e Outlet autenticati', async () => {
        renderRouter('/dashboard', true);
        expect(await screen.findByTestId('page-dashboard')).toBeTruthy();
        expect(screen.getByTestId('layout')).toBeTruthy();
        expect(screen.getByTestId('contact-provider').dataset.accountId)
            .toBe(account.id);
        expect(screen.queryByTestId('auth-modal')).toBeNull();
    });

    it('naviga fra route interne con la stessa configurazione', async () => {
        const user = userEvent.setup();
        const { router } = renderRouter('/dashboard', true);
        await user.click(await screen.findByRole('button', {
            name: 'Vai a inquilini',
        }));
        expect(await screen.findByTestId('page-tenants')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/tenants');
    });

    it('raggiunge LogoutPage e conserva il comportamento di logout', async () => {
        const { router } = renderRouter('/logout', true);
        await screen.findByTestId('auth-modal');
        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/dashboard');
        });
        expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
        expect(screen.queryByTestId('layout')).toBeNull();
    });
});
