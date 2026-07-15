import { ToggleGroup } from '../ui/ToggleGroup';
import { PulseButton } from '../ui/PulseButton';
import type { BuildingStatus } from '../../types/building';

interface BuildingsHeaderProps {
    activeView: BuildingStatus;
    onToggle: (view: BuildingStatus) => void;
    onNewBuilding: () => void;
}

const toggleOptions = [
    { id: 'active', label: 'Attivi', icon: 'check' as const },
    { id: 'archived', label: 'Archivio', icon: 'archive' as const },
];

export function BuildingsHeader({ activeView, onToggle, onNewBuilding }: BuildingsHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            {/* Left — Title */}
            <h1 className="text-2xl font-semibold text-gray-700 shrink-0">
                Edifici
            </h1>

            {/* Center — Toggle Attivi / Archivio */}
            <div className="w-full sm:w-64">
                <ToggleGroup
                    options={toggleOptions}
                    activeId={activeView}
                    onChange={(id) => onToggle(id as BuildingStatus)}
                />
            </div>

            {/* Right — Nuovo edificio */}
            <div className="flex justify-end shrink-0">
                <PulseButton
                    label="Nuovo edificio"
                    onClick={onNewBuilding}
                />
            </div>
        </div>
    );
}
