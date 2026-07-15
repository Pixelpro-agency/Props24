import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBuildings } from '../hooks/useBuildings';
import { useTableSelection } from '../hooks/useTableSelection';
import type { BuildingStatus } from '../types/building';


import { BuildingsHeader } from '../components/buildings/BuildingsHeader';
import { InfoAlert } from '../components/buildings/InfoAlert';
import { BuildingsToolbar } from '../components/buildings/BuildingsToolbar';
import { BuildingsTable } from '../components/buildings/BuildingsTable';
import { EmptyState } from '../components/buildings/EmptyState';
import { FloatingActions } from '../components/buildings/FloatingActions';
import { FeedbackBox } from '../components/buildings/FeedbackBox';



// Staggered entrance animation variants
const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05,
        },
    },
};

const itemVariants: any = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: 'easeOut' },
    },
};

export function BuildingsPage() {
    const {
        view,
        searchQuery,
        pageSize,
        filteredData,
        setView,
        setSearchQuery,
        setSortField,
        setPageSize,
    } = useBuildings();

    const { rowSelection, setRowSelection, selectedCount, clearSelection } = useTableSelection();

    // Clear selection when view changes
    const handleViewChange = useCallback(
        (newView: BuildingStatus) => {
            setView(newView);
            clearSelection();
        },
        [setView, clearSelection],
    );

    // Handlers
    function handleNewBuilding() {
        console.log('Naviga a: /buildings/new');
    }

    function handleDelete() {
        console.log(`Eliminati ${selectedCount} edifici`);
        clearSelection();
    }

    function handleArchive() {
        console.log(`Archiviati ${selectedCount} edifici`);
        clearSelection();
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
                        />
                    ) : (
                        <EmptyState onCreateClick={handleNewBuilding} />
                    )}
                </motion.div>

                {/* Floating actions */}
                <FloatingActions
                    selectedCount={selectedCount}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                />

                {/* Feedback */}
                <motion.div variants={itemVariants}>
                    <FeedbackBox />
                </motion.div>
            </motion.div>
        </div>
    );
}
