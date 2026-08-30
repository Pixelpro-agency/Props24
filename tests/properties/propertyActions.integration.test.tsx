// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultPropertyValues } from '../../src/components/property-form/schema';
import type { LocalDatabase, PaymentRecord, PropertyRecord } from '../../src/db/database.types';
import { createJsonDbAccountScope, setActiveDatabaseAccount } from '../../src/db/jsonDb';
import { PropertiesPage } from '../../src/pages/PropertiesPage';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';

const ACCOUNT_ID = 'user-96404';
const KEY = `props24.localDb.${ACCOUNT_ID}`;
const NOW = '2026-08-26T10:00:00.000Z';

vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
vi.mock('../../src/auth/AuthContext', () => ({ useAuth: () => ({ account: { id: ACCOUNT_ID } }) }));

function unit(id: string, archived = false): PropertyRecord {
    return { id, archived, createdAt: NOW, updatedAt: NOW, formData: { ...defaultPropertyValues, PropertyTitle: `Unità ${id}`, PropertyAddress: `Via ${id}`, PropertyCity: 'Milano', PropertyPostalCode: '20100', PropertyCountry: 'IT' }, relations: { buildingId: null, tenantIds: [], leaseIds: [] }, notes: [], activities: [] };
}
function payment(id: string, propertyId: string): PaymentRecord {
    return { id, propertyId, leaseId: null, tenantId: null, type: 'expense', category: 'manual', amount: 1, dueDate: '2026-08-26', paidDate: null, status: 'pending', description: '', source: 'manual', accountingRole: 'expense', notes: '', receiptNumber: null, confirmation: null, createdAt: NOW, updatedAt: NOW };
}
function database(properties: PropertyRecord[]): LocalDatabase {
    return { meta: { schemaVersion: 4, seedVersion: 3, createdAt: NOW, updatedAt: NOW, source: 'seed' }, buildings: [], properties, tenants: [], leases: [], payments: [], contacts: [], documents: [], reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [], candidates: [], settings: {}, userProfile: {}, drafts: [] };
}
function install(databaseValue: LocalDatabase) {
    const storage = new MemoryStorage({ [KEY]: JSON.stringify(databaseValue) });
    const jsdomWindow = window;
    installJsonDbWindow(storage);
    Object.defineProperty(jsdomWindow, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: jsdomWindow });
    setActiveDatabaseAccount(ACCOUNT_ID);
    return storage;
}
function setup(records: PropertyRecord[]) {
    install(database(records));
    const router = createMemoryRouter([{ path: '/properties/units', element: <PropertiesPage /> }, { path: '/properties/units/:id/edit', element: <h1>Modifica unità</h1> }], { initialEntries: ['/properties/units'] });
    render(<RouterProvider router={router} />);
    return { router };
}
function stored(id: string) { return createJsonDbAccountScope(ACCOUNT_ID).getDatabase().properties.find((item) => item.id === id) ?? null; }
async function row(id: string) { return (await screen.findByText(`Unità ${id}`)).closest('tr') as HTMLTableRowElement; }
async function action(user: ReturnType<typeof userEvent.setup>, id: string, name: string) {
    await user.click(within(await row(id)).getByRole('button', { name: `Azioni Unità ${id}` }));
    await user.click(await screen.findByRole('menuitem', { name }));
}
afterEach(() => { cleanup(); setActiveDatabaseAccount(null); uninstallJsonDbWindow(); });

describe('B6.4 azioni lifecycle lista Unit', () => {
    it('espone Modifica, annulla e poi archivia una Unit attiva', async () => {
        const { router } = setup([unit('a')]); const user = userEvent.setup();
        await user.click(within(await row('a')).getByRole('button', { name: 'Azioni Unità a' }));
        expect(screen.getByRole('menuitem', { name: 'Modifica' })).toBeTruthy();
        expect(screen.getByRole('menuitem', { name: 'Archivia' })).toBeTruthy();
        expect(screen.queryByRole('menuitem', { name: 'Ripristina' })).toBeNull();
        await user.click(screen.getByRole('menuitem', { name: 'Modifica' }));
        expect(router.state.location.pathname).toBe('/properties/units/a/edit');
        await router.navigate('/properties/units');
        await action(user, 'a', 'Archivia'); await user.click(screen.getByRole('button', { name: 'Annulla' }));
        expect(stored('a')?.archived).toBe(false);
        await action(user, 'a', 'Archivia'); await user.click(screen.getByRole('button', { name: 'Conferma' }));
        await waitFor(() => expect(stored('a')?.archived).toBe(true));
        expect(screen.getByRole('status').textContent).toContain('Unità archiviata.');
    });
    it('ripristina una Unit archiviata', async () => {
        setup([unit('a', true)]); const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Archivio' }));
        await action(user, 'a', 'Ripristina'); await user.click(screen.getByRole('button', { name: 'Conferma' }));
        await waitFor(() => expect(stored('a')?.archived).toBe(false));
        expect(screen.getByRole('status').textContent).toContain('Unità ripristinata.');
    });
    it('usa deleteMany atomicamente e conserva selection e modal in caso di blocco', async () => {
        const records = [unit('free'), unit('blocked')];
        const db = database(records); db.payments.push(payment('payment-1', 'blocked'));
        install(db);
        const router = createMemoryRouter([{ path: '/properties/units', element: <PropertiesPage /> }], { initialEntries: ['/properties/units'] }); render(<RouterProvider router={router} />);
        const user = userEvent.setup();
        await user.click(within(await row('free')).getByRole('checkbox')); await user.click(within(await row('blocked')).getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: 'Elimina' })); await user.click(screen.getByRole('button', { name: 'Conferma' }));
        expect(await screen.findByRole('alert')).toBeTruthy(); expect(stored('free')).not.toBeNull(); expect(stored('blocked')).not.toBeNull();
        expect(screen.getByRole('heading', { name: 'Elimina unità' })).toBeTruthy(); expect(screen.getAllByRole('checkbox').filter((box) => (box as HTMLInputElement).checked).length).toBeGreaterThan(1);
    });
});
