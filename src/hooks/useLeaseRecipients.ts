import { useMemo } from 'react';
import type { LeaseListItem } from '../landlord/leases/types/leaseListing.types';

export interface LeaseRecipient {
    id: string;      // Note: this is the tenantId, since we message tenants
    name: string;
    email: string;
    leaseId: string; // Keep reference to which lease triggered this
}

/**
 * Builds email recipients dynamically from the currently selected rows in the leases table.
 */
export function useLeaseRecipients(selectedIds: string[], filteredData: LeaseListItem[]): LeaseRecipient[] {
    return useMemo(() => {
        const recipients: LeaseRecipient[] = [];

        selectedIds.forEach((idx) => {
            const lease = filteredData[parseInt(idx)];
            if (lease && lease.tenantId && lease.tenantEmail) {
                // Prevent duplicate recipients if a tenant has multiple leases selected?
                // For now, allow it, or uniquely map by tenant ID
                if (!recipients.some(r => r.id === lease.tenantId)) {
                    recipients.push({
                        id: lease.tenantId,
                        name: lease.tenantName ?? 'Sconosciuto',
                        email: lease.tenantEmail,
                        leaseId: lease.id,
                    });
                }
            }
        });

        return recipients;
    }, [selectedIds, filteredData]);
}
