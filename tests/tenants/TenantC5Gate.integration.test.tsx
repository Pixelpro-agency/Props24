// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultPropertyValues } from '../../src/components/property-form/schema';
import { DraftRepositoryProvider } from '../../src/drafts/DraftRepositoryContext';
import type { LocalDatabase, PaymentRecord, TenantRecord } from '../../src/db/database.types';
import { assertDatabaseIntegrity } from '../../src/db/databaseValidation';
import { createJsonDbAccountScope, setActiveDatabaseAccount } from '../../src/db/jsonDb';
import { EditTenantPage } from '../../src/pages/EditTenantPage';
import { TenantDetailPage } from '../../src/pages/TenantDetailPage';
import { TenantsPage } from '../../src/pages/TenantsPage';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';

const ACCOUNT_A = 'user-95501';
const ACCOUNT_B = 'user-95502';
const NOW = '2026-09-03T10:00:00.000Z';
const authState = vi.hoisted(() => ({ account: { id: 'user-95501' } as { id: string } | null }));
vi.mock('../../src/auth/AuthContext', () => ({ useAuth: () => ({ account: authState.account, isInitializing: false }) }));
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });

const localFile = (id: string) => ({ id, name: `${id}.pdf`, type: 'application/pdf', size: 1, lastModified: 1, dataUrl: 'data:application/pdf;base64,WA==' });

function tenant(overrides: Partial<TenantRecord> = {}): TenantRecord {
    return {
        id: 'tenant-shared', createdAt: NOW, updatedAt: NOW, type: 'person', photo: localFile('photo-id'), avatarColor: '#123456',
        title: 'Mr', firstName: 'Ada', middleName: 'M', lastName: 'Lovelace', birthDate: '1815-12-10', birthPlace: 'London',
        nationality: 'GB', fiscalCode: 'PERSON-CF', vatNumberPersonal: 'PERSON-VAT', profession: 'Math', monthlyIncome: 1000,
        idType: 'passport', idNumber: 'DOC-1', idExpiry: '2030-01-01', identityDocumentFile: localFile('front-id'),
        identityDocumentBackFile: localFile('back-id'), companyName: '', companyFiscalCode: '', vatNumber: '', siret: '', capital: '',
        companyDescription: '', companyRegistryFile: null, email: 'ada@example.test', emailSecondary: '', mobilePhone: '333', phone: '',
        address1: 'Via Roma 1', address2: '', city: 'Roma', zip: '00100', state: 'RM', country: 'IT', proEmployer: '', proAddress: '',
        proCity: '', proZip: '', proState: '', proCountry: '', proPhone: '', bankName: 'Bank', bankAddress: '', bankCity: '',
        bankZip: '', bankCountry: 'IT', bankIBAN: 'IT00TEST', bankSwiftBic: 'TEST', leaveAddress: '', notes: 'Notes', status: 'attivo',
        archived: false, leaseIds: [], guarantors: [{ id: 'guarantor-relation-id', contactType: 'person', firstName: 'Grace' }],
        emergencyContacts: [{ id: 'emergency-relation-id', contactType: 'person', firstName: 'Mary', isPrimary: true }],
        documents: [{ id: 'document-parent-id', fileName: 'doc.pdf', categoryId: 1, categoryLabel: 'Doc', uploadDate: NOW, fileSize: 1, isShared: false, fileUrl: '', file: localFile('document-file-id') }],
        invitation: { status: 'accepted', email: 'ada@example.test', sentAt: NOW, acceptedAt: NOW }, legacy: { marker: 'legacy-preserved' },
        ...overrides,
    };
}

function database(tenants: TenantRecord[] = [], payments: PaymentRecord[] = []): LocalDatabase {
    return {
        meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' },
        properties: payments.length ? [{ id: 'property-payment', createdAt: NOW, updatedAt: NOW, archived: false, formData: { ...defaultPropertyValues, PropertyTitle: 'Unità payment', PropertyAddress: 'Via Test', PropertyCity: 'Roma', PropertyPostalCode: '00100', PropertyCountry: 'IT' }, relations: { buildingId: null, tenantIds: tenants.map((item) => item.id), leaseIds: [] }, notes: [], activities: [] }] : [],
        buildings: [], tenants, leases: [], payments, contacts: [], documents: [], reservations: [], catalogs: [], inventory: [],
        maintenance: [], tasks: [], notes: [], messages: [], candidates: [], settings: {}, userProfile: {}, drafts: [],
    };
}

function payment(tenantId: string): PaymentRecord {
    return { id: 'payment-history', propertyId: 'property-payment', leaseId: null, tenantId, type: 'rent', category: 'manual', amount: 100, dueDate: '2025-01-01', paidDate: null, status: 'overdue', description: 'Storico', source: 'manual', accountingRole: 'income', notes: '', receiptNumber: null, confirmation: null, createdAt: NOW, updatedAt: NOW };
}

