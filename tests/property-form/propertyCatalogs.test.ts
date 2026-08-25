import { describe, expect, it } from 'vitest';
import {
    normalizeLegacyPropertyBillingPeriod,
    normalizeLegacyPropertyEnergyClass,
    normalizeLegacyPropertyRentType,
    normalizeLegacyPropertyType,
    propertyBillingPeriodCatalog,
    propertyEnergyClassCatalog,
    propertyRentTypeCatalog,
    propertyTypeCatalog,
} from '../../src/data/propertyCatalogs';
import { propertyTypes } from '../../src/data/propertyTypes';
import {
    defaultPropertyValues,
    normalizePropertyFormData,
    propertyFormStateSchema,
    propertyMutationFormStateSchema,
    propertyMutationSchema,
} from '../../src/components/property-form/schema';

const expectedPropertyTypes = [
    ['appartamento', 'Appartamento'], ['negozio', 'Negozio'], ['ufficio_condiviso', 'Ufficio condiviso'],
    ['ufficio', 'Ufficio'], ['roulotte', 'Roulotte'], ['cantina', 'Cantina'], ['chalet', 'Chalet'],
    ['stanza', 'Stanza'], ['commercio', 'Commercio'], ['magazzino', 'Magazzino'], ['garage', 'Garage'],
    ['laboratorio', 'Laboratorio'], ['locale_professionale', 'Locale professionale'], ['casa', 'Casa'],
    ['casa_di_citta', 'Casa di città'], ['mansarda', 'Mansarda'], ['casa_mobile', 'Casa mobile'],
    ['parcheggio', 'Parcheggio'], ['terreno', 'Terreno'], ['nuda_proprieta', 'Nuda proprietà'], ['altro', 'Altro'],
];

const expectedRentTypes = [
    ['canone_libero_4+4', 'Canone libero (4+4)'],
    ['canone_libero_4+4_con_cedolare_secca', 'Canone libero (4+4) con cedolare secca'],
    ['canone_concordato_3+2', 'Canone concordato (3+2)'],
    ['canone_concordato_3+2_con_cedolare_secca', 'Canone concordato (3+2) con cedolare secca'],
    ['canone_concordato_4+2_con_cedolare_secca', 'Canone concordato (4+2) con cedolare secca'],
    ['canone_concordato_5+2_con_cedolare_secca', 'Canone concordato (5+2) con cedolare secca'],
    ['canone_concordato_6+2_con_cedolare_secca', 'Canone concordato (6+2) con cedolare secca'],
    ['turistico', 'Turistico'], ['turistico_con_cedolare', 'Turistico con cedolare'],
    ['parziale', 'Parziale'], ['parziale_transitoria', 'Parziale transitoria'], ['transitorio', 'Transitorio'],
    ['transitorio_con_cedolare_secca', 'Transitorio con cedolare secca'], ['studenti', 'Studenti'],
    ['studenti_con_cedolare_secca', 'Studenti con cedolare secca'], ['uso_commerciale_6+6', 'Uso commerciale 6+6'],
    ['uso_commerciale_9+9', 'Uso commerciale 9+9'], ['uso_commerciale_6+2', 'Uso commerciale 6+2'],
    ['comodato_usufrutto', 'Comodato / Usufrutto'], ['sublocazione', 'Sublocazione'],
    ['uso_foresteria', 'Uso foresteria'],
];

const mutation = (overrides: Record<string, unknown> = {}) => ({
    ...defaultPropertyValues,
    PropertyTypeID: 'appartamento',
    PropertyTitle: 'Unità valida',
    PropertyAddress: 'Via Roma 1',
    PropertyCity: 'Roma',
    PropertyPostalCode: '00100',
    ...overrides,
});

describe('cataloghi canonici Unit', () => {
    it('mantiene esattamente i 21 tipi unità e il compatibility export', () => {
        expect(propertyTypeCatalog.map(({ value, label }) => [value, label])).toEqual(expectedPropertyTypes);
        expect(new Set(propertyTypeCatalog.map(({ value }) => value))).toHaveLength(21);
        expect(propertyTypes).toBe(propertyTypeCatalog);
    });

    it('implementa UN-01 con ID, label e ordine esatti', () => {
        expect(propertyRentTypeCatalog.map(({ value, label }) => [value, label])).toEqual(expectedRentTypes);
        expect(new Set(propertyRentTypeCatalog.map(({ value }) => value))).toHaveLength(21);
    });

    it('implementa UN-02 e UN-03 senza valori aggiuntivi', () => {
        expect(propertyBillingPeriodCatalog).toEqual([
            { value: 'monthly', label: 'Mensile' }, { value: 'quarterly', label: 'Trimestrale' },
            { value: 'semiannual', label: 'Semestrale' }, { value: 'annual', label: 'Annuale' },
        ]);
        expect(propertyEnergyClassCatalog).toEqual(['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G']);
    });
});

