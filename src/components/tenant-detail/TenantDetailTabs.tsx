import { useState } from 'react';
import type { TenantDetail, TenantTab } from '../../types/tenantDetail';
import { TenantFinancesTab } from './TenantFinancesTab';
import { TenantLeasesTab } from './TenantLeasesTab';
import { TenantMessagesTab } from './TenantMessagesTab';
import { TenantActivityTab } from './TenantActivityTab';

interface TenantDetailTabsProps {
    tenant: TenantDetail;
}

export function TenantDetailTabs({ tenant }: TenantDetailTabsProps) {
    const tabs: TenantTab[] = [
        { id: 'finances', label: 'FINANZE' },
        { id: 'leases', label: 'LOCAZIONI', badge: tenant.leases?.length },
        { id: 'messages', label: 'MESSAGGI', badge: tenant.messages?.length },
        { id: 'activity', label: 'ATTIVITÀ' },
    ];

    const [activeTab, setActiveTab] = useState('finances');

    return (
        <div className="flex flex-col h-full">
            {/* Tabs Header */}
            <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            px-4 py-2 text-sm font-medium transition-colors border-b-2 relative -mb-[2px]
                            ${activeTab === tab.id
                                ? 'text-blue-600 border-blue-600'
                                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <div className="flex items-center gap-2">
                            {tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span className={`
                                    flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold
                                    ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-500 text-white'}
                                `}>
                                    {tab.badge}
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Tabs Content */}
            <div className="flex-1">
                {activeTab === 'finances' && <TenantFinancesTab finances={tenant.finances} />}
                {activeTab === 'leases' && <TenantLeasesTab leases={tenant.leases} />}
                {activeTab === 'messages' && <TenantMessagesTab messages={tenant.messages} />}
                {activeTab === 'activity' && <TenantActivityTab activityHistory={tenant.activityHistory} />}
            </div>
        </div>
    );
}
