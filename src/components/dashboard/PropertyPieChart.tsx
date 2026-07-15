import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import type { RevenuePeriod, PropertyIncome } from '../../types/dashboard';

interface PropertyPieChartProps {
    period: RevenuePeriod;
    onPeriodChange: (p: RevenuePeriod) => void;
    data: PropertyIncome[];
}

const TABS: { id: RevenuePeriod; label: string }[] = [
    { id: 'current_month', label: 'Mese in corso' },
    { id: 'last_month', label: 'Mese scorso' },
    { id: 'year_to_date', label: 'Anno in corso' },
    { id: 'last_12_months', label: '12 mesi' },
];

export function PropertyPieChart({ period, onPeriodChange, data }: PropertyPieChartProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Calculate total for percentages if needed, though Recharts handles slices automatically
const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-md z-50">
                    <div className="font-semibold">{data.propertyName}</div>
                    <div>Entrate: {formatCurrency(data.income)}</div>
                </div>
            );
        }
        return null;
    };

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
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex-grow flex flex-col items-center justify-center min-h-[300px]"
                    >
                        {/* Chart Area */}
                        <div className="w-full h-[250px] mb-4 relative flex justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0}
                                        outerRadius={110}
                                        paddingAngle={1}
                                        dataKey="income"
                                        nameKey="propertyName"
                                        stroke="none"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Custom Legend matching Rentila style */}
                        <div className="w-full flex justify-center flex-wrap gap-x-4 gap-y-2 mt-2">
                            {data.map((item, index) => (
                                <div key={index} className="flex items-center text-[11px] text-gray-500">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full mr-1.5 flex-shrink-0"
                                        style={{ backgroundColor: item.color }}
                                    ></span>
                                    <span className="truncate max-w-[150px]" title={item.propertyName}>
                                        {item.propertyName}
                                    </span>
                                </div>
                            ))}
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
