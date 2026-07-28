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

describe('legacy payment migration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    uninstallJsonDbWindow();
    vi.useRealTimers();
    vi.resetModules();
  });

  it('preserves a nonempty legacy payment collection', async () => {
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

  it('reconstructs an empty legacy payment history with unpaid contractual schedules', async () => {
    const raw = createLegacyDatabase();
    raw.payments = [];
    const original = structuredClone(raw);

    const { database } = await migrate(sharedStorage(raw));
    expect(database.payments.length).toBeGreaterThan(0);
    database.payments.forEach((payment) => {
      expect(payment.type).toBe('income');
      expect(['rent', 'rent-first']).toContain(payment.category);
      expect(payment.source).toBe('generated');
      expect(['late', 'pending']).toContain(payment.status);
      expect(payment.paidDate).toBeNull();
      expect(payment.confirmation).toBeNull();
      expect(payment.receiptNumber).toBeNull();
      expect(payment.leaseId).not.toBeNull();
      expect(payment.propertyId).not.toBe('');
      expect(payment.id).toMatch(/^payment-(rent|rent-first)-/);
      const lease = database.leases.find((candidate) => candidate.id === payment.leaseId);
      expect(lease).toBeDefined();
      expect(payment.propertyId).toBe(lease?.propertyId);
      expect(payment.dueDate >= (lease?.startDate ?? '')).toBe(true);
    });
    expect(database.payments.some((payment) => payment.status === 'paid')).toBe(false);
    expect(database.payments.some((payment) => payment.id.startsWith('payment-migrated-'))).toBe(false);
    expect(database.payments.some((payment) => payment.id.startsWith('payment-migrated-expense-'))).toBe(false);
    expect(raw).toEqual(original);
  });

  it('preserves all nonempty synthetic-shaped legacy records despite one anomaly', async () => {
    const raw = createLegacyDatabase();
    const originals = syntheticCollection(raw);
    raw.payments = originals;
    const original = structuredClone(raw);

    const { database } = await migrate(sharedStorage(raw));
    const ids = new Set(database.payments.map((item) => item.id));

    originals.forEach((item) => expect(ids.has(String(item.id))).toBe(true));
    expect(database.payments.some((item) => /^payment-migrated-\d{3}$/.test(item.id))).toBe(false);
    expect(database.payments.some((item) => item.id.startsWith('payment-migrated-expense-'))).toBe(false);
    expect(raw).toEqual(original);
  });

  it('preserves a nonempty collection independently from legacy ID shape', async () => {
    const raw = createLegacyDatabase();
    const originals = syntheticCollection(raw, true);
    raw.payments = originals;

    const { database } = await migrate(sharedStorage(raw));
    const ids = new Set(database.payments.map((item) => item.id));

    expect(paymentById(database, 'legacy-custom-guard')).toBeDefined();
    originals.forEach((item) => expect(ids.has(String(item.id))).toBe(true));
    expect(database.payments.some((item) => /^payment-migrated-\d{3}$/.test(item.id))).toBe(false);
    expect(database.payments.some((item) => item.id.startsWith('payment-migrated-expense-'))).toBe(false);
  });

  it('writes the account database before removing valid legacy keys and preserves unreadable drafts', async () => {
    const raw = createLegacyDatabase();
    raw.payments = [manualPayment(raw, 'legacy-payment-order')];
    const storage = new MemoryStorage(Object.fromEntries(
      LEGACY_KEYS.map((key) => [key, key === SHARED_KEY ? JSON.stringify(raw) : 'placeholder']),
    ));

    await migrate(storage);

    expect(storage.getItem(ACCOUNT_KEY)).not.toBeNull();
    const unreadableDraftKeys = ['tenant_form_draft', 'property_form_draft'];
    LEGACY_KEYS.forEach((key) => {
      if (unreadableDraftKeys.includes(key)) {
        expect(storage.getItem(key)).toBe('placeholder');
      } else {
        expect(storage.getItem(key)).toBeNull();
      }
    });
    const accountWrite = storage.operations.findIndex((operation) => (
      operation.type === 'set' && operation.key === ACCOUNT_KEY
    ));
    const removals = storage.operations
      .map((operation, index) => ({ operation, index }))
      .filter(({ operation }) => operation.type === 'remove' && LEGACY_KEYS.includes(operation.key));
    expect(accountWrite).toBeGreaterThanOrEqual(0);
    expect(removals.length).toBe(LEGACY_KEYS.length - unreadableDraftKeys.length);
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
