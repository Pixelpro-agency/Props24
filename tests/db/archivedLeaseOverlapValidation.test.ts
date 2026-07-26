import { describe, expect, it } from 'vitest';

import seedDatabase from '../../src/db/database.json';
import type { LocalDatabase } from '../../src/db/database.types';
import { validateDatabaseRelations } from '../../src/db/databaseValidation';

const referenceDate = '2026-06-15';

function cloneSeedDatabase(): LocalDatabase {
  return structuredClone(seedDatabase) as LocalDatabase;
}

describe('archived lease overlap validation', () => {
  it('ignores tenant overlap for an archived lease', () => {
    const database = cloneSeedDatabase();
    const archivedLease = database.leases.find((lease) => lease.id === 'lease-013');

    expect(archivedLease?.archived).toBe(true);

    const overlapIssues = validateDatabaseRelations(database, referenceDate)
      .filter((issue) => issue.code === 'TENANT_LEASE_DATE_OVERLAP' && issue.recordId === 'lease-013');

    expect(overlapIssues).toHaveLength(0);
  });

  it('continues to report tenant overlap for a non-archived lease', () => {
    const database = cloneSeedDatabase();
    const lease = database.leases.find((item) => item.id === 'lease-013');

    expect(lease).toBeDefined();
    if (!lease) return;
    lease.archived = false;

    const overlapIssues = validateDatabaseRelations(database, referenceDate)
      .filter((issue) => (
        issue.severity === 'error'
        && issue.code === 'TENANT_LEASE_DATE_OVERLAP'
        && issue.collection === 'leases'
        && issue.recordId === 'lease-013'
      ));

    expect(overlapIssues.length).toBeGreaterThanOrEqual(1);
  });

  it('does not mutate the imported seed database', () => {
    const originalLease = seedDatabase.leases.find((lease) => lease.id === 'lease-013');

    expect(originalLease?.archived).toBe(true);
  });
});
