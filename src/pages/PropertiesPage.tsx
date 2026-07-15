import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { VisibilityState } from '@tanstack/react-table';
import { mockProperties } from '../data/mockProperties';
import { useFilters } from '../hooks/useFilters';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTableSelection } from '../hooks/useTableSelection';
import { PageHeader } from '../components/properties/PageHeader';
import { FilterPanel } from '../components/properties/FilterPanel';
import { TableToolbar } from '../components/properties/TableToolbar';
import { DataTable } from '../components/properties/DataTable';
import { EmptyState } from '../components/properties/EmptyState';
import { FloatingActions } from '../components/properties/FloatingActions';
import { FeedbackBox } from '../components/properties/FeedbackBox';
import { ExportModal } from '../components/properties/ExportModal';
import { usePropertyStats } from '../hooks/usePropertyStats';

export function PropertiesPage() {
    const navigate = useNavigate();
    // Tab state (active / archived)
    const [activeTab, setActiveTab] = useState('active');

    // Filter by tab first
    const dataByTab = useMemo(
        () => mockProperties.filter((p) => (activeTab === 'active' ? !p.archived : p.archived)),
        [activeTab],
    );

    // Filter hook — applies user filters on top of tab filter
    const { filters, filteredData, updateFilters } = useFilters(dataByTab);

    // Stats computed from filtered data
    const stats = usePropertyStats(filteredData);

    // Table state
    const [pageSize, setPageSize] = useState(100);
    const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(
        'properties-column-visibility',
        {},
    );

    // Row selection via custom hook
    const { rowSelection, setRowSelection, selectedCount, clearSelection } = useTableSelection();

    // Export modal
    const [showExport, setShowExport] = useState(false);

    // Clear selection when tab or filters change
    const handleTabChange = useCallback(
        (tab: string) => {
            setActiveTab(tab);
            clearSelection();
        },
        [clearSelection],
    );

    // Handlers
    function handleDelete() {
        alert(`Eliminare ${selectedCount} unità?`);
        clearSelection();
    }

    function handleArchive() {
        alert(`Archiviare ${selectedCount} unità?`);
        clearSelection();
    }

    function handleExport(columns: string[]) {
        console.log('Esporta colonne:', columns);
        // Placeholder for actual export logic
    }

    return (
        <div className="max-w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
            {/* Header */}
            <PageHeader activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Filters + Stats */}
            <FilterPanel filters={filters} onFilterChange={updateFilters} stats={stats} />

            {/* Table container */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {/* Toolbar */}
                <TableToolbar
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                    searchQuery={filters.query}
                    onSearchChange={(q) => updateFilters({ ...filters, query: q })}
                    onExportClick={() => setShowExport(true)}
                />

                {/* Table or Empty State */}
                {filteredData.length > 0 ? (
                    <DataTable
                        data={filteredData}
                        pageSize={pageSize}
                        columnVisibility={columnVisibility}
                        onColumnVisibilityChange={setColumnVisibility}
                        rowSelection={rowSelection}
                        onRowSelectionChange={setRowSelection}
                    />
                ) : (
                    <EmptyState onCreateClick={() => navigate('/properties/new')} />
                )}
            </div>

            {/* Floating actions */}
            <FloatingActions
                selectedCount={selectedCount}
                onDelete={handleDelete}
                onArchive={handleArchive}
            />

            {/* Feedback */}
            <FeedbackBox />

            {/* Export modal */}
            <ExportModal
                isOpen={showExport}
                onClose={() => setShowExport(false)}
                onConfirm={handleExport}
            />
        </div>
    );
}
