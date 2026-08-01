// @vitest-environment jsdom

import React, { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DraftRecord, DraftRepository } from '../../src/db/draftRepository.port';
import { defaultLeaseValues, type LeaseFormData } from '../../src/landlord/leases/schema/leaseFormSchema';
import { LeaseCreateDraftProvider, useLeaseCreateDraftContext } from '../../src/landlord/leases/drafts/LeaseCreateDraftProvider';
import type { LeaseDraftPayload } from '../../src/landlord/leases/drafts/leaseDraftDefinition';

let repository: DraftRepository;
vi.mock('../../src/drafts/DraftRepositoryContext', () => ({ useDraftRepository: () => repository }));

function record(title = 'Persistita', activeTab: LeaseDraftPayload['activeTab'] = 'contract', formData: Partial<LeaseFormData> = {}): DraftRecord<LeaseDraftPayload> {
    return { id: 'd1', accountId: 'user-001', formType: 'lease', mode: 'create', entityId: null, schemaVersion: 1, createdAt: 'x', updatedAt: 'x', payload: { formData: { ...defaultLeaseValues, LeaseIdentificativo: title, ...formData }, activeTab } };
}

function fake(initial: DraftRecord<LeaseDraftPayload> | null = null): DraftRepository {
    let current = initial;
    return {
        get: vi.fn(async () => current), list: vi.fn(async () => current ? [current] : []),
        save: vi.fn(async (_definition, input) => {
            const payload = input.payload as LeaseDraftPayload;
            current = record(payload.formData.LeaseIdentificativo, payload.activeTab, payload.formData);
            return current;
        }),
        delete: vi.fn(async () => { current = null; return true; }),
    };
}

