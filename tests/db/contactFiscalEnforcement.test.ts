import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ContactRecord, LocalDatabase } from '../../src/db/database.types';
import type { ContactCreateInput } from '../../src/db/contactRepository.port';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const ACCOUNT_A = 'user-001';
const ACCOUNT_B = 'user-002';
const KEY_A = 'props24.localDb.user-001';
const KEY_B = 'props24.localDb.user-002';
const NOW = '2026-09-01T12:00:00.000Z';

const contact = (id: string, overrides: Partial<ContactRecord> = {}): ContactRecord => ({
    id, type: 'person', companyName: '', firstName: 'Mario', lastName: 'Rossi', birthDate: '', birthPlace: '',
    fiscalCode: '', vatNumber: '', email: '', phone: '', address: '', city: '', zip: '', country: 'IT', notes: '',
    archived: false, createdAt: NOW, updatedAt: NOW, ...overrides,
});

const input = (overrides: Partial<ContactCreateInput> = {}): ContactCreateInput => ({
    type: 'person', companyName: '', firstName: 'Ada', lastName: 'Lovelace', birthDate: '', birthPlace: '',
    fiscalCode: '', vatNumber: '', email: '', phone: '', address: '', city: '', zip: '', country: 'IT', notes: '',
    ...overrides,
});

const database = (contacts: ContactRecord[] = []): LocalDatabase => ({
    meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' },
    properties: [], buildings: [], tenants: [], leases: [], payments: [], contacts, documents: [], reservations: [],
    catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [], candidates: [], settings: {},
    userProfile: {}, drafts: [],
});

async function arrange(dbA = database(), dbB = database()) {
    const storage = new MemoryStorage({ [KEY_A]: JSON.stringify(dbA), [KEY_B]: JSON.stringify(dbB) });
    installJsonDbWindow(storage);
    vi.resetModules();
    const jsonDb = await import('../../src/db/jsonDb');
    jsonDb.setActiveDatabaseAccount(ACCOUNT_A);
    const { createLocalContactRepository } = await import('../../src/db/localContactRepository');
    const repositoryA = createLocalContactRepository({ accountId: ACCOUNT_A });
    storage.resetOperationLogs();
    return { storage, jsonDb, repositoryA };
}

const persisted = (storage: MemoryStorage, key = KEY_A): LocalDatabase => JSON.parse(storage.getItem(key)!) as LocalDatabase;

afterEach(() => {
    uninstallJsonDbWindow();
    vi.resetModules();
});

