// @vitest-environment jsdom

import React, {
    StrictMode,
    useEffect,
    useMemo,
} from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, useWatch } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    DraftRecord,
    DraftRepository,
} from '../../src/db/draftRepository.port';
import {
    DraftCorruptedError,
    DraftStorageError,
    DraftStorageQuotaError,
} from '../../src/db/databaseErrors';
import {
    defaultTenantValues,
    type TenantFormData,
} from '../../src/components/tenant-form/schema';
import { useTenantDraftController } from '../../src/components/tenant-form/hooks/useTenantDraftController';
import type { TenantDraftController } from '../../src/components/tenant-form/hooks/useTenantDraftController';

let repository: DraftRepository;

vi.mock('../../src/drafts/DraftRepositoryContext', () => ({
    useDraftRepository: () => repository,
}));

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function draftRecord(payload: Partial<TenantFormData>): DraftRecord<TenantFormData> {
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

function editDraftRecord(entityId: string, payload: Partial<TenantFormData>): DraftRecord<TenantFormData> {
    return { ...draftRecord(payload), id: `draft-${entityId}`, mode: 'edit', entityId };
}

function makeRepository(
    getResult: DraftRecord<TenantFormData> | null = null,
): DraftRepository {
    return {
        get: vi.fn().mockResolvedValue(getResult),
        list: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation(async (_definition, input) => (
            draftRecord(input.payload as TenantFormData)
        )),
        delete: vi.fn().mockResolvedValue(true),
    };
}

interface HarnessProps {
    onPhaseChange?: (phase: string) => void;
    onReset?: () => void;
    onController?: (controller: TenantDraftController) => void;
    initialState?: TenantFormData;
    target?: { mode: 'create'; entityId: null } | { mode: 'edit'; entityId: string };
}

function Harness({
    onPhaseChange,
    onReset,
    onController,
    initialState = defaultTenantValues,
    target = { mode: 'create', entityId: null },
}: HarnessProps = {}) {
    const methods = useForm<TenantFormData>({
        defaultValues: initialState,
    });
    const controllerMethods = useMemo(() => ({
        ...methods,
        reset: (...args: Parameters<typeof methods.reset>) => {
            onReset?.();
            return methods.reset(...args);
        },
    }), [methods, onReset]);
    const controller = useTenantDraftController(controllerMethods, undefined, { initialState, target });
    const firstName = useWatch({
        control: methods.control,
        name: 'TenantFirstName',
    });
    const email = useWatch({ control: methods.control, name: 'TenantEmail' });
    const iban = useWatch({ control: methods.control, name: 'TenantBankIBAN' });
    const bic = useWatch({
        control: methods.control,
        name: 'TenantBankSwiftBic',
    });

    useEffect(() => {
        onPhaseChange?.(controller.phase);
    }, [controller.phase, onPhaseChange]);

    useEffect(() => {
        onController?.(controller);
    }, [controller, onController]);

    return (
        <div>
            <span data-testid="phase">{controller.phase}</span>
            <span data-testid="dirty">{String(methods.formState.isDirty)}</span>
            <span data-testid="deleting">
                {String(controller.isDeletingDraft)}
            </span>
            <span data-testid="first-name">{firstName}</span>
            <span data-testid="email">{email}</span>
            <span data-testid="iban">{iban}</span>
            <span data-testid="bic">{bic}</span>
            <span data-testid="error">
                {controller.loadError || controller.operationError || controller.draftError}
            </span>
            <button
                type="button"
                onClick={() => methods.setValue(
                    'TenantFirstName',
                    'Modificato',
                    { shouldDirty: true },
                )}
            >
                modifica
            </button>
            <button
                type="button"
                onClick={() => methods.setValue(
                    'TenantFirstName',
                    'Alternativo',
                    { shouldDirty: true },
                )}
            >
                modifica alternativa
            </button>
            <button
                type="button"
                onClick={() => methods.setValue(
                    'TenantEmail',
                    'non-valida',
                    { shouldDirty: true },
                )}
            >
                email invalida
            </button>
            <button
                type="button"
                onClick={() => methods.setValue(
                    'TenantBankIBAN',
                    'IT60$',
                    { shouldDirty: true },
                )}
            >
                iban invalido
            </button>
            <button
                type="button"
                onClick={() => methods.setValue(
                    'TenantBankSwiftBic',
                    'BIC!',
                    { shouldDirty: true },
                )}
            >
                bic invalido
            </button>
            <button type="button" onClick={controller.resumeDraft}>riprendi</button>
            <button
                type="button"
                onClick={() => void controller.deleteAndRestart()}
            >
                elimina
            </button>
            <button type="button" onClick={controller.retryLoad}>riprova</button>
            <button
                type="button"
                onClick={() => void controller.saveDraft()
                    .catch(() => undefined)}
            >
                salva
            </button>
            <button type="button" onClick={controller.discardChanges}>
                abbandona
            </button>
        </div>
    );
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('useTenantDraftController', () => {
    const tenantA = { ...defaultTenantValues, TenantFirstName: 'Persistita A' } as TenantFormData;

    it('usa lookup edit A, baseline persistita clean e nessun I/O implicito', async () => {
        repository = makeRepository(null);
        render(<Harness initialState={tenantA} target={{ mode: 'edit', entityId: 'tenant-A' }} />);
        await screen.findByText('ready');
        expect(repository.get).toHaveBeenCalledWith(expect.anything(), { mode: 'edit', entityId: 'tenant-A' });
        expect(screen.getByTestId('first-name').textContent).toBe('Persistita A');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('riprende, salva e scarta sull ultima baseline edit preservando nested IDs', async () => {
        const rich = editDraftRecord('tenant-A', { TenantFirstName: 'Bozza A', TenantGuarantors: [{ id: 'nested-id', contactId: 'contact-id', contactType: 'person', firstName: 'Nested' }] });
        repository = makeRepository(rich);
        const user = userEvent.setup();
        render(<Harness initialState={tenantA} target={{ mode: 'edit', entityId: 'tenant-A' }} />);
        await screen.findByText('choice_required');
        await user.click(screen.getByRole('button', { name: 'riprendi' }));
        expect(screen.getByTestId('first-name').textContent).toBe('Bozza A');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        await user.click(screen.getByRole('button', { name: 'modifica alternativa' }));
        await user.click(screen.getByRole('button', { name: 'salva' }));
        await waitFor(() => expect(repository.save).toHaveBeenCalledOnce());
        expect(vi.mocked(repository.save).mock.calls[0][1]).toMatchObject({ mode: 'edit', entityId: 'tenant-A', payload: { TenantFirstName: 'Alternativo', TenantGuarantors: [{ id: 'nested-id' }] } });
        await user.click(screen.getByRole('button', { name: 'modifica' }));
        await user.click(screen.getByRole('button', { name: 'abbandona' }));
        expect(screen.getByTestId('first-name').textContent).toBe('Alternativo');
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('deleteAndRestart elimina solo edit A e ripristina la baseline DB clean', async () => {
        repository = makeRepository(editDraftRecord('tenant-A', { TenantFirstName: 'Bozza A' }));
        render(<Harness initialState={tenantA} target={{ mode: 'edit', entityId: 'tenant-A' }} />);
        await screen.findByText('choice_required');
        await userEvent.click(screen.getByRole('button', { name: 'elimina' }));
        await screen.findByText('ready');
        expect(repository.delete).toHaveBeenCalledWith({ formType: 'tenant', mode: 'edit', entityId: 'tenant-A' });
        expect(screen.getByTestId('first-name').textContent).toBe('Persistita A');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
    });

    it('separa create da edit e tenant A da B tramite target identity', async () => {
        const get = vi.fn(async (_definition, lookup: { mode: string; entityId: string | null }) => lookup.mode === 'edit' && lookup.entityId === 'tenant-B' ? editDraftRecord('tenant-B', { TenantFirstName: 'Bozza B' }) : null);
        repository = { ...makeRepository(), get };
        const view = render(<Harness initialState={tenantA} target={{ mode: 'edit', entityId: 'tenant-A' }} />);
        await screen.findByText('ready');
        expect(screen.getByTestId('first-name').textContent).toBe('Persistita A');
        view.rerender(<Harness initialState={{ ...tenantA, TenantFirstName: 'Persistita B' }} target={{ mode: 'edit', entityId: 'tenant-B' }} />);
        await screen.findByText('choice_required');
        expect(get.mock.calls.map((call) => call[1])).toEqual([{ mode: 'edit', entityId: 'tenant-A' }, { mode: 'edit', entityId: 'tenant-B' }]);
    });

    it('ignora risposta stale edit A dopo passaggio a edit B', async () => {
        const pendingA = deferred<DraftRecord<TenantFormData> | null>();
        repository = makeRepository();
        vi.mocked(repository.get).mockImplementation((_definition, lookup) => lookup.entityId === 'tenant-A' ? pendingA.promise : Promise.resolve(null));
        const view = render(<Harness initialState={tenantA} target={{ mode: 'edit', entityId: 'tenant-A' }} />);
        view.rerender(<Harness initialState={{ ...tenantA, TenantFirstName: 'Persistita B' }} target={{ mode: 'edit', entityId: 'tenant-B' }} />);
        await screen.findByText('ready');
        pendingA.resolve(editDraftRecord('tenant-A', { TenantFirstName: 'Obsoleta A' }));
        await act(() => pendingA.promise);
        expect(screen.getByTestId('first-name').textContent).toBe('Persistita B');
    });
    it('resta loading finché get risolve, poi inizializza vuoto non dirty', async () => {
        const pending = deferred<DraftRecord<TenantFormData> | null>();
        repository = makeRepository();
        vi.mocked(repository.get).mockReturnValue(pending.promise);
        render(<Harness />);
        expect(screen.getByTestId('phase').textContent).toBe('loading');
        await act(() => {
            pending.resolve(null);
            return pending.promise;
        });
        expect(screen.getByTestId('phase').textContent).toBe('ready');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('richiede scelta senza reset anticipato e riprende senza I/O', async () => {
        repository = makeRepository(draftRecord({ TenantFirstName: 'Ada' }));
        const user = userEvent.setup();
        render(<Harness />);
        await waitFor(() => expect(
            screen.getByTestId('phase').textContent,
        ).toBe('choice_required'));
        expect(screen.getByTestId('first-name').textContent).toBe('');
        await user.click(screen.getByRole('button', { name: 'riprendi' }));
        expect(screen.getByTestId('first-name').textContent).toBe('Ada');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', {
            name: 'modifica alternativa',
        }));
        expect(screen.getByTestId('dirty').textContent).toBe('true');
    });

    it.each([true, false])(
        'elimina e ricomincia con risultato %s',
        async (deleted) => {
            repository = makeRepository(draftRecord({ TenantFirstName: 'Ada' }));
            vi.mocked(repository.delete).mockResolvedValue(deleted);
            const user = userEvent.setup();
            render(<Harness />);
            await screen.findByText('choice_required');
            await user.click(screen.getByRole('button', { name: 'elimina' }));
            await screen.findByText('ready');
            expect(repository.delete).toHaveBeenCalledWith({
                formType: 'tenant',
                mode: 'create',
                entityId: null,
            });
            expect(screen.getByTestId('first-name').textContent).toBe('');
            expect(screen.getByTestId('dirty').textContent).toBe('false');
        },
    );

    it('mantiene la scelta quando delete fallisce e permette retry', async () => {
        repository = makeRepository(draftRecord({ TenantFirstName: 'Ada' }));
        vi.mocked(repository.delete)
            .mockRejectedValueOnce(new DraftStorageError())
            .mockResolvedValueOnce(true);
        const user = userEvent.setup();
        render(<Harness />);
        await screen.findByText('choice_required');
        await user.click(screen.getByRole('button', { name: 'elimina' }));
        expect(await screen.findByText(
            'Impossibile eliminare la bozza. Riprova.',
        )).toBeTruthy();
        expect(screen.getByTestId('phase').textContent)
            .toBe('choice_required');
        await user.click(screen.getByRole('button', { name: 'elimina' }));
        await screen.findByText('ready');
    });

    it('mostra errore load, non sovrascrive e riprova', async () => {
        repository = makeRepository();
        vi.mocked(repository.get)
            .mockRejectedValueOnce(new DraftCorruptedError())
            .mockResolvedValueOnce(null);
        const user = userEvent.setup();
        render(<Harness />);
        await screen.findByText('load_error');
        expect(screen.getByTestId('error').textContent)
            .toContain('danneggiata');
        expect(repository.save).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'riprova' }));
        await screen.findByText('ready');
        expect(repository.get).toHaveBeenCalledTimes(2);
    });

    it('salva payload incompleto, aggiorna baseline ed esclude activeTab', async () => {
        repository = makeRepository();
        const user = userEvent.setup();
        render(<Harness />);
        await screen.findByText('ready');
        await user.click(screen.getByRole('button', {
            name: 'modifica alternativa',
        }));
        await user.click(screen.getByRole('button', { name: 'salva' }));
        await waitFor(() => expect(repository.save).toHaveBeenCalledTimes(1));
        const input = vi.mocked(repository.save).mock.calls[0]?.[1];
        expect(input?.mode).toBe('create');
        expect(input?.payload).not.toHaveProperty('activeTab');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        await user.click(screen.getByRole('button', { name: 'modifica' }));
        expect(screen.getByTestId('dirty').textContent).toBe('true');
        await user.click(screen.getByRole('button', { name: 'abbandona' }));
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('preserva valori e dirty su errore validazione, quota o storage', async () => {
        repository = makeRepository();
        vi.mocked(repository.save)
            .mockRejectedValueOnce(new DraftStorageQuotaError())
            .mockRejectedValueOnce(new DraftStorageError());
        const user = userEvent.setup();
        render(<Harness />);
        await screen.findByText('ready');
        await user.click(screen.getByRole('button', { name: 'modifica' }));
        await user.click(screen.getByRole('button', { name: 'salva' }));
        expect(await screen.findByText(/Spazio locale esaurito/)).toBeTruthy();
        expect(screen.getByTestId('dirty').textContent).toBe('true');
        await user.click(screen.getByRole('button', { name: 'salva' }));
        expect(await screen.findByText(/Impossibile salvare/)).toBeTruthy();
        expect(screen.getByTestId('dirty').textContent).toBe('true');
    });

    it('saveDraft fallito aggiorna feedback e rifiuta user-safe', async () => {
        let controller!: TenantDraftController;
        repository = makeRepository();
        vi.mocked(repository.save).mockRejectedValue(
            new DraftStorageQuotaError(),
        );
        render(<Harness onController={(value) => {
            controller = value;
        }} />);
        await screen.findByText('ready');
        await expect(controller.saveDraft()).rejects.toThrow(
            'Spazio locale esaurito',
        );
        await waitFor(() => expect(screen.getByTestId('error').textContent)
            .toContain('Spazio locale esaurito'));
    });

    it.each([
        ['email', 'email invalida', 'email', 'non-valida'],
        ['IBAN', 'iban invalido', 'iban', 'IT60$'],
        ['BIC', 'bic invalido', 'bic', 'BIC!'],
    ])(
        'rifiuta %s invalido con errore user-safe prima della write',
        async (_label, buttonName, testId, expectedValue) => {
        repository = makeRepository();
        const user = userEvent.setup();
        render(<Harness />);
        await screen.findByText('ready');
        await user.click(screen.getByRole('button', { name: buttonName }));
        await user.click(screen.getByRole('button', { name: 'salva' }));
        expect(repository.save).not.toHaveBeenCalled();
        expect(screen.getByTestId('dirty').textContent).toBe('true');
        expect(screen.getByTestId(testId).textContent).toBe(expectedValue);
        const message = screen.getByTestId('error').textContent ?? '';
        expect(message).toBe(
            'I dati della bozza non sono validi. Controlla i campi compilati.',
        );
        expect(message).not.toMatch(
            /invalid_format|validation|expected|path|issues|\[[{]/i,
        );
    });

    it('serializza doppi save', async () => {
        const savePending = deferred<DraftRecord<TenantFormData>>();
        repository = makeRepository();
        vi.mocked(repository.save).mockReturnValue(savePending.promise);
        const user = userEvent.setup();
        render(<Harness />);
        await screen.findByText('ready');
        await user.dblClick(screen.getByRole('button', { name: 'salva' }));
        expect(repository.save).toHaveBeenCalledTimes(1);
        await act(() => {
            savePending.resolve(draftRecord({}));
            return savePending.promise;
        });
    });

    it('serializza due delete concorrenti fino al reset finale', async () => {
        const deletePending = deferred<boolean>();
        const onReset = vi.fn();
        repository = makeRepository(draftRecord({ TenantFirstName: 'Ada' }));
        vi.mocked(repository.delete).mockReturnValue(deletePending.promise);
        render(<Harness onReset={onReset} />);
        await screen.findByText('choice_required');
        expect(onReset).not.toHaveBeenCalled();

        const deleteButton = screen.getByRole('button', { name: 'elimina' });
        act(() => {
            deleteButton.click();
            deleteButton.click();
        });

        expect(repository.delete).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('deleting').textContent).toBe('true');
        expect(screen.getByTestId('phase').textContent)
            .toBe('choice_required');
        expect(screen.getByTestId('first-name').textContent).toBe('');
        expect(onReset).not.toHaveBeenCalled();

        await act(() => {
            deletePending.resolve(true);
            return deletePending.promise;
        });

        expect(screen.getByTestId('phase').textContent).toBe('ready');
        expect(screen.getByTestId('first-name').textContent).toBe('');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(screen.getByTestId('deleting').textContent).toBe('false');
        expect(onReset).toHaveBeenCalledTimes(1);
    });

    it.each([true, false])(
        'deletePersistedDraft tratta %s come successo senza reset',
        async (deleted) => {
            let controller!: TenantDraftController;
            const onReset = vi.fn();
            repository = makeRepository();
            vi.mocked(repository.delete).mockResolvedValue(deleted);
            render(<Harness
                onReset={onReset}
                onController={(value) => {
                    controller = value;
                }}
            />);
            await screen.findByText('ready');
            onReset.mockClear();
            await controller.deletePersistedDraft();
            expect(repository.delete).toHaveBeenCalledWith({
                formType: 'tenant',
                mode: 'create',
                entityId: null,
            });
            expect(onReset).not.toHaveBeenCalled();
        },
    );

    it('serializza deletePersistedDraft e permette retry dopo errore', async () => {
        let controller!: TenantDraftController;
        const pending = deferred<boolean>();
        repository = makeRepository();
        vi.mocked(repository.delete)
            .mockReturnValueOnce(pending.promise)
            .mockRejectedValueOnce(new DraftStorageError())
            .mockResolvedValueOnce(true);
        render(<Harness onController={(value) => {
            controller = value;
        }} />);
        await screen.findByText('ready');
        const first = controller.deletePersistedDraft();
        const second = controller.deletePersistedDraft();
        expect(first).toBe(second);
        expect(repository.delete).toHaveBeenCalledTimes(1);
        pending.resolve(true);
        await first;
        await expect(controller.deletePersistedDraft())
            .rejects.toBeInstanceOf(DraftStorageError);
        await expect(controller.deletePersistedDraft()).resolves.toBeUndefined();
        expect(repository.delete).toHaveBeenCalledTimes(3);
    });

    it('esegue una sola lettura logica sotto Strict Mode', async () => {
        repository = makeRepository();
        render(<StrictMode><Harness /></StrictMode>);
        await screen.findByText('ready');
        expect(repository.get).toHaveBeenCalledTimes(1);
    });

    it('ignora la risposta obsoleta dopo cambio repository', async () => {
        const first = deferred<DraftRecord<TenantFormData> | null>();
        const firstRepository = makeRepository();
        vi.mocked(firstRepository.get).mockReturnValue(first.promise);
        repository = firstRepository;
        const view = render(<Harness />);
        const secondRepository = makeRepository(null);
        repository = secondRepository;
        view.rerender(<Harness />);
        await screen.findByText('ready');
        await act(() => {
            first.resolve(draftRecord({ TenantFirstName: 'Obsoleto' }));
            return first.promise;
        });
        expect(screen.getByTestId('first-name').textContent).toBe('');
        view.unmount();
    });

    it('ignora la risposta get risolta dopo unmount', async () => {
        const pending = deferred<DraftRecord<TenantFormData> | null>();
        const phases: string[] = [];
        const onPhaseChange = vi.fn((phase: string) => phases.push(phase));
        const onReset = vi.fn();
        repository = makeRepository();
        vi.mocked(repository.get).mockReturnValue(pending.promise);
        const view = render(
            <Harness onPhaseChange={onPhaseChange} onReset={onReset} />,
        );
        expect(screen.getByTestId('phase').textContent).toBe('loading');
        expect(phases).toEqual(['loading']);

        view.unmount();
        await act(() => {
            pending.resolve(draftRecord({ TenantFirstName: 'Tardivo' }));
            return pending.promise;
        });

        expect(phases).toEqual(['loading']);
        expect(onReset).not.toHaveBeenCalled();
    });
});
