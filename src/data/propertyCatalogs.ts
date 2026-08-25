export const propertyTypeCatalog = [
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
] as const;

export const propertyRentTypeCatalog = [
    { value: 'canone_libero_4+4', label: 'Canone libero (4+4)' },
    { value: 'canone_libero_4+4_con_cedolare_secca', label: 'Canone libero (4+4) con cedolare secca' },
    { value: 'canone_concordato_3+2', label: 'Canone concordato (3+2)' },
    { value: 'canone_concordato_3+2_con_cedolare_secca', label: 'Canone concordato (3+2) con cedolare secca' },
    { value: 'canone_concordato_4+2_con_cedolare_secca', label: 'Canone concordato (4+2) con cedolare secca' },
    { value: 'canone_concordato_5+2_con_cedolare_secca', label: 'Canone concordato (5+2) con cedolare secca' },
    { value: 'canone_concordato_6+2_con_cedolare_secca', label: 'Canone concordato (6+2) con cedolare secca' },
    { value: 'turistico', label: 'Turistico' },
    { value: 'turistico_con_cedolare', label: 'Turistico con cedolare' },
    { value: 'parziale', label: 'Parziale' },
    { value: 'parziale_transitoria', label: 'Parziale transitoria' },
    { value: 'transitorio', label: 'Transitorio' },
    { value: 'transitorio_con_cedolare_secca', label: 'Transitorio con cedolare secca' },
    { value: 'studenti', label: 'Studenti' },
    { value: 'studenti_con_cedolare_secca', label: 'Studenti con cedolare secca' },
    { value: 'uso_commerciale_6+6', label: 'Uso commerciale 6+6' },
    { value: 'uso_commerciale_9+9', label: 'Uso commerciale 9+9' },
    { value: 'uso_commerciale_6+2', label: 'Uso commerciale 6+2' },
    { value: 'comodato_usufrutto', label: 'Comodato / Usufrutto' },
    { value: 'sublocazione', label: 'Sublocazione' },
    { value: 'uso_foresteria', label: 'Uso foresteria' },
] as const;

export const propertyBillingPeriodCatalog = [
    { value: 'monthly', label: 'Mensile' },
    { value: 'quarterly', label: 'Trimestrale' },
    { value: 'semiannual', label: 'Semestrale' },
    { value: 'annual', label: 'Annuale' },
] as const;

export const propertyEnergyClassCatalog = ['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G'] as const;

export type PropertyType = typeof propertyTypeCatalog[number]['value'];
export type PropertyRentType = typeof propertyRentTypeCatalog[number]['value'];
export type PropertyBillingPeriod = typeof propertyBillingPeriodCatalog[number]['value'];
export type PropertyEnergyClass = typeof propertyEnergyClassCatalog[number];

function normalizeCatalogValue<T extends string>(value: unknown, catalog: readonly { value: T; label: string }[]): string {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    const normalized = trimmed.toLocaleLowerCase('it-IT').replace(/\s+/g, ' ');
    return catalog.find((option) => option.value.toLocaleLowerCase('it-IT') === normalized
        || option.label.toLocaleLowerCase('it-IT') === normalized)?.value ?? trimmed;
}

export const normalizeLegacyPropertyType = (value: unknown): string => normalizeCatalogValue(value, propertyTypeCatalog);
export const normalizeLegacyPropertyRentType = (value: unknown): string => normalizeCatalogValue(value, propertyRentTypeCatalog);
export const normalizeLegacyPropertyBillingPeriod = (value: unknown): string => normalizeCatalogValue(value, propertyBillingPeriodCatalog);

export function normalizeLegacyPropertyEnergyClass(value: unknown): string {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    return propertyEnergyClassCatalog.find((item) => item.toLowerCase() === trimmed.toLowerCase()) ?? trimmed;
}

export const propertyTypeValues = propertyTypeCatalog.map(({ value }) => value);
export const propertyRentTypeValues = propertyRentTypeCatalog.map(({ value }) => value);
export const propertyBillingPeriodValues = propertyBillingPeriodCatalog.map(({ value }) => value);

function catalogLabel(value: unknown, catalog: readonly { value: string; label: string }[], normalize: (value: unknown) => string): string {
    const normalized = normalize(value);
    return catalog.find((option) => option.value === normalized)?.label ?? normalized;
}

export const getPropertyTypeLabel = (value: unknown) => catalogLabel(value, propertyTypeCatalog, normalizeLegacyPropertyType);
export const getPropertyRentTypeLabel = (value: unknown) => catalogLabel(value, propertyRentTypeCatalog, normalizeLegacyPropertyRentType);
export const getPropertyBillingPeriodLabel = (value: unknown) => catalogLabel(value, propertyBillingPeriodCatalog, normalizeLegacyPropertyBillingPeriod);
export const getPropertyEnergyClassLabel = (value: unknown) => normalizeLegacyPropertyEnergyClass(value);
