// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LeaseForm } from '../../src/landlord/leases/components/LeaseForm';
import { defaultLeaseValues } from '../../src/landlord/leases/schema/leaseFormSchema';

const updateLease = vi.fn((id: string, formData: unknown) => ({ id, formData }));
vi.mock('../../src/db/leaseRepository', () => ({
    getLeaseDetail: () => null,
    createLease: vi.fn(),
    updateLease: (...args: unknown[]) => updateLease(args[0] as string, args[1]),
}));
vi.mock('../../src/db/jsonDb', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../src/db/jsonDb')>();
    return { ...actual, getJsonDb: () => ({ properties: [], tenants: [] }), subscribeJsonDb: () => () => undefined };
});
vi.mock('../../src/contacts/useContactList', () => ({ useContactList: () => ({ contacts: [], status: 'ready', error: null, refresh: vi.fn() }) }));

afterEach(() => { cleanup(); updateLease.mockClear(); });

describe('LeaseForm edit draft regression', () => {
    it('monta senza provider create, applica initialValues e non mostra UI bozza', () => {
        render(<MemoryRouter><LeaseForm mode="edit" leaseId="lease-1" initialValues={{ ...defaultLeaseValues, LeaseIdentificativo: 'Edit esistente' }} /></MemoryRouter>);
        expect(screen.getByDisplayValue('Edit esistente')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Salva bozza' })).toBeNull();
        expect(screen.queryByText('Bozza locazione disponibile')).toBeNull();
        expect(screen.queryByText(/salvata nella bozza/)).toBeNull();
        expect(screen.queryByText(/Riferimento conservato/)).toBeNull();
        expect(screen.getByText('Modifica locazione')).toBeTruthy();
    });

    it('mantiene cambio scheda e modifica campo senza repository F1', () => {
        render(<MemoryRouter><LeaseForm mode="edit" leaseId="lease-1" initialValues={{ ...defaultLeaseValues, LeaseIdentificativo: 'Edit esistente' }} /></MemoryRouter>);
        fireEvent.click(screen.getByRole('tab', { name: 'Inquilini' }));
        expect(screen.getByRole('tab', { name: 'Inquilini' }).getAttribute('aria-selected')).toBe('true');
        fireEvent.click(screen.getByRole('tab', { name: 'Informazioni Generali' }));
        fireEvent.change(screen.getByDisplayValue('Edit esistente'), { target: { value: 'Modificato' } });
        expect(screen.getByDisplayValue('Modificato')).toBeTruthy();
    });

    it('conserva le schede documenti, contratto e firma', () => {
        render(<MemoryRouter><LeaseForm mode="edit" leaseId="lease-1" initialValues={defaultLeaseValues} /></MemoryRouter>);
        expect(screen.getByRole('tab', { name: 'Documenti' })).toBeTruthy();
        expect(screen.getByRole('tab', { name: 'Contratto' })).toBeTruthy();
        expect(screen.getByRole('tab', { name: 'Firma' })).toBeTruthy();
    });
});