let storage: MemoryStorage;
function install(dbA: LocalDatabase, dbB = database()) {
    storage = new MemoryStorage({ [`props24.localDb.${ACCOUNT_A}`]: JSON.stringify(dbA), [`props24.localDb.${ACCOUNT_B}`]: JSON.stringify(dbB) });
    const jsdomWindow = window;
    installJsonDbWindow(storage);
    Object.defineProperty(jsdomWindow, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: jsdomWindow });
    setActiveDatabaseAccount(ACCOUNT_A);
}

function mount(entry: string) {
    const router = createMemoryRouter([
        { path: '/tenants', element: <TenantsPage /> },
        { path: '/tenants/:id/edit', element: <EditTenantPage /> },
        { path: '/tenants/:id', element: <TenantDetailPage /> },
    ], { initialEntries: [entry] });
    const view = render(<DraftRepositoryProvider accountId={ACCOUNT_A}><RouterProvider router={router} /></DraftRepositoryProvider>);
    return { router, ...view };
}

const dbA = () => createJsonDbAccountScope(ACCOUNT_A).getDatabase();
const stored = (id = 'tenant-shared') => dbA().tenants.find((item) => item.id === id)!;
async function detailAction(name: 'Archivia' | 'Ripristina' | 'Elimina') {
    await userEvent.click(await screen.findByRole('button', { name: 'Azioni' }));
    await userEvent.click(screen.getByRole('button', { name }));
}
async function confirm(name: string) { await userEvent.click(screen.getByRole('button', { name })); }
const nestedIds = (record: TenantRecord) => [record.guarantors[0].id, record.emergencyContacts[0].id, record.photo?.id, record.identityDocumentFile?.id, record.identityDocumentBackFile?.id, record.documents[0].id, record.documents[0].file?.id];

afterEach(() => {
    cleanup();
    setActiveDatabaseAccount(null);
    uninstallJsonDbWindow();
    authState.account = { id: ACCOUNT_A };
    vi.clearAllMocks();
});

