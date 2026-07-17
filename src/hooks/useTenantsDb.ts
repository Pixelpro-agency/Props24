import { useEffect, useState } from 'react';
import { listTenants, type TenantListItem } from '../db/tenantRepository';
import { subscribeJsonDb } from '../db/jsonDb';

export function useTenantsDb(): TenantListItem[] {
    const [tenants, setTenants] = useState<TenantListItem[]>(() => listTenants());

    useEffect(() => {
        const refresh = () => setTenants(listTenants());
        refresh();
        return subscribeJsonDb(refresh);
    }, []);

    return tenants;
}
