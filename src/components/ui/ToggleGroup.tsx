import { Check, Archive } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export interface ToggleGroupOption {
    id: string;
    label: string;
    icon?: 'check' | 'archive';
}

interface ToggleGroupProps {
    options: ToggleGroupOption[];
    activeId: string;
    onChange: (id: string) => void;
    className?: string;
}

const iconMap = {
    check: Check,
    archive: Archive,
};

export function ToggleGroup({ options, activeId, onChange, className = '' }: ToggleGroupProps) {
    return (
        <div
            className={clsx(
                'inline-flex w-full rounded-md border border-gray-300 bg-gray-100 overflow-hidden',
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
                            'relative flex-1 flex items-center justify-center gap-1.5',
                            'px-4 py-2 text-sm font-medium cursor-pointer z-10',
                            'transition-colors duration-200',
                            isActive
                                ? 'text-green-700'
                                : 'text-gray-500 hover:text-gray-700',
                        )}
                    >
                        {/* Animated white background for active state */}
                        {isActive && (
                            <motion.div
                                layoutId="toggle-group-active-bg"
                                className="absolute inset-0.5 bg-white rounded-[5px] shadow-sm z-[-1]"
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            />
                        )}
                        {Icon && (
                            <motion.span
                                initial={false}
                                animate={{
                                    scale: isActive ? 1 : 0.9,
                                    opacity: isActive ? 1 : 0.5,
                                }}
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
