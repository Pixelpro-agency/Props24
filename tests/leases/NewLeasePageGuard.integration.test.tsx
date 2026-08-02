// @vitest-environment jsdom

import React, { useEffect, useRef } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
    createBrowserRouter,
    createMemoryRouter,
    Link,
    RouterProvider,
    useLocation,
    useNavigate,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from '../../src/auth/AuthContext';
import { LogoutPage } from '../../src/auth/LogoutPage';
import { clearSession, initializeAccounts, readSession, writeSession } from '../../src/auth/authStorage';
import type { DraftRecord, DraftRepository } from '../../src/db/draftRepository.port';
import { createLease } from '../../src/db/leaseRepository';
import { LeaseForm } from '../../src/landlord/leases/components/LeaseForm';
import { LeaseCreateDraftProvider, useLeaseCreateDraftContext } from '../../src/landlord/leases/drafts/LeaseCreateDraftProvider';
import { LeaseCreateNavigationGuard } from '../../src/landlord/leases/drafts/LeaseCreateNavigationGuard';
import type { LeaseDraftPayload } from '../../src/landlord/leases/drafts/leaseDraftDefinition';
import { defaultLeaseValues } from '../../src/landlord/leases/schema/leaseFormSchema';

let repository: DraftRepository;
const browserRouters: ReturnType<typeof createBrowserRouter>[] = [];

vi.mock('../../src/drafts/DraftRepositoryContext', () => ({
    useDraftRepository: () => repository,
}));
vi.mock('../../src/db/leaseRepository', () => ({
    createLease: vi.fn(),
    updateLease: vi.fn(),
    getLeaseDetail: () => null,
}));
vi.mock('../../src/db/jsonDb', () => ({
    getJsonDb: () => ({
        properties: [{ id: 'property-1', archived: false, formData: { PropertyTitle: 'QA Property', PropertyAddress: 'Via QA 1' } }],
        tenants: [{ id: 'tenant-1', archived: false, type: 'person', firstName: 'Tenant', lastName: 'QA', email: 'tenant@example.test' }],
    }),
    subscribeJsonDb: () => () => undefined,
    setActiveDatabaseAccount: vi.fn(),
}));
vi.mock('../../src/contacts/useContactList', () => ({
    useContactList: () => ({ contacts: [], status: 'ready', error: null, refresh: vi.fn(async () => undefined) }),
}));
vi.mock('../../src/contacts/ContactRepositoryContext', () => ({
    useContactRepository: () => ({}),
}));

function record(
    title = 'Baseline ripresa',
    activeTab: LeaseDraftPayload['activeTab'] = 'contract',
): DraftRecord<LeaseDraftPayload> {
    return {
        id: 'lease-draft',
        accountId: 'user-001',
        formType: 'lease',
        mode: 'create',
        entityId: null,
        schemaVersion: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        payload: {
            formData: { ...defaultLeaseValues, LeaseIdentificativo: title },
            activeTab,
        },
    };
}

function fake(initial: DraftRecord<LeaseDraftPayload> | null = null): DraftRepository {
    let current = initial;
    return {
        get: vi.fn(async () => current),
        list: vi.fn(async () => current ? [current] : []),
        save: vi.fn(async (_definition, input) => {
            const payload = input.payload as LeaseDraftPayload;
            current = {
                ...record(payload.formData.LeaseIdentificativo, payload.activeTab),
                payload: structuredClone(payload),
            };
            return current;
        }),
        delete: vi.fn(async () => {
            current = null;
            return true;
        }),
    };
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return { promise, resolve, reject };
}

function Pathname() {
    const location = useLocation();
    return <output data-testid="pathname">{location.pathname}</output>;
}

