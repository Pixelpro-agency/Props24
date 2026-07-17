import type { LeaseRecord, LocalDatabase, PropertyRecord, TenantRecord } from './database.types';
import type { PropertyFormData } from '../components/property-form/schema';
import { DuplicatePropertyIdentifierError, DuplicatePropertyLocationError, TenantLeaseConflictError } from './databaseErrors';
import { isValidIsoDate } from './dataSelectors';

const ALLOW_OVERLAPPING_TENANT_LEASES = false;

export function normalizePropertyIdentifier(value: string): string {
    return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('it-IT');
}

function normalizePropertyLocationPart(value: string): string {
    return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('it-IT');
}

function normalizePostalCode(value: string): string {
    return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, '').toUpperCase();
}

export function normalizePropertyLocationKey(formData: Pick<PropertyFormData, 'PropertyAddress' | 'PropertyCity' | 'PropertyPostalCode'>): string {
    const address = normalizePropertyLocationPart(formData.PropertyAddress);
    const city = normalizePropertyLocationPart(formData.PropertyCity);
    const postalCode = normalizePostalCode(formData.PropertyPostalCode);
    if (!address || !city || !postalCode) return '';
    return `${address}|${city}|${postalCode}`;
}

export function normalizeFiscalCode(value: string): string {
    return String(value ?? '').normalize('NFKC').replace(/\s+/g, '').toUpperCase();
}

export function findPropertyByIdentifier(database: LocalDatabase, identifier: string, excludePropertyId?: string) {
    const normalized = normalizePropertyIdentifier(identifier);
    if (!normalized) return null;
    return database.properties.find((property) => (
        property.id !== excludePropertyId
        && normalizePropertyIdentifier(property.formData.PropertyTitle) === normalized
    )) || null;
}

export function assertUniquePropertyIdentifier(database: LocalDatabase, identifier: string, excludePropertyId?: string): void {
    const duplicate = findPropertyByIdentifier(database, identifier, excludePropertyId);
    if (duplicate) throw new DuplicatePropertyIdentifierError(identifier, duplicate.id);
}

export function findPropertyByLocation(
    database: LocalDatabase,
    address: string,
    city: string,
    postalCode: string,
    excludePropertyId?: string,
): PropertyRecord | null {
    const key = normalizePropertyLocationKey({ PropertyAddress: address, PropertyCity: city, PropertyPostalCode: postalCode });
    if (!key) return null;
    return database.properties.find((property) => (
        property.id !== excludePropertyId
        && normalizePropertyLocationKey(property.formData) === key
    )) || null;
}

export function assertUniquePropertyLocation(database: LocalDatabase, formData: Pick<PropertyFormData, 'PropertyAddress' | 'PropertyCity' | 'PropertyPostalCode'>, excludePropertyId?: string): void {
    const duplicate = findPropertyByLocation(database, formData.PropertyAddress, formData.PropertyCity, formData.PropertyPostalCode, excludePropertyId);
    if (duplicate) throw new DuplicatePropertyLocationError(duplicate.id);
}

export function findTenantByFiscalCode(database: LocalDatabase, fiscalCode: string, excludeTenantId?: string): TenantRecord | null {
    const normalized = normalizeFiscalCode(fiscalCode);
    if (!normalized) return null;
    return database.tenants.find((tenant) => (
        tenant.id !== excludeTenantId
        && normalizeFiscalCode(tenant.fiscalCode) === normalized
    )) || null;
}

export function doDateRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
    if (!isValidIsoDate(startA) || !isValidIsoDate(endA) || !isValidIsoDate(startB) || !isValidIsoDate(endB)) return false;
    return startA <= endB && startB <= endA;
}

export function findTenantLeaseConflicts(
    database: LocalDatabase,
    tenantId: string,
    propertyId: string,
    startDate: string,
    endDate: string,
    excludeLeaseId?: string,
): LeaseRecord[] {
    if (ALLOW_OVERLAPPING_TENANT_LEASES) return [];
    if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate)) return [];
    return database.leases.filter((lease) => (
        lease.id !== excludeLeaseId
        && lease.propertyId !== propertyId
        && lease.tenantIds.includes(tenantId)
        && !lease.archived
        && isValidIsoDate(lease.startDate)
        && isValidIsoDate(lease.endDate)
        && doDateRangesOverlap(startDate, endDate, lease.startDate, lease.endDate)
    ));
}

export function assertNoTenantLeaseConflicts(
    database: LocalDatabase,
    tenantIds: string[],
    propertyId: string,
    startDate: string,
    endDate: string,
    excludeLeaseId?: string,
): void {
    for (const tenantId of tenantIds) {
        const conflicts = findTenantLeaseConflicts(database, tenantId, propertyId, startDate, endDate, excludeLeaseId);
        if (conflicts.length > 0) {
            throw new TenantLeaseConflictError(
                tenantId,
                conflicts.map((lease) => lease.id),
                Array.from(new Set(conflicts.map((lease) => lease.propertyId))),
            );
        }
    }
}
