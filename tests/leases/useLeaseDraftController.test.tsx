// @vitest-environment jsdom

import React, { StrictMode, useEffect, useState } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DraftPayloadValidationError, DraftStorageError, DraftStorageQuotaError } from '../../src/db/databaseErrors';
import type { DraftRecord, DraftRepository } from '../../src/db/draftRepository.port';
import { createLocalDraftRepository } from '../../src/db/localDraftRepository';
import {
    defaultLeaseValues,
    type LeaseFormData,
} from '../../src/landlord/leases/schema/leaseFormSchema';
import { leaseDraftDefinition, type LeaseDraftPayload, type LeaseFormTab } from '../../src/landlord/leases/drafts/leaseDraftDefinition';
import {
    useLeaseDraftController,
    type LeaseDraftController,
} from '../../src/landlord/leases/drafts/useLeaseDraftController';

let repository: DraftRepository;
vi.mock('../../src/drafts/DraftRepositoryContext', () => ({ useDraftRepository: () => repository }));

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
}

function record(formData: Partial<LeaseFormData> = {}, activeTab: LeaseFormTab = 'general'): DraftRecord<LeaseDraftPayload> {
    return {
        id: 'draft-lease', accountId: 'account-a', formType: 'lease', mode: 'create', entityId: null,
        payload: { formData: { ...defaultLeaseValues, ...formData } as LeaseFormData, activeTab },
        schemaVersion: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01',
    };
}

function makeRepository(draft: DraftRecord<LeaseDraftPayload> | null = null): DraftRepository {
    return {
        get: vi.fn().mockResolvedValue(draft), list: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation(async (_definition, input) => record(
            (input.payload as LeaseDraftPayload).formData,
            (input.payload as LeaseDraftPayload).activeTab,
        )),
        delete: vi.fn().mockResolvedValue(true),
    };
}

let latest: LeaseDraftController | undefined;
let methods: UseFormReturn<LeaseFormData> | undefined;
let setTabExternal: ((tab: LeaseFormTab) => void) | undefined;

interface HarnessProps {
    repositoryOverride?: DraftRepository;
    initialValues?: Partial<LeaseFormData>;
    initialTab?: LeaseFormTab;
}

function Harness({ repositoryOverride, initialValues, initialTab = 'general' }: HarnessProps = {}) {
    const form = useForm<LeaseFormData>({ defaultValues: { ...defaultLeaseValues, ...initialValues } });
    const [tab, setTab] = useState<LeaseFormTab>(initialTab);
    const controller = useLeaseDraftController(form, tab, setTab, repositoryOverride);
    const title = useWatch({ control: form.control, name: 'LeaseIdentificativo' });
    // Il test deve catturare l'ultima istanza dopo ogni render del controller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        latest = controller;
        methods = form;
        setTabExternal = setTab;
    });
    return <><output data-testid="phase">{controller.phase}</output><output data-testid="dirty">{String(form.formState.isDirty)}</output><output data-testid="title">{title}</output><output data-testid="tab">{tab}</output><output data-testid="success">{controller.draftSuccess}</output><output data-testid="draft-error">{controller.draftError}</output><output data-testid="load-error">{controller.loadError}</output><output data-testid="operation-error">{controller.operationError}</output></>;
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); latest = undefined; methods = undefined; setTabExternal = undefined; });

