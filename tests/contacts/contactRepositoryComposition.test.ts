import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ContactCreateInput } from '../../src/db/contactRepository.port';
import type { LocalDatabase } from '../../src/db/database.types';
import {
    installJsonDbWindow,
    MemoryStorage,
    uninstallJsonDbWindow,
} from '../db/jsonDbStorageHarness';

const ACCOUNT_ONE_ID = 'user-002';
const ACCOUNT_ONE_KEY = 'props24.localDb.user-002';
const ACCOUNT_TWO_ID = 'user-003';
const ACCOUNT_TWO_KEY = 'props24.localDb.user-003';
const ACTIVE_ACCOUNT_ID = 'user-004';
const ACTIVE_ACCOUNT_KEY = 'props24.localDb.user-004';

function personInput(firstName: string): ContactCreateInput {
    return {
        type: 'person',
        companyName: '',
        firstName,
        lastName: 'Test',
        birthDate: '',
        birthPlace: '',
        fiscalCode: '',
        vatNumber: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zip: '',
        country: 'IT',
        notes: '',
    };
}

function storedDatabase(
    storage: MemoryStorage,
    key: string,
): LocalDatabase {
    const raw = storage.getItem(key);

    if (!raw) {
        throw new Error(`Database account mancante: ${key}`);
    }

    return JSON.parse(raw) as LocalDatabase;
}

afterEach(() => {
    uninstallJsonDbWindow();
    vi.resetModules();
});

describe('contact repository composition', () => {
    it('rifiuta un account non valido senza scritture', async () => {
        const storage = new MemoryStorage();
        installJsonDbWindow(storage);
        vi.resetModules();

        const { createContactRepositoryContextValue } =
            await import(
                '../../src/contacts/ContactRepositoryContext'
            );

        expect(() =>
            createContactRepositoryContextValue('invalid-account'),
        ).toThrow('Account database non valido');
        expect(storage.length).toBe(0);
        expect(storage.setItemCalls).toHaveLength(0);
    });

    it('mantiene repository distinti senza cambiare account globale', async () => {
        const storage = new MemoryStorage();
        installJsonDbWindow(storage);
        vi.resetModules();

        const jsonDb = await import('../../src/db/jsonDb');
        jsonDb.setActiveDatabaseAccount(ACTIVE_ACCOUNT_ID);

        const { createContactRepositoryContextValue } =
            await import(
                '../../src/contacts/ContactRepositoryContext'
            );
        const repositoryOne =
            createContactRepositoryContextValue(ACCOUNT_ONE_ID);
        const repositoryTwo =
            createContactRepositoryContextValue(ACCOUNT_TWO_ID);

        await expect(repositoryOne.list()).resolves.toEqual([]);
        await expect(repositoryTwo.list()).resolves.toEqual([]);
        expect(jsonDb.getJsonDb().contacts).toEqual([]);

        const callbackOne = vi.fn();
        const callbackTwo = vi.fn();
        const unsubscribeOne = repositoryOne.subscribe(callbackOne);
        const unsubscribeTwo = repositoryTwo.subscribe(callbackTwo);
        const accountOneWrites = storage.writesFor(ACCOUNT_ONE_KEY).length;
        const accountTwoWrites = storage.writesFor(ACCOUNT_TWO_KEY).length;
        const activeAccountWrites =
            storage.writesFor(ACTIVE_ACCOUNT_KEY).length;

        const contactOne =
            await repositoryOne.create(personInput('Uno'));
        const contactTwo =
            await repositoryTwo.create(personInput('Due'));

        expect(storedDatabase(storage, ACCOUNT_ONE_KEY).contacts)
            .toEqual([contactOne]);
        expect(storedDatabase(storage, ACCOUNT_TWO_KEY).contacts)
            .toEqual([contactTwo]);
        expect(storedDatabase(storage, ACTIVE_ACCOUNT_KEY).contacts)
            .toEqual([]);
        expect(contactOne.id).not.toBe(contactTwo.id);
        expect(callbackOne).toHaveBeenCalledTimes(1);
        expect(callbackTwo).toHaveBeenCalledTimes(1);
        expect(storage.writesFor(ACCOUNT_ONE_KEY))
            .toHaveLength(accountOneWrites + 1);
        expect(storage.writesFor(ACCOUNT_TWO_KEY))
            .toHaveLength(accountTwoWrites + 1);
        expect(storage.writesFor(ACTIVE_ACCOUNT_KEY))
            .toHaveLength(activeAccountWrites);
        expect(jsonDb.getJsonDb().contacts).toEqual([]);

        unsubscribeOne();
        unsubscribeTwo();
    });
});
