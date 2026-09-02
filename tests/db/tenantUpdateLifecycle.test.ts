import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultTenantValues, normalizeTenantFormData, type TenantFormData } from '../../src/components/tenant-form/schema';
import { defaultPropertyValues } from '../../src/components/property-form/schema';
import type { ContactRecord, LeaseRecord, LocalDatabase, PaymentRecord, PropertyRecord, TenantRecord } from '../../src/db/database.types';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const NOW = '2026-09-02T10:00:00.000Z';
const EARLIER = '2026-09-01T10:00:00.000Z';
const ACCOUNT_A = 'user-001';
const ACCOUNT_B = 'user-002';
const KEY_A = `props24.localDb.${ACCOUNT_A}`;
const KEY_B = `props24.localDb.${ACCOUNT_B}`;

const database = (options: Partial<Pick<LocalDatabase, 'tenants' | 'contacts' | 'leases' | 'payments'>> = {}): LocalDatabase => ({
    meta: { schemaVersion: 4, seedVersion: 1, createdAt: EARLIER, updatedAt: EARLIER, source: 'seed' },
    properties: [], buildings: [], tenants: options.tenants ?? [], leases: options.leases ?? [], payments: options.payments ?? [],
    contacts: options.contacts ?? [], documents: [], reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [],
    notes: [], messages: [], candidates: [], settings: {}, userProfile: {}, drafts: [],
});

const personForm = (overrides: Partial<TenantFormData> = {}) => normalizeTenantFormData({
    ...defaultTenantValues, TenantType: 'person', TenantFirstName: 'Ada', TenantLastName: 'Lovelace', ...overrides,
});
const companyForm = (overrides: Partial<TenantFormData> = {}) => normalizeTenantFormData({
    ...defaultTenantValues, TenantType: 'company', TenantCompanyName: 'Acme', ...overrides,
});
const contact = (id: string, archived = false): ContactRecord => ({
    id, type: 'person', companyName: '', firstName: id, lastName: 'Contact', birthDate: '', birthPlace: '', fiscalCode: '',
    vatNumber: '', email: '', phone: '', address: '', city: '', zip: '', country: 'IT', notes: '', archived,
    createdAt: EARLIER, updatedAt: EARLIER,
});
const guarantor = (id: string, contactId?: string) => ({
    id, ...(contactId ? { contactId } : {}), contactType: 'person' as const, firstName: 'Grace', lastName: 'Hopper',
});
const property = (id: string): PropertyRecord => ({
    id, createdAt: EARLIER, updatedAt: EARLIER, archived: false,
    formData: { ...defaultPropertyValues, PropertyTitle: id, PropertyTypeID: 'appartamento', PropertyAddress: 'Via Roma 1', PropertyCity: 'Roma', PropertyPostalCode: '00100', PropertyCountry: 'IT' },
    relations: { buildingId: null, tenantIds: [], leaseIds: [] }, notes: [], activities: [],
});
const payment = (id: string, tenantId: string, propertyId: string): PaymentRecord => ({
    id, propertyId, leaseId: null, tenantId, type: 'expense', category: 'manual', amount: 1, dueDate: '2026-09-01',
    paidDate: null, status: 'late', description: 'History', source: 'manual', accountingRole: 'expense', notes: '',
    receiptNumber: null, confirmation: null, createdAt: EARLIER, updatedAt: EARLIER,
});

function fakeRepository(initial: LocalDatabase) {
    let current = initial;
    const saves: LocalDatabase[] = [];
    return {
        gateway: {
            getDatabase: () => current,
            saveDatabase: (next: LocalDatabase) => { saves.push(next); current = next; return next; },
        },
        saves,
        current: () => current,
    };
}

async function modules() {
    return import('../../src/db/tenantRepository');
}

async function storedRepository(dbA: LocalDatabase, dbB = database()) {
    const storage = new MemoryStorage({ [KEY_A]: JSON.stringify(dbA), [KEY_B]: JSON.stringify(dbB) });
    installJsonDbWindow(storage);
    vi.resetModules();
    const jsonDb = await import('../../src/db/jsonDb');
    jsonDb.setActiveDatabaseAccount(ACCOUNT_A);
    const tenants = await modules();
    storage.resetOperationLogs();
    return { storage, jsonDb, tenants };
}

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
});
afterEach(() => {
    uninstallJsonDbWindow();
    vi.useRealTimers();
    vi.resetModules();
});

