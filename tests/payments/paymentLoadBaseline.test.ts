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
const REFERENCE_TIMESTAMP = '2026-06-15T12:00:00.000Z';
const REFERENCE_DATE = '2026-06-15';

type RawDatabase = Omit<LocalDatabase, 'payments'> & {
  payments: Array<Record<string, unknown>>;
};

async function loadFreshJsonDb() {
  vi.resetModules();
  return import('../../src/db/jsonDb');
}

function createRawDatabase(): RawDatabase {
  return structuredClone(seedDatabase) as unknown as RawDatabase;
}

function findHistoricalPayment(database: RawDatabase): Record<string, unknown> {
  const payment = database.payments.find((candidate) => {
    if (
      typeof candidate.leaseId !== 'string'
      || typeof candidate.propertyId !== 'string'
      || typeof candidate.tenantId !== 'string'
      || typeof candidate.dueDate !== 'string'
      || candidate.dueDate >= REFERENCE_DATE
    ) {
      return false;
    }

    const lease = database.leases.find((item) => item.id === candidate.leaseId);
    return Boolean(
      lease
      && lease.propertyId === candidate.propertyId
      && lease.tenantIds.includes(candidate.tenantId)
      && candidate.dueDate >= lease.startDate
      && candidate.dueDate <= lease.endDate,
    );
  });

  if (!payment) {
    throw new Error('Nessuna rata seed storica valida e collegata trovata.');
  }
  return payment;
}

function paymentById(database: LocalDatabase, id: unknown): PaymentRecord {
  const payment = database.payments.find((item) => item.id === id);
  if (!payment) throw new Error(`Pagamento caricato non trovato: ${String(id)}`);
  return payment;
}

function arrangeStorage(database: RawDatabase): MemoryStorage {
  const storage = new MemoryStorage({
    [ACCOUNT_KEY]: JSON.stringify(database),
  });
  installJsonDbWindow(storage);
  return storage;
}

async function loadAccountDatabase() {
  const jsonDb = await loadFreshJsonDb();
  jsonDb.setActiveDatabaseAccount(ACCOUNT_ID);
  expect(jsonDb.getAccountDatabaseKey(ACCOUNT_ID)).toBe(ACCOUNT_KEY);
  return {
    jsonDb,
    database: jsonDb.getJsonDb(),
  };
}

