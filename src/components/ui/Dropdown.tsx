import { useRef, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface DropdownItem {
    id: string;
    label: string;
    icon?: LucideIcon;
    href?: string;
    danger?: boolean;
    warning?: boolean;
    onClick?: () => void;
}

interface DropdownProps {
    trigger: React.ReactNode;
    items: DropdownItem[];
    align?: 'left' | 'right';
    className?: string;
}

export function Dropdown({ trigger, items, align = 'left', className = '' }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;

        function handleEscape(e: KeyboardEvent) {
            if (e.key === 'Escape') setIsOpen(false);
        }

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    function handleItemClick(e: React.MouseEvent, item: DropdownItem) {
        e.preventDefault();
        e.stopPropagation();

        if (item.onClick) {
            item.onClick();
        }

        setIsOpen(false);
    }

    return (
        <div ref={containerRef} className={`relative inline-block ${className}`}>
            {/* Trigger */}
            <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
                {trigger}
            </div>

            {/* Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className={`
              absolute z-50 mt-1 min-w-[180px]
              bg-white border border-gray-200 rounded-md shadow-lg
              py-1 overflow-hidden
              ${align === 'right' ? 'right-0' : 'left-0'}
            `}
                    >
                        {items.map((item) => {
                            const Icon = item.icon;
                            const warningStyle = item.warning
                                ? { color: '#ca8a04', backgroundColor: '#fef08a', borderColor: '#eab308' }
                                : undefined;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={(e) => handleItemClick(e, item)}
                                    style={warningStyle}
                                    className={`
                    w-full flex items-center gap-2 px-4 py-2 text-sm
                    transition-colors duration-150 cursor-pointer
                    ${item.danger
                                            ? 'text-red-600 hover:bg-red-50'
                                            : item.warning
                                                ? 'missing-route'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }
                  `}
                                >
                                    {Icon && <Icon className="w-4 h-4" style={item.warning ? { color: '#ca8a04' } : undefined} />}
                                    {item.label}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
