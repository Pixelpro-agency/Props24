// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { BuildingCreateForm } from '../../src/components/building-form/BuildingCreateForm';
import { DraftRepositoryProvider } from '../../src/drafts/DraftRepositoryContext';
import { createBuildingRepository } from '../../src/db/buildingRepository';
import { MemoryStorage, installJsonDbWindow, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';

const ACCOUNT_A = 'user-9301';
const ACCOUNT_B = 'user-9302';

function renderCreate(accountId: string, onCreated?: (building: ReturnType<ReturnType<typeof createBuildingRepository>['create']>) => void) {
    const router = createMemoryRouter([{
        path: '/',
        element: <DraftRepositoryProvider accountId={accountId}><BuildingCreateForm accountId={accountId} onCreated={onCreated} /></DraftRepositoryProvider>,
    }], { initialEntries: ['/'] });
    return render(<RouterProvider router={router} />);
}

function fillRequired(identifier: string, address = 'Via Roma 1') {
    fireEvent.change(document.getElementById('identifier')!, { target: { value: identifier } });
    fireEvent.change(document.getElementById('address')!, { target: { value: address } });
    fireEvent.change(document.getElementById('city')!, { target: { value: 'Roma' } });
    fireEvent.change(document.getElementById('postalCode')!, { target: { value: '00100' } });
    fireEvent.change(document.getElementById('country')!, { target: { value: 'it' } });
}

beforeEach(() => {
    installJsonDbWindow(new MemoryStorage());
    Object.defineProperty(window, 'document', { configurable: true, value: document });
});
afterEach(() => {
    cleanup();
    uninstallJsonDbWindow();
});

describe('BuildingCreateForm', () => {
    it('persiste un record canonico account-scoped e notifica un solo successo', async () => {
        const user = userEvent.setup();
        const onCreated = vi.fn();
        renderCreate(ACCOUNT_A, onCreated);
        await screen.findByRole('button', { name: 'Salva' });
        fillRequired('  Edificio Persistito  ');
        fireEvent.change(document.getElementById('color')!, { target: { value: '#ABC' } });
        fireEvent.change(document.getElementById('size')!, { target: { value: '125.5' } });
        fireEvent.change(document.getElementById('description')!, { target: { value: '  Descrizione  ' } });
        await user.click(screen.getByRole('tab', { name: 'Informazioni aggiuntive' }));
        await user.click(screen.getByRole('checkbox', { name: 'Garage' }));
        await user.click(screen.getByRole('tab', { name: 'Informazioni finanziarie' }));
        fireEvent.change(screen.getByLabelText('Data di acquisto'), { target: { value: '2024-02-29' } });
        fireEvent.change(screen.getByLabelText("Prezzo d'acquisto"), { target: { value: '200000' } });
        await user.click(screen.getByRole('button', { name: 'Salva' }));

        await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
        const created = onCreated.mock.calls[0][0];
        const persisted = createBuildingRepository({ accountId: ACCOUNT_A }).getById(created.id);
        expect(persisted).toEqual(created);
        expect(created).toMatchObject({
            identifier: 'Edificio Persistito', color: '#abc', address: 'Via Roma 1', city: 'Roma',
            postalCode: '00100', country: 'IT', size: 125.5, description: 'Descrizione',
            features: ['Garage'], acquisitionDate: '2024-02-29', purchasePrice: 200000,
            unitsCount: 0, archived: false,
        });
        expect(created.id).toMatch(/^building-/);
        expect(createBuildingRepository({ accountId: ACCOUNT_A }).list()).toHaveLength(1);
        expect(createBuildingRepository({ accountId: ACCOUNT_B }).list()).toHaveLength(0);
        expect(screen.getAllByRole('status')).toHaveLength(1);
    });

    it('rifiuta un identificativo duplicato senza falso successo', async () => {
        const user = userEvent.setup();
        const repository = createBuildingRepository({ accountId: 'user-9311' });
        repository.create({ identifier: 'Duplicato', address: 'Via Uno 1', city: 'Roma', postalCode: '00100', country: 'IT' });
        renderCreate('user-9311');
        await screen.findByRole('button', { name: 'Salva' });
        fillRequired('Duplicato', 'Via Due 2');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(document.activeElement).toBe(document.getElementById('identifier')));
        expect(repository.list()).toHaveLength(1);
        expect(screen.getByRole('alert').textContent).toContain('Esiste già un edificio');
        expect(screen.queryByRole('status')).toBeNull();
        expect((document.getElementById('address') as HTMLInputElement).value).toBe('Via Due 2');
    });

    it('rifiuta una localizzazione duplicata senza falso successo', async () => {
        const user = userEvent.setup();
        const repository = createBuildingRepository({ accountId: 'user-9321' });
        repository.create({ identifier: 'Esistente', address: 'Via Roma 1', city: 'Roma', postalCode: '00100', country: 'IT' });
        renderCreate('user-9321');
        await screen.findByRole('button', { name: 'Salva' });
        fillRequired('Nuovo identificativo');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(document.activeElement).toBe(document.getElementById('address')));
        expect(repository.list()).toHaveLength(1);
        expect(screen.getByRole('alert').textContent).toBe('Esiste già un edificio allo stesso indirizzo.');
        expect(screen.queryByRole('status')).toBeNull();
        expect((document.getElementById('identifier') as HTMLInputElement).value).toBe('Nuovo identificativo');
    });
});