describe('Tenant repository update e lifecycle C5.1', () => {
    it.each([
        ['person', personForm({ TenantFiscalCode: 'PERSON-A' }), personForm({ TenantFiscalCode: ' person-a ', TenantEmail: 'new@example.test' })],
        ['company', companyForm({ TenantCompanyFiscalCode: 'ENTITY-A', TenantVatNumber: 'VAT-A' }), companyForm({ TenantCompanyFiscalCode: ' entity-a ', TenantVatNumber: 'VAT-A', TenantEmail: 'company@example.test' })],
    ] as const)('update %s preserva lifecycle, invitation, legacy e input con una sola write', async (_type, initial, update) => {
        const tenants = await modules();
        const fixture = fakeRepository(database());
        const repository = tenants.createTenantRepositoryOperations(fixture.gateway);
        const created = repository.create(initial);
        const persisted: TenantRecord = {
            ...created, createdAt: EARLIER, updatedAt: EARLIER, status: 'attivo', archived: true,
            leaseIds: ['lease-old'], invitation: { status: 'accepted', email: 'invite@old.test', sentAt: EARLIER, acceptedAt: EARLIER },
            legacy: { marker: 'preserved' },
        };
        fixture.gateway.saveDatabase({ ...fixture.current(), tenants: [persisted] });
        fixture.saves.length = 0;
        const original = structuredClone(update);
        const result = repository.update(persisted.id, update);
        expect(fixture.saves).toHaveLength(1);
        expect(result).toMatchObject({ id: persisted.id, createdAt: EARLIER, updatedAt: NOW, status: 'attivo', archived: true, leaseIds: ['lease-old'] });
        expect(result.invitation).toEqual(persisted.invitation);
        expect(result.legacy).toEqual({ marker: 'preserved' });
        expect(result.email).toBe(update.TenantEmail);
        expect(update).toEqual(original);
    });

    it('return update deriva dal database restituito dalla persistence e save failure non ritenta', async () => {
        const tenants = await modules();
        const seed = fakeRepository(database());
        const initial = tenants.createTenantRepositoryOperations(seed.gateway).create(personForm());
        const saveDatabase = vi.fn((next: LocalDatabase) => ({
            ...next, tenants: next.tenants.map((tenant) => ({ ...tenant, notes: 'persisted-return' })),
        }));
        const returned = tenants.createTenantRepositoryOperations({ getDatabase: () => seed.current(), saveDatabase }).update(initial.id, personForm());
        expect(returned.notes).toBe('persisted-return');
        expect(saveDatabase).toHaveBeenCalledOnce();
        const failing = vi.fn(() => { throw new Error('storage failure'); });
        expect(() => tenants.createTenantRepositoryOperations({ getDatabase: () => seed.current(), saveDatabase: failing }).update(initial.id, personForm())).toThrow('storage failure');
        expect(failing).toHaveBeenCalledOnce();
    });

    it('update missing restituisce TenantNotFoundError con zero write e database invariato', async () => {
        const tenants = await modules();
        const initial = database();
        const fixture = fakeRepository(initial);
        const repository = tenants.createTenantRepositoryOperations(fixture.gateway);
        expect(() => repository.update('missing', personForm())).toThrowError(expect.objectContaining({
            name: 'TenantNotFoundError', tenantId: 'missing',
        }));
        expect(fixture.saves).toHaveLength(0);
        expect(fixture.current()).toBe(initial);
    });

    it('fiscal exclude-self passa ma collisioni person/company/archived bloccano con zero write', async () => {
        const tenants = await modules();
        const fixture = fakeRepository(database());
        const repository = tenants.createTenantRepositoryOperations(fixture.gateway);
        const personA = repository.create(personForm({ TenantFiscalCode: 'PERSON-A' }));
        const personB = repository.create(personForm({ TenantFiscalCode: 'PERSON-B' }));
        const companyA = repository.create(companyForm({ TenantCompanyFiscalCode: 'ENTITY-A', TenantVatNumber: 'VAT-A' }));
        const companyB = repository.create(companyForm({ TenantCompanyFiscalCode: 'ENTITY-B', TenantVatNumber: 'VAT-B' }));
        fixture.gateway.saveDatabase({ ...fixture.current(), tenants: fixture.current().tenants.map((item) => item.id === personA.id ? { ...item, archived: true } : item) });
        fixture.saves.length = 0;
        expect(() => repository.update(personA.id, personForm({ TenantFiscalCode: 'PERSON-A' }))).not.toThrow();
        fixture.saves.length = 0;
        expect(() => repository.update(personB.id, personForm({ TenantFiscalCode: 'PERSON-A' }))).toThrowError(expect.objectContaining({ name: 'DuplicateTenantFiscalIdentityError' }));
        expect(() => repository.update(companyB.id, companyForm({ TenantCompanyFiscalCode: 'ENTITY-A', TenantVatNumber: 'VAT-X' }))).toThrowError(expect.objectContaining({ field: 'fiscalCode' }));
        expect(() => repository.update(companyB.id, companyForm({ TenantCompanyFiscalCode: 'ENTITY-X', TenantVatNumber: 'VAT-A' }))).toThrowError(expect.objectContaining({ field: 'vatNumber' }));
        expect(companyA.id).toBeTruthy();
        expect(fixture.saves).toHaveLength(0);
    });

    it('quota e integrità relazioni bloccano update con zero write', async () => {
        const tenants = await modules();
        const fixture = fakeRepository(database());
        const repository = tenants.createTenantRepositoryOperations(fixture.gateway);
        const current = repository.create(personForm());
        fixture.saves.length = 0;
        const oversized = { id: 'big', name: 'big.pdf', type: 'application/pdf', size: 4 * 1024 * 1024, lastModified: 1, dataUrl: `data:application/pdf;base64,${'A'.repeat(4 * 1024 * 1024)}` };
        expect(() => repository.update(current.id, personForm({ TenantIDCard: oversized }))).toThrowError(expect.objectContaining({ name: 'TenantStorageQuotaError' }));
        expect(() => repository.update(current.id, personForm({ TenantGuarantors: [guarantor('same'), guarantor('same')] }))).toThrowError(expect.objectContaining({ name: 'TenantRelationIntegrityError' }));
        expect(fixture.saves).toHaveLength(0);
    });

    it('valida nuovi Contact same-account/archived e blocca dangling o sostituzione dangling', async () => {
        const tenants = await modules();
        const valid = contact('valid');
        const archived = contact('archived', true);
        const fixture = fakeRepository(database({ contacts: [valid, archived] }));
        const repository = tenants.createTenantRepositoryOperations(fixture.gateway);
        const current = repository.create(personForm({ TenantGuarantors: [guarantor('g-1')] }));
        fixture.saves.length = 0;
        expect(repository.update(current.id, personForm({ TenantGuarantors: [guarantor('g-1', valid.id), guarantor('g-2', archived.id)] }))).toBeTruthy();
        fixture.saves.length = 0;
        expect(() => repository.update(current.id, personForm({ TenantGuarantors: [guarantor('g-1', 'missing')] }))).toThrowError(expect.objectContaining({ name: 'TenantContactReferenceNotFoundError' }));
        expect(fixture.saves).toHaveLength(0);
    });

    it('preserva legacy dangling invariato senza read-repair e conserva nested ID', async () => {
        const tenants = await modules();
        const fixture = fakeRepository(database());
        const repository = tenants.createTenantRepositoryOperations(fixture.gateway);
        const current = repository.create(personForm());
        const legacy = {
            ...current,
            guarantors: [guarantor('relation-old', 'missing-old')],
            documents: [{ id: 'document-old', fileName: 'old.pdf', categoryId: 1, categoryLabel: 'Doc', description: '', uploadDate: EARLIER, fileSize: 1, isShared: false, fileUrl: '', file: { id: 'file-old', name: 'old.pdf', type: 'application/pdf', size: 1, lastModified: 1, dataUrl: 'data:application/pdf;base64,WA==' } }],
        };
        fixture.gateway.saveDatabase({ ...fixture.current(), tenants: [legacy] });
        fixture.saves.length = 0;
        const updated = repository.update(current.id, personForm({
            TenantNotes: 'unrelated', TenantGuarantors: legacy.guarantors, TenantDocuments: legacy.documents,
        }));
        expect(updated.guarantors).toEqual([expect.objectContaining({ id: 'relation-old', contactId: 'missing-old' })]);
        expect(updated.documents).toEqual([expect.objectContaining({
            id: 'document-old', file: expect.objectContaining({ id: 'file-old' }),
        })]);
        expect(fixture.current().contacts).toEqual([]);
        expect(fixture.saves).toHaveLength(1);
    });

    it('archive/restore singole e bulk preservano dati, deduplicano e sono atomiche', async () => {
        const tenants = await modules();
        const fixture = fakeRepository(database());
        const repository = tenants.createTenantRepositoryOperations(fixture.gateway);
        const a = repository.create(personForm({ TenantFirstName: 'A' }));
        const b = repository.create(personForm({ TenantFirstName: 'B' }));
        fixture.saves.length = 0;
        expect(repository.archive(a.id)).toEqual({ ...a, archived: true, updatedAt: NOW });
        expect(repository.restore(a.id)).toEqual({ ...a, archived: false, updatedAt: NOW });
        expect(repository.archiveMany([a.id, a.id, b.id])).toEqual({ operation: 'archive', ids: [a.id, b.id], count: 2 });
        expect(repository.restoreMany([a.id, b.id])).toEqual({ operation: 'restore', ids: [a.id, b.id], count: 2 });
        expect(fixture.saves).toHaveLength(4);
        for (const operation of ['archiveMany', 'restoreMany'] as const) {
            fixture.saves.length = 0;
            expect(() => repository[operation]([a.id, 'missing'])).toThrowError(expect.objectContaining({ name: 'TenantNotFoundError' }));
            expect(repository[operation]([])).toEqual({ operation: operation === 'archiveMany' ? 'archive' : 'restore', ids: [], count: 0 });
            expect(fixture.saves).toHaveLength(0);
        }
    });

    it('delete libera anche archived senza cascade e blocca Lease o Payment con dettagli', async () => {
        const tenants = await modules();
        const free = { ...tenants.createTenantRepositoryOperations(fakeRepository(database()).gateway).create(personForm()), archived: true };
        const leaseBlocked = { ...free, id: 'lease-blocked', archived: false };
        const paymentBlocked = { ...free, id: 'payment-blocked', archived: false };
        const lease = { id: 'lease-ended', tenantIds: [leaseBlocked.id], status: 'terminata', archived: true } as LeaseRecord;
        const payment = { id: 'payment-paid', tenantId: paymentBlocked.id, status: 'paid' } as PaymentRecord;
        const fixture = fakeRepository(database({ tenants: [free, leaseBlocked, paymentBlocked], leases: [lease], payments: [payment] }));
        const repository = tenants.createTenantRepositoryOperations(fixture.gateway);
        expect(repository.delete(free.id)).toBe(true);
        expect(fixture.current().leases).toEqual([lease]);
        expect(fixture.current().payments).toEqual([payment]);
        fixture.saves.length = 0;
        expect(() => repository.delete(leaseBlocked.id)).toThrowError(expect.objectContaining({ blockers: [{ tenantId: leaseBlocked.id, leaseIds: [lease.id], paymentIds: [] }] }));
        expect(() => repository.delete(paymentBlocked.id)).toThrowError(expect.objectContaining({ blockers: [{ tenantId: paymentBlocked.id, leaseIds: [], paymentIds: [payment.id] }] }));
        expect(fixture.saves).toHaveLength(0);
        expect(fixture.current().payments[0].tenantId).toBe(paymentBlocked.id);
    });

    it('deleteMany deduplica, salva una volta e resta atomica su blocker o missing', async () => {
        const tenants = await modules();
        const base = tenants.createTenantRepositoryOperations(fakeRepository(database()).gateway).create(personForm());
        const a = { ...base, id: 'a' };
        const b = { ...base, id: 'b' };
        const blocked = { ...base, id: 'blocked' };
        const payment = { id: 'payment-blocker', tenantId: blocked.id } as PaymentRecord;
        const fixture = fakeRepository(database({ tenants: [a, b, blocked], payments: [payment] }));
        const repository = tenants.createTenantRepositoryOperations(fixture.gateway);
        expect(() => repository.deleteMany([a.id, blocked.id])).toThrowError(expect.objectContaining({
            name: 'TenantDeleteBlockedError',
            blockedTenantIds: expect.arrayContaining([blocked.id]),
            blockers: expect.arrayContaining([expect.objectContaining({
                tenantId: blocked.id, leaseIds: [], paymentIds: expect.arrayContaining([payment.id]),
            })]),
        }));
        expect(() => repository.deleteMany([a.id, 'missing'])).toThrowError(expect.objectContaining({ name: 'TenantNotFoundError' }));
        expect(fixture.saves).toHaveLength(0);
        expect(repository.deleteMany([a.id, a.id, b.id])).toEqual({ operation: 'delete', ids: [a.id, b.id], count: 2 });
        expect(fixture.saves).toHaveLength(1);
        expect(fixture.current().tenants).toEqual([blocked]);
        fixture.saves.length = 0;
        expect(repository.deleteMany([])).toEqual({ operation: 'delete', ids: [], count: 0 });
        expect(fixture.saves).toHaveLength(0);
    });

    it('repository A resta isolata dopo switch globale e Contact solo B non valida update A', async () => {
        const foreign = contact('foreign');
        const { storage, jsonDb, tenants } = await storedRepository(database(), database({ contacts: [foreign] }));
        const repositoryA = tenants.createTenantRepository({ accountId: ACCOUNT_A });
        const repositoryB = tenants.createTenantRepository({ accountId: ACCOUNT_B });
        const created = repositoryA.create(personForm());
        const onlyInB = repositoryB.create(personForm({ TenantFirstName: 'Only B' }));
        storage.resetOperationLogs();
        jsonDb.setActiveDatabaseAccount(ACCOUNT_B);
        expect(() => repositoryA.update(created.id, personForm({ TenantGuarantors: [guarantor('g-1', foreign.id)] }))).toThrowError(expect.objectContaining({ name: 'TenantContactReferenceNotFoundError' }));
        for (const operation of ['archive', 'restore', 'delete'] as const) {
            expect(() => repositoryA[operation](onlyInB.id)).toThrowError(expect.objectContaining({ name: 'TenantNotFoundError', tenantId: onlyInB.id }));
        }
        expect(() => repositoryA.update(onlyInB.id, personForm())).toThrowError(expect.objectContaining({ name: 'TenantNotFoundError', tenantId: onlyInB.id }));
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(storage.writesFor(KEY_B)).toHaveLength(0);
    });

    it('bridge deleteTenantById delega, blocca Payment e non azzera tenantId', async () => {
        const { storage, jsonDb, tenants } = await storedRepository(database());
        const created = tenants.createTenant(personForm());
        const db = JSON.parse(storage.getItem(KEY_A)!) as LocalDatabase;
        const linkedProperty = property('property-history');
        const historicalPayment = payment('payment-history', created.id, linkedProperty.id);
        storage.setItem(KEY_A, JSON.stringify({ ...db, properties: [linkedProperty], payments: [historicalPayment] }));
        jsonDb.setActiveDatabaseAccount(null);
        jsonDb.setActiveDatabaseAccount(ACCOUNT_A);
        storage.resetOperationLogs();
        expect(() => tenants.deleteTenantById(created.id)).toThrowError(expect.objectContaining({
            name: 'TenantDeleteBlockedByLeaseError',
            tenantId: created.id,
            blockedTenantIds: expect.arrayContaining([created.id]),
            blockers: expect.arrayContaining([expect.objectContaining({
                tenantId: created.id, leaseIds: [], paymentIds: [historicalPayment.id],
            })]),
        }));
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect((JSON.parse(storage.getItem(KEY_A)!) as LocalDatabase).payments[0].tenantId).toBe(created.id);
    });
});
