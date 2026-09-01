import type { BuildingRecord, ContactRecord, LeaseRecord, LocalDatabase, PropertyRecord, TenantRecord } from './database.types';
import type { PropertyFormData } from '../components/property-form/schema';
import { DuplicateBuildingIdentifierError, DuplicateBuildingLocationError, DuplicateContactFiscalIdentityError, DuplicatePropertyCadastralKeyError, DuplicatePropertyIdentifierError, DuplicatePropertyLocationError, DuplicateTenantFiscalIdentityError, TenantLeaseConflictError, type FiscalIdentityField } from './databaseErrors';
import { isValidIsoDate } from './dataSelectors';

const ALLOW_OVERLAPPING_TENANT_LEASES = false;

export function normalizePropertyIdentifier(value: string): string {
    return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('it-IT');
}

export function normalizeBuildingIdentifier(value: string): string {
    return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('it-IT');
}

function normalizePropertyLocationPart(value: string): string {
    return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('it-IT');
}

function normalizePostalCode(value: string): string {
    return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, '').toUpperCase();
}

function normalizeCountry(value: string): string {
    return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, '').toUpperCase();
}

export type PropertyCadastralIdentity = Pick<
    PropertyFormData,
    | 'PropertyCountry'
    | 'PropertyCadastreMunicipalityCode'
    | 'PropertyCadastreRegistryType'
    | 'PropertyCadastreMunicipality'
    | 'PropertyUrbanSection'
    | 'PropertyCadastreSheet'
    | 'PropertyCadastrePart'
    | 'PropertyCadastreSub'
>;

function normalizeCadastralCode(value: string): string {
    return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, '').toUpperCase();
}

function normalizeCadastralMunicipality(value: string): string {
    return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toUpperCase();
}

export function buildPropertyCadastralKey(identity: PropertyCadastralIdentity): string | null {
    const country = normalizeCadastralCode(identity.PropertyCountry);
    const municipalityCode = normalizeCadastralCode(identity.PropertyCadastreMunicipalityCode);
    const registryType = identity.PropertyCadastreRegistryType;
    const urbanSection = normalizeCadastralCode(identity.PropertyUrbanSection);
    const municipality = normalizeCadastralMunicipality(identity.PropertyCadastreMunicipality);
    const sheet = normalizeCadastralCode(identity.PropertyCadastreSheet);
    const part = normalizeCadastralCode(identity.PropertyCadastrePart);
    const sub = normalizeCadastralCode(identity.PropertyCadastreSub);

    if (
        !country
        || !municipalityCode
        || (registryType !== 'terreni' && registryType !== 'urbano')
        || !sheet
        || !part
    ) {
        return null;
    }

    return JSON.stringify({
        country,
        municipalityCode,
        registryType,
        urbanSection: urbanSection || null,
        municipality: municipality || null,
        sheet,
        part,
        sub: sub || null,
    });
}

export function findPropertyByCadastralKey(database: LocalDatabase, identity: PropertyCadastralIdentity, excludePropertyId?: string): PropertyRecord | null {
    const inputKey = buildPropertyCadastralKey(identity);
    if (inputKey === null) return null;
    return database.properties.find((property) => {
        if (property.id === excludePropertyId) return false;
        const existingKey = buildPropertyCadastralKey(property.formData);
        return existingKey !== null && existingKey === inputKey;
    }) || null;
}

export function assertUniquePropertyCadastralKey(database: LocalDatabase, identity: PropertyCadastralIdentity, excludePropertyId?: string): void {
    const duplicate = findPropertyByCadastralKey(database, identity, excludePropertyId);
    if (duplicate) throw new DuplicatePropertyCadastralKeyError(duplicate.id);
}

export type BuildingLocation = Pick<BuildingRecord, 'address' | 'city' | 'postalCode' | 'country'>;

export function normalizeBuildingLocationKey(building: BuildingLocation): string {
    const address = normalizePropertyLocationPart(building.address);
    const city = normalizePropertyLocationPart(building.city);
    const postalCode = normalizePostalCode(building.postalCode);
    const country = normalizeCountry(building.country);
    if (!address || !city || !postalCode || !country) return '';
    return `${address}|${city}|${postalCode}|${country}`;
}

export function findBuildingByIdentifier(database: LocalDatabase, identifier: string, excludeBuildingId?: string): BuildingRecord | null {
    const normalized = normalizeBuildingIdentifier(identifier);
    if (!normalized) return null;
    return database.buildings.find((building) => building.id !== excludeBuildingId && normalizeBuildingIdentifier(building.identifier) === normalized) || null;
}

