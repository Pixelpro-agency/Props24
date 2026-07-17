import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '../ui/Select';
import { SearchInput } from '../ui/SearchInput';
import { usePropertiesDb } from '../../hooks/usePropertiesDb';
import type { TenantFilterState } from '../../hooks/useTenantFilters';

interface FilterPanelProps {
    filters: TenantFilterState;
    onFilterChange: (filters: TenantFilterState) => void;
}

function hasActiveFilters(filters: TenantFilterState): boolean {
    return filters.propertyId !== '' || filters.query !== '';
}

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
    const showReset = hasActiveFilters(filters);
    const properties = usePropertiesDb();
    const propertyOptions = properties.map((p) => ({
        value: p.id,
        label: p.title,
    }));

    function updateFilter<K extends keyof TenantFilterState>(key: K, value: TenantFilterState[K]) {
        onFilterChange({ ...filters, [key]: value });
    }

    function resetFilters() {
        onFilterChange({ propertyId: '', query: '' });
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white border border-gray-200 rounded-lg p-4 mb-4"
        >
            {/* Title */}
            <div className="mb-3">
                <span className="font-bold text-gray-700">Filtra</span>
                <span className="ml-2 text-sm text-gray-500">Utilizza le opzioni per filtrare</span>
            </div>

            {/* Filters row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row items-end gap-3">
                {/* Property select */}
                <Select
                    id="search_PropertyID"
                    value={filters.propertyId}
                    onChange={(val) => updateFilter('propertyId', val)}
                    options={propertyOptions}
                    placeholder="Tutte le proprietà"
                    className="w-full lg:min-w-[220px] lg:w-auto"
                />

                {/* Keyword search */}
                <SearchInput
                    id="tenant-keyword-search"
                    value={filters.query}
                    onChange={(val) => updateFilter('query', val)}
                    placeholder="Ricerca per parola chiave"
                    className="w-full sm:col-span-1 lg:min-w-[220px] lg:flex-1"
                />

                {/* Reset link */}
                <AnimatePresence>
                    {showReset && (
                        <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors duration-150 cursor-pointer whitespace-nowrap sm:col-span-2 lg:col-span-1"
                        >
                            <X className="w-3.5 h-3.5" />
                            Rimuovi filtri
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
