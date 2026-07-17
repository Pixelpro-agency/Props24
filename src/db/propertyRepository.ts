import type { Property, PropertyStatus, PropertyType, VisibilityStatus } from '../types/property';
import type { PropertyDetail } from '../types/propertyDetail';
import { deleteRecord, generateId, getJsonDb, getRecordById, saveJsonDb, updateRecord } from './jsonDb';
import type { LeaseRecord, PropertyRecord, TenantRecord } from './database.types';
import { normalizePropertyFormData, type PropertyFormData } from '../components/property-form/schema';
import { currentLeasesForProperty, getPropertyFinancialSummary, isLeaseCurrentlyActive, tenantsForLeases } from './dataSelectors';
import { assertUniquePropertyIdentifier, assertUniquePropertyLocation } from './businessRules';

function numberOrNull(value: number | null): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function numberOrZero(value: number | null): number {
    return numberOrNull(value) ?? 0;
}

function buildAddress(formData: PropertyFormData): string {
    return [formData.PropertyAddress, formData.PropertyPostalCode, formData.PropertyCity]
        .filter(Boolean)
        .join(', ');
}

function normalizeType(type: string): PropertyType {
    const allowed: PropertyType[] = [
        'appartamento',
        'negozio',
        'ufficio_condiviso',
        'ufficio',
        'roulotte',
        'cantina',
        'chalet',
        'stanza',
        'commercio',
        'magazzino',
        'garage',
        'laboratorio',
        'locale_professionale',
        'casa',
        'casa_di_citta',
        'mansarda',
        'casa_mobile',
        'parcheggio',
        'terreno',
        'nuda_proprieta',
        'altro',
    ];
    return allowed.includes(type as PropertyType) ? type as PropertyType : 'altro';
}

function normalizeStatus(status: string, hasCurrentLease: boolean): PropertyStatus {
    if (status === 'ricerca') return 'ricerca_inquilini';
    if (hasCurrentLease && status === 'preavviso') return 'preavviso';
    if (hasCurrentLease) return 'affittato';
    if (status === 'lavori' || status === 'non_disponibile' || status === 'ricerca_inquilini') return status;
    return 'disponibile';
}

function visibilityFromForm(formData: PropertyFormData): VisibilityStatus {
    return formData.PropertyPublic ? 'pubblicato' : 'nascosto';
}

function tenantName(tenant: TenantRecord): string {
    return tenant.type === 'company'
        ? tenant.companyName || 'Azienda'
        : `${tenant.firstName} ${tenant.lastName}`.trim();
}

function tenantsForRecord(record: PropertyRecord): TenantRecord[] {
    const db = getJsonDb();
    return record.relations.tenantIds
        .map((id) => db.tenants.find((tenant) => tenant.id === id))
        .filter((tenant): tenant is TenantRecord => Boolean(tenant));
}

function leasesForRecord(record: PropertyRecord): LeaseRecord[] {
    const db = getJsonDb();
    return record.relations.leaseIds
        .map((id) => db.leases.find((lease) => lease.id === id))
        .filter((lease): lease is LeaseRecord => Boolean(lease));
}

export function propertyRecordToListItem(record: PropertyRecord): Property {
    const formData = normalizePropertyFormData(record.formData);
    const db = getJsonDb();
    const currentLeases = currentLeasesForProperty(db, record.id);
    const tenants = tenantsForLeases(db, currentLeases);
    const firstTenant = tenants[0] ? tenantName(tenants[0]) : null;
    const tenantLabel = firstTenant && tenants.length > 1 ? `${firstTenant} +${tenants.length - 1}` : firstTenant;

    return {
        id: record.id,
        title: formData.PropertyTitle || 'Nuova proprietà',
        address: buildAddress(formData),
        type: normalizeType(formData.PropertyTypeID),
        surface: numberOrNull(formData.PropertySize),
        rooms: numberOrNull(formData.PropertyRoomsNum),
        tenant: tenantLabel,
        rent: numberOrNull(formData.PropertyRent),
        assetValue: numberOrNull(formData.PropertyCurrentValue),
        status: normalizeStatus(formData.PropertyStatusManual, currentLeases.length > 0),
        visibility: visibilityFromForm(formData),
        archived: record.archived,
    };
}

