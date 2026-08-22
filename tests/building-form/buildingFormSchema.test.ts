import { describe, expect, it } from 'vitest';
import {
    BUILDING_FEATURE_VALUES,
    buildingFormSchema,
    defaultBuildingValues,
    normalizeBuildingFormData,
    toBuildingCreateInput,
} from '../../src/components/building-form/schema';

const APPROVED_FEATURES = [
    'Accesso per i disabili', "Addolcitore d'acqua", 'Area attrezzata con giochi',
    'Allarme antincendio', 'Irrigazione', 'Balcone', 'Barre per finestre',
    'Lavanderia in comune', 'Cantina', 'Camino', 'Cassaforte', 'Rivelatori di fumo',
    'Automazione domestica', 'Produzione acqua calda centralizzata', 'Fibra ottica',
    'Garage', 'Sorvegliante', 'Eliporto', 'Jacuzzi', 'Lavanderia', 'Casa del custode',
    'Pannelli solari', 'Piscina', 'Porta blindata', 'Sauna', 'Spa', 'Tende elettriche',
    'Videosorveglianza', 'Parco giochi', 'Termostato collegato', 'Scivolo spazzatura',
    'Ventilazione meccanica', 'Tapparelle elettriche', 'Accesso Internet',
    'Aria condizionata', 'Allarme', 'Antenna TV collettiva', 'Ascensore', 'Barbecue',
    'Terminale per auto elettriche', 'Cavo/fibra', 'Riscaldamento centralizzato',
    'Cinema', 'Concierge', 'Digicode', 'Doppi vetri', 'Spazio verde / giardino',
    'Palestra', 'Posto bici', 'Golf', 'Citofono', 'Giardino', 'Sala biciclette',
    'Zanzariere', 'Parcheggio', 'Cancelli elettrici', 'Palazzetto dello sport',
    'Servizio di sicurezza', 'Tende', 'Sistema di sicurezza', 'Tennis', 'Terrazza',
    'Ventilazione', 'Videotelefono', 'Tapparelle',
] as const;

const validInput = () => ({
    ...defaultBuildingValues,
    identifier: 'Edificio A',
    address: 'Via Roma 1',
    city: 'Roma',
    postalCode: '00100',
});

