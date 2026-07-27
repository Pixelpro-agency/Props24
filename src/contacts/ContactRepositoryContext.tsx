import {
    createContext,
    useContext,
    useMemo,
    type PropsWithChildren,
} from 'react';

import type { ContactRepository } from '../db/contactRepository.port';
import { createLocalContactRepository } from '../db/localContactRepository';

const ContactRepositoryContext =
    createContext<ContactRepository | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function createContactRepositoryContextValue(
    accountId: string,
): ContactRepository {
    return createLocalContactRepository({ accountId });
}

export interface ContactRepositoryProviderProps
    extends PropsWithChildren {
    accountId: string;
}

export function ContactRepositoryProvider({
    accountId,
    children,
}: ContactRepositoryProviderProps) {
    const repository = useMemo(
        () => createContactRepositoryContextValue(accountId),
        [accountId],
    );

    return (
        <ContactRepositoryContext.Provider value={repository}>
            {children}
        </ContactRepositoryContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useContactRepository(): ContactRepository {
    const repository = useContext(ContactRepositoryContext);

    if (!repository) {
        throw new Error(
            'useContactRepository deve essere utilizzato all’interno di ContactRepositoryProvider.',
        );
    }

    return repository;
}
