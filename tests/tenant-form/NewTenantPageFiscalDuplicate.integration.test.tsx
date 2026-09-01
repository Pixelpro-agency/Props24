// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DraftRepository } from '../../src/db/draftRepository.port';
import { DuplicateTenantFiscalIdentityError } from '../../src/db/databaseErrors';
import { createTenant } from '../../src/db/tenantRepository';
import type { TenantFormData } from '../../src/components/tenant-form/schema';
import { useTenantFormContext } from '../../src/components/tenant-form/TenantFormProvider';
import { NewTenantPage } from '../../src/pages/NewTenantPage';

let repository: DraftRepository;

vi.mock('../../src/drafts/DraftRepositoryContext', () => ({ useDraftRepository: () => repository }));
vi.mock('../../src/db/tenantRepository', () => ({ createTenant: vi.fn() }));

vi.mock('../../src/components/tenant-form/TenantFormTabs', () => ({
    TENANT_TABS: [{ id: 'info1', label: 'Informazioni generali' }, { id: 'info2', label: 'Informazioni aggiuntive' }],
    TenantFormTabs: () => {
        const { activeTab, setActiveTab } = useTenantFormContext();
        return <nav>
            <button type="button" aria-pressed={activeTab === 'info1'} onClick={() => setActiveTab('info1')}>Informazioni generali</button>
            <button type="button" aria-pressed={activeTab === 'info2'} onClick={() => setActiveTab('info2')}>Informazioni aggiuntive</button>
        </nav>;
    },
}));

vi.mock('../../src/components/tenant-form/tabs/Tab1General', () => ({
    Tab1General: () => {
        const { register, formState: { errors } } = useFormContext<TenantFormData>();
        return <div data-testid="info1">
            <select aria-label="Tipo" {...register('TenantType')}><option value="person">Person</option><option value="company">Company</option></select>
            <input aria-label="Nome" {...register('TenantFirstName')} />
            <input aria-label="Cognome" {...register('TenantLastName')} />
            <input aria-label="Società" {...register('TenantCompanyName')} />
            <input aria-label="CF persona" {...register('TenantFiscalCode')} />
            <input aria-label="CF ente" {...register('TenantCompanyFiscalCode')} />
            <input aria-label="PIVA ente" {...register('TenantVatNumber')} />
            {errors.TenantFiscalCode?.message && <p data-testid="error-person">{errors.TenantFiscalCode.message}</p>}
            {errors.TenantCompanyFiscalCode?.message && <p data-testid="error-company-cf">{errors.TenantCompanyFiscalCode.message}</p>}
            {errors.TenantVatNumber?.message && <p data-testid="error-company-vat">{errors.TenantVatNumber.message}</p>}
        </div>;
    },
}));
vi.mock('../../src/components/tenant-form/tabs/Tab2Additional', () => ({ Tab2Additional: () => <div data-testid="info2">secondaria</div> }));
vi.mock('../../src/components/tenant-form/tabs/Tab3Guarantors', () => ({ Tab3Guarantors: () => null }));
vi.mock('../../src/components/tenant-form/tabs/Tab4Emergency', () => ({ Tab4Emergency: () => null }));
vi.mock('../../src/components/tenant-form/tabs/Tab5Documents', () => ({ Tab5Documents: () => null }));

function makeRepository(): DraftRepository {
    return {
        get: vi.fn().mockResolvedValue(null), list: vi.fn().mockResolvedValue([]), save: vi.fn(),
        delete: vi.fn().mockResolvedValue(true),
    };
}

function renderPage() {
    repository = makeRepository();
    const router = createMemoryRouter([
        { path: '/tenants/new', element: <NewTenantPage /> },
        { path: '/tenants/:id', element: <div>tenant detail</div> },
        { path: '/tenants', element: <div>tenant list</div> },
    ], { initialEntries: ['/tenants/new'] });
    render(<RouterProvider router={router} />);
    return router;
}

async function fillPerson() {
    await userEvent.type(await screen.findByLabelText('Nome'), 'Ada');
    await userEvent.type(screen.getByLabelText('Cognome'), 'Lovelace');
    await userEvent.type(screen.getByLabelText('CF persona'), 'DUPLICATE');
}

async function submitFromInfo2() {
    await userEvent.click(screen.getByRole('button', { name: 'Informazioni aggiuntive' }));
    expect(screen.getByTestId('info2')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
});

describe('NewTenantPage duplicate fiscale C3.3', () => {
    it('person torna a info1, mostra inline/toast, preserva draft e consente retry con navigazione', async () => {
        vi.mocked(createTenant)
            .mockImplementationOnce(() => { throw new DuplicateTenantFiscalIdentityError('fiscalCode', 'tenant-existing'); })
            .mockReturnValueOnce({ id: 'tenant-created' } as never);
        const router = renderPage();
        await fillPerson();
        await submitFromInfo2();
        expect(await screen.findByTestId('info1')).toBeTruthy();
        expect(screen.getByTestId('error-person').textContent).toContain('stesso codice fiscale');
        expect(screen.queryByTestId('error-company-cf')).toBeNull();
        expect((await screen.findAllByText(/stesso codice fiscale/)).length).toBeGreaterThan(1);
        expect(router.state.location.pathname).toBe('/tenants/new');
        expect(repository.delete).not.toHaveBeenCalled();

        await userEvent.clear(screen.getByLabelText('CF persona'));
        await userEvent.type(screen.getByLabelText('CF persona'), 'UNIQUE');
        await userEvent.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(router.state.location.pathname).toBe('/tenants/tenant-created'));
        expect(createTenant).toHaveBeenCalledTimes(2);
        expect(repository.delete).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['fiscalCode', 'error-company-cf', 'error-person'],
        ['vatNumber', 'error-company-vat', 'error-person'],
    ] as const)('company mappa %s sul campo ente corretto', async (field, expectedError, forbiddenError) => {
        vi.mocked(createTenant).mockImplementationOnce(() => { throw new DuplicateTenantFiscalIdentityError(field, 'tenant-existing'); });
        const router = renderPage();
        await userEvent.selectOptions(await screen.findByLabelText('Tipo'), 'company');
        await userEvent.type(screen.getByLabelText('Società'), 'Acme');
        await userEvent.type(screen.getByLabelText('CF persona'), 'REP');
        await userEvent.type(screen.getByLabelText('CF ente'), 'ENTITY');
        await userEvent.type(screen.getByLabelText('PIVA ente'), 'VAT');
        await submitFromInfo2();
        expect(await screen.findByTestId(expectedError)).toBeTruthy();
        expect(screen.queryByTestId(forbiddenError)).toBeNull();
        expect(router.state.location.pathname).toBe('/tenants/new');
        expect(repository.delete).not.toHaveBeenCalled();
    });
});
