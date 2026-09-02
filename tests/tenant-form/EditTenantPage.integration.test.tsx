// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import { createMemoryRouter, matchRoutes, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditTenantPage } from '../../src/pages/EditTenantPage';
import { createAppRoutes } from '../../src/router';
import { TenantEditFormProvider } from '../../src/components/tenant-form/TenantFormProvider';
import { tenantRecordToFormData } from '../../src/components/tenant-form/tenantRecordFormMapping';
import type { TenantFormData } from '../../src/components/tenant-form/schema';
import type { LocalDatabase, TenantRecord } from '../../src/db/database.types';
import { DuplicateTenantFiscalIdentityError, TenantNotFoundError } from '../../src/db/databaseErrors';
import { setActiveDatabaseAccount } from '../../src/db/jsonDb';
import { MemoryStorage } from '../db/jsonDbStorageHarness';

const authState = vi.hoisted(() => ({ account: { id: 'user-001' } }));
vi.mock('../../src/auth/AuthContext', () => ({
    useAuth: () => ({ account: authState.account, isInitializing: false }),
}));

const NOW = '2026-09-02T10:00:00.000Z';
const ACCOUNT_A = 'user-001';
const ACCOUNT_B = 'user-002';
const KEY_A = `props24.localDb.${ACCOUNT_A}`;
const KEY_B = `props24.localDb.${ACCOUNT_B}`;
const originalLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');

afterEach(() => {
    cleanup();
    setActiveDatabaseAccount(null);
    if (originalLocalStorage) Object.defineProperty(window, 'localStorage', originalLocalStorage);
});
const file = (id: string) => ({ id, name: `${id}.pdf`, type: 'application/pdf', size: 1, lastModified: 1, dataUrl: 'data:application/pdf;base64,WA==' });
const record = (overrides: Partial<TenantRecord> = {}): TenantRecord => ({
    id: 'tenant-a', createdAt: NOW, updatedAt: NOW, type: 'person', photo: file('photo'), avatarColor: '#123456',
    title: 'Mr', firstName: 'Ada', middleName: 'M', lastName: 'Lovelace', birthDate: '1815-12-10', birthPlace: 'London',
    nationality: 'GB', fiscalCode: 'PERSON-CF', vatNumberPersonal: 'PERSON-VAT', profession: 'Math', monthlyIncome: 1000,
    idType: 'passport', idNumber: 'DOC-1', idExpiry: '2030-01-01', identityDocumentFile: file('front'),
    identityDocumentBackFile: file('back'), companyName: '', companyFiscalCode: '', vatNumber: '', siret: '', capital: '',
    companyDescription: '', companyRegistryFile: null, email: 'ada@example.test', emailSecondary: '', mobilePhone: '333', phone: '',
    address1: 'Via Roma 1', address2: '', city: 'Roma', zip: '00100', state: 'RM', country: 'IT', proEmployer: '',
    proAddress: '', proCity: '', proZip: '', proState: '', proCountry: '', proPhone: '', bankName: 'Bank', bankAddress: '',
    bankCity: '', bankZip: '', bankCountry: 'IT', bankIBAN: 'IT00TEST', bankSwiftBic: 'TEST', leaveAddress: '', notes: 'Notes',
    status: 'attivo', archived: true, leaseIds: [],
    guarantors: [{ id: 'guarantor-id', contactId: 'contact-a', contactType: 'person', firstName: 'Grace' }],
    emergencyContacts: [{ id: 'emergency-id', contactId: 'contact-a', contactType: 'person', firstName: 'Grace', isPrimary: true }],
    documents: [{ id: 'document-id', fileName: 'doc.pdf', categoryId: 1, categoryLabel: 'Doc', uploadDate: NOW, fileSize: 1, isShared: false, fileUrl: '', file: file('document-file') }],
    invitation: { status: 'accepted', email: 'ada@example.test', sentAt: NOW, acceptedAt: NOW }, legacy: { marker: true },
    ...overrides,
});

const database = (tenants: TenantRecord[] = []): LocalDatabase => ({
    meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' },
    properties: [], buildings: [], tenants, leases: [], payments: [], contacts: [], documents: [], reservations: [],
    catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [], candidates: [], settings: {},
    userProfile: {}, drafts: [],
});

function installStorage(dbA: LocalDatabase, dbB = database()) {
    const storage = new MemoryStorage({ [KEY_A]: JSON.stringify(dbA), [KEY_B]: JSON.stringify(dbB) });
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
    setActiveDatabaseAccount(null);
    setActiveDatabaseAccount(ACCOUNT_A);
    storage.resetOperationLogs();
    return storage;
}

