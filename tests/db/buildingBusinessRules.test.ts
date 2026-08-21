import { describe, expect, it } from 'vitest';

import type { BuildingRecord, LocalDatabase } from '../../src/db/database.types';
import { assertUniqueBuildingIdentifier, assertUniqueBuildingLocation, findBuildingByIdentifier, findBuildingByLocation, normalizeBuildingIdentifier, normalizeBuildingLocationKey } from '../../src/db/businessRules';
import { DuplicateBuildingIdentifierError, DuplicateBuildingLocationError } from '../../src/db/databaseErrors';

const NOW = '2026-08-21T00:00:00.000Z';

function building(overrides: Partial<BuildingRecord> = {}): BuildingRecord {
  return {
    id: 'building-1', createdAt: NOW, updatedAt: NOW, archived: false, identifier: 'Palazzo Centro', color: '',
    address: 'Via Roma 10', address2: '', city: 'Milano', postalCode: '20100', county: 'MI', state: 'Lombardia', country: 'IT',
    size: null, constructionYear: null, description: '', privateNote: '', features: [], acquisitionDate: '', purchasePrice: null,
    acquisitionCosts: null, imu: null, unitsCount: 0, ...overrides,
  };
}

function database(buildings: BuildingRecord[] = []): LocalDatabase {
  return {
    meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' },
    properties: [], buildings, tenants: [], leases: [], payments: [], contacts: [], documents: [], reservations: [], catalogs: [],
    inventory: [], maintenance: [], tasks: [], notes: [], messages: [], candidates: [], settings: {}, userProfile: {}, drafts: [],
  };
}

describe('building business rules', () => {
  it('normalizza gli identificativi', () => {
    expect(normalizeBuildingIdentifier('  Palazzo Centro  ')).toBe('palazzo centro');
    expect(normalizeBuildingIdentifier('PALAZZO    CENTRO')).toBe('palazzo centro');
    expect(normalizeBuildingIdentifier('   ')).toBe('');
  });

  it('trova e blocca identificativi duplicati, inclusi archiviati, con esclusione edit', () => {
    const archived = building({ id: 'archived', archived: true });
    const db = database([archived]);
    expect(findBuildingByIdentifier(db, ' PALAZZO  CENTRO ')).toBe(archived);
    expect(findBuildingByIdentifier(db, 'Altro')).toBeNull();
    expect(findBuildingByIdentifier(db, '')).toBeNull();
    expect(findBuildingByIdentifier(db, archived.identifier, archived.id)).toBeNull();
    expect(() => assertUniqueBuildingIdentifier(db, 'palazzo centro')).toThrow(DuplicateBuildingIdentifierError);
    try { assertUniqueBuildingIdentifier(db, 'palazzo centro'); } catch (error) {
      expect(error).toMatchObject({ identifier: 'palazzo centro', existingBuildingId: 'archived' });
    }
  });

  it('mantiene database separati indipendenti', () => {
    expect(findBuildingByIdentifier(database([building()]), 'Palazzo Centro')).not.toBeNull();
    expect(findBuildingByIdentifier(database(), 'Palazzo Centro')).toBeNull();
  });

  it('normalizza la location usando solo address, city, postalCode e country', () => {
    const first = building({ address: '  VIA  Roma 10 ', city: ' MILANO ', postalCode: '20 100', country: ' it ', address2: 'Scala A' });
    const second = building({ address: 'via roma 10', city: 'milano', postalCode: '20100', country: 'IT', address2: 'Interno 9', county: 'XX', state: 'Altro' });
    expect(normalizeBuildingLocationKey(first)).toBe('via roma 10|milano|20100|IT');
    expect(normalizeBuildingLocationKey(second)).toBe(normalizeBuildingLocationKey(first));
  });

  it('mantiene distinti i suffissi civici e restituisce vuoto per location incomplete', () => {
    const keys = ['Via Roma 10', 'Via Roma 10 bis', 'Via Roma 10 ter'].map((address) => normalizeBuildingLocationKey(building({ address })));
    expect(new Set(keys).size).toBe(3);
    for (const field of ['address', 'city', 'postalCode', 'country'] as const) expect(normalizeBuildingLocationKey(building({ [field]: '' }))).toBe('');
  });

  it('trova e blocca location duplicate con archiviati, esclusione e account separati', () => {
    const archived = building({ id: 'archived', archived: true });
    const db = database([archived]);
    expect(findBuildingByLocation(db, building({ address2: 'Scala B' }))).toBe(archived);
    expect(findBuildingByLocation(db, building({ address: 'Via Roma 10 bis' }))).toBeNull();
    expect(findBuildingByLocation(db, archived, archived.id)).toBeNull();
    expect(findBuildingByLocation(database(), archived)).toBeNull();
    expect(() => assertUniqueBuildingLocation(db, archived)).toThrow(DuplicateBuildingLocationError);
    try { assertUniqueBuildingLocation(db, archived); } catch (error) { expect(error).toMatchObject({ existingBuildingId: 'archived' }); }
  });
});
