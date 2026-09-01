import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultTenantValues, normalizeTenantFormData, type TenantFormData } from '../../src/components/tenant-form/schema';
import type { ContactCreateInput } from '../../src/db/contactRepository.port';
import type { ContactRecord, LocalDatabase } from '../../src/db/database.types';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const ACCOUNT_A = 'user-001';
const ACCOUNT_B = 'user-002';
const KEY_A = 'props24.localDb.user-001';
const KEY_B = 'props24.localDb.user-002';
const NOW = '2026-09-01T12:00:00.000Z';

const database = (contacts: ContactRecord[] = []): LocalDatabase => ({
    meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' },
    properties: [], buildings: [], tenants: [], leases: [], payments: [], contacts, documents: [], reservations: [],
    catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [], candidates: [], settings: {},
    userProfile: {}, drafts: [],
});

const contact = (id: string, archived = false): ContactRecord => ({
    id, type: 'person', companyName: '', firstName: 'Mario', lastName: 'Rossi', birthDate: '', birthPlace: '',
    fiscalCode: '', vatNumber: '', email: '', phone: '', address: '', city: '', zip: '', country: 'IT', notes: '',
    archived, createdAt: NOW, updatedAt: NOW,
});

const person = (overrides: Partial<TenantFormData> = {}) => normalizeTenantFormData({
    ...defaultTenantValues, TenantType: 'person', TenantFirstName: 'Ada', TenantLastName: 'Lovelace', ...overrides,
});

const guarantor = (id: string, contactId?: string) => ({
    id, ...(contactId ? { contactId } : {}), contactType: 'person' as const, firstName: 'Mario', lastName: 'Rossi', comments: 'Snapshot',
});

const emergency = (id: string, isPrimary: boolean, contactId?: string) => ({
    id, ...(contactId ? { contactId } : {}), contactType: 'person' as const, firstName: 'Mario', lastName: 'Rossi',
    phone: '333123', comments: 'Metadata', isPrimary,
});

async function arrange(dbA = database(), dbB = database()) {
    const storage = new MemoryStorage({ [KEY_A]: JSON.stringify(dbA), [KEY_B]: JSON.stringify(dbB) });
    installJsonDbWindow(storage);
    vi.resetModules();
    const jsonDb = await import('../../src/db/jsonDb');
    jsonDb.setActiveDatabaseAccount(ACCOUNT_A);
    const tenants = await import('../../src/db/tenantRepository');
    storage.resetOperationLogs();
    return { storage, jsonDb, tenants };
}

const persisted = (storage: MemoryStorage, key = KEY_A): LocalDatabase => JSON.parse(storage.getItem(key)!) as LocalDatabase;

afterEach(() => {
    uninstallJsonDbWindow();
    vi.resetModules();
});

