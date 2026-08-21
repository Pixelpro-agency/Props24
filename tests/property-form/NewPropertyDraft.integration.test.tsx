// @vitest-environment jsdom

import React, { StrictMode } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    createMemoryRouter,
    RouterProvider,
    useLocation,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    DraftStorageError,
    DraftStorageQuotaError,
} from '../../src/db/databaseErrors';
import type {
    DraftRecord,
    DraftRepository,
} from '../../src/db/draftRepository.port';
import type { PropertyFormData } from '../../src/components/property-form/schema';
import { defaultPropertyValues } from '../../src/components/property-form/schema';
import { PROPERTY_TABS } from '../../src/components/property-form/PropertyFormTabs';
import { NewProperty } from '../../src/pages/NewProperty';

let repository: DraftRepository;
const legacyGet = vi.fn();
const legacySet = vi.fn();
const legacyClear = vi.fn();
const createProperty = vi.fn();

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

vi.mock('../../src/drafts/DraftRepositoryContext', () => ({
    useDraftRepository: () => repository,
}));
vi.mock('../../src/db/jsonDb', () => ({
    getDraft: (...args: unknown[]) => legacyGet(...args),
    setDraft: (...args: unknown[]) => legacySet(...args),
    clearDraft: (...args: unknown[]) => legacyClear(...args),
}));
vi.mock('../../src/db/propertyRepository', () => ({
    createProperty: (...args: unknown[]) => createProperty(...args),
}));
vi.mock('../../src/auth/AuthContext', () => ({
    useAuth: () => ({ account: { id: 'user-001' } }),
}));
vi.mock('../../src/db/buildingRepository', () => ({
    createBuildingRepository: () => ({ list: () => [] }),
}));
vi.mock('../../src/components/property-form/ui/AddressAutocomplete', () => ({
    AddressAutocomplete: () => null,
}));

function draftRecord(
    payload: Partial<PropertyFormData>,
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
            draftRecord(input.payload as PropertyFormData)
        )),
        delete: vi.fn().mockResolvedValue(true),
    };
}

function RouteProbe() {
    return <output data-testid="route">{useLocation().pathname}</output>;
}

