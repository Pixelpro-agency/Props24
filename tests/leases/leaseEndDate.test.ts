import { describe, expect, it } from 'vitest';

import { calculateLeaseEndDate } from '../../src/landlord/leases/schema/leaseFormSchema';

describe('calculateLeaseEndDate', () => {
  it('applies the inclusive end-date rule', () => {
    expect(calculateLeaseEndDate('2026-01-01', 1)).toBe('2026-01-31');
    expect(calculateLeaseEndDate('2026-01-15', 1)).toBe('2026-02-14');
    expect(calculateLeaseEndDate('2026-04-30', 1)).toBe('2026-05-29');
  });

  it('clamps the starting day to shorter destination months', () => {
    expect(calculateLeaseEndDate('2025-01-31', 1)).toBe('2025-02-28');
    expect(calculateLeaseEndDate('2024-01-31', 1)).toBe('2024-02-29');
    expect(calculateLeaseEndDate('2026-08-31', 6)).toBe('2027-02-28');
  });

  it('supports the canonical lease durations', () => {
    expect(calculateLeaseEndDate('2026-01-01', 36)).toBe('2028-12-31');
    expect(calculateLeaseEndDate('2026-01-01', 48)).toBe('2029-12-31');
    expect(calculateLeaseEndDate('2026-01-01', 72)).toBe('2031-12-31');
    expect(calculateLeaseEndDate('2026-01-01', 108)).toBe('2034-12-31');
  });

  it('returns an empty result for invalid dates and durations', () => {
    expect(calculateLeaseEndDate('', 1)).toBe('');
    expect(calculateLeaseEndDate('2026-02-30', 1)).toBe('');
    expect(calculateLeaseEndDate('2026-01-01', 0)).toBe('');
    expect(calculateLeaseEndDate('2026-01-01', -1)).toBe('');
    expect(calculateLeaseEndDate('2026-01-01', 1.5)).toBe('');
    expect(calculateLeaseEndDate('2026-01-01', null)).toBe('');
    expect(calculateLeaseEndDate('2026-01-01', undefined)).toBe('');
  });
});
