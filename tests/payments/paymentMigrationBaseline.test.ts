import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import seedDatabase from '../../src/db/database.json';
import type { LocalDatabase, PaymentRecord } from '../../src/db/database.types';
import {
  MemoryStorage,
  installJsonDbWindow,
  uninstallJsonDbWindow,
} from '../db/jsonDbStorageHarness';

const ACCOUNT_ID = 'user-001';
const ACCOUNT_KEY = 'props24.localDb.user-001';
const SHARED_KEY = 'props24.localDb';
const LEGACY_KEYS = [
  SHARED_KEY,
  'rentila.localDb.v3',
  'rentila.localDb.v2',
  'gestionale.jsonDb.v1',
  'tenant_form_draft',
  'property_form_draft',
] as const;
const REFERENCE_DATE = '2026-06-15';

type RawLegacyDatabase = Omit<LocalDatabase, 'meta' | 'payments'> & {
  meta: Record<string, unknown>;
  payments: Array<Record<string, unknown>>;
};

function createLegacyDatabase(): RawLegacyDatabase {
  const database = structuredClone(seedDatabase) as unknown as RawLegacyDatabase;
  database.meta.schemaVersion = 2;
  return database;
}

function findHistoricalPayment(database: RawLegacyDatabase): Record<string, unknown> {
  const payment = database.payments.find((candidate) => {
    if (
      typeof candidate.leaseId !== 'string'
      || typeof candidate.propertyId !== 'string'
      || typeof candidate.tenantId !== 'string'
      || typeof candidate.dueDate !== 'string'
      || candidate.dueDate >= REFERENCE_DATE
    ) return false;
    const lease = database.leases.find((item) => item.id === candidate.leaseId);
    return Boolean(
      lease
      && lease.propertyId === candidate.propertyId
      && lease.tenantIds.includes(candidate.tenantId)
      && candidate.dueDate >= lease.startDate
      && candidate.dueDate <= lease.endDate,
    );
  });
  if (!payment) throw new Error('Nessuna rata storica seed valida trovata.');
  return payment;
}

function manualPayment(
  database: RawLegacyDatabase,
  id: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const historical = findHistoricalPayment(database);
  return {
    ...historical,
    id,
    source: 'manual',
    category: 'other',
    status: 'paid',
    paidDate: historical.dueDate,
    confirmation: null,
    receiptNumber: null,
    ...overrides,
  };
}

function syntheticCollection(database: RawLegacyDatabase, customGuard = false) {
  const historical = findHistoricalPayment(database);
  return Array.from({ length: 13 }, (_, index) => {
    const month = String((index % 12) + 1).padStart(2, '0');
    return manualPayment(
      database,
      customGuard && index === 12
        ? 'legacy-custom-guard'
        : `payment-lease-legacy${String(index + 1).padStart(2, '0')}-2025-${month}`,
      {
        tenantId: index === 0 ? null : historical.tenantId,
        dueDate: historical.dueDate,
        paidDate: historical.dueDate,
      },
    );
  });
}

async function freshJsonDb() {
  vi.resetModules();
  return import('../../src/db/jsonDb');
}

async function migrate(storage: MemoryStorage) {
  installJsonDbWindow(storage);
  const jsonDb = await freshJsonDb();
  jsonDb.setActiveDatabaseAccount(ACCOUNT_ID);
  expect(jsonDb.getAccountDatabaseKey(ACCOUNT_ID)).toBe(ACCOUNT_KEY);
  return { jsonDb, database: jsonDb.getJsonDb() };
}

function paymentById(database: LocalDatabase, id: string): PaymentRecord {
  const payment = database.payments.find((item) => item.id === id);
  if (!payment) throw new Error(`Pagamento non trovato: ${id}`);
  return payment;
}

function sharedStorage(database: RawLegacyDatabase): MemoryStorage {
  return new MemoryStorage({ [SHARED_KEY]: JSON.stringify(database) });
}

