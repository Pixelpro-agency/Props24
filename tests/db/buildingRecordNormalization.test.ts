import { afterEach, describe, expect, it, vi } from 'vitest';

import seedDatabase from '../../src/db/database.json';
import { defaultPropertyValues } from '../../src/components/property-form/schema';
import type { BuildingRecord, LocalDatabase, PropertyRecord } from '../../src/db/database.types';
import {
  installJsonDbWindow,
  MemoryStorage,
  uninstallJsonDbWindow,
} from './jsonDbStorageHarness';

const ACCOUNT_ID = 'user-001';
const ACCOUNT_KEY = 'props24.localDb.user-001';
const CREATED_AT = '2020-01-01T10:00:00.000Z';
const UPDATED_AT = '2021-02-03T11:30:00.000Z';

function storedDatabase(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const database = structuredClone(seedDatabase) as Record<string, unknown>;
  return {
    ...database,
    meta: {
      ...(database.meta as Record<string, unknown>),
      schemaVersion: 4,
    },
    drafts: [{
      id: 'draft-building',
      accountId: ACCOUNT_ID,
      formType: 'building',
      mode: 'create',
      entityId: null,
      payload: { identifier: 'Bozza preservata' },
      schemaVersion: 1,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    }],
    properties: [],
    buildings: [],
    tenants: [],
    leases: [],
    payments: [],
    contacts: [],
    documents: [],
    reservations: [],
    catalogs: [],
    inventory: [],
    maintenance: [],
    tasks: [],
    notes: [],
    messages: [],
    candidates: [],
    ...overrides,
  };
}

async function loadJsonDb(storage: MemoryStorage) {
  installJsonDbWindow(storage);
  vi.resetModules();
  const jsonDb = await import('../../src/db/jsonDb');
  jsonDb.setActiveDatabaseAccount(ACCOUNT_ID);
  return jsonDb;
}

afterEach(() => {
  uninstallJsonDbWindow();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('BuildingRecord normalization', () => {
  it('normalizza un edificio legacy senza perdere identità, timestamp e dati utili', async () => {
    const storage = new MemoryStorage({
      [ACCOUNT_KEY]: JSON.stringify(storedDatabase({
        buildings: [{
          id: 'building-legacy',
          createdAt: CREATED_AT,
          updatedAt: UPDATED_AT,
          status: 'archived',
          name: 'Edificio legacy',
          address: 'Via Roma 10',
          city: 'Milano',
          postalCode: '20100',
          county: 'MI',
          state: 'Lombardia',
          country: 'IT',
          size: 850,
          unitsCount: 99,
          description: 'Descrizione preservata',
        }],
      })),
    });

    const jsonDb = await loadJsonDb(storage);
    const database = jsonDb.createJsonDbAccountScope(ACCOUNT_ID).getDatabase();

    expect(database.buildings).toEqual([{
      id: 'building-legacy',
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      archived: true,
      identifier: 'Edificio legacy',
      color: '',
      address: 'Via Roma 10',
      address2: '',
      city: 'Milano',
      postalCode: '20100',
      county: 'MI',
      state: 'Lombardia',
      country: 'IT',
      size: 850,
      constructionYear: null,
      description: 'Descrizione preservata',
      privateNote: '',
      features: [],
      acquisitionDate: '',
      purchasePrice: null,
      acquisitionCosts: null,
      imu: null,
      unitsCount: 0,
    }]);
    expect(database.meta.schemaVersion).toBe(4);
    expect(database.drafts).toHaveLength(1);
  });

  it('preserva il record canonico nel round-trip fisico e deriva unitsCount dalle unità', async () => {
    const storage = new MemoryStorage({
      [ACCOUNT_KEY]: JSON.stringify(storedDatabase()),
    });
    const jsonDb = await loadJsonDb(storage);
    const scope = jsonDb.createJsonDbAccountScope(ACCOUNT_ID);
    const database = scope.getDatabase();
    const property: PropertyRecord = {
      id: 'property-linked',
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      archived: false,
      formData: {
        ...defaultPropertyValues,
        PropertyTitle: 'Unità collegata',
        PropertyAddress: 'Via Verdi 12',
        PropertyCity: 'Milano',
        PropertyPostalCode: '20100',
        PropertyCountry: 'IT',
      },
      relations: {
        buildingId: 'building-canonical',
        tenantIds: [],
        leaseIds: [],
      },
      notes: [],
      activities: [],
    };

    const building: BuildingRecord = {
      id: 'building-canonical',
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      archived: false,
      identifier: 'Palazzo Centro',
      color: '#123456',
      address: 'Via Verdi 12',
      address2: 'Corte interna',
      city: 'Milano',
      postalCode: '20100',
      county: 'MI',
      state: 'Lombardia',
      country: 'IT',
      size: 1250.5,
      constructionYear: 1987,
      description: 'Edificio principale',
      privateNote: 'Nota riservata',
      features: ['Ascensore', 'Fibra ottica'],
      acquisitionDate: '31/12/2020',
      purchasePrice: 1_250_000,
      acquisitionCosts: 42_500.25,
      imu: 3_250,
      unitsCount: 42,
    };

    const saved = scope.saveDatabase({
      ...database,
      buildings: [building],
      properties: [property],
    });
    const reread = scope.getDatabase();
    const expected = {
      ...building,
      acquisitionDate: '2020-12-31',
      unitsCount: 1,
    };

    expect(saved.buildings[0]).toEqual(expected);
    expect(reread.buildings[0]).toEqual(expected);
    expect(reread.meta.schemaVersion).toBe(4);
    expect(reread.drafts).toEqual(database.drafts);

    const persisted = JSON.parse(storage.getItem(ACCOUNT_KEY) ?? '{}') as LocalDatabase;
    expect(persisted.buildings[0]).toEqual(expected);
    expect(persisted.buildings[0]).toHaveProperty('identifier', 'Palazzo Centro');
    expect(persisted.buildings[0]).not.toHaveProperty('name');
  });

  it('normalizza numeri, date e features senza inventare valori', async () => {
    const storage = new MemoryStorage({
      [ACCOUNT_KEY]: JSON.stringify(storedDatabase({
        buildings: [
          {
            id: 'building-valid-date',
            identifier: 'Data ISO',
            size: 100,
            constructionYear: Number.POSITIVE_INFINITY,
            purchasePrice: '150000',
            acquisitionCosts: Number.NaN,
            imu: 500,
            acquisitionDate: '2020-12-31',
            features: ['Ascensore', '', 123, 'Ascensore', 'Allarme'],
          },
          {
            id: 'building-invalid-date',
            identifier: 'Data non valida',
            acquisitionDate: '31/02/2020',
          },
        ],
      })),
    });

    const jsonDb = await loadJsonDb(storage);
    const [valid, invalid] = jsonDb.createJsonDbAccountScope(ACCOUNT_ID).getDatabase().buildings;

    expect(valid).toMatchObject({
      size: 100,
      constructionYear: null,
      purchasePrice: null,
      acquisitionCosts: null,
      imu: 500,
      acquisitionDate: '2020-12-31',
      features: ['Ascensore', 'Allarme'],
    });
    expect(invalid.acquisitionDate).toBe('');
  });
});
