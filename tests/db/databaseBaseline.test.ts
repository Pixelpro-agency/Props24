import { describe, expect, it } from 'vitest';

import {
  doDateRangesOverlap,
  normalizeFiscalCode,
  normalizePropertyIdentifier,
  normalizePropertyLocationKey,
} from '../../src/db/businessRules';

describe('database business rules baseline', () => {
  it('normalizes property identifiers consistently', () => {
    expect(normalizePropertyIdentifier('  Appartamento Centro  ')).toBe('appartamento centro');
    expect(normalizePropertyIdentifier('Appartamento    Centro')).toBe('appartamento centro');
    expect(normalizePropertyIdentifier('  UNITÀ À PONTE  ')).toBe('unità à ponte');
    expect(normalizePropertyIdentifier('   ')).toBe('');
  });

  it('builds a canonical property location key only from complete data', () => {
    expect(normalizePropertyLocationKey({
      PropertyAddress: '  Via   Roma 10 ',
      PropertyCity: ' MILANO ',
      PropertyPostalCode: ' 20 100 ',
    })).toBe('via roma 10|milano|20100');
    expect(normalizePropertyLocationKey({
      PropertyAddress: '',
      PropertyCity: 'Milano',
      PropertyPostalCode: '20100',
    })).toBe('');
    expect(normalizePropertyLocationKey({
      PropertyAddress: 'Via Roma 10',
      PropertyCity: '',
      PropertyPostalCode: '20100',
    })).toBe('');
    expect(normalizePropertyLocationKey({
      PropertyAddress: 'Via Roma 10',
      PropertyCity: 'Milano',
      PropertyPostalCode: ' ',
    })).toBe('');
  });

  it('normalizes fiscal codes without whitespace and in uppercase', () => {
    expect(normalizeFiscalCode(' rss mra 80a01 h501u ')).toBe('RSSMRA80A01H501U');
    expect(normalizeFiscalCode('abc def')).toBe('ABCDEF');
    expect(normalizeFiscalCode('   ')).toBe('');
  });

  it('recognizes overlapping, touching, separate, and invalid date ranges', () => {
    expect(doDateRangesOverlap('2026-01-01', '2026-01-31', '2026-01-15', '2026-02-15')).toBe(true);
    expect(doDateRangesOverlap('2026-01-01', '2026-01-31', '2026-01-31', '2026-02-15')).toBe(true);
    expect(doDateRangesOverlap('2026-01-01', '2026-01-31', '2026-02-01', '2026-02-15')).toBe(false);
    expect(doDateRangesOverlap('not-a-date', '2026-01-31', '2026-01-15', '2026-02-15')).toBe(false);
    expect(doDateRangesOverlap('2026-02-30', '2026-03-01', '2026-02-01', '2026-02-15')).toBe(false);
  });
});
