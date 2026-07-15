import { z } from 'zod';
import type { DefaultValues } from 'react-hook-form';

// Schema di validazione per il form "Nuovo Inquilino"
// Validazione condizionale: persona richiede nome+cognome, società richiede nome società
export const tenantSchema = z.object({
    // Tipo inquilino
    TenantType: z.enum(['person', 'company']).default('person'),

    // Foto e colore
    TenantAvatarHexColor: z.string().optional(),

    // === Info personali (persona) ===
    TenantTitle: z.string().optional(),
    TenantFirstName: z.string().optional(),
    TenantMiddleName: z.string().optional(),
    TenantLastName: z.string().optional(),
    TenantBirthDate: z.string().optional(),
    TenantBirthPlace: z.string().optional(),
    TenantNationality: z.string().optional(),
    TenantFiscalCode: z.string().optional(),
    TenantVatNumberPersonal: z.string().optional(),

    // === Situazione professionale (persona) ===
    TenantProfession: z.string().optional(),
    TenantRevenus: z.coerce.number().min(0).optional(),

    // === Documento di identità (persona) ===
    TenantIDType: z.string().optional(),
    TenantIDNumber: z.string().optional(),
    TenantIDExpiry: z.string().optional(),

    // === Contatti ===
    TenantEmail: z.string().email("Formato email non valido").optional().or(z.literal('')),
    send_invite: z.boolean().default(false),
    TenantEmailSecond: z.string().email("Formato email non valido").optional().or(z.literal('')),
    TenantMobilePhoneNat: z.string().optional(),
    TenantPhoneNat: z.string().optional(),

    // === Indirizzo ===
    TenantAddress1: z.string().optional(),
    TenantAddress2: z.string().optional(),
    TenantCity: z.string().optional(),
    TenantZip: z.string().optional(),
    TenantState: z.string().optional(),
    TenantCountry: z.string().optional(),

    // === Info società (società) ===
    TenantCompanyName: z.string().optional(),
    TenantVatNumber: z.string().optional(),
    TenantSiret: z.string().optional(),
    TenantCapital: z.string().optional(),
    TenantCompanyDescription: z.string().optional(),

    // === Indirizzo di lavoro (persona) ===
    TenantProEmployer: z.string().optional(),
    TenantProAddress: z.string().optional(),
    TenantProCity: z.string().optional(),
    TenantProZip: z.string().optional(),
    TenantProState: z.string().optional(),
    TenantProCountry: z.string().optional(),
    TenantProPhoneNat: z.string().optional(),

    // === Coordinate bancarie ===
    TenantBankName: z.string().optional(),
    TenantBankAddress: z.string().optional(),
    TenantBankCity: z.string().optional(),
    TenantBankZip: z.string().optional(),
    TenantBankCountry: z.string().optional(),
    TenantBankIBAN: z.string()
        .regex(/^[a-zA-Z0-9 ]*$/, "IBAN: solo caratteri alfanumerici")
        .optional()
        .or(z.literal('')),
    TenantBankSwiftBic: z.string()
        .regex(/^[A-Z0-9]*$/i, "Swift/BIC: solo caratteri alfanumerici")
        .optional()
        .or(z.literal('')),

    // === Info aggiuntive ===
    TenantLeaveAddress: z.string().optional(),
    TenantNotes: z.string().optional(),
}).superRefine((data, ctx) => {
    // Validazione condizionale: persona richiede nome e cognome
    if (data.TenantType === 'person') {
        if (!data.TenantFirstName || data.TenantFirstName.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Il nome è obbligatorio",
                path: ['TenantFirstName'],
            });
        }
        if (!data.TenantLastName || data.TenantLastName.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Il cognome è obbligatorio",
                path: ['TenantLastName'],
            });
        }
    }

    // Validazione condizionale: società richiede nome società
    if (data.TenantType === 'company') {
        if (!data.TenantCompanyName || data.TenantCompanyName.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Il nome della società è obbligatorio",
                path: ['TenantCompanyName'],
            });
        }
    }

    // Se invito attivo, email obbligatoria
    if (data.send_invite && (!data.TenantEmail || data.TenantEmail.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "L'email è obbligatoria per inviare l'invito",
            path: ['TenantEmail'],
        });
    }
});

export type TenantFormData = z.infer<typeof tenantSchema>;

export const defaultTenantValues: DefaultValues<TenantFormData> = {
    TenantType: 'person',
    TenantAvatarHexColor: '#3b82f6',
    TenantTitle: '',
    TenantFirstName: '',
    TenantMiddleName: '',
    TenantLastName: '',
    TenantBirthDate: '',
    TenantBirthPlace: '',
    TenantNationality: '',
    TenantFiscalCode: '',
    TenantVatNumberPersonal: '',
    TenantProfession: '',
    TenantRevenus: undefined,
    TenantIDType: '',
    TenantIDNumber: '',
    TenantIDExpiry: '',
    TenantEmail: '',
    send_invite: false,
    TenantEmailSecond: '',
    TenantMobilePhoneNat: '',
    TenantPhoneNat: '',
    TenantAddress1: '',
    TenantAddress2: '',
    TenantCity: '',
    TenantZip: '',
    TenantState: '',
    TenantCountry: 'IT',
    TenantCompanyName: '',
    TenantVatNumber: '',
    TenantSiret: '',
    TenantCapital: '',
    TenantCompanyDescription: '',
    TenantProEmployer: '',
    TenantProAddress: '',
    TenantProCity: '',
    TenantProZip: '',
    TenantProState: '',
    TenantProCountry: '',
    TenantProPhoneNat: '',
    TenantBankName: '',
    TenantBankAddress: '',
    TenantBankCity: '',
    TenantBankZip: '',
    TenantBankCountry: '',
    TenantBankIBAN: '',
    TenantBankSwiftBic: '',
    TenantLeaveAddress: '',
    TenantNotes: '',
};
