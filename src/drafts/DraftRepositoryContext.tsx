import {
    createContext,
    useContext,
    useMemo,
    type PropsWithChildren,
} from 'react';

import type { DraftRepository } from '../db/draftRepository.port';
import { createLocalDraftRepository } from '../db/localDraftRepository';

const DraftRepositoryContext = createContext<DraftRepository | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function createDraftRepositoryContextValue(
    accountId: string,
): DraftRepository {
    return createLocalDraftRepository({ accountId });
}

export interface DraftRepositoryProviderProps extends PropsWithChildren {
    accountId: string;
}

export function DraftRepositoryProvider({
    accountId,
    children,
}: DraftRepositoryProviderProps) {
    const repository = useMemo(
        () => createDraftRepositoryContextValue(accountId),
        [accountId],
    );

    return (
        <DraftRepositoryContext.Provider value={repository}>
            {children}
        </DraftRepositoryContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDraftRepository(): DraftRepository {
    const repository = useContext(DraftRepositoryContext);

    if (!repository) {
        throw new Error(
            'useDraftRepository deve essere utilizzato all’interno di DraftRepositoryProvider.',
        );
    }

    return repository;
}
