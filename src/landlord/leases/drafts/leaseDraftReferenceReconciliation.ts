import type { ContactListStatus } from '../../../contacts/contactListStore';

export type LeaseReferenceStatus =
    | 'active'
    | 'archived'
    | 'missing'
    | 'pending'
    | 'unverified';

export interface LeaseResolvedReference<T> {
    id: string;
    index: number;
    status: LeaseReferenceStatus;
    record: T | null;
}

interface ReferenceRecord {
    id: string;
    archived: boolean;
}

function resolvedStatus(record: ReferenceRecord): LeaseReferenceStatus {
    return record.archived ? 'archived' : 'active';
}

export function reconcilePropertyReference<T extends ReferenceRecord>(
    propertyId: string,
    properties: readonly T[],
): LeaseResolvedReference<T> | null {
    if (!propertyId) return null;
    const record = properties.find((property) => property.id === propertyId) ?? null;
    return {
        id: propertyId,
        index: 0,
        status: record ? resolvedStatus(record) : 'missing',
        record,
    };
}

export function reconcileTenantReferences<T extends ReferenceRecord>(
    tenantIds: readonly string[],
    tenants: readonly T[],
): LeaseResolvedReference<T>[] {
    return tenantIds.map((id, index) => {
        const record = tenants.find((tenant) => tenant.id === id) ?? null;
        return {
            id,
            index,
            status: record ? resolvedStatus(record) : 'missing',
            record,
        };
    });
}

export function reconcileGuarantorReferences<T extends ReferenceRecord>(
    guarantorIds: readonly string[],
    contacts: readonly T[],
    status: ContactListStatus,
): LeaseResolvedReference<T>[] {
    return guarantorIds.map((id, index) => {
        const record = contacts.find((contact) => contact.id === id) ?? null;
        const unresolvedStatus: LeaseReferenceStatus = status === 'ready'
            ? 'missing'
            : status === 'error'
                ? 'unverified'
                : 'pending';
        return {
            id,
            index,
            status: record ? resolvedStatus(record) : unresolvedStatus,
            record,
        };
    });
}
