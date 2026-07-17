import { z } from 'zod';
import { getLeaseTypeById, normalizeLeaseTypeId } from '../data/leaseTypes';

const billingPeriods = ['weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'] as const;
export type LeaseBillingPeriod = typeof billingPeriods[number];

const numberField = z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
}, z.number().min(0));

const paymentDayField = z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return 1;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
}, z.number().int().min(1, 'Il giorno di pagamento deve essere tra 1 e 31.').max(31, 'Il giorno di pagamento deve essere tra 1 e 31.'));

const stringArrayField = z.preprocess((value) => {
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
    return [];
}, z.array(z.string()).default([]));

export const paymentItemSchema = z.object({
    LeasePaymentItems_Amount: numberField.default(0),
    LeasePaymentItems_TaxPercent: numberField.default(0),
    LeasePaymentItems_Type: z.string().default('recurring'),
    LeasePaymentItems_Description: z.string().default(''),
});

export const defaultLeaseValues = {
    PropertyID: '',
    LeaseType: '',
    LeaseIdentificativo: 'Nuova locazione',
    LeaseNumeroRegistrazione: '',
    LeaseTenantIds: [] as string[],
    LeaseGarantIds: [] as string[],
    LeaseStartDate: '',
    LeaseEndDate: '',
    LeaseDurationType: 'fixed',
    LeaseRinnovoTacito: false,
    LeaseBillingPeriod: 'monthly' as LeaseBillingPeriod,
    LeasePaymentTiming: 'anticipato' as 'anticipato' | 'arretrato',
    LeasePaymentMethod: '',
    LeasePaymentDay: 1,
    LeaseRentHC: 0,
    LeaseMaintenance: 0,
    LeaseSpeseType: 'anticipo',
    LeaseMonthlyAmount: 0,
    LeaseVatType: '0',
    LeaseVatPercent: 0,
    LeaseIrpfType: '0',
    LeaseIrpfPercent: 0,
    LeaseIrpfAmount: 0,
    PaymentItems: [] as z.infer<typeof paymentItemSchema>[],
    LeaseFirstBill: false,
    LeaseFirstBillEndDate: '',
    LeaseFirstBillAmount: 0,
    LeaseFirstBillCharges: 0,
    LeaseDeposit: 0,
    LeaseDepositType: 'trattenuto',
    LeaseDepositDocument: '',
    LeaseDepositDate: '',
    LeasePrepaidRent: 0,
    LeaseUpdateType: 'nessuno',
    LeaseUpdateIndex: '',
    LeaseUpdateAuto: false,
    LeaseUpdatePeriod: 'annual',
    LeaseUpdateDateType: 'anniversario',
    LeaseUpdateDateSpecific: '',
    LeaseIrlIndex: '',
    LeaseIlcIndex: '',
    LeaseIccIndex: '',
};

const baseLeaseFormSchema = z.object({
    PropertyID: z.string().default(''),
    LeaseType: z.string().default(''),
    LeaseIdentificativo: z.string().default(defaultLeaseValues.LeaseIdentificativo),
    LeaseNumeroRegistrazione: z.string().default(''),
    LeaseTenantIds: stringArrayField,
    LeaseGarantIds: stringArrayField,
    LeaseStartDate: z.string().default(''),
    LeaseEndDate: z.string().default(''),
    LeaseDurationType: z.string().default('fixed'),
    LeaseRinnovoTacito: z.boolean().default(false),
    LeaseBillingPeriod: z.enum(billingPeriods).default('monthly'),
    LeasePaymentTiming: z.enum(['anticipato', 'arretrato']).default('anticipato'),
    LeasePaymentMethod: z.string().default(''),
    LeasePaymentDay: paymentDayField.default(1),
    LeaseRentHC: numberField.default(0),
    LeaseMaintenance: numberField.default(0),
    LeaseSpeseType: z.string().default('anticipo'),
    LeaseMonthlyAmount: numberField.default(0),
    LeaseVatType: z.string().default('0'),
    LeaseVatPercent: numberField.default(0),
    LeaseIrpfType: z.string().default('0'),
    LeaseIrpfPercent: numberField.default(0),
    LeaseIrpfAmount: numberField.default(0),
    PaymentItems: z.array(paymentItemSchema).default([]),
    LeaseFirstBill: z.boolean().default(false),
    LeaseFirstBillEndDate: z.string().default(''),
    LeaseFirstBillAmount: numberField.default(0),
    LeaseFirstBillCharges: numberField.default(0),
    LeaseDeposit: numberField.default(0),
    LeaseDepositType: z.string().default('trattenuto'),
    LeaseDepositDocument: z.string().default(''),
    LeaseDepositDate: z.string().default(''),
    LeasePrepaidRent: numberField.default(0),
    LeaseUpdateType: z.string().default('nessuno'),
    LeaseUpdateIndex: z.string().default(''),
    LeaseUpdateAuto: z.boolean().default(false),
    LeaseUpdatePeriod: z.string().default('annual'),
    LeaseUpdateDateType: z.string().default('anniversario'),
    LeaseUpdateDateSpecific: z.string().default(''),
    LeaseIrlIndex: z.string().default(''),
    LeaseIlcIndex: z.string().default(''),
    LeaseIccIndex: z.string().default(''),
});

function isIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const leaseFormSchema = baseLeaseFormSchema.superRefine((data, ctx) => {
    if (!data.PropertyID) ctx.addIssue({ code: 'custom', path: ['PropertyID'], message: 'Seleziona una proprietà.' });
    if (!data.LeaseType) ctx.addIssue({ code: 'custom', path: ['LeaseType'], message: 'Seleziona un tipo di locazione.' });
    if (data.LeaseTenantIds.length === 0) ctx.addIssue({ code: 'custom', path: ['LeaseTenantIds'], message: 'Aggiungi almeno un inquilino.' });
    if (!isIsoDate(data.LeaseStartDate)) ctx.addIssue({ code: 'custom', path: ['LeaseStartDate'], message: 'Inserisci la data di inizio.' });
    if (!isIsoDate(data.LeaseEndDate)) ctx.addIssue({ code: 'custom', path: ['LeaseEndDate'], message: 'Inserisci la data di fine.' });
    if (isIsoDate(data.LeaseStartDate) && isIsoDate(data.LeaseEndDate) && data.LeaseEndDate < data.LeaseStartDate) {
        ctx.addIssue({ code: 'custom', path: ['LeaseEndDate'], message: 'La data di fine deve essere successiva o uguale alla data di inizio.' });
    }
    if (new Set(data.LeaseTenantIds).size !== data.LeaseTenantIds.length) {
        ctx.addIssue({ code: 'custom', path: ['LeaseTenantIds'], message: 'Lo stesso inquilino è selezionato più volte.' });
    }
    if (data.LeaseFirstBill) {
        if (!isIsoDate(data.LeaseFirstBillEndDate)) ctx.addIssue({ code: 'custom', path: ['LeaseFirstBillEndDate'], message: 'Inserisci la fine della prima ricevuta.' });
        if (isIsoDate(data.LeaseFirstBillEndDate) && isIsoDate(data.LeaseStartDate) && data.LeaseFirstBillEndDate < data.LeaseStartDate) {
            ctx.addIssue({ code: 'custom', path: ['LeaseFirstBillEndDate'], message: 'La prima ricevuta deve finire dopo l’inizio della locazione.' });
        }
        if (isIsoDate(data.LeaseFirstBillEndDate) && isIsoDate(data.LeaseEndDate) && data.LeaseFirstBillEndDate > data.LeaseEndDate) {
            ctx.addIssue({ code: 'custom', path: ['LeaseFirstBillEndDate'], message: 'La prima ricevuta non può superare la fine della locazione.' });
        }
    }
});

export type LeaseFormData = z.infer<typeof baseLeaseFormSchema>;

export interface LeaseDraftSnapshot {
    formData: Partial<LeaseFormData>;
    activeTab: string;
    updatedAt: string;
}

export const leaseDraftSchema = z.object({
    formData: baseLeaseFormSchema.partial().default({}),
    activeTab: z.string().default('general'),
    updatedAt: z.string().default(''),
}).nullable();

export function isVatEnabled(value: string): boolean {
    return ['percent', 'percentage', 'percentuale', 'iva_percentuale'].includes(value);
}

export function calculateLeasePeriodicAmount(data: Pick<LeaseFormData, 'LeaseRentHC' | 'LeaseMaintenance' | 'LeaseVatPercent' | 'LeaseVatType' | 'PaymentItems'>): number {
    const mainBase = data.LeaseRentHC + data.LeaseMaintenance;
    const mainVat = isVatEnabled(data.LeaseVatType) ? mainBase * (data.LeaseVatPercent / 100) : 0;
    const items = data.PaymentItems.reduce((sum, item) => {
        const itemVat = item.LeasePaymentItems_Amount * (item.LeasePaymentItems_TaxPercent / 100);
        return sum + item.LeasePaymentItems_Amount + itemVat;
    }, 0);
    return Number((mainBase + mainVat + items).toFixed(2));
}

export function normalizeLeaseFormData(data: unknown): LeaseFormData {
    const source = typeof data === 'object' && data !== null ? data as Record<string, unknown> : {};
    const merged = {
        ...defaultLeaseValues,
        ...source,
        LeaseTenantIds: source.LeaseTenantIds ?? [],
        LeaseGarantIds: source.LeaseGarantIds ?? [],
        LeaseDeposit: source.LeaseDeposit ?? source.LeaseSecurityDeposit ?? 0,
        LeaseDepositDate: source.LeaseDepositDate ?? source.LeaseDepositPaymentDate ?? '',
        LeaseUpdateIndex: source.LeaseUpdateIndex ?? source.LeaseUpdateIndexBase ?? '',
        LeaseUpdateDateSpecific: source.LeaseUpdateDateSpecific ?? source.LeaseUpdateSpecificDate ?? '',
    };
    const typeId = normalizeLeaseTypeId(merged.LeaseType);
    const leaseType = getLeaseTypeById(typeId);
    if (source.LeaseRinnovoTacito === undefined && source.LeaseRinnovoTacito !== false) {
        merged.LeaseRinnovoTacito = leaseType?.autoRenewDefault ?? defaultLeaseValues.LeaseRinnovoTacito;
    }
    merged.LeaseType = typeId;
    const parsed = baseLeaseFormSchema.parse(merged);
    return {
        ...parsed,
        LeaseMonthlyAmount: calculateLeasePeriodicAmount(parsed),
    };
}

export function normalizeLeaseDraft(data: unknown): LeaseDraftSnapshot | null {
    const parsed = leaseDraftSchema.parse(data);
    if (!parsed) return null;
    return {
        formData: normalizeLeaseFormData({ ...defaultLeaseValues, ...parsed.formData }),
        activeTab: ['general', 'tenants', 'guarantors'].includes(parsed.activeTab) ? parsed.activeTab : 'general',
        updatedAt: parsed.updatedAt || '',
    };
}