describe('normalizzazione legacy conservativa', () => {
    it('canonicalizza valori e label inequivocabili', () => {
        expect(normalizeLegacyPropertyType('Appartamento')).toBe('appartamento');
        expect(normalizeLegacyPropertyRentType('Canone libero (4+4)')).toBe('canone_libero_4+4');
        expect(normalizeLegacyPropertyBillingPeriod('Mensile')).toBe('monthly');
        expect(normalizeLegacyPropertyBillingPeriod('quarterly')).toBe('quarterly');
        expect(normalizeLegacyPropertyEnergyClass('a4')).toBe('A4');
    });

    it('preserva valori sconosciuti e non interpreta monthly come contratto', () => {
        expect(normalizeLegacyPropertyRentType('monthly')).toBe('monthly');
        expect(normalizeLegacyPropertyRentType('contratto legacy')).toBe('contratto legacy');
        expect(normalizePropertyFormData(mutation({ PropertyRentType: 'monthly' })).PropertyRentType).toBe('monthly');
    });
});

describe('boundary stretta delle mutazioni Unit', () => {
    it('mantiene tollerante lo stato ma rende stretto il submit con BuildingId', () => {
        const emptyState = { ...mutation({ PropertyTypeID: '' }), PropertyBuildingId: 'building-1' };
        expect(propertyFormStateSchema.safeParse(emptyState).success).toBe(true);
        expect(propertyMutationFormStateSchema.safeParse(emptyState).success).toBe(false);
        expect(propertyMutationFormStateSchema.safeParse({ ...mutation(), PropertyBuildingId: 'building-1' }).success).toBe(true);
        expect(propertyMutationFormStateSchema.safeParse({ ...mutation({ PropertyRentType: 'monthly' }), PropertyBuildingId: '' }).success).toBe(false);
        expect(propertyMutationFormStateSchema.safeParse({ ...mutation({ PropertyBillingPeriod: 'weekly' }), PropertyBuildingId: '' }).success).toBe(false);
        expect(propertyMutationFormStateSchema.safeParse({ ...mutation({ PropertyEnergyConsumption2: 'A++' }), PropertyBuildingId: '' }).success).toBe(false);
        expect(propertyMutationFormStateSchema.safeParse({
            ...mutation({ PropertyRentType: '', PropertyBillingPeriod: '', PropertyEnergyConsumption2: '' }), PropertyBuildingId: '',
        }).success).toBe(true);
    });
    it.each(['', 'tipo_sconosciuto'])('rifiuta PropertyTypeID %j', (PropertyTypeID) => {
        expect(propertyMutationSchema.safeParse(mutation({ PropertyTypeID })).success).toBe(false);
    });

    it('accetta un PropertyTypeID canonico', () => {
        expect(propertyMutationSchema.safeParse(mutation()).success).toBe(true);
    });

    it.each(propertyRentTypeCatalog.map(({ value }) => value))('accetta il contratto %s', (PropertyRentType) => {
        expect(propertyMutationSchema.safeParse(mutation({ PropertyRentType })).success).toBe(true);
    });

    it.each(['', ...propertyBillingPeriodCatalog.map(({ value }) => value)])('accetta il periodo %j', (PropertyBillingPeriod) => {
        expect(propertyMutationSchema.safeParse(mutation({ PropertyBillingPeriod })).success).toBe(true);
    });

    it.each(['', ...propertyEnergyClassCatalog])('accetta la classe energetica %j', (PropertyEnergyConsumption2) => {
        expect(propertyMutationSchema.safeParse(mutation({ PropertyEnergyConsumption2 })).success).toBe(true);
    });

    it.each([
        ['PropertyRentType', 'monthly'], ['PropertyRentType', 'contratto legacy'],
        ['PropertyBillingPeriod', 'weekly'], ['PropertyEnergyConsumption2', 'A++'],
    ])('rifiuta %s=%s', (field, value) => {
        expect(propertyMutationSchema.safeParse(mutation({ [field]: value })).success).toBe(false);
    });
});