describe('useLeaseDraftController', () => {
    it('carica una create vuota nei default clean senza autosave', async () => {
        repository = makeRepository();
        render(<Harness />);
        await screen.findByText('ready');
        expect(repository.get).toHaveBeenCalledWith(expect.objectContaining({ formType: 'lease' }), { mode: 'create' });
        expect(repository.save).not.toHaveBeenCalled();
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(screen.getByTestId('tab').textContent).toBe('general');
    });

    it('deduplica il load in Strict Mode', async () => {
        repository = makeRepository();
        render(<StrictMode><Harness /></StrictMode>);
        await screen.findByText('ready');
        expect(repository.get).toHaveBeenCalledOnce();
    });

    it('richiede scelta senza hydration e riprende payload completo clean', async () => {
        repository = makeRepository(record({
            LeaseIdentificativo: 'Persistita', PropertyID: 'p-missing',
            LeaseTenantIds: ['t-missing'], LeaseGarantIds: ['g-missing'],
            PaymentItems: [{ LeasePaymentItems_Title: 'Voce', LeasePaymentItems_Amount: 20 }],
            LeaseInsuranceContracts: [{ LeaseInsuranceType: 'locativa', LeaseInsuranceDescription: 'Polizza', LeaseInsuranceStartDate: '', LeaseInsuranceEndDate: '', LeaseInsuranceDocumentId: 'doc-missing' }],
        }, 'insurance'));
        render(<Harness />);
        await screen.findByText('choice_required');
        expect(screen.getByTestId('title').textContent).toBe('Nuova locazione');
        act(() => latest?.resumeDraft());
        await screen.findByText('Persistita');
        expect(screen.getByTestId('tab').textContent).toBe('insurance');
        expect(methods?.getValues('PropertyID')).toBe('p-missing');
        expect(methods?.getValues('LeaseTenantIds')).toEqual(['t-missing']);
        expect(methods?.getValues('LeaseGarantIds')).toEqual(['g-missing']);
        expect(methods?.getValues('PaymentItems')).toHaveLength(1);
        expect(methods?.getValues('LeaseInsuranceContracts')).toHaveLength(1);
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('salva manualmente una bozza incompleta con activeTab e aggiorna baseline', async () => {
        repository = makeRepository(); render(<Harness />); await screen.findByText('ready');
        act(() => { methods?.setValue('LeaseIdentificativo', 'Manuale', { shouldDirty: true }); setTabExternal?.('contract'); });
        expect(repository.save).not.toHaveBeenCalled();
        await act(async () => { await latest?.saveDraft(); });
        expect(repository.save).toHaveBeenCalledOnce();
        const input = vi.mocked(repository.save).mock.calls[0][1];
        expect(input).toMatchObject({ mode: 'create', payload: { activeTab: 'contract' } });
        expect(input.payload).not.toHaveProperty('updatedAt');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(screen.getByTestId('success').textContent).toBe('Bozza salvata.');
        act(() => methods?.setValue('LeaseIdentificativo', 'Dopo', { shouldDirty: true }));
        act(() => latest?.discardChanges());
        expect(methods?.getValues('LeaseIdentificativo')).toBe('Manuale');
        expect(screen.getByTestId('tab').textContent).toBe('contract');
    });

    it('il solo cambio scheda non salva, non resetta e non rende dirty', async () => {
        repository = makeRepository(); render(<Harness />); await screen.findByText('ready');
        act(() => setTabExternal?.('tenants'));
        expect(repository.save).not.toHaveBeenCalled();
        expect(screen.getByTestId('dirty').textContent).toBe('false');
    });

    it('deduplica save concorrenti e mappa quota', async () => {
        const pending = deferred<DraftRecord<LeaseDraftPayload>>();
        repository = makeRepository(); vi.mocked(repository.save).mockReturnValue(pending.promise);
        render(<Harness />); await screen.findByText('ready');
        let one: Promise<void> | undefined; let two: Promise<void> | undefined;
        act(() => { one = latest?.saveDraft(); two = latest?.saveDraft(); });
        expect(repository.save).toHaveBeenCalledOnce();
        pending.resolve(record()); await act(async () => { await one; await two; });

        vi.mocked(repository.save).mockRejectedValueOnce(new DraftStorageQuotaError());
        await expect(latest?.saveDraft()).rejects.toThrow('Spazio locale esaurito');
    });

    it('elimina e ricomincia una sola volta o conserva choice su errore', async () => {
        const pending = deferred<boolean>(); repository = makeRepository(record({ LeaseIdentificativo: 'X' }));
        vi.mocked(repository.delete).mockReturnValue(pending.promise);
        render(<Harness />); await screen.findByText('choice_required');
        act(() => { void latest?.deleteAndRestart(); void latest?.deleteAndRestart(); });
        expect(repository.delete).toHaveBeenCalledOnce();
        expect(repository.delete).toHaveBeenCalledWith({ formType: 'lease', mode: 'create', entityId: null });
        pending.resolve(true); await act(async () => { await pending.promise; });
        await screen.findByText('ready');
        expect(screen.getByTestId('tab').textContent).toBe('general');

        cleanup(); repository = makeRepository(record()); vi.mocked(repository.delete).mockRejectedValueOnce(new Error('x'));
        render(<Harness />); await screen.findByText('choice_required');
        await act(async () => { await latest?.deleteAndRestart(); });
        expect(screen.getByTestId('phase').textContent).toBe('choice_required');
        expect(screen.getByTestId('operation-error').textContent).toContain('Riprova');
    });

    it('espone load error e retry ignorando la risposta obsoleta', async () => {
        const first = deferred<DraftRecord<LeaseDraftPayload> | null>();
        repository = makeRepository(); vi.mocked(repository.get).mockReturnValueOnce(first.promise).mockRejectedValueOnce(new DraftStorageError());
        const view = render(<Harness />); first.reject(new DraftStorageError());
        await screen.findByText('load_error'); expect(screen.getByTestId('load-error').textContent).toContain('database locale');
        act(() => latest?.retryLoad()); await waitFor(() => expect(repository.get).toHaveBeenCalledTimes(2));
        await screen.findByText('load_error');
        view.unmount();
    });

    it('deduplica delete post-submit, consente un nuovo tentativo e non resetta', async () => {
        const pending = deferred<boolean>(); repository = makeRepository(); vi.mocked(repository.delete).mockReturnValueOnce(pending.promise).mockResolvedValue(true);
        render(<Harness />); await screen.findByText('ready');
        const phase = latest?.phase; const a = latest?.deletePersistedDraft(); const b = latest?.deletePersistedDraft();
        expect(a).toBe(b); expect(repository.delete).toHaveBeenCalledOnce(); pending.resolve(true);
        await act(async () => { await a; }); await latest?.deletePersistedDraft();
        expect(repository.delete).toHaveBeenCalledTimes(2); expect(latest?.phase).toBe(phase);
    });

    it('ignora completamenti tardivi dopo unmount e rilascia i lock', async () => {
        const pending = deferred<DraftRecord<LeaseDraftPayload> | null>(); repository = makeRepository(); vi.mocked(repository.get).mockReturnValue(pending.promise);
        const view = render(<Harness />); view.unmount(); pending.resolve(null); await pending.promise;
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('ignora davvero la risposta obsoleta dopo il cambio repository', async () => {
        const oldLoad = deferred<DraftRecord<LeaseDraftPayload> | null>();
        const repositoryA = makeRepository();
        vi.mocked(repositoryA.get).mockReturnValue(oldLoad.promise);
        const repositoryB = makeRepository(null);
        const view = render(<Harness repositoryOverride={repositoryA} initialTab="insurance" />);
        view.rerender(<Harness repositoryOverride={repositoryB} initialTab="insurance" />);
        await screen.findByText('ready');
        const snapshot = {
            phase: latest?.phase, values: methods?.getValues(), tab: screen.getByTestId('tab').textContent,
            loadError: latest?.loadError, operationError: latest?.operationError,
        };
        oldLoad.resolve(record({ LeaseIdentificativo: 'Obsoleta' }, 'contract'));
        await act(async () => { await oldLoad.promise; });
        expect({
            phase: latest?.phase, values: methods?.getValues(), tab: screen.getByTestId('tab').textContent,
            loadError: latest?.loadError, operationError: latest?.operationError,
        }).toEqual(snapshot);
        expect(repositoryA.save).not.toHaveBeenCalled();
        expect(repositoryA.delete).not.toHaveBeenCalled();
        expect(repositoryB.save).not.toHaveBeenCalled();
        expect(repositoryB.delete).not.toHaveBeenCalled();
    });

    it('un save pendente blocca delete e libera il lock dopo resolve', async () => {
        const pending = deferred<DraftRecord<LeaseDraftPayload>>();
        repository = makeRepository();
        vi.mocked(repository.save).mockReturnValueOnce(pending.promise).mockResolvedValue(record());
        render(<Harness />); await screen.findByText('ready');
        const saving = latest?.saveDraft();
        await latest?.deleteAndRestart();
        expect(repository.delete).not.toHaveBeenCalled();
        pending.resolve(record());
        await act(async () => { await saving; });
        await latest?.saveDraft();
        expect(repository.save).toHaveBeenCalledTimes(2);
    });

    it('una delete pendente blocca save e libera il lock dopo resolve', async () => {
        const pending = deferred<boolean>();
        repository = makeRepository(record());
        vi.mocked(repository.delete).mockReturnValueOnce(pending.promise);
        render(<Harness />); await screen.findByText('choice_required');
        let deleting: Promise<void> | undefined;
        act(() => { deleting = latest?.deleteAndRestart(); });
        expect(repository.delete).toHaveBeenCalledOnce();
        await latest?.saveDraft();
        expect(repository.save).not.toHaveBeenCalled();
        pending.resolve(true);
        await act(async () => { await deleting; });
        await screen.findByText('ready');
        await latest?.saveDraft();
        expect(repository.save).toHaveBeenCalledOnce();
    });

    it.each([
        [new DraftStorageError(), 'database locale'],
        [new DraftPayloadValidationError(), 'non sono validi'],
        [new Error('stack tecnico segreto'), 'Impossibile salvare'],
    ])('mappa errori save user-safe e consente un nuovo tentativo', async (failure, expected) => {
        repository = makeRepository();
        vi.mocked(repository.save).mockRejectedValueOnce(failure).mockResolvedValue(record());
        render(<Harness />); await screen.findByText('ready');
        await act(async () => { await expect(latest?.saveDraft()).rejects.toThrow(expected); });
        expect(screen.getByTestId('draft-error').textContent).toContain(expected);
        expect(screen.getByTestId('draft-error').textContent).not.toContain('stack tecnico');
        await act(async () => { await latest?.saveDraft(); });
        expect(repository.save).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId('dirty').textContent).toBe('false');
    });

    it('riprova delete e restart dopo reject conservando la scelta', async () => {
        repository = makeRepository(record());
        vi.mocked(repository.delete).mockRejectedValueOnce(new Error('tecnico')).mockResolvedValue(true);
        render(<Harness />); await screen.findByText('choice_required');
        await act(async () => { await latest?.deleteAndRestart(); });
        expect(latest?.phase).toBe('choice_required');
        expect(latest?.operationError).toContain('Riprova');
        await act(async () => { await latest?.deleteAndRestart(); });
        expect(repository.delete).toHaveBeenCalledTimes(2);
        await screen.findByText('ready');
    });

    it('ripristina una baseline ripresa con grafi indipendenti senza cambiare tab', async () => {
        const external = record({
            PropertyID: 'p1', LeaseTenantIds: ['t1'], LeaseGarantIds: ['g1'],
            PaymentItems: [{ LeasePaymentItems_Description: 'Canone', LeasePaymentItems_Amount: 50 }],
            LeaseInsuranceContracts: [{ LeaseInsuranceType: 'locativa', LeaseInsuranceDescription: 'Base', LeaseInsuranceStartDate: '', LeaseInsuranceEndDate: '', LeaseInsuranceDocumentId: 'doc1' }],
        }, 'insurance');
        repository = makeRepository(external);
        render(<Harness />); await screen.findByText('choice_required');
        act(() => latest?.resumeDraft());
        await screen.findByText('ready');
        const changedTenants = ['changed'];
        act(() => {
            methods?.setValue('PropertyID', 'changed', { shouldDirty: true });
            methods?.setValue('LeaseTenantIds', changedTenants, { shouldDirty: true });
            methods?.setValue('LeaseGarantIds', ['changed'], { shouldDirty: true });
            methods?.setValue('PaymentItems', [{ LeasePaymentItems_Description: 'Mutato', LeasePaymentItems_Amount: 1 }], { shouldDirty: true });
            methods?.setValue('LeaseInsuranceContracts', [], { shouldDirty: true });
            setTabExternal?.('contract');
            latest?.discardChanges();
        });
        expect(methods?.getValues('PropertyID')).toBe('p1');
        expect(methods?.getValues('LeaseTenantIds')).toEqual(['t1']);
        expect(methods?.getValues('LeaseGarantIds')).toEqual(['g1']);
        expect(methods?.getValues('PaymentItems')[0].LeasePaymentItems_Description).toBe('Canone');
        expect(methods?.getValues('LeaseInsuranceContracts')[0].LeaseInsuranceDescription).toBe('Base');
        expect(methods?.getValues('LeaseTenantIds')).not.toBe(changedTenants);
        expect(methods?.getValues('LeaseTenantIds')).not.toBe(external.payload.formData.LeaseTenantIds);
        expect(screen.getByTestId('tab').textContent).toBe('contract');
        expect(repository.save).not.toHaveBeenCalled();
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('dopo elimina e ricomincia discard torna ai default senza cambiare tab', async () => {
        repository = makeRepository(record());
        render(<Harness />); await screen.findByText('choice_required');
        await act(async () => { await latest?.deleteAndRestart(); });
        act(() => {
            methods?.setValue('LeaseIdentificativo', 'Modificata', { shouldDirty: true });
            setTabExternal?.('contract');
            latest?.discardChanges();
        });
        expect(methods?.getValues()).toEqual(defaultLeaseValues);
        expect(screen.getByTestId('tab').textContent).toBe('contract');
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('la baseline salvata include array annidati indipendenti', async () => {
        repository = makeRepository(); render(<Harness />); await screen.findByText('ready');
        const payment = [{ LeasePaymentItems_Description: 'Salvato', LeasePaymentItems_Amount: 80 }];
        act(() => methods?.setValue('PaymentItems', payment, { shouldDirty: true }));
        await act(async () => { await latest?.saveDraft(); });
        act(() => methods?.setValue('PaymentItems', [], { shouldDirty: true }));
        act(() => latest?.discardChanges());
        expect(methods?.getValues('PaymentItems')[0].LeasePaymentItems_Description).toBe('Salvato');
        expect(methods?.getValues('PaymentItems')).not.toBe(payment);
    });

    it('delete post-submit fallita è riprovabile e non altera form, dirty, tab o phase', async () => {
        repository = makeRepository();
        vi.mocked(repository.delete).mockRejectedValueOnce(new Error('delete failure')).mockResolvedValue(true);
        render(<Harness />); await screen.findByText('ready');
        act(() => { methods?.setValue('LeaseIdentificativo', 'Dirty', { shouldDirty: true }); setTabExternal?.('contract'); });
        const before = { phase: latest?.phase, values: methods?.getValues(), dirty: methods?.formState.isDirty };
        const first = latest?.deletePersistedDraft();
        const concurrent = latest?.deletePersistedDraft();
        expect(first).toBe(concurrent);
        await expect(first).rejects.toThrow('delete failure');
        await latest?.deletePersistedDraft();
        expect(repository.delete).toHaveBeenCalledTimes(2);
        expect(latest?.phase).toBe(before.phase);
        expect(methods?.getValues()).toEqual(before.values);
        expect(methods?.formState.isDirty).toBe(before.dirty);
        expect(screen.getByTestId('tab').textContent).toBe('contract');
        expect(latest?.draftSuccess).toBeNull();
    });

    it('ignora completamenti tardivi di save e delete dopo unmount senza console error', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const savePending = deferred<DraftRecord<LeaseDraftPayload>>();
        repository = makeRepository(); vi.mocked(repository.save).mockReturnValue(savePending.promise);
        const saveView = render(<Harness />); await screen.findByText('ready');
        const saving = latest?.saveDraft(); saveView.unmount(); savePending.resolve(record());
        await saving;

        const deletePending = deferred<boolean>();
        repository = makeRepository(record()); vi.mocked(repository.delete).mockReturnValue(deletePending.promise);
        const deleteView = render(<Harness />); await screen.findByText('choice_required');
        const deleting = latest?.deleteAndRestart(); deleteView.unmount(); deletePending.resolve(true);
        await deleting;
        expect(consoleError).not.toHaveBeenCalled();
    });

    it('isola la stessa chiave lease create null tra due account reali', async () => {
        const accountA = 'user-901';
        const accountB = 'user-902';
        localStorage.removeItem(`props24.localDb.${accountA}`);
        localStorage.removeItem(`props24.localDb.${accountB}`);
        const repositoryA = createLocalDraftRepository({ accountId: accountA });
        const repositoryB = createLocalDraftRepository({ accountId: accountB });

        const view = render(<Harness repositoryOverride={repositoryA} />);
        await screen.findByText('ready');
        act(() => methods?.setValue('LeaseIdentificativo', 'Account A', { shouldDirty: true }));
        await act(async () => { await latest?.saveDraft(); });
        view.unmount();

        expect(await repositoryB.get(leaseDraftDefinition, { mode: 'create' })).toBeNull();
        const viewB = render(<Harness repositoryOverride={repositoryB} />);
        await screen.findByText('ready');
        act(() => methods?.setValue('LeaseIdentificativo', 'Account B', { shouldDirty: true }));
        await act(async () => { await latest?.saveDraft(); });

        const savedA = await repositoryA.get(leaseDraftDefinition, { mode: 'create' });
        const savedB = await repositoryB.get(leaseDraftDefinition, { mode: 'create' });
        expect(savedA).toMatchObject({ accountId: accountA, formType: 'lease', mode: 'create', entityId: null, payload: { formData: { LeaseIdentificativo: 'Account A' } } });
        expect(savedB).toMatchObject({ accountId: accountB, formType: 'lease', mode: 'create', entityId: null, payload: { formData: { LeaseIdentificativo: 'Account B' } } });
        expect(savedA?.accountId).not.toBe(savedB?.accountId);
        expect(localStorage.getItem(`props24.localDb.${accountA}`)).not.toBe(localStorage.getItem(`props24.localDb.${accountB}`));
        viewB.unmount();
        localStorage.removeItem(`props24.localDb.${accountA}`);
        localStorage.removeItem(`props24.localDb.${accountB}`);
    });
});
