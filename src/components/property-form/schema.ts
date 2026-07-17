import { z } from 'zod';
import type { DefaultValues } from 'react-hook-form';

const emptyToNullNumber = (minimum = 0) => z.preprocess((value) => {
    if (value === '' || value === undefined || value === null) return null;
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? value : numberValue;
}, z.number().min(minimum).nullable());

const stringField = z.string().default('');
const booleanField = z.boolean().default(false);

export const storedLocalFileSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number(),
    lastModified: z.number(),
    dataUrl: z.string(),
});

export const propertyKeySchema = z.object({
    id: z.string(),
    description: stringField,
    number: stringField,
    quantity: emptyToNullNumber(1).default(1),
    holder: stringField,
    comments: stringField,
});

export const propertyContractSchema = z.object({
    id: z.string(),
    type: stringField,
    description: stringField,
    releaseDate: stringField,
    expiryDate: stringField,
    comments: stringField,
    file: storedLocalFileSchema.nullable().default(null),
});

export const propertyContactSchema = z.object({
    id: z.string(),
    firstName: stringField,
    lastName: stringField,
    profession: stringField,
    email: stringField,
    phone: stringField,
    comments: stringField,
});

export const propertyDocumentSchema = z.object({
    id: z.string(),
    type: stringField,
    description: stringField,
    releaseDate: stringField,
    comments: stringField,
    shared: booleanField,
    file: storedLocalFileSchema.nullable().default(null),
});

export const propertySchema = z.object({
    PropertyTypeID: stringField,
    PropertyTitle: z.string().min(1, 'Inserisci un identificativo.').default(''),
    PropertyAvatarHexColor: stringField,
    PropertyAddress: z.string().min(1, "Inserisci l'indirizzo della proprietà.").default(''),
    PropertyAddress2: stringField,
    PropertyFloor: stringField,
    PropertyDoorNum: stringField,
    PropertyCity: z.string().min(1, "Inserisci la città.").default(''),
    PropertyPostalCode: z.string().min(1, 'Inserisci il CAP.').default(''),
    PropertyCounty: stringField,
    PropertyState: stringField,
    PropertyCountry: z.string().default('IT'),
    PropertySize: emptyToNullNumber(0),
    PropertyRoomsNum: emptyToNullNumber(0),
    PropertyRoomsNumChambres: emptyToNullNumber(0),
    PropertyRoomsNumBaths: emptyToNullNumber(0),
    PropertyComments: stringField,
    PropertyStatusManual: z.string().default('0'),
    PropertyRentType: stringField,
    PropertyRent: emptyToNullNumber(0),
    PropertyMaintenance: emptyToNullNumber(0),
    PropertyBillingPeriod: stringField,
    PropertyEnergyConsumption2: stringField,
    PropertyEnergyConsumptionIndex2: stringField,
    PropertyEnergyConsumptionAmountFrom2: emptyToNullNumber(0),
    PropertyEnergyConsumptionAmountTo2: emptyToNullNumber(0),
    PropertyEnergyConsumptionYear2: stringField,
    PropertyCommentsNew: stringField,
    PropertyFurnished: booleanField,
    PropertySmokers: booleanField,
    PropertyAnimals: booleanField,
    PropertyEquipment: z.array(z.string()).default([]),
    PropertyParking: stringField,
    PropertyOtherExpenses: stringField,
    PropertyCave: stringField,
    PropertyLot: stringField,
    PropertyThousandths: stringField,
    PropertyCadastreSheet: stringField,
    PropertyCadastrePart: stringField,
    PropertyCadastreSub: stringField,
    PropertyUrbanSection: stringField,
    PropertyCadastreCat: stringField,
    PropertyCadastralIncome: stringField,
    PropertyCadastralIncomeDataZone: stringField,
    PropertyCadastralIncomeDataClass: stringField,
    PropertyCadastralIncomeDataEntry: stringField,
    PropertyCadastralIncomeDataConsistencyRooms: stringField,
    PropertyAcquisitionDate: stringField,
    PropertyInitialPrice: emptyToNullNumber(0),
    PropertyAcquisitionCosts: emptyToNullNumber(0),
    PropertyAgencyCosts: emptyToNullNumber(0),
    PropertyCurrentValue: emptyToNullNumber(0),
    PropertySalePrice: emptyToNullNumber(0),
    PropertyFiscalCode: stringField,
    PropertyKeys: z.array(propertyKeySchema).default([]),
    PropertyContracts: z.array(propertyContractSchema).default([]),
    PropertyPublicDescription: stringField,
    PropertyHouseRules: stringField,
    PropertyPublic: booleanField,
    PropertyPublicAddress: booleanField,
    PropertyPublicPhone: booleanField,
    PropertyPhotos: z.array(storedLocalFileSchema).default([]),
    PropertyContacts: z.array(propertyContactSchema).default([]),
    PropertyDocuments: z.array(propertyDocumentSchema).default([]),
});

