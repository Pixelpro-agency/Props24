import { describe, expect, it, vi } from 'vitest';

import { createContactListStore } from '../../src/contacts/contactListStore';
import type { ContactRepository } from '../../src/db/contactRepository.port';
import type { ContactRecord } from '../../src/db/database.types';

function contact(id: string): ContactRecord {
    return {
        id,
        type: 'person',
        companyName: '',
        firstName: id,
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
        archived: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
}

function deferred<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });

    return { promise, resolve, reject };
}

function fakeRepository() {
    const invalidationCallbacks = new Set<() => void>();
    const list = vi.fn<() => Promise<ContactRecord[]>>();
    const unsubscribe = vi.fn();
    const subscribe = vi.fn((callback: () => void) => {
        invalidationCallbacks.add(callback);

        return () => {
            invalidationCallbacks.delete(callback);
            unsubscribe();
        };
    });
    const unexpected = async (): Promise<never> => {
        throw new Error('Operazione non prevista dal test.');
    };
    const repository: ContactRepository = {
        list,
        getById: unexpected,
        create: unexpected,
        update: unexpected,
        archive: unexpected,
        canDelete: unexpected,
        delete: unexpected,
        subscribe,
    };

    return {
        repository,
        list,
        subscribe,
        unsubscribe,
        emitInvalidation: () => {
            invalidationCallbacks.forEach((callback) => callback());
        },
    };
}

