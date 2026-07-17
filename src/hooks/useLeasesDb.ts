import { useEffect, useState } from 'react';
import { listLeaseItems, type LeaseListItem } from '../db/leaseRepository';
import { subscribeJsonDb } from '../db/jsonDb';

export function useLeasesDb() {
    const [leases, setLeases] = useState<LeaseListItem[]>(() => listLeaseItems());

    useEffect(() => {
        const refresh = () => setLeases(listLeaseItems());
        refresh();
        return subscribeJsonDb(refresh);
    }, []);

    return { leases, isLoading: false };
}
