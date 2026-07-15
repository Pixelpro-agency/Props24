import { ChevronDown, PlusCircle, CloudUpload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toggle } from '../ui/Toggle';
import { Dropdown } from '../ui/Dropdown';
import type { DropdownItem } from '../ui/Dropdown';

interface PageHeaderProps {
    activeTab: string;
    onTabChange: (id: string) => void;
}

const toggleOptions = [
    { id: 'active', label: 'Attive', icon: 'check' as const },
    { id: 'archive', label: 'Archivio', icon: 'archive' as const },
];

export function PageHeader({ activeTab, onTabChange }: PageHeaderProps) {
    const navigate = useNavigate();

    const newLeaseItems: DropdownItem[] = [
        { id: 'new', label: 'Nuova locazione', icon: PlusCircle, onClick: () => navigate('/leases/new') },
        { id: 'import', label: 'Importa', icon: CloudUpload, onClick: () => navigate('/leases/import') },
    ];

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            {/* Left — Title */}
            <h1 className="text-2xl font-normal text-gray-700">Locazioni</h1>

            {/* Center + Right on mobile stacked, on desktop inline */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Toggle Attive/Archivio */}
                <Toggle options={toggleOptions} activeId={activeTab} onChange={onTabChange} />

                {/* Dropdown "Nuova locazione" */}
                <Dropdown
                    trigger={
                        <div className="relative inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                            {/* Pulse indicator */}
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400" />
                            </span>

                            Nuova locazione
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    }
                    items={newLeaseItems}
                    align="right"
                />
            </div>
        </div>
    );
}
