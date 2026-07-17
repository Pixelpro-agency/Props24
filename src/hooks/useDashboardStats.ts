import { useEffect, useState } from 'react';
import type { DashboardStats } from '../types/dashboard';
import { getDashboardStats } from '../db/dashboardRepository';
import { subscribeJsonDb } from '../db/jsonDb';

export function useDashboardStats(): DashboardStats {
    const [stats, setStats] = useState<DashboardStats>(() => getDashboardStats());

    useEffect(() => {
        const refresh = () => setStats(getDashboardStats());
        refresh();
        return subscribeJsonDb(refresh);
    }, []);

    return stats;
}

export function useHasData(): boolean {
    const stats = useDashboardStats();
    return stats.properties.total > 0 || stats.tenants.total > 0 || stats.leases.total > 0;
}