function renderPage(strict = false) {
    const router = createMemoryRouter([
        { path: '/origin', element: <RouteProbe /> },
        { path: '/properties/new', element: <NewProperty /> },
        { path: '/properties/units/:id', element: <RouteProbe /> },
    ], {
        initialEntries: ['/origin', '/properties/new'],
        initialIndex: 1,
    });
    render(strict
        ? <StrictMode><RouterProvider router={router} /></StrictMode>
        : <RouterProvider router={router} />);
    return router;
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('NewProperty draft integration', () => {
    it('non autosalva durante edit e mostra Salva bozza manuale', async () => {
        repository = makeRepository();
        renderPage();
        const user = userEvent.setup();
        const title = await screen.findByLabelText(/Identificativo/);
        await user.type(title, 'U-1');
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        await user.click(screen.getByRole('button', {
            name: 'Informazioni aggiuntive',
        }));
        expect(repository.save).not.toHaveBeenCalled();
        expect(legacySet).not.toHaveBeenCalled();
        expect(createProperty).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Salva bozza' }))
            .toBeTruthy();
    });

    it('usa valori unici per tutte le opzioni Paese', async () => {
        repository = makeRepository();
        renderPage();
        const country = await screen.findByLabelText(
            'Paese',
        ) as HTMLSelectElement;
        const options = Array.from(country.options)
            .filter((option) => option.value !== '');
        const values = options.map((option) => option.value);
        const ioOptions = options.filter((option) => option.value === 'IO');

        expect(values).toHaveLength(new Set(values).size);
        expect(ioOptions).toHaveLength(1);
        expect(ioOptions[0]?.textContent)
            .toBe('Territorio Britannico dell’Oceano Indiano');
        expect(options.map((option) => option.textContent))
            .not.toContain('British Antarctic Territory');
    });

    it('una bozza esistente richiede scelta senza restore automatico', async () => {
        repository = makeRepository(draftRecord({ PropertyTitle: 'Persistita' }));
        renderPage();
        expect(await screen.findByText('Bozza unità disponibile')).toBeTruthy();
        expect(screen.getByLabelText('Indietro'))
            .toHaveProperty('disabled', true);
        expect(screen.queryByLabelText(/Identificativo/)).toBeNull();
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(legacyGet).not.toHaveBeenCalled();
    });

    it('carica una sola volta sotto Strict Mode e parte vuoto', async () => {
        repository = makeRepository();
        renderPage(true);
        expect((await screen.findByLabelText(
            /Identificativo/,
        ) as HTMLInputElement).value).toBe('');
        await waitFor(() => expect(repository.get).toHaveBeenCalledOnce());
        expect(legacyGet).not.toHaveBeenCalled();
        expect(legacySet).not.toHaveBeenCalled();
    });

    it('mostra loading finché il repository risolve', async () => {
        const pending = deferred<DraftRecord<PropertyFormData> | null>();
        repository = makeRepository();
        vi.mocked(repository.get).mockReturnValue(pending.promise);
        renderPage();
        expect(screen.getByRole('status').textContent)
            .toContain('Caricamento bozza...');
        expect(screen.queryByLabelText(/Identificativo/)).toBeNull();
        expect(screen.getByLabelText('Indietro'))
            .toHaveProperty('disabled', true);
        expect(screen.queryByRole('button', {
            name: 'Salva bozza',
        })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Annulla' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Salva' })).toBeNull();
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
        pending.resolve(null);
        expect(await screen.findByLabelText(/Identificativo/)).toBeTruthy();
        await waitFor(() => expect(screen.getByLabelText('Indietro'))
            .toHaveProperty('disabled', false));
        expect(screen.getByRole('button', { name: 'Salva bozza' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Annulla' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Salva' })).toBeTruthy();
    });

    it('riprende la bozza clean senza I/O o navigazione', async () => {
        repository = makeRepository(draftRecord({
            PropertyTitle: 'Persistita',
            PropertyPhotos: [{
                id: 'photo-1',
                name: 'foto.png',
                type: 'image/png',
                size: 12,
                lastModified: 1,
                dataUrl: 'data:image/png;base64,AA==',
            }],
        }));
        const router = renderPage();
        await userEvent.click(await screen.findByRole('button', {
            name: 'Riprendi bozza',
        }));
        expect((await screen.findByLabelText(
            /Identificativo/,
        ) as HTMLInputElement).value).toBe('Persistita');
        await waitFor(() => expect(screen.getByRole('button', {
            name: 'Indietro',
        })).toHaveProperty('disabled', false));
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();
        expect(router.state.location.pathname).toBe('/properties/new');
    });

    it('Annulla dalla scelta esce senza modificare la bozza', async () => {
        repository = makeRepository(draftRecord({ PropertyTitle: 'Persistita' }));
        const router = renderPage();
        await userEvent.click(await screen.findByRole('button', {
            name: 'Annulla',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/origin'));
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('elimina e ricomincia con chiave canonica e form vuoto', async () => {
        repository = makeRepository(draftRecord({ PropertyTitle: 'Persistita' }));
        const router = renderPage();
        await userEvent.click(await screen.findByRole('button', {
            name: 'Elimina e ricomincia',
        }));
        expect((await screen.findByLabelText(
            /Identificativo/,
        ) as HTMLInputElement).value).toBe('');
        expect(repository.delete).toHaveBeenCalledWith({
            formType: 'property',
            mode: 'create',
            entityId: null,
        });
        expect(repository.delete).toHaveBeenCalledOnce();
        expect(repository.save).not.toHaveBeenCalled();
        expect(createProperty).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();
        expect(router.state.location.pathname).toBe('/properties/new');
    });

    it('delete fallita resta in scelta e il retry riesce', async () => {
        repository = makeRepository(draftRecord({ PropertyTitle: 'Persistita' }));
        vi.mocked(repository.delete)
            .mockRejectedValueOnce(new DraftStorageError())
            .mockResolvedValueOnce(true);
        renderPage();
        await userEvent.click(await screen.findByRole('button', {
            name: 'Elimina e ricomincia',
        }));
        expect(await screen.findByRole('alert')).toHaveProperty(
            'textContent',
            'Impossibile eliminare la bozza. Riprova.',
        );
        expect(screen.queryByLabelText(/Identificativo/)).toBeNull();
        await userEvent.click(screen.getByRole('button', {
            name: 'Elimina e ricomincia',
        }));
        expect(await screen.findByLabelText(/Identificativo/)).toBeTruthy();
        expect(repository.delete).toHaveBeenCalledTimes(2);
    });

    it('load error consente retry senza write', async () => {
        repository = makeRepository();
        vi.mocked(repository.get)
            .mockRejectedValueOnce(new DraftStorageError())
            .mockResolvedValueOnce(null);
        renderPage();
        expect(await screen.findByText(
            'Impossibile aprire la bozza',
        )).toBeTruthy();
        expect(screen.getByLabelText('Indietro'))
            .toHaveProperty('disabled', true);
        expect(screen.queryByLabelText(/Identificativo/)).toBeNull();
        expect(screen.getByRole('alert').textContent)
            .toContain('database locale');
        await userEvent.click(screen.getByRole('button', { name: 'Riprova' }));
        expect(await screen.findByLabelText(/Identificativo/)).toBeTruthy();
        await waitFor(() => expect(screen.getByLabelText('Indietro'))
            .toHaveProperty('disabled', false));
        expect(repository.get).toHaveBeenCalledTimes(2);
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('load error consente Esci senza write', async () => {
        repository = makeRepository();
        vi.mocked(repository.get).mockRejectedValue(new DraftStorageError());
        const router = renderPage();
        await userEvent.click(await screen.findByRole('button', {
            name: 'Esci',
        }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/origin'));
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('salva manualmente payload incompleto senza create o navigazione', async () => {
        repository = makeRepository();
        const router = renderPage();
        const user = userEvent.setup();
        await user.type(await screen.findByLabelText(/Identificativo/), 'U-1');
        await user.click(screen.getByRole('button', { name: 'Salva bozza' }));
        expect(await screen.findByText('Bozza salvata.')).toBeTruthy();
        expect(repository.save).toHaveBeenCalledOnce();
        expect(vi.mocked(repository.save).mock.calls[0]?.[1]).toMatchObject({
            mode: 'create',
            payload: {
                PropertyTitle: 'U-1',
                PropertyAddress: '',
                PropertyCity: '',
                PropertyPostalCode: '',
            },
        });
        expect(createProperty).not.toHaveBeenCalled();
        expect(legacyGet).not.toHaveBeenCalled();
        expect(legacySet).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();
        expect(router.state.location.pathname).toBe('/properties/new');
    });

    it('sostituisce errore quota con successo al retry dalla UI', async () => {
        repository = makeRepository();
        vi.mocked(repository.save)
            .mockRejectedValueOnce(new DraftStorageQuotaError())
            .mockImplementationOnce(async (_definition, input) => (
                draftRecord(input.payload as PropertyFormData)
            ));
        const router = renderPage();
        const user = userEvent.setup();
        const title = await screen.findByLabelText(
            /Identificativo/,
        ) as HTMLInputElement;
        await user.type(title, 'Retry quota');

        await user.click(screen.getByRole('button', { name: 'Salva bozza' }));
        expect((await screen.findByRole('alert')).textContent)
            .toContain('Spazio locale esaurito');
        expect(title.value).toBe('Retry quota');
        expect(repository.save).toHaveBeenCalledOnce();
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(createProperty).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();

        await user.click(screen.getByRole('button', { name: 'Salva bozza' }));
        expect(await screen.findByText('Bozza salvata.')).toBeTruthy();
        expect(repository.save).toHaveBeenCalledTimes(2);
        expect(screen.queryByText('Errore bozza')).toBeNull();
        expect(screen.queryByText(/Spazio locale esaurito/)).toBeNull();
        expect(screen.getAllByText('Bozza salvata.')).toHaveLength(1);
        expect(title.value).toBe('Retry quota');
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(createProperty).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();
    });

    it('salva una sola volta dalla UI sotto Strict Mode', async () => {
        repository = makeRepository();
        const consoleError = vi.spyOn(console, 'error')
            .mockImplementation(() => undefined);
        const router = renderPage(true);
        const user = userEvent.setup();
        await user.type(
            await screen.findByLabelText(/Identificativo/),
            'Strict save',
        );
        expect(repository.save).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Salva bozza' }));
        expect(await screen.findByText('Bozza salvata.')).toBeTruthy();

        expect(repository.get).toHaveBeenCalledOnce();
        expect(repository.save).toHaveBeenCalledOnce();
        expect(screen.getAllByText('Bozza salvata.')).toHaveLength(1);
        expect(legacyGet).not.toHaveBeenCalled();
        expect(legacySet).not.toHaveBeenCalled();
        expect(legacyClear).not.toHaveBeenCalled();
        expect(createProperty).not.toHaveBeenCalled();
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(consoleError).not.toHaveBeenCalled();
    });

    it('rende accessibili e azionabili tutte le nove schede senza autosave', async () => {
        repository = makeRepository();
        const router = renderPage();
        const user = userEvent.setup();
        await screen.findByLabelText(/Identificativo/);

        for (const tab of PROPERTY_TABS) {
            const control = screen.getByRole('button', { name: tab.label });
            expect(control).toBeTruthy();
            await user.click(control);
            expect(screen.getByRole('button', { name: 'Salva bozza' }))
                .toBeTruthy();
        }

        expect(repository.save).not.toHaveBeenCalled();
        expect(legacySet).not.toHaveBeenCalled();
        expect(createProperty).not.toHaveBeenCalled();
        expect(router.state.location.pathname).toBe('/properties/new');
    });

    it('propaga il busy durante delete dal dialog fino all’header', async () => {
        const pending = deferred<boolean>();
        repository = makeRepository(draftRecord({ PropertyTitle: 'Persistita' }));
        vi.mocked(repository.delete).mockReturnValue(pending.promise);
        const router = renderPage();

        await userEvent.click(await screen.findByRole('button', {
            name: 'Elimina e ricomincia',
        }));
        expect(repository.delete).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledWith({
            formType: 'property',
            mode: 'create',
            entityId: null,
        });
        for (const name of [
            'Annulla',
            'Riprendi bozza',
            'Eliminazione in corso...',
        ]) {
            expect(screen.getByRole('button', { name }))
                .toHaveProperty('disabled', true);
        }
        expect(screen.getByLabelText('Indietro'))
            .toHaveProperty('disabled', true);
        expect(screen.queryByLabelText(/Identificativo/)).toBeNull();

        pending.resolve(true);
        expect((await screen.findByLabelText(
            /Identificativo/,
        ) as HTMLInputElement).value).toBe('');
        expect(screen.queryByRole('dialog')).toBeNull();
        await waitFor(() => expect(screen.getByLabelText('Indietro'))
            .toHaveProperty('disabled', false));
        expect(repository.save).not.toHaveBeenCalled();
        expect(createProperty).not.toHaveBeenCalled();
        expect(router.state.location.pathname).toBe('/properties/new');
    });

    it('serializza doppio click, mostra busy e un solo feedback', async () => {
        const pending = deferred<DraftRecord<PropertyFormData>>();
        repository = makeRepository();
        vi.mocked(repository.save).mockReturnValue(pending.promise);
        const router = renderPage();
        const save = await screen.findByRole('button', {
            name: 'Salva bozza',
        });
        act(() => {
            save.click();
            save.click();
        });
        expect(repository.save).toHaveBeenCalledOnce();
        expect(screen.getByRole('button', {
            name: 'Salvataggio bozza...',
        })).toHaveProperty('disabled', true);
        expect(screen.getByRole('button', {
            name: 'Annulla',
        })).toHaveProperty('disabled', true);
        expect(screen.getByRole('button', {
            name: 'Salva',
        })).toHaveProperty('disabled', true);
        expect(screen.getByRole('button', {
            name: 'Indietro',
        })).toHaveProperty('disabled', true);
        expect(router.state.location.pathname).toBe('/properties/new');
        pending.resolve(draftRecord({ PropertyTitle: '' }));
        expect(await screen.findByText('Bozza salvata.')).toBeTruthy();
        expect(screen.getAllByText('Bozza salvata.')).toHaveLength(1);
        await waitFor(() => {
            expect(screen.getByRole('button', {
                name: 'Salva bozza',
            })).toHaveProperty('disabled', false);
            expect(screen.getByRole('button', {
                name: 'Annulla',
            })).toHaveProperty('disabled', false);
            expect(screen.getByRole('button', {
                name: 'Salva',
            })).toHaveProperty('disabled', false);
            expect(screen.getByRole('button', {
                name: 'Indietro',
            })).toHaveProperty('disabled', false);
        });
        expect(createProperty).not.toHaveBeenCalled();
    });

    it.each([
        [
            new DraftStorageQuotaError(),
            'Spazio locale esaurito',
        ],
        [
            new DraftStorageError(new Error('grezzo tecnico')),
            'Impossibile salvare la bozza nel database locale.',
        ],
    ])('mostra errore user-safe e conserva il valore', async (
        error,
        message,
    ) => {
        repository = makeRepository();
        vi.mocked(repository.save).mockRejectedValue(error);
        const router = renderPage();
        const user = userEvent.setup();
        const title = await screen.findByLabelText(
            /Identificativo/,
        ) as HTMLInputElement;
        await user.type(title, 'Conservato');
        await user.click(screen.getByRole('button', { name: 'Salva bozza' }));
        expect((await screen.findByRole('alert')).textContent)
            .toContain(message);
        expect(title.value).toBe('Conservato');
        expect(screen.queryByText('Bozza salvata.')).toBeNull();
        expect(router.state.location.pathname).toBe('/properties/new');
        expect(createProperty).not.toHaveBeenCalled();
    });

    it('chiude il toast senza alterare il form', async () => {
        repository = makeRepository();
        renderPage();
        const user = userEvent.setup();
        const title = await screen.findByLabelText(
            /Identificativo/,
        ) as HTMLInputElement;
        await user.type(title, 'Conservato');
        await user.click(screen.getByRole('button', { name: 'Salva bozza' }));
        expect(await screen.findByText('Bozza salvata.')).toBeTruthy();
        await user.click(screen.getByRole('button', {
            name: 'Chiudi notifica',
        }));
        expect(screen.queryByText('Bozza salvata.')).toBeNull();
        expect(title.value).toBe('Conservato');
    });

    it('ignora il completamento load dopo unmount', async () => {
        const pending = deferred<DraftRecord<PropertyFormData> | null>();
        repository = makeRepository();
        vi.mocked(repository.get).mockReturnValue(pending.promise);
        const consoleError = vi.spyOn(console, 'error')
            .mockImplementation(() => undefined);
        const router = renderPage();
        await router.navigate('/origin');
        pending.resolve(null);
        await act(async () => pending.promise);
        expect(screen.queryByLabelText(/Identificativo/)).toBeNull();
        expect(repository.save).not.toHaveBeenCalled();
        expect(consoleError.mock.calls.flat().join(' '))
            .not.toMatch(/unmounted|state update/i);
    });
});
