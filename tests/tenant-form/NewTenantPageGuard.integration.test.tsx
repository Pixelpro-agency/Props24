// @vitest-environment jsdom

import React, { useEffect, useRef } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import {
    createBrowserRouter,
    createMemoryRouter,
    Link,
    RouterProvider,
    useLocation,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    DraftRecord,
    DraftRepository,
} from '../../src/db/draftRepository.port';
import {
    defaultTenantValues,
    type TenantFormData,
} from '../../src/components/tenant-form/schema';
import { NewTenantPage } from '../../src/pages/NewTenantPage';
import { AuthProvider, useAuth } from '../../src/auth/AuthContext';
import { LogoutPage } from '../../src/auth/LogoutPage';
import {
    clearSession,
    initializeAccounts,
    writeSession,
} from '../../src/auth/authStorage';

let repository: DraftRepository;
const browserRouters: ReturnType<typeof createBrowserRouter>[] = [];

vi.mock('../../src/drafts/DraftRepositoryContext', () => ({
    useDraftRepository: () => repository,
}));
vi.mock('../../src/db/tenantRepository', () => ({
    createTenant: vi.fn(() => ({ id: 'tenant-created' })),
}));
vi.mock('../../src/db/jsonDb', () => ({
    setActiveDatabaseAccount: vi.fn(),
}));
vi.mock('../../src/components/tenant-form/TenantFormTabs', () => ({
    TENANT_TABS: [{ id: 'info1', label: 'Generale' }],
    TenantFormTabs: () => <div>tabs</div>,
}));
vi.mock('../../src/components/tenant-form/tabs/Tab1General', () => ({
    Tab1General: () => {
        const { register } = useFormContext<TenantFormData>();
        return <input aria-label="Nome" {...register('TenantFirstName')} />;
    },
}));
vi.mock('../../src/components/tenant-form/tabs/Tab2Additional', () => ({
    Tab2Additional: () => null,
}));
vi.mock('../../src/components/tenant-form/tabs/Tab3Guarantors', () => ({
    Tab3Guarantors: () => null,
}));
vi.mock('../../src/components/tenant-form/tabs/Tab4Emergency', () => ({
    Tab4Emergency: () => null,
}));
vi.mock('../../src/components/tenant-form/tabs/Tab5Documents', () => ({
    Tab5Documents: () => null,
}));

