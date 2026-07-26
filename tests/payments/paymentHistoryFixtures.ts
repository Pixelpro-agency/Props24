import seedDatabase from '../../src/db/database.json';
import type {
  LeaseRecord,
  LocalDatabase,
  PaymentRecord,
} from '../../src/db/database.types';
import { defaultLeaseValues } from '../../src/landlord/leases/schema/leaseFormSchema';

export const PAYMENT_REPAIR_REFERENCE_DATE = '2026-06-15';
export const PAYMENT_HISTORY_TIMESTAMP = '2026-01-01T00:00:00.000Z';

type LeaseFixtureOverrides = Partial<Omit<LeaseRecord, 'formData'>> & {
  formData?: Partial<LeaseRecord['formData']>;
};

const typedSeed = seedDatabase as LocalDatabase;

export function createLeaseFixture(overrides: LeaseFixtureOverrides = {}): LeaseRecord {
  const seedLease = structuredClone(typedSeed.leases[0]);
  const {
    formData: formDataOverrides,
    ...recordOverrides
  } = overrides;
  const propertyId = recordOverrides.propertyId ?? 'property-history';
  const tenantIds = recordOverrides.tenantIds ?? ['tenant-history'];
  const startDate = recordOverrides.startDate
    ?? formDataOverrides?.LeaseStartDate
    ?? '2026-01-01';
  const endDate = recordOverrides.endDate
    ?? formDataOverrides?.LeaseEndDate
    ?? '2026-06-30';
  const formData = {
    ...defaultLeaseValues,
    ...seedLease.formData,
    LeasePaymentMethod: 'bonifico',
    LeaseRinnovoTacito: false,
    ...formDataOverrides,
    PropertyID: propertyId,
    LeaseTenantIds: tenantIds,
    LeaseStartDate: startDate,
    LeaseEndDate: endDate,
  };

  return {
    ...seedLease,
    id: 'lease-history',
    status: 'attiva',
    archived: false,
    createdAt: PAYMENT_HISTORY_TIMESTAMP,
    updatedAt: PAYMENT_HISTORY_TIMESTAMP,
    ...recordOverrides,
    propertyId,
    tenantIds,
    startDate,
    endDate,
    formData,
  };
}

export function createPaymentFixture(
  overrides: Partial<PaymentRecord> = {},
): PaymentRecord {
  return {
    id: 'payment-rent-history',
    leaseId: 'lease-history',
    propertyId: 'property-history',
    tenantId: 'tenant-history',
    type: 'income',
    category: 'rent',
    source: 'generated',
    accountingRole: 'revenue',
    amount: 1_100,
    status: 'pending',
    dueDate: '2026-05-05',
    paidDate: null,
    confirmation: null,
    receiptNumber: null,
    description: 'Canone fixture storico',
    notes: '',
    createdAt: PAYMENT_HISTORY_TIMESTAMP,
    updatedAt: PAYMENT_HISTORY_TIMESTAMP,
    ...overrides,
  };
}

export function createPaymentHistoryDatabase(
  payments: PaymentRecord[] = [],
  leases: LeaseRecord[] = [createLeaseFixture()],
): LocalDatabase {
  const database = structuredClone(typedSeed);
  database.leases = structuredClone(leases);
  database.payments = structuredClone(payments);
  return database;
}
