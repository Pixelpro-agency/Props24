// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ContactListStatus } from '../../src/contacts/contactListStore';
import type { ContactRecord, PropertyRecord, TenantRecord } from '../../src/db/database.types';
import type { DraftRecord, DraftRepository } from '../../src/db/draftRepository.port';
import { LeaseForm } from '../../src/landlord/leases/components/LeaseForm';
import { LeaseCreateDraftProvider } from '../../src/landlord/leases/drafts/LeaseCreateDraftProvider';
import type { LeaseDraftPayload } from '../../src/landlord/leases/drafts/leaseDraftDefinition';
import { defaultLeaseValues, type LeaseFormData } from '../../src/landlord/leases/schema/leaseFormSchema';

let repository: DraftRepository;
let snapshotListener: (() => void) | undefined;
let contactsState: { contacts: ContactRecord[]; status: ContactListStatus; error: string | null };

const property = (id: string, archived: boolean): PropertyRecord => ({
    id,
    archived,
    formData: { PropertyTitle: `Proprietà ${id}`, PropertyAddress: 'Via QA 1', PropertyPostalCode: '00100', PropertyCity: 'Roma', PropertyRent: 900, PropertyMaintenance: 100 },
} as PropertyRecord);

const tenant = (id: string, archived: boolean): TenantRecord => ({
    id,
    archived,
    type: 'person',
    firstName: `Tenant ${id}`,
    lastName: 'QA',
    companyName: '',
    email: `${id}@example.test`,
    mobilePhone: '',
    phone: '',
} as TenantRecord);

const contact = (id: string, archived: boolean): ContactRecord => ({
    id,
    archived,
    type: 'person',
    firstName: `Garante ${id}`,
    lastName: 'QA',
    companyName: '',
    email: `${id}@example.test`,
    phone: '',
} as ContactRecord);

let db = {
    properties: [property('property-active', false), property('property-archived', true)],
    tenants: [tenant('tenant-active', false), tenant('tenant-archived', true)],
};

vi.mock('../../src/db/jsonDb', () => ({
    getJsonDb: () => db,
    subscribeJsonDb: (listener: () => void) => { snapshotListener = listener; return () => { snapshotListener = undefined; }; },
}));
vi.mock('../../src/contacts/useContactList', () => ({
    useContactList: () => ({ ...contactsState, refresh: vi.fn(async () => undefined) }),
}));
vi.mock('../../src/drafts/DraftRepositoryContext', () => ({ useDraftRepository: () => repository }));
vi.mock('../../src/contacts/ContactRepositoryContext', () => ({ useContactRepository: () => ({}) }));
vi.mock('../../src/db/leaseRepository', () => ({ createLease: vi.fn(), updateLease: vi.fn(), getLeaseDetail: () => null }));

function draftRecord(formData: LeaseFormData): DraftRecord<LeaseDraftPayload> {
    return {
        id: 'draft-1', accountId: 'user-001', formType: 'lease', mode: 'create', entityId: null,
        schemaVersion: 1, createdAt: 'x', updatedAt: 'x',
        payload: { formData, activeTab: 'general' },
    };
}

function fakeRepository(initial: DraftRecord<LeaseDraftPayload>): DraftRepository {
    let current = initial;
    return {
        get: vi.fn(async () => current),
        list: vi.fn(async () => [current]),
        save: vi.fn(async (_definition, input) => {
            current = draftRecord((input.payload as LeaseDraftPayload).formData);
            current.payload.activeTab = (input.payload as LeaseDraftPayload).activeTab;
            return current;
        }),
        delete: vi.fn(async () => true),
    };
}

function StateProbe() {
    const { formState } = useFormContext<LeaseFormData>();
    return <output data-testid="dirty">{String(formState.isDirty)}</output>;
}

function renderCreate() {
    return render(
        <MemoryRouter>
            <LeaseCreateDraftProvider onExitDraft={vi.fn()}>
                <StateProbe />
                <LeaseForm />
            </LeaseCreateDraftProvider>
        </MemoryRouter>,
    );
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    snapshotListener = undefined;
    db = {
        properties: [property('property-active', false), property('property-archived', true)],
        tenants: [tenant('tenant-active', false), tenant('tenant-archived', true)],
    };
});

