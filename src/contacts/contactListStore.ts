import type { ContactRepository } from '../db/contactRepository.port';
import type { ContactRecord } from '../db/database.types';

export type ContactListStatus =
    | 'idle'
    | 'loading'
    | 'ready'
    | 'error';

export interface ContactListSnapshot {
    contacts: ContactRecord[];
    status: ContactListStatus;
    error: string | null;
}

export interface ContactListStore {
    getSnapshot(): ContactListSnapshot;
    subscribe(listener: () => void): () => void;
    connect(): () => void;
    refresh(): Promise<void>;
}

const LOAD_ERROR_FALLBACK =
    'Non è stato possibile caricare i contatti.';

function errorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return LOAD_ERROR_FALLBACK;
}

export function createContactListStore(
    repository: ContactRepository,
): ContactListStore {
    let snapshot: ContactListSnapshot = {
        contacts: [],
        status: 'idle',
        error: null,
    };
    const listeners = new Set<() => void>();
    let connectionCount = 0;
    let repositoryUnsubscribe: (() => void) | null = null;
    let lifecycleId = 0;
    let latestRequestId = 0;

    const publish = (nextSnapshot: ContactListSnapshot): void => {
        if (
            snapshot.contacts === nextSnapshot.contacts &&
            snapshot.status === nextSnapshot.status &&
            snapshot.error === nextSnapshot.error
        ) {
            return;
        }

        snapshot = nextSnapshot;
        listeners.forEach((listener) => listener());
    };

    const getSnapshot = (): ContactListSnapshot => snapshot;

    const subscribe = (listener: () => void): (() => void) => {
        listeners.add(listener);

        return () => {
            listeners.delete(listener);
        };
    };

    const refresh = async (): Promise<void> => {
        const requestId = ++latestRequestId;
        const requestLifecycleId = lifecycleId;

        publish({
            contacts: snapshot.contacts,
            status: 'loading',
            error: null,
        });

        try {
            const contacts = await repository.list();

            if (
                requestId !== latestRequestId ||
                requestLifecycleId !== lifecycleId ||
                connectionCount === 0
            ) {
                return;
            }

            publish({
                contacts: [...contacts],
                status: 'ready',
                error: null,
            });
        } catch (error) {
            if (
                requestId !== latestRequestId ||
                requestLifecycleId !== lifecycleId ||
                connectionCount === 0
            ) {
                return;
            }

            publish({
                contacts: snapshot.contacts,
                status: 'error',
                error: errorMessage(error),
            });
        }
    };

    const connect = (): (() => void) => {
        connectionCount += 1;

        if (connectionCount === 1) {
            lifecycleId += 1;
            repositoryUnsubscribe = repository.subscribe(() => {
                void refresh();
            });
            void refresh();
        }

        let disconnected = false;

        return () => {
            if (disconnected) {
                return;
            }

            disconnected = true;
            connectionCount -= 1;

            if (connectionCount === 0) {
                repositoryUnsubscribe?.();
                repositoryUnsubscribe = null;
                lifecycleId += 1;
                latestRequestId += 1;
            }
        };
    };

    return {
        getSnapshot,
        subscribe,
        connect,
        refresh,
    };
}
