// @vitest-environment jsdom

import React from 'react';
import {
    act,
    cleanup,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    DraftRecord,
    DraftRepository,
} from '../../src/db/draftRepository.port';
import {
    defaultTenantValues,
    type TenantFormData,
} from '../../src/components/tenant-form/schema';
import { NewTenantPage } from '../../src/pages/NewTenantPage';
import { createTenant } from '../../src/db/tenantRepository';
import { clearDraft } from '../../src/db/jsonDb';

let repository: DraftRepository;

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

vi.mock('../../src/drafts/DraftRepositoryContext', () => ({
    useDraftRepository: () => repository,
}));

vi.mock('../../src/db/tenantRepository', () => ({
    createTenant: vi.fn(() => ({ id: 'tenant-created' })),
}));

vi.mock('../../src/db/jsonDb', () => ({
    clearDraft: vi.fn(),
}));

vi.mock('../../src/components/tenant-form/TenantFormTabs', () => ({
    TENANT_TABS: [{ id: 'info1', label: 'Generale' }],
    TenantFormTabs: () => <div data-testid="tabs">tabs</div>,
}));

vi.mock('../../src/components/tenant-form/tabs/Tab1General', () => ({
    Tab1General: () => {
        const { register } = useFormContext<TenantFormData>();
        return (
            <>
                <label>
                    Nome
                    <input aria-label="Nome" {...register('TenantFirstName')} />
                </label>
                <label>
                    Cognome
                    <input aria-label="Cognome" {...register('TenantLastName')} />
                </label>
                <label>
                    Email
                    <input aria-label="Email" {...register('TenantEmail')} />
                </label>
            </>
        );
    },
}));
vi.mock('../../src/components/tenant-form/tabs/Tab2Additional', () => ({
    Tab2Additional: () => <div>additional</div>,
}));
vi.mock('../../src/components/tenant-form/tabs/Tab3Guarantors', () => ({
    Tab3Guarantors: () => <div>guarantors</div>,
}));
vi.mock('../../src/components/tenant-form/tabs/Tab4Emergency', () => ({
    Tab4Emergency: () => <div>emergency</div>,
}));
vi.mock('../../src/components/tenant-form/tabs/Tab5Documents', () => ({
    Tab5Documents: () => <div>documents</div>,
}));

function draftRecord(
    payload: Partial<TenantFormData>,
): DraftRecord<TenantFormData> {
    return {
        id: 'draft-1',
        accountId: 'account-1',
        formType: 'tenant',
        mode: 'create',
        entityId: null,
        payload: { ...defaultTenantValues, ...payload } as TenantFormData,
        schemaVersion: 1,
        createdAt: '2026-07-29T00:00:00.000Z',
        updatedAt: '2026-07-29T00:00:00.000Z',
    };
}

function makeRepository(
    result: DraftRecord<TenantFormData> | null,
): DraftRepository {
    return {
        get: vi.fn().mockResolvedValue(result),
        list: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation(async (_definition, input) => (
            draftRecord(input.payload as TenantFormData)
        )),
        delete: vi.fn().mockResolvedValue(true),
    };
}

function renderPage(entries = ['/tenants/new']) {
    return render(
        <MemoryRouter initialEntries={entries}>
            <Routes>
                <Route path="/previous" element={<div>previous</div>} />
                <Route path="/tenants" element={<div>tenant list</div>} />
                <Route path="/tenants/new" element={<NewTenantPage />} />
                <Route
                    path="/tenants/:id"
                    element={<div>tenant detail</div>}
                />
            </Routes>
        </MemoryRouter>,
    );
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.history.replaceState(null, '');
});

