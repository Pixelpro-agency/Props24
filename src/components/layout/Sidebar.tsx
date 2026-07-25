import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { menuData } from '../../data/menu';
import { MenuItem } from './MenuItem';
import { SubMenu } from './SubMenu';
import { ExpertToggle } from './ExpertToggle';
import { CalculatorWidget } from './CalculatorWidget';
import { useExpertMode } from './ExpertModeContext';
import type { MenuItem as MenuItemType } from '../../types/menu';

interface SidebarProps {
    onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const { expertMode, setExpertMode } = useExpertMode();
    const location = useLocation();

    const toggleExpand = (id: string) => {
        setExpandedItemId(currentId => currentId === id ? null : id);
    };

    // Controlla se un item (o uno dei suoi figli) corrisponde al path attivo
    const isItemActive = (item: MenuItemType): boolean => {
        if (item.href && location.pathname === item.href) return true;
        if (item.children) {
            return item.children.some(child => isItemActive(child));
        }
        return false;
    };

    // Filtra programmaticamente il menu al volo in base all'Expert Mode
    const filteredMenuData = useMemo(() => {
        const filterItems = (items: MenuItemType[]): MenuItemType[] => {
            return items
                .filter(item => expertMode || !item.isExpert)
                .map(item => {
                    if (item.children) {
                        return { ...item, children: filterItems(item.children) };
                    }
                    return item;
                });
        };

        return menuData.map(group => ({
            ...group,
            items: filterItems(group.items)
        }))
            .filter(group => group.items.length > 0);
    }, [expertMode]);

    const handleNavigate = () => {
        setExpandedItemId(null);
        if (onCloseMobile) onCloseMobile();
    };

    return (
        <aside id="props24-sidebar" className="flex h-full w-60 flex-col border-r border-gray-200 bg-[#f5f5f5]">
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-gray-200 px-3 lg:hidden">
                <span className="text-sm font-semibold text-gray-700">Menu</span>
                <button
                    type="button"
                    aria-label="Chiudi menu principale"
                    onClick={onCloseMobile}
                    className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-visible py-2">
                {filteredMenuData.map((group, index) => (
                    <div key={index} className="px-2">
                        <h3 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                            {group.title}
                        </h3>

                        <div className="space-y-0.5">
                            {group.items.map(item => (
                                <div key={item.id}>
                                    <MenuItem
                                        item={item}
                                        isActive={isItemActive(item)}
                                        isExpanded={expandedItemId === item.id}
                                        onToggle={() => toggleExpand(item.id)}
                                        onNavigate={handleNavigate}
                                    />

                                    {/* Submenu Animato tramite Framer Motion */}
                                    {item.children && (
                                        <SubMenu
                                            items={item.children}
                                            isExpanded={expandedItemId === item.id}
                                            onNavigate={handleNavigate}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Divider tra sezioni */}
                        {index < filteredMenuData.length - 1 && (
                            <div className="mx-2 mt-2 border-b border-gray-200" />
                        )}
                    </div>
                ))}
            </div>

            <div className="shrink-0 flex flex-col">
                <ExpertToggle enabled={expertMode} onChange={setExpertMode} />
                <CalculatorWidget />
            </div>

        </aside>
    );
}
