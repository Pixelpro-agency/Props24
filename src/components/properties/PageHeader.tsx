import { ChevronDown, PlusCircle, CloudUpload } from 'lucide-react';
import { ToggleGroup } from '../ui/ToggleGroup';
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

    const newUnitItems: DropdownItem[] = [
        { id: 'new', label: 'Nuova unità', icon: PlusCircle, onClick: () => navigate('/properties/new') },
        { id: 'import', label: 'Importa', icon: CloudUpload, onClick: () => navigate('/properties/units/import') },
    ];

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            {/* Left — Title */}
            <h1 className="text-2xl font-normal text-gray-700 shrink-0">Unità</h1>

            {/* Center — Toggle Attivi / Archivio */}
            <div className="w-full sm:w-64">
                <ToggleGroup options={toggleOptions} activeId={activeTab} onChange={onTabChange} />
            </div>

            {/* Right — Nuova unità */}
            <div className="flex justify-end shrink-0">
                {/* Dropdown "Nuova unità" */}
                <Dropdown
                    trigger={
                        <div className="relative inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                            {/* Pulse indicator */}
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400" />
                            </span>

                            Nuova unità
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    }
                    items={newUnitItems}
                    align="right"
                />
            </div>
        </div>
    );
}
