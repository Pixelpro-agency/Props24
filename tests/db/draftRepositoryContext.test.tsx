// @vitest-environment jsdom

import React, { StrictMode, useEffect } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DraftRepository } from '../../src/db/draftRepository.port';
import { createLocalDraftRepository } from '../../src/db/localDraftRepository';
import {
    createDraftRepositoryContextValue,
    DraftRepositoryProvider,
    useDraftRepository,
} from '../../src/drafts/DraftRepositoryContext';

vi.mock('../../src/db/localDraftRepository', () => ({
    createLocalDraftRepository: vi.fn(),
}));

const createRepository = () => ({
    get: vi.fn(),
    list: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
}) satisfies DraftRepository;

const mockedCreateLocalDraftRepository = vi.mocked(
    createLocalDraftRepository,
);

function Consumer({
    onRepository,
}: {
    onRepository?: (repository: DraftRepository) => void;
}) {
    const repository = useDraftRepository();

    useEffect(() => {
        onRepository?.(repository);
    }, [onRepository, repository]);

    return <div data-testid="consumer">ready</div>;
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('DraftRepositoryContext', () => {
    it('compone la factory locale con l’account esatto', () => {
        const repository = createRepository();
        mockedCreateLocalDraftRepository.mockReturnValue(repository);

        expect(createDraftRepositoryContextValue('account-1')).toBe(repository);
        expect(mockedCreateLocalDraftRepository)
            .toHaveBeenCalledWith({ accountId: 'account-1' });
    });

    it('espone una stessa istanza finché l’account non cambia', () => {
        const first = createRepository();
        const second = createRepository();
        mockedCreateLocalDraftRepository
            .mockReturnValueOnce(first)
            .mockReturnValueOnce(second);
        const seen: DraftRepository[] = [];
        const view = render(
            <DraftRepositoryProvider accountId="account-1">
                <Consumer onRepository={(repository) => seen.push(repository)} />
            </DraftRepositoryProvider>,
        );

        expect(screen.getByTestId('consumer')).toBeTruthy();
        expect(seen.at(-1)).toBe(first);
        view.rerender(
            <DraftRepositoryProvider accountId="account-1">
                <Consumer onRepository={(repository) => seen.push(repository)} />
            </DraftRepositoryProvider>,
        );
        expect(seen.at(-1)).toBe(first);
        expect(mockedCreateLocalDraftRepository).toHaveBeenCalledTimes(1);

        view.rerender(
            <DraftRepositoryProvider accountId="account-2">
                <Consumer onRepository={(repository) => seen.push(repository)} />
            </DraftRepositoryProvider>,
        );
        expect(seen.at(-1)).toBe(second);
        expect(seen.at(-1)).not.toBe(first);
        expect(mockedCreateLocalDraftRepository)
            .toHaveBeenLastCalledWith({ accountId: 'account-2' });
    });

    it('non invoca operazioni repository automaticamente', () => {
        const repository = createRepository();
        mockedCreateLocalDraftRepository.mockReturnValue(repository);

        render(
            <DraftRepositoryProvider accountId="account-1">
                <Consumer />
            </DraftRepositoryProvider>,
        );

        expect(repository.get).not.toHaveBeenCalled();
        expect(repository.list).not.toHaveBeenCalled();
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('fallisce chiaramente fuori dal provider', () => {
        expect(() => render(<Consumer />)).toThrow(
            'useDraftRepository deve essere utilizzato all’interno di DraftRepositoryProvider.',
        );
    });

    it('resta utilizzabile sotto React Strict Mode', () => {
        mockedCreateLocalDraftRepository.mockImplementation(createRepository);

        render(
            <StrictMode>
                <DraftRepositoryProvider accountId="account-1">
                    <Consumer />
                </DraftRepositoryProvider>
            </StrictMode>,
        );

        expect(screen.getByTestId('consumer')).toBeTruthy();
        const lastRepository = mockedCreateLocalDraftRepository.mock.results
            .at(-1)?.value;
        expect(lastRepository?.get).not.toHaveBeenCalled();
        expect(lastRepository?.save).not.toHaveBeenCalled();
    });
});