describe('NewTenantPage draft integration', () => {
    it('blocca il form durante loading e apre vuoto senza bozza', async () => {
        const pending = deferred<null>();
        repository = makeRepository(null);
        vi.mocked(repository.get).mockReturnValue(pending.promise);
        renderPage();
        expect(screen.getByText('Caricamento bozza...')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Salva bozza' }))
            .toBeNull();
        const backButton = screen.getByRole('button', { name: 'Indietro' });
        expect((backButton as HTMLButtonElement).disabled).toBe(true);
        backButton.click();
        expect(screen.getByText('Nuovo inquilino')).toBeTruthy();
        pending.resolve(null);
        expect(await screen.findByRole('button', { name: 'Salva bozza' }))
            .toBeTruthy();
        await waitFor(() => expect(
            (screen.getByRole('button', {
                name: 'Indietro',
            }) as HTMLButtonElement).disabled,
        ).toBe(false));
        expect(screen.getByTestId('tabs')).toBeTruthy();
    });

    it('mostra la scelta, riprende e rende visibili i valori', async () => {
        repository = makeRepository(draftRecord({
            TenantFirstName: 'Ada',
            TenantLastName: 'Lovelace',
        }));
        const user = userEvent.setup();
        renderPage();
        expect(await screen.findByText('Bozza inquilino disponibile'))
            .toBeTruthy();
        expect(screen.queryByLabelText('Nome')).toBeNull();
        await user.click(screen.getByRole('button', { name: 'Riprendi bozza' }));
        expect(await screen.findByDisplayValue('Ada')).toBeTruthy();
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('elimina e ricomincia senza autosave', async () => {
        repository = makeRepository(draftRecord({ TenantFirstName: 'Ada' }));
        const user = userEvent.setup();
        renderPage();
        await user.click(await screen.findByRole('button', {
            name: 'Elimina e ricomincia',
        }));
        expect((await screen.findByLabelText('Nome') as HTMLInputElement).value)
            .toBe('');
        expect(repository.delete).toHaveBeenCalledOnce();
        await user.type(screen.getByLabelText('Nome'), 'Nuovo');
        await new Promise((resolve) => window.setTimeout(resolve, 600));
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('Annulla usa history precedente o fallback /tenants', async () => {
        repository = makeRepository(draftRecord({}));
        const user = userEvent.setup();
        window.history.replaceState({ idx: 1 }, '');
        renderPage(['/previous', '/tenants/new']);
        await user.click(await screen.findByRole('button', { name: 'Annulla' }));
        expect(await screen.findByText('previous')).toBeTruthy();

        cleanup();
        repository = makeRepository(draftRecord({}));
        window.history.replaceState(null, '');
        renderPage();
        await user.click(await screen.findByRole('button', { name: 'Annulla' }));
        expect(await screen.findByText('tenant list')).toBeTruthy();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('salva manualmente form incompleto e mostra un solo feedback', async () => {
        repository = makeRepository(null);
        const user = userEvent.setup();
        renderPage();
        await user.type(await screen.findByLabelText('Nome'), 'Parziale');
        await user.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await waitFor(() => expect(repository.save).toHaveBeenCalledOnce());
        expect(screen.getAllByRole('status')).toHaveLength(1);
        expect(screen.getByText('Bozza salvata.')).toBeTruthy();
        expect(vi.mocked(repository.save).mock.calls[0]?.[1].payload)
            .not.toHaveProperty('activeTab');
    });

    it('blocca header e azioni mentre il salvataggio bozza è pending', async () => {
        const savePending = deferred<DraftRecord<TenantFormData>>();
        repository = makeRepository(null);
        vi.mocked(repository.save).mockReturnValue(savePending.promise);
        const user = userEvent.setup();
        renderPage();
        await user.type(await screen.findByLabelText('Nome'), 'Parziale');
        await user.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await waitFor(() => expect(repository.save).toHaveBeenCalledOnce());

        const backButton = screen.getByRole('button', { name: 'Indietro' });
        expect((backButton as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole('button', {
            name: 'Salvataggio bozza...',
        }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole('button', {
            name: 'Annulla',
        }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole('button', {
            name: 'Salva',
        }) as HTMLButtonElement).disabled).toBe(true);
        backButton.click();
        expect(screen.getByText('Nuovo inquilino')).toBeTruthy();

        await act(async () => {
            savePending.resolve(draftRecord({ TenantFirstName: 'Parziale' }));
            await savePending.promise;
        });

        await waitFor(() => expect(
            (screen.getByRole('button', {
                name: 'Indietro',
            }) as HTMLButtonElement).disabled,
        ).toBe(false));
        expect(screen.getByText('Nuovo inquilino')).toBeTruthy();
        expect(screen.getAllByText('Bozza salvata.')).toHaveLength(1);
    });

    it('mantiene submit definitivo e pulizia legacy solo su successo', async () => {
        repository = makeRepository(null);
        const user = userEvent.setup();
        renderPage();
        await user.type(await screen.findByLabelText('Nome'), 'Ada');
        await user.type(screen.getByLabelText('Cognome'), 'Lovelace');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(await screen.findByText('tenant detail')).toBeTruthy();
        expect(createTenant).toHaveBeenCalledOnce();
        expect(clearDraft).toHaveBeenCalledWith('tenantForm');
    });

    it('su submit fallito conserva form e non pulisce la bozza', async () => {
        repository = makeRepository(null);
        vi.mocked(createTenant).mockImplementationOnce(() => {
            throw new Error('Creazione fallita');
        });
        const user = userEvent.setup();
        renderPage();
        await user.type(await screen.findByLabelText('Nome'), 'Ada');
        await user.type(screen.getByLabelText('Cognome'), 'Lovelace');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(await screen.findByText('Creazione fallita')).toBeTruthy();
        expect(screen.getByDisplayValue('Ada')).toBeTruthy();
        expect(clearDraft).not.toHaveBeenCalled();
    });
});