function record(name: string): DraftRecord<TenantFormData> {
    return {
        id: 'draft',
        accountId: 'account',
        formType: 'tenant',
        mode: 'create',
        entityId: null,
        payload: { ...defaultTenantValues, TenantFirstName: name },
        schemaVersion: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
}

function makeRepository(
    draft: DraftRecord<TenantFormData> | null = null,
): DraftRepository {
    return {
        get: vi.fn().mockResolvedValue(draft),
        list: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation(async (_definition, input) => (
            record((input.payload as TenantFormData).TenantFirstName)
        )),
        delete: vi.fn().mockResolvedValue(true),
    };
}

function renderPage(draft: DraftRecord<TenantFormData> | null = null) {
    repository = makeRepository(draft);
    const router = createMemoryRouter([
        {
            path: '/tenants/new',
            element: (
                <>
                    <Link to="/sidebar">Sidebar</Link>
                    <Link to="/logout">Logout</Link>
                    <NewTenantPage />
                </>
            ),
        },
        { path: '/tenants', element: <p>tenant list</p> },
        { path: '/sidebar', element: <p>sidebar target</p> },
        { path: '/logout', element: <p>logout target</p> },
    ], { initialEntries: ['/tenants/new'] });
    render(<RouterProvider router={router} />);
    return router;
}

function renderBrowserPage(
    draft: DraftRecord<TenantFormData> | null = null,
    strictMode = false,
) {
    repository = makeRepository(draft);
    window.history.replaceState(null, '', '/tenants');
    const router = createBrowserRouter([
        {
            path: '/tenants',
            element: <Link to="/tenants/new">Nuovo inquilino</Link>,
        },
        { path: '/tenants/new', element: <NewTenantPage /> },
        { path: '/sidebar', element: <p>sidebar target</p> },
        { path: '/logout', element: <p>logout target</p> },
        { path: '/tenants/:id', element: <p>tenant detail</p> },
    ]);
    browserRouters.push(router);
    const app = <RouterProvider router={router} />;
    render(strictMode ? <React.StrictMode>{app}</React.StrictMode> : app);
    return router;
}

function AuthState() {
    const { account } = useAuth();
    const location = useLocation();
    return (
        <>
            <output data-testid="account">{account?.id ?? 'none'}</output>
            <output data-testid="pathname">{location.pathname}</output>
        </>
    );
}

function renderAuthenticatedPage(
    draft: DraftRecord<TenantFormData> | null = null,
) {
    repository = makeRepository(draft);
    const logoutMount = vi.fn();
    function RealLogout() {
        useEffect(() => {
            logoutMount();
        }, []);
        return <LogoutPage />;
    }
    const router = createMemoryRouter([
        {
            path: '/tenants/new',
            element: (
                <>
                    <AuthState />
                    <Link to="/logout">Logout reale</Link>
                    <NewTenantPage />
                </>
            ),
        },
        { path: '/logout', element: <RealLogout /> },
        {
            path: '/dashboard',
            element: (
                <>
                    <AuthState />
                    <p>dashboard</p>
                </>
            ),
        },
        { path: '/tenants/:id', element: <p>tenant detail</p> },
        { path: '/tenants', element: <p>tenants</p> },
    ], { initialEntries: ['/tenants/new'] });
    render(
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>,
    );
    return { router, logoutMount };
}

function renderAuthenticatedBrowserPage() {
    repository = makeRepository();
    const logoutMount = vi.fn();
    function RealLogout() {
        const recordedRef = useRef(false);
        useEffect(() => {
            if (!recordedRef.current) {
                recordedRef.current = true;
                logoutMount();
            }
        }, []);
        return <LogoutPage />;
    }
    window.history.replaceState(null, '', '/tenants/new');
    const router = createBrowserRouter([
        {
            path: '/tenants/new',
            element: (
                <>
                    <AuthState />
                    <Link to="/logout">Logout BrowserRouter</Link>
                    <NewTenantPage />
                </>
            ),
        },
        { path: '/logout', element: <RealLogout /> },
        {
            path: '/dashboard',
            element: (
                <>
                    <AuthState />
                    <p>dashboard browser</p>
                </>
            ),
        },
        { path: '/tenants/:id', element: <p>tenant detail</p> },
        { path: '/tenants', element: <p>tenants</p> },
    ]);
    browserRouters.push(router);
    render(
        <React.StrictMode>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </React.StrictMode>,
    );
    return { router, logoutMount };
}

afterEach(() => {
    cleanup();
    browserRouters.splice(0).forEach((router) => router.dispose());
    vi.clearAllMocks();
    window.history.replaceState(null, '');
    clearSession();
    localStorage.clear();
    sessionStorage.clear();
});

describe('NewTenantPage browser history integration', () => {
    it('blocca POP dirty, Resta conserva e Abbandona procede', async () => {
        const router = renderBrowserPage(null, true);
        await userEvent.click(screen.getByRole('link', {
            name: 'Nuovo inquilino',
        }));
        const input = await screen.findByLabelText('Nome');
        await userEvent.type(input, 'Ada');
        expect((input as HTMLInputElement).value).toBe('Ada');

        window.history.back();
        await screen.findByText('Modifiche non salvate');
        expect(router.state.location.pathname).toBe('/tenants/new');
        expect((input as HTMLInputElement).value).toBe('Ada');
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();

        await userEvent.click(screen.getByRole('button', { name: 'Resta' }));
        expect(router.state.location.pathname).toBe('/tenants/new');
        expect((input as HTMLInputElement).value).toBe('Ada');

        window.history.back();
        await screen.findByText('Modifiche non salvate');
        await userEvent.click(screen.getByRole('button', {
            name: 'Abbandona',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/tenants'));
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('consente POP con form pulito senza dialog', async () => {
        const router = renderBrowserPage();
        await userEvent.click(screen.getByRole('link', {
            name: 'Nuovo inquilino',
        }));
        await screen.findByLabelText('Nome');
        window.history.back();
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/tenants'));
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('blocca POP su bozza ripresa dirty e conserva la bozza persistita', async () => {
        const router = renderBrowserPage(record('Salvato'));
        await userEvent.click(screen.getByRole('link', {
            name: 'Nuovo inquilino',
        }));
        await userEvent.click(await screen.findByRole('button', {
            name: 'Riprendi bozza',
        }));
        const input = screen.getByLabelText('Nome');
        await userEvent.clear(input);
        await userEvent.type(input, 'Modificato');
        window.history.back();
        await screen.findByText('Modifiche non salvate');
        expect(router.state.location.pathname).toBe('/tenants/new');
        await userEvent.click(screen.getByRole('button', { name: 'Resta' }));
        expect((input as HTMLInputElement).value).toBe('Modificato');
        window.history.back();
        await screen.findByText('Modifiche non salvate');
        await userEvent.click(screen.getByRole('button', {
            name: 'Abbandona',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/tenants'));
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('preserva il primo POP mentre il dialog è aperto', async () => {
        const router = renderBrowserPage();
        await userEvent.click(screen.getByRole('link', {
            name: 'Nuovo inquilino',
        }));
        await userEvent.type(await screen.findByLabelText('Nome'), 'Ada');
        window.history.back();
        await screen.findByText('Modifiche non salvate');
        await router.navigate('/sidebar');
        await userEvent.click(screen.getByRole('button', {
            name: 'Abbandona',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/tenants'));
        expect(screen.queryByText('sidebar target')).toBeNull();
    });

    it('salva una volta e procede verso il primo POP', async () => {
        const router = renderBrowserPage();
        await userEvent.click(screen.getByRole('link', {
            name: 'Nuovo inquilino',
        }));
        await userEvent.type(await screen.findByLabelText('Nome'), 'Ada');
        window.history.back();
        await screen.findByText('Modifiche non salvate');
        await userEvent.click(screen.getByRole('button', {
            name: 'Salva bozza',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/tenants'));
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('save fallita mantiene il POP sospeso e consente retry', async () => {
        const router = renderBrowserPage();
        vi.mocked(repository.save)
            .mockRejectedValueOnce(new Error('storage'))
            .mockResolvedValueOnce(record('Ada'));
        await userEvent.click(screen.getByRole('link', {
            name: 'Nuovo inquilino',
        }));
        await userEvent.type(await screen.findByLabelText('Nome'), 'Ada');
        window.history.back();
        await screen.findByText('Modifiche non salvate');
        await userEvent.click(screen.getByRole('button', {
            name: 'Salva bozza',
        }));
        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/tenants/new');
        await userEvent.click(screen.getByRole('button', {
            name: 'Salva bozza',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/tenants'));
        expect(repository.save).toHaveBeenCalledTimes(2);
    });
});

describe('NewTenantPage guard integration', () => {
    it('non blocca il form non dirty', async () => {
        const router = renderPage();
        await screen.findByLabelText('Nome');
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        expect(router.state.location.pathname).toBe('/sidebar');
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('Resta conserva route, valori e prima destinazione', async () => {
        const router = renderPage();
        const input = await screen.findByLabelText('Nome');
        await userEvent.type(input, 'Ada');
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await router.navigate('/logout');
        expect(screen.getByText('Modifiche non salvate')).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: 'Resta' }));
        expect(router.state.location.pathname).toBe('/tenants/new');
        expect((screen.getByLabelText('Nome') as HTMLInputElement).value)
            .toBe('Ada');
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('preserva davvero la prima destinazione sospesa', async () => {
        const router = renderPage();
        await userEvent.type(await screen.findByLabelText('Nome'), 'Ada');
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await router.navigate('/logout');
        await userEvent.click(screen.getByRole('button', {
            name: 'Abbandona',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/sidebar'));
        expect(screen.queryByText('logout target')).toBeNull();
    });

    it('browser back: Resta conserva, poi Abbandona procede', async () => {
        repository = makeRepository();
        const router = createMemoryRouter([
            { path: '/previous', element: <p>previous</p> },
            { path: '/tenants/new', element: <NewTenantPage /> },
            { path: '/tenants', element: <p>tenants</p> },
        ], { initialEntries: ['/previous', '/tenants/new'] });
        render(<RouterProvider router={router} />);
        const input = await screen.findByLabelText('Nome');
        await userEvent.type(input, 'Ada');
        await router.navigate(-1);
        await screen.findByText('Modifiche non salvate');
        await userEvent.click(screen.getByRole('button', { name: 'Resta' }));
        expect(router.state.location.pathname).toBe('/tenants/new');
        expect((input as HTMLInputElement).value).toBe('Ada');
        await router.navigate(-1);
        await screen.findByText('Modifiche non salvate');
        await userEvent.click(screen.getByRole('button', {
            name: 'Abbandona',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/previous'));
    });

    it('Abbandona ripristina la bozza ripresa e procede', async () => {
        const router = renderPage(record('Salvato'));
        await userEvent.click(await screen.findByRole('button', {
            name: 'Riprendi bozza',
        }));
        const input = screen.getByLabelText('Nome');
        await userEvent.clear(input);
        await userEvent.type(input, 'Modificato');
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await userEvent.click(screen.getByRole('button', {
            name: 'Abbandona',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/sidebar'));
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('Salva bozza e prosegui salva una volta', async () => {
        const router = renderPage();
        await userEvent.type(await screen.findByLabelText('Nome'), 'Ada');
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await userEvent.click(screen.getByRole('button', {
            name: 'Salva bozza',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/sidebar'));
        expect(repository.save).toHaveBeenCalledOnce();
    });

    it('Abbandona da vuoto non salva o elimina', async () => {
        const router = renderPage();
        await userEvent.type(await screen.findByLabelText('Nome'), 'Ada');
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await userEvent.click(screen.getByRole('button', {
            name: 'Abbandona',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/sidebar'));
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('Abbandona dopo save conserva lo snapshot salvato', async () => {
        const router = renderPage();
        const input = await screen.findByLabelText('Nome');
        await userEvent.type(input, 'Salvato');
        await userEvent.click(screen.getByRole('button', {
            name: 'Salva bozza',
        }));
        await screen.findByText('Bozza salvata.');
        await userEvent.clear(input);
        await userEvent.type(input, 'Modificato');
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await userEvent.click(screen.getByRole('button', {
            name: 'Abbandona',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/sidebar'));
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('errore save resta nel dialog e beforeunload segue dirty', async () => {
        const addListener = vi.spyOn(window, 'addEventListener');
        const router = renderPage();
        vi.mocked(repository.save).mockRejectedValue(new Error('grezzo'));
        const input = await screen.findByLabelText('Nome');
        const beforeUnload = addListener.mock.calls.find(
            ([type]) => type === 'beforeunload',
        )?.[1] as EventListener;
        const cleanEvent = new Event('beforeunload', { cancelable: true });
        beforeUnload.call(window, cleanEvent);
        expect(cleanEvent.defaultPrevented).toBe(false);
        await userEvent.type(input, 'Ada');
        const dirtyEvent = new Event('beforeunload', { cancelable: true });
        beforeUnload.call(window, dirtyEvent);
        expect(dirtyEvent.defaultPrevented).toBe(true);
        addListener.mockRestore();
        await userEvent.click(screen.getByRole('link', { name: 'Logout' }));
        fireEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/tenants/new');
        expect((input as HTMLInputElement).value).toBe('Ada');
    });

    it('logout reale + Resta mantiene account, route e valori', async () => {
        initializeAccounts();
        writeSession('user-001');
        const { router, logoutMount } = renderAuthenticatedPage();
        await waitFor(() => expect(screen.getByTestId('account').textContent)
            .toBe('user-001'));
        const input = await screen.findByLabelText('Nome');
        await userEvent.type(input, 'Ada');
        await userEvent.click(screen.getByRole('link', {
            name: 'Logout reale',
        }));
        await userEvent.click(screen.getByRole('button', { name: 'Resta' }));
        expect(router.state.location.pathname).toBe('/tenants/new');
        expect(screen.getByTestId('account').textContent).toBe('user-001');
        expect((input as HTMLInputElement).value).toBe('Ada');
        expect(logoutMount).not.toHaveBeenCalled();
    });

    it('BrowserRouter logout + save completa dopo reset dirty in Strict Mode', async () => {
        initializeAccounts();
        writeSession('user-001');
        const { router, logoutMount } = renderAuthenticatedBrowserPage();
        await waitFor(() => expect(screen.getByTestId('account').textContent)
            .toBe('user-001'));
        await userEvent.type(await screen.findByLabelText('Nome'), 'Ada');
        await userEvent.click(screen.getByRole('link', {
            name: 'Logout BrowserRouter',
        }));
        await screen.findByText('Modifiche non salvate');
        await userEvent.click(screen.getByRole('button', {
            name: 'Salva bozza',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/dashboard'));
        expect(screen.getByTestId('account').textContent).toBe('none');
        expect(logoutMount).toHaveBeenCalledOnce();
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
    });

    it.each([
        ['Abbandona', false],
        ['Salva bozza', true],
    ])('logout reale + %s completa una volta', async (
        action,
        saves,
    ) => {
        initializeAccounts();
        writeSession('user-001');
        const { router, logoutMount } = renderAuthenticatedPage();
        await waitFor(() => expect(screen.getByTestId('account').textContent)
            .toBe('user-001'));
        await userEvent.type(await screen.findByLabelText('Nome'), 'Ada');
        await userEvent.click(screen.getByRole('link', {
            name: 'Logout reale',
        }));
        await userEvent.click(screen.getByRole('button', { name: action }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/dashboard'));
        expect(screen.getByTestId('account').textContent).toBe('none');
        expect(logoutMount).toHaveBeenCalledOnce();
        expect(repository.save).toHaveBeenCalledTimes(saves ? 1 : 0);
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('errore save impedisce il logout reale', async () => {
        initializeAccounts();
        writeSession('user-001');
        const { router, logoutMount } = renderAuthenticatedPage();
        vi.mocked(repository.save).mockRejectedValue(new Error('storage'));
        await waitFor(() => expect(screen.getByTestId('account').textContent)
            .toBe('user-001'));
        const input = await screen.findByLabelText('Nome');
        await userEvent.type(input, 'Ada');
        await userEvent.click(screen.getByRole('link', {
            name: 'Logout reale',
        }));
        await userEvent.click(screen.getByRole('button', {
            name: 'Salva bozza',
        }));
        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/tenants/new');
        expect(screen.getByTestId('account').textContent).toBe('user-001');
        expect((input as HTMLInputElement).value).toBe('Ada');
        expect(logoutMount).not.toHaveBeenCalled();
    });
});
