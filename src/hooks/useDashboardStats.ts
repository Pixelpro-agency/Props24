/**
 * Hook that computes dashboard entity counts from existing mock data.
 *
 * Calculates active / total / archived counts for:
 * - Properties (from mockProperties)
 * - Tenants (from mockTenantList)
 * - Leases (from mockLeases)
 */
import { useMemo } from 'react';
import type { DashboardStats } from '../types/dashboard';
import { mockProperties } from '../data/mockProperties';
import { mockTenantList } from '../data/mockTenantList';
import { mockLeases } from '../data/mockLeases';

export function useDashboardStats(): DashboardStats {
    return useMemo(() => {
        // Properties
        const propertiesArchived = mockProperties.filter((p) => p.archived).length;
        const propertiesTotal = mockProperties.length;
        const propertiesActive = propertiesTotal - propertiesArchived;

        // Tenants
        const tenantsArchived = mockTenantList.filter((t) => t.archived).length;
        const tenantsTotal = mockTenantList.length;
        const tenantsActive = tenantsTotal - tenantsArchived;

        // Leases
        const leasesArchived = mockLeases.filter((l) => l.archived).length;
        const leasesTotal = mockLeases.length;
        const leasesActive = leasesTotal - leasesArchived;

        return {
            properties: { active: propertiesActive, total: propertiesTotal, archived: propertiesArchived },
            tenants: { active: tenantsActive, total: tenantsTotal, archived: tenantsArchived },
            leases: { active: leasesActive, total: leasesTotal, archived: leasesArchived },
        };
    }, []);
}

/**
 * Utility: restituisce true se non ci sono dati (per mostrare OnboardingCard).
 */
export function useHasData(): boolean {
    const stats = useDashboardStats();
    return stats.properties.total > 0 || stats.tenants.total > 0 || stats.leases.total > 0;
}
