// @vitest-environment jsdom

import React, { useState } from 'react';
import { act, cleanup, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultPropertyValues } from '../../src/components/property-form/schema';
import { BuildingsTable } from '../../src/components/buildings/BuildingsTable';
import { BuildingsToolbar } from '../../src/components/buildings/BuildingsToolbar';
import { createBuildingRepository } from '../../src/db/buildingRepository';
import type { BuildingRecord, LocalDatabase, PropertyRecord } from '../../src/db/database.types';
import { useBuildings } from '../../src/hooks/useBuildings';
import type { Building } from '../../src/types/building';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from '../db/jsonDbStorageHarness';

const ACCOUNT_A = 'user-9901';
const ACCOUNT_B = 'user-9902';
const NOW = '2026-08-23T10:00:00.000Z';

function building(id: string, options: Partial<BuildingRecord> = {}): BuildingRecord {
    return {
        id, createdAt: NOW, updatedAt: NOW, archived: false, identifier: `ID ${id}`,
        color: '', address: `Via ${id}`, address2: '', city: 'Milano', postalCode: '20100',
        county: '', state: '', country: 'IT', size: null, constructionYear: null,
        description: '', privateNote: '', features: [], acquisitionDate: '', purchasePrice: null,
        acquisitionCosts: null, imu: null, unitsCount: 0, ...options,
    };
}

function property(id: string, buildingId: string | null): PropertyRecord {
    return {
        id, createdAt: NOW, updatedAt: NOW, archived: false,
        formData: {
            ...defaultPropertyValues, PropertyTitle: id, PropertyAddress: `Via ${id}`,
            PropertyCity: 'Milano', PropertyPostalCode: '20100', PropertyCountry: 'IT',
        },
        relations: { buildingId, tenantIds: [], leaseIds: [] }, notes: [], activities: [],
    };
}

function database(buildings: BuildingRecord[] = [], properties: PropertyRecord[] = []): LocalDatabase {
    return {
        meta: { schemaVersion: 4, seedVersion: 3, createdAt: NOW, updatedAt: NOW, source: 'seed' },
        buildings, properties, tenants: [], leases: [], payments: [], contacts: [], documents: [],
        reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [],
        candidates: [], settings: {}, userProfile: {}, drafts: [],
    };
}

function install(databaseA: LocalDatabase, databaseB = database()) {
    const storage = new MemoryStorage({
        [`props24.localDb.${ACCOUNT_A}`]: JSON.stringify(databaseA),
        [`props24.localDb.${ACCOUNT_B}`]: JSON.stringify(databaseB),
    });
    installJsonDbWindow(storage);
    Object.defineProperty(window, 'document', { configurable: true, value: document });
    return storage;
}

afterEach(() => {
    cleanup();
    uninstallJsonDbWindow();
});

