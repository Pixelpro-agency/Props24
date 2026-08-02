// @vitest-environment jsdom

import React from 'react';
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    createMemoryRouter,
    Link,
    RouterProvider,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DraftRepository } from '../../src/db/draftRepository.port';
import { createLease } from '../../src/db/leaseRepository';
import { LeaseForm } from '../../src/landlord/leases/components/LeaseForm';
import {
    LeaseCreateDraftProvider,
    useLeaseCreateDraftContext,
} from '../../src/landlord/leases/drafts/LeaseCreateDraftProvider';
import { LeaseCreateNavigationGuard } from '../../src/landlord/leases/drafts/LeaseCreateNavigationGuard';

let repository: DraftRepository;

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
        properties: [{
            id: 'property-1',
            archived: false,
            formData: {
                PropertyTitle: 'QA Property',
                PropertyAddress: 'Via QA 1',
            },
        }],
        tenants: [{
            id: 'tenant-1',
            archived: false,
            type: 'person',
            firstName: 'Tenant',
            lastName: 'QA',
            email: 'tenant@example.test',
        }],
    }),
    subscribeJsonDb: () => () => undefined,
}));
vi.mock('../../src/contacts/useContactList', () => ({
    useContactList: () => ({
        contacts: [],
        status: 'ready',
        error: null,
        refresh: vi.fn(async () => undefined),
    }),
}));
vi.mock('../../src/contacts/ContactRepositoryContext', () => ({
    useContactRepository: () => ({}),
}));

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return { promise, resolve, reject };
}

function fake(): DraftRepository {
    return {
        get: vi.fn(async () => null),
        list: vi.fn(async () => []),
        save: vi.fn(),
        delete: vi.fn(async () => true),
    };
}

function Seeder() {
    const draft = useLeaseCreateDraftContext();
    return (
        <>
            <button type="button" onClick={() => {
                draft.methods.setValue(
                    'LeaseIdentificativo',
                    'QA-F33E',
                    { shouldDirty: true },
                );
                draft.methods.setValue(
                    'PropertyID',
                    'property-1',
                    { shouldDirty: true },
                );
                draft.methods.setValue(
                    'LeaseType',
                    'residential',
                    { shouldDirty: true },
                );
                draft.methods.setValue(
                    'LeaseTenantIds',
                    ['tenant-1'],
                    { shouldDirty: true },
                );
                draft.methods.setValue(
                    'LeaseStartDate',
                    '2026-08-01',
                    { shouldDirty: true },
                );
                draft.methods.setValue(
                    'LeaseEndDate',
                    '2027-07-31',
                    { shouldDirty: true },
                );
                draft.methods.setValue(
                    'LeaseRentHC',
                    900,
                    { shouldDirty: true },
                );
            }}>
                Prepara payload valido
            </button>
            <button
                type="button"
                onClick={() => draft.setActiveTab('contract')}
            >
                Scheda Contratto
            </button>
            <output data-testid="active-tab">{draft.activeTab}</output>
        </>
    );
}

function renderFlow() {
    const router = createMemoryRouter([
        {
            path: '/leases/new',
            element: (
                <LeaseCreateDraftProvider onExitDraft={() => undefined}>
                    <LeaseCreateNavigationGuard>
                        {({ completeCreatedLease }) => (
                            <>
                                <Seeder />
                                <Link to="/sidebar">Sidebar</Link>
                                <LeaseForm
                                    onCreateLeaseCreated={completeCreatedLease}
                                />
                            </>
                        )}
                    </LeaseCreateNavigationGuard>
                </LeaseCreateDraftProvider>
            ),
        },
        { path: '/leases', element: <p>leases target</p> },
        { path: '/sidebar', element: <p>sidebar target</p> },
    ], { initialEntries: ['/leases/new'] });
    render(<RouterProvider router={router} />);
    return router;
}