describe('Tenant atomic create C4', () => {
    it('repository cattura account, salva una volta e restituisce il record persistito normalizzato', async () => {
        const linked = contact('contact-linked');
        const { storage, jsonDb, tenants } = await arrange(database([linked]));
        const repositoryA = tenants.createTenantRepository({ accountId: ACCOUNT_A });
        jsonDb.setActiveDatabaseAccount(ACCOUNT_B);
        const input = person({
            TenantFiscalCode: ' abc 123 ',
            TenantGuarantors: [guarantor('guarantor-1', linked.id), guarantor('guarantor-inline')],
            TenantEmergencyContacts: [emergency('emergency-1', true, linked.id)],
        });
        const original = structuredClone(input);
        const created = repositoryA.create(input);
        const stored = persisted(storage).tenants.find((tenant) => tenant.id === created.id);

        expect(storage.writesFor(KEY_A)).toHaveLength(1);
        expect(storage.writesFor(KEY_B)).toHaveLength(0);
        expect(stored).toEqual(created);
        expect(created).toMatchObject({ fiscalCode: 'ABC123' });
        expect(created.guarantors).toEqual(input.TenantGuarantors);
        expect(created.emergencyContacts).toEqual(input.TenantEmergencyContacts);
        expect(input).toEqual(original);
    });

    it('consente Contact archived, legacy inline e lo stesso Contact in ruoli differenti', async () => {
        const linked = contact('contact-archived', true);
        const { tenants } = await arrange(database([linked]));
        expect(() => tenants.createTenant(person({
            TenantGuarantors: [guarantor('g-linked', linked.id), guarantor('g-inline')],
            TenantEmergencyContacts: [emergency('e-linked', true, linked.id)],
        }))).not.toThrow();
    });

    it.each([
        ['guarantor', { TenantGuarantors: [guarantor('g-1', 'missing')] }],
        ['emergency', { TenantEmergencyContacts: [emergency('e-1', true, 'missing')] }],
    ] as const)('blocca contactId dangling %s con zero write', async (relationType, overrides) => {
        const { storage, tenants } = await arrange();
        const input = person(overrides);
        const original = structuredClone(input);
        expect(() => tenants.createTenant(input)).toThrowError(expect.objectContaining({
            name: 'TenantContactReferenceNotFoundError', contactId: 'missing', relationType,
        }));
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(persisted(storage).tenants).toHaveLength(0);
        expect(input).toEqual(original);
    });

    it('non accetta un Contact presente soltanto in un altro account', async () => {
        const foreign = contact('foreign-contact');
        const { storage, tenants } = await arrange(database(), database([foreign]));
        const repositoryA = tenants.createTenantRepository({ accountId: ACCOUNT_A });
        expect(() => repositoryA.create(person({ TenantGuarantors: [guarantor('g-1', foreign.id)] }))).toThrowError(
            expect.objectContaining({ name: 'TenantContactReferenceNotFoundError', contactId: foreign.id }),
        );
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(storage.writesFor(KEY_B)).toHaveLength(0);
    });

    it.each([
        ['id garante vuoto', { TenantGuarantors: [guarantor('')] }],
        ['id garante duplicato', { TenantGuarantors: [guarantor('same'), guarantor('same')] }],
        ['id emergency duplicato', { TenantEmergencyContacts: [emergency('same', true), emergency('same', false)] }],
        ['oltre cinque emergency', { TenantEmergencyContacts: Array.from({ length: 6 }, (_, index) => emergency(`e-${index}`, index === 0)) }],
        ['zero primary', { TenantEmergencyContacts: [emergency('e-1', false), emergency('e-2', false)] }],
        ['primary multipli', { TenantEmergencyContacts: [emergency('e-1', true), emergency('e-2', true)] }],
    ])('blocca integrità relazioni: %s', async (_label, overrides) => {
        const { storage, tenants } = await arrange();
        expect(() => tenants.createTenant(person(overrides))).toThrowError(expect.objectContaining({ name: 'TenantRelationIntegrityError' }));
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(persisted(storage).tenants).toHaveLength(0);
    });

    it('accetta due emergency con esattamente un primary e quick create minima', async () => {
        const { storage, tenants } = await arrange();
        const related = tenants.createTenant(person({
            TenantEmergencyContacts: [emergency('e-1', true), emergency('e-2', false)],
        }));
        const quick = tenants.createTenant(person({ TenantFiscalCode: '', TenantGuarantors: [], TenantEmergencyContacts: [] }));
        expect(related.emergencyContacts.filter((item) => item.isPrimary)).toHaveLength(1);
        expect(quick.id).toBeTruthy();
        expect(storage.writesFor(KEY_A)).toHaveLength(2);
    });

    it('duplicate fiscale è atomico e non rimuove un Contact creato autonomamente', async () => {
        const { storage, tenants } = await arrange();
        const jsonDb = await import('../../src/db/jsonDb');
        const { createLocalContactRepository } = await import('../../src/db/localContactRepository');
        const contacts = createLocalContactRepository({ accountId: ACCOUNT_A });
        const input: ContactCreateInput = {
            type: 'person', companyName: '', firstName: 'Grace', lastName: 'Hopper', birthDate: '', birthPlace: '',
            fiscalCode: '', vatNumber: '', email: '', phone: '', address: '', city: '', zip: '', country: 'IT', notes: '',
        };
        const autonomous = await contacts.create(input);
        tenants.createTenant(person({ TenantFiscalCode: 'DUPLICATE' }));
        storage.resetOperationLogs();
        expect(() => tenants.createTenant(person({ TenantFiscalCode: ' duplicate ' }))).toThrowError(
            expect.objectContaining({ name: 'DuplicateTenantFiscalIdentityError' }),
        );
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(jsonDb.getJsonDb().contacts).toContainEqual(autonomous);
        expect(jsonDb.getJsonDb().tenants).toHaveLength(1);
    });

    it('propaga save failure senza seconda save e usa il database restituito per il return', async () => {
        const { tenants } = await arrange();
        const current = database();
        const failureGateway = { getDatabase: () => current, saveDatabase: vi.fn(() => { throw new Error('storage failure'); }) };
        expect(() => tenants.createTenantRepositoryOperations(failureGateway).create(person())).toThrow('storage failure');
        expect(failureGateway.saveDatabase).toHaveBeenCalledOnce();

        const saveDatabase = vi.fn((next: LocalDatabase) => ({
            ...next,
            tenants: next.tenants.map((tenant) => ({ ...tenant, notes: 'persisted-version' })),
        }));
        const created = tenants.createTenantRepositoryOperations({ getDatabase: () => current, saveDatabase }).create(person());
        expect(saveDatabase).toHaveBeenCalledOnce();
        expect(created.notes).toBe('persisted-version');
    });
});