function Probe() {
    const draft = useLeaseCreateDraftContext();
    const methods = useFormContext<LeaseFormData>();
    return <div>
        <label>Identificativo<input aria-label="Identificativo" {...methods.register('LeaseIdentificativo')} /></label>
        <output data-testid="tab">{draft.activeTab}</output><output data-testid="dirty">{String(methods.formState.isDirty)}</output>
        <output data-testid="references">{JSON.stringify({ property: methods.watch('PropertyID'), tenants: methods.watch('LeaseTenantIds'), guarantors: methods.watch('LeaseGarantIds'), insurance: methods.watch('LeaseInsuranceContracts') })}</output>
        <button type="button" onClick={() => draft.setActiveTab('contract')}>Contratto</button>
        <button type="button" disabled={draft.isSavingDraft} onClick={() => { void draft.saveDraft().catch(() => undefined); }}>Salva bozza</button>
        <span>{draft.draftSuccess}</span>{draft.draftError ? <span role="alert">{draft.draftError}</span> : null}
    </div>;
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('LeaseCreateDraftProvider integration', () => {
    it('mostra loading e poi form default ready senza autosave', async () => {
        let resolve!: (value: null) => void;
        repository = fake(); vi.mocked(repository.get).mockReturnValue(new Promise((done) => { resolve = done; }));
        render(<LeaseCreateDraftProvider onExitDraft={vi.fn()}><Probe /></LeaseCreateDraftProvider>);
        expect(screen.getByRole('status').textContent).toBe('Caricamento bozza...');
        expect(screen.queryByLabelText('Identificativo')).toBeNull();
        resolve(null); await screen.findByLabelText('Identificativo');
        expect(screen.getByTestId('tab').textContent).toBe('general');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('non idrata prima della scelta e Annulla esce senza mutazioni', async () => {
        repository = fake(record()); const exit = vi.fn();
        render(<LeaseCreateDraftProvider onExitDraft={exit}><Probe /></LeaseCreateDraftProvider>);
        await screen.findByRole('heading', { name: 'Bozza locazione disponibile' });
        expect(screen.queryByLabelText('Identificativo')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
        expect(exit).toHaveBeenCalledOnce(); expect(repository.save).not.toHaveBeenCalled(); expect(repository.delete).not.toHaveBeenCalled();
    });

    it('Riprendi applica valore e tab clean senza scritture', async () => {
        repository = fake(record()); render(<LeaseCreateDraftProvider onExitDraft={vi.fn()}><Probe /></LeaseCreateDraftProvider>);
        fireEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));
        expect(await screen.findByDisplayValue('Persistita')).toBeTruthy();
        expect(screen.getByTestId('tab').textContent).toBe('contract'); expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled(); expect(repository.delete).not.toHaveBeenCalled();
    });

    it('Elimina e ricomincia usa lease create null e torna ai default', async () => {
        repository = fake(record()); render(<LeaseCreateDraftProvider onExitDraft={vi.fn()}><Probe /></LeaseCreateDraftProvider>);
        fireEvent.click(await screen.findByRole('button', { name: 'Elimina e ricomincia' }));
        await screen.findByLabelText('Identificativo');
        expect(repository.delete).toHaveBeenCalledWith({ formType: 'lease', mode: 'create', entityId: null });
        expect((screen.getByLabelText('Identificativo') as HTMLInputElement).value).toBe(defaultLeaseValues.LeaseIdentificativo);
        expect(screen.getByTestId('tab').textContent).toBe('general');
    });

    it('errore load consente nuovo tentativo ed Esci', async () => {
        repository = fake(); vi.mocked(repository.get).mockRejectedValueOnce(new Error('x')).mockResolvedValue(null); const exit = vi.fn();
        render(<LeaseCreateDraftProvider onExitDraft={exit}><Probe /></LeaseCreateDraftProvider>);
        fireEvent.click(await screen.findByRole('button', { name: 'Riprova' }));
        await screen.findByLabelText('Identificativo'); expect(repository.get).toHaveBeenCalledTimes(2);
        cleanup(); repository = fake(); vi.mocked(repository.get).mockRejectedValue(new Error('x'));
        render(<LeaseCreateDraftProvider onExitDraft={exit}><Probe /></LeaseCreateDraftProvider>);
        fireEvent.click(await screen.findByRole('button', { name: 'Esci' })); expect(exit).toHaveBeenCalled();
    });

    it('salva manualmente bozza incompleta e activeTab senza navigare', async () => {
        repository = fake(); render(<LeaseCreateDraftProvider onExitDraft={vi.fn()}><Probe /></LeaseCreateDraftProvider>); await screen.findByLabelText('Identificativo');
        fireEvent.change(screen.getByLabelText('Identificativo'), { target: { value: 'Manuale' } }); fireEvent.click(screen.getByRole('button', { name: 'Contratto' }));
        expect(repository.save).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await screen.findByText('Bozza salvata.'); expect(repository.save).toHaveBeenCalledOnce();
        expect(vi.mocked(repository.save).mock.calls[0][1]).toMatchObject({ mode: 'create', payload: { activeTab: 'contract', formData: { LeaseIdentificativo: 'Manuale' } } });
        expect(screen.getByTestId('dirty').textContent).toBe('false');
    });

    it('non autosalva modifiche o tab e remount non ripristina modifiche non salvate', async () => {
        repository = fake(); const view = render(<LeaseCreateDraftProvider onExitDraft={vi.fn()}><Probe /></LeaseCreateDraftProvider>); await screen.findByLabelText('Identificativo');
        fireEvent.change(screen.getByLabelText('Identificativo'), { target: { value: 'Non salvata' } }); fireEvent.click(screen.getByRole('button', { name: 'Contratto' }));
        await act(async () => { await Promise.resolve(); }); expect(repository.save).not.toHaveBeenCalled();
        view.unmount(); render(<LeaseCreateDraftProvider onExitDraft={vi.fn()}><Probe /></LeaseCreateDraftProvider>); await screen.findByLabelText('Identificativo');
        expect((screen.getByLabelText('Identificativo') as HTMLInputElement).value).not.toBe('Non salvata');
    });

    it('Strict Mode esegue un solo load e nessuna scrittura', async () => {
        repository = fake(); render(<StrictMode><LeaseCreateDraftProvider onExitDraft={vi.fn()}><Probe /></LeaseCreateDraftProvider></StrictMode>);
        await screen.findByLabelText('Identificativo'); await waitFor(() => expect(repository.get).toHaveBeenCalledOnce()); expect(repository.save).not.toHaveBeenCalled();
    });

    it('choice, Riprendi e save manuale conservano riferimenti non risolti senza autosave', async () => {
        const references = {
            PropertyID: 'property-missing',
            LeaseTenantIds: ['tenant-missing', 'tenant-missing'],
            LeaseGarantIds: ['guarantor-missing'],
            LeaseInsuranceContracts: [{ LeaseInsuranceType: 'locativa' as const, LeaseInsuranceDescription: 'QA', LeaseInsuranceStartDate: '', LeaseInsuranceEndDate: '', LeaseInsuranceDocumentId: 'document-missing' }],
        };
        repository = fake(record('Con riferimenti', 'guarantors', references));
        render(<LeaseCreateDraftProvider onExitDraft={vi.fn()}><Probe /></LeaseCreateDraftProvider>);
        expect(await screen.findByRole('heading', { name: 'Bozza locazione disponibile' })).toBeTruthy();
        expect(screen.queryByTestId('references')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Riprendi bozza' }));
        await screen.findByDisplayValue('Con riferimenti');
        expect(JSON.parse(screen.getByTestId('references').textContent || '{}')).toEqual({
            property: references.PropertyID,
            tenants: references.LeaseTenantIds,
            guarantors: references.LeaseGarantIds,
            insurance: references.LeaseInsuranceContracts,
        });
        expect(repository.save).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await screen.findByText('Bozza salvata.');
        expect((vi.mocked(repository.save).mock.calls[0][1].payload as LeaseDraftPayload).formData).toMatchObject(references);
    });
});