async function submitValid() {
    await userEvent.click(await screen.findByRole('button', {
        name: 'Prepara payload valido',
    }));
    await userEvent.click(screen.getByRole('button', {
        name: 'Crea locazione',
    }));
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('Lease create submit recovery', () => {
    it('crea una volta, elimina la bozza F1 e naviga con toast', async () => {
        repository = fake();
        vi.mocked(createLease).mockReturnValue({ id: 'lease-1' } as never);
        const router = renderFlow();

        await submitValid();

        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/leases'));
        expect(createLease).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledWith({
            formType: 'lease',
            mode: 'create',
            entityId: null,
        });
        expect(router.state.location.state).toEqual({
            toast: {
                variant: 'success',
                title: 'Successo',
                message: 'La locazione è stata creata.',
            },
        });
        expect(screen.queryByText(
            'Locazione creata, pulizia incompleta',
        )).toBeNull();
    });

    it('delete false è un cleanup riuscito senza recovery', async () => {
        repository = fake();
        vi.mocked(repository.delete).mockResolvedValue(false);
        vi.mocked(createLease).mockReturnValue({ id: 'lease-1' } as never);
        const router = renderFlow();

        await submitValid();

        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/leases'));
        expect(createLease).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledOnce();
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('create fallita non avvia cleanup e il form resta protetto', async () => {
        repository = fake();
        vi.mocked(createLease).mockImplementation(() => {
            throw new Error('create failed');
        });
        const router = renderFlow();

        await submitValid();

        expect(await screen.findByText('create failed')).toBeTruthy();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(router.state.location.pathname).toBe('/leases/new');
        await router.navigate('/sidebar');
        expect(await screen.findByText('Modifiche non salvate')).toBeTruthy();
        expect(screen.queryByText(
            'Locazione creata, pulizia incompleta',
        )).toBeNull();
    });

    it('cleanup fallito mostra solo recovery e retry non ricrea', async () => {
        repository = fake();
        vi.mocked(repository.delete)
            .mockRejectedValueOnce(new Error('storage'))
            .mockResolvedValueOnce(true);
        vi.mocked(createLease).mockReturnValue({ id: 'lease-1' } as never);
        const router = renderFlow();

        await userEvent.click(await screen.findByRole('button', {
            name: 'Scheda Contratto',
        }));
        await submitValid();

        expect(await screen.findByRole('heading', {
            name: 'Locazione creata, pulizia incompleta',
        })).toBeTruthy();
        expect(screen.getByRole('alert').textContent).toBe(
            'Non è stato possibile eliminare la bozza locale. '
            + 'Riprova la pulizia.',
        );
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        expect(screen.getByTestId('active-tab').textContent).toBe('contract');
        expect(router.state.location.pathname).toBe('/leases/new');

        await router.navigate('/sidebar');
        expect(router.state.location.pathname).toBe('/leases/new');
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();

        await userEvent.click(screen.getByRole('button', {
            name: 'Riprova pulizia',
        }));

        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/leases'));
        expect(createLease).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledTimes(2);
    });

    it('retry fallito resta disponibile senza seconda create', async () => {
        repository = fake();
        vi.mocked(repository.delete)
            .mockRejectedValueOnce(new Error('first'))
            .mockRejectedValueOnce(new Error('retry'));
        vi.mocked(createLease).mockReturnValue({ id: 'lease-1' } as never);
        const router = renderFlow();

        await submitValid();
        await userEvent.click(await screen.findByRole('button', {
            name: 'Riprova pulizia',
        }));

        expect((await screen.findByRole('button', {
            name: 'Riprova pulizia',
        }) as HTMLButtonElement).disabled).toBe(false);
        expect(router.state.location.pathname).toBe('/leases/new');
        expect(createLease).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledTimes(2);
    });

    it('serializza il doppio retry pendente', async () => {
        const pending = deferred<boolean>();
        repository = fake();
        vi.mocked(repository.delete)
            .mockRejectedValueOnce(new Error('first'))
            .mockReturnValueOnce(pending.promise);
        vi.mocked(createLease).mockReturnValue({ id: 'lease-1' } as never);
        const router = renderFlow();

        await submitValid();
        const retry = await screen.findByRole('button', {
            name: 'Riprova pulizia',
        });
        fireEvent.click(retry);
        fireEvent.click(retry);

        expect(repository.delete).toHaveBeenCalledTimes(2);
        expect((retry as HTMLButtonElement).disabled).toBe(true);
        expect(createLease).toHaveBeenCalledOnce();

        pending.resolve(true);
        await act(async () => {
            await pending.promise;
        });
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/leases'));
    });

    it('beforeunload resta protetto durante recovery', async () => {
        repository = fake();
        vi.mocked(repository.delete).mockRejectedValue(new Error('storage'));
        vi.mocked(createLease).mockReturnValue({ id: 'lease-1' } as never);
        const addListener = vi.spyOn(window, 'addEventListener');
        renderFlow();

        await submitValid();
        await screen.findByRole('heading', {
            name: 'Locazione creata, pulizia incompleta',
        });
        const beforeUnload = addListener.mock.calls.find(
            ([type]) => type === 'beforeunload',
        )?.[1] as EventListener;
        const event = new Event('beforeunload', { cancelable: true });

        beforeUnload.call(window, event);

        expect(event.defaultPrevented).toBe(true);
        addListener.mockRestore();
    });
});
