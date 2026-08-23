import { useState, useMemo, useCallback, useEffect } from 'react';
import { createBuildingRepository } from '../db/buildingRepository';
import type { BuildingRecord } from '../db/database.types';
import type { Building, BuildingStatus, BuildingSortField } from '../types/building';

interface UseBuildingsReturn {
    // State
    view: BuildingStatus;
    searchQuery: string;
    sortField: BuildingSortField;
    sortDirection: 'asc' | 'desc';
    pageSize: number;

    // Data
    filteredData: Building[];

    // Actions
    setView: (view: BuildingStatus) => void;
    setSearchQuery: (query: string) => void;
    setSortField: (field: BuildingSortField) => void;
    setPageSize: (size: number) => void;
    resetFilters: () => void;
}

type BuildingSource = { accountId: string; buildings: Building[] } | null;

function toBuilding(record: BuildingRecord): Building {
    return {
        id: record.id,
        address: [record.address, record.city].map((part) => part.trim()).filter(Boolean).join(', '),
        size: record.size,
        unitsCount: record.unitsCount,
        description: record.description,
        status: record.archived ? 'archived' : 'active',
    };
}

export function useBuildings(accountId: string | null): UseBuildingsReturn {
    const [view, setView] = useState<BuildingStatus>('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortFieldState] = useState<BuildingSortField>('BuildingAddress');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [pageSize, setPageSize] = useState(100);
    const [source, setSource] = useState<BuildingSource>(null);
    const repository = useMemo(
        () => accountId === null ? null : createBuildingRepository({ accountId }),
        [accountId],
    );

    useEffect(() => {
        if (!repository || accountId === null) {
            return;
        }

        const refresh = () => {
            setSource({ accountId, buildings: repository.list().map(toBuilding) });
        };
        refresh();
        return repository.subscribe(refresh);
    }, [accountId, repository]);

    const buildings = useMemo(
        () => source?.accountId === accountId ? source.buildings : [],
        [accountId, source],
    );

    // Toggle sort direction if same field, otherwise set new field ascending
    const setSortField = useCallback((field: BuildingSortField) => {
        setSortFieldState((prev) => {
            if (prev === field) {
                setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
                return prev;
            }
            setSortDirection('asc');
            return field;
        });
    }, []);

    const filteredData = useMemo(() => {
        // 1. Filter by view (active/archived)
        let result = buildings.filter((b) => b.status === view);

        // 2. Filter by search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter((b) => {
                const searchable = [b.address, b.description]
                    .join(' ')
                    .toLowerCase();
                return searchable.includes(q);
            });
        }

        // 3. Sort
        result = [...result].sort((a, b) => {
            let cmp = 0;
            switch (sortField) {
                case 'BuildingAddress':
                    cmp = a.address.localeCompare(b.address, 'it');
                    break;
                case 'BuildingSize':
                    cmp = (a.size ?? 0) - (b.size ?? 0);
                    break;
                case 'BuildingPropertiesCount':
                    cmp = a.unitsCount - b.unitsCount;
                    break;
                case 'BuildingComments':
                    cmp = a.description.localeCompare(b.description, 'it');
                    break;
            }
            return sortDirection === 'asc' ? cmp : -cmp;
        });

        return result;
    }, [buildings, view, searchQuery, sortField, sortDirection]);

    const resetFilters = useCallback(() => {
        setSearchQuery('');
        setSortFieldState('BuildingAddress');
        setSortDirection('asc');
    }, []);

    return {
        view,
        searchQuery,
        sortField,
        sortDirection,
        pageSize,
        filteredData,
        setView,
        setSearchQuery,
        setSortField,
        setPageSize,
        resetFilters,
    };
}