describe('legacy payment migration baseline before D2C', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    uninstallJsonDbWindow();
    vi.useRealTimers();
    vi.resetModules();
  });

  it('preserves legacy payments not classified as unreliable', async () => {
    const raw = createLegacyDatabase();
    raw.payments = [manualPayment(raw, 'legacy-payment-preserved')];
    const original = structuredClone(raw);

    const { database } = await migrate(sharedStorage(raw));
    const preserved = paymentById(database, 'legacy-payment-preserved');

    expect(preserved).toMatchObject({
      status: 'paid',
      paidDate: preserved.dueDate,
      confirmation: null,
      receiptNumber: null,
    });
    expect(database.payments.some((item) => item.id.startsWith('payment-migrated-expense-'))).toBe(false);
    expect(raw).toEqual(original);
  });

  it('documents current synthetic paid income and expenses for an empty collection', async () => {
    const raw = createLegacyDatabase();
    raw.payments = [];

    const { database } = await migrate(sharedStorage(raw));
    const paidRent = database.payments.find((item) => (
      item.id.startsWith('payment-migrated-')
      && !item.id.startsWith('payment-migrated-expense-')
      && item.status === 'paid'
    ));
    const paidExpense = database.payments.find((item) => (
      item.id.startsWith('payment-migrated-expense-') && item.status === 'paid'
    ));

    expect(paidRent).toMatchObject({ confirmation: null, receiptNumber: null });
    expect(paidRent?.paidDate).toBeTruthy();
    expect(paidExpense).toMatchObject({ confirmation: null, receiptNumber: null });
    expect(paidExpense?.paidDate).toBeTruthy();
  });

  it('documents that one anomaly replaces all thirteen synthetic-shaped records', async () => {
    const raw = createLegacyDatabase();
    const originals = syntheticCollection(raw);
    raw.payments = originals;

    const { database } = await migrate(sharedStorage(raw));
    const ids = new Set(database.payments.map((item) => item.id));

    originals.forEach((item) => expect(ids.has(String(item.id))).toBe(false));
    expect(database.payments.some((item) => /^payment-migrated-\d{3}$/.test(item.id))).toBe(true);
    expect(database.payments.some((item) => item.id.startsWith('payment-migrated-expense-'))).toBe(true);
  });

  it('documents that one non-synthetic ID prevents integral replacement', async () => {
    const raw = createLegacyDatabase();
    raw.payments = syntheticCollection(raw, true);

    const { database } = await migrate(sharedStorage(raw));

    expect(paymentById(database, 'legacy-custom-guard')).toBeDefined();
    expect(database.payments.some((item) => item.id.startsWith('payment-lease-legacy'))).toBe(true);
    expect(database.payments.some((item) => item.id.startsWith('payment-migrated-expense-'))).toBe(false);
  });

  it('writes the account database before removing every observable legacy key', async () => {
    const raw = createLegacyDatabase();
    raw.payments = [manualPayment(raw, 'legacy-payment-order')];
    const storage = new MemoryStorage(Object.fromEntries(
      LEGACY_KEYS.map((key) => [key, key === SHARED_KEY ? JSON.stringify(raw) : 'placeholder']),
    ));

    await migrate(storage);

    expect(storage.getItem(ACCOUNT_KEY)).not.toBeNull();
    LEGACY_KEYS.forEach((key) => expect(storage.getItem(key)).toBeNull());
    const accountWrite = storage.operations.findIndex((operation) => (
      operation.type === 'set' && operation.key === ACCOUNT_KEY
    ));
    const removals = storage.operations
      .map((operation, index) => ({ operation, index }))
      .filter(({ operation }) => operation.type === 'remove' && LEGACY_KEYS.includes(operation.key));
    expect(accountWrite).toBeGreaterThanOrEqual(0);
    expect(removals.length).toBe(LEGACY_KEYS.length);
    removals.forEach(({ index }) => expect(index).toBeGreaterThan(accountWrite));
    expect(storage.removeItemCalls).not.toContain(ACCOUNT_KEY);
  });

  it('keeps a second initialization stable after legacy migration', async () => {
    const raw = createLegacyDatabase();
    raw.payments = [manualPayment(raw, 'legacy-payment-stable')];
    const storage = sharedStorage(raw);

    const first = (await migrate(storage)).database;
    const firstSnapshot = structuredClone(first);
    expect(storage.getItem(SHARED_KEY)).toBeNull();
    const writesAfterFirst = storage.writesFor(ACCOUNT_KEY).length;

    uninstallJsonDbWindow();
    installJsonDbWindow(storage);
    const jsonDb = await freshJsonDb();
    jsonDb.setActiveDatabaseAccount(ACCOUNT_ID);
    const second = jsonDb.getJsonDb();

    expect(second).toEqual(firstSnapshot);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writesAfterFirst);
    expect(new Set(second.payments.map((item) => item.id)).size).toBe(second.payments.length);
    expect(second.payments).toHaveLength(first.payments.length);
    expect(second.payments.map(({ id, status, paidDate }) => ({ id, status, paidDate })))
      .toEqual(first.payments.map(({ id, status, paidDate }) => ({ id, status, paidDate })));
  });
});
