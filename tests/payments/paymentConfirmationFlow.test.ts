import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LeaseRecord, LocalDatabase, PaymentRecord } from '../../src/db/database.types';
import { LeasePaymentOperationError } from '../../src/db/databaseErrors';
import { PAYMENT_CONFIRMATION_METHODS } from '../../src/db/paymentConfirmation';

const mocks = vi.hoisted(() => ({
  getJsonDb: vi.fn(),
  saveJsonDb: vi.fn(),
  generateId: vi.fn(() => 'generated-id'),
}));

vi.mock('../../src/db/jsonDb', () => mocks);

import {
  confirmPaymentPaid,
  createManualPayment,
  updateManualPayment,
} from '../../src/db/paymentRepository';

const NOW = '2026-06-15T12:00:00.000Z';

function lease(): LeaseRecord {
  return {
    id: 'lease-1',
    propertyId: 'property-1',
    tenantIds: ['tenant-1'],
    guarantorIds: [],
    leaseType: 'abitativo',
    leaseTypeLabel: 'Abitativo',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'attiva',
    rentAmount: 1000,
    utilitiesAmount: 100,
    depositAmount: 0,
    billingPeriod: 'monthly',
    formData: {} as LeaseRecord['formData'],
    archived: false,
    createdAt: NOW,
    updatedAt: NOW,
    notes: '',
    activity: [],
    signatureProcess: null,
    termination: null,
    financialState: {
      depositPaymentId: null,
      depositReturnPaymentId: null,
      prepaidAppliedAmount: 0,
      prepaidAllocations: [],
    },
  };
}

function payment(overrides: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: 'payment-1',
    propertyId: 'property-1',
    leaseId: 'lease-1',
    tenantId: 'tenant-1',
    type: 'income',
    category: 'rent',
    amount: 1100,
    dueDate: '2026-06-15',
    paidDate: null,
    status: 'pending',
    description: 'Canone giugno',
    source: 'generated',
    accountingRole: 'revenue',
    notes: '',
    receiptNumber: null,
    confirmation: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function database(paymentRecord = payment()): LocalDatabase {
  return {
    leases: [lease()],
    payments: [paymentRecord],
  } as LocalDatabase;
}

function arrange(db = database()) {
  mocks.getJsonDb.mockReturnValue(db);
  mocks.saveJsonDb.mockImplementation((snapshot: LocalDatabase) => snapshot);
  return db;
}

function confirmationInput(overrides: Record<string, unknown> = {}) {
  return {
    method: 'bonifico',
    paidDate: '2026-06-15',
    amount: 1100,
    note: '  Incasso completo  ',
    ...overrides,
  };
}

describe('complete payment confirmation flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    vi.clearAllMocks();
    mocks.generateId.mockReturnValue('generated-id');
  });

  it.each(PAYMENT_CONFIRMATION_METHODS)('persists an atomic confirmation with %s', (method) => {
    const db = arrange();

    const result = confirmPaymentPaid('payment-1', confirmationInput({ method }));

    expect(result.status).toBe('paid');
    expect(result.paidDate).toBe('2026-06-15');
    expect(result.amount).toBe(1100);
    expect(result.confirmation).toEqual({
      method,
      paidDate: '2026-06-15',
      amount: 1100,
      note: 'Incasso completo',
      confirmedAt: NOW,
    });
    expect(result.receiptNumber).toBeNull();
    expect(mocks.saveJsonDb).toHaveBeenCalledTimes(1);
    const saved = mocks.saveJsonDb.mock.calls[0][0] as LocalDatabase;
    expect(saved.leases[0].activity).toHaveLength(1);
    expect(saved.leases[0].activity[0].description)
      .toBe('Pagamento completo confermato manualmente.');
    expect(db.payments[0].status).toBe('pending');
  });

  it.each([
    ['partial', 550],
    ['higher', 1100.01],
    ['zero', 0],
    ['NaN', Number.NaN],
  ])('rejects the %s amount without saving or mutating', (_label, amount) => {
    const db = arrange();
    const original = structuredClone(db);

    expect(() => confirmPaymentPaid('payment-1', confirmationInput({ amount })))
      .toThrowError(LeasePaymentOperationError);
    expect(mocks.saveJsonDb).not.toHaveBeenCalled();
    expect(db).toEqual(original);
  });

  it('rejects an invalid method without saving', () => {
    arrange();

    expect(() => confirmPaymentPaid('payment-1', confirmationInput({ method: 'cash' })))
      .toThrowError('Seleziona un metodo di pagamento valido.');
    expect(mocks.saveJsonDb).not.toHaveBeenCalled();
  });

  it('rejects a future paid date without saving', () => {
    arrange();

    expect(() => confirmPaymentPaid('payment-1', confirmationInput({ paidDate: '2026-06-16' })))
      .toThrowError('La data pagamento non può essere futura.');
    expect(mocks.saveJsonDb).not.toHaveBeenCalled();
  });

  it('rejects a future generated installment even with a non-future paid date', () => {
    arrange(database(payment({ dueDate: '2026-06-16' })));

    expect(() => confirmPaymentPaid('payment-1', confirmationInput()))
      .toThrowError('Una rata futura non può essere incassata.');
    expect(mocks.saveJsonDb).not.toHaveBeenCalled();
  });

  it('rejects an already paid payment without activity or saving', () => {
    const db = arrange(database(payment({ status: 'paid', paidDate: '2026-06-14' })));

    expect(() => confirmPaymentPaid('payment-1', confirmationInput()))
      .toThrowError('Il pagamento risulta già pagato.');
    expect(mocks.saveJsonDb).not.toHaveBeenCalled();
    expect(db.leases[0].activity).toHaveLength(0);
  });

  it.each([
    ['2026-06-14', 'late'],
    ['2026-06-15', 'pending'],
    ['2026-06-16', 'pending'],
  ] as const)('creates a manual payment due %s as %s', (dueDate, status) => {
    arrange(database());

    const result = createManualPayment({
      leaseId: 'lease-1',
      type: 'income',
      category: 'other',
      amount: 100,
      dueDate,
      description: 'Movimento manuale',
      notes: '',
    });

    expect(result.status).toBe(status);
    expect(result.paidDate).toBeNull();
    expect(result.confirmation).toBeNull();
    expect(result.receiptNumber).toBeNull();
    expect(mocks.saveJsonDb).toHaveBeenCalledTimes(1);
  });

  it('rejects editing a paid manual payment', () => {
    arrange(database(payment({
      source: 'manual',
      status: 'paid',
      paidDate: '2026-06-14',
    })));

    expect(() => updateManualPayment('payment-1', {
      type: 'income',
      category: 'other',
      amount: 1100,
      dueDate: '2026-06-15',
      description: 'Aggiornato',
      notes: '',
    })).toThrowError('Riporta il pagamento a non pagato prima di modificarlo.');
    expect(mocks.saveJsonDb).not.toHaveBeenCalled();
  });
});