describe('A4 real building list', () => {
    it('legge dati reali e usa unitsCount derivato dalle relazioni Property', async () => {
        install(database([
            building('building-a', { address: 'Via Roma 10', city: 'Milano', size: 800, description: 'Residenziale', unitsCount: 99 }),
            building('building-b', { address: 'Via Torino 2', city: 'Torino', archived: true }),
        ], [property('property-1', 'building-a'), property('property-2', 'building-a'), property('standalone', null)]));
        const { result } = renderHook(() => useBuildings(ACCOUNT_A));
        await waitFor(() => expect(result.current.filteredData).toHaveLength(1));
        expect(result.current.filteredData[0]).toEqual({
            id: 'building-a', address: 'Via Roma 10, Milano', size: 800,
            unitsCount: 2, description: 'Residenziale', status: 'active',
        });
    });

    it('filtra Attivi e Archivio e ricerca address/description senza distinzione di maiuscole', async () => {
        install(database([
            building('active', { address: 'Via Sole', city: 'Roma', description: 'Casa Chiara' }),
            building('archived', { address: 'Corso Luna', city: 'Torino', description: 'Deposito Storico', archived: true }),
        ]));
        const { result } = renderHook(() => useBuildings(ACCOUNT_A));
        await waitFor(() => expect(result.current.filteredData.map((item) => item.id)).toEqual(['active']));
        act(() => result.current.setView('archived'));
        expect(result.current.filteredData.map((item) => item.id)).toEqual(['archived']);
        act(() => result.current.setSearchQuery('LUNA'));
        expect(result.current.filteredData.map((item) => item.id)).toEqual(['archived']);
        act(() => result.current.setSearchQuery('storico'));
        expect(result.current.filteredData.map((item) => item.id)).toEqual(['archived']);
        act(() => result.current.setSearchQuery('assente'));
        expect(result.current.filteredData).toEqual([]);
    });

    it('preserva i quattro ordinamenti e il toggle ascendente/discendente', async () => {
        install(database([
            building('b', { address: 'Via Beta', size: 20, description: 'Delta' }),
            building('a', { address: 'Via Alfa', size: 30, description: 'Charlie' }),
            building('c', { address: 'Via Gamma', size: 10, description: 'Alpha' }),
        ], [property('p-a1', 'a'), property('p-a2', 'a'), property('p-b', 'b')]));
        function SortHarness() {
            const buildings = useBuildings(ACCOUNT_A);
            return <>
                <BuildingsToolbar
                    pageSize={buildings.pageSize}
                    onPageSizeChange={buildings.setPageSize}
                    searchQuery={buildings.searchQuery}
                    onSearchChange={buildings.setSearchQuery}
                    onSortChange={buildings.setSortField}
                />
                <output data-testid="order">{buildings.filteredData.map((item) => item.id).join(',')}</output>
                <output data-testid="sort">{`${buildings.sortField}:${buildings.sortDirection}`}</output>
            </>;
        }
        const user = userEvent.setup();
        render(<SortHarness />);
        await waitFor(() => expect(screen.getByTestId('order').textContent).toBe('a,b,c'));

        async function selectSort(label: string) {
            await user.click(screen.getByTitle('Ordina'));
            await user.click(screen.getByRole('button', { name: label }));
        }

        await selectSort('Superficie');
        expect(screen.getByTestId('order').textContent).toBe('c,b,a');
        expect(screen.getByTestId('sort').textContent).toBe('BuildingSize:asc');
        await selectSort('Superficie');
        expect(screen.getByTestId('order').textContent).toBe('a,b,c');
        expect(screen.getByTestId('sort').textContent).toBe('BuildingSize:desc');
        await selectSort('Superficie');
        expect(screen.getByTestId('order').textContent).toBe('c,b,a');
        expect(screen.getByTestId('sort').textContent).toBe('BuildingSize:asc');
        await selectSort('Proprietà');
        expect(screen.getByTestId('order').textContent).toBe('c,b,a');
        expect(screen.getByTestId('sort').textContent).toBe('BuildingPropertiesCount:asc');
        await selectSort('Descrizione');
        expect(screen.getByTestId('order').textContent).toBe('c,a,b');
        expect(screen.getByTestId('sort').textContent).toBe('BuildingComments:asc');
    });

    it('si aggiorna via subscription solo per le mutazioni dello stesso account', async () => {
        install(database());
        const { result } = renderHook(() => useBuildings(ACCOUNT_A));
        await waitFor(() => expect(result.current.filteredData).toEqual([]));
        const repositoryA = createBuildingRepository({ accountId: ACCOUNT_A });
        const repositoryB = createBuildingRepository({ accountId: ACCOUNT_B });
        const createdA = repositoryA.create({ identifier: 'A', address: 'Via A', city: 'Roma', postalCode: '00100', country: 'IT' });
        await waitFor(() => expect(result.current.filteredData.map((item) => item.id)).toEqual([createdA.id]));
        repositoryB.create({ identifier: 'B', address: 'Via B', city: 'Torino', postalCode: '10100', country: 'IT' });
        expect(result.current.filteredData.map((item) => item.id)).toEqual([createdA.id]);
        repositoryA.archive(createdA.id);
        await waitFor(() => expect(result.current.filteredData).toEqual([]));
    });

    it('non espone dati stale durante lo switch ACCOUNT_A verso ACCOUNT_B', async () => {
        install(
            database([building('building-a', { address: 'Edificio A' })]),
            database([building('building-b', { address: 'Edificio B' })]),
        );
        const renders: string[][] = [];
        function Probe({ accountId }: { accountId: string }) {
            const ids = useBuildings(accountId).filteredData.map((item) => item.id);
            renders.push(ids);
            return <output>{ids.join(',')}</output>;
        }
        const view = render(<Probe accountId={ACCOUNT_A} />);
        await screen.findByText('building-a');
        const switchStart = renders.length;
        view.rerender(<Probe accountId={ACCOUNT_B} />);
        expect(renders[switchStart]).toEqual([]);
        expect(screen.queryByText('building-a')).toBeNull();
        await screen.findByText('building-b');
        expect(screen.queryByText('building-a')).toBeNull();
    });

    it('usa gli ID Building reali nella RowSelectionState', async () => {
        const rows: Building[] = [
            { id: 'building-real-a', address: 'Via Reale A', size: 10, unitsCount: 0, description: '', status: 'active' },
            { id: 'building-real-b', address: 'Via Reale B', size: 20, unitsCount: 0, description: '', status: 'active' },
        ];
        function TableHarness() {
            const [selection, setSelection] = useState<Record<string, boolean>>({});
            return <><BuildingsTable data={rows} rowSelection={selection} onRowSelectionChange={setSelection} />
                <output data-testid="selection">{JSON.stringify(selection)}</output></>;
        }
        render(<TableHarness />);
        const row = screen.getByText('Via Reale B').closest('tr')!;
        await userEvent.click(within(row).getByRole('checkbox'));
        expect(screen.getByTestId('selection').textContent).toBe('{"building-real-b":true}');
        expect(screen.getByTestId('selection').textContent).not.toContain('"1"');
    });
});
