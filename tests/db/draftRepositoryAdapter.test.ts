import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LocalDatabase } from '../../src/db/database.types';
import type {
  DraftDefinition,
  DraftRecord,
  DraftRepository,
} from '../../src/db/draftRepository.port';
import {
  installJsonDbWindow,
  MemoryStorage,
  uninstallJsonDbWindow,
} from './jsonDbStorageHarness';

const ACCOUNT_ID = 'user-001';
const ACCOUNT_KEY = 'props24.localDb.user-001';
const SECOND_ACCOUNT_ID = 'user-002';
const SECOND_ACCOUNT_KEY = 'props24.localDb.user-002';
const NOW = '2026-07-28T09:00:00.000Z';
const EARLIER = '2026-01-01T00:00:00.000Z';

type Payload = { value: string; nested?: { count: number } };

const tenantDefinition: DraftDefinition<Payload> = {
  formType: 'tenant',
  schemaVersion: 2,
  parse(payload, schemaVersion) {
    if (
      typeof payload !== 'object'
      || payload === null
      || typeof (payload as { value?: unknown }).value !== 'string'
      || schemaVersion < 1
    ) {
      throw new TypeError('Payload non valido');
    }
    return structuredClone(payload) as Payload;
  },
};

const propertyDefinition: DraftDefinition<Payload> = {
  ...tenantDefinition,
  formType: 'property',
};

function draft(overrides: Partial<DraftRecord<unknown>> = {}): DraftRecord<unknown> {
  return {
    id: 'draft-tenant-create',
    accountId: ACCOUNT_ID,
    formType: 'tenant',
    mode: 'create',
    entityId: null,
    payload: { value: 'original', nested: { count: 1 } },
    schemaVersion: 1,
    createdAt: EARLIER,
    updatedAt: EARLIER,
    ...overrides,
  };
}

function database(drafts: DraftRecord<unknown>[] = []): LocalDatabase {
  return {
    meta: {
      schemaVersion: 4,
      seedVersion: 1,
      createdAt: EARLIER,
      updatedAt: EARLIER,
      source: 'migration-v2',
    },
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
    settings: {},
    userProfile: {},
    drafts,
  };
}

async function arrange(
  first = database(),
  second?: LocalDatabase,
) {
  const initial: Record<string, string> = {
    [ACCOUNT_KEY]: JSON.stringify(first),
  };
  if (second) initial[SECOND_ACCOUNT_KEY] = JSON.stringify(second);
  const storage = new MemoryStorage(initial);
  installJsonDbWindow(storage);
  vi.resetModules();
  const jsonDb = await import('../../src/db/jsonDb');
  jsonDb.setActiveDatabaseAccount(ACCOUNT_ID);
  const { createLocalDraftRepository } = await import(
    '../../src/db/localDraftRepository'
  );
  return {
    storage,
    jsonDb,
    createLocalDraftRepository,
    repository: createLocalDraftRepository({ accountId: ACCOUNT_ID }),
  };
}

function stored(storage: MemoryStorage, key = ACCOUNT_KEY): LocalDatabase {
  const raw = storage.getItem(key);
  if (!raw) throw new Error(`Database mancante: ${key}`);
  return JSON.parse(raw) as LocalDatabase;
}

