// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultPropertyValues } from '../../src/components/property-form/schema';
import type { BuildingRecord, LeaseRecord, LocalDatabase, PaymentRecord, PropertyRecord, TenantRecord } from '../../src/db/database.types';
import { createJsonDbAccountScope, setActiveDatabaseAccount } from '../../src/db/jsonDb';
import { defaultLeaseValues, normalizeLeaseFormData } from '../../src/landlord/leases/schema/leaseFormSchema';
import { PropertyDetailPage } from '../../src/pages/PropertyDetailPage';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';

const ACCOUNT_A = 'user-96411';
const ACCOUNT_B = 'user-96412';
const NOW = '2026-08-31T10:00:00.000Z';

vi.mock('../../src/auth/AuthContext', () => ({ useAuth: () => ({ account: { id: ACCOUNT_A } }) }));

function property(id: string, options: { archived?: boolean; buildingId?: string | null; leaseIds?: string[] } = {}): PropertyRecord {
    return {
        id, createdAt: NOW, updatedAt: NOW, archived: options.archived ?? false,
        formData: {
            ...defaultPropertyValues,
            PropertyTitle: `Unità ${id}`,
            PropertyTypeID: 'appartamento',
            PropertyAddress: `Via ${id}`,
            PropertyCity: 'Milano',
            PropertyPostalCode: '20100',
            PropertyCountry: 'IT',
        },
        relations: { buildingId: options.buildingId ?? null, tenantIds: [], leaseIds: options.leaseIds ?? [] },
        notes: [], activities: [],
    };
}

function building(id: string, options: { archived?: boolean; unitsCount?: number } = {}): BuildingRecord {
    return {
        id, createdAt: NOW, updatedAt: NOW, archived: options.archived ?? false, identifier: id,
        color: '', address: `Via ${id}`, address2: '', city: 'Milano', postalCode: '20100',
        county: '', state: 'Lombardia', country: 'IT', size: null, constructionYear: null,
        description: '', privateNote: '', features: [], acquisitionDate: '', purchasePrice: null,
        acquisitionCosts: null, imu: null, unitsCount: options.unitsCount ?? 0,
    };
}

function lease(id: string, propertyId: string): LeaseRecord {
    const tenantId = `tenant-${id}`;
    const formData = normalizeLeaseFormData({
        ...defaultLeaseValues, PropertyID: propertyId, LeaseIdentificativo: id, LeaseType: 'abitativo',
        LeaseTenantIds: [tenantId], LeaseStartDate: '2025-01-01', LeaseEndDate: '2025-12-31', LeaseBillingPeriod: 'monthly',
    });
    return {
        id, propertyId, tenantIds: [tenantId], guarantorIds: [], leaseType: 'abitativo', leaseTypeLabel: 'Abitativo',
        startDate: formData.LeaseStartDate, endDate: formData.LeaseEndDate, status: 'terminata', rentAmount: 0,
        utilitiesAmount: 0, depositAmount: 0, billingPeriod: formData.LeaseBillingPeriod, formData,
        archived: true, createdAt: NOW, updatedAt: NOW, notes: '', activity: [], signatureProcess: null,
        termination: null, financialState: { depositPaymentId: null, depositReturnPaymentId: null, prepaidAppliedAmount: 0, prepaidAllocations: [] },
    };
}

function tenant(id: string, leaseId: string): TenantRecord {
    return {
        id, createdAt: NOW, updatedAt: NOW, type: 'person', photo: null, avatarColor: '#000000', title: 'Mr',
        firstName: 'Tenant', middleName: '', lastName: id, birthDate: '', birthPlace: '', nationality: 'IT',
        fiscalCode: '', vatNumberPersonal: '', profession: '', monthlyIncome: null, idType: '', idNumber: '', idExpiry: '',
        identityDocumentFile: null, identityDocumentBackFile: null, companyName: '', vatNumber: '', siret: '', capital: '',
        companyDescription: '', companyRegistryFile: null, email: '', emailSecondary: '', mobilePhone: '', phone: '',
        address1: '', address2: '', city: '', zip: '', state: '', country: 'IT', proEmployer: '', proAddress: '',
        proCity: '', proZip: '', proState: '', proCountry: '', proPhone: '', bankName: '', bankAddress: '', bankCity: '',
        bankZip: '', bankCountry: '', bankIBAN: '', bankSwiftBic: '', leaveAddress: '', notes: '', status: 'inattivo',
        archived: true, leaseIds: [leaseId], guarantors: [], emergencyContacts: [], documents: [],
        invitation: { status: 'not_sent', email: '', sentAt: null, acceptedAt: null },
    };
}

