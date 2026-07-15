import { useState, useMemo, useCallback } from 'react';
import { mockBuildings } from '../data/mockBuildings';
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

export function useBuildings(): UseBuildingsReturn {
    const [view, setView] = useState<BuildingStatus>('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortFieldState] = useState<BuildingSortField>('BuildingAddress');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [pageSize, setPageSize] = useState(100);

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
        let result = mockBuildings.filter((b) => b.status === view);

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
    }, [view, searchQuery, sortField, sortDirection]);

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