function GuardHarness() {
    const draft = useLeaseCreateDraftContext();
    const navigate = useNavigate();
    return (
        <LeaseCreateNavigationGuard>
            {({ completeCreatedLease }) => (
                <>
                    <Pathname />
                    <label>
                        Identificativo
                        <input aria-label="Identificativo" {...draft.methods.register('LeaseIdentificativo')} />
                    </label>
                    <output data-testid="dirty">{String(draft.methods.formState.isDirty)}</output>
                    <output data-testid="tab">{draft.activeTab}</output>
                    <Link to="/leases">Header Indietro</Link>
                    <Link to="/leases">Annulla</Link>
                    <Link to="/sidebar">Sidebar</Link>
                    <Link to="/logout">Logout</Link>
                    <button type="button" onClick={() => navigate('/external')}>Programmatica</button>
                    <button type="button" onClick={() => draft.setActiveTab('contract')}>Contratto</button>
                    <button type="button" onClick={() => { void draft.saveDraft().catch(() => undefined); }}>Salva manuale</button>
                    <button type="button" onClick={() => {
                        void completeCreatedLease({ id: 'lease-created' });
                    }}>Create riuscita</button>
                    <button type="button" onClick={() => navigate('/leases')}>Create fallita</button>
                    <button type="button" onClick={() => undefined}>Apri e chiudi modal</button>
                    <span>{draft.draftSuccess}</span>
                </>
            )}
        </LeaseCreateNavigationGuard>
    );
}

function AuthState() {
    const { account } = useAuth();
    const location = useLocation();
    return <>
        <output data-testid="account">{account?.id ?? 'none'}</output>
        <output data-testid="auth-pathname">{location.pathname}</output>
    </>;
}

function renderAuthenticatedPage() {
    repository = fake();
    initializeAccounts();
    writeSession('user-001');
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
            path: '/leases/new',
            element: <><AuthState /><LeaseCreateDraftProvider onExitDraft={() => undefined}><GuardHarness /></LeaseCreateDraftProvider></>,
        },
        { path: '/logout', element: <RealLogout /> },
        { path: '/dashboard', element: <><AuthState /><p>dashboard reale</p></> },
        { path: '/sidebar', element: <p>sidebar target</p> },
        { path: '/leases', element: <p>leases target</p> },
        { path: '/external', element: <p>external target</p> },
    ], { initialEntries: ['/leases/new'] });
    render(<AuthProvider><RouterProvider router={router} /></AuthProvider>);
    return { router, logoutMount };
}

function SubmitSeeder() {
    const draft = useLeaseCreateDraftContext();
    return <button type="button" onClick={() => {
        draft.methods.setValue('LeaseIdentificativo', 'Submit reale', { shouldDirty: true });
        draft.methods.setValue('PropertyID', 'property-1', { shouldDirty: true });
        draft.methods.setValue('LeaseType', 'residential', { shouldDirty: true });
        draft.methods.setValue('LeaseTenantIds', ['tenant-1'], { shouldDirty: true });
        draft.methods.setValue('LeaseStartDate', '2026-08-01', { shouldDirty: true });
        draft.methods.setValue('LeaseEndDate', '2027-07-31', { shouldDirty: true });
        draft.methods.setValue('LeaseRentHC', 900, { shouldDirty: true });
    }}>Prepara payload valido</button>;
}

function renderRealSubmit() {
    repository = fake();
    const router = createMemoryRouter([
        {
            path: '/leases/new',
            element: <LeaseCreateDraftProvider onExitDraft={() => undefined}>
                <LeaseCreateNavigationGuard>
                    {({ completeCreatedLease }) => <>
                        <SubmitSeeder />
                        <LeaseForm onCreateLeaseCreated={completeCreatedLease} />
                    </>}
                </LeaseCreateNavigationGuard>
            </LeaseCreateDraftProvider>,
        },
        { path: '/leases', element: <p>leases target</p> },
        { path: '/sidebar', element: <p>sidebar target</p> },
    ], { initialEntries: ['/leases/new'] });
    render(<RouterProvider router={router} />);
    return router;
}

function routes() {
    return [
        {
            path: '/leases/new',
            element: (
                <LeaseCreateDraftProvider onExitDraft={() => undefined}>
                    <GuardHarness />
                </LeaseCreateDraftProvider>
            ),
        },
        { path: '/leases', element: <p>leases target</p> },
        { path: '/sidebar', element: <p>sidebar target</p> },
        { path: '/logout', element: <p>logout target</p> },
        { path: '/external', element: <p>external target</p> },
    ];
}

function renderPage(initial: DraftRecord<LeaseDraftPayload> | null = null) {
    repository = fake(initial);
    const router = createMemoryRouter(routes(), { initialEntries: ['/leases/new'] });
    render(<RouterProvider router={router} />);
    return router;
}

