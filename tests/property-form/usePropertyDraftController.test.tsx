// @vitest-environment jsdom

import React, { StrictMode, useEffect, useMemo } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    DraftCorruptedError,
    DraftMigrationError,
    DraftStorageError,
    DraftStorageQuotaError,
} from '../../src/db/databaseErrors';
import type {
    DraftRecord,
    DraftRepository,
} from '../../src/db/draftRepository.port';
import {
    defaultPropertyFormStateValues,
    type PropertyFormState,
} from '../../src/components/property-form/schema';
import {
    usePropertyDraftController,
    type PropertyDraftController,
} from '../../src/components/property-form/hooks/usePropertyDraftController';
import { propertyDraftDefinition } from '../../src/components/property-form/propertyDraftDefinition';

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

const file = {
    id: 'file-1',
    name: 'allegato.pdf',
    type: 'application/pdf',
    size: 120,
    lastModified: 1,
    dataUrl: 'data:application/pdf;base64,AA==',
};

function record(
    payload: Partial<PropertyFormState> = {},
): DraftRecord<PropertyFormState> {
    return {
        id: 'draft-1',
        accountId: 'account-1',
        formType: 'property',
        mode: 'create',
        entityId: null,
        payload: { ...defaultPropertyFormStateValues, ...payload } as PropertyFormState,
        schemaVersion: 2,
        createdAt: '2026-07-29T00:00:00.000Z',
        updatedAt: '2026-07-29T00:00:00.000Z',
    };
}

function legacyRecordV1(
    payload: Partial<PropertyFormState> = {},
): DraftRecord<PropertyFormState> {
    const { PropertyBuildingId: _ignored, ...legacyPayload } = {
        ...defaultPropertyFormStateValues,
        ...payload,
    };
    void _ignored;
    return {
        ...record(),
        payload: propertyDraftDefinition.parse(legacyPayload, 1),
        schemaVersion: 1,
    };
}

function makeRepository(
    draft: DraftRecord<PropertyFormState> | null = null,
): DraftRepository {
    return {
        get: vi.fn().mockResolvedValue(draft),
        list: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation(async (_definition, input) => (
            record(input.payload as PropertyFormState)
        )),
        delete: vi.fn().mockResolvedValue(true),
    };
}

function Harness({
    onController,
    onReset,
    onMethods,
    repositoryOverride,
}: {
    onController?: (value: PropertyDraftController) => void;
    onReset?: () => void;
    onMethods?: (value: UseFormReturn<PropertyFormState>) => void;
    repositoryOverride?: DraftRepository;
}) {
    const methods = useForm<PropertyFormState>({
        defaultValues: defaultPropertyFormStateValues,
    });
    const controllerMethods = useMemo(() => ({
        ...methods,
        reset: (...args: Parameters<typeof methods.reset>) => {
            onReset?.();
            return methods.reset(...args);
        },
    }), [methods, onReset]);
    const controller = usePropertyDraftController(
        controllerMethods,
        repositoryOverride,
    );
    const title = useWatch({ control: methods.control, name: 'PropertyTitle' });
    const photos = useWatch({ control: methods.control, name: 'PropertyPhotos' });
    const buildingId = useWatch({ control: methods.control, name: 'PropertyBuildingId' });

    useEffect(() => onController?.(controller), [controller, onController]);
    useEffect(() => onMethods?.(methods), [methods, onMethods]);

    return (
        <>
            <output data-testid="phase">{controller.phase}</output>
            <output data-testid="dirty">{String(methods.formState.isDirty)}</output>
            <output data-testid="saving">{String(controller.isSavingDraft)}</output>
            <output data-testid="deleting">{String(controller.isDeletingDraft)}</output>
            <output data-testid="title">{title}</output>
            <output data-testid="photos">{photos?.length ?? 0}</output>
            <output data-testid="building">{buildingId}</output>
            <output data-testid="load-error">{controller.loadError}</output>
            <output data-testid="operation-error">{controller.operationError}</output>
            <output data-testid="draft-error">{controller.draftError}</output>
            <output data-testid="success">{controller.draftSuccess}</output>
            <button onClick={() => methods.setValue(
                'PropertyTitle',
                'Modificato',
                { shouldDirty: true },
            )}>modifica</button>
            <button onClick={() => methods.setValue(
                'PropertyPhotos',
                [file],
                { shouldDirty: true },
            )}>allegato</button>
            <button onClick={() => methods.setValue(
                'PropertyBuildingId',
                'building-a',
                { shouldDirty: true },
            )}>building a</button>
            <button onClick={() => methods.setValue(
                'PropertyBuildingId',
                'building-b',
                { shouldDirty: true },
            )}>building b</button>
            <button onClick={controller.resumeDraft}>riprendi</button>
            <button onClick={() => void controller.deleteAndRestart()}>
                elimina
            </button>
            <button onClick={controller.retryLoad}>riprova load</button>
            <button onClick={() => void controller.saveDraft()}>salva</button>
            <button onClick={controller.discardChanges}>abbandona</button>
            <button onClick={controller.clearDraftFeedback}>pulisci feedback</button>
        </>
    );
}

