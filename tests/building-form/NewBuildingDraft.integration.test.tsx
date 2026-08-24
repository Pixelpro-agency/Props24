// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DraftRepository } from '../../src/db/draftRepository.port';
import type { BuildingRecord } from '../../src/db/database.types';
import { defaultBuildingValues, type BuildingFormData } from '../../src/components/building-form/schema';
import { NewBuildingPage } from '../../src/pages/NewBuildingPage';
import { LogoutPage } from '../../src/auth/LogoutPage';

let draftRepository: DraftRepository;
let createBuilding: ReturnType<typeof vi.fn>;
let logout: ReturnType<typeof vi.fn>;

vi.mock('../../src/auth/AuthContext', () => ({
    useAuth: () => ({ account: { id: 'account-building-draft' }, logout }),
}));
vi.mock('../../src/drafts/DraftRepositoryContext', () => ({
    useDraftRepository: () => draftRepository,
}));
vi.mock('../../src/db/buildingRepository', () => ({
    createBuildingRepository: () => ({ create: createBuilding }),
}));

function draftRepo(payload: BuildingFormData | null = null): DraftRepository {
    return {
        get: vi.fn().mockResolvedValue(payload ? {
            id: 'draft-1', accountId: 'account-building-draft', formType: 'building',
            mode: 'create', entityId: null, payload, schemaVersion: 1,
            createdAt: '2026-08-24T00:00:00.000Z', updatedAt: '2026-08-24T00:00:00.000Z',
        } : null),
        list: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation(async (_definition, input) => ({
            id: 'draft-1', accountId: 'account-building-draft', formType: 'building',
            mode: 'create', entityId: null, payload: input.payload, schemaVersion: 1,
            createdAt: '2026-08-24T00:00:00.000Z', updatedAt: '2026-08-24T00:00:00.000Z',
        })),
        delete: vi.fn().mockResolvedValue(true),
    };
}
function building(): BuildingRecord {
    return { id: 'building-created', createdAt: '', updatedAt: '', archived: false, ...defaultBuildingValues, unitsCount: 0 };
}
function mount(initialEntries = ['/properties/buildings/new'], initialIndex?: number) {
    const router = createMemoryRouter([
        {
            path: '/properties/buildings/new',
            element: <><Link to="/logout">Logout</Link><NewBuildingPage /></>,
        },
        { path: '/properties/buildings/:id', element: <h1>Dettaglio edificio</h1> },
        { path: '/properties/buildings', element: <h1>Lista edifici</h1> },
        { path: '/other', element: <h1>Altra pagina</h1> },
        { path: '/logout', element: <LogoutPage /> },
        { path: '/dashboard', element: <h1>Dashboard</h1> },
    ], { initialEntries, initialIndex });
    render(<RouterProvider router={router} />);
    return router;
}
function fillRequired() {
    fireEvent.change(document.getElementById('identifier')!, { target: { value: 'QA Building' } });
    fireEvent.change(document.getElementById('address')!, { target: { value: 'Via QA 1' } });
    fireEvent.change(document.getElementById('city')!, { target: { value: 'Roma' } });
    fireEvent.change(document.getElementById('postalCode')!, { target: { value: '00100' } });
}

