import { ChevronDown, PlusCircle, CloudUpload } from 'lucide-react';
import { Toggle } from '../ui/Toggle';
import { Dropdown } from '../ui/Dropdown';
import type { DropdownItem } from '../ui/Dropdown';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
    activeTab: string;
    onTabChange: (id: string) => void;
}

const toggleOptions = [
    { id: 'active', label: 'Attivi', icon: 'check' as const },
    { id: 'archived', label: 'Archivio', icon: 'archive' as const },
];

export function PageHeader({ activeTab, onTabChange }: PageHeaderProps) {
    const navigate = useNavigate();

    const newTenantItems: DropdownItem[] = [
        { id: 'new', label: 'Nuovo inquilino', icon: PlusCircle, onClick: () => navigate('/tenants/new') },
        { id: 'import', label: 'Importa', icon: CloudUpload, warning: true, onClick: () => navigate('/tenants/import') },
    ];

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            {/* Left — Title */}
            <h1 className="text-2xl font-normal text-gray-700">Inquilini</h1>

            {/* Center + Right on mobile stacked, on desktop inline */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Toggle Attivi/Archivio */}
                <Toggle options={toggleOptions} activeId={activeTab} onChange={onTabChange} />

                {/* Dropdown "Nuovo inquilino" */}
                <Dropdown
                    trigger={
                        <div className="relative inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                            {/* Pulse indicator */}
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400" />
                            </span>

                            Nuovo inquilino
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    }
                    items={newTenantItems}
                    align="right"
                />
            </div>
        </div>
    );
}
