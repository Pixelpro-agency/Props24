import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import seedDatabase from '../../src/db/database.json';
import type {
  LocalDatabase,
  PaymentRecord,
} from '../../src/db/database.types';
import {
  calculateTenantBalance,
  getPropertyFinancialSummary,
} from '../../src/db/dataSelectors';
import { leaseRecordToListItem } from '../../src/db/leaseRepository';
import {
  MemoryStorage,
  installJsonDbWindow,
  uninstallJsonDbWindow,
} from '../db/jsonDbStorageHarness';

const ACCOUNT_ID = 'user-001';
const ACCOUNT_KEY = 'props24.localDb.user-001';
const REFERENCE_TIMESTAMP = '2026-06-15T12:00:00.000Z';
const REFERENCE_DATE = '2026-06-15';
const RECORD_TIMESTAMP = '2026-01-01T00:00:00.000Z';

function controlledDatabase(): {
  database: LocalDatabase;
  lease: LocalDatabase['leases'][number];
  propertyId: string;
  tenantId: string;
} {
  const database = structuredClone(seedDatabase) as LocalDatabase;
  const lease = database.leases.find((candidate) => (
    candidate.startDate <= REFERENCE_DATE
    && candidate.endDate >= REFERENCE_DATE
    && candidate.tenantIds.length > 0
    && database.properties.some((property) => property.id === candidate.propertyId)
  ));
  if (!lease) throw new Error('Nessuna locazione seed adatta alla fixture consumer.');

  database.leases.forEach((candidate) => {
    candidate.archived = true;
  });
  database.payments = [];

  return {
    database,
    lease,
    propertyId: lease.propertyId,
    tenantId: lease.tenantIds[0],
  };
}

function payment(
  lease: LocalDatabase['leases'][number],
  id: string,
  overrides: Partial<PaymentRecord> = {},
): PaymentRecord {
  return {
    id,
    leaseId: lease.id,
    propertyId: lease.propertyId,
    tenantId: lease.tenantIds[0],
    type: 'income',
    category: 'rent',
    source: 'manual',
    accountingRole: 'revenue',
    amount: 100,
    status: 'pending',
    dueDate: '2026-06-15',
    paidDate: null,
    confirmation: null,
    receiptNumber: null,
    description: `Pagamento consumer ${id}`,
    notes: '',
    createdAt: RECORD_TIMESTAMP,
    updatedAt: RECORD_TIMESTAMP,
    ...overrides,
  };
}

async function loadAccountConsumers(database: LocalDatabase) {
  const storage = new MemoryStorage({
    [ACCOUNT_KEY]: JSON.stringify(database),
  });
  installJsonDbWindow(storage);
  vi.resetModules();

  const jsonDb = await import('../../src/db/jsonDb');
  jsonDb.setActiveDatabaseAccount(ACCOUNT_ID);
  const loadedDatabase = jsonDb.getJsonDb();
  const dashboard = await import('../../src/db/dashboardRepository');

  return { dashboard, loadedDatabase };
}

