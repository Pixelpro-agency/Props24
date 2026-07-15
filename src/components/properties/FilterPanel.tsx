import { X, Home, Coins, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '../ui/Select';
import { SearchInput } from '../ui/SearchInput';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../hooks/usePropertyStats';
import { propertyTypes } from '../../data/propertyTypes';
import type { FilterState, PropertyStatus, PropertyType, OccupancyFilter, PropertyStats } from '../../types/property';

interface FilterPanelProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    stats: PropertyStats;
}

const occupancyOptions = [
    { value: 'affittato', label: 'Affittato' },
    { value: 'non_affittato', label: 'Non affittato' },
];

const statusOptions = [
    { value: 'disponibile', label: 'Disponibile' },
    { value: 'affittato', label: 'Affittato' },
    { value: 'preavviso', label: 'Preavviso / Uscita' },
    { value: 'ricerca_inquilini', label: 'Ricerca inquilini' },
    { value: 'non_disponibile', label: 'Non disponibile' },
    { value: 'lavori', label: 'Lavori' },
];

const typeOptions = propertyTypes.map((pt) => ({
    value: pt.value,
    label: pt.label,
}));

function hasActiveFilters(filters: FilterState): boolean {
    return filters.typeId !== '' || filters.occupied !== 'all' || filters.status !== '' || filters.query !== '';
}

export function FilterPanel({ filters, onFilterChange, stats }: FilterPanelProps) {
    const showReset = hasActiveFilters(filters);

    function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
        onFilterChange({ ...filters, [key]: value });
    }

    function resetFilters() {
        onFilterChange({ typeId: '', occupied: 'all', status: '', query: '' });
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

            {/* Filters — responsive grid: 1 col mobile, 2 col tablet, flex row desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row items-end gap-3">
                {/* Type select */}
                <Select
                    id="search_TypeID"
                    value={filters.typeId}
                    onChange={(val) => updateFilter('typeId', val as PropertyType | '')}
                    options={typeOptions}
                    placeholder="Qualsiasi tipo"
                    className="w-full lg:min-w-[170px] lg:w-auto"
                />

                {/* Occupancy select */}
                <Select
                    id="search_Occupied"
                    value={filters.occupied === 'all' ? '' : filters.occupied}
                    onChange={(val) => updateFilter('occupied', (val || 'all') as OccupancyFilter)}
                    options={occupancyOptions}
                    placeholder="Con e senza locazione"
                    className="w-full lg:min-w-[190px] lg:w-auto"
                />

                {/* Status select */}
                <Select
                    id="search_PropertyStatus"
                    value={filters.status}
                    onChange={(val) => updateFilter('status', val as PropertyStatus | '')}
                    options={statusOptions}
                    placeholder="In qualsiasi stato"
                    className="w-full lg:min-w-[170px] lg:w-auto"
                />

                {/* Keyword search */}
                <SearchInput
                    id="keyword-search"
                    value={filters.query}
                    onChange={(val) => updateFilter('query', val)}
                    placeholder="Ricerca per parola chiave"
                    className="w-full sm:col-span-2 lg:min-w-[220px] lg:flex-1 lg:col-span-1"
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

            {/* Separator */}
            <hr className="border-gray-200 my-4" />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                    icon={Home}
                    title="Affittato"
                    value={stats.rentedCount}
                    color="green"
                />
                <StatCard
                    icon={Coins}
                    title="Valore locativo"
                    value={formatCurrency(stats.rentalValue)}
                    color="green"
                />
                <StatCard
                    icon={TrendingUp}
                    title="Valore patrimoniale"
                    value={formatCurrency(stats.assetValue)}
                    color="grey"
                />
            </div>
        </motion.div>
    );
}
