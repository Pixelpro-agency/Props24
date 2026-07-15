import { Check, Archive } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ToggleOption {
    id: string;
    label: string;
    icon?: 'check' | 'archive';
}

interface ToggleProps {
    options: ToggleOption[];
    activeId: string;
    onChange: (id: string) => void;
    className?: string;
}

const iconMap = {
    check: Check,
    archive: Archive,
};

export function Toggle({ options, activeId, onChange, className = '' }: ToggleProps) {
    return (
        <div
            className={clsx(
                'relative inline-flex rounded-md border border-gray-300 overflow-hidden',
                className,
            )}
        >
            {options.map((opt) => {
                const isActive = opt.id === activeId;
                const Icon = opt.icon ? iconMap[opt.icon] : null;

                return (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(opt.id)}
                        className={clsx(
                            'relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer z-10',
                            isActive
                                ? 'text-white'
                                : 'text-gray-600 hover:bg-gray-200',
                        )}
                    >
                        {/* Animated background for active state */}
                        {isActive && (
                            <motion.div
                                layoutId="toggle-active-bg"
                                className="absolute inset-0 bg-green-600 z-[-1]"
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            />
                        )}
                        {Icon && (
                            <motion.span
                                initial={false}
                                animate={{ scale: isActive ? 1 : 0.9, opacity: isActive ? 1 : 0.7 }}
                                transition={{ duration: 0.15 }}
                            >
                                <Icon className="w-4 h-4" />
                            </motion.span>
                        )}
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
