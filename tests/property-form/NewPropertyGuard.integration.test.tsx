// @vitest-environment jsdom

import React, { StrictMode, useEffect, useRef } from 'react';
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import {
    Link,
    RouterProvider,
    createBrowserRouter,
    createMemoryRouter,
    useLocation,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NewProperty } from '../../src/pages/NewProperty';
import {
    defaultPropertyValues,
    type PropertyFormData,
} from '../../src/components/property-form/schema';
import type {
    DraftRecord,
    DraftRepository,
} from '../../src/db/draftRepository.port';
import { AuthProvider, useAuth } from '../../src/auth/AuthContext';
import { LogoutPage } from '../../src/auth/LogoutPage';
import {
    clearSession,
    initializeAccounts,
    readSession,
    writeSession,
} from '../../src/auth/authStorage';

let repository: DraftRepository;
const createProperty = vi.fn();
const legacyClear = vi.fn();
const browserRouters: ReturnType<typeof createBrowserRouter>[] = [];

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

vi.mock('../../src/drafts/DraftRepositoryContext', () => ({
    useDraftRepository: () => repository,
}));
vi.mock('../../src/db/propertyRepository', () => ({
    createProperty: (...args: unknown[]) => createProperty(...args),
}));
vi.mock('../../src/db/buildingRepository', () => ({
    createBuildingRepository: () => ({ list: () => [] }),
}));
vi.mock('../../src/db/jsonDb', () => ({
    clearDraft: (...args: unknown[]) => legacyClear(...args),
    setActiveDatabaseAccount: vi.fn(),
}));
vi.mock('../../src/components/property-form/ui/AddressAutocomplete', () => ({
    AddressAutocomplete: ({
        name,
        label,
    }: {
        name: keyof PropertyFormData;
        label: string;
    }) => {
        const { register } = useFormContext<PropertyFormData>();
        return (
            <label>
                {label || 'Indirizzo'}
                <input {...register(name)} />
            </label>
        );
    },
}));

function record(
    payload: Partial<PropertyFormData> = {},
): DraftRecord<PropertyFormData> {
    return {
        id: 'draft-1',
        accountId: 'account-1',
        formType: 'property',
        mode: 'create',
        entityId: null,
        payload: { ...defaultPropertyValues, ...payload } as PropertyFormData,
        schemaVersion: 1,
        createdAt: '2026-07-30T00:00:00.000Z',
        updatedAt: '2026-07-30T00:00:00.000Z',
    };
}

function makeRepository(
    value: DraftRecord<PropertyFormData> | null = null,
): DraftRepository {
    return {
        get: vi.fn().mockResolvedValue(value),
        list: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation(async (_definition, input) => (
            record(input.payload as PropertyFormData)
        )),
        delete: vi.fn().mockResolvedValue(true),
    };
}

function PropertyRoute() {
    return (
        <>
            <nav>
                <Link to="/sidebar">Sidebar</Link>
                <Link to="/logout">Logout</Link>
            </nav>
            <NewProperty />
        </>
    );
}

function renderPage(strict = false) {
    const router = createMemoryRouter([
        { path: '/origin', element: <p>Origin</p> },
        { path: '/properties/new', element: <PropertyRoute /> },
        { path: '/sidebar', element: <p>Sidebar destination</p> },
        { path: '/logout', element: <p>Logout destination</p> },
        { path: '/properties/units/:id', element: <p>Property detail</p> },
    ], {
        initialEntries: ['/origin', '/properties/new'],
        initialIndex: 1,
    });
    render(strict
        ? <StrictMode><AuthProvider><RouterProvider router={router} /></AuthProvider></StrictMode>
        : <AuthProvider><RouterProvider router={router} /></AuthProvider>);
    return router;
}

