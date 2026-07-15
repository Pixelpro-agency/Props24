import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    const { expertMode, setExpertMode } = useExpertMode();
    const location = useLocation();

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
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
        // Su mobile chiudi la sidebar dopo un click su una voce
        if (onCloseMobile) onCloseMobile();
    };

    return (
        <aside className="w-64 h-full bg-[#f5f5f5] flex flex-col border-r border-gray-200">

            {/* Header Logo */}
            <div className="h-16 flex items-center px-4 border-b border-gray-200 shrink-0">
                <div className="font-bold text-xl text-brand-blue tracking-tight">Props24</div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-6">
                {filteredMenuData.map((group, index) => (
                    <div key={index} className="px-3">
                        <h3 className="px-3 text-xs font-semibold text-gray-500 tracking-wider mb-2 uppercase">
                            {group.title}
                        </h3>

                        <div className="space-y-0.5">
                            {group.items.map(item => (
                                <div key={item.id}>
                                    <MenuItem
                                        item={item}
                                        isActive={isItemActive(item)}
                                        isExpanded={!!expandedItems[item.id]}
                                        onToggle={() => toggleExpand(item.id)}
                                        onNavigate={handleNavigate}
                                    />

                                    {/* Submenu Animato tramite Framer Motion */}
                                    {item.children && (
                                        <SubMenu
                                            items={item.children}
                                            isExpanded={!!expandedItems[item.id]}
                                            onNavigate={handleNavigate}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Divider tra sezioni */}
                        {index < filteredMenuData.length - 1 && (
                            <div className="mt-6 border-b border-gray-200 mx-3" />
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
