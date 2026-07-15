import { useState, useMemo, useCallback } from 'react';
import type { FilterState, Property } from '../types/property';

const DEFAULT_FILTERS: FilterState = {
    typeId: '',
    occupied: 'all',
    status: '',
    query: '',
};

export function useFilters(data: Property[]) {
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            // Type filter
            if (filters.typeId && item.type !== filters.typeId) return false;

            // Occupancy filter
            if (filters.occupied !== 'all') {
                const isRented = item.tenant !== null;
                if (filters.occupied === 'affittato' && !isRented) return false;
                if (filters.occupied === 'non_affittato' && isRented) return false;
            }

            // Status filter
            if (filters.status && item.status !== filters.status) return false;

            // Keyword search
            if (filters.query) {
                const q = filters.query.toLowerCase();
                const searchable = [item.title, item.address, item.tenant]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!searchable.includes(q)) return false;
            }

            return true;
        });
    }, [data, filters]);

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
    }, []);

    const updateFilters = useCallback((newFilters: FilterState) => {
        setFilters(newFilters);
    }, []);

    return { filters, filteredData, updateFilters, resetFilters };
}