function payment(id: string, propertyId: string): PaymentRecord {
    return {
        id, propertyId, leaseId: null, tenantId: null, type: 'expense', category: 'manual', amount: 1,
        dueDate: '2026-08-31', paidDate: null, status: 'pending', description: 'Blocker storico', source: 'manual',
        accountingRole: 'expense', notes: '', receiptNumber: null, confirmation: null, createdAt: NOW, updatedAt: NOW,
    };
}

function database(options: { properties?: PropertyRecord[]; buildings?: BuildingRecord[]; tenants?: TenantRecord[]; leases?: LeaseRecord[]; payments?: PaymentRecord[] } = {}): LocalDatabase {
    return {
        meta: { schemaVersion: 4, seedVersion: 3, createdAt: NOW, updatedAt: NOW, source: 'seed' },
        properties: options.properties ?? [], buildings: options.buildings ?? [], tenants: options.tenants ?? [], leases: options.leases ?? [],
        payments: options.payments ?? [], contacts: [], documents: [], reservations: [], catalogs: [], inventory: [],
        maintenance: [], tasks: [], notes: [], messages: [], candidates: [], settings: {}, userProfile: {}, drafts: [],
    };
}

function install(databaseA: LocalDatabase, databaseB = database()) {
    const storage = new MemoryStorage({
        [`props24.localDb.${ACCOUNT_A}`]: JSON.stringify(databaseA),
        [`props24.localDb.${ACCOUNT_B}`]: JSON.stringify(databaseB),
    });
    const jsdomWindow = window;
    installJsonDbWindow(storage);
    Object.defineProperty(jsdomWindow, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: jsdomWindow });
    setActiveDatabaseAccount(ACCOUNT_A);
}

function renderDetail(id: string) {
    const router = createMemoryRouter([
        { path: '/properties/units/:id', element: <PropertyDetailPage /> },
        { path: '/properties/units/:id/edit', element: <h1>Modifica unità</h1> },
        { path: '/properties/units', element: <h1>Lista unità</h1> },
    ], { initialEntries: [`/properties/units/${id}`] });
    render(<RouterProvider router={router} />);
    return router;
}

function stored(accountId: string, id: string) {
    return createJsonDbAccountScope(accountId).getDatabase().properties.find((item) => item.id === id) ?? null;
}

async function confirm(action: 'Archivia' | 'Ripristina' | 'Elimina') {
    await userEvent.click(await screen.findByRole('button', { name: action }));
    await screen.findByRole('heading', { name: `${action} unità` });
    await userEvent.click(screen.getByRole('button', { name: 'Conferma' }));
}

afterEach(() => {
    cleanup();
    setActiveDatabaseAccount(null);
    uninstallJsonDbWindow();
    vi.clearAllMocks();
});

