import { usePropertyFormContext } from './PropertyFormProvider';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const PROPERTY_TABS = [
    { id: 'info1', label: 'Informazioni generali' },
    { id: 'info2', label: 'Informazioni aggiuntive' },
    { id: 'info9', label: 'Informazioni finanziarie' },
    { id: 'info10', label: 'Password e codice' },
    { id: 'info3', label: 'Contratti e Diagnostica' },
    { id: 'info6', label: 'Flyer digitale' },
    { id: 'info4', label: 'Foto' },
    { id: 'info7', label: 'Contatti' },
    { id: 'info5', label: 'Documenti' },
] as const;

export type PropertyTabId = typeof PROPERTY_TABS[number]['id'];

export function PropertyFormTabs() {
    const { activeTab, setActiveTab } = usePropertyFormContext();

    return (
        <div className="w-full bg-white border-b border-gray-200">
            <nav className="flex flex-wrap items-center gap-2 px-4" aria-label="Tabs">
                {PROPERTY_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={twMerge(
                                clsx(
                                    'whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm transition-colors duration-200 ease-in-out',
                                    isActive
                                        ? 'border-green-600 text-green-700'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                )
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
