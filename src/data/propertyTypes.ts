import type { PropertyType } from '../types/property';

export interface PropertyTypeOption {
    value: PropertyType;
    label: string;
}

export const propertyTypes: PropertyTypeOption[] = [
    { value: 'appartamento', label: 'Appartamento' },
    { value: 'negozio', label: 'Negozio' },
    { value: 'ufficio_condiviso', label: 'Ufficio condiviso' },
    { value: 'ufficio', label: 'Ufficio' },
    { value: 'roulotte', label: 'Roulotte' },
    { value: 'cantina', label: 'Cantina' },
    { value: 'chalet', label: 'Chalet' },
    { value: 'stanza', label: 'Stanza' },
    { value: 'commercio', label: 'Commercio' },
    { value: 'magazzino', label: 'Magazzino' },
    { value: 'garage', label: 'Garage' },
    { value: 'laboratorio', label: 'Laboratorio' },
    { value: 'locale_professionale', label: 'Locale professionale' },
    { value: 'casa', label: 'Casa' },
    { value: 'casa_di_citta', label: 'Casa di città' },
    { value: 'mansarda', label: 'Mansarda' },
    { value: 'casa_mobile', label: 'Casa mobile' },
    { value: 'parcheggio', label: 'Parcheggio' },
    { value: 'terreno', label: 'Terreno' },
    { value: 'nuda_proprieta', label: 'Nuda proprietà' },
    { value: 'altro', label: 'Altro' },
];
