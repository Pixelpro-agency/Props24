import { CreditCard, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import type { RevenueStats } from '../../types/dashboard';

interface RevenueStatsContentProps {
    stats: RevenueStats;
}

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
};

export function RevenueStatsContent({ stats }: RevenueStatsContentProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
        }).format(value);
    };

    return (
        <motion.div
            key={stats.period} // Changers re-triggers initial animation
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            className="flex flex-col space-y-4"
        >
            {/* Top Row: Affitto pagato / In ritardo */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center bg-[#f9f9f9] border border-[#e5e5e5] p-3 rounded-sm">
                <div className="flex items-center text-gray-500 mb-2 sm:mb-0 sm:mr-6">
                    <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center mr-3">
                        <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline">
                        <span className="text-sm border-r border-gray-300 px-3">
                            Affitto pagato{' '}
                            <span className="font-semibold text-gray-700 ml-1">{stats.paidRentCount}</span>
                        </span>
                        <span className="text-sm px-3">
                            In ritardo{' '}
                            <span className="font-semibold text-gray-700 ml-1">{stats.latePaymentsCount}</span>
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* 2x2 Grid: Affitto, Riscuotere, Entrate, Spese */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div variants={itemVariants} className="bg-[#f9f9f9] p-4 border-l-4 border-l-[#72a333] rounded-sm flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-500 font-semibold uppercase mb-1">Affitto pagato</span>
                    <span className="text-2xl font-normal text-[#72a333]">{formatCurrency(stats.paidRentAmount)}</span>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-[#f9f9f9] p-4 border-l-4 border-l-[#f4c414] rounded-sm flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-500 font-semibold uppercase mb-1">Affitti da riscuotere</span>
                    <span className="text-2xl font-normal text-[#f4c414]">{formatCurrency(stats.rentToCollect)}</span>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-[#f9f9f9] p-4 border-l-4 border-l-[#72a333] rounded-sm flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-500 font-semibold uppercase mb-1">Entrate lorde per il periodo</span>
                    <span className="text-2xl font-normal text-[#72a333]">{formatCurrency(stats.grossIncome)}</span>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-[#f9f9f9] p-4 border-l-4 border-l-[#cc0000] rounded-sm flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-500 font-semibold uppercase mb-1">Spese nel periodo</span>
                    <span className="text-2xl font-normal text-[#cc0000]">{formatCurrency(stats.monthlyExpenses)}</span>
                </motion.div>
            </div>

            {/* Bottom Row: Risultato netto */}
            <motion.div variants={itemVariants} className="bg-[#f9f9f9] p-4 border-l-4 border-l-[#72a333] rounded-sm flex items-center justify-center relative">
                <div className="absolute left-4 w-10 h-10 rounded-full border-2 border-[#72a333] flex items-center justify-center text-[#72a333]">
                    <Coins className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-center ml-8">
                    <span className="text-xs text-gray-500 font-semibold uppercase mb-1">Risultato netto del periodo</span>
                    <span className="text-2xl font-normal text-[#72a333]">{formatCurrency(stats.netResult)}</span>
                </div>
            </motion.div>
        </motion.div>
    );
}