describe('local draft repository adapter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    uninstallJsonDbWindow();
    vi.useRealTimers();
    vi.resetModules();
  });

  it('implementa soltanto il port e la costruzione non scrive', async () => {
    const { repository, storage } = await arrange();
    const assignable: DraftRepository = repository;
    expect(Object.keys(assignable).sort()).toEqual([
      'delete',
      'get',
      'list',
      'save',
    ]);
    expect('subscribe' in repository).toBe(false);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(0);
  });

  it('rifiuta account non valido senza accedere allo storage', async () => {
    const { createLocalDraftRepository, storage } = await arrange();
    storage.resetOperationLogs();
    expect(() => createLocalDraftRepository({ accountId: ' invalid ' }))
      .toThrowError(expect.objectContaining({ name: 'DraftStorageError' }));
    expect(storage.operations).toEqual([]);
  });

  it('get usa parser e versione, clona e non scrive', async () => {
    const source = draft();
    const { repository, storage } = await arrange(database([source]));
    const result = await repository.get(tenantDefinition, { mode: 'create' });
    expect(result).toMatchObject({
      id: source.id,
      schemaVersion: 1,
      payload: source.payload,
    });
    expect(result).not.toBe(source);
    expect(result?.payload).not.toBe(source.payload);
    if (result) result.payload.nested!.count = 99;
    await expect(repository.get(tenantDefinition, { mode: 'create' }))
      .resolves.toMatchObject({ payload: { nested: { count: 1 } } });
    await expect(repository.get(tenantDefinition, {
      mode: 'edit',
      entityId: 'missing',
    })).resolves.toBeNull();
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(0);
  });

  it('list preserva ordine, applica tutti i filtri e restituisce cloni', async () => {
    const records = [
      draft(),
      draft({
        id: 'draft-tenant-edit-one',
        mode: 'edit',
        entityId: 'tenant-1',
      }),
      draft({
        id: 'draft-tenant-edit-two',
        mode: 'edit',
        entityId: 'tenant-2',
      }),
      draft({
        id: 'draft-property-create',
        formType: 'property',
      }),
    ];
    const { repository, storage } = await arrange(database(records));
    const all = await repository.list();
    expect(all.map(({ id }) => id)).toEqual(records.map(({ id }) => id));
    expect((await repository.list({ formType: 'property' }))).toHaveLength(1);
    expect((await repository.list({ mode: 'edit' }))).toHaveLength(2);
    expect((await repository.list({ entityId: null }))).toHaveLength(2);
    expect((await repository.list({ entityId: 'tenant-1' }))[0].id)
      .toBe('draft-tenant-edit-one');
    expect(await repository.list({ entityId: undefined })).toHaveLength(4);
    expect(all).not.toBe(records);
    expect(all[0]).not.toBe(records[0]);
    expect(all[0].payload).not.toBe(records[0].payload);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(0);
  });

  it('save crea e rilegge con una write senza mutare input', async () => {
    const { repository, storage } = await arrange();
    const payload = { value: 'created', nested: { count: 2 } };
    const input = { mode: 'create' as const, payload };
    const before = structuredClone(input);
    const saved = await repository.save(tenantDefinition, input);
    expect(saved).toMatchObject({
      accountId: ACCOUNT_ID,
      formType: 'tenant',
      schemaVersion: 2,
      createdAt: NOW,
      updatedAt: NOW,
      payload,
    });
    await expect(repository.get(tenantDefinition, { mode: 'create' }))
      .resolves.toEqual(saved);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(1);
    expect(input).toEqual(before);
    expect(saved.payload).not.toBe(payload);
  });

  it('save aggiorna senza duplicare e separa chiavi, entità e form', async () => {
    const { repository, storage } = await arrange();
    const first = await repository.save(tenantDefinition, {
      mode: 'create',
      payload: { value: 'first' },
    });
    vi.setSystemTime(new Date('2026-07-28T10:00:00.000Z'));
    const second = await repository.save(tenantDefinition, {
      mode: 'create',
      payload: { value: 'second' },
    });
    expect(second.id).toBe(first.id);
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.updatedAt).not.toBe(first.updatedAt);
    await repository.save(tenantDefinition, {
      mode: 'edit',
      entityId: 'tenant-1',
      payload: { value: 'edit-one' },
    });
    await repository.save(tenantDefinition, {
      mode: 'edit',
      entityId: 'tenant-2',
      payload: { value: 'edit-two' },
    });
    await repository.save(propertyDefinition, {
      mode: 'create',
      payload: { value: 'property' },
    });
    expect(await repository.list()).toHaveLength(4);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(5);
  });

  it('delete elimina solo la chiave esatta ed è idempotente', async () => {
    const records = [
      draft(),
      draft({
        id: 'draft-edit',
        mode: 'edit',
        entityId: 'tenant-1',
      }),
      draft({
        id: 'draft-property',
        formType: 'property',
      }),
    ];
    const { repository, storage } = await arrange(database(records));
    await expect(repository.delete({
      formType: 'tenant',
      mode: 'edit',
      entityId: 'tenant-1',
    })).resolves.toBe(true);
    expect((await repository.list()).map(({ id }) => id)).toEqual([
      'draft-tenant-create',
      'draft-property',
    ]);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(1);
    await expect(repository.delete({
      formType: 'tenant',
      mode: 'edit',
      entityId: 'tenant-1',
    })).resolves.toBe(false);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(1);
  });

  it('mantiene isolamento logico e fisico dopo cambio o rimozione account globale', async () => {
    const { createLocalDraftRepository, jsonDb, storage, repository: repositoryA } =
      await arrange(database(), database());
    jsonDb.setActiveDatabaseAccount(SECOND_ACCOUNT_ID);
    const repositoryB = createLocalDraftRepository({
      accountId: SECOND_ACCOUNT_ID,
    });
    await repositoryA.save(tenantDefinition, {
      mode: 'create',
      payload: { value: 'account-a' },
    });
    await repositoryB.save(tenantDefinition, {
      mode: 'create',
      payload: { value: 'account-b' },
    });
    jsonDb.setActiveDatabaseAccount(null);
    await expect(repositoryA.get(tenantDefinition, { mode: 'create' }))
      .resolves.toMatchObject({ payload: { value: 'account-a' } });
    await expect(repositoryB.get(tenantDefinition, { mode: 'create' }))
      .resolves.toMatchObject({ payload: { value: 'account-b' } });
    expect(stored(storage).drafts[0].accountId).toBe(ACCOUNT_ID);
    expect(stored(storage, SECOND_ACCOUNT_KEY).drafts[0].accountId)
      .toBe(SECOND_ACCOUNT_ID);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(1);
    expect(storage.writesFor(SECOND_ACCOUNT_KEY)).toHaveLength(1);
  });

  it.each([
    ['create con entità', tenantDefinition, {
      mode: 'create' as const,
      entityId: 'tenant-1',
      payload: { value: 'x' },
    }, 'DraftInvalidKeyError'],
    ['edit senza entità', tenantDefinition, {
      mode: 'edit' as const,
      payload: { value: 'x' },
    }, 'DraftInvalidKeyError'],
    ['payload non valido', tenantDefinition, {
      mode: 'create' as const,
      payload: { value: 1 } as unknown as Payload,
    }, 'DraftPayloadValidationError'],
    ['schema non valido', { ...tenantDefinition, schemaVersion: 0 }, {
      mode: 'create' as const,
      payload: { value: 'x' },
    }, 'DraftPayloadValidationError'],
  ])('preserva errore puro senza scrivere: %s', async (
    _label,
    definition,
    input,
    errorName,
  ) => {
    const { repository, storage } = await arrange();
    await expect(repository.save(definition, input)).rejects.toMatchObject({
      name: errorName,
    });
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(0);
  });

  it('preserva errore di dominio per database bozze corrotto', async () => {
    const corrupted = draft({ id: '' });
    const { repository, storage } = await arrange();
    storage.setItem(ACCOUNT_KEY, JSON.stringify(database([corrupted])));
    const event = new Event('storage');
    Object.defineProperty(event, 'key', { value: ACCOUNT_KEY });
    window.dispatchEvent(event);
    storage.resetOperationLogs();
    await expect(repository.list()).rejects.toMatchObject({
      name: 'DraftMigrationError',
    });
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(0);
  });

  it.each([
    ['quota', () => new DOMException('quota', 'QuotaExceededError'),
      'DraftStorageQuotaError'],
    ['generico', () => new Error('write failed'), 'DraftStorageError'],
  ])('traduce errore storage %s conservando causa e database', async (
    _label,
    createError,
    expectedName,
  ) => {
    const { repository, storage } = await arrange();
    const raw = storage.getItem(ACCOUNT_KEY);
    const error = createError();
    storage.failNextSet(error);
    const rejection = repository.save(tenantDefinition, {
      mode: 'create',
      payload: { value: 'new' },
    });
    const caught = await rejection.catch((caughtError: unknown) => caughtError);
    expect(caught).toMatchObject({ name: expectedName });
    if (expectedName === 'DraftStorageQuotaError') {
      expect(caught).toMatchObject({
        cause: { name: 'LocalStorageQuotaError', cause: error },
      });
    } else {
      expect(caught).toMatchObject({ cause: error });
    }
    expect(storage.getItem(ACCOUNT_KEY)).toBe(raw);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(0);
  });

  it('delete non restituisce true quando la scrittura fallisce', async () => {
    const { repository, storage } = await arrange(database([draft()]));
    const raw = storage.getItem(ACCOUNT_KEY);
    const error = new Error('delete failed');
    storage.failNextSet(error);
    await expect(repository.delete({
      formType: 'tenant',
      mode: 'create',
      entityId: null,
    })).rejects.toMatchObject({
      name: 'DraftStorageError',
      cause: error,
    });
    expect(storage.getItem(ACCOUNT_KEY)).toBe(raw);
  });
});
