// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LocalDatabase, TenantRecord } from '../../src/db/database.types';
import { setActiveDatabaseAccount } from '../../src/db/jsonDb';
import { TenantsPage } from '../../src/pages/TenantsPage';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';

const ACCOUNT = 'user-95601';
const NOW = '2026-09-03T10:00:00.000Z';
vi.mock('../../src/auth/AuthContext', () => ({ useAuth: () => ({ account: { id: ACCOUNT }, isInitializing: false }) }));
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });

function tenant(id: string, firstName: string): TenantRecord {
    return {
        id, createdAt: NOW, updatedAt: NOW, type: 'person', photo: null,
        avatarColor: '#123456', title: '', firstName, middleName: '', lastName: 'Tenant',
        birthDate: '', birthPlace: '', nationality: 'IT', fiscalCode: `CF-${id}`,
        vatNumberPersonal: '', profession: '', monthlyIncome: null, idType: '', idNumber: '',
        idExpiry: '', identityDocumentFile: null, identityDocumentBackFile: null,
        companyName: '', companyFiscalCode: '', vatNumber: '', siret: '', capital: '',
        companyDescription: '', companyRegistryFile: null, email: `${id}@test.it`,
        emailSecondary: '', mobilePhone: '', phone: '', address1: '', address2: '', city: '',
        zip: '', state: '', country: 'IT', proEmployer: '', proAddress: '', proCity: '',
        proZip: '', proState: '', proCountry: '', proPhone: '', bankName: '', bankAddress: '',
        bankCity: '', bankZip: '', bankCountry: '', bankIBAN: '', bankSwiftBic: '',
        leaveAddress: '', notes: '', status: 'attivo', archived: false, leaseIds: [],
        guarantors: [], emergencyContacts: [], documents: [],
        invitation: { status: 'not_sent', email: `${id}@test.it`, sentAt: null, acceptedAt: null },
    };
}

function install() {
    const database: LocalDatabase = {
        meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' },
        properties: [], buildings: [], tenants: [tenant('z', 'Zeta'), tenant('a', 'Alfa')],
        leases: [], payments: [], contacts: [], documents: [], reservations: [], catalogs: [],
        inventory: [], maintenance: [], tasks: [], notes: [], messages: [], candidates: [],
        settings: {}, userProfile: {}, drafts: [],
    };
    const storage = new MemoryStorage({ [`props24.localDb.${ACCOUNT}`]: JSON.stringify(database) });
    const jsdomWindow = window;
    installJsonDbWindow(storage);
    Object.defineProperty(jsdomWindow, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: jsdomWindow });
    setActiveDatabaseAccount(ACCOUNT);
}

function mount() {
    const router = createMemoryRouter([
        { path: '/tenants', element: <TenantsPage /> },
        { path: '/tenants/new', element: <h1>Nuovo reale</h1> },
    ], { initialEntries: ['/tenants'] });
    render(<RouterProvider router={router} />);
    return router;
}

afterEach(() => {
    cleanup();
    setActiveDatabaseAccount(null);
    uninstallJsonDbWindow();
    vi.clearAllMocks();
});

describe('C6.1 controlli Tenant simulati', () => {
    it('disabilita Importa ma preserva Nuovo inquilino', async () => {
        install();
        const router = mount();
        await userEvent.click(await screen.findByText('Nuovo inquilino'));
        const imported = screen.getByRole('button', { name: 'Importa' });
        expect((imported as HTMLButtonElement).disabled).toBe(true);
        expect(imported.getAttribute('aria-disabled')).toBe('true');
        await userEvent.click(imported);
        expect(router.state.location.pathname).toBe('/tenants');
        await userEvent.click(screen.getByRole('button', { name: 'Nuovo inquilino' }));
        expect(router.state.location.pathname).toBe('/tenants/new');
    });

    it('disabilita Export e Messaggio bulk, preservando lifecycle e pending singole', async () => {
        install();
        mount();
        const exportButton = await screen.findByRole('button', { name: 'Esporta' });
        expect((exportButton as HTMLButtonElement).disabled).toBe(true);
        expect(exportButton.getAttribute('title')).toBe('Funzione non ancora implementata');
        await userEvent.click(exportButton);
        expect(screen.queryByRole('dialog')).toBeNull();
        const row = (await screen.findByText('Alfa Tenant')).closest('tr')!;
        await userEvent.click(within(row).getByRole('checkbox'));
        const message = screen.getByRole('button', { name: 'Messaggio' });
        expect((message as HTMLButtonElement).disabled).toBe(true);
        await userEvent.click(message);
        expect((screen.getByRole('button', { name: 'Elimina' }) as HTMLButtonElement).disabled).toBe(false);
        expect((screen.getByRole('button', { name: 'Archivia' }) as HTMLButtonElement).disabled).toBe(false);
        await userEvent.click(within(row).getByRole('button', { name: /Azioni/ }));
        for (const name of ['Invia un messaggio', 'Crea un affitto', 'Appuntamento', 'Saldo locatario', 'Finanze']) {
            expect(screen.getByRole('menuitem', { name }).getAttribute('aria-disabled')).toBe('true');
        }
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('rimuove Ordina fake, mantiene sorting header e invito locale', async () => {
        install();
        mount();
        expect(screen.queryByTitle('Ordina')).toBeNull();
        const header = await screen.findByRole('columnheader', { name: 'Inquilino' });
        await userEvent.click(header);
        const names = screen.getAllByRole('row').slice(1).map((row) => row.textContent ?? '');
        expect(names[0]).toContain('Alfa Tenant');
        const alfa = (await screen.findByText('Alfa Tenant')).closest('tr')!;
        await userEvent.click(within(alfa).getByRole('button', { name: 'INVITA' }));
        expect(within(alfa).getByText('IN ATTESA')).toBeTruthy();
    });
});
