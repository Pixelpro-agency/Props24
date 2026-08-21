import { describe, expect, it } from 'vitest';

import { defaultPropertyValues } from '../../src/components/property-form/schema';
import type { BuildingRecord, LocalDatabase, PropertyRecord } from '../../src/db/database.types';
import { assertDatabaseIntegrity, DatabaseIntegrityError, validateDatabaseRelations } from '../../src/db/databaseValidation';

const NOW = '2026-08-21T00:00:00.000Z';

function building(overrides: Partial<BuildingRecord> = {}): BuildingRecord {
  return {
    id: 'building-1', createdAt: NOW, updatedAt: NOW, archived: false, identifier: 'Palazzo Centro', color: '', address: 'Via Roma 10',
    address2: '', city: 'Milano', postalCode: '20100', county: '', state: '', country: 'IT', size: null, constructionYear: null,
    description: '', privateNote: '', features: [], acquisitionDate: '', purchasePrice: null, acquisitionCosts: null, imu: null, unitsCount: 0,
    ...overrides,
  };
}

function property(buildingId: string): PropertyRecord {
  return {
    id: 'property-1', createdAt: NOW, updatedAt: NOW, archived: false,
    formData: { ...defaultPropertyValues, PropertyTitle: 'Unità 1', PropertyAddress: 'Via Roma 10', PropertyCity: 'Milano', PropertyPostalCode: '20100', PropertyCountry: 'IT' },
    relations: { buildingId, tenantIds: [], leaseIds: [] }, notes: [], activities: [],
  };
}

function database(buildings: BuildingRecord[] = [building()], properties: PropertyRecord[] = []): LocalDatabase {
  return {
    meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' }, properties, buildings,
    tenants: [], leases: [], payments: [], contacts: [], documents: [], reservations: [], catalogs: [], inventory: [], maintenance: [],
    tasks: [], notes: [], messages: [], candidates: [], settings: {}, userProfile: {}, drafts: [],
  };
}

function codes(db: LocalDatabase): string[] {
  return validateDatabaseRelations(db).filter((item) => item.collection === 'buildings' && item.severity === 'error').map((item) => item.code);
}

describe('building database integrity', () => {
  it('accetta un record valido', () => expect(codes(database())).toEqual([]));

  it('rileva identificativo mancante e duplicato', () => {
    expect(codes(database([building({ identifier: ' ' })]))).toContain('BUILDING_IDENTIFIER_REQUIRED');
    expect(codes(database([building({ id: 'a' }), building({ id: 'b', identifier: ' PALAZZO  CENTRO ', address: 'Via Verdi 2' })]))).toContain('BUILDING_IDENTIFIER_DUPLICATE');
  });

  it.each(['address', 'city', 'postalCode'] as const)('rileva %s mancante', (field) => {
    expect(codes(database([building({ [field]: '' })]))).toContain({ address: 'ADDRESS_REQUIRED', city: 'CITY_REQUIRED', postalCode: 'POSTAL_CODE_REQUIRED' }[field]);
  });

  it('rileva country mancante', () => expect(codes(database([building({ country: '' })]))).toContain('BUILDING_COUNTRY_REQUIRED'));

  it('rileva location duplicate ma distingue i suffissi civici', () => {
    expect(codes(database([building({ id: 'a' }), building({ id: 'b', identifier: 'Altro', address2: 'Scala B' })]))).toContain('BUILDING_LOCATION_DUPLICATE');
    expect(codes(database([building({ id: 'a' }), building({ id: 'b', identifier: 'Altro', address: 'Via Roma 10 bis' })]))).not.toContain('BUILDING_LOCATION_DUPLICATE');
  });

  it('rileva unitsCount fuori sincronia senza mutarlo', () => {
    const record = building({ unitsCount: 5 });
    expect(codes(database([record], [property(record.id)]))).toContain('BUILDING_UNITS_COUNT_OUT_OF_SYNC');
    expect(record.unitsCount).toBe(5);
    expect(codes(database([building({ unitsCount: 1 })], [property('building-1')]))).not.toContain('BUILDING_UNITS_COUNT_OUT_OF_SYNC');
  });

  it('assertDatabaseIntegrity espone la issue Building', () => {
    const db = database([building({ identifier: '' })]);
    expect(() => assertDatabaseIntegrity(db)).toThrow(DatabaseIntegrityError);
    try { assertDatabaseIntegrity(db); } catch (error) {
      expect((error as DatabaseIntegrityError).issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'BUILDING_IDENTIFIER_REQUIRED', recordId: 'building-1' })]));
    }
  });
});
