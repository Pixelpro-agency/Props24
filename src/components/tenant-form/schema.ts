import { z } from 'zod';
import type { DefaultValues } from 'react-hook-form';

const stringField = z.string().default('');
const booleanField = z.boolean().default(false);
export const MAX_TENANT_PHOTO_BYTES = 1 * 1024 * 1024;
export const MAX_TENANT_DOCUMENT_BYTES = 2 * 1024 * 1024;
export const MAX_TENANT_TOTAL_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const nullableNumberField = z.preprocess((value) => {
    if (value === '' || value === undefined || value === null) return null;
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? value : numberValue;
}, z.number().min(0).nullable().default(null));

export const tenantStoredFileSchema = z.object({
    id: stringField,
    name: stringField,
    type: stringField,
    size: z.number().default(0),
    lastModified: z.number().default(0),
    dataUrl: stringField,
}).nullable().default(null);

export const tenantGuarantorSchema = z.object({
    id: stringField,
    contactType: z.enum(['person', 'company']).default('person'),
    companyName: stringField,
    firstName: stringField,
    lastName: stringField,
    birthDate: stringField,
    birthPlace: stringField,
    email: z.string().email('Formato email non valido').or(z.literal('')).default(''),
    phone: stringField,
    address: stringField,
    city: stringField,
    zip: stringField,
    country: stringField,
    comments: stringField,
});

export const tenantEmergencyContactSchema = z.object({
    id: stringField,
    contactType: z.enum(['person', 'company']).default('person'),
    companyName: stringField,
    firstName: stringField,
    lastName: stringField,
    email: z.string().email('Formato email non valido').or(z.literal('')).default(''),
    phone: stringField,
    address: stringField,
    city: stringField,
    zip: stringField,
    country: stringField,
    comments: stringField,
    isPrimary: booleanField,
});

export const tenantDocumentSchema = z.object({
    id: stringField,
    existingDocumentId: stringField.optional(),
    fileName: stringField,
    categoryId: z.number().default(1),
    categoryLabel: stringField,
    description: stringField.optional(),
    uploadDate: stringField,
    fileSize: z.number().default(0),
    isShared: booleanField,
    fileUrl: stringField,
    file: tenantStoredFileSchema,
});

const tenantBaseSchema = z.object({
    TenantType: z.enum(['person', 'company']).default('person'),
    TenantPhoto: tenantStoredFileSchema,
    TenantAvatarHexColor: stringField,
    TenantTitle: stringField,
    TenantFirstName: stringField,
    TenantMiddleName: stringField,
    TenantLastName: stringField,
    TenantBirthDate: stringField,
    TenantBirthPlace: stringField,
    TenantNationality: stringField,
    TenantFiscalCode: stringField,
    TenantVatNumberPersonal: stringField,
    TenantProfession: stringField,
    TenantRevenus: nullableNumberField,
    TenantIDType: stringField,
    TenantIDNumber: stringField,
    TenantIDExpiry: stringField,
    TenantIDCard: tenantStoredFileSchema,
    TenantEmail: z.string().email('Formato email non valido').or(z.literal('')).default(''),
    TenantEmailSecond: z.string().email('Formato email non valido').or(z.literal('')).default(''),
    TenantMobilePhoneNat: stringField,
    TenantPhoneNat: stringField,
    TenantAddress1: stringField,
    TenantAddress2: stringField,
    TenantCity: stringField,
    TenantZip: stringField,
    TenantState: stringField,
    TenantCountry: stringField,
    TenantCompanyName: stringField,
    TenantVatNumber: stringField,
    TenantSiret: stringField,
    TenantCapital: stringField,
    TenantCompanyDescription: stringField,
    TenantProEmployer: stringField,
    TenantProAddress: stringField,
    TenantProCity: stringField,
    TenantProZip: stringField,
    TenantProState: stringField,
    TenantProCountry: stringField,
    TenantProPhoneNat: stringField,
    TenantBankName: stringField,
    TenantBankAddress: stringField,
    TenantBankCity: stringField,
    TenantBankZip: stringField,
    TenantBankCountry: stringField,
    TenantBankIBAN: z.string().regex(/^[a-zA-Z0-9 ]*$/, 'IBAN: solo caratteri alfanumerici').or(z.literal('')).default(''),
    TenantBankSwiftBic: z.string().regex(/^[A-Z0-9]*$/i, 'Swift/BIC: solo caratteri alfanumerici').or(z.literal('')).default(''),
    TenantLeaveAddress: stringField,
    TenantNotes: stringField,
    TenantGuarantors: z.array(tenantGuarantorSchema).default([]),
    TenantEmergencyContacts: z.array(tenantEmergencyContactSchema).default([]),
    TenantDocuments: z.array(tenantDocumentSchema).default([]),
});

export const tenantSchema = tenantBaseSchema.superRefine((data, ctx) => {
    if (data.TenantType === 'person') {
        if (!data.TenantFirstName.trim()) {
            ctx.addIssue({
                code: 'custom',
                path: ['TenantFirstName'],
                message: 'Inserisci il nome del locatario',
            });
        }
        if (!data.TenantLastName.trim()) {
            ctx.addIssue({
                code: 'custom',
                path: ['TenantLastName'],
                message: 'Inserisci il cognome del locatario',
            });
        }
        return;
    }

    if (!data.TenantCompanyName.trim()) {
        ctx.addIssue({
            code: 'custom',
            path: ['TenantCompanyName'],
            message: 'Inserisci il nome della società',
        });
    }
});

export type TenantFormData = z.infer<typeof tenantSchema>;

export const tenantDraftSchema = tenantBaseSchema.partial();

export function calculateTenantAttachmentBytes(data: Partial<TenantFormData>): number {
    const files = [
        data.TenantPhoto,
        data.TenantIDCard,
        ...(data.TenantDocuments || []).map((document) => document.file),
    ].filter((file): file is NonNullable<typeof file> => Boolean(file));
    return files.reduce((total, file) => total + JSON.stringify(file).length, 0);
}

export const defaultTenantValues: DefaultValues<TenantFormData> = {
    TenantType: 'person',
    TenantPhoto: null,
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
    TenantRevenus: null,
    TenantIDType: '',
    TenantIDNumber: '',
    TenantIDExpiry: '',
    TenantIDCard: null,
    TenantEmail: '',
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
    TenantGuarantors: [],
    TenantEmergencyContacts: [],
    TenantDocuments: [],
};

export function normalizeTenantFormData(data: unknown): TenantFormData {
    return tenantSchema.parse({
        ...defaultTenantValues,
        ...(typeof data === 'object' && data !== null ? data : {}),
    });
}

export function normalizeTenantDraft(data: unknown): TenantFormData {
    return tenantDraftSchema.parse({
        ...defaultTenantValues,
        ...(typeof data === 'object' && data !== null ? data : {}),
    }) as TenantFormData;
}
