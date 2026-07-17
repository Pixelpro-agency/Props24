import React from 'react';

interface Tab {
    id: string;
    label: string;
    badge?: string;
}

interface LeaseTabsProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

const TABS: Tab[] = [
    { id: 'general', label: 'Informazioni Generali' },
    { id: 'tenants', label: 'Inquilini' },
    { id: 'guarantors', label: 'Garanti' },
];

export const LeaseTabs: React.FC<LeaseTabsProps> = ({ children, activeTab, onTabChange }) => {
    return (
        <div>
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <nav className="flex gap-0 -mb-px" role="tablist">
                    {TABS.map((tab) => (
                        <button type="button"
                            key={tab.id}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`
                whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                                    ? 'border-[#337ab7] text-[#337ab7]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
              `}
                        >
                            {tab.label}
                            {tab.badge && (
                                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded uppercase">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white border border-t-0 border-gray-200 rounded-b shadow-sm p-6">
                {children}
            </div>
        </div>
    );
};

export { TABS };
export type { Tab };
