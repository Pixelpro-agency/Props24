import { describe, expect, it } from 'vitest';

import type { LeaseRecord } from '../../src/db/database.types';
import { buildLeasePaymentSchedule } from '../../src/db/paymentRepository';
import {
  defaultLeaseValues,
  normalizeLeaseFormData,
} from '../../src/landlord/leases/schema/leaseFormSchema';

const REFERENCE_DATE = '2026-06-15';
const PAYMENT_METHODS = ['bonifico', 'contanti', 'assegno', 'carta', 'addebito'] as const;

function createLease(
  paymentMethod: string,
  overrides: Partial<typeof defaultLeaseValues> = {},
): LeaseRecord {
  const formData = normalizeLeaseFormData({
    ...defaultLeaseValues,
    PropertyID: 'property-payment-status',
    LeaseType: 'abitativo',
    LeaseIdentificativo: 'Lease payment status',
    LeaseTenantIds: ['tenant-payment-status'],
    LeaseStartDate: '2026-05-01',
    LeaseEndDate: '2026-07-31',
    LeaseRinnovoTacito: false,
    LeaseBillingPeriod: 'monthly',
    LeasePaymentTiming: 'anticipato',
    LeasePaymentMethod: paymentMethod,
    LeasePaymentDay: 15,
    LeaseReceiptPeriodDay: 1,
    LeasePaymentCreateOffsetDays: -30,
    LeaseRentHC: 1_000,
    LeaseMaintenance: 100,
    LeaseDeposit: 0,
    LeasePrepaidRent: 0,
    ...overrides,
  });

  return {
    id: `lease-payment-status-${paymentMethod}`,
    propertyId: 'property-payment-status',
    tenantIds: ['tenant-payment-status'],
    guarantorIds: [],
    leaseType: 'abitativo',
    leaseTypeLabel: 'Abitativo',
    startDate: formData.LeaseStartDate,
    endDate: formData.LeaseEndDate,
    status: 'attiva',
    rentAmount: formData.LeaseRentHC,
    utilitiesAmount: formData.LeaseMaintenance,
    depositAmount: 0,
    billingPeriod: formData.LeaseBillingPeriod,
    formData,
    archived: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
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

function expectGeneratedPayment(
  lease: LeaseRecord,
  dueDate: string,
  expectedStatus: 'late' | 'pending',
) {
  const payment = buildLeasePaymentSchedule(lease, REFERENCE_DATE)
    .find((item) => item.dueDate === dueDate);

  expect(payment).toBeDefined();
  expect(payment).toMatchObject({
    dueDate,
    status: expectedStatus,
    paidDate: null,
    receiptNumber: null,
    source: 'generated',
    accountingRole: 'revenue',
  });
}

describe('generated payment initial status', () => {
  it.each(PAYMENT_METHODS)(
    'does not infer collection from the %s contract method',
    (paymentMethod) => {
      const lease = createLease(paymentMethod);

      expectGeneratedPayment(lease, '2026-05-15', 'late');
      expectGeneratedPayment(lease, '2026-06-15', 'pending');
      expectGeneratedPayment(lease, '2026-07-15', 'pending');

      expect(buildLeasePaymentSchedule(lease, REFERENCE_DATE))
        .not.toContainEqual(expect.objectContaining({ status: 'paid' }));
    },
  );

  it.each([
    ['2026-05-01', '2026-05-31', '2026-05-15', 'late'],
    ['2026-06-01', '2026-06-30', '2026-06-15', 'pending'],
    ['2026-07-01', '2026-07-31', '2026-07-15', 'pending'],
  ] as const)(
    'applies the same status semantics to a custom first bill due on %s',
    (startDate, firstBillEndDate, dueDate, expectedStatus) => {
      const lease = createLease('addebito', {
        LeaseStartDate: startDate,
        LeaseEndDate: firstBillEndDate,
        LeaseFirstBill: true,
        LeaseFirstBillEndDate: firstBillEndDate,
        LeaseFirstBillAmount: 500,
        LeaseFirstBillCharges: 50,
      });

      const payment = buildLeasePaymentSchedule(lease, REFERENCE_DATE)
        .find((item) => item.category === 'rent-first');

      expect(payment).toMatchObject({
        category: 'rent-first',
        dueDate,
        status: expectedStatus,
        paidDate: null,
        receiptNumber: null,
      });
    },
  );
});
