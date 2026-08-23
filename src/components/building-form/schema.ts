import { z } from 'zod';
import type { BuildingRecord } from '../../db/database.types';
import type { BuildingCreateInput, BuildingUpdateInput } from '../../db/buildingRepository';

export const BUILDING_FEATURE_VALUES = [
    'Accesso per i disabili',
    "Addolcitore d'acqua",
    'Area attrezzata con giochi',
    'Allarme antincendio',
    'Irrigazione',
    'Balcone',
    'Barre per finestre',
    'Lavanderia in comune',
    'Cantina',
    'Camino',
    'Cassaforte',
    'Rivelatori di fumo',
    'Automazione domestica',
    'Produzione acqua calda centralizzata',
    'Fibra ottica',
    'Garage',
    'Sorvegliante',
    'Eliporto',
    'Jacuzzi',
    'Lavanderia',
    'Casa del custode',
    'Pannelli solari',
    'Piscina',
    'Porta blindata',
    'Sauna',
    'Spa',
    'Tende elettriche',
    'Videosorveglianza',
    'Parco giochi',
    'Termostato collegato',
    'Scivolo spazzatura',
    'Ventilazione meccanica',
    'Tapparelle elettriche',
    'Accesso Internet',
    'Aria condizionata',
    'Allarme',
    'Antenna TV collettiva',
    'Ascensore',
    'Barbecue',
    'Terminale per auto elettriche',
    'Cavo/fibra',
    'Riscaldamento centralizzato',
    'Cinema',
    'Concierge',
    'Digicode',
    'Doppi vetri',
    'Spazio verde / giardino',
    'Palestra',
    'Posto bici',
    'Golf',
    'Citofono',
    'Giardino',
    'Sala biciclette',
    'Zanzariere',
    'Parcheggio',
    'Cancelli elettrici',
    'Palazzetto dello sport',
    'Servizio di sicurezza',
    'Tende',
    'Sistema di sicurezza',
    'Tennis',
    'Terrazza',
    'Ventilazione',
    'Videotelefono',
    'Tapparelle',
] as const;

export type BuildingFeature = (typeof BUILDING_FEATURE_VALUES)[number];

const requiredString = (message: string) => z.string().trim().min(1, message);
const optionalString = z.string().trim().default('');

const numericInputPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

function nullableNonNegativeNumber(integer = false) {
    const numberSchema = integer
        ? z.number().finite('Inserisci un numero finito.').int('Inserisci un numero intero.')
        : z.number().finite('Inserisci un numero finito.');

    return z.preprocess((value) => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'string') {
            const normalized = value.trim();
            if (normalized === '') return null;
            if (!numericInputPattern.test(normalized)) return value;
            return Number(normalized);
        }
        return value;
    }, numberSchema.nonnegative('Il valore non può essere negativo.').nullable()).default(null);
}

function isIsoCalendarDate(value: string): boolean {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
}

const acquisitionDateSchema = z.string().trim().refine(
    (value) => value === '' || isIsoCalendarDate(value),
    'Inserisci una data valida nel formato YYYY-MM-DD.',
).default('');

const colorSchema = z.string().trim().toLowerCase().refine(
    (value) => value === '' || /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/.test(value),
    'Inserisci un colore hex nel formato #RGB o #RRGGBB.',
).default('');

const featureSchema = z.enum(BUILDING_FEATURE_VALUES);

export const buildingFormSchema = z.object({
    identifier: requiredString('Inserisci un identificativo.'),
    color: colorSchema,
    address: requiredString("Inserisci l'indirizzo dell'edificio."),
    address2: optionalString,
    city: requiredString('Inserisci la città.'),
    postalCode: requiredString('Inserisci il CAP.'),
    county: optionalString,
    state: optionalString,
    country: requiredString('Inserisci il paese.').transform((value) => value.toUpperCase()),
    size: nullableNonNegativeNumber(),
    constructionYear: nullableNonNegativeNumber(true),
    description: optionalString,
    privateNote: optionalString,
    features: z.preprocess(
        (value) => Array.isArray(value) ? [...new Set(value)] : value,
        z.array(featureSchema),
    ).default([]),
    acquisitionDate: acquisitionDateSchema,
    purchasePrice: nullableNonNegativeNumber(),
    acquisitionCosts: nullableNonNegativeNumber(),
    imu: nullableNonNegativeNumber(),
}).strict();

export type BuildingFormData = z.infer<typeof buildingFormSchema>;

export const defaultBuildingValues: BuildingFormData = {
    identifier: '',
    color: '',
    address: '',
    address2: '',
    city: '',
    postalCode: '',
    county: '',
    state: '',
    country: 'IT',
    size: null,
    constructionYear: null,
    description: '',
    privateNote: '',
    features: [],
    acquisitionDate: '',
    purchasePrice: null,
    acquisitionCosts: null,
    imu: null,
};

export function normalizeBuildingFormData(input: unknown): BuildingFormData {
    return buildingFormSchema.parse(input);
}

export function toBuildingCreateInput(data: BuildingFormData): BuildingCreateInput {
    return {
        identifier: data.identifier,
        color: data.color,
        address: data.address,
        address2: data.address2,
        city: data.city,
        postalCode: data.postalCode,
        county: data.county,
        state: data.state,
        country: data.country,
        size: data.size,
        constructionYear: data.constructionYear,
        description: data.description,
        privateNote: data.privateNote,
        features: [...data.features],
        acquisitionDate: data.acquisitionDate,
        purchasePrice: data.purchasePrice,
        acquisitionCosts: data.acquisitionCosts,
        imu: data.imu,
    };
}

export function toBuildingFormData(building: BuildingRecord): BuildingFormData {
    return {
        identifier: building.identifier,
        color: building.color,
        address: building.address,
        address2: building.address2,
        city: building.city,
        postalCode: building.postalCode,
        county: building.county,
        state: building.state,
        country: building.country,
        size: building.size,
        constructionYear: building.constructionYear,
        description: building.description,
        privateNote: building.privateNote,
        features: [...building.features] as BuildingFeature[],
        acquisitionDate: building.acquisitionDate,
        purchasePrice: building.purchasePrice,
        acquisitionCosts: building.acquisitionCosts,
        imu: building.imu,
    };
}

export function toBuildingUpdateInput(data: BuildingFormData): BuildingUpdateInput {
    return {
        identifier: data.identifier,
        color: data.color,
        address: data.address,
        address2: data.address2,
        city: data.city,
        postalCode: data.postalCode,
        county: data.county,
        state: data.state,
        country: data.country,
        size: data.size,
        constructionYear: data.constructionYear,
        description: data.description,
        privateNote: data.privateNote,
        features: [...data.features],
        acquisitionDate: data.acquisitionDate,
        purchasePrice: data.purchasePrice,
        acquisitionCosts: data.acquisitionCosts,
        imu: data.imu,
    };
}