describe('payment financial consumers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(REFERENCE_TIMESTAMP));
  });

  afterEach(() => {
    uninstallJsonDbWindow();
    vi.useRealTimers();
    vi.resetModules();
  });

  it('uses only overdue revenue for the lease list balance', async () => {
    const { database, lease } = controlledDatabase();
    database.payments = [
      payment(lease, 'late-revenue', { status: 'late', amount: 1_000 }),
      payment(lease, 'late-expense', {
        type: 'expense',
        category: 'maintenance',
        accountingRole: 'expense',
        status: 'late',
        amount: 250,
      }),
      payment(lease, 'late-deposit', {
        category: 'deposit',
        source: 'deposit',
        accountingRole: 'deposit',
        status: 'late',
        amount: 500,
      }),
    ];

    const { loadedDatabase } = await loadAccountConsumers(database);
    const loadedLease = loadedDatabase.leases.find((candidate) => candidate.id === lease.id);
    if (!loadedLease) throw new Error('Locazione normalizzata non trovata.');

    expect(leaseRecordToListItem(loadedLease, loadedDatabase).balance).toBe(-1_000);
  });

  it('includes an overdue pending revenue but excludes future pending and paid revenue', async () => {
    const { database, lease } = controlledDatabase();
    database.payments = [
      payment(lease, 'pending-due', { amount: 400 }),
      payment(lease, 'pending-future', { dueDate: '2026-06-16', amount: 600 }),
      payment(lease, 'paid-revenue', {
        status: 'paid',
        paidDate: '2026-06-05',
        amount: 700,
      }),
    ];

    const { loadedDatabase } = await loadAccountConsumers(database);
    const loadedLease = loadedDatabase.leases.find((candidate) => candidate.id === lease.id);
    if (!loadedLease) throw new Error('Locazione normalizzata non trovata.');

    expect(leaseRecordToListItem(loadedLease, loadedDatabase).balance).toBe(-400);
  });

  it('calculates dashboard cash income, expenses, net result, and overdue revenue', async () => {
    const { database, lease } = controlledDatabase();
    database.payments = [
      payment(lease, 'paid-income', { status: 'paid', paidDate: '2026-06-05', dueDate: '2026-06-05', amount: 1_000 }),
      payment(lease, 'paid-without-date', { status: 'paid', paidDate: null, dueDate: '2026-06-05', amount: 400 }),
      payment(lease, 'pending-income', { dueDate: '2026-06-15', amount: 300 }),
      payment(lease, 'paid-expense', {
        type: 'expense',
        category: 'maintenance',
        accountingRole: 'expense',
        status: 'paid',
        paidDate: '2026-06-06',
        dueDate: '2026-06-06',
        amount: 250,
      }),
      payment(lease, 'unpaid-expense', {
        type: 'expense',
        category: 'maintenance',
        accountingRole: 'expense',
        status: 'late',
        amount: 75,
      }),
      payment(lease, 'deposit', {
        category: 'deposit',
        source: 'deposit',
        accountingRole: 'deposit',
        status: 'paid',
        paidDate: '2026-06-07',
        amount: 500,
      }),
    ];

    const { dashboard, loadedDatabase } = await loadAccountConsumers(database);
    expect(loadedDatabase.payments.find((item) => item.id === 'paid-without-date'))
      .toMatchObject({ status: 'late', paidDate: null });
    expect(dashboard.getRevenueStats('current_month')).toMatchObject({
      paidRentCount: 1,
      paidRentAmount: 1_000,
      grossIncome: 1_000,
      monthlyExpenses: 250,
      netResult: 750,
      latePaymentsCount: 2,
      rentToCollect: 700,
    });
  });

  it('sums only collected revenue for the selected property', async () => {
    const { database, lease, propertyId } = controlledDatabase();
    const otherProperty = database.properties.find((property) => property.id !== propertyId);
    if (!otherProperty) throw new Error('Seconda proprietà seed non trovata.');
    database.payments = [
      payment(lease, 'property-paid', { status: 'paid', paidDate: '2026-06-05', amount: 1_111 }),
      payment(lease, 'property-paid-null', { status: 'paid', paidDate: null, amount: 222 }),
      payment(lease, 'property-late', { status: 'late', amount: 333 }),
      payment(lease, 'property-pending', { amount: 444 }),
      payment(lease, 'property-expense', {
        type: 'expense',
        accountingRole: 'expense',
        category: 'maintenance',
        status: 'paid',
        paidDate: '2026-06-05',
        amount: 555,
      }),
      payment(lease, 'property-deposit', {
        accountingRole: 'deposit',
        category: 'deposit',
        source: 'deposit',
        status: 'paid',
        paidDate: '2026-06-05',
        amount: 666,
      }),
      payment(lease, 'other-property', {
        leaseId: null,
        propertyId: otherProperty.id,
        tenantId: null,
        category: 'other',
        status: 'paid',
        paidDate: '2026-06-05',
        amount: 777,
      }),
    ];

    const { dashboard } = await loadAccountConsumers(database);
    const result = dashboard.getPropertyIncome('current_month')
      .find((item) => item.propertyId === propertyId);

    expect(result?.income).toBe(1_111);
  });

  it('builds the monthly dashboard series from paid revenue and paid expenses only', async () => {
    const { database, lease } = controlledDatabase();
    database.payments = [
      payment(lease, 'chart-income', { status: 'paid', paidDate: '2026-06-05', amount: 1_000 }),
      payment(lease, 'chart-expense', {
        type: 'expense',
        accountingRole: 'expense',
        category: 'maintenance',
        status: 'paid',
        paidDate: '2026-06-06',
        amount: 250,
      }),
      payment(lease, 'chart-paid-null', { status: 'paid', paidDate: null, amount: 400 }),
      payment(lease, 'chart-late', { status: 'late', amount: 300 }),
      payment(lease, 'chart-pending', { amount: 200 }),
      payment(lease, 'chart-deposit', {
        accountingRole: 'deposit',
        category: 'deposit',
        source: 'deposit',
        status: 'paid',
        paidDate: '2026-06-07',
        amount: 500,
      }),
      payment(lease, 'chart-other-month', { status: 'paid', paidDate: '2026-05-05', amount: 600 }),
    ];

    const { dashboard } = await loadAccountConsumers(database);
    const june = dashboard.getLineChartData('12_months').find((point) => point.label === 'giu');

    expect(june).toMatchObject({ income: 1_000, expenses: 250 });
  });

  it('calculates the property financial summary from cash movements only', () => {
    const { database, lease, propertyId } = controlledDatabase();
    database.payments = [
      payment(lease, 'summary-income', { status: 'paid', paidDate: '2026-06-05', amount: 1_000 }),
      payment(lease, 'summary-expense', {
        type: 'expense',
        accountingRole: 'expense',
        category: 'maintenance',
        status: 'paid',
        paidDate: '2026-06-06',
        amount: 250,
      }),
      payment(lease, 'summary-paid-null', { status: 'paid', paidDate: null, amount: 400 }),
      payment(lease, 'summary-late', { status: 'late', amount: 300 }),
      payment(lease, 'summary-unpaid-expense', {
        type: 'expense',
        accountingRole: 'expense',
        category: 'maintenance',
        status: 'late',
        amount: 75,
      }),
      payment(lease, 'summary-deposit', {
        accountingRole: 'deposit',
        category: 'deposit',
        source: 'deposit',
        status: 'paid',
        paidDate: '2026-06-07',
        amount: 500,
      }),
    ];

    const summary = getPropertyFinancialSummary(database, propertyId, 2026);
    expect(summary).toMatchObject({
      grossIncome: 1_000,
      expenses: 250,
      netResult: 750,
    });
    expect(summary.chartData.find((point) => point.month === 'Giu'))
      .toMatchObject({ income: 1_000, expenses: 250 });
  });

  it('calculates tenant balance from overdue revenue and paid tenant credit', () => {
    const { database, lease, tenantId } = controlledDatabase();
    database.payments = [
      payment(lease, 'tenant-late', { status: 'late', amount: 400 }),
      payment(lease, 'tenant-pending-due', { amount: 300 }),
      payment(lease, 'tenant-paid', { status: 'paid', paidDate: '2026-06-05', amount: 1_000 }),
      payment(lease, 'tenant-credit', {
        type: 'expense',
        accountingRole: 'expense',
        category: 'tenant_credit',
        status: 'paid',
        paidDate: '2026-06-05',
        amount: 100,
      }),
      payment(lease, 'tenant-unpaid-expense', {
        type: 'expense',
        accountingRole: 'expense',
        category: 'maintenance',
        status: 'late',
        amount: 250,
      }),
      payment(lease, 'tenant-deposit', {
        accountingRole: 'deposit',
        category: 'deposit',
        source: 'deposit',
        status: 'paid',
        paidDate: '2026-06-05',
        amount: 500,
      }),
    ];

    expect(calculateTenantBalance(database, tenantId, REFERENCE_DATE)).toBe(-600);
  });

  it('isolates deposits from revenue, expense, lease, and tenant consumers', async () => {
    const { database, lease, propertyId, tenantId } = controlledDatabase();
    database.payments = [
      payment(lease, 'deposit-paid', {
        accountingRole: 'deposit',
        category: 'deposit',
        source: 'deposit',
        status: 'paid',
        paidDate: '2026-06-05',
        amount: 501,
      }),
      payment(lease, 'deposit-late', {
        accountingRole: 'deposit',
        category: 'deposit',
        source: 'deposit',
        status: 'late',
        amount: 502,
      }),
      payment(lease, 'deposit-return', {
        type: 'expense',
        accountingRole: 'deposit',
        category: 'deposit_return',
        source: 'deposit_return',
        status: 'paid',
        paidDate: '2026-06-06',
        amount: 503,
      }),
    ];

    const { dashboard, loadedDatabase } = await loadAccountConsumers(database);
    const revenue = dashboard.getRevenueStats('current_month');
    const property = getPropertyFinancialSummary(loadedDatabase, propertyId, 2026);

    expect(revenue).toMatchObject({
      grossIncome: 0,
      monthlyExpenses: 0,
      netResult: 0,
    });
    expect(property).toMatchObject({ grossIncome: 0, expenses: 0 });
    const loadedLease = loadedDatabase.leases.find((candidate) => candidate.id === lease.id);
    if (!loadedLease) throw new Error('Locazione normalizzata non trovata.');
    expect(leaseRecordToListItem(loadedLease, loadedDatabase).balance).toBe(0);
    expect(calculateTenantBalance(loadedDatabase, tenantId, REFERENCE_DATE)).toBe(0);
  });
});