describe('C5.5 gate consolidato Tenant', () => {
    it('Gate 1 person edit dalla lista attraversa detail archive remount restore preservando authority', async () => {
        const originalA = tenant();
        const originalB = tenant({ firstName: 'Account B', fiscalCode: 'B-CF', email: 'b@example.test' });
        install(database([originalA]), database([originalB]));
        const bBefore = storage.getItem(`props24.localDb.${ACCOUNT_B}`);
        const first = mount('/tenants');

        const row = (await screen.findByText('Ada M Lovelace')).closest('tr')!;
        await userEvent.click(within(row).getByRole('button', { name: /Azioni/ }));
        await userEvent.click(screen.getByRole('menuitem', { name: 'Modifica' }));
        expect(first.router.state.location.pathname).toBe('/tenants/tenant-shared/edit');
        expect(await screen.findByRole('heading', { name: 'Modifica inquilino' })).toBeTruthy();

        const name = screen.getByLabelText(/^Nome/);
        await userEvent.clear(name); await userEvent.type(name, 'Augusta');
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await waitFor(() => expect(first.router.state.location.pathname).toBe('/tenants/tenant-shared'));
        expect(first.router.state.historyAction).toBe('REPLACE');
        const updated = stored();
        expect(updated).toMatchObject({ id: originalA.id, createdAt: originalA.createdAt, firstName: 'Augusta', status: originalA.status, archived: false });
        expect(updated.leaseIds).toEqual(originalA.leaseIds);
        expect(updated.invitation).toEqual(originalA.invitation);
        expect(updated.legacy).toEqual(originalA.legacy);
        expect(nestedIds(updated)).toEqual(nestedIds(originalA));
        expect(storage.getItem(`props24.localDb.${ACCOUNT_B}`)).toBe(bBefore);

        await detailAction('Archivia'); await confirm('Archivia inquilino');
        await waitFor(() => expect(stored().archived).toBe(true));
        expect(first.router.state.location.pathname).toBe('/tenants/tenant-shared');
        expect(await screen.findByText('Archiviato')).toBeTruthy();

        first.unmount();
        const second = mount('/tenants/tenant-shared');
        expect(await screen.findByText('Augusta Lovelace')).toBeTruthy();
        expect(screen.getByText('Archiviato')).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: 'Azioni' }));
        expect(screen.getByRole('button', { name: 'Ripristina' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Archivia' })).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Ripristina' }));
        await confirm('Ripristina inquilino');
        await waitFor(() => expect(stored().archived).toBe(false));
        expect(screen.queryByText('Archiviato')).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Azioni' }));
        expect(screen.getByRole('button', { name: 'Archivia' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Ripristina' })).toBeNull();
        expect(second.router.state.location.pathname).toBe('/tenants/tenant-shared');
        expect(storage.getItem(`props24.localDb.${ACCOUNT_B}`)).toBe(bBefore);
        expect(() => assertDatabaseIntegrity(dbA())).not.toThrow();
    }, 20_000);

    it('Gate 2 company edit reale preserva identità fiscale separata nested IDs e account B', async () => {
        const company = tenant({ id: 'company-shared', type: 'company', firstName: 'Mario', lastName: 'Rossi', fiscalCode: 'REPRESENTATIVE-CF', companyName: 'Acme iniziale', companyFiscalCode: 'ENTITY-CF', vatNumber: 'ENTITY-VAT', vatNumberPersonal: 'REP-VAT', companyRegistryFile: localFile('registry-id') });
        const foreign = tenant({ id: 'company-shared', type: 'company', firstName: 'Foreign', fiscalCode: 'FOREIGN-REP', companyName: 'Foreign company', companyFiscalCode: 'FOREIGN-ENTITY', vatNumber: 'FOREIGN-VAT', companyRegistryFile: localFile('foreign-registry') });
        install(database([company]), database([foreign]));
        const bBefore = storage.getItem(`props24.localDb.${ACCOUNT_B}`);
        const { router } = mount('/tenants/company-shared/edit');

        expect(await screen.findByRole('heading', { name: 'Modifica inquilino' })).toBeTruthy();
        expect((screen.getByLabelText('Tipo di locatario') as HTMLSelectElement).value).toBe('company');
        expect((screen.getByLabelText('Codice fiscale ente') as HTMLInputElement).value).toBe('ENTITY-CF');
        expect((screen.getAllByLabelText('P.IVA')[0] as HTMLInputElement).value).toBe('ENTITY-VAT');
        expect((screen.getByLabelText('Codice fiscale') as HTMLInputElement).value).toBe('REPRESENTATIVE-CF');
        const companyName = screen.getByLabelText(/^Societ/);
        await userEvent.clear(companyName); await userEvent.type(companyName, 'Acme aggiornata');
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/tenants/company-shared'));
        expect(router.state.historyAction).toBe('REPLACE');
        const after = stored('company-shared');
        expect(after).toMatchObject({ id: company.id, createdAt: company.createdAt, type: 'company', companyName: 'Acme aggiornata', companyFiscalCode: 'ENTITY-CF', vatNumber: 'ENTITY-VAT', fiscalCode: 'REPRESENTATIVE-CF', archived: company.archived });
        expect(after.companyFiscalCode).not.toBe(after.fiscalCode);
        expect(after.vatNumber).not.toBe(after.vatNumberPersonal);
        expect(after.companyRegistryFile?.id).toBe('registry-id');
        expect(nestedIds(after)).toEqual(nestedIds(company));
        expect(after.invitation).toEqual(company.invitation);
        expect(after.legacy).toEqual(company.legacy);
        expect(storage.getItem(`props24.localDb.${ACCOUNT_B}`)).toBe(bBefore);
    }, 15_000);

    it('Gate 3 update reale preserva Payment e delete bloccata lascia DB route e modal invariati', async () => {
        const target = tenant({ id: 'tenant-payment', firstName: 'Prima' });
        const historicalPayment = payment(target.id);
        install(database([target], [historicalPayment]));
        const paymentBefore = structuredClone(dbA().payments[0]);
        const { router } = mount('/tenants/tenant-payment/edit');
        expect(dbA().payments[0].tenantId).toBe(target.id);
        const name = await screen.findByLabelText(/^Nome/);
        await userEvent.clear(name); await userEvent.type(name, 'Dopo');
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/tenants/tenant-payment'));
        expect(stored('tenant-payment').firstName).toBe('Dopo');
        expect(dbA().payments[0]).toEqual(paymentBefore);
        expect(dbA().payments[0].tenantId).toBe(target.id);
        const snapshot = structuredClone(dbA());

        await detailAction('Elimina'); await confirm('Elimina inquilino');
        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(stored('tenant-payment')).toEqual(snapshot.tenants[0]);
        expect(dbA().payments[0]).toEqual(snapshot.payments[0]);
        expect(dbA().properties[0]).toEqual(snapshot.properties[0]);
        expect(router.state.location.pathname).toBe('/tenants/tenant-payment');
        expect(screen.getByRole('dialog')).toBeTruthy();
        expect(screen.queryByText('Operazione completata')).toBeNull();
    }, 15_000);
});
