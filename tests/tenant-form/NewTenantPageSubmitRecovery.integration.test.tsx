// @vitest-environment jsdom

import React, { useEffect } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import {
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
import { createTenant } from '../../src/db/tenantRepository';
import { AuthProvider, useAuth } from '../../src/auth/AuthContext';
import { LogoutPage } from '../../src/auth/LogoutPage';
import {
    clearSession,
    initializeAccounts,
    writeSession,
} from '../../src/auth/authStorage';

let repository: DraftRepository;
const events: string[] = [];
const logoutMount = vi.fn();

vi.mock('../../src/drafts/DraftRepositoryContext', () => ({
    useDraftRepository: () => repository,
}));
vi.mock('../../src/db/tenantRepository', () => ({
    createTenant: vi.fn(() => {
        events.push('create');
        return { id: 'tenant-original' };
    }),
}));
vi.mock('../../src/db/jsonDb', () => ({
    setActiveDatabaseAccount: vi.fn(),
}));
vi.mock('../../src/components/tenant-form/TenantFormTabs', () => ({
    TENANT_TABS: [{ id: 'info1', label: 'Generale' }],
    TenantFormTabs: () => null,
}));
vi.mock('../../src/components/tenant-form/tabs/Tab1General', () => ({
    Tab1General: () => {
        const { register } = useFormContext<TenantFormData>();
        return (
            <>
                <input aria-label="Nome" {...register('TenantFirstName')} />
                <input aria-label="Cognome" {...register('TenantLastName')} />
            </>
        );
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

function validDraft(): DraftRecord<TenantFormData> {
    return {
        id: 'draft',
        accountId: 'account',
        formType: 'tenant',
        mode: 'create',
        entityId: null,
        payload: {
            ...defaultTenantValues,
            TenantFirstName: 'Ada',
            TenantLastName: 'Lovelace',
        },
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
        save: vi.fn(),
        delete: vi.fn().mockImplementation(async () => {
            events.push('delete');
            return true;
        }),
    };
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
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

function RealLogout() {
    useEffect(() => {
        logoutMount();
    }, []);
    return <LogoutPage />;
}

function renderPage(
    draft: DraftRecord<TenantFormData> | null = null,
    initialEntries = ['/tenants/new'],
    strictMode = false,
) {
    repository = makeRepository(draft);
    const router = createMemoryRouter([
        { path: '/previous', element: <p>previous</p> },
        {
            path: '/tenants/new',
            element: (
                <>
                    <AuthState />
                    <Link to="/sidebar">Sidebar</Link>
                    <Link to="/logout">Logout</Link>
                    <NewTenantPage />
                </>
            ),
        },
        {
            path: '/tenants/:id',
            element: <p onLoad={() => events.push('navigate')}>detail</p>,
        },
        { path: '/sidebar', element: <p>sidebar</p> },
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
        { path: '/tenants', element: <p>tenants</p> },
    ], { initialEntries });
    const app = (
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    );
    render(strictMode ? <React.StrictMode>{app}</React.StrictMode> : app);
    return router;
}

async function fillAndSubmit() {
    await userEvent.type(await screen.findByLabelText('Nome'), 'Ada');
    await userEvent.type(screen.getByLabelText('Cognome'), 'Lovelace');
    await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.mocked(createTenant).mockImplementation(() => {
        events.push('create');
        return { id: 'tenant-original' };
    });
    events.length = 0;
    logoutMount.mockClear();
    clearSession();
    localStorage.clear();
    sessionStorage.clear();
});

describe('NewTenantPage submit recovery', () => {
    it.each([true, false])(
        'Strict Mode completa submit non dirty con delete %s',
        async (deleted) => {
            initializeAccounts();
            writeSession('user-001');
            vi.mocked(createTenant).mockReturnValue({
                id: 'tenant-strict-success',
            } as never);
            const router = renderPage(
                validDraft(),
                ['/tenants/new'],
                true,
            );
            vi.mocked(repository.delete).mockResolvedValue(deleted);
            await userEvent.click(await screen.findByRole('button', {
                name: 'Riprendi bozza',
            }));
            await userEvent.click(screen.getByRole('button', {
                name: 'Salva',
            }));
            await waitFor(() => expect(router.state.location.pathname)
                .toBe('/tenants/tenant-strict-success'));
            expect(createTenant).toHaveBeenCalledOnce();
            expect(repository.delete).toHaveBeenCalledOnce();
            expect(repository.delete).toHaveBeenCalledWith({
                formType: 'tenant',
                mode: 'create',
                entityId: null,
            });
            expect(await screen.findByText('detail')).toBeTruthy();
            expect(screen.queryByText('Salvataggio...')).toBeNull();
            expect(screen.queryByText('Modifiche non salvate')).toBeNull();
            expect(screen.queryByText(
                'Inquilino creato, pulizia incompleta',
            )).toBeNull();
        },
    );

    it('Strict Mode mantiene recovery e retry esegue soltanto delete', async () => {
        initializeAccounts();
        writeSession('user-001');
        vi.mocked(createTenant).mockReturnValue({
            id: 'tenant-strict-recovery',
        } as never);
        const router = renderPage(validDraft(), ['/tenants/new'], true);
        vi.mocked(repository.delete)
            .mockRejectedValueOnce(new Error('storage'))
            .mockResolvedValueOnce(true);
        await userEvent.click(await screen.findByRole('button', {
            name: 'Riprendi bozza',
        }));
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        expect(await screen.findByText(
            'Inquilino creato, pulizia incompleta',
        )).toBeTruthy();
        await userEvent.click(screen.getByRole('button', {
            name: 'Riprova pulizia',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/tenants/tenant-strict-recovery'));
        expect(createTenant).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledTimes(2);
        expect(screen.queryByText('Continua comunque')).toBeNull();
    });

    it('Strict Mode ignora delete risolta dopo unmount reale', async () => {
        initializeAccounts();
        writeSession('user-001');
        const pending = deferred<boolean>();
        const router = renderPage(validDraft(), ['/tenants/new'], true);
        vi.mocked(repository.delete).mockReturnValue(pending.promise);
        await userEvent.click(await screen.findByRole('button', {
            name: 'Riprendi bozza',
        }));
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(repository.delete).toHaveBeenCalledOnce());
        cleanup();
        await act(() => {
            pending.resolve(true);
            return pending.promise;
        });
        expect(router.state.location.pathname).toBe('/tenants/new');
    });

    it('Strict Mode serializza click e submit concorrenti', async () => {
        initializeAccounts();
        writeSession('user-001');
        vi.mocked(createTenant).mockReturnValue({
            id: 'tenant-strict-concurrent',
        } as never);
        const router = renderPage(validDraft(), ['/tenants/new'], true);
        await userEvent.click(await screen.findByRole('button', {
            name: 'Riprendi bozza',
        }));
        const submit = screen.getByRole('button', { name: 'Salva' });
        fireEvent.click(submit);
        fireEvent.click(submit);
        fireEvent.submit(document.getElementById('tenant-form')!);
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/tenants/tenant-strict-concurrent'));
        expect(createTenant).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledOnce();
    });

    it('create fallita non elimina e consente retry create', async () => {
        const router = renderPage();
        vi.mocked(createTenant)
            .mockImplementationOnce(() => {
                throw new Error('Creazione fallita');
            })
            .mockImplementationOnce(() => ({ id: 'tenant-original' }) as never);
        await fillAndSubmit();
        expect(await screen.findByText('Creazione fallita')).toBeTruthy();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(router.state.location.pathname).toBe('/tenants/new');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/tenants/tenant-original'));
        expect(createTenant).toHaveBeenCalledTimes(2);
    });

    it.each([true, false])(
        'create poi delete %s e navigate',
        async (deleted) => {
            const router = renderPage();
            vi.mocked(repository.delete).mockImplementation(async () => {
                events.push('delete');
                return deleted;
            });
            await fillAndSubmit();
            await waitFor(() => expect(router.state.location.pathname)
                .toBe('/tenants/tenant-original'));
            expect(createTenant).toHaveBeenCalledOnce();
            expect(repository.delete).toHaveBeenCalledOnce();
            expect(events.slice(0, 2)).toEqual(['create', 'delete']);
            expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        },
    );

    it('delete fallita entra in recovery e retry usa soltanto delete', async () => {
        const router = renderPage();
        vi.mocked(repository.delete)
            .mockRejectedValueOnce(new Error('storage'))
            .mockResolvedValueOnce(true);
        await fillAndSubmit();
        expect(await screen.findByText(
            'Inquilino creato, pulizia incompleta',
        )).toBeTruthy();
        expect(router.state.location.pathname).toBe('/tenants/new');
        expect(createTenant).toHaveBeenCalledOnce();
        expect(screen.queryByText('Continua comunque')).toBeNull();
        expect((screen.getByRole('button', {
            name: 'Indietro',
            hidden: true,
        }) as HTMLButtonElement).disabled).toBe(true);
        await userEvent.click(screen.getByRole('button', {
            name: 'Riprova pulizia',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/tenants/tenant-original'));
        expect(createTenant).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledTimes(2);
    });

    it('serializza doppio retry pending', async () => {
        const pending = deferred<boolean>();
        renderPage();
        vi.mocked(repository.delete)
            .mockRejectedValueOnce(new Error('storage'))
            .mockReturnValueOnce(pending.promise);
        await fillAndSubmit();
        const retry = await screen.findByRole('button', {
            name: 'Riprova pulizia',
        });
        fireEvent.click(retry);
        fireEvent.click(retry);
        expect(repository.delete).toHaveBeenCalledTimes(2);
        expect(createTenant).toHaveBeenCalledOnce();
        await act(() => {
            pending.resolve(true);
            return pending.promise;
        });
    });

    it('blocca navigazioni e beforeunload durante recovery', async () => {
        const addListener = vi.spyOn(window, 'addEventListener');
        const router = renderPage();
        vi.mocked(repository.delete)
            .mockRejectedValue(new Error('storage'));
        await fillAndSubmit();
        await screen.findByText('Inquilino creato, pulizia incompleta');
        const beforeUnload = addListener.mock.calls.find(
            ([type]) => type === 'beforeunload',
        )?.[1] as EventListener;
        const event = new Event('beforeunload', { cancelable: true });
        beforeUnload.call(window, event);
        expect(event.defaultPrevented).toBe(true);
        addListener.mockRestore();
        await router.navigate('/sidebar');
        await router.navigate('/logout');
        expect(router.state.location.pathname).toBe('/tenants/new');
        expect(screen.getByText('Inquilino creato, pulizia incompleta'))
            .toBeTruthy();
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
    });

    it.each([true, false])(
        'bozza ripresa non dirty protegge cleanup pending e conclude su dettaglio (%s)',
        async (deleted) => {
            initializeAccounts();
            writeSession('user-001');
            const addListener = vi.spyOn(window, 'addEventListener');
            const pending = deferred<boolean>();
            const router = renderPage(
                validDraft(),
                ['/previous', '/tenants/new'],
            );
            vi.mocked(repository.delete).mockReturnValue(pending.promise);
            await userEvent.click(await screen.findByRole('button', {
                name: 'Riprendi bozza',
            }));
            expect((screen.getByLabelText('Nome') as HTMLInputElement).value)
                .toBe('Ada');
            await userEvent.click(screen.getByRole('button', {
                name: 'Salva',
            }));
            await waitFor(() => expect(repository.delete).toHaveBeenCalledOnce());
            expect(createTenant).toHaveBeenCalledOnce();

            const beforeUnload = addListener.mock.calls.find(
                ([type]) => type === 'beforeunload',
            )?.[1] as EventListener;
            const event = new Event('beforeunload', { cancelable: true });
            beforeUnload.call(window, event);
            expect(event.defaultPrevented).toBe(true);
            addListener.mockRestore();

            await router.navigate('/sidebar');
            await router.navigate(-1);
            await router.navigate('/logout');
            expect(router.state.location.pathname).toBe('/tenants/new');
            expect(logoutMount).not.toHaveBeenCalled();
            expect(createTenant).toHaveBeenCalledOnce();

            let competingLogout!: Promise<void>;
            await act(async () => {
                pending.resolve(deleted);
                competingLogout = router.navigate('/logout');
                await pending.promise;
            });
            await waitFor(() => expect(router.state.location.pathname)
                .toBe('/tenants/tenant-original'));
            await competingLogout;
            expect(createTenant).toHaveBeenCalledOnce();
            expect(repository.delete).toHaveBeenCalledOnce();
            expect(logoutMount).not.toHaveBeenCalled();
            expect(screen.queryByText('sidebar')).toBeNull();
            expect(screen.queryByText('Modifiche non salvate')).toBeNull();
            expect(screen.queryByText(
                'Inquilino creato, pulizia incompleta',
            )).toBeNull();
        },
    );

    it('cleanup pending fallita scarta logout reale e retry apre dettaglio', async () => {
        initializeAccounts();
        writeSession('user-001');
        const pending = deferred<boolean>();
        const router = renderPage(validDraft());
        vi.mocked(repository.delete)
            .mockReturnValueOnce(pending.promise)
            .mockResolvedValueOnce(true);
        await userEvent.click(await screen.findByRole('button', {
            name: 'Riprendi bozza',
        }));
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(repository.delete).toHaveBeenCalledOnce());
        await router.navigate('/logout');
        pending.reject(new Error('storage'));
        expect(await screen.findByText(
            'Inquilino creato, pulizia incompleta',
        )).toBeTruthy();
        expect(router.state.location.pathname).toBe('/tenants/new');
        expect(logoutMount).not.toHaveBeenCalled();
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        await userEvent.click(screen.getByRole('button', {
            name: 'Riprova pulizia',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/tenants/tenant-original'));
        expect(createTenant).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledTimes(2);
        expect(logoutMount).not.toHaveBeenCalled();
    });
});
