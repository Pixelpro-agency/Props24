import { describe, expect, it } from 'vitest';
import { buildingDraftDefinition } from '../../src/components/building-form/buildingDraftDefinition';
import { defaultBuildingValues } from '../../src/components/building-form/schema';

describe('buildingDraftDefinition', () => {
    it('normalizza una bozza incompleta nella shape canonica completa', () => {
        expect(buildingDraftDefinition.parse({ identifier: '  Bozza  ' }, 1))
            .toEqual({ ...defaultBuildingValues, identifier: 'Bozza' });
    });

    it('normalizza tipi, country e feature senza campi managed', () => {
        const parsed = buildingDraftDefinition.parse({
            ...defaultBuildingValues,
            country: 'it',
            size: '12.5',
            features: ['Garage', 'Garage'],
            id: 'managed',
        }, 1);
        expect(parsed).toMatchObject({ country: 'IT', size: 12.5, features: ['Garage'] });
        expect(parsed).not.toHaveProperty('id');
    });

    it('rifiuta versioni e tipi incompatibili', () => {
        expect(() => buildingDraftDefinition.parse({}, 2)).toThrow('non supportata');
        expect(() => buildingDraftDefinition.parse({ ...defaultBuildingValues, features: ['Inesistente'] }, 1)).toThrow();
    });
});
