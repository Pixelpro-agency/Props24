import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import clsx from 'clsx';
import { RevenueStatsContent } from './RevenueStatsContent';
import type { RevenuePeriod, RevenueStats } from '../../types/dashboard';

interface RevenuePanelProps {
    period: RevenuePeriod;
    onPeriodChange: (p: RevenuePeriod) => void;
    stats: RevenueStats;
}

const TABS: { id: RevenuePeriod; label: string }[] = [
    { id: 'current_month', label: 'Mese in corso' },
    { id: 'last_month', label: 'Mese scorso' },
    { id: 'year_to_date', label: 'Anno in corso' },
    { id: 'last_12_months', label: '12 mesi' },
];

export function RevenuePanel({ period, onPeriodChange, stats }: RevenuePanelProps) {
    return (
        <div className="bg-white border border-[#e5e5e5] rounded-sm shadow-sm flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#f9f9f9] border-b border-[#e5e5e5]">
                <h2 className="text-gray-800 font-semibold text-[15px]">
                    Entrate e Spese
                </h2>
                <Link
                    to="/payments"
                    className="text-gray-400 hover:text-gray-700 transition-colors tooltip-trigger"
                    title="Gestire"
                >
                    <Settings className="w-[18px] h-[18px]" />
                </Link>
            </div>

            <div className="p-4 flex-grow flex flex-col">
                {/* Tabs */}
                <div className="flex flex-wrap border-b border-gray-200 mb-6 font-medium text-sm">
                    {TABS.map((tab) => {
                        const isActive = period === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onPeriodChange(tab.id)}
                                className={clsx(
                                    'px-4 py-2 uppercase transition-colors',
                                    isActive
                                        ? 'text-[#72a333] border-b-2 border-[#72a333] -mb-[1px]'
                                        : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-grow">
                    <RevenueStatsContent stats={stats} />
                </div>

                {/* Footer Action */}
                <div className="mt-6">
                    <Link
                        to="/payments"
                        className="block w-full text-center py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded transition-colors"
                    >
                        Mostra tutto
                    </Link>
                </div>
            </div>
        </div>
    );
}