describe('B6.4 lifecycle reale dettaglio Unit', () => {
    it('mostra le azioni active e naviga realmente a Modifica', async () => {
        const target = property('active');
        install(database({ properties: [target] }));
        const router = renderDetail(target.id);
        expect(await screen.findByRole('link', { name: 'Modifica' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Archivia' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Elimina' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Ripristina' })).toBeNull();
        await userEvent.click(screen.getByRole('link', { name: 'Modifica' }));
        expect(router.state.location.pathname).toBe('/properties/units/active/edit');
    });

    it('annulla senza mutation, poi archivia e ripristina preservando Building e account B', async () => {
        const linkedBuilding = building('building-a', { unitsCount: 1 });
        const targetA = property('shared', { buildingId: linkedBuilding.id });
        const targetB = property('shared');
        install(database({ properties: [targetA], buildings: [linkedBuilding] }), database({ properties: [targetB] }));
        const router = renderDetail(targetA.id);
        await userEvent.click(await screen.findByRole('button', { name: 'Archivia' }));
        await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
        expect(stored(ACCOUNT_A, targetA.id)?.archived).toBe(false);

        await confirm('Archivia');
        await waitFor(() => expect(stored(ACCOUNT_A, targetA.id)?.archived).toBe(true));
        expect(router.state.location.pathname).toBe('/properties/units/shared');
        expect(await screen.findByText('Archiviata')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Ripristina' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Archivia' })).toBeNull();
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings[0].unitsCount).toBe(1);
        expect(stored(ACCOUNT_A, targetA.id)?.relations.buildingId).toBe(linkedBuilding.id);
        expect(stored(ACCOUNT_B, targetB.id)).toMatchObject({ id: targetB.id, archived: false, relations: targetB.relations });

        await confirm('Ripristina');
        await waitFor(() => expect(stored(ACCOUNT_A, targetA.id)?.archived).toBe(false));
        expect(screen.queryByText('Archiviata')).toBeNull();
        expect(screen.getByRole('button', { name: 'Archivia' })).toBeTruthy();
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings[0].unitsCount).toBe(1);
        expect(stored(ACCOUNT_A, targetA.id)?.relations.buildingId).toBe(linkedBuilding.id);
        expect(stored(ACCOUNT_B, targetB.id)).toMatchObject({ id: targetB.id, archived: false, relations: targetB.relations });
    });

    it('ripristina una Unit collegata a un Building archiviato', async () => {
        const archivedBuilding = building('building-archived', { archived: true, unitsCount: 1 });
        const target = property('archived-linked', { archived: true, buildingId: archivedBuilding.id });
        install(database({ properties: [target], buildings: [archivedBuilding] }));
        renderDetail(target.id);
        await confirm('Ripristina');
        await waitFor(() => expect(stored(ACCOUNT_A, target.id)?.archived).toBe(false));
        const storedDb = createJsonDbAccountScope(ACCOUNT_A).getDatabase();
        expect(storedDb.buildings[0]).toMatchObject({ id: archivedBuilding.id, archived: true, unitsCount: 1 });
        expect(stored(ACCOUNT_A, target.id)?.relations.buildingId).toBe(archivedBuilding.id);
    });

    it('elimina una Unit libera, ricalcola unitsCount e naviga alla lista', async () => {
        const linkedBuilding = building('building-delete', { unitsCount: 1 });
        const target = property('free', { buildingId: linkedBuilding.id });
        install(database({ properties: [target], buildings: [linkedBuilding] }));
        const router = renderDetail(target.id);
        await confirm('Elimina');
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/units'));
        expect(stored(ACCOUNT_A, target.id)).toBeNull();
        expect(createJsonDbAccountScope(ACCOUNT_A).getDatabase().buildings[0]).toMatchObject({ id: linkedBuilding.id, unitsCount: 0 });
        expect(await screen.findByRole('heading', { name: 'Lista unità' })).toBeTruthy();
    });

    it('mantiene record, route e modal quando una Lease storica blocca delete', async () => {
        const target = property('lease-blocked', { leaseIds: ['lease-ended'] });
        install(database({ properties: [target], tenants: [tenant('tenant-lease-ended', 'lease-ended')], leases: [lease('lease-ended', target.id)] }));
        const router = renderDetail(target.id);
        await confirm('Elimina');
        expect((await screen.findByRole('alert')).textContent).toContain('storico o relazioni persistenti');
        expect(stored(ACCOUNT_A, target.id)).not.toBeNull();
        expect(router.state.location.pathname).toBe('/properties/units/lease-blocked');
        expect(screen.getByRole('heading', { name: 'Elimina unità' })).toBeTruthy();
        expect(screen.queryByText('Successo')).toBeNull();
    });

    it('mantiene record, route e modal quando un Payment storico blocca delete', async () => {
        const target = property('payment-blocked');
        install(database({ properties: [target], payments: [payment('payment-old', target.id)] }));
        const router = renderDetail(target.id);
        await confirm('Elimina');
        expect((await screen.findByRole('alert')).textContent).toContain('storico o relazioni persistenti');
        expect(stored(ACCOUNT_A, target.id)).not.toBeNull();
        expect(router.state.location.pathname).toBe('/properties/units/payment-blocked');
        expect(screen.getByRole('heading', { name: 'Elimina unità' })).toBeTruthy();
        expect(screen.queryByText('Successo')).toBeNull();
    });

    it('elimina realmente una Unit archiviata libera senza restore preventivo', async () => {
        const target = property('archived-free', { archived: true });
        install(database({ properties: [target] }));
        const router = renderDetail(target.id);
        expect(await screen.findByRole('button', { name: 'Ripristina' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Archivia' })).toBeNull();
        await confirm('Elimina');
        await waitFor(() => expect(router.state.location.pathname).toBe('/properties/units'));
        expect(stored(ACCOUNT_A, target.id)).toBeNull();
    });
});