function renderPage(id: string) {
    const router = createMemoryRouter([
        { path: '/tenants/:id/edit', element: <EditTenantPage /> },
        { path: '/tenants/:id', element: <p>Dettaglio inquilino</p> },
        { path: '/tenants', element: <p>Lista inquilini</p> },
    ], { initialEntries: [`/tenants/${id}/edit`] });
    const result = render(<RouterProvider router={router} />);
    return { router, ...result };
}

function Fields() {
    const { register, formState: { errors } } = useFormContext<TenantFormData>();
    return <>
        <input aria-label="Nome" {...register('TenantFirstName')} />
        <input aria-label="CF persona" {...register('TenantFiscalCode')} />
        <input aria-label="CF ente" {...register('TenantCompanyFiscalCode')} />
        <input aria-label="PIVA" {...register('TenantVatNumber')} />
        <span data-testid="person-error">{errors.TenantFiscalCode?.message}</span>
        <span data-testid="company-error">{errors.TenantCompanyFiscalCode?.message}</span>
        <span data-testid="vat-error">{errors.TenantVatNumber?.message}</span>
        <button type="submit">Salva modifiche</button>
    </>;
}

function Harness({ initial, update, error }: { initial: TenantFormData; update: (data: TenantFormData) => unknown; error: (value: string) => void }) {
    return <TenantEditFormProvider initialState={initial} activeTab="info2" setActiveTab={vi.fn()} onUpdateTenant={update} onTenantUpdated={vi.fn()} onSubmitError={error}><Fields /></TenantEditFormProvider>;
}

