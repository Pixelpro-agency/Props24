// @vitest-environment jsdom

import React from 'react';
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    Link,
    RouterProvider,
    createMemoryRouter,
    useLocation,
    useNavigate,
} from 'react-router-dom';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { AuthProvider, useAuth } from '../../src/auth/AuthContext';
import { LogoutPage } from '../../src/auth/LogoutPage';
import {
    AUTH_SESSION_STORAGE_KEY,
    clearSession,
    initializeAccounts,
    writeSession,
} from '../../src/auth/authStorage';
import { UnsavedChangesDialog } from '../../src/navigation/UnsavedChangesDialog';
import {
    useUnsavedChangesGuard,
    type UseUnsavedChangesGuardOptions,
} from '../../src/navigation/useUnsavedChangesGuard';

const { setActiveDatabaseAccountMock } = vi.hoisted(() => ({
    setActiveDatabaseAccountMock: vi.fn(),
}));

vi.mock('../../src/db/jsonDb', async (importOriginal) => {
    const original = await importOriginal<typeof import('../../src/db/jsonDb')>();
    return {
        ...original,
        setActiveDatabaseAccount: setActiveDatabaseAccountMock,
    };
});

interface Deferred {
    promise: Promise<void>;
    resolve(): void;
}

function deferred(): Deferred {
    let resolve!: () => void;
    const promise = new Promise<void>((resolvePromise) => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
}

function AuthState({ label }: { label: string }) {
    const { account } = useAuth();
    const location = useLocation();
    return (
        <>
            <output data-testid={`${label}-pathname`}>{location.pathname}</output>
            <output data-testid={`${label}-account`}>
                {account?.id ?? 'none'}
            </output>
        </>
    );
}

function renderIntegration(
    overrides: Partial<UseUnsavedChangesGuardOptions> = {},
) {
    const options: UseUnsavedChangesGuardOptions = {
        enabled: true,
        isDirty: true,
        isSubmitting: false,
        isSavingDraft: false,
        saveDraft: vi.fn().mockResolvedValue(undefined),
        discardChanges: vi.fn(),
        ...overrides,
    };
    const observeLogoutMount = vi.fn();

    function FormHarness() {
        const navigate = useNavigate();
        const guard = useUnsavedChangesGuard(options);
        return (
            <main>
                <AuthState label="form" />
                <Link to="/logout">Logout</Link>
                <button onClick={() => navigate('/other')}>Altra route</button>
                <output data-testid="guard-phase">{guard.state.phase}</output>
                <UnsavedChangesDialog
                    open={guard.isDialogOpen}
                    phase={guard.state.phase}
                    error={guard.state.error}
                    actionsDisabled={guard.actionsDisabled}
                    onStay={guard.stay}
                    onSave={() => void guard.saveAndProceed()}
                    onDiscard={() => void guard.discardAndProceed()}
                />
            </main>
        );
    }

    function RealLogoutRoute() {
        React.useEffect(() => {
            observeLogoutMount();
        }, []);
        return <LogoutPage />;
    }

    const router = createMemoryRouter([
        { path: '/form', element: <FormHarness /> },
        { path: '/logout', element: <RealLogoutRoute /> },
        {
            path: '/dashboard',
            element: (
                <main>
                    <AuthState label="dashboard" />
                    <p>Dashboard</p>
                </main>
            ),
        },
        { path: '/other', element: <p>Other</p> },
    ], { initialEntries: ['/form'] });
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
    return {
        ...view,
        router,
        options,
        queryClient,
        getLogoutMounts: () => observeLogoutMount.mock.calls.length,
    };
}

async function waitForAuthenticatedForm() {
    await waitFor(() => expect(screen.getByTestId('form-account').textContent)
        .toBe('user-001'));
}

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearSession();
    initializeAccounts();
    writeSession('user-001');
    setActiveDatabaseAccountMock.mockClear();
});

afterEach(() => {
    cleanup();
    clearSession();
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
});

