import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { useBuildings } from '../hooks/useBuildings';
import { useTableSelection } from '../hooks/useTableSelection';
import type { BuildingStatus } from '../types/building';
import { useAuth } from '../auth/AuthContext';
import { createBuildingRepository } from '../db/buildingRepository';


import { BuildingsHeader } from '../components/buildings/BuildingsHeader';
import { InfoAlert } from '../components/buildings/InfoAlert';
import { BuildingsToolbar } from '../components/buildings/BuildingsToolbar';
import { BuildingsTable } from '../components/buildings/BuildingsTable';
import { EmptyState } from '../components/buildings/EmptyState';
import { FloatingActions } from '../components/buildings/FloatingActions';
import { FeedbackBox } from '../components/buildings/FeedbackBox';
import { BuildingActionModal, type BuildingActionOperation } from '../components/buildings/BuildingActionModal';
import { StatusToast, type StatusToastState } from '../components/ui/StatusToast';



// Staggered entrance animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: 'easeOut' },
    },
};

type PendingBuildingAction = {
    operation: BuildingActionOperation;
    mode: 'single' | 'bulk';
    ids: string[];
} | null;

export function BuildingsPage() {
    const navigate = useNavigate();
    const { account } = useAuth();
    const accountId = account?.id ?? null;
    const repository = useMemo(
        () => accountId ? createBuildingRepository({ accountId }) : null,
        [accountId],
    );
    const [pendingAction, setPendingAction] = useState<PendingBuildingAction>(null);
    const [toast, setToast] = useState<StatusToastState | null>(null);
    const {
        view,
        searchQuery,
        pageSize,
        filteredData,
        setView,
        setSearchQuery,
        setSortField,
        setPageSize,
    } = useBuildings(accountId);

    const { rowSelection, setRowSelection, selectedCount, selectedIds, clearSelection } = useTableSelection();

    // Clear selection when view changes
    const handleViewChange = useCallback(
        (newView: BuildingStatus) => {
            setView(newView);
            clearSelection();
        },
        [setView, clearSelection],
    );

    if (!account) return null;

    // Handlers
    function handleNewBuilding() {
        navigate('/properties/buildings/new');
    }

    function requestSingleAction(operation: BuildingActionOperation, id: string) {
        setToast(null);
        setPendingAction({ operation, mode: 'single', ids: [id] });
    }

    function requestBulkAction(operation: BuildingActionOperation) {
        setToast(null);
        setPendingAction({ operation, mode: 'bulk', ids: [...selectedIds] });
    }

    function successMessage(action: Exclude<PendingBuildingAction, null>): string {
        const count = action.ids.length;
        const participle = action.operation === 'archive'
            ? count === 1 ? 'archiviato' : 'archiviati'
            : action.operation === 'restore'
                ? count === 1 ? 'ripristinato' : 'ripristinati'
                : count === 1 ? 'eliminato' : 'eliminati';
        if (action.mode === 'single') return `Edificio ${participle}.`;
        return `${count} ${count === 1 ? 'edificio' : 'edifici'} ${participle}.`;
    }

    function confirmAction() {
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
            setToast({
                variant: 'error',
                title: 'Errore',
                message: error instanceof Error ? error.message : "Operazione sull'edificio non riuscita.",
            });
        }
    }

    return (
        <div className="max-w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >


                {/* Header */}
                <motion.div variants={itemVariants}>
                    <BuildingsHeader
                        activeView={view}
                        onToggle={handleViewChange}
                        onNewBuilding={handleNewBuilding}
                    />
                </motion.div>

                {/* Info Alert */}
                <motion.div variants={itemVariants}>
                    <InfoAlert className="mb-6" />
                </motion.div>

                {/* Table container */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                >
                    {/* Toolbar */}
                    <BuildingsToolbar
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onSortChange={setSortField}
                    />

                    {/* Table or Empty State */}
                    {filteredData.length > 0 ? (
                        <BuildingsTable
                            data={filteredData}
                            pageSize={pageSize}
                            rowSelection={rowSelection}
                            onRowSelectionChange={setRowSelection}
                            onRequestAction={requestSingleAction}
                        />
                    ) : (
                        <EmptyState onCreateClick={handleNewBuilding} />
                    )}
                </motion.div>

                {/* Floating actions */}
                <FloatingActions
                    selectedCount={selectedCount}
                    view={view}
                    onDelete={() => requestBulkAction('delete')}
                    onArchive={() => requestBulkAction('archive')}
                    onRestore={() => requestBulkAction('restore')}
                />

                {pendingAction && (
                    <BuildingActionModal
                        isOpen
                        operation={pendingAction.operation}
                        count={pendingAction.ids.length}
                        onClose={() => setPendingAction(null)}
                        onConfirm={confirmAction}
                    />
                )}

                <StatusToast toast={toast} onClose={() => setToast(null)} />

                {/* Feedback */}
                <motion.div variants={itemVariants}>
                    <FeedbackBox />
                </motion.div>
            </motion.div>
        </div>
    );
}
