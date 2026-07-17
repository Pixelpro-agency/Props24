import { useMemo, useState } from 'react';
import type { TenantListItem } from '../db/tenantRepository';
import { useTenantsDb } from './useTenantsDb';

export interface TenantFilterState {
    propertyId: string;
    query: string;
}

interface UseTenantFiltersOptions {
    activeTab: string;
}

/**
 * Hook that manages tenant filtering logic:
 * - Splits data by active/archived tab
 * - Applies property and keyword filters
 */
export function useTenantFilters({ activeTab }: UseTenantFiltersOptions) {
    const [filters, setFilters] = useState<TenantFilterState>({ propertyId: '', query: '' });
    const tenants = useTenantsDb();

    // Tab-filtered data
    const dataByTab = useMemo(
        () => tenants.filter((t) => (activeTab === 'active' ? !t.archived : t.archived)),
        [activeTab, tenants],
    );

    // Apply user filters
    const filteredData = useMemo(() => {
        let result = dataByTab;

        if (filters.propertyId) {
            result = result.filter((t) => t.propertyId === filters.propertyId);
        }

        if (filters.query) {
            const q = filters.query.toLowerCase();
            result = result.filter(
                (t) =>
                    t.displayName.toLowerCase().includes(q) ||
                    (t.email && t.email.toLowerCase().includes(q)) ||
                    (t.mobilePhone && t.mobilePhone.includes(q)) ||
                    (t.propertyName && t.propertyName.toLowerCase().includes(q)),
            );
        }

        return result;
    }, [dataByTab, filters]);

    const updateQuery = (query: string) => setFilters((prev) => ({ ...prev, query }));

    return {
        filters,
        setFilters,
        filteredData,
        updateQuery,
    };
}

/**
 * Builds email recipients from the currently selected rows.
 */
export function useTenantRecipients(
    selectedIds: string[],
    filteredData: TenantListItem[],
) {
    return useMemo(() => {
        return selectedIds
            .map((id) => {
                const tenant = filteredData.find((item) => item.id === id);
                if (!tenant || !tenant.email) return null;
                return { id: tenant.id, name: tenant.displayName, email: tenant.email };
            })
            .filter(Boolean) as { id: string; name: string; email: string }[];
    }, [selectedIds, filteredData]);
}