async function waitForCapturedController(
    readController: () => PropertyDraftController | undefined,
    expectedPhase: PropertyDraftController['phase'],
): Promise<PropertyDraftController> {
    await waitFor(() => {
        expect(readController()?.phase).toBe(expectedPhase);
    });
    const captured = readController();
    if (!captured) {
        throw new Error(
            'Controller non disponibile dopo la sincronizzazione.',
        );
    }
    return captured;
}

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe('usePropertyDraftController', () => {
    it('gestisce Building in dirty, save manuale e discard senza autosave', async () => {
        repository = makeRepository();
        render(<Harness />);
        await screen.findByText('ready');
        expect(screen.getByTestId('building').textContent).toBe('');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        await userEvent.click(screen.getByRole('button', { name: 'building a' }));
        expect(screen.getByTestId('dirty').textContent).toBe('true');
        expect(repository.save).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'salva' }));
        await screen.findByText('Bozza salvata.');
        expect(vi.mocked(repository.save).mock.calls[0][0]).toMatchObject({ schemaVersion: 2 });
        expect(vi.mocked(repository.save).mock.calls[0][1]).toMatchObject({ payload: { PropertyBuildingId: 'building-a' } });
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        await userEvent.click(screen.getByRole('button', { name: 'building b' }));
        expect(screen.getByTestId('building').textContent).toBe('building-b');
        await userEvent.click(screen.getByRole('button', { name: 'abbandona' }));
        expect(screen.getByTestId('building').textContent).toBe('building-a');
        expect(repository.save).toHaveBeenCalledOnce();
    });

    it('carica default clean senza autosalvataggio', async () => {
        repository = makeRepository();
        render(<Harness />);
        expect(screen.getByTestId('phase').textContent).toBe('loading');
        await screen.findByText('ready');
        expect(repository.get).toHaveBeenCalledOnce();
        expect(repository.get).toHaveBeenCalledWith(
            expect.objectContaining({ formType: 'property' }),
            { mode: 'create' },
        );
        expect(screen.getByTestId('title').textContent).toBe('');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        await userEvent.click(screen.getByRole('button', { name: 'modifica' }));
        await Promise.resolve();
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('richiede scelta e riprende una copia clean della bozza', async () => {
        repository = makeRepository(record({
            PropertyTitle: 'Persistita',
            PropertyPhotos: [file],
        }));
        render(<Harness />);
        await screen.findByText('choice_required');
        expect(screen.getByTestId('title').textContent).toBe('');
        await userEvent.click(screen.getByRole('button', { name: 'riprendi' }));
        expect(screen.getByTestId('title').textContent).toBe('Persistita');
        expect(screen.getByTestId('photos').textContent).toBe('1');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('riprende Building da una bozza v2 senza write', async () => {
        repository = makeRepository(record({ PropertyBuildingId: 'building-a' }));
        render(<Harness />);
        await screen.findByText('choice_required');
        await userEvent.click(screen.getByRole('button', { name: 'riprendi' }));
        expect(screen.getByTestId('building').textContent).toBe('building-a');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('riprende legacy v1 senza autosave e la aggiorna a v2 solo su save esplicito', async () => {
        repository = makeRepository(legacyRecordV1({ PropertyTitle: 'Legacy' }));
        render(<Harness />);
        await screen.findByText('choice_required');
        await userEvent.click(screen.getByRole('button', { name: 'riprendi' }));
        expect(screen.getByTestId('building').textContent).toBe('');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'salva' }));
        await screen.findByText('Bozza salvata.');
        expect(repository.save).toHaveBeenCalledOnce();
        expect(vi.mocked(repository.save).mock.calls[0][0]).toMatchObject({ schemaVersion: 2 });
        expect(vi.mocked(repository.save).mock.calls[0][1]).toMatchObject({ payload: { PropertyBuildingId: '' } });
    });

    it('elimina una bozza v2 Building e riparte vuoto senza save', async () => {
        repository = makeRepository(record({ PropertyBuildingId: 'building-a' }));
        render(<Harness />);
        await screen.findByText('choice_required');
        await userEvent.click(screen.getByRole('button', { name: 'elimina' }));
        await screen.findByText('ready');
        expect(screen.getByTestId('building').textContent).toBe('');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.delete).toHaveBeenCalledOnce();
        expect(repository.save).not.toHaveBeenCalled();
    });

    it.each([true, false])(
        'deleteAndRestart tratta %s come successo idempotente',
        async (deleted) => {
            repository = makeRepository(record({ PropertyTitle: 'Persistita' }));
            vi.mocked(repository.delete).mockResolvedValue(deleted);
            render(<Harness />);
            await screen.findByText('choice_required');
            await userEvent.dblClick(screen.getByRole('button', {
                name: 'elimina',
            }));
            await screen.findByText('ready');
            expect(repository.delete).toHaveBeenCalledOnce();
            expect(repository.delete).toHaveBeenCalledWith({
                formType: 'property',
                mode: 'create',
                entityId: null,
            });
            expect(screen.getByTestId('title').textContent).toBe('');
            expect(screen.getByTestId('dirty').textContent).toBe('false');
        },
    );

    it('delete fallita conserva la scelta e permette retry', async () => {
        repository = makeRepository(record({ PropertyTitle: 'Persistita' }));
        vi.mocked(repository.delete)
            .mockRejectedValueOnce(new Error('storage'))
            .mockResolvedValueOnce(true);
        render(<Harness />);
        await screen.findByText('choice_required');
        await userEvent.click(screen.getByRole('button', { name: 'elimina' }));
        await screen.findByText('Impossibile eliminare la bozza. Riprova.');
        expect(screen.getByTestId('phase').textContent).toBe('choice_required');
        await userEvent.click(screen.getByRole('button', { name: 'elimina' }));
        await screen.findByText('ready');
        expect(repository.delete).toHaveBeenCalledTimes(2);
    });

    it.each([
        [new DraftCorruptedError(), 'danneggiata o incompatibile'],
        [new DraftMigrationError(), 'migrare la bozza'],
        [new DraftStorageError(), 'accedere alla bozza'],
        [new Error('grezzo'), 'caricare la bozza della nuova unità'],
    ])('mappa load error user-safe e riprova', async (error, message) => {
        repository = makeRepository();
        vi.mocked(repository.get)
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce(null);
        render(<Harness />);
        expect((await screen.findByTestId('load-error')).textContent)
            .toContain(message);
        expect(screen.getByTestId('phase').textContent).toBe('load_error');
        await userEvent.click(screen.getByRole('button', {
            name: 'riprova load',
        }));
        await screen.findByText('ready');
        expect(repository.get).toHaveBeenCalledTimes(2);
    });

    it('salva manualmente payload incompleto e allegati, poi aggiorna baseline', async () => {
        repository = makeRepository();
        render(<Harness />);
        await screen.findByText('ready');
        await userEvent.click(screen.getByRole('button', { name: 'allegato' }));
        await userEvent.click(screen.getByRole('button', { name: 'salva' }));
        await screen.findByText('Bozza salvata.');
        expect(repository.save).toHaveBeenCalledOnce();
        expect(vi.mocked(repository.save).mock.calls[0]?.[1]).toMatchObject({
            mode: 'create',
            payload: {
                PropertyTitle: '',
                PropertyAddress: '',
                PropertyCity: '',
                PropertyPostalCode: '',
                PropertyPhotos: [file],
            },
        });
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        await userEvent.click(screen.getByRole('button', { name: 'modifica' }));
        await userEvent.click(screen.getByRole('button', { name: 'abbandona' }));
        expect(screen.getByTestId('title').textContent).toBe('');
        expect(screen.getByTestId('photos').textContent).toBe('1');
    });

    it.each([
        [new DraftStorageQuotaError(), 'Spazio locale esaurito'],
        [new DraftStorageError(), 'database locale'],
        [new Error('grezzo'), 'Impossibile salvare la bozza.'],
    ])('save fallita rigetta user-safe, conserva form e permette retry', async (
        error,
        message,
    ) => {
        let controller: PropertyDraftController | undefined;
        repository = makeRepository();
        vi.mocked(repository.save)
            .mockRejectedValueOnce(error)
            .mockImplementationOnce(async (_definition, input) => (
                record(input.payload as PropertyFormState)
            ));
        render(<Harness onController={(value) => {
            controller = value;
        }} />);
        await screen.findByText('ready');
        const readyController = await waitForCapturedController(
            () => controller,
            'ready',
        );
        await userEvent.click(screen.getByRole('button', { name: 'modifica' }));
        await expect(readyController.saveDraft()).rejects.toThrow(message);
        expect(screen.getByTestId('title').textContent).toBe('Modificato');
        expect(screen.getByTestId('dirty').textContent).toBe('true');
        await readyController.saveDraft();
        expect(repository.save).toHaveBeenCalledTimes(2);
    });

    it('serializza save e deletePersistedDraft concorrenti', async () => {
        let controller: PropertyDraftController | undefined;
        const savePending = deferred<DraftRecord<PropertyFormState>>();
        const deletePending = deferred<boolean>();
        repository = makeRepository();
        vi.mocked(repository.save).mockReturnValue(savePending.promise);
        vi.mocked(repository.delete).mockReturnValue(deletePending.promise);
        render(<Harness onController={(value) => {
            controller = value;
        }} />);
        await screen.findByText('ready');
        const readyController = await waitForCapturedController(
            () => controller,
            'ready',
        );
        const firstSave = readyController.saveDraft();
        const secondSave = readyController.saveDraft();
        expect(repository.save).toHaveBeenCalledOnce();
        savePending.resolve(record({}));
        await Promise.all([firstSave, secondSave]);
        const firstDelete = readyController.deletePersistedDraft();
        const secondDelete = readyController.deletePersistedDraft();
        expect(firstDelete).toBe(secondDelete);
        expect(repository.delete).toHaveBeenCalledOnce();
        deletePending.resolve(true);
        await firstDelete;
    });

    it('deduplica il get logico sotto Strict Mode', async () => {
        repository = makeRepository();
        render(<StrictMode><Harness /></StrictMode>);
        await screen.findByText('ready');
        expect(repository.get).toHaveBeenCalledOnce();
    });

    it('ignora il completamento get dopo unmount', async () => {
        const getPending = deferred<DraftRecord<PropertyFormState> | null>();
        repository = makeRepository();
        vi.mocked(repository.get).mockReturnValue(getPending.promise);
        const onReset = vi.fn();
        const consoleError = vi.spyOn(console, 'error')
            .mockImplementation(() => undefined);
        const view = render(<Harness onReset={onReset} />);
        view.unmount();
        await act(async () => {
            getPending.resolve(null);
            await getPending.promise;
        });
        expect(onReset).not.toHaveBeenCalled();
        expect(consoleError).not.toHaveBeenCalled();
    });

    it('ignora il completamento save dopo unmount e libera il lock', async () => {
        let controller: PropertyDraftController | undefined;
        const pending = deferred<DraftRecord<PropertyFormState>>();
        const onReset = vi.fn();
        const consoleError = vi.spyOn(console, 'error')
            .mockImplementation(() => undefined);
        repository = makeRepository();
        vi.mocked(repository.save).mockReturnValue(pending.promise);
        const view = render(<Harness
            onReset={onReset}
            onController={(value) => {
                controller = value;
            }}
        />);
        await screen.findByText('ready');
        const readyController = await waitForCapturedController(
            () => controller,
            'ready',
        );
        onReset.mockClear();
        const operation = readyController.saveDraft();
        expect(repository.save).toHaveBeenCalledOnce();
        view.unmount();
        pending.resolve(record({ PropertyTitle: 'Tardiva' }));
        await operation;
        expect(onReset).not.toHaveBeenCalled();
        expect(consoleError).not.toHaveBeenCalled();
    });

    it('ignora il completamento deleteAndRestart dopo unmount', async () => {
        let controller: PropertyDraftController | undefined;
        const pending = deferred<boolean>();
        const onReset = vi.fn();
        const consoleError = vi.spyOn(console, 'error')
            .mockImplementation(() => undefined);
        repository = makeRepository(record({ PropertyTitle: 'Persistita' }));
        vi.mocked(repository.delete).mockReturnValue(pending.promise);
        const view = render(<Harness
            onReset={onReset}
            onController={(value) => {
                controller = value;
            }}
        />);
        await screen.findByText('choice_required');
        const choiceController = await waitForCapturedController(
            () => controller,
            'choice_required',
        );
        const operation = choiceController.deleteAndRestart();
        expect(repository.delete).toHaveBeenCalledOnce();
        view.unmount();
        pending.resolve(true);
        await operation;
        expect(onReset).not.toHaveBeenCalled();
        expect(consoleError).not.toHaveBeenCalled();
    });

    it('mappa la validazione payload reale e permette un retry valido', async () => {
        let controller: PropertyDraftController | undefined;
        let methods!: UseFormReturn<PropertyFormState>;
        repository = makeRepository();
        render(<Harness
            onController={(value) => {
                controller = value;
            }}
            onMethods={(value) => {
                methods = value;
            }}
        />);
        await screen.findByText('ready');
        const readyController = await waitForCapturedController(
            () => controller,
            'ready',
        );
        act(() => methods.setValue(
            'PropertyPhotos',
            [{ ...file, size: 'invalid' }] as unknown as PropertyFormState['PropertyPhotos'],
            { shouldDirty: true },
        ));
        await expect(readyController.saveDraft()).rejects.toThrow(
            'I dati della bozza non sono validi. Controlla i campi compilati.',
        );
        expect(repository.save).not.toHaveBeenCalled();
        expect(methods.getValues('PropertyPhotos')[0]?.size).toBe('invalid');
        expect(methods.formState.isDirty).toBe(true);
        expect(screen.getByTestId('success').textContent).toBe('');
        act(() => methods.setValue('PropertyPhotos', [file], {
            shouldDirty: true,
        }));
        await readyController.saveDraft();
        expect(repository.save).toHaveBeenCalledOnce();
    });

    it('deletePersistedDraft libera la Promise fallita e ritenta', async () => {
        let controller: PropertyDraftController | undefined;
        const first = deferred<boolean>();
        repository = makeRepository();
        vi.mocked(repository.delete)
            .mockReturnValueOnce(first.promise)
            .mockResolvedValueOnce(true);
        render(<Harness onController={(value) => {
            controller = value;
        }} />);
        await screen.findByText('ready');
        const readyController = await waitForCapturedController(
            () => controller,
            'ready',
        );
        const attempt = readyController.deletePersistedDraft();
        expect(readyController.deletePersistedDraft()).toBe(attempt);
        first.reject(new DraftStorageError());
        await expect(attempt).rejects.toBeInstanceOf(DraftStorageError);
        await expect(readyController.deletePersistedDraft())
            .resolves.toBeUndefined();
        expect(repository.delete).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId('phase').textContent).toBe('ready');
    });

    it('ignora la risposta stale dopo cambio repository', async () => {
        const oldPending = deferred<DraftRecord<PropertyFormState> | null>();
        const oldRepository = makeRepository();
        vi.mocked(oldRepository.get).mockReturnValue(oldPending.promise);
        const newRepository = makeRepository(null);
        const onReset = vi.fn();
        const view = render(<Harness
            repositoryOverride={oldRepository}
            onReset={onReset}
        />);
        view.rerender(<Harness
            repositoryOverride={newRepository}
            onReset={onReset}
        />);
        await screen.findByText('ready');
        expect(oldRepository.get).toHaveBeenCalledOnce();
        expect(newRepository.get).toHaveBeenCalledOnce();
        const resetsAfterNew = onReset.mock.calls.length;
        oldPending.resolve(record({ PropertyTitle: 'Obsoleta' }));
        await oldPending.promise;
        await Promise.resolve();
        expect(screen.getByTestId('title').textContent).toBe('');
        expect(onReset).toHaveBeenCalledTimes(resetsAfterNew);
    });

    it('discard ripristina la baseline default senza write', async () => {
        repository = makeRepository();
        render(<Harness />);
        await screen.findByText('ready');
        await userEvent.click(screen.getByRole('button', { name: 'modifica' }));
        await userEvent.click(screen.getByRole('button', { name: 'allegato' }));
        await userEvent.click(screen.getByRole('button', { name: 'abbandona' }));
        expect(screen.getByTestId('title').textContent).toBe('');
        expect(screen.getByTestId('photos').textContent).toBe('0');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('discard ripristina la baseline ripresa con allegati', async () => {
        let methods!: UseFormReturn<PropertyFormState>;
        repository = makeRepository(record({
            PropertyTitle: 'Persistita',
            PropertyPhotos: [file],
        }));
        render(<Harness onMethods={(value) => {
            methods = value;
        }} />);
        await screen.findByText('choice_required');
        await userEvent.click(screen.getByRole('button', { name: 'riprendi' }));
        act(() => {
            methods.setValue('PropertyTitle', 'Modificata', {
                shouldDirty: true,
            });
            methods.setValue('PropertyPhotos', [], { shouldDirty: true });
        });
        await userEvent.click(screen.getByRole('button', { name: 'abbandona' }));
        expect(screen.getByTestId('title').textContent).toBe('Persistita');
        expect(screen.getByTestId('photos').textContent).toBe('1');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('salva e ripristina il payload annidato completo senza rigenerare ID', async () => {
        let controller: PropertyDraftController | undefined;
        let methods!: UseFormReturn<PropertyFormState>;
        const nested = {
            PropertyCadastreDocument: file,
            PropertyKeys: [{
                id: 'key-1', description: 'Portone', number: '1',
                quantity: 1, holder: 'QA', comments: '',
            }],
            PropertyContracts: [{
                id: 'contract-1', type: 'energia', description: 'Contratto',
                releaseDate: '', expiryDate: '', comments: '', file,
            }],
            PropertyPhotos: [file],
            PropertyContacts: [{
                id: 'contact-1', firstName: 'Ada', lastName: 'Rossi',
                profession: '', email: '', phone: '', comments: '',
            }],
            PropertyDocuments: [{
                id: 'document-1', type: 'altro', description: 'Documento',
                releaseDate: '', comments: '', shared: false, file,
            }],
        } satisfies Partial<PropertyFormState>;
        repository = makeRepository();
        render(<Harness
            onController={(value) => {
                controller = value;
            }}
            onMethods={(value) => {
                methods = value;
            }}
        />);
        await screen.findByText('ready');
        const readyController = await waitForCapturedController(
            () => controller,
            'ready',
        );
        act(() => {
            for (const [key, value] of Object.entries(nested)) {
                methods.setValue(
                    key as keyof PropertyFormState,
                    value as never,
                    { shouldDirty: true },
                );
            }
        });
        await readyController.saveDraft();
        const savedPayload = vi.mocked(repository.save).mock.calls[0]?.[1]
            .payload as PropertyFormState;
        expect(savedPayload).toMatchObject(nested);
        expect(savedPayload.PropertyKeys).not.toBe(nested.PropertyKeys);
        expect(savedPayload.PropertyPhotos[0]?.dataUrl).toBe(file.dataUrl);
        act(() => methods.setValue('PropertyPhotos', [], {
            shouldDirty: true,
        }));
        act(() => readyController.discardChanges());
        expect(methods.getValues()).toMatchObject(nested);
        expect(methods.getValues('PropertyKeys')[0]?.id).toBe('key-1');
        expect(repository.save).toHaveBeenCalledOnce();
    });

    it('salva una sola volta sotto Strict Mode', async () => {
        repository = makeRepository();
        const onReset = vi.fn();
        render(<StrictMode><Harness onReset={onReset} /></StrictMode>);
        await screen.findByText('ready');
        onReset.mockClear();
        await userEvent.click(screen.getByRole('button', { name: 'salva' }));
        await screen.findByText('Bozza salvata.');
        expect(repository.save).toHaveBeenCalledOnce();
        expect(onReset).toHaveBeenCalledOnce();
    });

    it('elimina e riparte una sola volta sotto Strict Mode', async () => {
        repository = makeRepository(record({ PropertyTitle: 'Persistita' }));
        const onReset = vi.fn();
        render(<StrictMode><Harness onReset={onReset} /></StrictMode>);
        await screen.findByText('choice_required');
        onReset.mockClear();
        await userEvent.click(screen.getByRole('button', { name: 'elimina' }));
        await screen.findByText('ready');
        expect(repository.delete).toHaveBeenCalledOnce();
        expect(onReset).toHaveBeenCalledOnce();
    });

    it('clear feedback non altera valori o fase', async () => {
        let controller: PropertyDraftController | undefined;
        repository = makeRepository();
        vi.mocked(repository.save).mockRejectedValue(new DraftStorageQuotaError());
        render(<Harness onController={(value) => {
            controller = value;
        }} />);
        await screen.findByText('ready');
        const readyController = await waitForCapturedController(
            () => controller,
            'ready',
        );
        await expect(readyController.saveDraft()).rejects.toThrow();
        await waitFor(() => expect(screen.getByTestId('draft-error').textContent)
            .toContain('Spazio locale esaurito'));
        const latestReadyController = await waitForCapturedController(
            () => controller,
            'ready',
        );
        act(() => latestReadyController.clearDraftFeedback());
        expect(screen.getByTestId('draft-error').textContent).toBe('');
        expect(screen.getByTestId('phase').textContent).toBe('ready');
    });
});
