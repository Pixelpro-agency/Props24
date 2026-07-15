import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem } from './MenuItem';
import type { MenuItem as MenuItemType } from '../../types/menu';

interface SubMenuProps {
    items: MenuItemType[];
    isExpanded: boolean;
    onNavigate?: () => void;
}

export function SubMenu({ items, isExpanded, onNavigate }: SubMenuProps) {
    return (
        <AnimatePresence initial={false}>
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                >
                    <div className="py-1 ml-4 pl-2 border-l border-gray-200 mt-1 mb-2 space-y-0.5">
                        {items.map(child => (
                            <MenuItem
                                key={child.id}
                                item={child}
                                level={1}
                                onNavigate={onNavigate}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
