import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
    icon: LucideIcon;
    title: string;
    value: string | number;
    color: 'green' | 'grey';
}

const colorMap = {
    green: {
        value: 'text-green-600',
        iconBg: 'bg-green-50',
        iconColor: 'text-green-500',
    },
    grey: {
        value: 'text-gray-400',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-400',
    },
};

export function StatCard({ icon: Icon, title, value, color }: StatCardProps) {
    const palette = colorMap[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
        >
            {/* Icon circle */}
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${palette.iconBg} shrink-0`}>
                <Icon className={`w-6 h-6 ${palette.iconColor}`} />
            </div>

            {/* Text */}
            <div className="min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                    {title}
                </p>
                <p className={`text-2xl font-light leading-tight ${palette.value}`}>
                    {value}
                </p>
            </div>
        </motion.div>
    );
}