describe('unsaved changes guard con logout reale', () => {
    it('logout clean elimina sessione e account e reindirizza dashboard', async () => {
        const view = renderIntegration({ isDirty: false });
        await waitForAuthenticatedForm();
        await userEvent.click(screen.getByRole('link', { name: 'Logout' }));
        await waitFor(() => expect(view.router.state.location.pathname)
            .toBe('/dashboard'));
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
        expect(screen.getByTestId('dashboard-account').textContent).toBe('none');
        expect(setActiveDatabaseAccountMock).toHaveBeenCalledWith(null);
        expect(view.getLogoutMounts()).toBeGreaterThan(0);
    });

    it('logout dirty + Resta preserva route, sessione e account', async () => {
        const view = renderIntegration();
        await waitForAuthenticatedForm();
        setActiveDatabaseAccountMock.mockClear();
        await userEvent.click(screen.getByRole('link', { name: 'Logout' }));
        expect(view.router.state.location.pathname).toBe('/form');
        expect(screen.getAllByRole('dialog')).toHaveLength(1);
        expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull();
        expect(screen.getByTestId('form-account').textContent).toBe('user-001');
        expect(setActiveDatabaseAccountMock).not.toHaveBeenCalledWith(null);
        await userEvent.click(screen.getByRole('button', { name: 'Resta' }));
        expect(view.router.state.location.pathname).toBe('/form');
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(view.options.saveDraft).not.toHaveBeenCalled();
        expect(view.options.discardChanges).not.toHaveBeenCalled();
        expect(view.getLogoutMounts()).toBe(0);
    });

    it('logout dirty + save attende, poi esegue logout una volta', async () => {
        const pending = deferred();
        const saveDraft = vi.fn(() => pending.promise);
        const view = renderIntegration({ saveDraft });
        await waitForAuthenticatedForm();
        setActiveDatabaseAccountMock.mockClear();
        await userEvent.click(screen.getByRole('link', { name: 'Logout' }));
        fireEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        expect(view.router.state.location.pathname).toBe('/form');
        expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull();
        expect(setActiveDatabaseAccountMock).not.toHaveBeenCalledWith(null);
        expect(saveDraft).toHaveBeenCalledTimes(1);
        pending.resolve();
        await waitFor(() => expect(view.router.state.location.pathname)
            .toBe('/dashboard'));
        expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
        expect(setActiveDatabaseAccountMock).toHaveBeenCalledWith(null);
    });

    it('logout dirty + discard attende, poi esegue logout una volta', async () => {
        const pending = deferred();
        const discardChanges = vi.fn(() => pending.promise);
        const view = renderIntegration({ discardChanges });
        await waitForAuthenticatedForm();
        await userEvent.click(screen.getByRole('link', { name: 'Logout' }));
        fireEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        expect(view.router.state.location.pathname).toBe('/form');
        expect(discardChanges).toHaveBeenCalledTimes(1);
        pending.resolve();
        await waitFor(() => expect(view.router.state.location.pathname)
            .toBe('/dashboard'));
        expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
        expect(setActiveDatabaseAccountMock).toHaveBeenCalledWith(null);
    });

    it.each([
        ['save', 'Salva bozza', 'errore save'],
        ['discard', 'Abbandona', 'errore discard'],
    ] as const)('%s fallito mantiene dialog, sessione e consente Resta', async (
        action,
        buttonName,
        message,
    ) => {
        const callback = vi.fn().mockRejectedValue(new Error(message));
        const view = renderIntegration(action === 'save'
            ? { saveDraft: callback }
            : { discardChanges: callback });
        await waitForAuthenticatedForm();
        setActiveDatabaseAccountMock.mockClear();
        await userEvent.click(screen.getByRole('link', { name: 'Logout' }));
        await userEvent.click(screen.getByRole('button', { name: buttonName }));
        await waitFor(() => expect(screen.getByRole('alert').textContent)
            .toBe(message));
        expect(view.router.state.location.pathname).toBe('/form');
        expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull();
        expect(screen.getByTestId('form-account').textContent).toBe('user-001');
        expect(setActiveDatabaseAccountMock).not.toHaveBeenCalledWith(null);
        expect(view.getLogoutMounts()).toBe(0);
        await userEvent.click(screen.getByRole('button', { name: 'Resta' }));
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('preserva /logout davanti a una seconda richiesta /other', async () => {
        const view = renderIntegration();
        await waitForAuthenticatedForm();
        await userEvent.click(screen.getByRole('link', { name: 'Logout' }));
        await view.router.navigate('/other');
        expect(screen.getAllByRole('dialog')).toHaveLength(1);
        await userEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        await waitFor(() => expect(view.router.state.location.pathname)
            .toBe('/dashboard'));
        expect(view.router.state.location.pathname).not.toBe('/other');
        expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
    });

    it('serializza doppi click e azione alternativa sotto Strict Mode', async () => {
        const pending = deferred();
        const saveDraft = vi.fn(() => pending.promise);
        const discardChanges = vi.fn();
        const view = renderIntegration({ saveDraft, discardChanges });
        await waitForAuthenticatedForm();
        await userEvent.click(screen.getByRole('link', { name: 'Logout' }));
        fireEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        const savingButton = screen.getByRole('button', {
            name: 'Salvataggio in corso…',
        });
        fireEvent.click(savingButton);
        fireEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        expect(saveDraft).toHaveBeenCalledTimes(1);
        expect(discardChanges).not.toHaveBeenCalled();
        expect(screen.getAllByRole('dialog')).toHaveLength(1);
        pending.resolve();
        await waitFor(() => expect(view.router.state.location.pathname)
            .toBe('/dashboard'));
    });
});
