import { z } from 'zod';
import type { DefaultValues } from 'react-hook-form';

// Schema base per le validazioni del form "Nuova Unità"
export const propertySchema = z.object({
    // TAB 1: Informazioni generali
    PropertyTypeID: z.string().min(1, "Seleziona un tipo di proprietà"),

    PropertyTitle: z.string().min(1, "L'identificativo è obbligatorio"),

    PropertyAvatarHexColor: z.string().optional(),

    PropertyAddress: z.string().min(1, "L'indirizzo è obbligatorio"),

    PropertyAddress2: z.string().optional(),
    PropertyFloor: z.string().optional(),
    PropertyDoorNum: z.string().optional(),

    PropertyCity: z.string().min(1, "La città è obbligatoria"),

    PropertyPostalCode: z.string().min(1, "Il CAP è obbligatorio"),

    PropertyCounty: z.string().optional(),
    PropertyState: z.string().optional(),

    PropertyCountry: z.string().min(1, "Il Paese è obbligatorio").default("IT"),

    PropertySize: z.coerce.number().min(0).optional(),
    PropertyRoomsNum: z.coerce.number().min(0).optional(),
    PropertyRoomsNumChambres: z.coerce.number().min(0).optional(),
    PropertyRoomsNumBaths: z.coerce.number().min(0).optional(),
    PropertyComments: z.string().optional(),

    PropertyStatusManual: z.string().default("0"),
    PropertyRentType: z.string().optional(),
    PropertyRent: z.coerce.number().min(0).optional(),
    PropertyMaintenance: z.coerce.number().min(0).optional(),
    PropertyBillingPeriod: z.string().optional(),

    PropertyEnergyConsumption2: z.string().optional(),
    PropertyEnergyConsumptionIndex2: z.string().optional(),
    PropertyEnergyConsumptionAmountFrom2: z.coerce.number().optional(),
    PropertyEnergyConsumptionAmountTo2: z.coerce.number().optional(),
    PropertyEnergyConsumptionYear2: z.string().optional(),

    PropertyCommentsNew: z.string().optional(),

    // Toggles e altre sezioni (TAB 2)
    PropertyFurnished: z.boolean().default(false),
    PropertySmokers: z.boolean().default(false),
    PropertyAnimals: z.boolean().default(false),

    // Aggiungeremo i campi specifici degli altri tab dinamicamente
    // mantenendo uno schema per-tab per gestire la navigazione/validazione
}).passthrough(); // passthrough per permettere campi non ancora definiti

export type PropertyFormData = z.infer<typeof propertySchema>;

export const defaultPropertyValues: DefaultValues<PropertyFormData> = {
    PropertyTypeID: "",
    PropertyTitle: "Nuova proprietà",
    PropertyCountry: "IT",
    PropertyStatusManual: "0",
    PropertyFurnished: false,
    PropertySmokers: false,
    PropertyAnimals: false,
};
