import { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Percent,
    Coins,
    Info,
    ExternalLink,
} from 'lucide-react';
import type { FinancialData } from '../../types/propertyDetail';

interface FinancesDashboardProps {
    finances: FinancialData;
}

function formatCurrency(value: number): string {
    return value.toLocaleString('it-IT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }) + ' €';
}

export function FinancesDashboard({ finances }: FinancesDashboardProps) {
    const [selectedYear, setSelectedYear] = useState(finances.year);

    return (
        <div className="space-y-4">
            {/* Header */}
            <h3 className="text-sm font-bold text-gray-800">Finanze</h3>

            {/* Year Selector */}
            <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#72a333]/40 cursor-pointer"
            >
                {finances.availableYears.map((year) => (
                    <option key={year} value={year}>Anno {year}</option>
                ))}
            </select>

            {/* Line Chart */}
            <div className="border border-gray-200 rounded-lg p-3 bg-white">
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={finances.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: '#999' }}
                            axisLine={{ stroke: '#e0e0e0' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#999' }}
                            axisLine={{ stroke: '#e0e0e0' }}
                            tickLine={false}
                            domain={[0, 800]}
                        />
                        <Tooltip
                            formatter={(value: number | undefined, name: string | undefined) => [
                                formatCurrency(value ?? 0),
                                (name === 'expenses') ? 'Spese' : 'Entrate',
                            ]}
                            contentStyle={{
                                fontSize: '12px',
                                borderRadius: '8px',
                                border: '1px solid #e0e0e0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}
                        />
                        <Legend
                            formatter={(value: string) =>
                                value === 'expenses' ? 'Spese' : 'Entrate'
                            }
                            wrapperStyle={{ fontSize: '12px' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="expenses"
                            stroke="#cc0000"
                            strokeWidth={2}
                            dot={{ fill: '#cc0000', r: 3 }}
                            activeDot={{ r: 5 }}
                            name="expenses"
                        />
                        <Line
                            type="monotone"
                            dataKey="income"
                            stroke="#72a333"
                            strokeWidth={2}
                            dot={{ fill: '#72a333', r: 3 }}
                            activeDot={{ r: 5 }}
                            name="income"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* KPI Cards 2x2 */}
            <div className="grid grid-cols-2 gap-3">
                {/* Entrate lorde */}
                <div className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                            Entrate lorde (anno)
                        </span>
                    </div>
                    <p className="text-lg font-bold text-[#72a333]">
                        {formatCurrency(finances.grossIncome)}
                    </p>
                </div>

                {/* Spese */}
                <div className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                        <TrendingDown className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                            Spese (anno)
                        </span>
                    </div>
                    <p className="text-lg font-bold text-[#cc0000]">
                        {formatCurrency(finances.expenses)}
                    </p>
                </div>

                {/* Tasso occupazione */}
                <div className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Percent className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                            Tasso di occupazione (anno)
                        </span>
                    </div>
                    <p className="text-lg font-bold text-gray-700">
                        {finances.occupancyRate} %
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {finances.occupancyDays} giorni
                    </p>
                </div>

                {/* Redditività netta */}
                <div className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                            Redditività netta
                        </span>
                        <div className="relative group">
                            <Info className="w-3 h-3 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 w-44 bg-gray-800 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg">
                                Calcolata sul prezzo di acquisto dell'immobile.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
                            </div>
                        </div>
                    </div>
                    <p className="text-lg font-bold text-gray-700">
                        {finances.profitabilityNet}%
                    </p>
                    {!finances.purchasePriceKnown && (
                        <p className="text-xs text-gray-400 mt-0.5 uppercase">
                            Prezzo di acquisto sconosciuto
                        </p>
                    )}
                </div>
            </div>

            {/* Net Result Box */}
            <div className="bg-gradient-to-r from-[#72a333]/10 to-[#72a333]/5 border-2 border-[#72a333]/30 rounded-lg p-4 flex items-center gap-3">
                <div className="bg-[#72a333]/15 rounded-lg p-2.5 shrink-0">
                    <Coins className="w-6 h-6 text-[#72a333]" />
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                        Risultato netto
                    </p>
                    <p className="text-2xl font-bold text-[#72a333]">
                        {formatCurrency(finances.netResult)}
                    </p>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Finanze
                </button>
                <button className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Bilancio
                </button>
            </div>
        </div>
    );
}
