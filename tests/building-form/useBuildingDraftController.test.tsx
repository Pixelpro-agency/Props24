// @vitest-environment jsdom

import React, { StrictMode, useEffect } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DraftRecord, DraftRepository } from '../../src/db/draftRepository.port';
import { defaultBuildingValues, type BuildingFormData } from '../../src/components/building-form/schema';
import { useBuildingDraftController } from '../../src/components/building-form/hooks/useBuildingDraftController';

let repository: DraftRepository;
vi.mock('../../src/drafts/DraftRepositoryContext', () => ({ useDraftRepository: () => repository }));

function record(payload: Partial<BuildingFormData> = {}): DraftRecord<BuildingFormData> {
    return { id: 'draft-building', accountId: 'account-a', formType: 'building', mode: 'create', entityId: null, payload: { ...defaultBuildingValues, ...payload }, schemaVersion: 1, createdAt: '2026-08-24T00:00:00.000Z', updatedAt: '2026-08-24T00:00:00.000Z' };
}
function repo(draft: DraftRecord<BuildingFormData> | null = null): DraftRepository {
    return {
        get: vi.fn().mockResolvedValue(draft),
        list: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation(async (_definition, input) => record(input.payload as BuildingFormData)),
        delete: vi.fn().mockResolvedValue(true),
    };
}
function Harness({ capture }: { capture?: (controller: ReturnType<typeof useBuildingDraftController>, methods: UseFormReturn<BuildingFormData>) => void }) {
    const methods = useForm<BuildingFormData>({ defaultValues: defaultBuildingValues });
    const controller = useBuildingDraftController(methods);
    const identifier = useWatch({ control: methods.control, name: 'identifier' });
    useEffect(() => capture?.(controller, methods), [capture, controller, methods]);
    return <>
        <output data-testid="phase">{controller.phase}</output>
        <output data-testid="identifier">{identifier}</output>
        <output data-testid="dirty">{String(methods.formState.isDirty)}</output>
        <output data-testid="error">{controller.operationError ?? controller.loadError ?? controller.draftError}</output>
        <output data-testid="success">{controller.draftSuccess}</output>
        <button onClick={() => methods.setValue('identifier', 'A', { shouldDirty: true })}>imposta A</button>
        <button onClick={() => methods.setValue('identifier', 'B', { shouldDirty: true })}>modifica</button>
        <button onClick={controller.resumeDraft}>riprendi</button>
        <button onClick={() => void controller.saveDraft()}>salva</button>
        <button onClick={() => void controller.deleteAndRestart()}>elimina</button>
        <button onClick={controller.retryLoad}>riprova</button>
        <button onClick={controller.discardChanges}>abbandona</button>
    </>;
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('useBuildingDraftController', () => {
    it('carica una sola volta in Strict Mode e parte clean senza autosave', async () => {
        repository = repo();
        render(<StrictMode><Harness /></StrictMode>);
        await screen.findByText('ready');
        expect(repository.get).toHaveBeenCalledOnce();
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        await userEvent.click(screen.getByRole('button', { name: 'modifica' }));
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('richiede scelta e riprende la bozza come baseline clean senza write', async () => {
        repository = repo(record({ identifier: 'A' }));
        render(<Harness />);
        await screen.findByText('choice_required');
        await userEvent.click(screen.getByRole('button', { name: 'riprendi' }));
        expect(screen.getByTestId('identifier').textContent).toBe('A');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('salva manualmente una bozza incompleta una sola volta e aggiorna baseline', async () => {
        repository = repo();
        render(<Harness />);
        await screen.findByText('ready');
        await userEvent.click(screen.getByRole('button', { name: 'modifica' }));
        await userEvent.click(screen.getByRole('button', { name: 'salva' }));
        await screen.findByText('Bozza salvata.');
        expect(repository.save).toHaveBeenCalledOnce();
        expect(vi.mocked(repository.save).mock.calls[0][1]).toMatchObject({ mode: 'create', payload: { identifier: 'B', address: '', city: '', postalCode: '' } });
        expect(screen.getByTestId('dirty').textContent).toBe('false');
    });

    it('salva A, scarta B e conserva A senza ulteriori I/O', async () => {
        repository = repo();
        render(<Harness />);
        await screen.findByText('ready');
        await userEvent.click(screen.getByRole('button', { name: 'imposta A' }));
        await userEvent.click(screen.getByRole('button', { name: 'salva' }));
        await screen.findByText('Bozza salvata.');
        await userEvent.click(screen.getByRole('button', { name: 'modifica' }));
        expect(screen.getByTestId('identifier').textContent).toBe('B');
        await userEvent.click(screen.getByRole('button', { name: 'abbandona' }));
        expect(screen.getByTestId('identifier').textContent).toBe('A');
        expect(repository.save).toHaveBeenCalledOnce();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('delete fallita conserva la scelta e permette retry canonico', async () => {
        repository = repo(record({ identifier: 'A' }));
        vi.mocked(repository.delete).mockRejectedValueOnce(new Error('storage')).mockResolvedValueOnce(true);
        render(<Harness />);
        await screen.findByText('choice_required');
        await userEvent.click(screen.getByRole('button', { name: 'elimina' }));
        await screen.findByText('Impossibile eliminare la bozza. Riprova.');
        await userEvent.click(screen.getByRole('button', { name: 'elimina' }));
        await screen.findByText('ready');
        expect(repository.delete).toHaveBeenNthCalledWith(2, { formType: 'building', mode: 'create', entityId: null });
    });

    it('load error resta protetto e retry apre default clean', async () => {
        repository = repo();
        vi.mocked(repository.get).mockRejectedValueOnce(new Error('storage')).mockResolvedValueOnce(null);
        render(<Harness />);
        await screen.findByText('load_error');
        expect(repository.save).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'riprova' }));
        await screen.findByText('ready');
        expect(repository.get).toHaveBeenCalledTimes(2);
    });

    it('save fallita conserva valori e consente retry', async () => {
        let latest!: ReturnType<typeof useBuildingDraftController>;
        repository = repo();
        vi.mocked(repository.save).mockRejectedValueOnce(new Error('storage')).mockImplementationOnce(async (_definition, input) => record(input.payload as BuildingFormData));
        render(<Harness capture={(controller) => { latest = controller; }} />);
        await screen.findByText('ready');
        await userEvent.click(screen.getByRole('button', { name: 'modifica' }));
        await expect(latest.saveDraft()).rejects.toThrow();
        expect(screen.getByTestId('identifier').textContent).toBe('B');
        await latest.saveDraft();
        expect(repository.save).toHaveBeenCalledTimes(2);
    });

    it('deduplica cleanup concorrente e libera il retry dopo failure', async () => {
        let latest!: ReturnType<typeof useBuildingDraftController>;
        repository = repo();
        vi.mocked(repository.delete).mockRejectedValueOnce(new Error('storage')).mockResolvedValueOnce(false);
        render(<Harness capture={(controller) => { latest = controller; }} />);
        await screen.findByText('ready');
        const first = latest.deletePersistedDraft();
        expect(latest.deletePersistedDraft()).toBe(first);
        await expect(first).rejects.toThrow();
        await expect(latest.deletePersistedDraft()).resolves.toBeUndefined();
        expect(repository.delete).toHaveBeenCalledTimes(2);
    });
});
