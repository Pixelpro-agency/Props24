// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    RouterProvider,
    createBrowserRouter,
} from 'react-router-dom';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { AuthProvider } from '../../src/auth/AuthContext';
import {
    AUTH_SESSION_STORAGE_KEY,
    clearSession,
    initializeAccounts,
    writeSession,
} from '../../src/auth/authStorage';
import { getJsonDb, setActiveDatabaseAccount } from '../../src/db/jsonDb';
import { createAppRoutes } from '../../src/router';

const guardActions = vi.hoisted(() => ({
    saveDraft: vi.fn().mockResolvedValue(undefined),
    discardChanges: vi.fn(),
}));
const browserRouters: ReturnType<typeof createBrowserRouter>[] = [];

function page(name: string) {
    return function MockPage() {
        return <p>{name}</p>;
    };
}

vi.mock('../../src/pages/DashboardPage', async () => {
    const ReactModule = await import('react');
    const { Link } = await import('react-router-dom');
    const { useUnsavedChangesGuard } = await import(
        '../../src/navigation/useUnsavedChangesGuard'
    );
    const { UnsavedChangesDialog } = await import(
        '../../src/navigation/UnsavedChangesDialog'
    );
    return {
        DashboardPage: () => {
            const [isDirty, setIsDirty] = ReactModule.useState(false);
            const guard = useUnsavedChangesGuard({
                enabled: true,
                isDirty,
                isSubmitting: false,
                isSavingDraft: false,
                saveDraft: guardActions.saveDraft,
                discardChanges: guardActions.discardChanges,
            });
            return (
                <>
                    <p>Dashboard production tree</p>
                    <button onClick={() => setIsDirty(true)}>
                        Rendi dirty
                    </button>
                    <Link to="/logout">Logout QA</Link>
                    <UnsavedChangesDialog
                        open={guard.isDialogOpen}
                        phase={guard.state.phase}
                        error={guard.state.error}
                        actionsDisabled={guard.actionsDisabled}
                        onStay={guard.stay}
                        onSave={() => void guard.saveAndProceed()}
                        onDiscard={() => void guard.discardAndProceed()}
                    />
                </>
            );
        },
    };
});
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

function renderProductionTree() {
    window.history.replaceState(null, '', '/dashboard');
    const router = createBrowserRouter(createAppRoutes());
    browserRouters.push(router);
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    const view = render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <RouterProvider router={router} />
                </AuthProvider>
            </QueryClientProvider>
        </React.StrictMode>,
    );
    return { ...view, queryClient, router };
}

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearSession();
    initializeAccounts();
    writeSession('user-001');
    guardActions.saveDraft.mockClear();
    guardActions.discardChanges.mockClear();
});

afterEach(() => {
    cleanup();
    browserRouters.splice(0).forEach((router) => router.dispose());
    clearSession();
    setActiveDatabaseAccount(null);
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState(null, '', '/');
    vi.restoreAllMocks();
});

async function expectCompletedLogout(
    router: ReturnType<typeof createBrowserRouter>,
    consoleError: ReturnType<typeof vi.spyOn>,
) {
    await waitFor(() => expect(router.state.location.pathname)
        .toBe('/dashboard'));
    await waitFor(() => expect(screen.getByText('Accedi')).toBeTruthy());
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
    expect(screen.queryByPlaceholderText('Cerca...')).toBeNull();
    expect(screen.queryByText('Dashboard production tree')).toBeNull();
    expect(screen.queryByText('Unexpected Application Error')).toBeNull();
    expect(() => getJsonDb()).toThrow(
        'Database locale non disponibile: nessun account autenticato.',
    );
    const errors = consoleError.mock.calls.flat().join('\n');
    expect(errors).not.toContain(
        'Database locale non disponibile: nessun account autenticato.',
    );
    expect(errors).not.toContain('SearchBar');
}

describe('logout database teardown con albero production', () => {
    it('logout pulito smonta Layout e SearchBar senza errore DB', async () => {
        const consoleError = vi.spyOn(console, 'error');
        const unhandledRejections: unknown[] = [];
        const onUnhandledRejection = (event: PromiseRejectionEvent) => {
            unhandledRejections.push(event.reason);
            event.preventDefault();
        };
        window.addEventListener('unhandledrejection', onUnhandledRejection);
        const { router } = renderProductionTree();

        expect(await screen.findByText('Dashboard production tree'))
            .toBeTruthy();
        expect(screen.getByPlaceholderText('Cerca...')).toBeTruthy();
        expect(getJsonDb()).toBeTruthy();
        await userEvent.click(screen.getByRole('link', {
            name: 'Logout QA',
        }));

        await expectCompletedLogout(router, consoleError);
        expect(unhandledRejections).toEqual([]);
        window.removeEventListener(
            'unhandledrejection',
            onUnhandledRejection,
        );
    });

    it.each([
        ['Salva bozza', guardActions.saveDraft, guardActions.discardChanges],
        ['Abbandona', guardActions.discardChanges, guardActions.saveDraft],
    ])('logout dirty + %s non accede al DB dopo teardown', async (
        action,
        expectedAction,
        unexpectedAction,
    ) => {
        const consoleError = vi.spyOn(console, 'error');
        const { router } = renderProductionTree();
        expect(await screen.findByText('Dashboard production tree'))
            .toBeTruthy();
        await userEvent.click(screen.getByRole('button', {
            name: 'Rendi dirty',
        }));
        await userEvent.click(screen.getByRole('link', {
            name: 'Logout QA',
        }));
        expect(await screen.findByText('Modifiche non salvate')).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: action }));

        await expectCompletedLogout(router, consoleError);
        expect(expectedAction).toHaveBeenCalledOnce();
        expect(unexpectedAction).not.toHaveBeenCalled();
    });
});