describe('contact list store', () => {
    it('carica la lista iniziale e pubblica snapshot stabili', async () => {
        const fake = fakeRepository();
        const pending = deferred<ContactRecord[]>();
        const repositoryContacts = [contact('contact-1'), contact('contact-2')];
        fake.list.mockReturnValueOnce(pending.promise);
        const store = createContactListStore(fake.repository);
        const listener = vi.fn();
        store.subscribe(listener);
        const initialSnapshot = store.getSnapshot();

        expect(store.getSnapshot()).toBe(initialSnapshot);
        const disconnect = store.connect();

        expect(fake.subscribe).toHaveBeenCalledTimes(1);
        expect(fake.list).toHaveBeenCalledTimes(1);
        expect(store.getSnapshot()).toEqual({
            contacts: [],
            status: 'loading',
            error: null,
        });
        expect(listener).toHaveBeenCalledTimes(1);

        pending.resolve(repositoryContacts);
        await pending.promise;
        await Promise.resolve();

        expect(store.getSnapshot().status).toBe('ready');
        expect(store.getSnapshot().error).toBeNull();
        expect(store.getSnapshot().contacts).toEqual(repositoryContacts);
        expect(store.getSnapshot().contacts).not.toBe(repositoryContacts);
        expect(listener).toHaveBeenCalledTimes(2);
        expect(store.getSnapshot()).toBe(store.getSnapshot());
        disconnect();
    });

    it('ricarica la lista dopo una invalidazione', async () => {
        const fake = fakeRepository();
        const initial = deferred<ContactRecord[]>();
        const updated = deferred<ContactRecord[]>();
        fake.list
            .mockReturnValueOnce(initial.promise)
            .mockReturnValueOnce(updated.promise);
        const store = createContactListStore(fake.repository);
        const listener = vi.fn();
        store.subscribe(listener);
        const disconnect = store.connect();
        initial.resolve([contact('contact-1')]);
        await initial.promise;
        await Promise.resolve();
        const notificationsBeforeRead = listener.mock.calls.length;

        store.getSnapshot();
        expect(listener).toHaveBeenCalledTimes(notificationsBeforeRead);
        fake.emitInvalidation();
        expect(fake.list).toHaveBeenCalledTimes(2);
        updated.resolve([contact('contact-2')]);
        await updated.promise;
        await Promise.resolve();

        expect(store.getSnapshot().status).toBe('ready');
        expect(store.getSnapshot().contacts).toEqual([
            contact('contact-2'),
        ]);
        expect(listener.mock.calls.length)
            .toBeGreaterThan(notificationsBeforeRead);
        disconnect();
    });

    it('mantiene una sola subscription con connessioni multiple', async () => {
        const fake = fakeRepository();
        fake.list.mockResolvedValue([]);
        const store = createContactListStore(fake.repository);

        const disconnectOne = store.connect();
        const disconnectTwo = store.connect();
        expect(fake.subscribe).toHaveBeenCalledTimes(1);
        expect(fake.list).toHaveBeenCalledTimes(1);

        disconnectOne();
        fake.emitInvalidation();
        expect(fake.list).toHaveBeenCalledTimes(2);

        disconnectTwo();
        expect(fake.unsubscribe).toHaveBeenCalledTimes(1);
        fake.emitInvalidation();
        expect(fake.list).toHaveBeenCalledTimes(2);

        disconnectOne();
        disconnectTwo();
        expect(fake.unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('preserva la lista precedente quando il caricamento fallisce', async () => {
        const fake = fakeRepository();
        fake.list
            .mockResolvedValueOnce([contact('contact-1')])
            .mockRejectedValueOnce(new Error('Errore contatti'))
            .mockRejectedValueOnce('');
        const store = createContactListStore(fake.repository);
        const disconnect = store.connect();
        await Promise.resolve();
        await Promise.resolve();
        const previousContacts = store.getSnapshot().contacts;

        fake.emitInvalidation();
        await Promise.resolve();
        await Promise.resolve();
        expect(store.getSnapshot()).toEqual({
            contacts: previousContacts,
            status: 'error',
            error: 'Errore contatti',
        });

        fake.emitInvalidation();
        await Promise.resolve();
        await Promise.resolve();
        expect(store.getSnapshot()).toEqual({
            contacts: previousContacts,
            status: 'error',
            error: 'Non è stato possibile caricare i contatti.',
        });
        disconnect();
    });

    it('ignora una risposta obsoleta terminata fuori ordine', async () => {
        const fake = fakeRepository();
        fake.list.mockResolvedValueOnce([]);
        const store = createContactListStore(fake.repository);
        const disconnect = store.connect();
        await Promise.resolve();
        await Promise.resolve();
        const refreshA = deferred<ContactRecord[]>();
        const refreshB = deferred<ContactRecord[]>();
        fake.list
            .mockReturnValueOnce(refreshA.promise)
            .mockReturnValueOnce(refreshB.promise);

        const pendingA = store.refresh();
        const pendingB = store.refresh();
        refreshB.resolve([contact('contact-b')]);
        await pendingB;
        refreshA.resolve([contact('contact-a')]);
        await pendingA;

        expect(store.getSnapshot().contacts).toEqual([
            contact('contact-b'),
        ]);
        expect(store.getSnapshot().status).toBe('ready');
        disconnect();
    });

    it('ignora richieste pendenti dopo disconnect e si riconnette', async () => {
        const fake = fakeRepository();
        const stale = deferred<ContactRecord[]>();
        const current = deferred<ContactRecord[]>();
        fake.list
            .mockReturnValueOnce(stale.promise)
            .mockReturnValueOnce(current.promise);
        const store = createContactListStore(fake.repository);

        const disconnect = store.connect();
        const loadingSnapshot = store.getSnapshot();
        disconnect();
        stale.resolve([contact('contact-stale')]);
        await stale.promise;
        await Promise.resolve();

        expect(store.getSnapshot()).toBe(loadingSnapshot);
        expect(fake.unsubscribe).toHaveBeenCalledTimes(1);
        fake.emitInvalidation();
        expect(fake.list).toHaveBeenCalledTimes(1);

        const disconnectAgain = store.connect();
        current.resolve([contact('contact-current')]);
        await current.promise;
        await Promise.resolve();

        expect(store.getSnapshot()).toEqual({
            contacts: [contact('contact-current')],
            status: 'ready',
            error: null,
        });
        expect(fake.subscribe).toHaveBeenCalledTimes(2);
        disconnectAgain();
    });
});
