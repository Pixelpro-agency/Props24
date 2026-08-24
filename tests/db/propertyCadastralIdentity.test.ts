import { describe, expect, it } from 'vitest';
import {
    normalizePropertyFormData,
    propertySchema,
    type PropertyFormData,
} from '../../src/components/property-form/schema';
import { buildPropertyCadastralKey } from '../../src/db/businessRules';

function property(overrides: Partial<PropertyFormData> = {}): PropertyFormData {
    return normalizePropertyFormData({
        PropertyTitle: 'Unità 1',
        PropertyAddress: 'Via Roma 10',
        PropertyCity: 'Roma',
        PropertyPostalCode: '00100',
        PropertyCountry: 'IT',
        PropertyCadastreMunicipalityCode: 'H501',
        PropertyCadastreRegistryType: 'urbano',
        PropertyCadastreMunicipality: '',
        PropertyUrbanSection: '',
        PropertyCadastreSheet: '001',
        PropertyCadastrePart: '00042',
        PropertyCadastreSub: '',
        ...overrides,
    });
}

function key(overrides: Partial<PropertyFormData> = {}): string | null {
    return buildPropertyCadastralKey(property(overrides));
}

describe('contratto form dell’identità catastale', () => {
    it('normalizza i dati legacy con i nuovi default vuoti', () => {
        const normalized = normalizePropertyFormData({
            PropertyTitle: 'Unità legacy',
            PropertyAddress: 'Via Roma 1',
            PropertyCity: 'Roma',
            PropertyPostalCode: '00100',
        });

        expect(normalized.PropertyCadastreMunicipalityCode).toBe('');
        expect(normalized.PropertyCadastreRegistryType).toBe('');
        expect(normalized.PropertyCadastreMunicipality).toBe('');
    });

    it.each(['', 'terreni', 'urbano'] as const)(
        'accetta il tipo catasto %j',
        (registryType) => {
            expect(propertySchema.parse({ ...property(), PropertyCadastreRegistryType: registryType })
                .PropertyCadastreRegistryType).toBe(registryType);
        },
    );

    it('rifiuta un tipo catasto fuori catalogo', () => {
        expect(() => propertySchema.parse({
            ...property(),
            PropertyCadastreRegistryType: 'fabbricati',
        })).toThrow();
    });
});

describe('buildPropertyCadastralKey', () => {
    it.each([
        ['Paese', { PropertyCountry: '' }],
        ['Codice Comune', { PropertyCadastreMunicipalityCode: '' }],
        ['Tipo catasto', { PropertyCadastreRegistryType: '' }],
        ['Foglio', { PropertyCadastreSheet: '' }],
        ['Particella', { PropertyCadastrePart: '' }],
    ] satisfies Array<[string, Partial<PropertyFormData>]>)('restituisce null senza %s', (_label, override) => {
        expect(key(override)).toBeNull();
    });

    it('normalizza NFKC, spazi e maiuscole/minuscole dei codici', () => {
        expect(key({
            PropertyCountry: ' ｉ t ',
            PropertyCadastreMunicipalityCode: ' h 5 0 1 ',
            PropertyUrbanSection: ' a 1 ',
            PropertyCadastreSheet: ' 0 0 1 ',
            PropertyCadastrePart: ' 0 0 0 4 2 ',
            PropertyCadastreSub: ' a 3 ',
        })).toBe(key({
            PropertyCountry: 'IT',
            PropertyCadastreMunicipalityCode: 'H501',
            PropertyUrbanSection: 'A1',
            PropertyCadastreSheet: '001',
            PropertyCadastrePart: '00042',
            PropertyCadastreSub: 'A3',
        }));
    });

    it('normalizza il Codice Comune rimuovendo gli spazi interni', () => {
        const parsed = JSON.parse(key({ PropertyCadastreMunicipalityCode: ' h 5 0 1 ' })!);
        expect(parsed.municipalityCode).toBe('H501');
    });

    it('normalizza il Comune catastale in modo case-insensitive e con spazi canonici', () => {
        expect(key({ PropertyCadastreMunicipality: '  roma   capitale ' }))
            .toBe(key({ PropertyCadastreMunicipality: 'ROMA CAPITALE' }));
    });

    it('conserva gli zeri significativi del Foglio', () => {
        expect(key({ PropertyCadastreSheet: '001' })).not.toBe(key({ PropertyCadastreSheet: '1' }));
    });

    it('conserva gli zeri significativi della Particella', () => {
        expect(key({ PropertyCadastrePart: '00042' })).not.toBe(key({ PropertyCadastrePart: '42' }));
    });

    it('distingue Subalterno assente e presente', () => {
        expect(key({ PropertyCadastreSub: '' })).not.toBe(key({ PropertyCadastreSub: '3' }));
    });

    it('conserva gli zeri significativi del Subalterno', () => {
        expect(key({ PropertyCadastreSub: '03' })).not.toBe(key({ PropertyCadastreSub: '3' }));
    });

    it('distingue Sezione urbana assente e presente', () => {
        expect(key({ PropertyUrbanSection: '' })).not.toBe(key({ PropertyUrbanSection: 'A' }));
    });

    it('distingue Comune catastale assente e presente', () => {
        expect(key({ PropertyCadastreMunicipality: '' }))
            .not.toBe(key({ PropertyCadastreMunicipality: 'Roma' }));
    });

    it('distingue Paesi diversi', () => {
        expect(key({ PropertyCountry: 'IT' })).not.toBe(key({ PropertyCountry: 'FR' }));
    });

    it('non usa il titolo', () => {
        expect(key({ PropertyTitle: 'Unità A' })).toBe(key({ PropertyTitle: 'Unità B' }));
    });

    it('non usa indirizzo, città o CAP', () => {
        expect(key({ PropertyAddress: 'Via A 1', PropertyCity: 'Roma', PropertyPostalCode: '00100' }))
            .toBe(key({ PropertyAddress: 'Rue B 2', PropertyCity: 'Parigi', PropertyPostalCode: '75001' }));
    });

    it('non usa piano o interno', () => {
        expect(key({ PropertyFloor: '1', PropertyDoorNum: 'A' }))
            .toBe(key({ PropertyFloor: '9', PropertyDoorNum: 'Z' }));
    });

    it('non usa categoria o rendita', () => {
        expect(key({ PropertyCadastreCat: 'A2', PropertyCadastralIncome: '100' }))
            .toBe(key({ PropertyCadastreCat: 'C1', PropertyCadastralIncome: '900' }));
    });

    it('non applica fallback sull’indirizzo con catasto incompleto', () => {
        expect(key({
            PropertyCadastrePart: '',
            PropertyAddress: 'Via Completa 10',
            PropertyCity: 'Roma',
            PropertyPostalCode: '00100',
        })).toBeNull();
    });
});
