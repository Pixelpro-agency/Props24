import { useEffect, useState } from 'react';
import { getLeaseDetail } from '../db/leaseRepository';
import { subscribeJsonDb } from '../db/jsonDb';
import type { LeaseDetail } from '../types/leaseDetail';

export function useLeaseDetail(id: string | undefined) {
    const [detail, setDetail] = useState<LeaseDetail | null>(() => id ? getLeaseDetail(id) : null);

    useEffect(() => {
        const refresh = () => setDetail(id ? getLeaseDetail(id) : null);
        refresh();
        return subscribeJsonDb(refresh);
    }, [id]);

    return { detail, isLoading: false };
}
