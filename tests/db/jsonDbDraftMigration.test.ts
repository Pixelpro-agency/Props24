import { afterEach, describe, expect, it, vi } from 'vitest';

import seedDatabase from '../../src/db/database.json';
import type {
  LocalDatabaseCollectionName,
} from '../../src/db/database.types';
import {
  installJsonDbWindow,
  MemoryStorage,
  uninstallJsonDbWindow,
} from './jsonDbStorageHarness';
import { defaultLeaseValues } from '../../src/landlord/leases/schema/leaseFormSchema';

const ACCOUNT_ID = 'user-001';
const ACCOUNT_KEY = 'props24.localDb.user-001';
const SHARED_KEY = 'props24.localDb';
const SECONDARY_ID = 'user-002';
const SECONDARY_KEY = 'props24.localDb.user-002';

type DraftsExcluded = 'drafts' extends LocalDatabaseCollectionName
  ? false
  : true;
const draftsAreExcludedFromGenericCrud: DraftsExcluded = true;

function v3Database(
  drafts: unknown = {
    tenantForm: null,
    propertyForm: null,
    leaseForm: null,
  },
): Record<string, unknown> {
  const database = structuredClone(seedDatabase) as Record<string, unknown>;
  database.meta = {
    ...(database.meta as Record<string, unknown>),
    schemaVersion: 3,
  };
  database.drafts = drafts;
  return database;
}

async function loadJsonDb(storage: MemoryStorage, accountId = ACCOUNT_ID) {
  installJsonDbWindow(storage);
  vi.resetModules();
  const jsonDb = await import('../../src/db/jsonDb');
  jsonDb.setActiveDatabaseAccount(accountId);
  return jsonDb;
}