beforeEach(() => {
    draftRepository = draftRepo();
    createBuilding = vi.fn().mockReturnValue(building());
    logout = vi.fn();
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Nuovo edificio draft, guard e recovery', () => {
    it.each(['Indietro', 'Annulla'])(
        'navigazione clean con %s non apre il guard e usa il fallback',
        async (control) => {
            const router = mount();
            await screen.findByRole('button', { name: 'Salva bozza' });
            await userEvent.click(screen.getByRole('button', { name: control }));
            await waitFor(() => expect(router.state.location.pathname)
                .toBe('/properties/buildings'));
            expect(screen.queryByRole('heading', { name: 'Modifiche non salvate' }))
                .toBeNull();
        },
    );

    it('non autosalva digitando o cambiando tab e salva manualmente payload incompleto', async () => {
        mount();
        await screen.findByRole('button', { name: 'Salva bozza' });
        fireEvent.change(document.getElementById('identifier')!, { target: { value: 'Solo identificativo' } });
        await userEvent.click(screen.getByRole('tab', { name: 'Unità' }));
        expect(draftRepository.save).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await screen.findByText('Bozza salvata.');
        expect(draftRepository.save).toHaveBeenCalledOnce();
        expect(vi.mocked(draftRepository.save).mock.calls[0][1]).toMatchObject({
            mode: 'create', payload: { identifier: 'Solo identificativo', address: '', city: '', postalCode: '' },
        });
        expect(createBuilding).not.toHaveBeenCalled();
    });

    it('presenta scelta esplicita e riprende clean senza write', async () => {
        draftRepository = draftRepo({ ...defaultBuildingValues, identifier: 'Ripresa' });
        mount();
        await screen.findByRole('heading', { name: 'Bozza edificio disponibile' });
        expect(document.getElementById('identifier')).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Riprendi bozza' }));
        expect((document.getElementById('identifier') as HTMLInputElement).value).toBe('Ripresa');
        expect(draftRepository.save).not.toHaveBeenCalled();
        expect(draftRepository.delete).not.toHaveBeenCalled();
    });

    it('blocca la route dirty, Resta conserva i valori e Salva bozza prosegue verso la destinazione', async () => {
        const router = mount();
        await screen.findByRole('button', { name: 'Salva bozza' });
        await userEvent.type(document.getElementById('identifier')!, 'Dirty');
        await waitFor(() => expect((document.getElementById('identifier') as HTMLInputElement).value).toBe('Dirty'));
        void router.navigate('/other');
        await screen.findByRole('heading', { name: 'Modifiche non salvate' });
        await userEvent.click(screen.getByRole('button', { name: 'Resta' }));
        expect(router.state.location.pathname).toBe('/properties/buildings/new');
        expect((document.getElementById('identifier') as HTMLInputElement).value).toBe('Dirty');
        void router.navigate('/other');
        await screen.findByRole('heading', { name: 'Modifiche non salvate' });
        await userEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/other'));
        expect(draftRepository.save).toHaveBeenCalledOnce();
    });

    it('Indietro dirty + Resta preserva route e valori senza write', async () => {
        const router = mount();
        await screen.findByRole('button', { name: 'Salva bozza' });
        await userEvent.type(document.getElementById('identifier')!, 'Dirty header');
        await userEvent.click(screen.getByRole('button', { name: 'Indietro' }));
        await screen.findByRole('heading', { name: 'Modifiche non salvate' });
        await userEvent.click(screen.getByRole('button', { name: 'Resta' }));
        expect(router.state.location.pathname).toBe('/properties/buildings/new');
        expect((document.getElementById('identifier') as HTMLInputElement).value)
            .toBe('Dirty header');
        expect(draftRepository.save).not.toHaveBeenCalled();
        expect(draftRepository.delete).not.toHaveBeenCalled();
    });

    it('Annulla dirty + Abbandona ripristina la baseline persistita senza write e prosegue', async () => {
        draftRepository = draftRepo({ ...defaultBuildingValues, identifier: 'Baseline A' });
        const router = mount();
        await screen.findByRole('heading', { name: 'Bozza edificio disponibile' });
        await userEvent.click(screen.getByRole('button', { name: 'Riprendi bozza' }));
        const identifier = document.getElementById('identifier') as HTMLInputElement;
        fireEvent.change(identifier, { target: { value: 'Modifica B' } });
        await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
        await userEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/properties/buildings'));
        expect(draftRepository.save).not.toHaveBeenCalled();
        expect(draftRepository.delete).not.toHaveBeenCalled();
    });

    it('intercetta browser back dirty prima della scelta', async () => {
        const router = mount(
            ['/other', '/properties/buildings/new'],
            1,
        );
        await screen.findByRole('button', { name: 'Salva bozza' });
        await userEvent.type(document.getElementById('identifier')!, 'Dirty back');
        void router.navigate(-1);
        await screen.findByRole('heading', { name: 'Modifiche non salvate' });
        expect(router.state.location.pathname).toBe('/properties/buildings/new');
        expect(draftRepository.save).not.toHaveBeenCalled();
        expect(draftRepository.delete).not.toHaveBeenCalled();
    });

    it('fa attraversare al logout reale il guard Building dirty', async () => {
        const router = mount();
        await screen.findByRole('button', { name: 'Salva bozza' });
        await userEvent.type(document.getElementById('identifier')!, 'Dirty logout');
        await userEvent.click(screen.getByRole('link', { name: 'Logout' }));
        await screen.findByRole('heading', { name: 'Modifiche non salvate' });
        expect(router.state.location.pathname).toBe('/properties/buildings/new');
        expect(logout).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Abbandona' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'));
        expect(logout).toHaveBeenCalledOnce();
    });

    it('attiva beforeunload solo dirty, lo disattiva al save e lo riattiva a una nuova modifica', async () => {
        const addListener = vi.spyOn(window, 'addEventListener');
        mount();
        await screen.findByRole('button', { name: 'Salva bozza' });
        const listener = addListener.mock.calls.find(
            ([type]) => type === 'beforeunload',
        )?.[1] as EventListener;
        const beforeUnload = () => {
            const event = new Event('beforeunload', { cancelable: true });
            listener.call(window, event);
            return event.defaultPrevented;
        };
        expect(beforeUnload()).toBe(false);
        await userEvent.type(document.getElementById('identifier')!, 'Dirty unload');
        expect(beforeUnload()).toBe(true);
        await userEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await screen.findByText('Bozza salvata.');
        expect(beforeUnload()).toBe(false);
        await userEvent.type(document.getElementById('identifier')!, ' B');
        expect(beforeUnload()).toBe(true);
        addListener.mockRestore();
    });

    it('save-and-proceed fallita conserva destinazione e valori, poi retry prosegue una volta', async () => {
        vi.mocked(draftRepository.save).mockRejectedValueOnce(new Error('storage non disponibile'));
        const router = mount();
        await screen.findByRole('button', { name: 'Salva bozza' });
        await userEvent.type(document.getElementById('identifier')!, 'Valore retry');
        void router.navigate('/other');
        await screen.findByRole('heading', { name: 'Modifiche non salvate' });
        await userEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await screen.findByRole('alert');
        expect(router.state.location.pathname).toBe('/properties/buildings/new');
        expect((document.getElementById('identifier') as HTMLInputElement).value)
            .toBe('Valore retry');
        expect(createBuilding).not.toHaveBeenCalled();
        expect(draftRepository.delete).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/other'));
        expect(draftRepository.save).toHaveBeenCalledTimes(2);
        expect(createBuilding).not.toHaveBeenCalled();
        expect(draftRepository.delete).not.toHaveBeenCalled();
    });

    it('Annulla dalla scelta bozza esce preservandola senza write', async () => {
        draftRepository = draftRepo({ ...defaultBuildingValues, identifier: 'Bozza A' });
        const router = mount();
        const heading = await screen.findByRole('heading', { name: 'Bozza edificio disponibile' });
        await userEvent.click(within(heading.closest('[role="dialog"]') as HTMLElement)
            .getByRole('button', { name: 'Annulla' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/properties/buildings'));
        expect(draftRepository.save).not.toHaveBeenCalled();
        expect(draftRepository.delete).not.toHaveBeenCalled();
    });

    it('Esci dopo load error non esegue write', async () => {
        vi.mocked(draftRepository.get).mockRejectedValueOnce(new Error('load failure'));
        const router = mount();
        await screen.findByRole('heading', { name: 'Impossibile aprire la bozza' });
        await userEvent.click(screen.getByRole('button', { name: 'Esci' }));
        await waitFor(() => expect(router.state.location.pathname)
            .toBe('/properties/buildings'));
        expect(draftRepository.save).not.toHaveBeenCalled();
        expect(draftRepository.delete).not.toHaveBeenCalled();
    });

    it('esegue create-delete-navigate e recupera cleanup senza seconda create', async () => {
        createBuilding.mockImplementation(() => building());
        vi.mocked(draftRepository.delete).mockRejectedValueOnce(new Error('storage')).mockResolvedValueOnce(true);
        const router = mount();
        await screen.findByRole('button', { name: 'Salva' });
        fillRequired();
        await userEvent.dblClick(screen.getByRole('button', { name: 'Salva' }));
        await screen.findByRole('heading', { name: 'Edificio creato, pulizia incompleta' });
        expect(createBuilding).toHaveBeenCalledOnce();
        expect(router.state.location.pathname).toBe('/properties/buildings/new');
        await userEvent.click(screen.getByRole('button', { name: 'Riprova pulizia' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/buildings/building-created'));
        expect(createBuilding).toHaveBeenCalledOnce();
        expect(draftRepository.delete).toHaveBeenCalledTimes(2);
        expect(createBuilding.mock.invocationCallOrder[0])
            .toBeLessThan(vi.mocked(draftRepository.delete).mock.invocationCallOrder[0]);
    });
});
