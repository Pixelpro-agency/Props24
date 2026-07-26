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

describe('account-scoped payment loading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(REFERENCE_TIMESTAMP));
  });

  afterEach(() => {
    uninstallJsonDbWindow();
    vi.useRealTimers();
    vi.resetModules();
  });

  it('loads a historical payment with missing status conservatively as unpaid', async () => {
    const rawDatabase = createRawDatabase();
    const rawPayment = findHistoricalPayment(rawDatabase);
    const id = rawPayment.id;
    const dueDate = rawPayment.dueDate;
    delete rawPayment.status;
    rawPayment.paidDate = dueDate;
    const original = structuredClone(rawDatabase);
    arrangeStorage(rawDatabase);

    const { database } = await loadAccountDatabase();
    const loaded = paymentById(database, id);

    expect(loaded.id).toBe(id);
    expect(loaded.status).toBe('late');
    expect(loaded.paidDate).toBeNull();
    expect(rawDatabase).toEqual(original);
  });

  it('loads an unknown historical status conservatively as unpaid', async () => {
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

    expect(loaded.id).toBe(id);
    expect(loaded.status).toBe('late');
    expect(loaded.paidDate).toBeNull();
    expect(rawDatabase).toEqual(original);
  });

  it('keeps an unknown non-overdue status pending after conservative normalization', async () => {
    const rawDatabase = createRawDatabase();
    const dueDate = REFERENCE_DATE;
    const lease = rawDatabase.leases.find((candidate) => (
      candidate.startDate <= dueDate
      && candidate.endDate >= dueDate
      && candidate.tenantIds.length > 0
    ));
    if (!lease) throw new Error(`Nessuna locazione seed valida per ${dueDate}.`);
    const id = 'payment-load-unknown-current';
    rawDatabase.payments.push({
      id,
      leaseId: lease.id,
      propertyId: lease.propertyId,
      tenantId: lease.tenantIds[0],
      type: 'income',
      category: 'other',
      source: 'manual',
      accountingRole: 'revenue',
      amount: 100,
      status: 'imported-legacy-state',
      dueDate,
      paidDate: null,
      confirmation: null,
      receiptNumber: null,
      description: 'Pagamento corrente con stato sconosciuto',
      notes: '',
      createdAt: REFERENCE_TIMESTAMP,
      updatedAt: REFERENCE_TIMESTAMP,
    });
    arrangeStorage(rawDatabase);

    const { database } = await loadAccountDatabase();
    const loaded = paymentById(database, id);

    expect(loaded).toMatchObject({
      status: 'pending',
      paidDate: null,
      confirmation: null,
      receiptNumber: null,
    });
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

  it('persists an account-scoped load repair immediately and exactly once', async () => {
    const rawDatabase = createRawDatabase();
    const rawPayment = findHistoricalPayment(rawDatabase);
    const id = rawPayment.id;
    rawPayment.status = 'paid';
    rawPayment.paidDate = null;
    const rawLease = rawDatabase.leases.find((lease) => lease.id === rawPayment.leaseId);
    if (!rawLease) throw new Error('Locazione seed collegata non trovata.');
    rawLease.formData = {
      ...rawLease.formData,
      LeasePaymentMethod: 'addebito',
    };
    const original = structuredClone(rawDatabase);
    const storage = arrangeStorage(rawDatabase);

    const { database } = await loadAccountDatabase();
    const loaded = paymentById(database, id);
    const persisted = JSON.parse(storage.getItem(ACCOUNT_KEY) ?? '') as LocalDatabase;
    const persistedPayment = paymentById(persisted, id);

    expect(loaded).toMatchObject({ status: 'late', paidDate: null });
    expect(persistedPayment).toMatchObject({ status: 'late', paidDate: null });
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(1);
    expect(persisted.payments.filter((payment) => (
      payment.leaseId === rawPayment.leaseId
      && payment.category === rawPayment.category
      && payment.dueDate === rawPayment.dueDate
    ))).toHaveLength(1);
    expect(rawDatabase).toEqual(original);
  });

  it('does not rewrite an already repaired account on a second initialization', async () => {
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

    const firstLoad = await loadAccountDatabase();
    const firstDatabase = firstLoad.database;
    expect(paymentById(firstDatabase, id)).toMatchObject({ status: 'late', paidDate: null });

    const persisted = JSON.parse(storage.getItem(ACCOUNT_KEY) ?? '') as LocalDatabase;
    expect(paymentById(persisted, id)).toMatchObject({ status: 'late', paidDate: null });
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(1);

    const persistedAfterFirstLoad = storage.getItem(ACCOUNT_KEY);
    const firstSnapshot = structuredClone(firstDatabase);

    uninstallJsonDbWindow();
    installJsonDbWindow(storage);

    const secondJsonDb = await loadFreshJsonDb();
    secondJsonDb.setActiveDatabaseAccount(ACCOUNT_ID);
    const secondDatabase = secondJsonDb.getJsonDb();

    expect(secondDatabase).toEqual(firstSnapshot);
    expect(storage.getItem(ACCOUNT_KEY)).toBe(persistedAfterFirstLoad);
    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(1);
    expect(paymentById(secondDatabase, id)).toMatchObject({
      status: 'late',
      paidDate: null,
    });
    expect(persisted.payments.filter((payment) => (
      payment.leaseId === rawPayment.leaseId
      && payment.category === rawPayment.category
      && payment.dueDate === dueDate
    ))).toHaveLength(1);
  });
});
