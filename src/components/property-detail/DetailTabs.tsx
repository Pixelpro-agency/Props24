import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { PropertyDetail, Note } from '../../types/propertyDetail';
import { FinancesDashboard } from './FinancesDashboard';
import { LeaseCard } from './LeaseCard';
import { NotesPanel } from './NotesPanel';
import { ActivityTimeline } from './ActivityTimeline';

type TabId = 'finanze' | 'locazioni' | 'note' | 'attivita';

interface DetailTabsProps {
    property: PropertyDetail;
    notes: Note[];
    onAddNote: (text: string) => void;
    onDeleteNote: (id: string) => void;
}

export function DetailTabs({ property, notes, onAddNote, onDeleteNote }: DetailTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>('finanze');

    const tabs: { id: TabId; label: string; badge?: number }[] = [
        { id: 'finanze', label: 'FINANZE' },
        { id: 'locazioni', label: 'LOCAZIONI', badge: property.leases.length },
        { id: 'note', label: 'NOTE' },
        { id: 'attivita', label: 'ATTIVITÀ' },
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden sticky top-4">
            {/* Tab Bar */}
            <div className="flex border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            'relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap transition-colors cursor-pointer',
                            activeTab === tab.id
                                ? 'text-[#72a333] border-b-2 border-[#72a333] -mb-px'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                        )}
                    >
                        {tab.label}
                        {tab.badge !== undefined && tab.badge > 0 && (
                            <span className="bg-[#72a333] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center leading-none min-w-[18px] min-h-[18px]">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'finanze' && (
                            <FinancesDashboard finances={property.finances} />
                        )}

                        {activeTab === 'locazioni' && (
                            <div className="space-y-3">
                                {property.leases.length > 0 ? (
                                    property.leases.map((lease) => (
                                        <LeaseCard key={lease.id} lease={lease} />
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-gray-400">Qui non c'è nulla…</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'note' && (
                            <NotesPanel
                                notes={notes}
                                onAddNote={onAddNote}
                                onDeleteNote={onDeleteNote}
                            />
                        )}

                        {activeTab === 'attivita' && (
                            <ActivityTimeline activities={property.activities} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
