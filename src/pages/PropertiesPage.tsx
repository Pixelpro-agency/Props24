import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { VisibilityState } from '@tanstack/react-table';
import { useAuth } from '../auth/AuthContext';
import { useFilters } from '../hooks/useFilters';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTableSelection } from '../hooks/useTableSelection';
import { usePropertyStats } from '../hooks/usePropertyStats';
import { usePropertiesDb } from '../hooks/usePropertiesDb';
import { createPropertyLifecycleRepository } from '../db/propertyLifecycleRepository';
import { PageHeader } from '../components/properties/PageHeader';
import { FilterPanel } from '../components/properties/FilterPanel';
import { TableToolbar } from '../components/properties/TableToolbar';
import { DataTable } from '../components/properties/DataTable';
import { EmptyState } from '../components/properties/EmptyState';
import { FloatingActions } from '../components/properties/FloatingActions';
import { FeedbackBox } from '../components/properties/FeedbackBox';
import { ExportModal } from '../components/properties/ExportModal';
import { PropertyActionModal, type PropertyActionOperation } from '../components/properties/PropertyActionModal';
import { StatusToast, type StatusToastState } from '../components/ui/StatusToast';

type PendingPropertyAction = { operation: PropertyActionOperation; mode: 'single' | 'bulk'; ids: string[] } | null;

export function PropertiesPage() {
    const navigate = useNavigate();
    const { account } = useAuth();
    const accountId = account?.id ?? null;
    const repository = useMemo(() => accountId ? createPropertyLifecycleRepository({ accountId }) : null, [accountId]);
    const properties = usePropertiesDb();
    const [activeTab, setActiveTab] = useState('active');
    const dataByTab = useMemo(() => properties.filter((property) => activeTab === 'active' ? !property.archived : property.archived), [activeTab, properties]);
    const { filters, filteredData, updateFilters } = useFilters(dataByTab);
    const stats = usePropertyStats(filteredData);
    const [pageSize, setPageSize] = useState(100);
    const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>('properties-column-visibility', {});
    const { rowSelection, setRowSelection, selectedCount, selectedIds, clearSelection } = useTableSelection();
    const [showExport, setShowExport] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingPropertyAction>(null);
    const [toast, setToast] = useState<StatusToastState | null>(null);

    const handleTabChange = useCallback((tab: string) => { setActiveTab(tab); clearSelection(); }, [clearSelection]);
    const handleFilterChange = useCallback((next: typeof filters) => { updateFilters(next); clearSelection(); }, [clearSelection, updateFilters]);
    const requestSingleAction = (operation: PropertyActionOperation, id: string) => { setToast(null); setPendingAction({ operation, mode: 'single', ids: [id] }); };
    const requestBulkAction = (operation: PropertyActionOperation) => { if (selectedIds.length) { setToast(null); setPendingAction({ operation, mode: 'bulk', ids: [...selectedIds] }); } };

    const successMessage = (action: Exclude<PendingPropertyAction, null>) => {
        const count = action.ids.length;
        const result = action.operation === 'archive' ? (count === 1 ? 'archiviata' : 'archiviate') : action.operation === 'restore' ? (count === 1 ? 'ripristinata' : 'ripristinate') : count === 1 ? 'eliminata' : 'eliminate';
        return action.mode === 'single' ? `Unità ${result}.` : `${count} unità ${result}.`;
    };

    const confirmAction = () => {
        if (!pendingAction || !repository) return;
        try {
            const { operation, mode, ids } = pendingAction;
            if (mode === 'single') {
                if (operation === 'archive') repository.archive(ids[0]);
                if (operation === 'restore') repository.restore(ids[0]);
                if (operation === 'delete') repository.delete(ids[0]);
            } else {
                if (operation === 'archive') repository.archiveMany(ids);
                if (operation === 'restore') repository.restoreMany(ids);
                if (operation === 'delete') repository.deleteMany(ids);
            }
            setToast({ variant: 'success', title: 'Successo', message: successMessage(pendingAction) });
            setPendingAction(null);
            clearSelection();
        } catch (error) {
            setToast({ variant: 'error', title: 'Errore', message: error instanceof Error ? error.message : "Operazione sull'unità non riuscita." });
        }
    };

    return <div className="max-w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <PageHeader activeTab={activeTab} onTabChange={handleTabChange} />
        <FilterPanel filters={filters} onFilterChange={handleFilterChange} stats={stats} />
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <TableToolbar pageSize={pageSize} onPageSizeChange={setPageSize} columnVisibility={columnVisibility} onColumnVisibilityChange={setColumnVisibility} searchQuery={filters.query} onSearchChange={(query) => handleFilterChange({ ...filters, query })} onExportClick={() => setShowExport(true)} />
            {filteredData.length ? <DataTable data={filteredData} pageSize={pageSize} columnVisibility={columnVisibility} onColumnVisibilityChange={setColumnVisibility} rowSelection={rowSelection} onRowSelectionChange={setRowSelection} onRequestAction={requestSingleAction} /> : <EmptyState onCreateClick={() => navigate('/properties/new')} />}
        </div>
        <FloatingActions selectedCount={selectedCount} view={activeTab === 'active' ? 'active' : 'archived'} onDelete={() => requestBulkAction('delete')} onArchive={() => requestBulkAction('archive')} onRestore={() => requestBulkAction('restore')} />
        {pendingAction ? <PropertyActionModal isOpen operation={pendingAction.operation} count={pendingAction.ids.length} onClose={() => setPendingAction(null)} onConfirm={confirmAction} /> : null}
        <StatusToast toast={toast} onClose={() => setToast(null)} />
        <FeedbackBox />
        <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} onConfirm={(columns) => { console.log('Esporta colonne:', columns); }} />
    </div>;
}
