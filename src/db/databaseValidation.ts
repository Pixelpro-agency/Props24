import type { LocalDatabase } from './database.types';
import { buildPropertyCadastralKey, findTenantLeaseConflicts, normalizeBuildingIdentifier, normalizeBuildingLocationKey, normalizeFiscalCode } from './businessRules';
import { isLeaseCurrentlyActive, isValidIsoDate, todayIso } from './dataSelectors';
import { calculateLeasePeriodicAmount } from '../landlord/leases/schema/leaseFormSchema';
import { isGeneratedRentPayment } from './paymentRepository';

export interface DatabaseValidationIssue {
    severity: 'error' | 'warning';
    code: string;
    collection: string;
    recordId?: string;
    message: string;
}

export class DatabaseIntegrityError extends Error {
    issues: DatabaseValidationIssue[];

    constructor(issues: DatabaseValidationIssue[]) {
        super(`Database locale non valido: ${issues.length} problemi bloccanti.`);
        this.name = 'DatabaseIntegrityError';
        this.issues = issues;
    }
}

function issue(severity: DatabaseValidationIssue['severity'], code: string, collection: string, recordId: string | undefined, message: string): DatabaseValidationIssue {
    return { severity, code, collection, recordId, message };
}

function uniqueIssues(issues: DatabaseValidationIssue[]): DatabaseValidationIssue[] {
    const seen = new Set<string>();
    return issues.filter((item) => {
        const key = [item.severity, item.code, item.collection, item.recordId || '', item.message].join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function requiredString(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0;
}

function optionalString(value: unknown): boolean {
    return typeof value === 'string';
}

function checkAddressFields(
    issues: DatabaseValidationIssue[],
    collection: string,
    recordId: string,
    values: { address?: unknown; city?: unknown; postalCode?: unknown; country?: unknown },
    requireMainFields: boolean,
): void {
    if (requireMainFields && !requiredString(values.address)) issues.push(issue('error', 'ADDRESS_REQUIRED', collection, recordId, 'Indirizzo obbligatorio vuoto.'));
    if (requireMainFields && !requiredString(values.city)) issues.push(issue('error', 'CITY_REQUIRED', collection, recordId, 'Città obbligatoria vuota.'));
    if (requireMainFields && !requiredString(values.postalCode)) issues.push(issue('error', 'POSTAL_CODE_REQUIRED', collection, recordId, 'CAP obbligatorio vuoto.'));
    if (values.address !== undefined && !optionalString(values.address)) issues.push(issue('error', 'ADDRESS_NOT_STRING', collection, recordId, 'Indirizzo non testuale.'));
    if (values.city !== undefined && !optionalString(values.city)) issues.push(issue('error', 'CITY_NOT_STRING', collection, recordId, 'Città non testuale.'));
    if (values.postalCode !== undefined && !optionalString(values.postalCode)) issues.push(issue('error', 'POSTAL_CODE_NOT_STRING', collection, recordId, 'CAP non testuale.'));
    if (typeof values.postalCode === 'string' && values.postalCode.length > 20) issues.push(issue('error', 'POSTAL_CODE_TOO_LONG', collection, recordId, 'CAP troppo lungo.'));
    if (values.country !== undefined && !optionalString(values.country)) issues.push(issue('error', 'COUNTRY_NOT_STRING', collection, recordId, 'Paese non serializzabile come testo.'));
}

export function validateDatabaseRelations(database: LocalDatabase, referenceDate = todayIso()): DatabaseValidationIssue[] {
    const issues: DatabaseValidationIssue[] = [];
    const collections = [
        ['properties', database.properties],
        ['buildings', database.buildings],
        ['tenants', database.tenants],
        ['leases', database.leases],
        ['payments', database.payments],
    ] as const;
    const propertyIds = new Set(database.properties.map((item) => item.id));
    const buildingIds = new Set(database.buildings.map((item) => item.id));
    const tenantIds = new Set(database.tenants.map((item) => item.id));
    const leaseIds = new Set(database.leases.map((item) => item.id));
    const propertyCadastralKeys = new Map<string, string>();
    const buildingIdentifiers = new Map<string, string>();
    const buildingLocations = new Map<string, string>();
    const tenantFiscalCodes = new Map<string, string>();
    const derivedPropertyLeaseIds = new Map<string, Set<string>>();
    const derivedPropertyTenantIds = new Map<string, Set<string>>();
    const derivedTenantLeaseIds = new Map<string, Set<string>>();

    database.properties.forEach((property) => {
        derivedPropertyLeaseIds.set(property.id, new Set());
        derivedPropertyTenantIds.set(property.id, new Set());
    });
    database.tenants.forEach((tenant) => {
        derivedTenantLeaseIds.set(tenant.id, new Set());
    });
    database.leases.forEach((lease) => {
        derivedPropertyLeaseIds.get(lease.propertyId)?.add(lease.id);
        lease.tenantIds.forEach((tenantId) => {
            derivedPropertyTenantIds.get(lease.propertyId)?.add(tenantId);
            derivedTenantLeaseIds.get(tenantId)?.add(lease.id);
        });
    });

    collections.forEach(([collectionName, records]) => {
        const seen = new Set<string>();
        records.forEach((record) => {
            if (!record.id) issues.push(issue('error', 'EMPTY_ID', collectionName, undefined, 'ID vuoto.'));
            if (seen.has(record.id)) issues.push(issue('error', 'DUPLICATE_ID', collectionName, record.id, 'ID duplicato nella collezione.'));
            seen.add(record.id);
        });
    });

    database.properties.forEach((property) => {
        const f = property.formData;
        const cadastralKey = buildPropertyCadastralKey(f);
        if (cadastralKey !== null) {
            const existingId = propertyCadastralKeys.get(cadastralKey);
            if (existingId) issues.push(issue('warning', 'PROPERTY_CADASTRAL_KEY_DUPLICATE', 'properties', property.id, `Riferimenti catastali duplicati con ${existingId}.`));
            else propertyCadastralKeys.set(cadastralKey, property.id);
        }
        checkAddressFields(issues, 'properties', property.id, {
            address: f.PropertyAddress,
            city: f.PropertyCity,
            postalCode: f.PropertyPostalCode,
            country: f.PropertyCountry,
        }, true);
        if (property.relations.buildingId && !buildingIds.has(property.relations.buildingId)) {
            issues.push(issue('error', 'ORPHAN_BUILDING', 'properties', property.id, 'Edificio collegato inesistente.'));
        }
        property.relations.leaseIds.forEach((id) => {
            const lease = database.leases.find((item) => item.id === id);
            if (!lease) issues.push(issue('error', 'ORPHAN_LEASE', 'properties', property.id, `Locazione ${id} inesistente.`));
            else if (lease.propertyId !== property.id) issues.push(issue('error', 'NON_RECIPROCAL_LEASE', 'properties', property.id, `Locazione ${id} non reciproca.`));
        });
        property.relations.tenantIds.forEach((id) => {
            if (!tenantIds.has(id)) issues.push(issue('error', 'ORPHAN_TENANT', 'properties', property.id, `Inquilino ${id} inesistente.`));
        });
        const expectedLeaseIds = Array.from(derivedPropertyLeaseIds.get(property.id) || []).sort();
        const expectedTenantIds = Array.from(derivedPropertyTenantIds.get(property.id) || []).sort();
        if (JSON.stringify([...property.relations.leaseIds].sort()) !== JSON.stringify(expectedLeaseIds)) {
            issues.push(issue('error', 'PROPERTY_LEASE_RELATIONS_OUT_OF_SYNC', 'properties', property.id, 'Relazioni locazioni proprieta non derivate dalle locazioni.'));
        }
        if (JSON.stringify([...property.relations.tenantIds].sort()) !== JSON.stringify(expectedTenantIds)) {
            issues.push(issue('error', 'PROPERTY_TENANT_RELATIONS_OUT_OF_SYNC', 'properties', property.id, 'Relazioni tenant proprieta non derivate dalle locazioni.'));
        }
        const currentLeases = database.leases.filter((lease) => lease.propertyId === property.id && isLeaseCurrentlyActive(lease, referenceDate));
        if (f.PropertyStatusManual === 'affittato' && currentLeases.length === 0) {
            issues.push(issue('warning', 'RENTED_WITHOUT_CURRENT_LEASE', 'properties', property.id, 'Stato manuale affittato senza locazione corrente.'));
        }
    });

    database.buildings.forEach((building) => {
        const identifier = normalizeBuildingIdentifier(building.identifier);
        if (!identifier) {
            issues.push(issue('error', 'BUILDING_IDENTIFIER_REQUIRED', 'buildings', building.id, 'Identificativo edificio obbligatorio vuoto.'));
        } else {
            const existingId = buildingIdentifiers.get(identifier);
            if (existingId) issues.push(issue('error', 'BUILDING_IDENTIFIER_DUPLICATE', 'buildings', building.id, `Identificativo edificio duplicato con ${existingId}.`));
            else buildingIdentifiers.set(identifier, building.id);
        }
        const locationKey = normalizeBuildingLocationKey(building);
        if (locationKey) {
            const existingId = buildingLocations.get(locationKey);
            if (existingId) issues.push(issue('error', 'BUILDING_LOCATION_DUPLICATE', 'buildings', building.id, `Indirizzo edificio duplicato con ${existingId}.`));
            else buildingLocations.set(locationKey, building.id);
        }
        checkAddressFields(issues, 'buildings', building.id, {
            address: building.address,
            city: building.city,
            postalCode: building.postalCode,
            country: building.country,
        }, true);
        if (!requiredString(building.country)) issues.push(issue('error', 'BUILDING_COUNTRY_REQUIRED', 'buildings', building.id, 'Paese edificio obbligatorio vuoto.'));
        const expectedUnitsCount = database.properties.filter((property) => property.relations.buildingId === building.id).length;
        if (building.unitsCount !== expectedUnitsCount) {
            issues.push(issue('error', 'BUILDING_UNITS_COUNT_OUT_OF_SYNC', 'buildings', building.id, `Conteggio unità non coerente: atteso ${expectedUnitsCount}, trovato ${building.unitsCount}.`));
        }
    });

    database.tenants.forEach((tenant) => {
        const fiscalCode = normalizeFiscalCode(tenant.fiscalCode);
        if (fiscalCode) {
            const existingId = tenantFiscalCodes.get(fiscalCode);
            if (existingId) issues.push(issue('warning', 'TENANT_FISCAL_CODE_DUPLICATE', 'tenants', tenant.id, `Codice fiscale duplicato con ${existingId}.`));
            else tenantFiscalCodes.set(fiscalCode, tenant.id);
        }
        checkAddressFields(issues, 'tenants', tenant.id, {
            address: tenant.address1,
            city: tenant.city,
            postalCode: tenant.zip,
            country: tenant.country,
        }, false);
        tenant.leaseIds.forEach((id) => {
            const lease = database.leases.find((item) => item.id === id);
            if (!lease) issues.push(issue('error', 'ORPHAN_LEASE', 'tenants', tenant.id, `Locazione ${id} inesistente.`));
            else if (!lease.tenantIds.includes(tenant.id)) issues.push(issue('error', 'NON_RECIPROCAL_LEASE', 'tenants', tenant.id, `Locazione ${id} non reciproca.`));
        });
        const expectedLeaseIds = Array.from(derivedTenantLeaseIds.get(tenant.id) || []).sort();
        if (JSON.stringify([...tenant.leaseIds].sort()) !== JSON.stringify(expectedLeaseIds)) {
            issues.push(issue('error', 'TENANT_LEASE_RELATIONS_OUT_OF_SYNC', 'tenants', tenant.id, 'Relazioni locazioni tenant non derivate dalle locazioni.'));
        }
    });

    database.leases.forEach((lease) => {
        const property = database.properties.find((item) => item.id === lease.propertyId);
        if (!propertyIds.has(lease.propertyId)) issues.push(issue('error', 'ORPHAN_PROPERTY', 'leases', lease.id, 'Proprieta della locazione inesistente.'));
        if (lease.tenantIds.length === 0) issues.push(issue('error', 'LEASE_WITHOUT_TENANT', 'leases', lease.id, 'Locazione senza inquilino.'));
        if (new Set(lease.tenantIds).size !== lease.tenantIds.length) issues.push(issue('error', 'LEASE_DUPLICATE_TENANT', 'leases', lease.id, 'Inquilini duplicati nella locazione.'));
        if (property && !property.relations.leaseIds.includes(lease.id)) issues.push(issue('error', 'NON_RECIPROCAL_PROPERTY', 'leases', lease.id, 'Proprieta non contiene la locazione.'));
        lease.tenantIds.forEach((id) => {
            const tenant = database.tenants.find((item) => item.id === id);
            if (!tenant) issues.push(issue('error', 'ORPHAN_TENANT', 'leases', lease.id, `Inquilino ${id} inesistente.`));
            else if (!tenant.leaseIds.includes(lease.id)) issues.push(issue('error', 'NON_RECIPROCAL_TENANT', 'leases', lease.id, `Inquilino ${id} non contiene la locazione.`));
        });
        if (!isValidIsoDate(lease.startDate)) issues.push(issue('error', 'INVALID_DATE', 'leases', lease.id, 'Data inizio non ISO valida.'));
        if (!isValidIsoDate(lease.endDate)) issues.push(issue('error', 'INVALID_DATE', 'leases', lease.id, 'Data fine non ISO valida.'));
        if (!['weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'].includes(lease.billingPeriod)) issues.push(issue('error', 'INVALID_BILLING_PERIOD', 'leases', lease.id, 'Periodicita locazione non valida.'));
        if (lease.rentAmount < 0 || lease.utilitiesAmount < 0 || lease.depositAmount < 0) issues.push(issue('error', 'NEGATIVE_AMOUNT', 'leases', lease.id, 'Importi locazione negativi.'));
        if (!lease.formData
            || lease.formData.PropertyID !== lease.propertyId
            || JSON.stringify(lease.formData.LeaseTenantIds) !== JSON.stringify(lease.tenantIds)
            || JSON.stringify(lease.formData.LeaseGarantIds) !== JSON.stringify(lease.guarantorIds)
            || lease.formData.LeaseType !== lease.leaseType
            || lease.formData.LeaseStartDate !== lease.startDate
            || lease.formData.LeaseEndDate !== lease.endDate
            || lease.formData.LeaseRentHC !== lease.rentAmount
            || lease.formData.LeaseMaintenance !== lease.utilitiesAmount
            || lease.formData.LeaseDeposit !== lease.depositAmount
            || lease.formData.LeaseBillingPeriod !== lease.billingPeriod) {
            issues.push(issue('error', 'LEASE_FORMDATA_MISMATCH', 'leases', lease.id, 'FormData locazione non coerente con le proiezioni.'));
        } else if (calculateLeasePeriodicAmount(lease.formData) !== lease.formData.LeaseMonthlyAmount) {
            issues.push(issue('error', 'LEASE_AMOUNT_MISMATCH', 'leases', lease.id, 'Importo periodico non coerente con il form.'));
        }
        if (isValidIsoDate(lease.startDate) && isValidIsoDate(lease.endDate)) {
            if (lease.endDate < lease.startDate) issues.push(issue('error', 'INVALID_DATE_RANGE', 'leases', lease.id, 'Fine locazione precedente all inizio.'));
            if (!lease.archived) {
                lease.tenantIds.forEach((tenantId) => {
                    const conflicts = findTenantLeaseConflicts(database, tenantId, lease.propertyId, lease.startDate, lease.endDate, lease.id);
                    if (conflicts.length > 0) {
                        issues.push(issue('error', 'TENANT_LEASE_DATE_OVERLAP', 'leases', lease.id, `Locazione sovrapposta per inquilino ${tenantId}.`));
                    }
                });
            }
        }
    });

    database.payments.forEach((payment) => {
        const lease = payment.leaseId ? database.leases.find((item) => item.id === payment.leaseId) : null;
        if (!propertyIds.has(payment.propertyId)) issues.push(issue('error', 'ORPHAN_PROPERTY', 'payments', payment.id, 'Proprieta pagamento inesistente.'));
        if (payment.leaseId && !leaseIds.has(payment.leaseId)) issues.push(issue('error', 'ORPHAN_LEASE', 'payments', payment.id, 'Locazione pagamento inesistente.'));
        if (payment.tenantId && !tenantIds.has(payment.tenantId)) issues.push(issue('error', 'ORPHAN_TENANT', 'payments', payment.id, 'Inquilino pagamento inesistente.'));
        if (!isValidIsoDate(payment.dueDate) || (payment.paidDate !== null && !isValidIsoDate(payment.paidDate))) issues.push(issue('error', 'INVALID_DATE', 'payments', payment.id, 'Data pagamento non ISO valida.'));
        if (payment.amount < 0) issues.push(issue('error', 'NEGATIVE_AMOUNT', 'payments', payment.id, 'Importo negativo non valido.'));
        if (payment.status === 'paid' && !payment.paidDate) issues.push(issue('error', 'PAYMENT_PAID_WITHOUT_PAID_DATE', 'payments', payment.id, 'Pagamento paid senza paidDate.'));
        if (payment.status !== 'paid' && payment.paidDate) issues.push(issue('error', 'PAYMENT_UNPAID_WITH_PAID_DATE', 'payments', payment.id, 'Pagamento non paid con paidDate.'));
        if (payment.status === 'paid' && payment.paidDate && payment.paidDate > referenceDate) {
            issues.push(issue('error', 'PAYMENT_PAID_DATE_IN_FUTURE', 'payments', payment.id, 'Pagamento con paidDate futura.'));
        } else if (payment.status === 'paid' && isGeneratedRentPayment(payment) && payment.dueDate > referenceDate) {
            issues.push(issue('error', 'GENERATED_PAYMENT_PAID_BEFORE_DUE_DATE', 'payments', payment.id, 'Rata generata futura già segnata come pagata.'));
        }
        if (lease) {
            if (payment.propertyId !== lease.propertyId) issues.push(issue('error', 'PAYMENT_PROPERTY_MISMATCH', 'payments', payment.id, 'Pagamento collegato alla proprieta sbagliata.'));
            if (payment.tenantId && !lease.tenantIds.includes(payment.tenantId)) issues.push(issue('error', 'PAYMENT_TENANT_MISMATCH', 'payments', payment.id, 'Tenant pagamento non appartenente alla locazione.'));
            if (payment.dueDate < lease.startDate || (payment.dueDate > lease.endDate && !lease.formData.LeaseRinnovoTacito)) {
                issues.push(issue(isGeneratedRentPayment(payment) ? 'error' : 'warning', 'PAYMENT_OUT_OF_CONTRACT', 'payments', payment.id, 'Pagamento fuori periodo contrattuale.'));
            }
        }
        if (payment.type === 'income' && (payment.category === 'rent' || payment.category === 'rent-first')) {
            if (!payment.leaseId || !lease) issues.push(issue('error', 'RENT_INCOME_WITHOUT_LEASE', 'payments', payment.id, 'Entrata affitto senza locazione valida.'));
            else if (!payment.tenantId || !lease.tenantIds.includes(payment.tenantId)) issues.push(issue('error', 'RENT_INCOME_WITH_INVALID_TENANT', 'payments', payment.id, 'Entrata affitto con tenant non valido.'));
        }
    });

    return uniqueIssues(issues);
}

export function assertDatabaseIntegrity(database: LocalDatabase): void {
    const issues = validateDatabaseRelations(database);
    const blocking = issues.filter((item) => item.severity === 'error');
    if (blocking.length > 0) throw new DatabaseIntegrityError(blocking);
}