export function assertUniqueBuildingIdentifier(database: LocalDatabase, identifier: string, excludeBuildingId?: string): void {
    const duplicate = findBuildingByIdentifier(database, identifier, excludeBuildingId);
    if (duplicate) throw new DuplicateBuildingIdentifierError(identifier, duplicate.id);
}

export function findBuildingByLocation(database: LocalDatabase, location: BuildingLocation, excludeBuildingId?: string): BuildingRecord | null {
    const key = normalizeBuildingLocationKey(location);
    if (!key) return null;
    return database.buildings.find((building) => building.id !== excludeBuildingId && normalizeBuildingLocationKey(building) === key) || null;
}

export function assertUniqueBuildingLocation(database: LocalDatabase, location: BuildingLocation, excludeBuildingId?: string): void {
    const duplicate = findBuildingByLocation(database, location, excludeBuildingId);
    if (duplicate) throw new DuplicateBuildingLocationError(duplicate.id);
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

export function normalizeVatNumber(value: string): string {
    return String(value ?? '').normalize('NFKC').replace(/\s+/g, '').toUpperCase();
}

export type { FiscalIdentityField } from './databaseErrors';

export type ContactFiscalIdentityCandidate = Pick<ContactRecord, 'type' | 'fiscalCode' | 'vatNumber'>;
export type TenantFiscalIdentityCandidate = Pick<TenantRecord, 'type' | 'fiscalCode' | 'companyFiscalCode' | 'vatNumber'>;

export interface ContactFiscalDuplicate {
    field: FiscalIdentityField;
    record: ContactRecord;
}

export interface TenantFiscalDuplicate {
    field: FiscalIdentityField;
    record: TenantRecord;
}

export function findContactFiscalDuplicate(database: LocalDatabase, candidate: ContactFiscalIdentityCandidate, excludeContactId?: string): ContactFiscalDuplicate | null {
    const fiscalCode = normalizeFiscalCode(candidate.fiscalCode);
    const vatNumber = candidate.type === 'company' ? normalizeVatNumber(candidate.vatNumber) : '';
    if (fiscalCode) {
        const record = database.contacts.find((contact) => contact.id !== excludeContactId
            && contact.type === candidate.type
            && normalizeFiscalCode(contact.fiscalCode) === fiscalCode);
        if (record) return { field: 'fiscalCode', record };
    }
    if (vatNumber) {
        const record = database.contacts.find((contact) => contact.id !== excludeContactId
            && contact.type === 'company'
            && normalizeVatNumber(contact.vatNumber) === vatNumber);
        if (record) return { field: 'vatNumber', record };
    }
    return null;
}

export function assertUniqueContactFiscalIdentity(database: LocalDatabase, candidate: ContactFiscalIdentityCandidate, excludeContactId?: string): void {
    const duplicate = findContactFiscalDuplicate(database, candidate, excludeContactId);
    if (duplicate) throw new DuplicateContactFiscalIdentityError(duplicate.field, duplicate.record.id);
}

export function findTenantFiscalDuplicate(database: LocalDatabase, candidate: TenantFiscalIdentityCandidate, excludeTenantId?: string): TenantFiscalDuplicate | null {
    const fiscalCode = normalizeFiscalCode(candidate.type === 'person' ? candidate.fiscalCode : candidate.companyFiscalCode);
    const vatNumber = candidate.type === 'company' ? normalizeVatNumber(candidate.vatNumber) : '';
    if (fiscalCode) {
        const record = database.tenants.find((tenant) => tenant.id !== excludeTenantId
            && tenant.type === candidate.type
            && normalizeFiscalCode(tenant.type === 'person' ? tenant.fiscalCode : tenant.companyFiscalCode) === fiscalCode);
        if (record) return { field: 'fiscalCode', record };
    }
    if (vatNumber) {
        const record = database.tenants.find((tenant) => tenant.id !== excludeTenantId
            && tenant.type === 'company'
            && normalizeVatNumber(tenant.vatNumber) === vatNumber);
        if (record) return { field: 'vatNumber', record };
    }
    return null;
}

export function assertUniqueTenantFiscalIdentity(database: LocalDatabase, candidate: TenantFiscalIdentityCandidate, excludeTenantId?: string): void {
    const duplicate = findTenantFiscalDuplicate(database, candidate, excludeTenantId);
    if (duplicate) throw new DuplicateTenantFiscalIdentityError(duplicate.field, duplicate.record.id);
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
        && tenant.type === 'person'
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
