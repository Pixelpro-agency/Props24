import { useMemo, useState } from 'react';
import type { LeaseListItem, LeaseFilters } from '../landlord/leases/types/leaseListing.types';
import { EMPTY_LEASE_FILTERS } from '../landlord/leases/types/leaseListing.types';
import { parseDate } from '../utils/date-utils';

interface UseLeaseFiltersOptions {
    activeTab: string;
    data: LeaseListItem[];
}

/**
 * Filter logic for Leases list.
 * 1. Filter by active/archive tab
 * 2. Apply complex user filters (date range, multiple propertyIds, type, expiry, status, fast text search).
 */
export function useLeaseFilters({ activeTab, data }: UseLeaseFiltersOptions) {
    const [filters, setFilters] = useState<LeaseFilters>(EMPTY_LEASE_FILTERS);

    // Filter by tab
    const dataByTab = useMemo(
        () => data.filter((l) => (activeTab === 'active' ? !l.archived : l.archived)),
        [activeTab, data]
    );

    // Apply specific filters
    const filteredData = useMemo(() => {
        let result = dataByTab;

        // 1. Property IDs (max 2 supported by UI usually, but logic allows generic array)
        if (filters.propertyIds.length > 0) {
            result = result.filter((l) => filters.propertyIds.includes(l.propertyId));
        }

        // 2. Lease Type
        if (filters.leaseType) {
            result = result.filter((l) => l.leaseTypeValue === filters.leaseType);
        }

        // 3. Status
        if (filters.status === '1') {
            result = result.filter((l) => l.status === 'attiva');
        } else if (filters.status === '0') {
            result = result.filter((l) => l.status === 'inattivo');
        }

        // 4. Date Range
        if (filters.dateFrom || filters.dateTo) {
            const startLimit = filters.dateFrom ? parseDate(filters.dateFrom) : null;
            const endLimit = filters.dateTo ? parseDate(filters.dateTo) : null;

            result = result.filter((l) => {
                const leaseStart = parseDate(l.startDate);
                if (!leaseStart) return true; // fallback if invalid

                if (startLimit && leaseStart < startLimit) return false;
                if (endLimit && leaseStart > endLimit) return false;
                return true;
            });
        }

        // 5. Expires In (0-30, 30-60, 60-90, 90+)
        if (filters.expiresIn) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            result = result.filter((l) => {
                if (!l.endDate) return false;
                const end = parseDate(l.endDate);
                if (!end) return false;

                const diffTime = end.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (filters.expiresIn === '30') return diffDays >= 0 && diffDays <= 30;
                if (filters.expiresIn === '60') return diffDays > 30 && diffDays <= 60;
                if (filters.expiresIn === '90') return diffDays > 60 && diffDays <= 90;
                if (filters.expiresIn === '91') return diffDays > 90;

                return true;
            });
        }

        // 6. Free-text search
        if (filters.query) {
            const q = filters.query.toLowerCase();
            result = result.filter((l) =>
                l.propertyTitle.toLowerCase().includes(q) ||
                (l.tenantName && l.tenantName.toLowerCase().includes(q)) ||
                l.leaseTypeLabel.toLowerCase().includes(q) ||
                (l.propertyAddress && l.propertyAddress.toLowerCase().includes(q))
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