describe('ContactRepository fiscal enforcement C3.2', () => {
    it('create person duplicata, anche archived, propaga errore e lascia DB/input/notification invariati', async () => {
        const existing = contact('contact-existing', { fiscalCode: ' rss 123 ', archived: true });
        const { repositoryA, storage } = await arrange(database([existing]));
        const callback = vi.fn();
        const unsubscribe = repositoryA.subscribe(callback);
        const candidate = input({ fiscalCode: 'RSS123' });
        const original = structuredClone(candidate);
        const before = storage.getItem(KEY_A);

        await expect(repositoryA.create(candidate)).rejects.toMatchObject({
            name: 'DuplicateContactFiscalIdentityError', field: 'fiscalCode', existingContactId: existing.id,
        });
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(storage.getItem(KEY_A)).toBe(before);
        expect(callback).not.toHaveBeenCalled();
        expect(candidate).toEqual(original);
        unsubscribe();
    });

    it('create person ignora VAT ed email e consente CF uguale a una company', async () => {
        const existing = contact('company-existing', {
            type: 'company', companyName: 'Company', firstName: '', lastName: '', fiscalCode: 'SAME123',
            vatNumber: 'VAT-SAME', email: 'same@example.test',
        });
        const { repositoryA, storage } = await arrange(database([existing]));
        const created = await repositoryA.create(input({ fiscalCode: 'SAME123', vatNumber: 'VAT-SAME', email: 'same@example.test' }));
        expect(created.type).toBe('person');
        expect(storage.writesFor(KEY_A)).toHaveLength(1);
    });

    it('create company blocca CF e VAT con priorità deterministica al CF', async () => {
        const first = contact('company-cf', { type: 'company', companyName: 'One', firstName: '', lastName: '', fiscalCode: 'CF-ONE', vatNumber: 'VAT-ONE' });
        const second = contact('company-vat', { type: 'company', companyName: 'Two', firstName: '', lastName: '', fiscalCode: 'CF-TWO', vatNumber: 'VAT-TWO' });
        const { repositoryA, storage } = await arrange(database([first, second]));
        const company = (fiscalCode: string, vatNumber: string) => input({ type: 'company', companyName: 'New', firstName: '', lastName: '', fiscalCode, vatNumber });
        await expect(repositoryA.create(company('cf-one', 'vat-two'))).rejects.toMatchObject({ field: 'fiscalCode', existingContactId: first.id });
        await expect(repositoryA.create(company('CF-NEW', ' vat-two '))).rejects.toMatchObject({ field: 'vatNumber', existingContactId: second.id });
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
    });

    it('update propria identità e person VAT non probatoria passano', async () => {
        const first = contact('person-a', { fiscalCode: 'CF-A', vatNumber: 'VAT-SHARED' });
        const second = contact('person-b', { fiscalCode: 'CF-B', vatNumber: 'VAT-B' });
        const { repositoryA, storage } = await arrange(database([first, second]));
        await expect(repositoryA.update(second.id, { notes: 'self' })).resolves.toMatchObject({ fiscalCode: 'CF-B', notes: 'self' });
        await expect(repositoryA.update(second.id, { vatNumber: 'VAT-SHARED' })).resolves.toMatchObject({ vatNumber: 'VAT-SHARED' });
        expect(storage.writesFor(KEY_A)).toHaveLength(2);
    });

    it('update verso CF altrui è atomico, senza notification e senza mutare patch', async () => {
        const first = contact('person-a', { fiscalCode: 'CF-A' });
        const second = contact('person-b', { fiscalCode: 'CF-B' });
        const { repositoryA, storage } = await arrange(database([first, second]));
        const callback = vi.fn();
        const unsubscribe = repositoryA.subscribe(callback);
        const patch = { fiscalCode: ' cf-a ', notes: 'non salvare' };
        const original = structuredClone(patch);
        const before = storage.getItem(KEY_A);
        await expect(repositoryA.update(second.id, patch)).rejects.toMatchObject({ field: 'fiscalCode', existingContactId: first.id });
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(storage.getItem(KEY_A)).toBe(before);
        expect(callback).not.toHaveBeenCalled();
        expect(patch).toEqual(original);
        unsubscribe();
    });

    it('update company verso VAT altrui viene bloccato', async () => {
        const first = contact('company-a', { type: 'company', companyName: 'A', firstName: '', lastName: '', fiscalCode: 'CF-A', vatNumber: 'VAT-A' });
        const second = contact('company-b', { type: 'company', companyName: 'B', firstName: '', lastName: '', fiscalCode: 'CF-B', vatNumber: 'VAT-B' });
        const { repositoryA, storage } = await arrange(database([first, second]));
        await expect(repositoryA.update(second.id, { vatNumber: 'vat-a' })).rejects.toMatchObject({ field: 'vatNumber', existingContactId: first.id });
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
    });

    it('exclude self non nasconde un altro duplicato legacy', async () => {
        const first = contact('legacy-a', { fiscalCode: 'LEGACY-DUP' });
        const second = contact('legacy-b', { fiscalCode: 'LEGACY-DUP' });
        const { repositoryA, storage } = await arrange(database([first, second]));
        await expect(repositoryA.update(second.id, { notes: 'update' })).rejects.toMatchObject({ existingContactId: first.id });
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
    });

    it('account isolation consente riuso fiscale presente solo in B e scrive soltanto A', async () => {
        const inB = contact('contact-b', { fiscalCode: 'CROSS123' });
        const { repositoryA, storage, jsonDb } = await arrange(database(), database([inB]));
        jsonDb.setActiveDatabaseAccount(ACCOUNT_B);
        await expect(repositoryA.create(input({ fiscalCode: 'CROSS123' }))).resolves.toMatchObject({ fiscalCode: 'CROSS123' });
        expect(storage.writesFor(KEY_A)).toHaveLength(1);
        expect(storage.writesFor(KEY_B)).toHaveLength(0);
        expect(persisted(storage, KEY_B).contacts).toEqual([inB]);
    });

    it('repository catturato continua a bloccare sul database A dopo switch globale a B', async () => {
        const inA = contact('contact-a', { fiscalCode: 'DUP-A' });
        const { repositoryA, storage, jsonDb } = await arrange(database([inA]), database());
        jsonDb.setActiveDatabaseAccount(ACCOUNT_B);
        await expect(repositoryA.create(input({ fiscalCode: 'dup-a' }))).rejects.toMatchObject({
            name: 'DuplicateContactFiscalIdentityError', field: 'fiscalCode', existingContactId: inA.id,
        });
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(storage.writesFor(KEY_B)).toHaveLength(0);
    });

    it('wrapper legacy create e update condividono lo stesso enforcement senza bypass', async () => {
        const first = contact('legacy-a', { fiscalCode: 'AAA' });
        const second = contact('legacy-b', { fiscalCode: 'BBB' });
        const { storage, jsonDb } = await arrange(database([first, second]));
        jsonDb.setActiveDatabaseAccount(ACCOUNT_A);
        const { createContact, updateContact } = await import('../../src/db/contactRepository');
        expect(() => createContact(input({ fiscalCode: ' aaa ' }))).toThrow('Esiste già un contatto con lo stesso codice fiscale.');
        expect(() => updateContact(second.id, { fiscalCode: 'AAA' })).toThrow('Esiste già un contatto con lo stesso codice fiscale.');
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(persisted(storage).contacts).toEqual([first, second]);
    });
});
