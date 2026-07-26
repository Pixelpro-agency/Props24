import { describe, expect, it } from 'vitest';

import { repairRecoverablePayments } from '../../src/db/jsonDb';
import {
  PAYMENT_REPAIR_REFERENCE_DATE,
  createLeaseFixture,
  createPaymentFixture,
  createPaymentHistoryDatabase,
} from './paymentHistoryFixtures';

describe('repairRecoverablePayments current baseline before D2C', () => {
  it('documents the current baseline where addebito reconstructs paidDate', () => {
    const lease = createLeaseFixture({
      formData: { LeasePaymentMethod: 'addebito' },
    });
    const payment = createPaymentFixture({
      status: 'paid',
      paidDate: null,
      dueDate: '2026-05-05',
    });

    expect(lease.formData.LeasePaymentMethod).toBe('addebito');
    expect(lease.formData.PropertyID).toBe(lease.propertyId);
    expect(lease.formData.LeaseTenantIds).toEqual(lease.tenantIds);
    expect(lease.formData.LeaseStartDate).toBe(lease.startDate);
    expect(lease.formData.LeaseEndDate).toBe(lease.endDate);
    expect(lease.formData.LeaseBillingPeriod).toBeTruthy();

    const repaired = repairRecoverablePayments(
      createPaymentHistoryDatabase([payment], [lease]),
      PAYMENT_REPAIR_REFERENCE_DATE,
    );

    expect(repaired.payments[0]).toMatchObject({
      status: 'paid',
      paidDate: '2026-05-05',
    });
  });

  it('documents the current baseline where non-addebito paid without date becomes late', () => {
    const lease = createLeaseFixture({
      formData: { LeasePaymentMethod: 'bonifico' },
    });
    const payment = createPaymentFixture({
      status: 'paid',
      paidDate: null,
      dueDate: '2026-05-05',
    });

    const repaired = repairRecoverablePayments(
      createPaymentHistoryDatabase([payment], [lease]),
      PAYMENT_REPAIR_REFERENCE_DATE,
    );

    expect(repaired.payments[0]).toMatchObject({
      status: 'late',
      paidDate: null,
    });
  });

  it('removes paidDate from an unpaid record and currently recalculates it as late', () => {
    const payment = createPaymentFixture({
      status: 'pending',
      paidDate: '2026-05-05',
      dueDate: '2026-05-05',
    });

    const repaired = repairRecoverablePayments(
      createPaymentHistoryDatabase([payment]),
      PAYMENT_REPAIR_REFERENCE_DATE,
    );

    expect(repaired.payments[0]).toMatchObject({
      status: 'late',
      paidDate: null,
    });
  });

  it('currently demotes a future generated paid installment', () => {
    const payment = createPaymentFixture({
      source: 'generated',
      category: 'rent',
      status: 'paid',
      dueDate: '2026-07-05',
      paidDate: '2026-06-10',
    });
    const lease = createLeaseFixture({
      endDate: '2026-12-31',
      formData: { LeaseEndDate: '2026-12-31' },
    });

    const repaired = repairRecoverablePayments(
      createPaymentHistoryDatabase([payment], [lease]),
      PAYMENT_REPAIR_REFERENCE_DATE,
    );

    expect(repaired.payments[0]).toMatchObject({
      status: 'pending',
      paidDate: null,
    });
  });

  it('removes an out-of-contract generated rent but preserves a manual payment', () => {
    const lease = createLeaseFixture({
      endDate: '2026-05-31',
      formData: {
        LeaseEndDate: '2026-05-31',
        LeaseRinnovoTacito: false,
      },
    });
    const generated = createPaymentFixture({
      id: 'payment-rent-generated-outside',
      source: 'generated',
      category: 'rent',
      dueDate: '2026-06-05',
    });
    const manual = createPaymentFixture({
      id: 'payment-manual-outside',
      source: 'manual',
      category: 'other',
      dueDate: '2026-06-05',
    });

    const repaired = repairRecoverablePayments(
      createPaymentHistoryDatabase([generated, manual], [lease]),
      PAYMENT_REPAIR_REFERENCE_DATE,
    );

    expect(repaired.payments.map((payment) => payment.id))
      .toEqual(['payment-manual-outside']);
  });

  it('documents the current paid-first duplicate preference to revisit in D2C', () => {
    const paid = createPaymentFixture({
      id: 'payment-rent-duplicate-paid',
      status: 'paid',
      paidDate: '2026-05-05',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const pending = createPaymentFixture({
      id: 'payment-rent-duplicate-pending',
      status: 'pending',
      paidDate: null,
      updatedAt: '2026-06-01T00:00:00.000Z',
    });

    const repaired = repairRecoverablePayments(
      createPaymentHistoryDatabase([pending, paid]),
      PAYMENT_REPAIR_REFERENCE_DATE,
    );

    expect(repaired.payments).toHaveLength(1);
    expect(repaired.payments[0]).toMatchObject({
      id: 'payment-rent-duplicate-paid',
      status: 'paid',
    });
  });

  it('does not mutate its input and is idempotent for the current baseline', () => {
    const lease = createLeaseFixture({
      formData: { LeasePaymentMethod: 'addebito' },
    });
    const manual = createPaymentFixture({
      id: 'payment-manual',
      source: 'manual',
      category: 'other',
    });
    const duplicatePending = createPaymentFixture({
      id: 'payment-rent-duplicate-pending',
      status: 'pending',
    });
    const duplicatePaid = createPaymentFixture({
      id: 'payment-rent-duplicate-paid',
      status: 'paid',
      paidDate: '2026-05-05',
    });
    const paidWithoutDate = createPaymentFixture({
      id: 'payment-rent-first-paid-without-date',
      category: 'rent-first',
      status: 'paid',
      paidDate: null,
      dueDate: '2026-04-05',
    });
    const database = createPaymentHistoryDatabase(
      [manual, duplicatePending, duplicatePaid, paidWithoutDate],
      [lease],
    );
    const original = structuredClone(database);

    const firstRepair = repairRecoverablePayments(
      database,
      PAYMENT_REPAIR_REFERENCE_DATE,
    );
    const secondRepair = repairRecoverablePayments(
      firstRepair,
      PAYMENT_REPAIR_REFERENCE_DATE,
    );

    expect(database).toEqual(original);
    expect(secondRepair).toEqual(firstRepair);
  });
});
