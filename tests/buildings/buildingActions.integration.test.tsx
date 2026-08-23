// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultPropertyValues } from '../../src/components/property-form/schema';
import { createBuildingRepository } from '../../src/db/buildingRepository';
import type { BuildingRecord, LocalDatabase, PropertyRecord } from '../../src/db/database.types';
import { BuildingsPage } from '../../src/pages/BuildingsPage';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';

const ACCOUNT_ID = 'user-9520';
const KEY = `props24.localDb.${ACCOUNT_ID}`;
const NOW = '2026-08-23T12:00:00.000Z';

class TestResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

vi.stubGlobal('ResizeObserver', TestResizeObserver);

vi.mock('../../src/auth/AuthContext', () => ({
    useAuth: () => ({
        account: {
            id: ACCOUNT_ID,
            firstName: 'Test',
            lastName: 'A5.2',
            email: 'a5.2@example.test',
            fiscalCode: 'A52TST00A00A000A',
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
            PropertyTitle: 'Unit linked',
            PropertyAddress: 'Via unit linked',
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

function renderPage(buildings: BuildingRecord[], properties: PropertyRecord[] = []) {
    const storage = new MemoryStorage({ [KEY]: JSON.stringify(database(buildings, properties)) });
    const jsdomWindow = window;
    installJsonDbWindow(storage);
    Object.defineProperty(jsdomWindow, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: jsdomWindow });
    const router = createMemoryRouter([
        { path: '/properties/buildings', element: <BuildingsPage /> },
        { path: '/properties/buildings/new', element: <div>Nuovo edificio</div> },
    ], { initialEntries: ['/properties/buildings'] });
    render(<RouterProvider router={router} />);
    return { repository: createBuildingRepository({ accountId: ACCOUNT_ID }), storage };
}

function rowAddress(record: BuildingRecord): string {
    return `${record.address}, ${record.city}`;
}

async function rowFor(record: BuildingRecord): Promise<HTMLTableRowElement> {
    const cell = await screen.findByText(rowAddress(record));
    return cell.closest('tr') as HTMLTableRowElement;
}

async function openRowAction(user: ReturnType<typeof userEvent.setup>, record: BuildingRecord, action: string) {
    const row = await rowFor(record);
    await user.click(within(row).getByRole('button', { name: `Azioni edificio ${rowAddress(record)}` }));
    await user.click(await screen.findByRole('menuitem', { name: action }));
}

async function selectRows(user: ReturnType<typeof userEvent.setup>, records: BuildingRecord[]) {
    for (const record of records) {
        await user.click(within(await rowFor(record)).getByRole('checkbox'));
    }
}

afterEach(() => {
    cleanup();
    uninstallJsonDbWindow();
});

describe('A5.2 building lifecycle actions', () => {
    it('A5.2-01 cancels and then confirms row archive through the real subscription', async () => {
        const active = building('building-active');
        const { repository } = renderPage([active]);
        const user = userEvent.setup();
        const row = await rowFor(active);

        await user.click(within(row).getByRole('button', { name: `Azioni edificio ${rowAddress(active)}` }));
        expect(await screen.findByRole('menuitem', { name: 'Archivia' })).toBeTruthy();
        expect(screen.getByRole('menuitem', { name: 'Elimina' })).toBeTruthy();
        expect(screen.queryByRole('menuitem', { name: 'Ripristina' })).toBeNull();
        await user.click(screen.getByRole('menuitem', { name: 'Archivia' }));
        expect(screen.getByRole('heading', { name: 'Archivia edificio' })).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Annulla' }));
        expect(repository.getById(active.id)?.archived).toBe(false);
        expect(await rowFor(active)).toBeTruthy();
        expect(screen.queryByRole('status')).toBeNull();

        await openRowAction(user, active, 'Archivia');
        await user.click(screen.getByRole('button', { name: 'Conferma' }));
        await waitFor(() => expect(repository.getById(active.id)?.archived).toBe(true));
        await waitFor(() => expect(screen.queryByText(rowAddress(active))).toBeNull());
        expect(screen.getByRole('status').textContent).toContain('SuccessoEdificio archiviato.');
    });

    it('A5.2-02 restores an archived row and exposes only archived lifecycle actions', async () => {
        const archived = building('building-archived', { archived: true });
        const { repository } = renderPage([archived]);
        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Archivio' }));
        const row = await rowFor(archived);

        await user.click(within(row).getByRole('button', { name: `Azioni edificio ${rowAddress(archived)}` }));
        expect(await screen.findByRole('menuitem', { name: 'Ripristina' })).toBeTruthy();
        expect(screen.getByRole('menuitem', { name: 'Elimina' })).toBeTruthy();
        expect(screen.queryByRole('menuitem', { name: 'Archivia' })).toBeNull();
        await user.click(screen.getByRole('menuitem', { name: 'Ripristina' }));
        await user.click(screen.getByRole('button', { name: 'Conferma' }));

        await waitFor(() => expect(repository.getById(archived.id)?.archived).toBe(false));
        await waitFor(() => expect(screen.queryByText(rowAddress(archived))).toBeNull());
        expect(screen.getByRole('status').textContent).toContain('Edificio ripristinato.');
    });

    it('A5.2-03 deletes a free row and reports success', async () => {
        const free = building('building-free');
        const { repository } = renderPage([free]);
        const user = userEvent.setup();

        await openRowAction(user, free, 'Elimina');
        expect(screen.getByText(/eliminazione è definitiva/i)).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Conferma' }));

        await waitFor(() => expect(repository.getById(free.id)).toBeNull());
        await waitFor(() => expect(screen.queryByText(rowAddress(free))).toBeNull());
        expect(screen.getByRole('status').textContent).toContain('Edificio eliminato.');
    });

    it('A5.2-04 keeps a blocked row delete intact and shows the real domain error', async () => {
        const linkedBuilding = building('building-linked');
        const linkedProperty = property(linkedBuilding.id);
        const { repository } = renderPage([linkedBuilding], [linkedProperty]);
        const user = userEvent.setup();

        await openRowAction(user, linkedBuilding, 'Elimina');
        await user.click(screen.getByRole('button', { name: 'Conferma' }));

        const alert = await screen.findByRole('alert');
        expect(alert.textContent).toContain(`L'edificio ${linkedBuilding.id} non può essere eliminato perché contiene unità collegate.`);
        expect(screen.queryByRole('status')).toBeNull();
        expect(repository.getById(linkedBuilding.id)).not.toBeNull();
        expect(JSON.parse(localStorage.getItem(KEY) ?? '').properties[0]).toMatchObject({
            id: linkedProperty.id, relations: { buildingId: linkedBuilding.id },
        });
        expect(screen.getByRole('heading', { name: 'Elimina edificio' })).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Annulla' }));
    });

    it('A5.2-05 preserves bulk archive selection on cancel and clears it on success', async () => {
        const records = [building('building-a'), building('building-b')];
        const { repository } = renderPage(records);
        const user = userEvent.setup();
        await selectRows(user, records);

        expect(screen.getByRole('button', { name: 'Elimina' }).parentElement?.textContent).toContain('2');
        expect(screen.getByRole('button', { name: 'Archivia' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Ripristina' })).toBeNull();
        await user.click(screen.getByRole('button', { name: 'Archivia' }));
        expect(screen.getByRole('heading', { name: 'Archivia edifici' })).toBeTruthy();
        expect(screen.getByText(/questi 2 edifici/i)).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Annulla' }));
        expect(repository.getById(records[0].id)?.archived).toBe(false);
        expect(repository.getById(records[1].id)?.archived).toBe(false);
        expect(screen.getByRole('button', { name: 'Elimina' }).parentElement?.textContent).toContain('2');

        await user.click(screen.getByRole('button', { name: 'Archivia' }));
        await user.click(screen.getByRole('button', { name: 'Conferma' }));
        await waitFor(() => expect(repository.getById(records[0].id)?.archived).toBe(true));
        expect(repository.getById(records[1].id)?.archived).toBe(true);
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Elimina' })).toBeNull());
        expect(screen.getByRole('status').textContent).toContain('2 edifici archiviati.');
    });

    it('A5.2-06 restores an archived bulk selection and clears the floating bar', async () => {
        const records = [building('building-a', { archived: true }), building('building-b', { archived: true })];
        const { repository } = renderPage(records);
        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Archivio' }));
        await selectRows(user, records);

        expect(screen.getByRole('button', { name: 'Ripristina' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Archivia' })).toBeNull();
        await user.click(screen.getByRole('button', { name: 'Ripristina' }));
        await user.click(screen.getByRole('button', { name: 'Conferma' }));

        await waitFor(() => expect(repository.getById(records[0].id)?.archived).toBe(false));
        expect(repository.getById(records[1].id)?.archived).toBe(false);
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Elimina' })).toBeNull());
        expect(screen.getByRole('status').textContent).toContain('2 edifici ripristinati.');
    });

    it('A5.2-07 deletes a free bulk selection without affecting another building', async () => {
        const records = [building('building-a'), building('building-b')];
        const untouched = building('building-c');
        const { repository } = renderPage([...records, untouched]);
        const user = userEvent.setup();
        await selectRows(user, records);

        await user.click(screen.getByRole('button', { name: 'Elimina' }));
        await user.click(screen.getByRole('button', { name: 'Conferma' }));

        await waitFor(() => expect(repository.getById(records[0].id)).toBeNull());
        expect(repository.getById(records[1].id)).toBeNull();
        expect(repository.getById(untouched.id)).not.toBeNull();
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Elimina' })).toBeNull());
        expect(screen.getByRole('status').textContent).toContain('2 edifici eliminati.');
    });

    it('A5.2-08 preserves both buildings and selection when bulk delete is blocked', async () => {
        const free = building('building-free');
        const linked = building('building-linked');
        const linkedProperty = property(linked.id);
        const { repository } = renderPage([free, linked], [linkedProperty]);
        const user = userEvent.setup();
        await selectRows(user, [free, linked]);

        await user.click(screen.getByRole('button', { name: 'Elimina' }));
        await user.click(screen.getByRole('button', { name: 'Conferma' }));

        expect((await screen.findByRole('alert')).textContent).toContain('contiene unità collegate');
        expect(screen.queryByRole('status')).toBeNull();
        expect(repository.getById(free.id)).not.toBeNull();
        expect(repository.getById(linked.id)).not.toBeNull();
        expect(JSON.parse(localStorage.getItem(KEY) ?? '').properties[0]).toMatchObject({
            id: linkedProperty.id, relations: { buildingId: linked.id },
        });
        expect(screen.getByRole('button', { name: 'Elimina' }).parentElement?.textContent).toContain('2');
        expect(screen.getByRole('heading', { name: 'Elimina edifici' })).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Annulla' }));
    });
});
