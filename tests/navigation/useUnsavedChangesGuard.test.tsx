// @vitest-environment jsdom

import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    RouterProvider,
    createBrowserRouter,
    createMemoryRouter,
    Link,
    Outlet,
    useNavigate,
} from 'react-router-dom';
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    useUnsavedChangesGuard,
    type UseUnsavedChangesGuardOptions,
} from '../../src/navigation/useUnsavedChangesGuard';

interface Deferred {
    promise: Promise<void>;
    resolve(): void;
    reject(error: unknown): void;
}

function deferred(): Deferred {
    let resolve!: () => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<void>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

function renderGuard(
    overrides: Partial<UseUnsavedChangesGuardOptions> = {},
    strictMode = false,
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

    function Harness() {
        const navigate = useNavigate();
        const guard = useUnsavedChangesGuard(options);
        return (
            <main>
                <output data-testid="phase">{guard.state.phase}</output>
                <output data-testid="error">{guard.state.error}</output>
                <output data-testid="open">{String(guard.isDialogOpen)}</output>
                <output data-testid="disabled">
                    {String(guard.actionsDisabled)}
                </output>
                <button onClick={() => navigate('/next')}>Vai</button>
                <button onClick={() => {
                    guard.allowNextNavigation();
                    navigate('/next');
                }}>
                    Submit e vai
                </button>
                <button onClick={guard.stay}>Resta</button>
                <button onClick={() => void guard.saveAndProceed()}>
                    Salva
                </button>
                <button onClick={() => void guard.discardAndProceed()}>
                    Abbandona
                </button>
                <button onClick={guard.resetGuard}>Reset</button>
            </main>
        );
    }

    const router = createMemoryRouter([
        { path: '/', element: <Harness /> },
        { path: '/next', element: <p>Destinazione</p> },
        { path: '/other', element: <p>Altra destinazione</p> },
    ], { initialEntries: ['/'] });
    const renderElement = () => strictMode
        ? (
            <React.StrictMode>
                <RouterProvider router={router} />
            </React.StrictMode>
        )
        : <RouterProvider router={router} />;
    const view = render(renderElement());
    return {
        ...view,
        router,
        options,
        rerenderOptions(next: Partial<UseUnsavedChangesGuardOptions>) {
            Object.assign(options, next);
            view.rerender(renderElement());
        },
    };
}

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe('useUnsavedChangesGuard', () => {
    it('blocca un POP immediato dopo il commit dirty nello stesso task', async () => {
        window.history.replaceState(null, '', '/previous');

        function BrowserPopHarness() {
            const [isDirty, setIsDirty] = useState(false);
            const guard = useUnsavedChangesGuard({
                enabled: true,
                isDirty,
                isSubmitting: false,
                isSavingDraft: false,
                saveDraft: async () => undefined,
                discardChanges: () => undefined,
            });
            return (
                <>
                    <output data-testid="browser-dirty">
                        {String(isDirty)}
                    </output>
                    <output data-testid="browser-phase">
                        {guard.state.phase}
                    </output>
                    <button onClick={() => {
                        flushSync(() => setIsDirty(true));
                        window.history.back();
                    }}>
                        Dirty e indietro
                    </button>
                </>
            );
        }

        const router = createBrowserRouter([
            {
                path: '/previous',
                element: <Link to="/current">Apri form</Link>,
            },
            { path: '/current', element: <BrowserPopHarness /> },
        ]);
        render(<RouterProvider router={router} />);
        await userEvent.click(screen.getByRole('link', {
            name: 'Apri form',
        }));
        await userEvent.click(screen.getByRole('button', {
            name: 'Dirty e indietro',
        }));
        expect(screen.getByTestId('browser-dirty').textContent).toBe('true');
        await waitFor(() => expect(
            screen.getByTestId('browser-phase').textContent,
        ).toBe('blocked'));
        expect(router.state.location.pathname).toBe('/current');
        router.dispose();
    });

    it.each([
        ['clean', { isDirty: false }],
        ['disabilitato', { enabled: false }],
    ])('naviga immediatamente con form %s', async (_label, overrides) => {
        const { router } = renderGuard(overrides);
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        expect(router.state.location.pathname).toBe('/next');
    });

    it('blocca form dirty e apre un solo flusso', async () => {
        const { router } = renderGuard();
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        expect(router.state.location.pathname).toBe('/');
        expect(screen.getByTestId('phase').textContent).toBe('blocked');
        expect(screen.getByTestId('open').textContent).toBe('true');
    });

    it('Resta mantiene la route e non invoca callback', async () => {
        const { router, options } = renderGuard();
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        await userEvent.click(screen.getByRole('button', { name: 'Resta' }));
        expect(router.state.location.pathname).toBe('/');
        expect(screen.getByTestId('phase').textContent).toBe('idle');
        expect(options.saveDraft).not.toHaveBeenCalled();
        expect(options.discardChanges).not.toHaveBeenCalled();
    });

    it('discard riuscito procede una sola volta', async () => {
        const discardChanges = vi.fn();
        const { router } = renderGuard({ discardChanges });
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        await userEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/next'));
        expect(discardChanges).toHaveBeenCalledTimes(1);
    });

    it('discard fallito resta aperto e permette retry', async () => {
        const discardChanges = vi.fn()
            .mockRejectedValueOnce(new Error('discard KO'))
            .mockResolvedValueOnce(undefined);
        const { router } = renderGuard({ discardChanges });
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        await userEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        await waitFor(() => expect(screen.getByTestId('error').textContent)
            .toBe('discard KO'));
        expect(router.state.location.pathname).toBe('/');
        await userEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/next'));
        expect(discardChanges).toHaveBeenCalledTimes(2);
    });

    it('save riuscita procede una sola volta', async () => {
        const saveDraft = vi.fn().mockResolvedValue(undefined);
        const { router } = renderGuard({ saveDraft });
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/next'));
        expect(saveDraft).toHaveBeenCalledTimes(1);
    });

    it('save fallita mostra errore e permette retry', async () => {
        const saveDraft = vi.fn()
            .mockRejectedValueOnce('save KO')
            .mockResolvedValueOnce(undefined);
        const { router } = renderGuard({ saveDraft });
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(screen.getByTestId('error').textContent)
            .toBe('save KO'));
        expect(router.state.location.pathname).toBe('/');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/next'));
        expect(saveDraft).toHaveBeenCalledTimes(2);
    });

    it('ignora doppio click e azione concorrente durante Promise pending', async () => {
        const pending = deferred();
        const saveDraft = vi.fn(() => pending.promise);
        const discardChanges = vi.fn();
        const { router } = renderGuard({ saveDraft, discardChanges });
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        fireEvent.click(screen.getByRole('button', { name: 'Salva' }));
        fireEvent.click(screen.getByRole('button', { name: 'Salva' }));
        fireEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        expect(saveDraft).toHaveBeenCalledTimes(1);
        expect(discardChanges).not.toHaveBeenCalled();
        pending.resolve();
        await waitFor(() => expect(router.state.location.pathname).toBe('/next'));
    });

    it.each([
        ['submit', { isSubmitting: true }],
        ['save esterno', { isSavingDraft: true }],
    ])('disabilita le azioni durante %s', async (_label, overrides) => {
        renderGuard(overrides);
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        expect(screen.getByTestId('disabled').textContent).toBe('true');
    });

    it('blocca POP e lo autorizza dopo discard', async () => {
        const discardChanges = vi.fn();
        const router = createMemoryRouter([
            { path: '/', element: <p>Prima</p> },
            {
                path: '/current',
                element: <PopHarness discardChanges={discardChanges} />,
            },
        ], { initialEntries: ['/', '/current'], initialIndex: 1 });
        render(<RouterProvider router={router} />);
        await router.navigate(-1);
        await waitFor(() => expect(screen.getByTestId('phase').textContent)
            .toBe('blocked'));
        expect(router.state.location.pathname).toBe('/current');
        await userEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/'));
        expect(discardChanges).toHaveBeenCalledTimes(1);
    });

    it('bypass nello stesso tick passa una volta ed è consumato', async () => {
        const { router } = renderGuard();
        await userEvent.click(screen.getByRole('button', {
            name: 'Submit e vai',
        }));
        expect(router.state.location.pathname).toBe('/next');
        await router.navigate('/');
        await waitFor(() => expect(screen.getByRole('button', {
            name: 'Vai',
        })).toBeTruthy());
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        expect(router.state.location.pathname).toBe('/');
        expect(screen.getByTestId('phase').textContent).toBe('blocked');
    });

    it.each([
        ['dirty', {}, true],
        ['clean', { isDirty: false }, false],
        ['disabled', { enabled: false }, false],
    ])('beforeunload %s: preventDefault=%s', (
        _label,
        overrides,
        expected,
    ) => {
        renderGuard(overrides);
        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(expected);
    });

    it('rimuove beforeunload dopo unmount', () => {
        const view = renderGuard();
        view.unmount();
        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
    });

    it('reset chiude flusso e rimuove bypass', async () => {
        const { router } = renderGuard();
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
        expect(screen.getByTestId('phase').textContent).toBe('idle');
        expect(screen.getByTestId('open').textContent).toBe('false');
        expect(router.state.location.pathname).toBe('/');
    });

    it('save asincrona procede una sola volta sotto Strict Mode', async () => {
        const pending = deferred();
        const saveDraft = vi.fn(() => pending.promise);
        const { router } = renderGuard({ saveDraft }, true);
        let destinationCount = 0;
        const unsubscribe = router.subscribe((routerState) => {
            if (routerState.location.pathname === '/next') destinationCount += 1;
        });
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        fireEvent.click(screen.getByRole('button', { name: 'Salva' }));
        expect(saveDraft).toHaveBeenCalledTimes(1);
        pending.resolve();
        await waitFor(() => expect(router.state.location.pathname).toBe('/next'));
        expect(destinationCount).toBe(1);
        unsubscribe();
    });

    it('discard asincrono procede una sola volta sotto Strict Mode', async () => {
        const pending = deferred();
        const discardChanges = vi.fn(() => pending.promise);
        const { router } = renderGuard({ discardChanges }, true);
        let destinationCount = 0;
        const unsubscribe = router.subscribe((routerState) => {
            if (routerState.location.pathname === '/next') destinationCount += 1;
        });
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        fireEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        expect(discardChanges).toHaveBeenCalledTimes(1);
        pending.resolve();
        await waitFor(() => expect(router.state.location.pathname).toBe('/next'));
        expect(destinationCount).toBe(1);
        unsubscribe();
    });

    it('non aggiorna né naviga dopo unmount reale con save pending', async () => {
        const pending = deferred();
        const saveDraft = vi.fn(() => pending.promise);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const view = renderGuard({ saveDraft }, true);
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        fireEvent.click(screen.getByRole('button', { name: 'Salva' }));
        view.unmount();
        pending.resolve();
        await pending.promise;
        await Promise.resolve();
        expect(view.router.state.location.pathname).toBe('/');
        expect(consoleError).not.toHaveBeenCalled();
    });

    it('usa le callback save e discard più recenti dopo rerender', async () => {
        const oldSave = vi.fn().mockResolvedValue(undefined);
        const newSave = vi.fn().mockRejectedValue(new Error('nuova save'));
        const oldDiscard = vi.fn();
        const newDiscard = vi.fn().mockRejectedValue(new Error('nuovo discard'));
        const view = renderGuard({
            saveDraft: oldSave,
            discardChanges: oldDiscard,
        });
        view.rerenderOptions({
            saveDraft: newSave,
            discardChanges: newDiscard,
        });
        await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(screen.getByTestId('error').textContent)
            .toBe('nuova save'));
        await userEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        await waitFor(() => expect(screen.getByTestId('error').textContent)
            .toBe('nuovo discard'));
        expect(oldSave).not.toHaveBeenCalled();
        expect(oldDiscard).not.toHaveBeenCalled();
        expect(newSave).toHaveBeenCalledTimes(1);
        expect(newDiscard).toHaveBeenCalledTimes(1);
    });

    it.each(['save', 'discard'] as const)(
        'esce da proceeding dopo navigazione completata via %s',
        async (action) => {
            const phases: string[] = [];

            function PersistentHarness() {
                const navigate = useNavigate();
                const guard = useUnsavedChangesGuard({
                    enabled: true,
                    isDirty: true,
                    isSubmitting: false,
                    isSavingDraft: false,
                    saveDraft: async () => undefined,
                    discardChanges: () => undefined,
                });
                phases.push(guard.state.phase);
                return (
                    <>
                        <output data-testid="persistent-phase">
                            {guard.state.phase}
                        </output>
                        <button onClick={() => navigate('/next')}>Vai</button>
                        <button onClick={() => void guard.saveAndProceed()}>
                            Salva
                        </button>
                        <button onClick={() => void guard.discardAndProceed()}>
                            Abbandona
                        </button>
                        <Outlet />
                    </>
                );
            }

            const router = createMemoryRouter([{
                path: '/',
                element: <PersistentHarness />,
                children: [{ path: 'next', element: <p>Destinazione</p> }],
            }]);
            render(<RouterProvider router={router} />);
            await userEvent.click(screen.getByRole('button', { name: 'Vai' }));
            await userEvent.click(screen.getByRole('button', {
                name: action === 'save' ? 'Salva' : 'Abbandona',
            }));
            await waitFor(() => expect(router.state.location.pathname)
                .toBe('/next'));
            await waitFor(() => expect(
                screen.getByTestId('persistent-phase').textContent,
            ).toBe('idle'));
            expect(phases).toContain('proceeding');
            expect(phases.at(-1)).toBe('idle');
        },
    );
});

function PopHarness({ discardChanges }: { discardChanges: () => void }) {
    const guard = useUnsavedChangesGuard({
        enabled: true,
        isDirty: true,
        isSubmitting: false,
        isSavingDraft: false,
        saveDraft: async () => undefined,
        discardChanges,
    });
    return (
        <>
            <output data-testid="phase">{guard.state.phase}</output>
            <button onClick={() => void guard.discardAndProceed()}>
                Abbandona
            </button>
        </>
    );
}
