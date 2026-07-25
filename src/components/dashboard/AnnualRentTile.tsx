import { Link } from 'react-router-dom';
import { Coins, Settings } from 'lucide-react';
import type { AnnualRentStats } from '../../types/dashboard';

interface AnnualRentTileProps {
    stats: AnnualRentStats;
}

const currencyFormatter = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function activeLeaseLabel(count: number): string {
    if (count === 0) return 'Nessuna locazione attiva';
    if (count === 1) return '1 locazione attiva';
    return `${count} locazioni attive`;
}

export function AnnualRentTile({ stats }: AnnualRentTileProps) {
    return (
        <div className="flex flex-col bg-[#f9f9f9] border border-[#e5e5e5] rounded-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-[#e5e5e5]">
                <h3 className="text-gray-700 font-semibold text-sm">Canoni annui</h3>
                <Link
                    to="/leases"
                    className="text-gray-400 hover:text-gray-700 transition-colors tooltip-trigger"
                    title="Gestire le locazioni"
                    aria-label="Gestire le locazioni"
                >
                    <Settings className="w-4 h-4" aria-hidden="true" />
                </Link>
            </div>

            <div className="flex items-center p-4">
                <div className="flex-shrink-0 mr-4">
                    <Coins className="w-9 h-9 text-gray-400" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div className="h-10 w-px bg-gray-200 mr-4" />
                <div className="min-w-0 flex flex-col">
                    <span className="break-words text-2xl font-medium leading-tight text-[#72a333]">
                        {currencyFormatter.format(stats.annualAmount)}
                    </span>
                    <span className="text-xs text-gray-600">
                        {currencyFormatter.format(stats.monthlyAverage)} / mese
                    </span>
                    <span className="text-[11px] text-gray-500">
                        {activeLeaseLabel(stats.activeLeaseCount)}
                    </span>
                </div>
            </div>
        </div>
    );
}
