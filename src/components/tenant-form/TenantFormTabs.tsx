import { useTenantFormContext } from './TenantFormProvider';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const TENANT_TABS = [
    { id: 'info1', label: 'Informazioni generali' },
    { id: 'info2', label: 'Informazioni aggiuntive' },
    { id: 'info3', label: 'Garanti' },
    { id: 'info5', label: 'Contatti di emergenza' },
    { id: 'info4', label: 'Documenti' },
] as const;

export type TenantTabId = typeof TENANT_TABS[number]['id'];

export function TenantFormTabs() {
    const { activeTab, setActiveTab } = useTenantFormContext();

    return (
        <div className="w-full bg-white border-b border-gray-200 overflow-x-auto scrollbar-hide">
            <nav className="flex items-center gap-2 px-4 min-w-max" aria-label="Tabs inquilino">
                {TENANT_TABS.map((tab) => {
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
