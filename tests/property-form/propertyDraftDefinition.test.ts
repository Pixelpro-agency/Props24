import { describe, expect, it } from 'vitest';

import {
  defaultPropertyValues,
  normalizePropertyFormData,
} from '../../src/components/property-form/schema';
import {
  PROPERTY_DRAFT_SCHEMA_VERSION,
  propertyDraftDefinition,
} from '../../src/components/property-form/propertyDraftDefinition';

describe('property draft definition v2', () => {
  it('uses schema version 2', () => expect(PROPERTY_DRAFT_SCHEMA_VERSION).toBe(2));

  it('migrates v1 fields with an empty Building and without mutating input', () => {
    const payload = { ...defaultPropertyValues, PropertyTitle: 'Legacy' };
    const copy = structuredClone(payload);
    expect(propertyDraftDefinition.parse(payload, 1)).toMatchObject({ PropertyTitle: 'Legacy', PropertyBuildingId: '' });
    expect(payload).toEqual(copy);
  });

  it('ignores a foreign Building field declared in v1', () => {
    expect(propertyDraftDefinition.parse({ ...defaultPropertyValues, PropertyBuildingId: 'building-untrusted' }, 1).PropertyBuildingId).toBe('');
  });

  it('preserves a non-empty Building in v2 and defaults a missing one', () => {
    expect(propertyDraftDefinition.parse({ ...defaultPropertyValues, PropertyBuildingId: 'building-abc' }, 2).PropertyBuildingId).toBe('building-abc');
    expect(propertyDraftDefinition.parse(defaultPropertyValues, 2).PropertyBuildingId).toBe('');
  });

  it('rejects a non-string Building in v2 and unsupported versions', () => {
    expect(() => propertyDraftDefinition.parse({ ...defaultPropertyValues, PropertyBuildingId: 42 }, 2)).toThrow();
    expect(() => propertyDraftDefinition.parse(defaultPropertyValues, 0)).toThrow(/non supportata/);
    expect(() => propertyDraftDefinition.parse(defaultPropertyValues, 3)).toThrow(/non supportata/);
  });

  it('keeps PropertyBuildingId out of canonical PropertyFormData', () => {
    const canonical = normalizePropertyFormData({
      ...defaultPropertyValues,
      PropertyTitle: 'Unità',
      PropertyAddress: 'Via Roma 1',
      PropertyCity: 'Roma',
      PropertyPostalCode: '00100',
      PropertyBuildingId: 'building-abc',
    });
    expect(canonical).not.toHaveProperty('PropertyBuildingId');
  });
});
