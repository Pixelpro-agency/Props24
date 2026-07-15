import { X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '../ui/Select';
import { MultiSelect } from '../ui/MultiSelect';
import { SearchInput } from '../ui/SearchInput';
import { mockProperties } from '../../data/mockProperties';
import { leaseTypeOptions, expiresInOptions, leaseStatusFilterOptions } from '../../landlord/leases/data/leaseTypeOptions';
import type { LeaseFilters } from '../../landlord/leases/types/leaseListing.types';
import { EMPTY_LEASE_FILTERS } from '../../landlord/leases/types/leaseListing.types';

interface FilterPanelProps {
    filters: LeaseFilters;
    onFilterChange: (filters: LeaseFilters) => void;
}

const propertyOptions = mockProperties.map((p) => ({
    value: p.id,
    label: p.title,
}));

function hasActiveFilters(filters: LeaseFilters): boolean {
    return (
        filters.propertyIds.length > 0 ||
        filters.leaseType !== '' ||
        filters.expiresIn !== '' ||
        filters.status !== '' ||
        filters.query !== '' ||
        filters.dateFrom !== '' ||
        filters.dateTo !== ''
    );
}

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
    const showReset = hasActiveFilters(filters);

    function updateFilter<K extends keyof LeaseFilters>(key: K, value: LeaseFilters[K]) {
        onFilterChange({ ...filters, [key]: value });
    }

    function resetFilters() {
        onFilterChange(EMPTY_LEASE_FILTERS);
    }

    // A simpler native date input for date range until a full RangePicker component is needed
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white border border-gray-200 rounded-lg p-4 mb-4"
        >
            {/* Title */}
            <div className="mb-4">
                <span className="font-bold text-gray-700">Filtra</span>
                <span className="ml-2 text-sm text-gray-500">Utilizza le opzioni per filtrare</span>
            </div>

            {/* Filters grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:flex-row xl:flex-wrap items-end gap-3">

                {/* 1. Date Range Start */}
                <div className="relative w-full xl:w-auto xl:min-w-[140px]">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <input
                        type="date"
                        value={filters.dateFrom ? filters.dateFrom.split('/').reverse().join('-') : ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                                updateFilter('dateFrom', '');
                            } else {
                                const [y, m, d] = val.split('-');
                                updateFilter('dateFrom', `${d}/${m}/${y}`);
                            }
                        }}
                        className="w-full bg-white border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#72a333]/30 focus:border-[#72a333] transition-colors h-[38px]"
                        title="Data inizio (da)"
                    />
                </div>

                {/* 2. Date Range End */}
                <div className="relative w-full xl:w-auto xl:min-w-[140px]">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <input
                        type="date"
                        value={filters.dateTo ? filters.dateTo.split('/').reverse().join('-') : ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                                updateFilter('dateTo', '');
                            } else {
                                const [y, m, d] = val.split('-');
                                updateFilter('dateTo', `${d}/${m}/${y}`);
                            }
                        }}
                        className="w-full bg-white border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#72a333]/30 focus:border-[#72a333] transition-colors h-[38px]"
                        title="Data inizio (a)"
                    />
                </div>

                {/* 3. Properties Multi-select */}
                <MultiSelect
                    id="leaseFilter_Properties"
                    value={filters.propertyIds}
                    onChange={(val) => updateFilter('propertyIds', val)}
                    options={propertyOptions}
                    placeholder="Tutte le proprietà"
                    maxSelections={2}
                    className="w-full sm:col-span-2 lg:col-span-2 xl:min-w-[220px] xl:w-auto"
                />

                {/* 4. Lease Type */}
                <Select
                    id="leaseFilter_Type"
                    value={filters.leaseType}
                    onChange={(val) => updateFilter('leaseType', val)}
                    options={leaseTypeOptions}
                    placeholder="Qualsiasi tipo"
                    className="w-full xl:min-w-[180px] xl:w-auto"
                />

                {/* 5. Expires In */}
                <Select
                    id="leaseFilter_ExpiresIn"
                    value={filters.expiresIn}
                    onChange={(val) => updateFilter('expiresIn', val as any)}
                    options={expiresInOptions as any}
                    placeholder="Fine della locazione"
                    className="w-full xl:min-w-[180px] xl:w-auto"
                />

                {/* 6. Status */}
                <Select
                    id="leaseFilter_Status"
                    value={filters.status}
                    onChange={(val) => updateFilter('status', val as any)}
                    options={leaseStatusFilterOptions as any}
                    placeholder="Stato"
                    className="w-full xl:min-w-[140px] xl:w-auto"
                />

                {/* 7. Keyword Search */}
                <SearchInput
                    id="leaseFilter_Search"
                    value={filters.query}
                    onChange={(val) => updateFilter('query', val)}
                    placeholder="Ricerca per parola chiave"
                    className="w-full sm:col-span-2 lg:col-span-3 xl:flex-1 min-w-[200px]"
                />

                {/* 8. Reset Button */}
                <AnimatePresence>
                    {showReset && (
                        <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors duration-150 cursor-pointer whitespace-nowrap h-[38px] px-2 w-full sm:col-span-2 xl:w-auto justify-center xl:justify-start"
                        >
                            <X className="w-4 h-4" />
                            Rimuovi filtri
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
