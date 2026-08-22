import { clsx } from 'clsx';

export const BUILDING_TABS = [
    { id: 'general', label: 'Informazioni generali', disabled: false },
    { id: 'units', label: 'Unità', disabled: false },
    { id: 'additional', label: 'Informazioni aggiuntive', disabled: false },
    { id: 'financial', label: 'Informazioni finanziarie', disabled: false },
    { id: 'passwords', label: 'Password e codice', disabled: true },
    { id: 'photos', label: 'Foto', disabled: true },
    { id: 'documents', label: 'Documenti', disabled: true },
] as const;

export type BuildingTabId = (typeof BUILDING_TABS)[number]['id'];

interface BuildingFormTabsProps {
    activeTab: BuildingTabId;
    onTabChange(tab: BuildingTabId): void;
}

export function BuildingFormTabs({ activeTab, onTabChange }: BuildingFormTabsProps) {
    return (
        <div className="border-b border-gray-200 bg-white">
            <nav aria-label="Sezioni edificio" role="tablist" className="flex flex-wrap gap-2 px-4">
                {BUILDING_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        disabled={tab.disabled}
                        onClick={tab.disabled ? undefined : () => onTabChange(tab.id)}
                        className={clsx(
                            'whitespace-nowrap border-b-2 px-3 py-4 text-sm font-medium',
                            tab.disabled
                                ? 'cursor-not-allowed border-amber-400 bg-amber-50 text-amber-700 opacity-80'
                                : activeTab === tab.id
                                    ? 'border-green-600 text-green-700'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
            <div className="mx-4 mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p>Password e codice richiede backend, autorizzazione e storage sicuro.</p>
                <p>Foto e Documenti richiedono storage sicuro e backend.</p>
            </div>
        </div>
    );
}