describe('building form contract', () => {
    it('espone default e set di campi esatti', () => {
        expect(defaultBuildingValues).toEqual({
            identifier: '', color: '', address: '', address2: '', city: '', postalCode: '',
            county: '', state: '', country: 'IT', size: null, constructionYear: null,
            description: '', privateNote: '', features: [], acquisitionDate: '',
            purchasePrice: null, acquisitionCosts: null, imu: null,
        });
        expect(Object.keys(buildingFormSchema.shape)).toEqual(Object.keys(defaultBuildingValues));
    });

    it.each(['identifier', 'address', 'city', 'postalCode', 'country'] as const)(
        'rifiuta %s vuoto o composto da whitespace',
        (field) => {
            expect(() => normalizeBuildingFormData({ ...validInput(), [field]: '' })).toThrow();
            expect(() => normalizeBuildingFormData({ ...validInput(), [field]: '   ' })).toThrow();
        },
    );

    it('normalizza gli spazi esterni senza alterare il testo interno', () => {
        const input = {
            ...validInput(), identifier: '  Edificio  A  ', address: '  Via Roma  1 ',
            description: '  prima  riga  ', privateNote: '  nota  interna  ', country: ' IT ',
        };
        const result = normalizeBuildingFormData(input);
        expect(result).toMatchObject({
            identifier: 'Edificio  A', address: 'Via Roma  1', description: 'prima  riga',
            privateNote: 'nota  interna', country: 'IT',
        });
        expect(input.identifier).toBe('  Edificio  A  ');
    });

    it('normalizza country in uppercase canonico', () => {
        expect(normalizeBuildingFormData({ ...validInput(), country: ' it ' }).country).toBe('IT');
        expect(normalizeBuildingFormData({ ...validInput(), country: 'it' }).country).toBe('IT');
    });

    it('accetta colore vuoto e normalizza hex validi', () => {
        expect(normalizeBuildingFormData(validInput()).color).toBe('');
        expect(normalizeBuildingFormData({ ...validInput(), color: ' #AbC ' }).color).toBe('#abc');
        expect(normalizeBuildingFormData({ ...validInput(), color: '#A1B2C3' }).color).toBe('#a1b2c3');
    });

    it.each(['red', '#abcd', '123456', '#ggg'])('rifiuta il colore arbitrario %s', (color) => {
        expect(() => normalizeBuildingFormData({ ...validInput(), color })).toThrow();
    });

    it.each(['size', 'constructionYear', 'purchasePrice', 'acquisitionCosts', 'imu'] as const)(
        'normalizza valori vuoti di %s a null',
        (field) => {
            for (const value of ['', '   ', null, undefined]) {
                expect(normalizeBuildingFormData({ ...validInput(), [field]: value })[field]).toBeNull();
            }
        },
    );

    it('converte stringhe numeriche HTML valide in number', () => {
        const result = normalizeBuildingFormData({
            ...validInput(), size: '12.5', constructionYear: '2001', purchasePrice: '1e3',
            acquisitionCosts: '250', imu: '0',
        });
        expect(result).toMatchObject({
            size: 12.5, constructionYear: 2001, purchasePrice: 1000, acquisitionCosts: 250, imu: 0,
        });
    });

    it.each(['testo', '12,5', '€ 10', '1.000,00'])('rifiuta testo numerico non autorizzato %s', (size) => {
        expect(() => normalizeBuildingFormData({ ...validInput(), size })).toThrow();
    });

    it.each([Number.NaN, Infinity, -Infinity])('rifiuta numero non finito %s', (size) => {
        expect(() => normalizeBuildingFormData({ ...validInput(), size })).toThrow();
    });

    it.each([-1, '-0.1'])('rifiuta numero negativo %s', (size) => {
        expect(() => normalizeBuildingFormData({ ...validInput(), size })).toThrow();
    });

    it('accetta constructionYear intero e rifiuta il decimale', () => {
        expect(normalizeBuildingFormData({ ...validInput(), constructionYear: 1999 }).constructionYear).toBe(1999);
        expect(() => normalizeBuildingFormData({ ...validInput(), constructionYear: 1999.5 })).toThrow();
    });

    it('valida acquisitionDate come data ISO calendaristicamente reale', () => {
        expect(normalizeBuildingFormData(validInput()).acquisitionDate).toBe('');
        expect(normalizeBuildingFormData({ ...validInput(), acquisitionDate: ' 2024-02-29 ' }).acquisitionDate)
            .toBe('2024-02-29');
        expect(() => normalizeBuildingFormData({ ...validInput(), acquisitionDate: '2023-02-29' })).toThrow();
        expect(() => normalizeBuildingFormData({ ...validInput(), acquisitionDate: '29/02/2024' })).toThrow();
    });

    it('espone esattamente il catalogo approvato', () => {
        expect(BUILDING_FEATURE_VALUES).toEqual(APPROVED_FEATURES);
    });

    it('rifiuta feature sconosciute e il legacy Sicuro', () => {
        expect(() => normalizeBuildingFormData({ ...validInput(), features: ['Sconosciuta'] })).toThrow();
        expect(() => normalizeBuildingFormData({ ...validInput(), features: ['Sicuro'] })).toThrow();
    });

    it('deduplica le feature preservando l ordine della prima occorrenza', () => {
        const input = { ...validInput(), features: ['Garage', 'Balcone', 'Garage', 'Cassaforte', 'Balcone'] };
        expect(normalizeBuildingFormData(input).features).toEqual(['Garage', 'Balcone', 'Cassaforte']);
        expect(input.features).toEqual(['Garage', 'Balcone', 'Garage', 'Cassaforte', 'Balcone']);
    });

    it('mappa esplicitamente tutti e soli i campi verso BuildingCreateInput', () => {
        const normalized = normalizeBuildingFormData({
            ...validInput(), color: '#ABC', address2: ' Scala A ', county: ' RM ', state: ' Lazio ',
            size: '100', constructionYear: '1980', description: ' Descrizione ',
            privateNote: ' Nota ', features: ['Garage', 'Cassaforte'], acquisitionDate: '2020-01-31',
            purchasePrice: '200000', acquisitionCosts: '10000', imu: '900',
        });
        const mapped = toBuildingCreateInput(normalized);
        expect(mapped).toEqual(normalized);
        expect(Object.keys(mapped)).toEqual(Object.keys(defaultBuildingValues));
        expect(mapped).not.toHaveProperty('id');
        expect(mapped).not.toHaveProperty('createdAt');
        expect(mapped).not.toHaveProperty('updatedAt');
        expect(mapped).not.toHaveProperty('archived');
        expect(mapped).not.toHaveProperty('unitsCount');
    });

    it('non muta il form e clona l array features nel mapping', () => {
        const data = normalizeBuildingFormData({ ...validInput(), features: ['Garage'] });
        const before = structuredClone(data);
        const mapped = toBuildingCreateInput(data);
        expect(data).toEqual(before);
        expect(mapped.features).not.toBe(data.features);
        mapped.features?.push('Balcone');
        expect(data.features).toEqual(['Garage']);
    });

    it('rifiuta campi managed o fuori contratto', () => {
        expect(() => normalizeBuildingFormData({ ...validInput(), id: 'building-1' })).toThrow();
        expect(() => normalizeBuildingFormData({ ...validInput(), status: 'active' })).toThrow();
    });
});
