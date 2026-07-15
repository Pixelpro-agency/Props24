import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import type { LineChartPeriod, MonthlyDataPoint } from '../../types/dashboard';

interface RevenueLineChartProps {
    period: LineChartPeriod;
    onPeriodChange: (p: LineChartPeriod) => void;
    data: MonthlyDataPoint[];
}

const TABS: { id: LineChartPeriod; label: string }[] = [
    { id: '12_months', label: '12 mesi' },
    { id: '10_years', label: '10 anni' },
];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-800 text-white text-xs rounded py-2 px-3 shadow-md z-50">
                <div className="font-semibold mb-1 border-b border-gray-600 pb-1">{label}</div>
                {payload.map((entry: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 mt-1">
                        <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-300">{entry.name}:</span>
                        <span className="font-medium">{formatCurrency(entry.value)}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const CustomLegend = ({ payload }: any) => {
    if (!payload) return null;
    return (
        <div className="flex justify-center gap-6 mt-2">
            {payload.map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                    />
                    {entry.value}
                </div>
            ))}
        </div>
    );
};

export function RevenueLineChart({ period, onPeriodChange, data }: RevenueLineChartProps) {
    /* Compute a nice max value for the Y axis */
    const yMax = useMemo(() => {
        const max = Math.max(...data.map((d) => Math.max(d.income, d.expenses)));
        if (max === 0) return 1000;
        // Round up to the nearest "nice" number
        const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
        return Math.ceil(max / magnitude) * magnitude;
    }, [data]);

    return (
        <div className="bg-white border border-[#e5e5e5] rounded-sm shadow-sm flex flex-col h-full">
            {/* Tabs (Header Area) */}
            <div className="flex flex-wrap bg-[#f9f9f9] border-b border-[#e5e5e5] font-medium text-sm">
                {TABS.map((tab) => {
                    const isActive = period === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onPeriodChange(tab.id)}
                            className={clsx(
                                'px-4 py-3 uppercase transition-colors text-xs',
                                isActive
                                    ? 'text-gray-800 border-b-2 border-gray-400 bg-white -mb-[1px]'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b-2 border-transparent'
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="p-4 flex-grow flex flex-col">
                {data.length > 0 ? (
                    <motion.div
                        key={period}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-grow flex flex-col min-h-[300px]"
                    >
                        <div className="w-full flex-grow" style={{ minHeight: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={data}
                                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e5e5e5"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                        axisLine={{ stroke: '#e5e5e5' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        domain={[0, yMax]}
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) =>
                                            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                                        }
                                        width={45}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend content={<CustomLegend />} />
                                    <Line
                                        type="monotone"
                                        dataKey="income"
                                        name="Entrate"
                                        stroke="#72a333"
                                        strokeWidth={2.5}
                                        dot={{ r: 3, fill: '#72a333', strokeWidth: 0 }}
                                        activeDot={{ r: 5, fill: '#72a333', strokeWidth: 2, stroke: '#fff' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="expenses"
                                        name="Spese"
                                        stroke="#ef4444"
                                        strokeWidth={2.5}
                                        dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
                                        activeDot={{ r: 5, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex-grow flex items-center justify-center min-h-[300px] text-gray-400 text-sm">
                        Nessun dato per questo periodo
                    </div>
                )}
            </div>
        </div>
    );
}