export type StoredLocalFile = z.infer<typeof storedLocalFileSchema>;
export type PropertyKeyFormData = z.infer<typeof propertyKeySchema>;
export type PropertyContractFormData = z.infer<typeof propertyContractSchema>;
export type PropertyContactFormData = z.infer<typeof propertyContactSchema>;
export type PropertyDocumentFormData = z.infer<typeof propertyDocumentSchema>;
export type PropertyFormData = z.infer<typeof propertySchema>;
export const propertyDraftSchema = propertySchema.extend({
    PropertyAddress: stringField,
    PropertyCity: stringField,
    PropertyPostalCode: stringField,
}).partial();

export const defaultPropertyValues: DefaultValues<PropertyFormData> = {
    PropertyTypeID: '',
    PropertyTitle: '',
    PropertyAvatarHexColor: '',
    PropertyAddress: '',
    PropertyAddress2: '',
    PropertyFloor: '',
    PropertyDoorNum: '',
    PropertyCity: '',
    PropertyPostalCode: '',
    PropertyCounty: '',
    PropertyState: '',
    PropertyCountry: 'IT',
    PropertySize: null,
    PropertyRoomsNum: null,
    PropertyRoomsNumChambres: null,
    PropertyRoomsNumBaths: null,
    PropertyComments: '',
    PropertyStatusManual: '0',
    PropertyRentType: '',
    PropertyRent: null,
    PropertyMaintenance: null,
    PropertyBillingPeriod: '',
    PropertyEnergyConsumption2: '',
    PropertyEnergyConsumptionIndex2: '',
    PropertyEnergyConsumptionAmountFrom2: null,
    PropertyEnergyConsumptionAmountTo2: null,
    PropertyEnergyConsumptionYear2: '',
    PropertyCommentsNew: '',
    PropertyFurnished: false,
    PropertySmokers: false,
    PropertyAnimals: false,
    PropertyEquipment: [],
    PropertyParking: '',
    PropertyOtherExpenses: '',
    PropertyCave: '',
    PropertyLot: '',
    PropertyThousandths: '',
    PropertyCadastreSheet: '',
    PropertyCadastrePart: '',
    PropertyCadastreSub: '',
    PropertyUrbanSection: '',
    PropertyCadastreCat: '',
    PropertyCadastralIncome: '',
    PropertyCadastralIncomeDataZone: '',
    PropertyCadastralIncomeDataClass: '',
    PropertyCadastralIncomeDataEntry: '',
    PropertyCadastralIncomeDataConsistencyRooms: '',
    PropertyAcquisitionDate: '',
    PropertyInitialPrice: null,
    PropertyAcquisitionCosts: null,
    PropertyAgencyCosts: null,
    PropertyCurrentValue: null,
    PropertySalePrice: null,
    PropertyFiscalCode: '',
    PropertyKeys: [],
    PropertyContracts: [],
    PropertyPublicDescription: '',
    PropertyHouseRules: '',
    PropertyPublic: false,
    PropertyPublicAddress: false,
    PropertyPublicPhone: false,
    PropertyPhotos: [],
    PropertyContacts: [],
    PropertyDocuments: [],
};

export function normalizePropertyFormData(data: unknown): PropertyFormData {
    return propertySchema.parse({
        ...defaultPropertyValues,
        ...(typeof data === 'object' && data !== null ? data : {}),
    });
}

export function normalizePropertyDraft(data: unknown): PropertyFormData {
    return propertyDraftSchema.parse({
        ...defaultPropertyValues,
        ...(typeof data === 'object' && data !== null ? data : {}),
    }) as PropertyFormData;
}
