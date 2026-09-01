// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContactRecord } from '../../src/db/database.types';
import { defaultTenantValues, normalizeTenantFormData, type TenantFormData } from '../../src/components/tenant-form/schema';
import { tenantDraftDefinition } from '../../src/components/tenant-form/tenantDraftDefinition';
import { Tab3Guarantors } from '../../src/components/tenant-form/tabs/Tab3Guarantors';
import { Tab4Emergency } from '../../src/components/tenant-form/tabs/Tab4Emergency';

const mocks = vi.hoisted(() => ({
    create: vi.fn(),
    update: vi.fn(),
    refresh: vi.fn(),
    generateId: vi.fn(),
    contacts: [] as ContactRecord[],
}));

vi.mock('../../src/utils/id', () => ({ generateId: mocks.generateId }));
vi.mock('../../src/contacts/ContactRepositoryContext', () => ({
    useContactRepository: () => ({ create: mocks.create, update: mocks.update }),
}));
vi.mock('../../src/contacts/useContactList', () => ({
    useContactList: () => ({ contacts: mocks.contacts, status: 'ready', error: null, refresh: mocks.refresh }),
}));

function contact(overrides: Partial<ContactRecord> = {}): ContactRecord {
    return {
        id: 'contact-1', type: 'person', companyName: '', firstName: 'Mario', lastName: 'Rossi',
        birthDate: '', birthPlace: '', fiscalCode: '', vatNumber: '', email: '', phone: '333',
        address: '', city: '', zip: '', country: 'IT', notes: '', archived: false,
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', ...overrides,
    };
}

function Values({ name }: { name: 'TenantGuarantors' | 'TenantEmergencyContacts' }) {
    const values = useWatch<TenantFormData>({ name });
    return <output data-testid="values">{JSON.stringify(values)}</output>;
}

function Harness({ tab, values = {} }: {
    tab: 'guarantor' | 'emergency';
    values?: Partial<TenantFormData>;
}) {
    const methods = useForm<TenantFormData>({ defaultValues: { ...defaultTenantValues, ...values } });
    return <FormProvider {...methods}>
        {tab === 'guarantor' ? <Tab3Guarantors /> : <Tab4Emergency />}
        <Values name={tab === 'guarantor' ? 'TenantGuarantors' : 'TenantEmergencyContacts'} />
    </FormProvider>;
}

afterEach(cleanup);
beforeEach(() => {
    vi.clearAllMocks();
    mocks.contacts = [contact()];
    let sequence = 0;
    mocks.generateId.mockImplementation((prefix: string) => `${prefix}-uuid-${++sequence}`);
});

