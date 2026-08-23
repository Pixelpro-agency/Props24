// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultPropertyValues } from '../../src/components/property-form/schema';
import { createBuildingRepository } from '../../src/db/buildingRepository';
import type { BuildingRecord, LocalDatabase, PropertyRecord } from '../../src/db/database.types';
import { BuildingDeleteBlockedError, BuildingNotFoundError } from '../../src/db/databaseErrors';
import { BuildingsPage } from '../../src/pages/BuildingsPage';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';

const ACCOUNT_A = 'user-9530';
const ACCOUNT_B = 'user-9531';
const KEY_A = `props24.localDb.${ACCOUNT_A}`;
const KEY_B = `props24.localDb.${ACCOUNT_B}`;
const NOW = '2026-08-23T14:00:00.000Z';

class TestResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

vi.stubGlobal('ResizeObserver', TestResizeObserver);

vi.mock('../../src/auth/AuthContext', () => ({
    useAuth: () => ({
        account: {
            id: ACCOUNT_A,
            firstName: 'Gate',
            lastName: 'A5',
            email: 'gate-a5@example.test',
            fiscalCode: 'GATEA500A00A000A',
            password: 'test-password',
            createdAt: NOW,
        },
        isAuthenticated: true,
        isInitializing: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
    }),
}));

function building(id: string, overrides: Partial<BuildingRecord> = {}): BuildingRecord {
    return {
        id,
        createdAt: NOW,
        updatedAt: NOW,
        archived: false,
        identifier: id,
        color: '',
        address: `Via ${id}`,
        address2: '',
        city: 'Milano',
        postalCode: '20100',
        county: '',
        state: '',
        country: 'IT',
        size: null,
        constructionYear: null,
        description: '',
        privateNote: '',
        features: [],
        acquisitionDate: '',
        purchasePrice: null,
        acquisitionCosts: null,
        imu: null,
        unitsCount: 0,
        ...overrides,
    };
}

function property(buildingId: string): PropertyRecord {
    return {
        id: 'property-linked',
        createdAt: NOW,
        updatedAt: NOW,
        archived: false,
        formData: {
            ...defaultPropertyValues,
            PropertyTitle: 'Unità collegata',
            PropertyAddress: 'Via Unità 1',
            PropertyCity: 'Milano',
            PropertyPostalCode: '20100',
            PropertyCountry: 'IT',
        },
        relations: { buildingId, tenantIds: [], leaseIds: [] },
        notes: [],
        activities: [],
    };
}

function database(buildings: BuildingRecord[], properties: PropertyRecord[] = []): LocalDatabase {
    return {
        meta: { schemaVersion: 4, seedVersion: 3, createdAt: NOW, updatedAt: NOW, source: 'seed' },
        buildings,
        properties,
        tenants: [],
        leases: [],
        payments: [],
        contacts: [],
        documents: [],
        reservations: [],
        catalogs: [],
        inventory: [],
        maintenance: [],
        tasks: [],
        notes: [],
        messages: [],
        candidates: [],
        settings: {},
        userProfile: {},
        drafts: [],
    };
}

function install(databaseA: LocalDatabase, databaseB = database([])) {
    const storage = new MemoryStorage({
        [KEY_A]: JSON.stringify(databaseA),
        [KEY_B]: JSON.stringify(databaseB),
    });
    const jsdomWindow = window;
    installJsonDbWindow(storage);
    Object.defineProperty(jsdomWindow, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: jsdomWindow });
    return storage;
}

function renderPage(buildings: BuildingRecord[], properties: PropertyRecord[] = []) {
    const storage = install(database(buildings, properties));
    const router = createMemoryRouter([
        { path: '/properties/buildings', element: <BuildingsPage /> },
        { path: '/properties/buildings/new', element: <div>Nuovo edificio</div> },
    ], { initialEntries: ['/properties/buildings'] });
    render(<RouterProvider router={router} />);
    return { repository: createBuildingRepository({ accountId: ACCOUNT_A }), storage };
}

function address(record: BuildingRecord): string {
    return `${record.address}, ${record.city}`;
}

async function rowFor(record: BuildingRecord): Promise<HTMLTableRowElement> {
    return (await screen.findByText(address(record))).closest('tr') as HTMLTableRowElement;
}

async function openRowAction(user: ReturnType<typeof userEvent.setup>, record: BuildingRecord, action: string) {
    const row = await rowFor(record);
    await user.click(within(row).getByRole('button', { name: `Azioni edificio ${address(record)}` }));
    await user.click(await screen.findByRole('menuitem', { name: action }));
}

