import {
    useEffect,
    useMemo,
    useSyncExternalStore,
} from 'react';

import { useContactRepository } from './ContactRepositoryContext';
import {
    createContactListStore,
    type ContactListSnapshot,
} from './contactListStore';

export interface UseContactListResult
    extends ContactListSnapshot {
    refresh(): Promise<void>;
}

export function useContactList(): UseContactListResult {
    const repository = useContactRepository();
    const store = useMemo(
        () => createContactListStore(repository),
        [repository],
    );

    useEffect(
        () => store.connect(),
        [store],
    );

    const snapshot = useSyncExternalStore(
        store.subscribe,
        store.getSnapshot,
        store.getSnapshot,
    );

    return useMemo(
        () => ({
            ...snapshot,
            refresh: store.refresh,
        }),
        [snapshot, store],
    );
}
