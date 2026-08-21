// @vitest-environment jsdom

import React, { StrictMode, useEffect, useRef } from 'react';
import {
    act,
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
    createMemoryRouter,
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
import { createProperty } from '../../src/db/propertyRepository';
import {
    DuplicatePropertyIdentifierError,
    DuplicatePropertyLocationError,
} from '../../src/db/databaseErrors';

let repository: DraftRepository;
const events: string[] = [];
const legacyClear = vi.fn();

vi.mock('../../src/drafts/DraftRepositoryContext', () => ({
    useDraftRepository: () => repository,
}));
vi.mock('../../src/db/propertyRepository', () => ({
    createProperty: vi.fn(() => {
        events.push('create');
        return { id: 'property-original' };
    }),
}));
vi.mock('../../src/db/jsonDb', () => ({
    clearDraft: (...args: unknown[]) => legacyClear(...args),
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

function draft(): DraftRecord<PropertyFormData> {
    return {
        id: 'draft',
        accountId: 'account',
        formType: 'property',
        mode: 'create',
        entityId: null,
        payload: {
            ...defaultPropertyValues,
            PropertyTitle: 'Unità',
            PropertyAddress: 'Via Roma',
            PropertyCity: 'Roma',
            PropertyPostalCode: '00100',
        } as PropertyFormData,
        schemaVersion: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
}

function makeRepository(value: DraftRecord<PropertyFormData> | null = null) {
    const result: DraftRepository = {
        get: vi.fn().mockResolvedValue(value),
        list: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation(async (_definition, input) => {
            events.push('save-draft');
            return {
                ...draft(),
                payload: input.payload as PropertyFormData,
            };
        }),
        delete: vi.fn().mockImplementation(async () => {
            events.push('delete');
            return true;
        }),
    };
    return result;
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function PropertyDetailMarker() {
    const recorded = useRef(false);
    useEffect(() => {
        if (!recorded.current) {
            recorded.current = true;
            events.push('navigate');
        }
    }, []);
    return <p>detail</p>;
}

function renderPage(value: DraftRecord<PropertyFormData> | null = null) {
    repository = makeRepository(value);
    const router = createMemoryRouter([
        { path: '/previous', element: <p>previous</p> },
        {
            path: '/properties/new',
            element: (
                <>
                    <Link to="/sidebar">Sidebar</Link>
                    <Link to="/logout">Logout</Link>
                    <NewProperty />
                </>
            ),
        },
        {
            path: '/properties/units/:id',
            element: <PropertyDetailMarker />,
        },
        { path: '/sidebar', element: <p>sidebar</p> },
        { path: '/logout', element: <p>logout</p> },
    ], { initialEntries: ['/previous', '/properties/new'] });
    render(
        <StrictMode>
            <RouterProvider router={router} />
        </StrictMode>,
    );
    return router;
}

async function fillAndSubmit() {
    await userEvent.type(
        await screen.findByLabelText(/Identificativo/),
        'Unità',
    );
    await userEvent.type(screen.getByLabelText('Indirizzo'), 'Via Roma');
    await userEvent.type(screen.getByLabelText(/Citt/), 'Roma');
    await userEvent.type(screen.getByLabelText(/CAP/), '00100');
    await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
}

async function fillRequiredFieldsFast(values?: {
    title?: string;
    address?: string;
    city?: string;
    postalCode?: string;
}) {
    const title = await screen.findByLabelText(/Identificativo/);
    const address = screen.getByLabelText('Indirizzo');
    const city = screen.getByLabelText(/Citt/);
    const postalCode = screen.getByLabelText(/CAP/);
    fireEvent.change(title, {
        target: { value: values?.title ?? 'Unità' },
    });
    fireEvent.change(address, {
        target: { value: values?.address ?? 'Via Roma' },
    });
    fireEvent.change(city, {
        target: { value: values?.city ?? 'Roma' },
    });
    fireEvent.change(postalCode, {
        target: { value: values?.postalCode ?? '00100' },
    });
    return {
        title: title as HTMLInputElement,
        address: address as HTMLInputElement,
        city: city as HTMLInputElement,
        postalCode: postalCode as HTMLInputElement,
    };
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.mocked(createProperty)
        .mockReset()
        .mockImplementation(() => {
            events.push('create');
            return { id: 'property-original' } as never;
        });
    events.length = 0;
});

describe('NewProperty submit recovery', () => {
    it.each([true, false])(
        'esegue create, delete %s e navigate in ordine',
        async (deleted) => {
            const router = renderPage();
            vi.mocked(repository.delete).mockImplementation(async () => {
                events.push('delete');
                return deleted;
            });
            await fillAndSubmit();
            await waitFor(() => expect(router.state.location.pathname)
                .toBe('/properties/units/property-original'));
            await waitFor(() => expect(events)
                .toEqual(['create', 'delete', 'navigate']));
            expect(createProperty).toHaveBeenCalledOnce();
            expect(repository.delete).toHaveBeenCalledOnce();
            expect(repository.save).not.toHaveBeenCalled();
            expect(legacyClear).not.toHaveBeenCalled();
        },
    );

    it('attende il completamento della delete prima di navigate', async () => {
        const pending = deferred<boolean>();
        const router = renderPage();
        vi.mocked(repository.delete).mockImplementation(() => {
            events.push('delete-start');
            return pending.promise.then((value) => {
                events.push('delete-complete');
                return value;
            });
        });
        await fillAndSubmit();
        await waitFor(() => expect(repository.delete).toHaveBeenCalledOnce());
        expect(events).toEqual(['create', 'delete-start']);
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(screen.queryByText('detail')).toBeNull();
        await act(() => {
            pending.resolve(true);
            return pending.promise;
        });
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/properties/units/property-original'));
        expect(events).toEqual([
            'create',
            'delete-start',
            'delete-complete',
            'navigate',
        ]);
    });

    it('serializza submit concorrenti durante il primo cleanup pending', async () => {
        const pending = deferred<boolean>();
        const router = renderPage();
        vi.mocked(repository.delete).mockReturnValue(pending.promise);
        await userEvent.type(
            await screen.findByLabelText(/Identificativo/),
            'Unità',
        );
        await userEvent.type(screen.getByLabelText('Indirizzo'), 'Via Roma');
        await userEvent.type(screen.getByLabelText(/Citt/), 'Roma');
        await userEvent.type(screen.getByLabelText(/CAP/), '00100');
        const submit = screen.getByRole('button', { name: 'Salva' });
        fireEvent.click(submit);
        fireEvent.click(submit);
        fireEvent.submit(document.getElementById('property-form')!);
        await waitFor(() => expect(repository.delete).toHaveBeenCalledOnce());
        expect(createProperty).toHaveBeenCalledOnce();
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(screen.queryByText(
            'Unità creata, pulizia incompleta',
        )).toBeNull();
        expect(repository.save).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();
        await act(() => {
            pending.resolve(true);
            return pending.promise;
        });
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/properties/units/property-original'));
        expect(createProperty).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledOnce();
        await waitFor(() => expect(
            events.filter((event) => event === 'navigate'),
        ).toHaveLength(1));
    });

    it('salva manualmente la bozza prima del submit definitivo', async () => {
        const router = renderPage();
        const title = await screen.findByLabelText(/Identificativo/);
        await userEvent.type(title, 'Unità');
        await userEvent.click(screen.getByRole('button', {
            name: 'Salva bozza',
        }));
        await screen.findByText('Bozza salvata.');
        await userEvent.type(screen.getByLabelText('Indirizzo'), 'Via Roma');
        await userEvent.type(screen.getByLabelText(/Citt/), 'Roma');
        await userEvent.type(screen.getByLabelText(/CAP/), '00100');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/properties/units/property-original'));
        await waitFor(() => expect(events)
            .toEqual(['save-draft', 'create', 'delete', 'navigate']));
        expect(repository.save).toHaveBeenCalledOnce();
        expect(createProperty).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledOnce();
        expect(legacyClear).not.toHaveBeenCalled();
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
    });

    it('create fallita non elimina e consente retry', async () => {
        const router = renderPage();
        vi.mocked(createProperty)
            .mockImplementationOnce(() => {
                throw new Error('Creazione fallita');
            })
            .mockReturnValueOnce({ id: 'property-original' } as never);
        await fillAndSubmit();
        expect(await screen.findByText('Creazione fallita')).toBeTruthy();
        expect(repository.delete).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/properties/units/property-original'));
        expect(createProperty).toHaveBeenCalledTimes(2);
    });

    it('identificativo duplicato mostra errore, mantiene focus e protegge la navigazione', async () => {
        const router = renderPage();
        vi.mocked(createProperty).mockImplementation(() => {
            throw new DuplicatePropertyIdentifierError('Unità', 'existing');
        });
        const fields = await fillRequiredFieldsFast();
        expect(fields.title.value).toBe('Unità');
        expect(fields.address.value).toBe('Via Roma');
        expect(fields.city.value).toBe('Roma');
        expect(fields.postalCode.value).toBe('00100');
        fireEvent.click(screen.getByRole('button', { name: 'Salva' }));
        expect((await screen.findAllByText(
            "Esiste gia un'unita con questo identificativo.",
        )).length).toBeGreaterThan(0);
        expect(document.activeElement).toBe(fields.title);
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(createProperty).toHaveBeenCalledOnce();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(repository.save).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();
        expect(screen.queryByText(
            'Unità creata, pulizia incompleta',
        )).toBeNull();
        await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
        expect(await screen.findByText('Modifiche non salvate')).toBeTruthy();
        expect(router.state.location.pathname).toBe('/properties/new');
        await userEvent.click(screen.getByRole('button', { name: 'Resta' }));
        await waitFor(() => expect(screen.queryByText(
            'Modifiche non salvate',
        )).toBeNull());
        expect(fields.title.value).toBe('Unità');
        expect(fields.address.value).toBe('Via Roma');
        expect(createProperty).toHaveBeenCalledOnce();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(screen.queryByText('detail')).toBeNull();
    });

    it('identificativo duplicato libera il submit lock e consente un nuovo submit', async () => {
        const router = renderPage();
        vi.mocked(createProperty)
            .mockImplementationOnce(() => {
                throw new DuplicatePropertyIdentifierError(
                    'Unità',
                    'existing',
                );
            })
            .mockReturnValueOnce({ id: 'property-original' } as never);
        const fields = await fillRequiredFieldsFast();
        fireEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await screen.findAllByText(
            "Esiste gia un'unita con questo identificativo.",
        );
        expect(createProperty).toHaveBeenCalledOnce();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(router.state.location.pathname).toBe('/properties/new');
        fireEvent.change(fields.title, {
            target: { value: 'Unità corretta' },
        });
        expect(fields.title.value).toBe('Unità corretta');
        fireEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/properties/units/property-original'));
        expect(createProperty).toHaveBeenCalledTimes(2);
        expect(repository.delete).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledWith({
            formType: 'property',
            mode: 'create',
            entityId: null,
        });
        expect(repository.save).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();
        expect(screen.queryByText(
            'Unità creata, pulizia incompleta',
        )).toBeNull();
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        await waitFor(() => expect(
            events.filter((event) => event === 'navigate'),
        ).toHaveLength(1));
    });

    it('localizzazione duplicata associa gli errori e focalizza Indirizzo', async () => {
        const router = renderPage();
        vi.mocked(createProperty).mockImplementationOnce(() => {
            throw new DuplicatePropertyLocationError('existing');
        });
        await fillAndSubmit();
        expect((await screen.findAllByText(
            "Immobile gia registrato. Esiste gia un'unita con lo stesso indirizzo, citta e CAP.",
        )).length).toBeGreaterThan(0);
        expect(document.activeElement).toBe(screen.getByLabelText('Indirizzo'));
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(repository.delete).not.toHaveBeenCalled();
        expect(repository.save).not.toHaveBeenCalled();
        expect(screen.queryByText(
            'Unità creata, pulizia incompleta',
        )).toBeNull();
        expect(legacyClear).not.toHaveBeenCalled();
    });

    it('cleanup fallito entra in recovery e retry non ricrea', async () => {
        const router = renderPage();
        vi.mocked(repository.delete)
            .mockRejectedValueOnce(new Error('storage'))
            .mockResolvedValueOnce(true);
        await fillAndSubmit();
        expect(await screen.findByText(
            'Unità creata, pulizia incompleta',
        )).toBeTruthy();
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(createProperty).toHaveBeenCalledOnce();
        expect(screen.queryByText('Continua comunque')).toBeNull();
        await userEvent.click(screen.getByRole('button', {
            name: 'Riprova pulizia',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/properties/units/property-original'));
        expect(createProperty).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledTimes(2);
        expect(legacyClear).not.toHaveBeenCalled();
    });

    it('cleanup pending mantiene busy, beforeunload e navigazioni protette', async () => {
        const pending = deferred<boolean>();
        const addListener = vi.spyOn(window, 'addEventListener');
        const router = renderPage();
        vi.mocked(repository.delete).mockReturnValue(pending.promise);
        await fillAndSubmit();
        await waitFor(() => expect(repository.delete).toHaveBeenCalledOnce());
        expect(router.state.location.pathname).toBe('/properties/new');
        expect((screen.getByRole('button', {
            name: 'Indietro',
            hidden: true,
        }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole('button', {
            name: 'Salva bozza',
        }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole('button', {
            name: 'Annulla',
        }) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByText('Salvataggio...')).toBeTruthy();
        const beforeUnload = addListener.mock.calls.find(
            ([type]) => type === 'beforeunload',
        )?.[1] as EventListener;
        const event = new Event('beforeunload', { cancelable: true });
        beforeUnload.call(window, event);
        expect(event.defaultPrevented).toBe(true);
        addListener.mockRestore();
        await router.navigate('/sidebar');
        await router.navigate('/logout');
        await router.navigate(-1);
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(createProperty).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledOnce();
        expect(screen.queryByText('detail')).toBeNull();
        await act(() => {
            pending.resolve(true);
            return pending.promise;
        });
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/properties/units/property-original'));
        expect(events.filter((value) => value === 'navigate')).toHaveLength(1);
    });

    it('recovery blocca navigazioni e beforeunload', async () => {
        const addListener = vi.spyOn(window, 'addEventListener');
        const router = renderPage();
        vi.mocked(repository.delete).mockRejectedValue(new Error('storage'));
        await fillAndSubmit();
        await screen.findByText('Unità creata, pulizia incompleta');
        const beforeUnload = addListener.mock.calls.find(
            ([type]) => type === 'beforeunload',
        )?.[1] as EventListener;
        const event = new Event('beforeunload', { cancelable: true });
        beforeUnload.call(window, event);
        expect(event.defaultPrevented).toBe(true);
        addListener.mockRestore();
        expect((screen.getByRole('button', {
            name: 'Indietro',
            hidden: true,
        }) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        await router.navigate('/sidebar');
        await router.navigate('/logout');
        await router.navigate(-1);
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(screen.getByText('Unità creata, pulizia incompleta')).toBeTruthy();
        expect(screen.queryByText('sidebar')).toBeNull();
        expect(screen.queryByText('logout')).toBeNull();
        expect(screen.queryByText('previous')).toBeNull();
        expect(createProperty).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledOnce();
        expect(repository.save).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();
    });

    it('retry fallito resta in recovery e il successivo riesce', async () => {
        const router = renderPage();
        vi.mocked(repository.delete)
            .mockRejectedValueOnce(new Error('first'))
            .mockRejectedValueOnce(new Error('second'))
            .mockResolvedValueOnce(true);
        await fillAndSubmit();
        await userEvent.click(await screen.findByRole('button', {
            name: 'Riprova pulizia',
        }));
        expect(await screen.findByRole('alert')).toBeTruthy();
        await userEvent.click(screen.getByRole('button', {
            name: 'Riprova pulizia',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/properties/units/property-original'));
        expect(createProperty).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledTimes(3);
    });

    it('serializza il doppio retry senza ricreare', async () => {
        const retry = deferred<boolean>();
        renderPage();
        vi.mocked(repository.delete)
            .mockRejectedValueOnce(new Error('storage'))
            .mockReturnValueOnce(retry.promise);
        await fillAndSubmit();
        const retryButton = await screen.findByRole('button', {
            name: 'Riprova pulizia',
        });
        fireEvent.click(retryButton);
        fireEvent.click(retryButton);
        fireEvent.submit(document.getElementById('property-form')!);
        expect(screen.getByRole('button', {
            name: 'Riprovo la pulizia...',
        })).toBeTruthy();
        expect(createProperty).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledTimes(2);
        await act(() => {
            retry.resolve(true);
            return retry.promise;
        });
    });

    it('bozza ripresa clean completa senza guard', async () => {
        const router = renderPage(draft());
        await userEvent.click(await screen.findByRole('button', {
            name: 'Riprendi bozza',
        }));
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/properties/units/property-original'));
        expect(createProperty).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledOnce();
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
    });

    it('ignora delete risolta dopo unmount', async () => {
        const pending = deferred<boolean>();
        const consoleError = vi.spyOn(console, 'error').mockImplementation(
            () => undefined,
        );
        const router = renderPage();
        vi.mocked(repository.delete).mockReturnValue(pending.promise);
        await fillAndSubmit();
        await waitFor(() => expect(repository.delete).toHaveBeenCalledOnce());
        cleanup();
        await act(() => {
            pending.resolve(true);
            return pending.promise;
        });
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(screen.queryByText('detail')).toBeNull();
        expect(screen.queryByText(
            'Unità creata, pulizia incompleta',
        )).toBeNull();
        expect(screen.queryByRole('form')).toBeNull();
        expect(createProperty).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledOnce();
        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