async function selectRows(user: ReturnType<typeof userEvent.setup>, records: BuildingRecord[]) {
    for (const record of records) {
        await user.click(within(await rowFor(record)).getByRole('checkbox'));
    }
}

function floatingSelectionText(): string | null | undefined {
    return screen.getByRole('button', { name: 'Elimina' }).parentElement?.textContent;
}

afterEach(() => {
    cleanup();
    uninstallJsonDbWindow();
});

describe('A5.3 consolidated building actions gate', () => {
    it('A5.3-01 consolidates single lifecycle operations and account isolation', () => {
        const recordA = building('building-a');
        const recordB = building('building-b');
        install(database([recordA]), database([recordB]));
        const repositoryA = createBuildingRepository({ accountId: ACCOUNT_A });
        const repositoryB = createBuildingRepository({ accountId: ACCOUNT_B });

        expect(repositoryA.archive(recordA.id).archived).toBe(true);
        expect(repositoryA.restore(recordA.id).archived).toBe(false);
        expect(repositoryA.delete(recordA.id)).toBe(true);
        expect(repositoryA.getById(recordA.id)).toBeNull();
        expect(repositoryB.getById(recordB.id)).toEqual(recordB);
        expect(repositoryB.getById(recordA.id)).toBeNull();
    });

    it('A5.3-02 consolidates atomic bulk archive/restore and scoped subscriptions', () => {
        const recordsA = [building('building-a'), building('building-b'), building('building-c')];
        const recordB = building('building-account-b');
        install(database(recordsA), database([recordB]));
        const repositoryA = createBuildingRepository({ accountId: ACCOUNT_A });
        const repositoryB = createBuildingRepository({ accountId: ACCOUNT_B });
        repositoryA.list();
        repositoryB.list();
        const notifyA = vi.fn();
        const notifyB = vi.fn();
        repositoryA.subscribe(notifyA);
        repositoryB.subscribe(notifyB);

        repositoryA.archiveMany(['building-a', 'building-b']);
        expect(repositoryA.getById('building-a')?.archived).toBe(true);
        expect(repositoryA.getById('building-b')?.archived).toBe(true);
        expect(repositoryA.getById('building-c')).toEqual(recordsA[2]);
        expect(notifyA).toHaveBeenCalledTimes(1);
        expect(notifyB).not.toHaveBeenCalled();
        expect(repositoryB.getById(recordB.id)).toEqual(recordB);

        repositoryA.restoreMany(['building-a', 'building-b']);
        expect(repositoryA.getById('building-a')?.archived).toBe(false);
        expect(repositoryA.getById('building-b')?.archived).toBe(false);
        expect(notifyA).toHaveBeenCalledTimes(2);
        expect(notifyB).not.toHaveBeenCalled();
    });

    it('A5.3-03 consolidates free, blocked and missing bulk delete contracts', () => {
        const untouched = building('building-untouched');
        install(database([building('free-a'), building('free-b'), untouched]));
        let repository = createBuildingRepository({ accountId: ACCOUNT_A });
        expect(repository.deleteMany(['free-a', 'free-b'])).toMatchObject({ operation: 'delete', count: 2 });
        expect(repository.getById('free-a')).toBeNull();
        expect(repository.getById('free-b')).toBeNull();
        expect(repository.getById(untouched.id)).toEqual(untouched);

        uninstallJsonDbWindow();
        const free = building('building-free');
        const linked = building('building-linked');
        const linkedProperty = property(linked.id);
        install(database([free, linked], [linkedProperty]));
        repository = createBuildingRepository({ accountId: ACCOUNT_A });
        expect(() => repository.deleteMany([free.id, linked.id])).toThrow(BuildingDeleteBlockedError);
        expect(repository.getById(free.id)).not.toBeNull();
        expect(repository.getById(linked.id)).not.toBeNull();
        expect(JSON.parse(localStorage.getItem(KEY_A) ?? '').properties[0]).toMatchObject({
            id: linkedProperty.id, relations: { buildingId: linked.id },
        });
        expect(() => repository.deleteMany([linked.id, 'building-missing'])).toThrow(BuildingNotFoundError);
        expect(repository.getById(linked.id)).not.toBeNull();
    });

    it('A5.3-04 crosses row actions, modal, cancel, subscription and success toast', async () => {
        const record = building('building-row');
        const { repository } = renderPage([record]);
        const user = userEvent.setup();

        await openRowAction(user, record, 'Archivia');
        expect(screen.getByRole('heading', { name: 'Archivia edificio' })).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Annulla' }));
        expect(repository.getById(record.id)?.archived).toBe(false);
        expect(await rowFor(record)).toBeTruthy();
        expect(screen.queryByRole('status')).toBeNull();

        await openRowAction(user, record, 'Archivia');
        await user.click(screen.getByRole('button', { name: 'Conferma' }));
        await waitFor(() => expect(repository.getById(record.id)?.archived).toBe(true));
        await waitFor(() => expect(screen.queryByText(address(record))).toBeNull());
        expect(screen.getByRole('status').textContent).toContain('Edificio archiviato.');

        await user.click(screen.getByRole('button', { name: 'Archivio' }));
        expect(await rowFor(record)).toBeTruthy();
        await openRowAction(user, record, 'Ripristina');
        await user.click(screen.getByRole('button', { name: 'Conferma' }));
        await waitFor(() => expect(repository.getById(record.id)?.archived).toBe(false));
        await waitFor(() => expect(screen.queryByText(address(record))).toBeNull());
        expect(screen.getByRole('status').textContent).toContain('Edificio ripristinato.');
    });

    it('A5.3-05 crosses floating bulk archive/restore with selection semantics', async () => {
        const records = [building('building-a'), building('building-b')];
        const { repository } = renderPage(records);
        const user = userEvent.setup();
        await selectRows(user, records);

        expect(floatingSelectionText()).toContain('Azioni2');
        expect(screen.getByRole('button', { name: 'Archivia' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Ripristina' })).toBeNull();
        await user.click(screen.getByRole('button', { name: 'Archivia' }));
        await user.click(screen.getByRole('button', { name: 'Annulla' }));
        expect(repository.getById(records[0].id)?.archived).toBe(false);
        expect(repository.getById(records[1].id)?.archived).toBe(false);
        expect(floatingSelectionText()).toContain('Azioni2');
        expect(screen.queryByRole('status')).toBeNull();

        await user.click(screen.getByRole('button', { name: 'Archivia' }));
        await user.click(screen.getByRole('button', { name: 'Conferma' }));
        await waitFor(() => expect(repository.getById(records[0].id)?.archived).toBe(true));
        expect(repository.getById(records[1].id)?.archived).toBe(true);
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Elimina' })).toBeNull());

        await user.click(screen.getByRole('button', { name: 'Archivio' }));
        await selectRows(user, records);
        expect(screen.getByRole('button', { name: 'Ripristina' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Archivia' })).toBeNull();
        await user.click(screen.getByRole('button', { name: 'Ripristina' }));
        await user.click(screen.getByRole('button', { name: 'Conferma' }));
        await waitFor(() => expect(repository.getById(records[0].id)?.archived).toBe(false));
        expect(repository.getById(records[1].id)?.archived).toBe(false);
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Elimina' })).toBeNull());
    });

    it('A5.3-06 proves blocked bulk delete is atomic before a free bulk delete succeeds', async () => {
        const free = building('building-free');
        const linked = building('building-linked');
        const linkedProperty = property(linked.id);
        let state = renderPage([free, linked], [linkedProperty]);
        let user = userEvent.setup();
        await selectRows(user, [free, linked]);
        await user.click(screen.getByRole('button', { name: 'Elimina' }));
        await user.click(screen.getByRole('button', { name: 'Conferma' }));

        expect((await screen.findByRole('alert')).textContent).toContain('contiene unità collegate');
        expect(screen.queryByRole('status')).toBeNull();
        expect(state.repository.getById(free.id)).not.toBeNull();
        expect(state.repository.getById(linked.id)).not.toBeNull();
        expect(JSON.parse(localStorage.getItem(KEY_A) ?? '').properties[0]).toMatchObject({
            id: linkedProperty.id, relations: { buildingId: linked.id },
        });
        expect(floatingSelectionText()).toContain('Azioni2');
        expect(screen.getByRole('heading', { name: 'Elimina edifici' })).toBeTruthy();

        cleanup();
        uninstallJsonDbWindow();
        const freeRecords = [building('free-a'), building('free-b')];
        const untouched = building('untouched');
        state = renderPage([...freeRecords, untouched]);
        user = userEvent.setup();
        await selectRows(user, freeRecords);
        await user.click(screen.getByRole('button', { name: 'Elimina' }));
        await user.click(screen.getByRole('button', { name: 'Conferma' }));

        await waitFor(() => expect(state.repository.getById(freeRecords[0].id)).toBeNull());
        expect(state.repository.getById(freeRecords[1].id)).toBeNull();
        expect(state.repository.getById(untouched.id)).not.toBeNull();
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Elimina' })).toBeNull());
        expect(screen.getByRole('status').textContent).toContain('2 edifici eliminati.');
    });
});