function renderBrowserPage() {
    repository = fake();
    window.history.replaceState(null, '', '/origin');
    const router = createBrowserRouter([
        { path: '/origin', element: <Link to="/leases/new">Nuova locazione</Link> },
        ...routes(),
    ]);
    browserRouters.push(router);
    render(<RouterProvider router={router} />);
    return router;
}

async function ready() {
    return screen.findByLabelText('Identificativo');
}

async function dirty(value = 'Modificata') {
    const input = await ready();
    fireEvent.change(input, { target: { value } });
    await waitFor(() => expect(screen.getByTestId('dirty').textContent).toBe('true'));
    return input as HTMLInputElement;
}

async function dialog() {
    return screen.findByRole('heading', { name: 'Modifiche non salvate' });
}

afterEach(() => {
    cleanup();
    browserRouters.splice(0).forEach((router) => router.dispose());
    vi.restoreAllMocks();
    window.history.replaceState(null, '', '/');
    clearSession();
    localStorage.clear();
    sessionStorage.clear();
});

describe('Lease create navigation guard', () => {
    it('logout reale dirty + Resta conserva autenticazione, route, valore e tab', async () => {
        const { router, logoutMount } = renderAuthenticatedPage();
        await waitFor(() => expect(screen.getByTestId('account').textContent).toBe('user-001'));
        const input = await dirty('Logout resta');
        fireEvent.click(screen.getByRole('button', { name: 'Contratto' }));
        fireEvent.click(screen.getByRole('link', { name: 'Logout' }));
        await dialog();
        fireEvent.click(screen.getByRole('button', { name: 'Resta' }));
        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/leases/new');
            expect(input.value).toBe('Logout resta');
            expect(screen.getByTestId('tab').textContent).toBe('contract');
            expect(screen.getByTestId('account').textContent).toBe('user-001');
            expect(readSession()?.accountId).toBe('user-001');
            expect(logoutMount).not.toHaveBeenCalled();
            expect(repository.save).not.toHaveBeenCalled();
            expect(repository.delete).not.toHaveBeenCalled();
            expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        });
    });

    it('logout reale dirty + Abbandona monta LogoutPage una volta e chiude la sessione', async () => {
        const { router, logoutMount } = renderAuthenticatedPage();
        await dirty('Logout abbandona');
        fireEvent.click(screen.getByRole('link', { name: 'Logout' }));
        await dialog();
        fireEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/dashboard');
            expect(logoutMount).toHaveBeenCalledOnce();
            expect(readSession()).toBeNull();
            expect(screen.getByTestId('account').textContent).toBe('none');
            expect(repository.save).not.toHaveBeenCalled();
            expect(repository.delete).not.toHaveBeenCalled();
            expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        });
    });

    it('logout reale dirty + Salva bozza salva una volta e chiude la sessione', async () => {
        const { router, logoutMount } = renderAuthenticatedPage();
        await dirty('Logout salva');
        fireEvent.click(screen.getByRole('link', { name: 'Logout' }));
        await dialog();
        fireEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/dashboard');
            expect(screen.getByTestId('account').textContent).toBe('none');
            expect(repository.save).toHaveBeenCalledOnce();
            expect(logoutMount).toHaveBeenCalledOnce();
            expect(readSession()).toBeNull();
            expect(repository.delete).not.toHaveBeenCalled();
            expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        });
    });

    it('logout reale con save fallita conserva sessione e consente retry', async () => {
        const { router, logoutMount } = renderAuthenticatedPage();
        vi.mocked(repository.save).mockRejectedValueOnce(new Error('storage'));
        await dirty('Logout errore');
        fireEvent.click(screen.getByRole('link', { name: 'Logout' }));
        await dialog();
        fireEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await screen.findByRole('alert');
        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/leases/new');
            expect(readSession()?.accountId).toBe('user-001');
            expect(screen.getByTestId('account').textContent).toBe('user-001');
            expect(logoutMount).not.toHaveBeenCalled();
            expect(repository.save).toHaveBeenCalledOnce();
            expect((screen.getByRole('button', {
                name: 'Salva bozza',
            }) as HTMLButtonElement).disabled).toBe(false);
        });
        fireEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/dashboard');
            expect(readSession()).toBeNull();
            expect(screen.getByTestId('account').textContent).toBe('none');
            expect(logoutMount).toHaveBeenCalledOnce();
            expect(repository.save).toHaveBeenCalledTimes(2);
            expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        });
    });

    it('submit LeaseForm reale riuscito attraversa il bypass e naviga senza dialog', async () => {
        vi.mocked(createLease).mockReturnValue({ id: 'lease-created' } as ReturnType<typeof createLease>);
        const router = renderRealSubmit();
        fireEvent.click(await screen.findByRole('button', { name: 'Prepara payload valido' }));
        fireEvent.click(screen.getByRole('button', { name: 'Crea locazione' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/leases'));
        expect(createLease).toHaveBeenCalledOnce();
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        expect(repository.delete).toHaveBeenCalledOnce();
    });

    it('submit LeaseForm reale fallito non lascia bypass residuo', async () => {
        vi.mocked(createLease).mockImplementation(() => { throw new Error('create failure'); });
        const router = renderRealSubmit();
        fireEvent.click(await screen.findByRole('button', { name: 'Prepara payload valido' }));
        fireEvent.click(screen.getByRole('button', { name: 'Crea locazione' }));
        expect(await screen.findByText('create failure')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/leases/new');
        expect(repository.delete).not.toHaveBeenCalled();
        await act(async () => { await router.navigate('/sidebar'); });
        await dialog();
        expect(router.state.location.pathname).toBe('/leases/new');
    });
    it.each([
        ['Header Indietro', '/leases'],
        ['Annulla', '/leases'],
        ['Sidebar', '/sidebar'],
        ['Logout', '/logout'],
    ])('form clean + %s naviga subito senza dialog', async (name, target) => {
        const router = renderPage();
        await ready();
        fireEvent.click(screen.getByRole('link', { name }));
        await waitFor(() => expect(router.state.location.pathname).toBe(target));
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
    });

    it.each(['Header Indietro', 'Annulla', 'Sidebar', 'Logout'])(
        'form dirty + %s apre il dialog e conserva la route',
        async (name) => {
            const router = renderPage();
            await dirty();
            fireEvent.click(screen.getByRole('link', { name }));
            await dialog();
            expect(router.state.location.pathname).toBe('/leases/new');
            expect(repository.save).not.toHaveBeenCalled();
            expect(repository.delete).not.toHaveBeenCalled();
        },
    );

    it('Resta conserva route, valore e activeTab senza persistenza', async () => {
        const router = renderPage();
        const input = await dirty('Resta QA');
        fireEvent.click(screen.getByRole('button', { name: 'Contratto' }));
        fireEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await dialog();
        fireEvent.click(screen.getByRole('button', { name: 'Resta' }));
        await waitFor(() => expect(screen.queryByText('Modifiche non salvate')).toBeNull());
        expect(router.state.location.pathname).toBe('/leases/new');
        expect(input.value).toBe('Resta QA');
        expect(screen.getByTestId('tab').textContent).toBe('contract');
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('Abbandona ripristina la baseline iniziale e procede', async () => {
        const router = renderPage();
        await dirty('Da scartare');
        fireEvent.click(screen.getByRole('button', { name: 'Contratto' }));
        fireEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await dialog();
        fireEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/sidebar'));
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('baseline iniziale resta ai default dopo Abbandona e ritorno', async () => {
        const router = renderPage();
        await dirty('Da eliminare davvero');
        fireEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await dialog();
        fireEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/sidebar'));
        await waitFor(() => expect([...router.state.blockers.values()].every((blocker) => blocker.state === 'unblocked')).toBe(true));
        await act(async () => { await router.navigate('/leases/new'); });
        expect((await ready() as HTMLInputElement).value).toBe(defaultLeaseValues.LeaseIdentificativo);
        expect(screen.getByTestId('tab').textContent).toBe('general');
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('Abbandona dopo save manuale conserva la baseline salvata e activeTab', async () => {
        const router = renderPage();
        await dirty('Baseline manuale');
        fireEvent.click(screen.getByRole('button', { name: 'Contratto' }));
        fireEvent.click(screen.getByRole('button', { name: 'Salva manuale' }));
        await screen.findByText('Bozza salvata.');
        fireEvent.change(screen.getByLabelText('Identificativo'), { target: { value: 'Non persistita' } });
        fireEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await dialog();
        fireEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/sidebar'));
        await waitFor(() => expect([...router.state.blockers.values()].every((blocker) => blocker.state === 'unblocked')).toBe(true));
        await act(async () => { await router.navigate('/leases/new'); });
        fireEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));
        expect((await screen.findByLabelText('Identificativo') as HTMLInputElement).value).toBe('Baseline manuale');
        expect(screen.getByTestId('tab').textContent).toBe('contract');
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('Abbandona dopo Riprendi conserva la baseline originaria e activeTab', async () => {
        const router = renderPage(record('Baseline originaria', 'contract'));
        fireEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));
        fireEvent.change(await screen.findByLabelText('Identificativo'), { target: { value: 'Modifica non salvata' } });
        fireEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await dialog();
        fireEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/sidebar'));
        await waitFor(() => expect([...router.state.blockers.values()].every((blocker) => blocker.state === 'unblocked')).toBe(true));
        await act(async () => { await router.navigate('/leases/new'); });
        fireEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));
        expect((await screen.findByLabelText('Identificativo') as HTMLInputElement).value).toBe('Baseline originaria');
        expect(screen.getByTestId('tab').textContent).toBe('contract');
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('Salva bozza usa payload e activeTab una volta e procede', async () => {
        const router = renderPage();
        await dirty('Salvata dal guard');
        fireEvent.click(screen.getByRole('button', { name: 'Contratto' }));
        fireEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await dialog();
        fireEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/sidebar'));
        expect(repository.save).toHaveBeenCalledOnce();
        expect(vi.mocked(repository.save).mock.calls[0][1]).toMatchObject({
            mode: 'create',
            payload: { activeTab: 'contract', formData: { LeaseIdentificativo: 'Salvata dal guard' } },
        });
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('save fallita mantiene dialog, route e valore con errore user-safe', async () => {
        const router = renderPage();
        vi.mocked(repository.save).mockRejectedValueOnce(new Error('storage'));
        const input = await dirty('Errore save');
        fireEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await dialog();
        fireEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        expect((await screen.findByRole('alert')).textContent).toContain('Impossibile salvare la bozza');
        expect(router.state.location.pathname).toBe('/leases/new');
        expect(input.value).toBe('Errore save');
    });

    it('retry dopo errore salva una seconda volta e naviga una sola volta', async () => {
        const router = renderPage();
        vi.mocked(repository.save).mockRejectedValueOnce(new Error('storage'));
        await dirty('Retry');
        fireEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await dialog();
        fireEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/sidebar'));
        expect(repository.save).toHaveBeenCalledTimes(2);
    });

    it('doppio click durante save pendente produce una sola save', async () => {
        renderPage();
        const pending = deferred<DraftRecord<LeaseDraftPayload>>();
        vi.mocked(repository.save).mockReturnValue(pending.promise);
        await dirty('Doppio click');
        fireEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await dialog();
        const save = screen.getByRole('button', { name: 'Salva bozza' });
        fireEvent.click(save);
        fireEvent.click(save);
        expect(repository.save).toHaveBeenCalledOnce();
        pending.resolve(record('Doppio click'));
        await act(async () => { await pending.promise; });
    });

    it.each(['Abbandona', 'Salva bozza'])(
        'preserva la prima destinazione quando Sidebar precede Logout con %s',
        async (action) => {
            const router = renderPage();
            await dirty();
            fireEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
            await dialog();
            void router.navigate('/logout');
            fireEvent.click(screen.getByRole('button', { name: action }));
            await waitFor(() => expect(router.state.location.pathname).toBe('/sidebar'));
        },
    );

    it('navigate programmatico dirty è protetto', async () => {
        const router = renderPage();
        await dirty();
        fireEvent.click(screen.getByRole('button', { name: 'Programmatica' }));
        await dialog();
        expect(router.state.location.pathname).toBe('/leases/new');
    });

    it('beforeunload clean non è bloccato', async () => {
        renderPage();
        await ready();
        const clean = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(clean);
        expect(clean.defaultPrevented).toBe(false);
    });

    it('beforeunload dirty è bloccato', async () => {
        renderPage();
        await dirty();
        const changed = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(changed);
        expect(changed.defaultPrevented).toBe(true);
    });

    it('save manuale rende clean e la navigazione successiva non è bloccata', async () => {
        const router = renderPage();
        await dirty('Manuale');
        fireEvent.click(screen.getByRole('button', { name: 'Salva manuale' }));
        await screen.findByText('Bozza salvata.');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        fireEvent.click(screen.getByRole('link', { name: 'Annulla' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/leases'));
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
    });

    it('solo cambio activeTab resta clean, non salva e naviga senza dialog', async () => {
        const router = renderPage();
        await ready();
        fireEvent.click(screen.getByRole('button', { name: 'Contratto' }));
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/sidebar'));
    });

    it('bozza ripresa parte clean e naviga senza dialog', async () => {
        const router = renderPage(record());
        fireEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));
        await screen.findByDisplayValue('Baseline ripresa');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        fireEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/sidebar'));
    });

    it.each(['Resta', 'Abbandona'])(
        'bozza ripresa modificata + %s usa la baseline ripresa',
        async (action) => {
            const router = renderPage(record());
            fireEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));
            const input = await screen.findByDisplayValue('Baseline ripresa') as HTMLInputElement;
            fireEvent.change(input, { target: { value: 'Modifica ripresa' } });
            fireEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
            await dialog();
            fireEvent.click(screen.getByRole('button', { name: action }));
            if (action === 'Resta') {
                expect(router.state.location.pathname).toBe('/leases/new');
                expect(input.value).toBe('Modifica ripresa');
            } else {
                await waitFor(() => expect(router.state.location.pathname).toBe('/sidebar'));
            }
            expect(repository.delete).not.toHaveBeenCalled();
        },
    );

    it('apertura e chiusura modal senza selezione non crea dirty o autosave', async () => {
        const router = renderPage();
        await ready();
        fireEvent.click(screen.getByRole('button', { name: 'Apri e chiudi modal' }));
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/sidebar'));
    });

    it('loading mostra solo loader e non monta il guard', async () => {
        repository = fake();
        const pending = deferred<DraftRecord<LeaseDraftPayload> | null>();
        vi.mocked(repository.get).mockReturnValue(pending.promise);
        const router = createMemoryRouter(routes(), { initialEntries: ['/leases/new'] });
        render(<RouterProvider router={router} />);
        expect(screen.getByRole('status').textContent).toContain('Caricamento bozza');
        expect(screen.queryByText('Header Indietro')).toBeNull();
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        pending.resolve(null);
        await act(async () => { await pending.promise; });
    });

    it('choice_required mostra solo restore dialog', async () => {
        renderPage(record());
        expect(await screen.findByRole('heading', { name: 'Bozza locazione disponibile' })).toBeTruthy();
        expect(screen.queryByText('Header Indietro')).toBeNull();
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
    });

    it('load_error mostra restore error con Esci e Riprova', async () => {
        repository = fake();
        vi.mocked(repository.get).mockRejectedValue(new Error('load'));
        const router = createMemoryRouter(routes(), { initialEntries: ['/leases/new'] });
        render(<RouterProvider router={router} />);
        expect(await screen.findByRole('heading', { name: 'Impossibile aprire la bozza' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Esci' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Riprova' })).toBeTruthy();
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
    });

    it('completeCreatedLease pulisce la bozza e consente una sola navigazione', async () => {
        const router = renderPage();
        await dirty('Create');
        fireEvent.click(screen.getByRole('button', { name: 'Create riuscita' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/leases'));
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        expect(repository.delete).toHaveBeenCalledOnce();
    });

    it('create fallita senza bypass lascia la navigazione successiva protetta', async () => {
        const router = renderPage();
        await dirty('Create fallita');
        fireEvent.click(screen.getByRole('button', { name: 'Create fallita' }));
        await dialog();
        expect(router.state.location.pathname).toBe('/leases/new');
    });

    it.each(['Resta', 'Abbandona', 'Salva bozza'])(
        'BrowserRouter back + %s rispetta la scelta',
        async (action) => {
            const router = renderBrowserPage();
            fireEvent.click(await screen.findByRole('link', { name: 'Nuova locazione' }));
            await dirty('Browser back');
            window.history.back();
            await dialog();
            fireEvent.click(screen.getByRole('button', { name: action }));
            if (action === 'Resta') {
                expect(router.state.location.pathname).toBe('/leases/new');
                expect((screen.getByLabelText('Identificativo') as HTMLInputElement).value).toBe('Browser back');
            } else {
                await waitFor(() => expect(router.state.location.pathname).toBe('/origin'));
            }
            expect(repository.delete).not.toHaveBeenCalled();
            expect(repository.save).toHaveBeenCalledTimes(action === 'Salva bozza' ? 1 : 0);
        },
    );
});
