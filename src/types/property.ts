// === STATUS & TYPE ENUMS ===

export type PropertyStatus =
    | 'disponibile'
    | 'affittato'
    | 'preavviso'
    | 'ricerca_inquilini'
    | 'non_disponibile'
    | 'lavori';

export type PropertyType =
    | 'appartamento'
    | 'negozio'
    | 'ufficio_condiviso'
    | 'ufficio'
    | 'roulotte'
    | 'cantina'
    | 'chalet'
    | 'stanza'
    | 'commercio'
    | 'magazzino'
    | 'garage'
    | 'laboratorio'
    | 'locale_professionale'
    | 'casa'
    | 'casa_di_citta'
    | 'mansarda'
    | 'casa_mobile'
    | 'parcheggio'
    | 'terreno'
    | 'nuda_proprieta'
    | 'altro';

export type OccupancyFilter = 'all' | 'affittato' | 'non_affittato';

export type VisibilityStatus = 'pubblicato' | 'nascosto';

// === MAIN INTERFACES ===

export interface Property {
    id: string;
    title: string;
    address: string;
    type: PropertyType;
    surface: number | null;       // m²
    rooms: number | null;
    tenant: string | null;
    rent: number | null;          // €/mese
    assetValue: number | null;    // valore patrimoniale €
    status: PropertyStatus;
    visibility: VisibilityStatus;
    archived: boolean;
}

export interface PropertyStats {
    rentedCount: number;
    rentalValue: number;
    assetValue: number;
}

export interface FilterState {
    typeId: PropertyType | '';
    occupied: OccupancyFilter;
    status: PropertyStatus | '';
    query: string;
}

// === STATUS DISPLAY CONFIG ===

export interface StatusConfig {
    label: string;
    color: string;       // tailwind bg class
    textColor: string;   // tailwind text class
}

export const STATUS_CONFIG: Record<PropertyStatus, StatusConfig> = {
    disponibile: { label: 'Disponibile', color: 'bg-green-100', textColor: 'text-green-700' },
    affittato: { label: 'Affittato', color: 'bg-blue-100', textColor: 'text-blue-700' },
    preavviso: { label: 'Preavviso / Uscita', color: 'bg-yellow-100', textColor: 'text-yellow-700' },
    ricerca_inquilini: { label: 'Ricerca inquilini', color: 'bg-purple-100', textColor: 'text-purple-700' },
    non_disponibile: { label: 'Non disponibile', color: 'bg-red-100', textColor: 'text-red-700' },
    lavori: { label: 'Lavori', color: 'bg-orange-100', textColor: 'text-orange-700' },
};