describe('ID canonici relazioni Tenant', () => {
    it('genera il relation ID garante solo al Salva di un Contact esistente', async () => {
        const user = userEvent.setup();
        render(<Harness tab="guarantor" />);
        expect(mocks.generateId).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Aggiungi un garante' }));
        await user.selectOptions(screen.getByLabelText('Garante'), 'contact-1');
        expect(mocks.generateId).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(mocks.generateId).toHaveBeenCalledOnce();
        expect(mocks.generateId).toHaveBeenCalledWith('tenant-guarantor');
        const values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values[0]).toMatchObject({ id: 'tenant-guarantor-uuid-1', contactId: 'contact-1' });
        expect(values[0].id).not.toBe(values[0].contactId);
        expect(mocks.create).not.toHaveBeenCalled();
    });

    it('non consuma ID se create garante fallisce e ne genera uno dopo retry riuscito', async () => {
        const user = userEvent.setup();
        mocks.create.mockRejectedValueOnce(new Error('Fallita')).mockResolvedValueOnce(contact({ id: 'created-g' }));
        render(<Harness tab="guarantor" />);
        await user.click(screen.getByRole('button', { name: 'Aggiungi un garante' }));
        await user.selectOptions(screen.getByLabelText('Garante'), 'new');
        await user.type(screen.getByLabelText(/Nome/), 'Anna');
        await user.type(screen.getByLabelText(/Cognome/), 'Bianchi');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(mocks.generateId).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(screen.getByTestId('values').textContent).toContain('created-g'));
        expect(mocks.generateId).toHaveBeenCalledOnce();
        expect(mocks.generateId).toHaveBeenCalledWith('tenant-guarantor');
    });

    it('preserva byte-for-byte ID linked e legacy durante edit garante', async () => {
        const user = userEvent.setup();
        render(<Harness tab="guarantor" values={{ TenantGuarantors: [
            { id: 'legacy-guarantor-id', contactId: 'contact-1', contactType: 'person', firstName: 'Old', lastName: 'Linked' },
            { id: 'legacy-custom-id', contactType: 'person', firstName: 'Legacy', lastName: 'Inline' },
        ] as TenantFormData['TenantGuarantors'] }} />);
        await user.click(screen.getAllByTitle('Modifica')[0]);
        await user.type(screen.getByLabelText('Note'), 'Linked note');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        await user.click(screen.getAllByTitle('Modifica')[1]);
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        const values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values.map((item: { id: string }) => item.id)).toEqual(['legacy-guarantor-id', 'legacy-custom-id']);
        expect(mocks.generateId).not.toHaveBeenCalled();
    });

    it('genera un solo ID Emergency canonico e primary non rigenera gli ID', async () => {
        const user = userEvent.setup();
        render(<Harness tab="emergency" values={{ TenantEmergencyContacts: [
            { id: 'emergency-A', contactType: 'person', firstName: 'A', lastName: 'One', phone: '1', isPrimary: true },
        ] as TenantFormData['TenantEmergencyContacts'] }} />);
        await user.click(screen.getByRole('button', { name: 'Aggiungi un contatto di emergenza' }));
        await user.selectOptions(screen.getByLabelText('Contatto'), 'contact-1');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(mocks.generateId).toHaveBeenCalledOnce();
        expect(mocks.generateId).toHaveBeenCalledWith('tenant-emergency');
        let values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values.map((item: { id: string }) => item.id)).toEqual(['emergency-A', 'tenant-emergency-uuid-1']);
        await user.click(screen.getAllByTitle('Imposta come principale')[1]);
        values = JSON.parse(screen.getByTestId('values').textContent || '[]');
        expect(values.map((item: { id: string }) => item.id)).toEqual(['emergency-A', 'tenant-emergency-uuid-1']);
        expect(mocks.generateId).toHaveBeenCalledOnce();
    });

    it('delete e recreate verso lo stesso Contact usa un nuovo relation ID', async () => {
        const user = userEvent.setup();
        render(<Harness tab="guarantor" />);
        const add = async () => {
            await user.click(screen.getByRole('button', { name: 'Aggiungi un garante' }));
            await user.selectOptions(screen.getByLabelText('Garante'), 'contact-1');
            await user.click(screen.getByRole('button', { name: 'Salva' }));
        };
        await add();
        const first = JSON.parse(screen.getByTestId('values').textContent || '[]')[0];
        await user.click(screen.getByTitle('Elimina'));
        await user.click(screen.getByRole('button', { name: 'Conferma' }));
        await add();
        const second = JSON.parse(screen.getByTestId('values').textContent || '[]')[0];
        expect(first.contactId).toBe(second.contactId);
        expect(first.id).not.toBe(second.id);
        expect(mocks.generateId).toHaveBeenCalledTimes(2);
    });

    it('draft e normalization preservano gli ID senza generazione', () => {
        const payload = {
            TenantFirstName: 'Ada', TenantLastName: 'Lovelace',
            TenantGuarantors: [{ id: 'tenant-guarantor-roundtrip', contactType: 'person' as const }],
            TenantEmergencyContacts: [{ id: 'tenant-emergency-roundtrip', contactType: 'person' as const, isPrimary: true }],
        };
        const normalized = normalizeTenantFormData(payload);
        const draft = tenantDraftDefinition.parse(payload, 1);
        expect(normalized.TenantGuarantors[0].id).toBe('tenant-guarantor-roundtrip');
        expect(normalized.TenantEmergencyContacts[0].id).toBe('tenant-emergency-roundtrip');
        expect(draft.TenantGuarantors[0].id).toBe('tenant-guarantor-roundtrip');
        expect(draft.TenantEmergencyContacts[0].id).toBe('tenant-emergency-roundtrip');
        expect(mocks.generateId).not.toHaveBeenCalled();
    });
});