function renderBrowserPage(strictMode = false) {
    window.history.replaceState(null, '', '/origin');
    const router = createBrowserRouter([
        {
            path: '/origin',
            element: <Link to="/properties/new">Nuova unità</Link>,
        },
        { path: '/properties/new', element: <PropertyRoute /> },
        { path: '/sidebar', element: <p>Sidebar destination</p> },
        { path: '/logout', element: <p>Logout destination</p> },
        { path: '/properties/units/:id', element: <p>Property detail</p> },
    ]);
    browserRouters.push(router);
    render(strictMode
        ? <StrictMode><AuthProvider><RouterProvider router={router} /></AuthProvider></StrictMode>
        : <AuthProvider><RouterProvider router={router} /></AuthProvider>);
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

function renderAuthenticatedPage() {
    const logoutMount = vi.fn();
    function RealLogout() {
        const recorded = useRef(false);
        useEffect(() => {
            if (!recorded.current) {
                recorded.current = true;
                logoutMount();
            }
        }, []);
        return <LogoutPage />;
    }
    const router = createMemoryRouter([
        {
            path: '/properties/new',
            element: (
                <>
                    <AuthState />
                    <Link to="/logout">Logout reale</Link>
                    <NewProperty />
                </>
            ),
        },
        { path: '/logout', element: <RealLogout /> },
        {
            path: '/dashboard',
            element: <><AuthState /><p>dashboard</p></>,
        },
        { path: '/sidebar', element: <p>Sidebar destination</p> },
        { path: '/properties/units/:id', element: <p>Property detail</p> },
    ], { initialEntries: ['/properties/new'] });
    render(<AuthProvider><RouterProvider router={router} /></AuthProvider>);
    return { router, logoutMount };
}

function renderAuthenticatedBrowserPage() {
    const logoutMount = vi.fn();
    function RealLogout() {
        const recorded = useRef(false);
        useEffect(() => {
            if (!recorded.current) {
                recorded.current = true;
                logoutMount();
            }
        }, []);
        return <LogoutPage />;
    }
    window.history.replaceState(null, '', '/properties/new');
    const router = createBrowserRouter([
        {
            path: '/properties/new',
            element: (
                <>
                    <AuthState />
                    <Link to="/logout">Logout BrowserRouter</Link>
                    <NewProperty />
                </>
            ),
        },
        { path: '/logout', element: <RealLogout /> },
        {
            path: '/dashboard',
            element: <><AuthState /><p>dashboard browser</p></>,
        },
        { path: '/properties/units/:id', element: <p>Property detail</p> },
    ]);
    browserRouters.push(router);
    render(
        <StrictMode>
            <AuthProvider><RouterProvider router={router} /></AuthProvider>
        </StrictMode>,
    );
    return { router, logoutMount };
}

async function makeDirty(value = 'Modificato') {
    const input = await screen.findByLabelText(/Identificativo/);
    await userEvent.type(input, value);
    return input as HTMLInputElement;
}

async function commitDirtyForBrowserBack(
    value: string,
    addListener: ReturnType<typeof vi.spyOn>,
) {
    const input = await screen.findByLabelText(/Identificativo/);
    fireEvent.change(input, { target: { value } });
    expect((input as HTMLInputElement).value).toBe(value);
    await waitFor(() => {
        const beforeUnload = addListener.mock.calls.filter(
            ([type]) => type === 'beforeunload',
        ).at(-1)?.[1] as EventListener | undefined;
        expect(beforeUnload).toBeDefined();
        const event = new Event('beforeunload', { cancelable: true });
        beforeUnload?.call(window, event);
        expect(event.defaultPrevented).toBe(true);
    });
    return input as HTMLInputElement;
}

afterEach(() => {
    cleanup();
    browserRouters.splice(0).forEach((router) => router.dispose());
    window.history.replaceState(null, '', '/');
    localStorage.clear();
    sessionStorage.clear();
    clearSession();
    vi.clearAllMocks();
});

describe('NewProperty unsaved changes guard', () => {
    it('dirty Sidebar apre il guard e Resta conserva route e valori', async () => {
        repository = makeRepository();
        const router = renderPage();
        const input = await makeDirty();
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        expect(await screen.findByText('Modifiche non salvate')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/properties/new');
        await userEvent.click(screen.getByRole('button', { name: 'Resta' }));
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(input.value).toBe('Modificato');
    });

    it('header Indietro dirty apre il guard', async () => {
        repository = makeRepository();
        const router = renderPage();
        await makeDirty();
        await userEvent.click(screen.getByRole('button', {
            name: 'Indietro',
        }));
        expect(await screen.findByText('Modifiche non salvate')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/properties/new');
    });

    it('header Indietro protegge il form dirty dopo il commit React', async () => {
        repository = makeRepository();
        const addListener = vi.spyOn(window, 'addEventListener');
        const router = renderPage();
        const input = await screen.findByLabelText(/Identificativo/);
        const beforeUnload = addListener.mock.calls.find(
            ([type]) => type === 'beforeunload',
        )?.[1] as EventListener;

        fireEvent.change(input, {
            target: { value: 'Dirty dopo commit React' },
        });
        expect((input as HTMLInputElement).value)
            .toBe('Dirty dopo commit React');
        await waitFor(() => {
            const committedDirty = new Event('beforeunload', {
                cancelable: true,
            });
            beforeUnload.call(window, committedDirty);
            expect(committedDirty.defaultPrevented).toBe(true);
        });

        await userEvent.click(screen.getByRole('button', {
            name: 'Indietro',
        }));

        expect(await screen.findByText('Modifiche non salvate')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/properties/new');
        expect((input as HTMLInputElement).value)
            .toBe('Dirty dopo commit React');
        addListener.mockRestore();
    });

    it('beforeunload dirty viene bloccato', async () => {
        repository = makeRepository();
        const addListener = vi.spyOn(window, 'addEventListener');
        renderPage();
        const beforeUnload = addListener.mock.calls.find(
            ([type]) => type === 'beforeunload',
        )?.[1] as EventListener;
        const clean = new Event('beforeunload', { cancelable: true });
        beforeUnload.call(window, clean);
        expect(clean.defaultPrevented).toBe(false);
        await makeDirty();
        const dirty = new Event('beforeunload', { cancelable: true });
        beforeUnload.call(window, dirty);
        expect(dirty.defaultPrevented).toBe(true);
        await userEvent.click(screen.getByRole('button', {
            name: 'Salva bozza',
        }));
        await screen.findByText('Bozza salvata.');
        const saved = new Event('beforeunload', { cancelable: true });
        beforeUnload.call(window, saved);
        expect(saved.defaultPrevented).toBe(false);
        await userEvent.type(screen.getByLabelText(/Identificativo/), ' ancora');
        const changedAgain = new Event('beforeunload', { cancelable: true });
        beforeUnload.call(window, changedAgain);
        expect(changedAgain.defaultPrevented).toBe(true);
        addListener.mockRestore();
    });

    it.each(['choice_required', 'load_error'])(
        'beforeunload non blocca durante %s',
        async (phase) => {
            repository = phase === 'choice_required'
                ? makeRepository(record({ PropertyTitle: 'Bozza' }))
                : makeRepository();
            if (phase === 'load_error') {
                vi.mocked(repository.get).mockRejectedValue(new Error('load'));
            }
            const addListener = vi.spyOn(window, 'addEventListener');
            renderPage();
            if (phase === 'choice_required') {
                await screen.findByText('Bozza unità disponibile');
            } else {
                await screen.findByText('Impossibile aprire la bozza');
            }
            const beforeUnload = addListener.mock.calls.find(
                ([type]) => type === 'beforeunload',
            )?.[1] as EventListener;
            const event = new Event('beforeunload', { cancelable: true });
            beforeUnload.call(window, event);
            expect(event.defaultPrevented).toBe(false);
            addListener.mockRestore();
        },
    );

    it('navigazione back dirty resta su Nuova unità', async () => {
        repository = makeRepository();
        const router = renderPage();
        await makeDirty();
        await router.navigate(-1);
        expect(await screen.findByText('Modifiche non salvate')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/properties/new');
    });

    it('navigate(-1) del MemoryRouter + Abbandona procede verso l’origine', async () => {
        repository = makeRepository();
        const router = renderPage();
        await makeDirty();
        await router.navigate(-1);
        await userEvent.click(await screen.findByRole('button', {
            name: 'Abbandona',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/origin'));
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('BrowserRouter reale con window.history.back e Salva bozza torna all’origine', async () => {
        repository = makeRepository();
        const consoleError = vi.spyOn(console, 'error').mockImplementation(
            () => undefined,
        );
        const addListener = vi.spyOn(window, 'addEventListener');
        const router = renderBrowserPage(true);
        await userEvent.click(await screen.findByRole('link', {
            name: 'Nuova unità',
        }));
        const input = await commitDirtyForBrowserBack(
            'Modificato',
            addListener,
        );
        window.history.back();
        expect(await screen.findByText('Modifiche non salvate')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(window.location.pathname).toBe('/properties/new');
        expect(input.value).toBe('Modificato');
        await userEvent.click(screen.getByRole('button', {
            name: 'Salva bozza',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/origin'));
        expect(window.location.pathname).toBe('/origin');
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(createProperty).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();
        await waitFor(() => {
            expect(screen.queryByText('Modifiche non salvate')).toBeNull();
            expect(screen.queryByLabelText(/Identificativo/)).toBeNull();
        });
        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
        addListener.mockRestore();
    });

    it.each(['Resta', 'Abbandona'])(
        'BrowserRouter reale back + %s rispetta la scelta',
        async (action) => {
            repository = makeRepository();
            const addListener = vi.spyOn(window, 'addEventListener');
            const router = renderBrowserPage(action === 'Resta');
            await userEvent.click(await screen.findByRole('link', {
                name: 'Nuova unità',
            }));
            const input = await commitDirtyForBrowserBack(
                'Modificato',
                addListener,
            );
            window.history.back();
            await screen.findByText('Modifiche non salvate');
            await userEvent.click(screen.getByRole('button', { name: action }));
            const expected = action === 'Resta' ? '/properties/new' : '/origin';
            await waitFor(() => expect(router.state.location.pathname)
                .toBe(expected));
            if (action === 'Resta') {
                expect(input.value).toBe('Modificato');
            } else {
                await waitFor(() => expect(screen.queryByText(
                    'Modifiche non salvate',
                )).toBeNull());
            }
            expect(repository.save).not.toHaveBeenCalled();
            expect(repository.delete).not.toHaveBeenCalled();
            addListener.mockRestore();
        },
    );

    it('clean naviga senza dialog', async () => {
        repository = makeRepository();
        const router = renderPage();
        await screen.findByLabelText(/Identificativo/);
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/sidebar'));
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
    });

    it('Abbandona ripristina default e procede senza I/O', async () => {
        repository = makeRepository();
        const router = renderPage();
        await makeDirty();
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await userEvent.click(await screen.findByRole('button', {
            name: 'Abbandona',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/sidebar'));
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();
        expect(createProperty).not.toHaveBeenCalled();
    });

    it('Salva bozza e prosegui salva una volta', async () => {
        repository = makeRepository();
        const router = renderPage();
        await makeDirty();
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await userEvent.click(await screen.findByRole('button', {
            name: 'Salva bozza',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/sidebar'));
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();
        expect(createProperty).not.toHaveBeenCalled();
    });

    it('serializza doppio click su Salva bozza del guard', async () => {
        const pending = deferred<DraftRecord<PropertyFormData>>();
        repository = makeRepository();
        vi.mocked(repository.save).mockReturnValue(pending.promise);
        const router = renderPage();
        await makeDirty();
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        const save = await screen.findByRole('button', {
            name: 'Salva bozza',
        });
        fireEvent.click(save);
        fireEvent.click(save);
        expect(repository.save).toHaveBeenCalledOnce();
        pending.resolve(record({ PropertyTitle: 'Modificato' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/sidebar'));
    });

    it('save fallita conserva destinazione e retry procede', async () => {
        repository = makeRepository();
        vi.mocked(repository.save)
            .mockRejectedValueOnce(new Error('storage'))
            .mockImplementationOnce(async (_definition, input) => (
                record(input.payload as PropertyFormData)
            ));
        const router = renderPage();
        const input = await makeDirty();
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await userEvent.click(await screen.findByRole('button', {
            name: 'Salva bozza',
        }));
        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(input.value).toBe('Modificato');
        await userEvent.click(screen.getByRole('button', {
            name: 'Salva bozza',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/sidebar'));
        expect(repository.save).toHaveBeenCalledTimes(2);
    });

    it('preserva la prima destinazione sospesa', async () => {
        repository = makeRepository();
        const router = renderPage();
        await makeDirty();
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await router.navigate('/logout');
        await userEvent.click(await screen.findByRole('button', {
            name: 'Abbandona',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/sidebar'));
    });

    it('preserva la prima destinazione sospesa anche con save', async () => {
        repository = makeRepository();
        const router = renderPage();
        await makeDirty();
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await router.navigate('/logout');
        await userEvent.click(await screen.findByRole('button', {
            name: 'Salva bozza',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/sidebar'));
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(createProperty).not.toHaveBeenCalled();
    });

    it('Abbandona usa la baseline dell’ultimo salvataggio manuale', async () => {
        repository = makeRepository();
        const router = renderPage();
        const input = await screen.findByLabelText(/Identificativo/);
        await userEvent.type(input, 'Salvato');
        await userEvent.click(screen.getByRole('button', {
            name: 'Salva bozza',
        }));
        await screen.findByText('Bozza salvata.');
        await userEvent.type(input, ' Modificato');
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await userEvent.click(await screen.findByRole('button', {
            name: 'Abbandona',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/sidebar'));
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();
        expect(createProperty).not.toHaveBeenCalled();
    });

    it('footer Annulla è protetto e può salvare prima di uscire', async () => {
        repository = makeRepository();
        const router = renderPage();
        await makeDirty();
        await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
        expect(await screen.findByText('Modifiche non salvate')).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/origin'));
        expect(repository.save).toHaveBeenCalledOnce();
    });

    it('bozza ripresa è clean, poi la modifica viene protetta', async () => {
        repository = makeRepository(record({ PropertyTitle: 'Ripresa' }));
        const router = renderPage();
        await userEvent.click(await screen.findByRole('button', {
            name: 'Riprendi bozza',
        }));
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/sidebar'));

        cleanup();
        repository = makeRepository(record({ PropertyTitle: 'Ripresa' }));
        const second = renderPage();
        await userEvent.click(await screen.findByRole('button', {
            name: 'Riprendi bozza',
        }));
        const input = screen.getByLabelText(/Identificativo/);
        await userEvent.type(input, ' modificata');
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        expect(await screen.findByText('Modifiche non salvate')).toBeTruthy();
        expect(second.state.location.pathname).toBe('/properties/new');
    });

    it('logout reale + Resta conserva account, route e valori', async () => {
        repository = makeRepository();
        initializeAccounts();
        writeSession('user-001');
        const { router, logoutMount } = renderAuthenticatedPage();
        await waitFor(() => expect(screen.getByTestId('account').textContent)
            .toBe('user-001'));
        const input = await makeDirty();
        await userEvent.click(screen.getByRole('link', {
            name: 'Logout reale',
        }));
        await userEvent.click(await screen.findByRole('button', {
            name: 'Resta',
        }));
        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/properties/new');
            expect(screen.getByTestId('account').textContent).toBe('user-001');
            expect(readSession()?.accountId).toBe('user-001');
            expect(input.value).toBe('Modificato');
            expect(logoutMount).not.toHaveBeenCalled();
            expect(repository.save).not.toHaveBeenCalled();
            expect(repository.delete).not.toHaveBeenCalled();
            expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        });
    });

    it.each([
        ['Abbandona', false],
        ['Salva bozza', true],
    ])('logout reale + %s completa una volta', async (action, saves) => {
        repository = makeRepository();
        initializeAccounts();
        writeSession('user-001');
        const { router, logoutMount } = renderAuthenticatedPage();
        await waitFor(() => expect(screen.getByTestId('account').textContent)
            .toBe('user-001'));
        await makeDirty();
        await userEvent.click(screen.getByRole('link', {
            name: 'Logout reale',
        }));
        await userEvent.click(await screen.findByRole('button', {
            name: action,
        }));
        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/dashboard');
            expect(screen.getByTestId('account').textContent).toBe('none');
            expect(readSession()).toBeNull();
            expect(logoutMount).toHaveBeenCalledOnce();
            expect(repository.save).toHaveBeenCalledTimes(saves ? 1 : 0);
            expect(repository.delete).not.toHaveBeenCalled();
            expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        });
        expect(legacyClear).not.toHaveBeenCalled();
    });

    it('logout save fallita conserva sessione e retry completa', async () => {
        repository = makeRepository();
        vi.mocked(repository.save)
            .mockRejectedValueOnce(new Error('storage'))
            .mockImplementationOnce(async (_definition, input) => (
                record(input.payload as PropertyFormData)
            ));
        initializeAccounts();
        writeSession('user-001');
        const { router, logoutMount } = renderAuthenticatedPage();
        await waitFor(() => expect(screen.getByTestId('account').textContent)
            .toBe('user-001'));
        const input = await makeDirty();
        await userEvent.click(screen.getByRole('link', {
            name: 'Logout reale',
        }));
        await userEvent.click(await screen.findByRole('button', {
            name: 'Salva bozza',
        }));
        expect(await screen.findByRole('alert')).toBeTruthy();
        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/properties/new');
            expect(screen.getByTestId('account').textContent).toBe('user-001');
            expect(readSession()?.accountId).toBe('user-001');
            expect(input.value).toBe('Modificato');
            expect(logoutMount).not.toHaveBeenCalled();
            expect(repository.save).toHaveBeenCalledOnce();
            expect((screen.getByRole('button', {
                name: 'Salva bozza',
            }) as HTMLButtonElement).disabled).toBe(false);
        });
        await userEvent.click(screen.getByRole('button', {
            name: 'Salva bozza',
        }));
        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/dashboard');
            expect(screen.getByTestId('account').textContent).toBe('none');
            expect(readSession()).toBeNull();
            expect(logoutMount).toHaveBeenCalledOnce();
            expect(repository.save).toHaveBeenCalledTimes(2);
            expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        });
    });

    it('BrowserRouter logout + save completa in Strict Mode', async () => {
        repository = makeRepository();
        initializeAccounts();
        writeSession('user-001');
        const consoleError = vi.spyOn(console, 'error').mockImplementation(
            () => undefined,
        );
        const { router, logoutMount } = renderAuthenticatedBrowserPage();
        await waitFor(() => expect(screen.getByTestId('account').textContent)
            .toBe('user-001'));
        await makeDirty();
        await userEvent.click(screen.getByRole('link', {
            name: 'Logout BrowserRouter',
        }));
        await userEvent.click(await screen.findByRole('button', {
            name: 'Salva bozza',
        }));
        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/dashboard');
            expect(window.location.pathname).toBe('/dashboard');
            expect(screen.getByTestId('account').textContent).toBe('none');
            expect(readSession()).toBeNull();
            expect(logoutMount).toHaveBeenCalledOnce();
            expect(repository.save).toHaveBeenCalledOnce();
            expect(repository.delete).not.toHaveBeenCalled();
            expect(screen.queryByText('Modifiche non salvate')).toBeNull();
            expect(screen.queryByLabelText(/Identificativo/)).toBeNull();
        });
        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });

    it('submit valido usa bypass e raggiunge il dettaglio', async () => {
        repository = makeRepository();
        createProperty.mockReturnValue({ id: 'property-1' });
        const router = renderPage();
        await userEvent.type(
            await screen.findByLabelText(/Identificativo/),
            'Unità 1',
        );
        await userEvent.type(screen.getByLabelText('Indirizzo'), 'Via Roma');
        await userEvent.type(screen.getByLabelText(/Citt/), 'Roma');
        await userEvent.type(screen.getByLabelText(/CAP/), '00100');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/properties/units/property-1'));
        expect(createProperty).toHaveBeenCalledOnce();
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledWith({
            formType: 'property',
            mode: 'create',
            entityId: null,
        });
        expect(legacyClear).not.toHaveBeenCalled();
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
    });

    it('submit fallito resetta il bypass', async () => {
        repository = makeRepository();
        createProperty.mockImplementation(() => {
            throw new Error('submit fallito');
        });
        const router = renderPage();
        await userEvent.type(
            await screen.findByLabelText(/Identificativo/),
            'Unità 1',
        );
        await userEvent.type(screen.getByLabelText('Indirizzo'), 'Via Roma');
        await userEvent.type(screen.getByLabelText(/Citt/), 'Roma');
        await userEvent.type(screen.getByLabelText(/CAP/), '00100');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        expect(await screen.findByText('submit fallito')).toBeTruthy();
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        expect(await screen.findByText('Modifiche non salvate')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/properties/new');
    });
});