describe('Edit Tenant form C5.2', () => {
    it('riconosce le route applicative edit e dettaglio senza assorbimento', () => {
        expect(matchRoutes(createAppRoutes(), '/tenants/tenant-a/edit')?.at(-1)?.route.path).toBe('/tenants/:id/edit');
        expect(matchRoutes(createAppRoutes(), '/tenants/tenant-a')?.at(-1)?.route.path).toBe('/tenants/:id');
    });

    it('mapping puro clona tutti gli ID annidati e separa CF ente dal rappresentante', () => {
        const source = record({ type: 'company', fiscalCode: 'REP-CF', companyFiscalCode: 'ENTITY-CF', vatNumber: 'ENTITY-VAT', companyName: 'Acme', companyRegistryFile: file('registry') });
        const original = structuredClone(source);
        const mapped = tenantRecordToFormData(source);
        expect(mapped).toMatchObject({ TenantType: 'company', TenantFiscalCode: 'REP-CF', TenantCompanyFiscalCode: 'ENTITY-CF', TenantVatNumber: 'ENTITY-VAT', TenantFirstName: 'Ada', TenantEmail: 'ada@example.test', TenantAddress1: 'Via Roma 1', TenantProfession: 'Math', TenantRevenus: 1000, TenantIDNumber: 'DOC-1', TenantBankIBAN: 'IT00TEST', TenantNotes: 'Notes' });
        expect([mapped.TenantGuarantors[0].id, mapped.TenantEmergencyContacts[0].id, mapped.TenantPhoto?.id, mapped.TenantIDCard?.id, mapped.TenantIDCardBack?.id, mapped.TenantCompanyRegistryFile?.id, mapped.TenantDocuments[0].id, mapped.TenantDocuments[0].file?.id]).toEqual(['guarantor-id', 'emergency-id', 'photo', 'front', 'back', 'registry', 'document-id', 'document-file']);
        mapped.TenantGuarantors[0].firstName = 'Changed';
        expect(source).toEqual(original);
        expect(mapped).not.toHaveProperty('legacy');
    });

    it('hydrate resta stabile e submit usa update senza draft', async () => {
        const user = userEvent.setup();
        const update = vi.fn();
        render(<Harness initial={tenantRecordToFormData(record())} update={update} error={vi.fn()} />);
        expect(screen.queryByText('Salva bozza')).toBeNull();
        const name = screen.getByLabelText(/^Nome/);
        expect((name as HTMLInputElement).value).toBe('Ada');
        await user.clear(name); await user.type(name, 'Augusta');
        await user.click(screen.getByText('Salva modifiche'));
        await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({ TenantFirstName: 'Augusta' })));
        expect((name as HTMLInputElement).value).toBe('Augusta');
    });

    it.each([
        ['person', 'fiscalCode', 'person-error'],
        ['company', 'fiscalCode', 'company-error'],
        ['company', 'vatNumber', 'vat-error'],
    ] as const)('mappa duplicate %s %s sul campo corretto', async (type, field, target) => {
        const user = userEvent.setup();
        const error = vi.fn();
        const initial = tenantRecordToFormData(record({ type, companyName: type === 'company' ? 'Acme' : '' }));
        render(<Harness initial={initial} update={() => { throw new DuplicateTenantFiscalIdentityError(field, 'other'); }} error={error} />);
        await user.click(screen.getByText('Salva modifiche'));
        expect((await screen.findByTestId(target)).textContent).toMatch(/stess/);
        expect(error).toHaveBeenCalled();
    });

    it('Tenant scomparso mostra messaggio e preserva il form', async () => {
        const user = userEvent.setup(); const error = vi.fn();
        render(<Harness initial={tenantRecordToFormData(record())} update={() => { throw new TenantNotFoundError('tenant-a'); }} error={error} />);
        const name = screen.getByLabelText('Nome'); await user.clear(name); await user.type(name, 'Locale');
        await user.click(screen.getByText('Salva modifiche'));
        await waitFor(() => expect(error).toHaveBeenCalledWith('Inquilino non più disponibile.'));
        expect((name as HTMLInputElement).value).toBe('Locale');
    });

    it('missing iniziale isola account A da un Tenant presente soltanto in B senza write', async () => {
        const foreign = record({ id: 'tenant-b' });
        const storage = installStorage(database(), database([foreign]));
        renderPage(foreign.id);
        expect((await screen.findByRole('alert')).textContent).toContain('Inquilino non trovato.');
        expect(screen.getByRole('link', { name: 'Torna agli inquilini' }).getAttribute('href')).toBe('/tenants');
        expect(document.getElementById('tenant-form')).toBeNull();
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(storage.writesFor(KEY_B)).toHaveLength(0);
    });

    it('idrata realmente EditTenantPage, resta stabile al rerender e non usa draft', async () => {
        const storage = installStorage(database([record()]));
        const { router, rerender } = renderPage('tenant-a');
        expect(await screen.findByRole('heading', { name: 'Modifica inquilino' })).toBeTruthy();
        expect((screen.getByLabelText('Tipo di locatario') as HTMLSelectElement).value).toBe('person');
        const name = screen.getByLabelText(/^Nome/);
        expect((name as HTMLInputElement).value).toBe('Ada');
        expect((screen.getByLabelText(/^Cognome/) as HTMLInputElement).value).toBe('Lovelace');
        expect((screen.getByLabelText('Codice fiscale') as HTMLInputElement).value).toBe('PERSON-CF');
        expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('ada@example.test');
        expect((screen.getByLabelText('Indirizzo') as HTMLInputElement).value).toBe('Via Roma 1');
        expect(screen.queryByText('Salva bozza')).toBeNull();
        expect(screen.getByRole('button', { name: 'Salva modifiche' })).toBeTruthy();
        expect(screen.queryByText('Bozza modifica inquilino disponibile')).toBeNull();
        expect(screen.queryByText('Modifiche non salvate')).toBeNull();
        await userEvent.clear(name); await userEvent.type(name, 'Locale');
        rerender(<RouterProvider router={router} />);
        expect((name as HTMLInputElement).value).toBe('Locale');
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
    });

    it('cambio Tenant ID ricrea tutta la hydration identity senza stato o write del Tenant precedente', async () => {
        const tenantA = record({ fiscalCode: 'PERSON-A' });
        const tenantB = record({ id: 'tenant-b', firstName: 'Grace', fiscalCode: 'PERSON-B' });
        const competing = record({ id: 'tenant-c', firstName: 'Other', fiscalCode: 'PERSON-C' });
        const storage = installStorage(database([tenantA, tenantB, competing]));
        const { router } = renderPage(tenantA.id);
        const nameA = await screen.findByLabelText(/^Nome/);
        expect((nameA as HTMLInputElement).value).toBe('Ada');
        await userEvent.clear(nameA); await userEvent.type(nameA, 'Locale A');
        const fiscalCodeA = screen.getByLabelText('Codice fiscale');
        await userEvent.clear(fiscalCodeA); await userEvent.type(fiscalCodeA, 'PERSON-C');
        await userEvent.click(screen.getByRole('button', { name: 'Informazioni aggiuntive' }));
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await waitFor(() => expect(document.body.textContent).toMatch(/stess/));
        await userEvent.click(screen.getByRole('button', { name: 'Informazioni aggiuntive' }));
        storage.resetOperationLogs();

        await router.navigate('/tenants/tenant-b/edit');

        expect(await screen.findByRole('heading', { name: 'Tipo' }, { timeout: 10_000 })).toBeTruthy();
        expect((screen.getByLabelText(/^Nome/) as HTMLInputElement).value).toBe('Grace');
        expect(screen.queryByDisplayValue('Locale A')).toBeNull();
        expect(document.body.textContent).not.toMatch(/stess/);
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
    }, 15_000);

    it('aggiorna lo storage reale e naviga con replace preservando authority e identità', async () => {
        const before = record();
        const foreign = record({ id: 'tenant-b', firstName: 'Foreign' });
        const storage = installStorage(database([before]), database([foreign]));
        const bBefore = storage.getItem(KEY_B);
        const { router } = renderPage(before.id);
        const name = await screen.findByLabelText(/^Nome/);
        await userEvent.clear(name); await userEvent.type(name, 'Augusta');
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/tenants/tenant-a'));
        expect(router.state.historyAction).toBe('REPLACE');
        const stored = JSON.parse(storage.getItem(KEY_A)!) as LocalDatabase;
        expect(stored.tenants).toHaveLength(1);
        const after = stored.tenants[0];
        expect(after).toMatchObject({ id: before.id, createdAt: before.createdAt, firstName: 'Augusta', status: before.status, archived: before.archived });
        expect(after.leaseIds).toEqual(before.leaseIds);
        expect(after.invitation).toEqual(before.invitation);
        expect(after.legacy).toEqual(before.legacy);
        expect([after.guarantors[0].id, after.emergencyContacts[0].id, after.photo?.id, after.identityDocumentFile?.id, after.identityDocumentBackFile?.id, after.documents[0].id, after.documents[0].file?.id]).toEqual(['guarantor-id', 'emergency-id', 'photo', 'front', 'back', 'document-id', 'document-file']);
        expect(storage.getItem(KEY_B)).toBe(bBefore);
    });

    it.each([
        ['person', 'TenantFiscalCode', 'PERSON-B', 'Codice fiscale'],
        ['company-cf', 'TenantCompanyFiscalCode', 'ENTITY-B', 'Codice fiscale ente'],
        ['company-vat', 'TenantVatNumber', 'VAT-B', 'P.IVA'],
    ] as const)('blocca collisione fiscale reale %s e preserva pagina e storage', async (scenario, field, duplicate, label) => {
        const company = scenario !== 'person';
        const editing = record({ type: company ? 'company' : 'person', companyName: company ? 'Acme A' : '', companyFiscalCode: company ? 'ENTITY-A' : '', vatNumber: company ? 'VAT-A' : '', fiscalCode: company ? 'REP-A' : 'PERSON-A' });
        const competing = record({ id: 'tenant-other', firstName: 'Other', type: company ? 'company' : 'person', companyName: company ? 'Acme B' : '', companyFiscalCode: company ? 'ENTITY-B' : '', vatNumber: company ? 'VAT-B' : '', fiscalCode: company ? 'REP-B' : 'PERSON-B' });
        const storage = installStorage(database([editing, competing]));
        const before = storage.getItem(KEY_A);
        const { router } = renderPage(editing.id);
        const inputs = await screen.findAllByLabelText(label);
        const input = field === 'TenantVatNumber' ? inputs[0] : inputs.at(-1)!;
        await userEvent.clear(input); await userEvent.type(input, duplicate);
        await userEvent.click(screen.getByRole('button', { name: 'Informazioni aggiuntive' }));
        expect(screen.queryByLabelText(label)).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        await waitFor(() => expect(document.body.textContent).toMatch(/stess/));
        expect(screen.getByRole('heading', { name: 'Tipo' })).toBeTruthy();
        const returnedInputs = screen.getAllByLabelText(label);
        const returnedInput = field === 'TenantVatNumber' ? returnedInputs[0] : returnedInputs.at(-1)!;
        expect((returnedInput as HTMLInputElement).value).toBe(duplicate);
        expect(router.state.location.pathname).toBe('/tenants/tenant-a/edit');
        expect(storage.getItem(KEY_A)).toBe(before);
        expect((JSON.parse(storage.getItem(KEY_A)!) as LocalDatabase).tenants).toHaveLength(2);
    });

    it('gestisce Tenant rimosso dopo hydration senza replacement né falso successo', async () => {
        const storage = installStorage(database([record()]));
        const { router } = renderPage('tenant-a');
        const name = await screen.findByLabelText(/^Nome/);
        await userEvent.clear(name); await userEvent.type(name, 'Valore locale');
        const current = JSON.parse(storage.getItem(KEY_A)!) as LocalDatabase;
        storage.setItem(KEY_A, JSON.stringify({ ...current, tenants: [] }));
        storage.resetOperationLogs();
        await userEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
        expect(await screen.findByText('Inquilino non più disponibile.')).toBeTruthy();
        expect((name as HTMLInputElement).value).toBe('Valore locale');
        expect(router.state.location.pathname).toBe('/tenants/tenant-a/edit');
        expect((JSON.parse(storage.getItem(KEY_A)!) as LocalDatabase).tenants).toHaveLength(0);
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
    });
});