describe('Lease draft reference reconciliation integration', () => {
    it('rappresenta riferimenti archived e missing senza mutare o autosalvare', async () => {
        const formData: LeaseFormData = {
            ...defaultLeaseValues,
            PropertyID: 'property-archived',
            LeaseTenantIds: ['tenant-active', 'tenant-archived', 'tenant-missing', 'tenant-missing'],
            LeaseGarantIds: ['guarantor-active', 'guarantor-missing'],
            LeaseInsuranceContracts: [{ LeaseInsuranceType: 'locativa', LeaseInsuranceDescription: 'QA', LeaseInsuranceStartDate: '', LeaseInsuranceEndDate: '', LeaseInsuranceDocumentId: 'insurance-document-qa' }],
        };
        repository = fakeRepository(draftRecord(formData));
        contactsState = { contacts: [], status: 'loading', error: null };
        const view = renderCreate();
        fireEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));

        expect(await screen.findByText(/La proprietà salvata nella bozza è archiviata/)).toBeTruthy();
        expect((screen.getByRole('combobox', { name: 'Proprietà *' }) as HTMLSelectElement).value).toBe('property-archived');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('tab', { name: 'Inquilini' }));
        expect(screen.getByText('Tenant tenant-active QA')).toBeTruthy();
        expect(screen.getByText(/tenant-archived@example.test.*archiviato/)).toBeTruthy();
        expect(screen.getAllByText('Inquilino non disponibile')).toHaveLength(2);
        expect(screen.queryByText('Nessun inquilino aggiunto.')).toBeNull();

        fireEvent.click(screen.getByRole('tab', { name: 'Garanti' }));
        expect(screen.getAllByText('Verifica del garante in corso')).toHaveLength(2);
        expect(screen.queryByText('Nessun garante aggiunto.')).toBeNull();

        contactsState = { contacts: [contact('guarantor-active', false)], status: 'error', error: 'Errore contatti QA' };
        view.rerender(
            <MemoryRouter>
                <LeaseCreateDraftProvider onExitDraft={vi.fn()}><StateProbe /><LeaseForm /></LeaseCreateDraftProvider>
            </MemoryRouter>,
        );
        expect(await screen.findByText('Garante guarantor-active QA')).toBeTruthy();
        expect(screen.getByText('Garante non verificabile')).toBeTruthy();
        expect(screen.getByText('Errore contatti QA')).toBeTruthy();
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Salva bozza' }));
        await screen.findByText('Bozza salvata.');
        const saved = (vi.mocked(repository.save).mock.calls[0][1].payload as LeaseDraftPayload).formData;
        expect(saved.PropertyID).toBe(formData.PropertyID);
        expect(saved.LeaseTenantIds).toEqual(formData.LeaseTenantIds);
        expect(saved.LeaseGarantIds).toEqual(formData.LeaseGarantIds);
        expect(saved.LeaseInsuranceContracts[0].LeaseInsuranceDocumentId).toBe('insurance-document-qa');
    });

    it('rimuove una sola occorrenza per indice e aggiorna solo per azione esplicita', async () => {
        repository = fakeRepository(draftRecord({
            ...defaultLeaseValues,
            LeaseTenantIds: ['tenant-missing', 'tenant-missing'],
            LeaseGarantIds: ['guarantor-missing', 'guarantor-missing'],
        }));
        contactsState = { contacts: [], status: 'ready', error: null };
        renderCreate();
        fireEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));

        fireEvent.click(screen.getByRole('tab', { name: 'Inquilini' }));
        fireEvent.click(screen.getByRole('button', { name: 'Rimuovi riferimento inquilino 1' }));
        expect(screen.getAllByText('Inquilino non disponibile')).toHaveLength(1);
        expect(screen.getByTestId('dirty').textContent).toBe('true');
        expect(repository.save).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('tab', { name: 'Garanti' }));
        fireEvent.click(screen.getByRole('button', { name: 'Rimuovi riferimento garante 1' }));
        expect(screen.getAllByText('Garante non disponibile')).toHaveLength(1);
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('aggiorna la sola rappresentazione al cambio snapshot e conserva il form clean', async () => {
        repository = fakeRepository(draftRecord({ ...defaultLeaseValues, PropertyID: 'property-missing', LeaseTenantIds: ['tenant-missing'] }));
        contactsState = { contacts: [], status: 'ready', error: null };
        renderCreate();
        fireEvent.click(await screen.findByRole('button', { name: 'Riprendi bozza' }));
        expect(screen.getByText(/Il riferimento è stato conservato: property-missing/)).toBeTruthy();
        db = { ...db, properties: [...db.properties, property('property-missing', false)], tenants: [...db.tenants, tenant('tenant-missing', false)] };
        snapshotListener?.();
        await waitFor(() => expect(screen.queryByText(/Il riferimento è stato conservato: property-missing/)).toBeNull());
        expect((screen.getByRole('combobox', { name: 'Proprietà *' }) as HTMLSelectElement).value).toBe('property-missing');
        expect(screen.getByTestId('dirty').textContent).toBe('false');
        expect(repository.save).not.toHaveBeenCalled();
    });
});