describe('account-scoped payment loading baseline before D2C', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(REFERENCE_TIMESTAMP));
  });

  afterEach(() => {
    uninstallJsonDbWindow();
    vi.useRealTimers();
    vi.resetModules();
  });

  it('documents the current missing-status fallback to paid to correct in D2C', async () => {
    const rawDatabase = createRawDatabase();
    const rawPayment = findHistoricalPayment(rawDatabase);
    const id = rawPayment.id;
    const dueDate = rawPayment.dueDate;
    delete rawPayment.status;
    rawPayment.paidDate = dueDate;
    arrangeStorage(rawDatabase);

    const { database } = await loadAccountDatabase();
    const loaded = paymentById(database, id);

    expect(loaded.id).toBe(id);
    expect(loaded.status).toBe('paid');
    expect(loaded.paidDate).toBe(dueDate);
  });

  it('documents the current unknown-status fallback to paid without mutating raw input', async () => {
    const rawDatabase = createRawDatabase();
    const rawPayment = findHistoricalPayment(rawDatabase);
    const id = rawPayment.id;
    const dueDate = rawPayment.dueDate;
    rawPayment.status = 'imported-legacy-state';
    rawPayment.paidDate = dueDate;
    const original = structuredClone(rawDatabase);
    arrangeStorage(rawDatabase);

    const { database } = await loadAccountDatabase();
    const loaded = paymentById(database, id);

    expect(loaded.status).toBe('paid');
    expect(loaded.paidDate).toBe(dueDate);
    expect(rawDatabase).toEqual(original);
  });

  it('repairs pending with paidDate during the real account-scoped load path', async () => {
    const rawDatabase = createRawDatabase();
    const rawPayment = findHistoricalPayment(rawDatabase);
    const id = rawPayment.id;
    rawPayment.status = 'pending';
    rawPayment.paidDate = rawPayment.dueDate;
    arrangeStorage(rawDatabase);

    const { database } = await loadAccountDatabase();
    const loaded = paymentById(database, id);

    expect(loaded.status).toBe('late');
    expect(loaded.paidDate).toBeNull();
  });

  it('normalizes invalid confirmation to null and preserves a normalized valid confirmation', async () => {
    const rawDatabase = createRawDatabase();
    const historical = findHistoricalPayment(rawDatabase);
    const dueDate = String(historical.dueDate);
    const common = {
      ...historical,
      source: 'manual',
      category: 'other',
      status: 'paid',
      paidDate: dueDate,
    };
    const invalidId = 'payment-load-invalid-confirmation';
    const validId = 'payment-load-valid-confirmation';
    rawDatabase.payments.push(
      {
        ...common,
        id: invalidId,
        confirmation: {
          method: 'metodo-sconosciuto',
          paidDate: dueDate,
          amount: historical.amount,
          note: 'Testo',
          confirmedAt: '2026-05-06T10:00:00.000Z',
        },
      },
      {
        ...common,
        id: validId,
        confirmation: {
          method: 'bonifico',
          paidDate: dueDate,
          amount: historical.amount,
          note: '  Incasso verificato  ',
          confirmedAt: '2026-05-06T10:00:00.000Z',
        },
      },
    );
    arrangeStorage(rawDatabase);

    const { database } = await loadAccountDatabase();
    const invalid = paymentById(database, invalidId);
    const valid = paymentById(database, validId);

    expect(invalid.confirmation).toBeNull();
    expect(valid.confirmation).toMatchObject({
      method: 'bonifico',
      paidDate: dueDate,
      amount: historical.amount,
      note: 'Incasso verificato',
      confirmedAt: '2026-05-06T10:00:00.000Z',
    });
  });

  it('documents that load repair does not immediately rewrite the account key', async () => {
    const rawDatabase = createRawDatabase();
    const rawPayment = findHistoricalPayment(rawDatabase);
    const id = rawPayment.id;
    const dueDate = rawPayment.dueDate;
    rawPayment.status = 'paid';
    rawPayment.paidDate = null;
    const rawLease = rawDatabase.leases.find((lease) => lease.id === rawPayment.leaseId);
    if (!rawLease) throw new Error('Locazione seed collegata non trovata.');
    rawLease.formData = {
      ...rawLease.formData,
      LeasePaymentMethod: 'addebito',
    };
    const storage = arrangeStorage(rawDatabase);

    const { database } = await loadAccountDatabase();
    const loaded = paymentById(database, id);
    const persisted = JSON.parse(storage.getItem(ACCOUNT_KEY) ?? '') as RawDatabase;
    const persistedPayment = paymentById(persisted as unknown as LocalDatabase, id);

    expect(loaded.status).toBe('paid');
    expect(loaded.paidDate).toBe(dueDate);
    expect(persistedPayment.paidDate).toBeNull();
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(0);
  });

  it('documents current deferred repair persistence through a later saveJsonDb', async () => {
    const rawDatabase = createRawDatabase();
    const rawPayment = findHistoricalPayment(rawDatabase);
    const id = rawPayment.id;
    const dueDate = rawPayment.dueDate;
    rawPayment.status = 'paid';
    rawPayment.paidDate = null;
    const rawLease = rawDatabase.leases.find((lease) => lease.id === rawPayment.leaseId);
    if (!rawLease) throw new Error('Locazione seed collegata non trovata.');
    rawLease.formData = {
      ...rawLease.formData,
      LeasePaymentMethod: 'addebito',
    };
    const storage = arrangeStorage(rawDatabase);

    const { jsonDb, database } = await loadAccountDatabase();
    expect(paymentById(database, id).paidDate).toBe(dueDate);
    expect(paymentById(
      JSON.parse(storage.getItem(ACCOUNT_KEY) ?? '') as LocalDatabase,
      id,
    ).paidDate).toBeNull();

    const saved = jsonDb.saveJsonDb(database);
    const persisted = JSON.parse(storage.getItem(ACCOUNT_KEY) ?? '') as LocalDatabase;

    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(1);
    expect(paymentById(persisted, id)).toMatchObject({
      status: 'paid',
      paidDate: dueDate,
    });
    expect(paymentById(saved, id)).toMatchObject({
      status: 'paid',
      paidDate: dueDate,
    });
    expect(persisted.payments.filter((payment) => (
      payment.leaseId === rawPayment.leaseId
      && payment.category === rawPayment.category
      && payment.dueDate === dueDate
    ))).toHaveLength(1);
  });
});