export function propertyRecordToDetail(record: PropertyRecord): PropertyDetail {
    const formData = normalizePropertyFormData(record.formData);
    const photos = formData.PropertyPhotos.map((photo) => photo.dataUrl);
    const totalRent = numberOrZero(formData.PropertyRent) + numberOrZero(formData.PropertyMaintenance);
    const tenants = tenantsForRecord(record);
    const leases = leasesForRecord(record);
    const currentTenants = tenantsForLeases(getJsonDb(), leases.filter((lease) => isLeaseCurrentlyActive(lease)));

    return {
        id: record.id,
        title: formData.PropertyTitle || 'Nuova proprietà',
        type: formData.PropertyTypeID,
        address: {
            street: formData.PropertyAddress,
            postalCode: formData.PropertyPostalCode,
            city: formData.PropertyCity,
            country: formData.PropertyCountry,
        },
        specs: {
            surface: numberOrZero(formData.PropertySize),
            rooms: numberOrZero(formData.PropertyRoomsNum),
            bedrooms: numberOrZero(formData.PropertyRoomsNumChambres),
            bathrooms: numberOrZero(formData.PropertyRoomsNumBaths),
            floor: Number(formData.PropertyFloor) || 0,
        },
        rent: {
            total: totalRent,
            base: numberOrZero(formData.PropertyRent),
            utilities: numberOrZero(formData.PropertyMaintenance),
        },
        features: {
            furnished: formData.PropertyFurnished,
            smokersAllowed: formData.PropertySmokers,
            petsAllowed: formData.PropertyAnimals,
            equipment: formData.PropertyEquipment,
        },
        media: {
            photos,
            hasStreetView: false,
        },
        visibility: {
            isPublic: formData.PropertyPublic,
            addressPublic: formData.PropertyPublicAddress,
            phonePublic: formData.PropertyPublicPhone,
        },
        urls: {
            publicProfile: '',
            icalExport: '',
            icalImport: '',
            edit: '',
            delete: '',
        },
        tenant: currentTenants[0] ? { id: currentTenants[0].id, name: tenantName(currentTenants[0]), link: `/tenants/${currentTenants[0].id}` } : undefined,
        leases: leases.map((lease) => ({
            id: lease.id,
            name: formData.PropertyTitle,
            type: lease.leaseTypeLabel,
            startDate: lease.startDate,
            endDate: lease.endDate,
            status: isLeaseCurrentlyActive(lease) ? 'active' : lease.status === 'inattiva' ? 'pending' : 'ended',
            rentAmount: lease.rentAmount,
            utilitiesAmount: lease.utilitiesAmount,
            tenant: {
                id: lease.tenantIds[0] || '',
                name: tenants.find((tenant) => tenant.id === lease.tenantIds[0]) ? tenantName(tenants.find((tenant) => tenant.id === lease.tenantIds[0]) as TenantRecord) : '',
                link: lease.tenantIds[0] ? `/tenants/${lease.tenantIds[0]}` : undefined,
            },
            links: {
                edit: '',
                view: '',
            },
        })),
        finances: (() => {
            return getPropertyFinancialSummary(getJsonDb(), record.id, new Date().getFullYear());
        })(),
        notes: record.notes,
        activities: record.activities,
    };
}

export function listProperties(): Property[] {
    return getJsonDb().properties.map(propertyRecordToListItem);
}

export function getPropertyById(id: string): PropertyDetail | null {
    const record = getRecordById('properties', id) as PropertyRecord | null;
    return record ? propertyRecordToDetail(record) : null;
}

export function createProperty(formDataInput: PropertyFormData): PropertyRecord {
    const timestamp = new Date().toISOString();
    const formData = normalizePropertyFormData(formDataInput);
    const db = getJsonDb();
    assertUniquePropertyIdentifier(db, formData.PropertyTitle);
    assertUniquePropertyLocation(db, formData);
    const record: PropertyRecord = {
        id: generateId('property'),
        createdAt: timestamp,
        updatedAt: timestamp,
        archived: false,
        formData,
        relations: {
            buildingId: null,
            tenantIds: [],
            leaseIds: [],
        },
        notes: [],
        activities: [],
    };

    db.properties.push(record);
    return saveJsonDb(db).properties.find((property) => property.id === record.id) as PropertyRecord;
}

export function updateProperty(id: string, formDataInput: PropertyFormData): PropertyRecord | null {
    const db = getJsonDb();
    const existing = db.properties.find((property) => property.id === id) || null;
    if (!existing) return null;
    const formData = normalizePropertyFormData(formDataInput);
    assertUniquePropertyIdentifier(db, formData.PropertyTitle, id);
    assertUniquePropertyLocation(db, formData, id);
    existing.formData = formData;
    existing.updatedAt = new Date().toISOString();
    return saveJsonDb(db).properties.find((property) => property.id === id) || null;
}

export function archiveProperties(ids: string[]): void {
    ids.forEach((id) => {
        updateRecord('properties', id, { archived: true, updatedAt: new Date().toISOString() });
    });
}

export function deleteProperties(ids: string[]): { deleted: string[]; blocked: string[] } {
    const db = getJsonDb();
    const blocked = ids.filter((id) => {
        const property = db.properties.find((item) => item.id === id);
        return db.leases.some((lease) => lease.propertyId === id)
            || db.payments.some((payment) => payment.propertyId === id)
            || Boolean(property?.relations.tenantIds.length);
    });
    const deleted = ids.filter((id) => !blocked.includes(id));
    deleted.forEach((id) => deleteRecord('properties', id));
    return { deleted, blocked };
}

export function addPropertyNote(propertyId: string, text: string) {
    const db = getJsonDb();
    const property = db.properties.find((item) => item.id === propertyId);
    if (!property) throw new Error('Unità non trovata.');
    const note = { id: generateId('note'), text, createdAt: new Date().toISOString() };
    property.notes = [note, ...property.notes];
    property.updatedAt = new Date().toISOString();
    saveJsonDb(db);
    return note;
}

export function deletePropertyNote(propertyId: string, noteId: string): void {
    const db = getJsonDb();
    const property = db.properties.find((item) => item.id === propertyId);
    if (!property) throw new Error('Unità non trovata.');
    property.notes = property.notes.filter((note) => note.id !== noteId);
    property.updatedAt = new Date().toISOString();
    saveJsonDb(db);
}

export function updatePropertyVisibility(propertyId: string, field: 'isPublic' | 'addressPublic' | 'phonePublic', value: boolean): void {
    const db = getJsonDb();
    const property = db.properties.find((item) => item.id === propertyId);
    if (!property) throw new Error('Unità non trovata.');
    const formField = field === 'isPublic' ? 'PropertyPublic' : field === 'addressPublic' ? 'PropertyPublicAddress' : 'PropertyPublicPhone';
    property.formData = normalizePropertyFormData({ ...property.formData, [formField]: value });
    property.updatedAt = new Date().toISOString();
    saveJsonDb(db);
}