afterEach(() => {
  uninstallJsonDbWindow();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('jsonDb draft schema migration', () => {
  it('migra i tre slot v3 preservando payload raw e timestamp lease', async () => {
    const leaseUpdatedAt = '2026-07-20T12:00:00.000Z';
    const tenant = {
      email: 'incompleta',
      unknown: { dataUrl: 'data:image/png;base64,AAA' },
    };
    const property = { PropertyTitle: '', extra: ['raw'] };
    const lease = {
      formData: { partial: true },
      activeTab: 4,
      updatedAt: leaseUpdatedAt,
    };
    const storage = new MemoryStorage({
      [ACCOUNT_KEY]: JSON.stringify(v3Database({
        tenantForm: tenant,
        propertyForm: property,
        leaseForm: lease,
      })),
    });

    const jsonDb = await loadJsonDb(storage);
    const database = jsonDb.getJsonDb();

    expect(draftsAreExcludedFromGenericCrud).toBe(true);
    expect(database.meta.schemaVersion).toBe(4);
    expect(database.drafts).toHaveLength(3);
    expect(database.drafts.map((draft) => ({
      accountId: draft.accountId,
      formType: draft.formType,
      mode: draft.mode,
      entityId: draft.entityId,
      schemaVersion: draft.schemaVersion,
      payload: draft.payload,
    }))).toEqual([
      {
        accountId: ACCOUNT_ID,
        formType: 'tenant',
        mode: 'create',
        entityId: null,
        schemaVersion: 1,
        payload: tenant,
      },
      {
        accountId: ACCOUNT_ID,
        formType: 'property',
        mode: 'create',
        entityId: null,
        schemaVersion: 1,
        payload: property,
      },
      {
        accountId: ACCOUNT_ID,
        formType: 'lease',
        mode: 'create',
        entityId: null,
        schemaVersion: 1,
        payload: lease,
      },
    ]);
    expect(database.drafts[0].createdAt)
      .toBe(database.drafts[0].updatedAt);
    expect(database.drafts[1].createdAt)
      .toBe(database.drafts[1].updatedAt);
    expect(database.drafts[2]).toMatchObject({
      createdAt: leaseUpdatedAt,
      updatedAt: leaseUpdatedAt,
    });
  });

  it('non crea record per slot nulli o assenti', async () => {
    const storage = new MemoryStorage({
      [ACCOUNT_KEY]: JSON.stringify(v3Database({ tenantForm: null })),
    });
    const jsonDb = await loadJsonDb(storage);
    expect(jsonDb.getJsonDb().drafts).toEqual([]);
  });

  it('accetta drafts vuoto e rende la migrazione idempotente', async () => {
    const storage = new MemoryStorage({
      [ACCOUNT_KEY]: JSON.stringify(v3Database({})),
    });
    let jsonDb = await loadJsonDb(storage);
    expect(jsonDb.getJsonDb()).toMatchObject({
      meta: { schemaVersion: 4 },
      drafts: [],
    });
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(1);

    storage.resetOperationLogs();
    uninstallJsonDbWindow();
    vi.resetModules();
    jsonDb = await loadJsonDb(storage);
    expect(jsonDb.getJsonDb().drafts).toEqual([]);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(0);
  });

  it.each([null, 'invalid', 123, true])(
    'rifiuta il contenitore legacy non interpretabile: %s',
    async (drafts) => {
      const raw = JSON.stringify(v3Database(drafts));
      const storage = new MemoryStorage({ [ACCOUNT_KEY]: raw });
      await expect(loadJsonDb(storage)).rejects.toMatchObject({
        name: 'DraftMigrationError',
      });
      expect(storage.getItem(ACCOUNT_KEY)).toBe(raw);
    },
  );

  it('importa standalone solo nel default e rimuove dopo set e verifica', async () => {
    const standalone = { PropertyTitle: '', file: 'data:text/plain;base64,QQ==' };
    const storage = new MemoryStorage({
      [ACCOUNT_KEY]: JSON.stringify(v3Database()),
      property_form_draft: JSON.stringify(standalone),
    });
    const jsonDb = await loadJsonDb(storage);

    expect(jsonDb.getDraft('propertyForm')).toEqual(standalone);
    expect(storage.getItem('property_form_draft')).toBeNull();
    const setIndex = storage.operations.findIndex((item) =>
      item.type === 'set' && item.key === ACCOUNT_KEY);
    const removeIndex = storage.operations.findIndex((item) =>
      item.type === 'remove' && item.key === 'property_form_draft');
    expect(setIndex).toBeGreaterThanOrEqual(0);
    expect(removeIndex).toBeGreaterThan(setIndex);
  });

  it('non importa né elimina standalone negli account secondari', async () => {
    const storage = new MemoryStorage({
      tenant_form_draft: JSON.stringify({ firstName: 'Legacy' }),
    });
    const jsonDb = await loadJsonDb(storage, SECONDARY_ID);
    expect(jsonDb.getJsonDb().drafts).toEqual([]);
    expect(storage.getItem('tenant_form_draft')).not.toBeNull();
    expect(storage.getItem(SECONDARY_KEY)).not.toBeNull();
  });

  it('conserva standalone non valido e conflitto differente', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const embedded = { firstName: 'Embedded' };
    const storage = new MemoryStorage({
      [ACCOUNT_KEY]: JSON.stringify(v3Database({
        tenantForm: embedded,
        propertyForm: null,
        leaseForm: null,
      })),
      tenant_form_draft: JSON.stringify({ firstName: 'Standalone' }),
      property_form_draft: '{invalid',
    });
    const jsonDb = await loadJsonDb(storage);
    expect(jsonDb.getDraft('tenantForm')).toEqual(embedded);
    expect(storage.getItem('tenant_form_draft')).not.toBeNull();
    expect(storage.getItem('property_form_draft')).toBe('{invalid');
    expect(warn).toHaveBeenCalled();
  });

  it('rimuove standalone strutturalmente equivalente dopo verifica', async () => {
    const embedded = {
      firstName: 'Mario',
      address: { city: 'Roma', zip: '00100' },
    };
    const standalone = {
      address: { zip: '00100', city: 'Roma' },
      firstName: 'Mario',
    };
    const storage = new MemoryStorage({
      [ACCOUNT_KEY]: JSON.stringify(v3Database({
        tenantForm: embedded,
        propertyForm: null,
        leaseForm: null,
      })),
      tenant_form_draft: JSON.stringify(standalone),
    });
    const jsonDb = await loadJsonDb(storage);
    expect(jsonDb.getJsonDb().drafts).toHaveLength(1);
    expect(storage.getItem('tenant_form_draft')).toBeNull();
    const setIndex = storage.operations.findIndex((operation) =>
      operation.type === 'set' && operation.key === ACCOUNT_KEY);
    const removeIndex = storage.operations.findIndex((operation) =>
      operation.type === 'remove' && operation.key === 'tenant_form_draft');
    expect(removeIndex).toBeGreaterThan(setIndex);
  });

  it.each([
    ['ordine array', { values: [1, 2] }, { values: [2, 1] }],
    ['valore annidato', { nested: { value: 1 } }, { nested: { value: 2 } }],
  ])('conserva il conflitto per %s', async (_label, embedded, standalone) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const standaloneRaw = JSON.stringify(standalone);
    const storage = new MemoryStorage({
      [ACCOUNT_KEY]: JSON.stringify(v3Database({
        tenantForm: embedded,
        propertyForm: null,
        leaseForm: null,
      })),
      tenant_form_draft: standaloneRaw,
    });
    const jsonDb = await loadJsonDb(storage);
    expect(jsonDb.getJsonDb().drafts).toHaveLength(1);
    expect(jsonDb.getDraft('tenantForm')).toEqual(embedded);
    expect(storage.getItem('tenant_form_draft')).toBe(standaloneRaw);
    expect(warn).toHaveBeenCalledWith(
      '[local-db] conflitto bozza legacy conservato',
      expect.objectContaining({ formType: 'tenant' }),
    );
  });

  it('preserva sorgenti su fallimento di scrittura o verifica', async () => {
    const raw = JSON.stringify(v3Database({
      tenantForm: { firstName: 'Draft' },
    }));
    const writeFailure = new MemoryStorage({ [ACCOUNT_KEY]: raw });
    writeFailure.failNextSet(new Error('write failed'));
    await expect(loadJsonDb(writeFailure)).rejects.toMatchObject({
      name: 'DraftMigrationError',
    });
    expect(writeFailure.getItem(ACCOUNT_KEY)).toBe(raw);

    uninstallJsonDbWindow();
    vi.resetModules();
    const verifyFailure = new MemoryStorage({ [ACCOUNT_KEY]: raw });
    verifyFailure.corruptNextSet('{invalid');
    await expect(loadJsonDb(verifyFailure)).rejects.toMatchObject({
      name: 'DraftMigrationError',
    });
    expect(verifyFailure.getItem(ACCOUNT_KEY)).toBe(raw);
  });

  it.each(['write', 'verify'])(
    'ripristina account assente e conserva le sorgenti dopo errore %s',
    async (failure) => {
      const sharedRaw = JSON.stringify(v3Database({
        tenantForm: { firstName: 'Embedded' },
      }));
      const standaloneRaw = JSON.stringify({ PropertyTitle: 'Standalone' });
      const storage = new MemoryStorage({
        [SHARED_KEY]: sharedRaw,
        property_form_draft: standaloneRaw,
      });
      if (failure === 'write') {
        storage.failNextSet(new Error('write failed'));
      } else {
        storage.corruptNextSet('{invalid');
      }

      await expect(loadJsonDb(storage)).rejects.toMatchObject({
        name: 'DraftMigrationError',
      });
      expect(storage.getItem(ACCOUNT_KEY)).toBeNull();
      expect(storage.getItem(SHARED_KEY)).toBe(sharedRaw);
      expect(storage.getItem('property_form_draft')).toBe(standaloneRaw);
      expect(storage.removeItemCalls).not.toContain(SHARED_KEY);
      expect(storage.removeItemCalls).not.toContain('property_form_draft');
    },
  );

  it.each([
    ['account differente', [{
      id: 'draft-1',
      accountId: 'user-002',
      formType: 'tenant',
      mode: 'create',
      entityId: null,
      payload: {},
      schemaVersion: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }]],
  ])('rifiuta bozze non migrabili: %s', async (_label, drafts) => {
    const raw = JSON.stringify({
      ...v3Database(),
      meta: { ...(v3Database().meta as object), schemaVersion: 4 },
      drafts,
    });
    const storage = new MemoryStorage({ [ACCOUNT_KEY]: raw });
    await expect(loadJsonDb(storage)).rejects.toMatchObject({
      name: 'DraftMigrationError',
    });
    expect(storage.getItem(ACCOUNT_KEY)).toBe(raw);
  });

  it('rifiuta ID, chiavi logiche e schema payload non validi', async () => {
    const base = {
      id: 'draft-1',
      accountId: ACCOUNT_ID,
      formType: 'tenant',
      mode: 'create',
      entityId: null,
      payload: {},
      schemaVersion: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    for (const drafts of [
      [base, { ...base }],
      [base, { ...base, id: 'draft-2' }],
      [{ ...base, schemaVersion: 0 }],
    ]) {
      const raw = JSON.stringify({
        ...v3Database(),
        meta: { ...(v3Database().meta as object), schemaVersion: 4 },
        drafts,
      });
      const storage = new MemoryStorage({ [ACCOUNT_KEY]: raw });
      await expect(loadJsonDb(storage)).rejects.toMatchObject({
        name: 'DraftMigrationError',
      });
      uninstallJsonDbWindow();
      vi.resetModules();
    }
  });

  it('rifiuta record v4 senza payload conservando il database originale', async () => {
    const raw = JSON.stringify({
      ...v3Database(),
      meta: { ...(v3Database().meta as object), schemaVersion: 4 },
      drafts: [{
        id: 'draft-missing-payload',
        accountId: ACCOUNT_ID,
        formType: 'tenant',
        mode: 'create',
        entityId: null,
        schemaVersion: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }],
    });
    const storage = new MemoryStorage({ [ACCOUNT_KEY]: raw });
    await expect(loadJsonDb(storage)).rejects.toMatchObject({
      name: 'DraftMigrationError',
    });
    expect(storage.getItem(ACCOUNT_KEY)).toBe(raw);
  });

  it('accetta payload null in un record v4', async () => {
    const storage = new MemoryStorage({
      [ACCOUNT_KEY]: JSON.stringify({
        ...v3Database(),
        meta: { ...(v3Database().meta as object), schemaVersion: 4 },
        drafts: [{
          id: 'draft-null-payload',
          accountId: ACCOUNT_ID,
          formType: 'tenant',
          mode: 'create',
          entityId: null,
          payload: null,
          schemaVersion: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }],
      }),
    });
    const jsonDb = await loadJsonDb(storage);
    expect(jsonDb.getJsonDb().drafts[0].payload).toBeNull();
  });

  it('rifiuta payload undefined durante saveJsonDb', async () => {
    const storage = new MemoryStorage();
    const jsonDb = await loadJsonDb(storage);
    const database = jsonDb.getJsonDb();
    const raw = storage.getItem(ACCOUNT_KEY);
    // Cast locale per simulare un record runtime corrotto non rappresentabile in JSON.
    (database.drafts as unknown as Array<Record<string, unknown>>).push({
      id: 'draft-undefined-payload',
      accountId: ACCOUNT_ID,
      formType: 'tenant',
      mode: 'create',
      entityId: null,
      payload: undefined,
      schemaVersion: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(() => jsonDb.saveJsonDb(database)).toThrowError(
      expect.objectContaining({ name: 'DraftMigrationError' }),
    );
    expect(storage.getItem(ACCOUNT_KEY)).toBe(raw);
  });

  it('è idempotente e non riscrive un database v4 canonico', async () => {
    const storage = new MemoryStorage({
      [ACCOUNT_KEY]: JSON.stringify(v3Database({
        tenantForm: { firstName: 'Draft' },
        propertyForm: null,
        leaseForm: null,
      })),
    });
    let jsonDb = await loadJsonDb(storage);
    const first = jsonDb.getJsonDb();
    const raw = storage.getItem(ACCOUNT_KEY);
    storage.resetOperationLogs();
    uninstallJsonDbWindow();
    vi.resetModules();
    jsonDb = await loadJsonDb(storage);
    expect(jsonDb.getJsonDb().drafts).toEqual(first.drafts);
    expect(storage.getItem(ACCOUNT_KEY)).toBe(raw);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(0);
  });

  it('mantiene il ponte legacy con cloni, upsert e clear idempotente', async () => {
    const storage = new MemoryStorage({
      [ACCOUNT_KEY]: JSON.stringify({
        ...v3Database(),
        meta: { ...(v3Database().meta as object), schemaVersion: 4 },
        drafts: [],
      }),
    });
    const jsonDb = await loadJsonDb(storage);
    storage.resetOperationLogs();
    expect(jsonDb.getDraft('tenantForm')).toBeNull();
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(0);

    const firstPayload = { firstName: 'One', nested: { value: 1 } };
    jsonDb.setDraft('tenantForm', firstPayload);
    const first = jsonDb.getJsonDb().drafts[0];
    const clone = jsonDb.getDraft('tenantForm') as typeof firstPayload;
    clone.nested.value = 2;
    expect((jsonDb.getDraft('tenantForm') as typeof firstPayload).nested.value)
      .toBe(1);

    jsonDb.setDraft('tenantForm', { firstName: 'Two' });
    const second = jsonDb.getJsonDb().drafts[0];
    expect(jsonDb.getJsonDb().drafts).toHaveLength(1);
    expect(second.id).toBe(first.id);
    expect(second.createdAt).toBe(first.createdAt);
    jsonDb.setDraft('propertyForm', { PropertyTitle: 'Property' });
    expect(jsonDb.getJsonDb().drafts).toHaveLength(2);

    jsonDb.clearDraft('tenantForm');
    const writesAfterClear = storage.writesFor(ACCOUNT_KEY).length;
    expect(jsonDb.getDraft('propertyForm')).toEqual({
      PropertyTitle: 'Property',
    });
    jsonDb.clearDraft('tenantForm');
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writesAfterClear);
    jsonDb.setDraft('propertyForm', null);
    expect(jsonDb.getDraft('propertyForm')).toBeNull();
  });

  it('cancella atomicamente solo la bozza lease durante createLease', async () => {
    const storage = new MemoryStorage();
    const jsonDb = await loadJsonDb(storage);
    const { createLease } = await import('../../src/db/leaseRepository');
    const input = {
      ...defaultLeaseValues,
      PropertyID: 'property-003',
      LeaseType: 'canone_libero_4+4',
      LeaseTenantIds: ['tenant-010'],
      LeaseStartDate: '2035-01-01',
      LeaseEndDate: '2038-12-31',
      LeaseRentHC: 800,
      LeaseMonthlyAmount: 800,
    };
    jsonDb.setDraft('leaseForm', {
      formData: input,
      activeTab: 2,
      updatedAt: '2026-07-20T12:00:00.000Z',
    });
    jsonDb.setDraft('tenantForm', { firstName: 'Preserve' });
    storage.resetOperationLogs();

    createLease(input);

    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(1);
    expect(jsonDb.getDraft('leaseForm')).toBeNull();
    expect(jsonDb.getDraft('tenantForm')).toEqual({
      firstName: 'Preserve',
    });
  });

  it('preserva la bozza lease se il salvataggio di createLease fallisce', async () => {
    const storage = new MemoryStorage();
    const jsonDb = await loadJsonDb(storage);
    const { createLease } = await import('../../src/db/leaseRepository');
    const input = {
      ...defaultLeaseValues,
      PropertyID: 'property-003',
      LeaseType: 'canone_libero_4+4',
      LeaseTenantIds: ['tenant-010'],
      LeaseStartDate: '2035-01-01',
      LeaseEndDate: '2038-12-31',
      LeaseRentHC: 800,
      LeaseMonthlyAmount: 800,
    };
    const draft = {
      formData: input,
      activeTab: 2,
      updatedAt: '2026-07-20T12:00:00.000Z',
    };
    jsonDb.setDraft('leaseForm', draft);
    storage.failNextSet(new Error('write failed'));

    expect(() => createLease(input)).toThrow();
    expect(jsonDb.getDraft('leaseForm')).toEqual(draft);
  });
});
