import { z } from 'zod';
import { getLeaseTypeById, normalizeLeaseTypeId } from '../data/leaseTypes';

const billingPeriods = ['weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'fourmonthly', 'semiannual', 'annual'] as const;
export type LeaseBillingPeriod = typeof billingPeriods[number];
// TODO: introdurre la periodicità forfettaria solo dopo aver definito
// la sua semantica per pagamenti, rinnovi e annualizzazione.
export const PAYMENT_GENERATION_OFFSETS: readonly number[] = [
    0,
    ...Array.from({ length: 31 }, (_, index) => -(index + 1)),
    -60,
    -90,
    ...Array.from({ length: 30 }, (_, index) => index + 1),
    60,
    90,
];
const leaseUpdateTypes = ['nessuno', 'indice', 'percentuale'] as const;
const leaseUpdateAmountTypes = ['rent_excluding_charges', 'rent_including_charges'] as const;
const leaseUpdateYears = [1, 2, 3] as const;
const leaseUpdateDateTypes = ['anniversario', 'specifica'] as const;
const leaseDepositTypes = ['trattenuto', 'terzi'] as const;
const leaseExpenseTypes = ['anticipo', 'forfait'] as const;
const paymentItemTypes = ['charge', 'rent'] as const;
const receiptDocumentTitles = ['', 'fattura', 'ricevuta'] as const;
const receiptNumberingScopes = ['lease', 'landlord'] as const;
const balanceCarryModes = ['manuale', 'automatico'] as const;
const leaseInsuranceTypes = ['locativa', 'affitti_non_pagati'] as const;

function normalizeLeaseInsuranceType(value: unknown): typeof leaseInsuranceTypes[number] | null {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (value === 1 || ['1', 'locativa', 'assicurazione_locativa', 'tenant_liability', 'rental_insurance'].includes(normalized)) return 'locativa';
    if (value === 2 || ['2', 'affitti_non_pagati', 'assicurazione_affitti_non_pagati', 'unpaid_rent', 'rent_guarantee'].includes(normalized)) return 'affitti_non_pagati';
    return null;
}

function normalizeInsuranceString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function normalizeBalanceCarryMode(value: unknown): typeof balanceCarryModes[number] {
    const normalized = String(value ?? '').trim().toLowerCase();
    return value === 1 || value === true || ['1', 'true', 'automatico', 'automatic', 'auto'].includes(normalized) ? 'automatico' : 'manuale';
}

function normalizeReceiptDocumentTitle(value: unknown): typeof receiptDocumentTitles[number] {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (['fattura', 'invoice'].includes(normalized)) return 'fattura';
    if (['ricevuta', 'receipt', 'quittance'].includes(normalized)) return 'ricevuta';
    return '';
}

function normalizeReceiptNumberingScope(value: unknown): typeof receiptNumberingScopes[number] {
    const normalized = String(value ?? '').trim().toLowerCase();
    return value === 1 || ['1', 'landlord', 'owner', 'global'].includes(normalized) ? 'landlord' : 'lease';
}

function normalizeString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function normalizeLeaseExpenseType(value: unknown): typeof leaseExpenseTypes[number] {
    const normalized = String(value ?? '').trim().toLowerCase();
    return value === 2 || ['2', 'forfait', 'flat', 'flat_rate'].includes(normalized) ? 'forfait' : 'anticipo';
}

function normalizePaymentItemType(value: unknown): typeof paymentItemTypes[number] {
    const normalized = String(value ?? '').trim().toLowerCase();
    return ['rent', 'affitto'].includes(normalized) ? 'rent' : 'charge';
}

function finiteNumberOrZero(value: unknown): number {
    if (value === '' || value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeLeaseDepositType(value: unknown): typeof leaseDepositTypes[number] {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (value === 1 || ['1', 'terzi', 'deposito_presso_terzi', 'third_party', 'third-party'].includes(normalized)) return 'terzi';
    return 'trattenuto';
}

function normalizeBillingPeriod(value: unknown): LeaseBillingPeriod {
    const normalized = String(value ?? '').trim().toLowerCase();
    const aliases: Record<string, LeaseBillingPeriod> = {
        weekly: 'weekly', week: 'weekly',
        biweekly: 'biweekly', '2weeks': 'biweekly', '2week': 'biweekly',
        monthly: 'monthly', month: 'monthly', '1month': 'monthly',
        bimonthly: 'bimonthly', '2month': 'bimonthly', '2months': 'bimonthly',
        quarterly: 'quarterly', '3month': 'quarterly', '3months': 'quarterly',
        fourmonthly: 'fourmonthly', '4month': 'fourmonthly', '4months': 'fourmonthly',
        semiannual: 'semiannual', semiannually: 'semiannual', '6month': 'semiannual', '6months': 'semiannual',
        annual: 'annual', annually: 'annual', yearly: 'annual', '1year': 'annual', '12month': 'annual', '12months': 'annual',
    };
    return aliases[normalized] ?? 'monthly';
}

function normalizePaymentTiming(value: unknown): 'anticipato' | 'arretrato' {
    if (value === true || value === 1 || value === '1' || value === 'arretrato' || value === 'arrears') return 'arretrato';
    return 'anticipato';
}

function normalizePaymentMethod(value: unknown): string {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (['5', 'addebito', 'direct_debit'].includes(normalized)) return 'addebito';
    if (['2', 'assegno', 'check', 'cheque'].includes(normalized)) return 'assegno';
    if (['1', 'bonifico', 'bank_transfer'].includes(normalized)) return 'bonifico';
    if (['4', 'carta', 'carta_credito', 'credit_card'].includes(normalized)) return 'carta';
    if (['3', 'contante', 'contanti', 'cash'].includes(normalized)) return 'contanti';
    return '';
}

function normalizePaymentCreateOffset(value: unknown): number {
    if (value === '' || value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isInteger(parsed) && PAYMENT_GENERATION_OFFSETS.includes(parsed) ? parsed : 0;
}

function normalizeLeaseUpdateType(value: unknown): typeof leaseUpdateTypes[number] {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized === 'no' || normalized === 'nessuno') return 'nessuno';
    if (normalized === 'index' || normalized === 'indice') return 'indice';
    if (['%', 'percent', 'percentage', 'percentuale'].includes(normalized)) return 'percentuale';
    return 'indice';
}

function normalizeBoolean(value: unknown): boolean {
    if (value === false || value === 0 || value === '0' || String(value).toLowerCase() === 'false') return false;
    if (value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true') return true;
    return false;
}

function normalizeUpdateAmountType(value: unknown): typeof leaseUpdateAmountTypes[number] {
    return value === 1 || value === '1' || value === 'rent_including_charges'
        ? 'rent_including_charges'
        : 'rent_excluding_charges';
}

function normalizeUpdateYears(value: unknown): typeof leaseUpdateYears[number] {
    const parsed = Number(value);
    return leaseUpdateYears.includes(parsed as typeof leaseUpdateYears[number])
        ? parsed as typeof leaseUpdateYears[number]
        : 1;
}

function normalizeUpdateDateType(value: unknown): typeof leaseUpdateDateTypes[number] {
    return value === 1 || value === '1' || value === 'specifica' ? 'specifica' : 'anniversario';
}

const updatePercentField = z.preprocess((value) => {
    return finiteNumberOrZero(value);
}, z.number().min(0).max(30, 'La percentuale di aggiornamento non può superare il 30%.'));

const numberField = z.preprocess((value) => {
    return finiteNumberOrZero(value);
}, z.number().min(0));

function normalizeVatPercent(value: unknown): number {
    if (value === '' || value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : 0;
}

const vatPercentField = z.preprocess((value) => {
    return finiteNumberOrZero(value);
}, z.number()
    .min(0, 'La percentuale IVA non può essere negativa.')
    .max(100, 'La percentuale IVA non può superare il 100%.'));

function normalizeDayOfMonth(value: unknown, fallback = 1): number {
    if (value === '' || value === null || value === undefined) return fallback;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 31 ? parsed : fallback;
}

const paymentDayField = z.preprocess((value) => {
    return normalizeDayOfMonth(value);
}, z.number().int().min(1, 'Il giorno di pagamento deve essere tra 1 e 31.').max(31, 'Il giorno di pagamento deve essere tra 1 e 31.'));

const stringArrayField = z.preprocess((value) => {
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
    return [];
}, z.array(z.string()).default([]));

export const paymentItemSchema = z.object({
    LeasePaymentItems_Amount: numberField.default(0),
    LeasePaymentItems_TaxPercent: vatPercentField.default(0),
    LeasePaymentItems_Type: z.preprocess(normalizePaymentItemType, z.enum(paymentItemTypes)).default('charge'),
    LeasePaymentItems_Description: z.string().default(''),
});

export const leaseInsuranceContractSchema = z.object({
    LeaseInsuranceType: z.enum(leaseInsuranceTypes).default('locativa'),
    LeaseInsuranceDescription: z.string().max(2000, 'La descrizione non può superare 2000 caratteri.').default(''),
    LeaseInsuranceStartDate: z.string().default(''),
    LeaseInsuranceEndDate: z.string().default(''),
    LeaseInsuranceDocumentId: z.string().max(200, 'Il riferimento documentale non è valido.').default(''),
});

function normalizeLeaseInsuranceContracts(value: unknown): z.infer<typeof leaseInsuranceContractSchema>[] {
    const entries = Array.isArray(value)
        ? value
        : typeof value === 'object' && value !== null ? Object.values(value as Record<string, unknown>) : [];
    // Compatibilità legacy intenzionale: per ogni tipo canonico viene conservata
    // la prima voce incontrata. Eventuali voci successive dello stesso tipo vengono
    // ignorate deterministicamente, perché il dominio consente una sola assicurazione
    // per tipo e la UI impedisce già di crearne duplicati.
    const byType = new Map<typeof leaseInsuranceTypes[number], z.infer<typeof leaseInsuranceContractSchema>>();
    entries.forEach((entry) => {
        if (typeof entry !== 'object' || entry === null) return;
        const source = entry as Record<string, unknown>;
        const has = (key: string) => Object.prototype.hasOwnProperty.call(source, key);
        const type = normalizeLeaseInsuranceType(has('LeaseInsuranceType') ? source.LeaseInsuranceType : source.LeaseContractType);
        if (!type || byType.has(type)) return;
        byType.set(type, leaseInsuranceContractSchema.parse({
            LeaseInsuranceType: type,
            LeaseInsuranceDescription: normalizeInsuranceString(has('LeaseInsuranceDescription') ? source.LeaseInsuranceDescription : source.LeaseContractText),
            LeaseInsuranceStartDate: normalizeInsuranceString(has('LeaseInsuranceStartDate') ? source.LeaseInsuranceStartDate : source.LeaseContractDate),
            LeaseInsuranceEndDate: normalizeInsuranceString(has('LeaseInsuranceEndDate') ? source.LeaseInsuranceEndDate : source.LeaseContractDateTo),
            LeaseInsuranceDocumentId: normalizeInsuranceString(has('LeaseInsuranceDocumentId') ? source.LeaseInsuranceDocumentId : source.LeaseContractDoc),
        }));
    });
    return leaseInsuranceTypes.flatMap((type) => byType.has(type) ? [byType.get(type) as z.infer<typeof leaseInsuranceContractSchema>] : []);
}

function toUnknownArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    return value === undefined || value === null ? [] : [value];
}

function normalizeLegacyPaymentItems(source: Record<string, unknown>): z.infer<typeof paymentItemSchema>[] {
    const amounts = toUnknownArray(source.LeasePaymentItems_Amount);
    const vatPercents = toUnknownArray(source.LeasePaymentItems_TaxPercent);
    const types = toUnknownArray(source.LeasePaymentItems_Type);
    const descriptions = toUnknownArray(source.LeasePaymentItems_Description);
    const length = Math.max(amounts.length, vatPercents.length, types.length, descriptions.length);
    return Array.from({ length }, (_, index) => paymentItemSchema.parse({
        LeasePaymentItems_Amount: amounts[index],
        LeasePaymentItems_TaxPercent: vatPercents[index],
        LeasePaymentItems_Type: types[index],
        LeasePaymentItems_Description: typeof descriptions[index] === 'string' ? descriptions[index] : '',
    })).filter((item) => item.LeasePaymentItems_Amount !== 0
        || item.LeasePaymentItems_TaxPercent !== 0
        || item.LeasePaymentItems_Description.trim() !== '');
}

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
    LeaseReceiptPeriodDay: 1,
    LeasePaymentCreateOffsetDays: 0,
    LeaseRentHC: 0,
    LeaseRentVatPercent: 0,
    LeaseMaintenance: 0,
    LeaseMaintenanceVatPercent: 0,
    LeaseSpeseType: 'anticipo' as const,
    LeaseSpeseDescription: '',
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
    LeaseDepositType: 'trattenuto' as const,
    LeaseDepositTerms: '',
    LeaseDepositDocument: '',
    LeaseDepositDate: '',
    LeasePrepaidRent: 0,
    LeaseReceiptUseAlternateAddress: false,
    LeaseReceiptAlternateAddress: '',
    LeaseReceiptDocumentTitle: '' as const,
    LeaseReceiptAutoNumbering: false,
    LeaseReceiptNumberingPrefix: '',
    LeaseReceiptNumberingScope: 'lease' as const,
    LeaseReceiptSdiCode: '',
    LeaseReceiptPecEmail: '',
    LeaseReceiptFooterText: '',
    LeaseDueNoticeText: '',
    LeaseBalanceCarryMode: 'manuale' as const,
    LeaseNotifyLandlordRentAvailable: true,
    LeaseNotifyTenantRentAvailable: true,
    LeaseNotifyLandlordLeaseEnd: true,
    LeaseNotifyTenantLeaseEnd: true,
    LeaseNotifyTenantLateRent: false,
    LeaseInsuranceContracts: [] as z.infer<typeof leaseInsuranceContractSchema>[],
    LeaseUpdateType: 'indice' as const,
    LeaseUpdatePercent: 0,
    LeaseUpdateIndex: '2.9|2026|6',
    LeaseUpdateAuto: false,
    LeaseUpdateAmountType: 'rent_excluding_charges' as const,
    LeaseUpdateYears: 1 as const,
    LeaseUpdatePeriod: 'annual',
    LeaseUpdateDateType: 'anniversario' as const,
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
    LeaseBillingPeriod: z.preprocess(normalizeBillingPeriod, z.enum(billingPeriods)).default('monthly'),
    LeasePaymentTiming: z.preprocess(normalizePaymentTiming, z.enum(['anticipato', 'arretrato'])).default('anticipato'),
    LeasePaymentMethod: z.preprocess(normalizePaymentMethod, z.string()).default(''),
    LeasePaymentDay: paymentDayField.default(1),
    LeaseReceiptPeriodDay: paymentDayField.default(1),
    LeasePaymentCreateOffsetDays: z.preprocess(normalizePaymentCreateOffset, z.number().int()).default(0),
    LeaseRentHC: numberField.default(0),
    LeaseRentVatPercent: vatPercentField.default(0),
    LeaseMaintenance: numberField.default(0),
    LeaseMaintenanceVatPercent: vatPercentField.default(0),
    LeaseSpeseType: z.preprocess(normalizeLeaseExpenseType, z.enum(leaseExpenseTypes)).default('anticipo'),
    LeaseSpeseDescription: z.string().default(''),
    LeaseMonthlyAmount: numberField.default(0),
    // IVA globale legacy di Props24. Conservata per il recupero dei record
    // precedenti, ma sostituita nella UI dalle percentuali separate.
    LeaseVatType: z.string().default('0'),
    LeaseVatPercent: numberField.default(0),
    LeaseIrpfType: z.string().default('0'),
    LeaseIrpfPercent: numberField.default(0),
    LeaseIrpfAmount: numberField.default(0),
    PaymentItems: z.array(paymentItemSchema).default([]),
    LeaseFirstBill: z.preprocess(normalizeBoolean, z.boolean()).default(false),
    LeaseFirstBillEndDate: z.string().default(''),
    LeaseFirstBillAmount: numberField.default(0),
    LeaseFirstBillCharges: numberField.default(0),
    LeaseDeposit: numberField.default(0),
    LeaseDepositType: z.preprocess(normalizeLeaseDepositType, z.enum(leaseDepositTypes)).default('trattenuto'),
    LeaseDepositTerms: z.string().default(''),
    LeaseDepositDocument: z.string().default(''),
    LeaseDepositDate: z.string().default(''),
    LeasePrepaidRent: numberField.default(0),
    LeaseReceiptUseAlternateAddress: z.preprocess(normalizeBoolean, z.boolean()).default(false),
    LeaseReceiptAlternateAddress: z.string().max(1000, "L'indirizzo alternativo non può superare 1000 caratteri.").default(''),
    LeaseReceiptDocumentTitle: z.preprocess(normalizeReceiptDocumentTitle, z.enum(receiptDocumentTitles)).default(''),
    LeaseReceiptAutoNumbering: z.preprocess(normalizeBoolean, z.boolean()).default(false),
    LeaseReceiptNumberingPrefix: z.string().max(80, 'Il prefisso non può superare 80 caratteri.').default(''),
    LeaseReceiptNumberingScope: z.preprocess(normalizeReceiptNumberingScope, z.enum(receiptNumberingScopes)).default('lease'),
    LeaseReceiptSdiCode: z.string().max(7, 'Il Codice SDI deve contenere esattamente 7 caratteri alfanumerici.').default(''),
    LeaseReceiptPecEmail: z.string().max(254, 'La PEC non può superare 254 caratteri.').default(''),
    LeaseReceiptFooterText: z.string().max(4000, 'Il testo della ricevuta non può superare 4000 caratteri.').default(''),
    LeaseDueNoticeText: z.string().max(4000, "Il testo dell'avviso non può superare 4000 caratteri.").default(''),
    LeaseBalanceCarryMode: z.preprocess(normalizeBalanceCarryMode, z.enum(balanceCarryModes)).default('manuale'),
    LeaseNotifyLandlordRentAvailable: z.preprocess(normalizeBoolean, z.boolean()).default(true),
    LeaseNotifyTenantRentAvailable: z.preprocess(normalizeBoolean, z.boolean()).default(true),
    LeaseNotifyLandlordLeaseEnd: z.preprocess(normalizeBoolean, z.boolean()).default(true),
    LeaseNotifyTenantLeaseEnd: z.preprocess(normalizeBoolean, z.boolean()).default(true),
    LeaseNotifyTenantLateRent: z.preprocess(normalizeBoolean, z.boolean()).default(false),
    LeaseInsuranceContracts: z.preprocess(normalizeLeaseInsuranceContracts, z.array(leaseInsuranceContractSchema).max(2, 'Puoi configurare al massimo due assicurazioni.')).default([]),
    LeaseUpdateType: z.preprocess(normalizeLeaseUpdateType, z.enum(leaseUpdateTypes)).default('indice'),
    LeaseUpdatePercent: updatePercentField.default(0),
    LeaseUpdateIndex: z.string().default('2.9|2026|6'),
    LeaseUpdateAuto: z.preprocess(normalizeBoolean, z.boolean()).default(false),
    LeaseUpdateAmountType: z.preprocess(normalizeUpdateAmountType, z.enum(leaseUpdateAmountTypes)).default('rent_excluding_charges'),
    LeaseUpdateYears: z.preprocess(normalizeUpdateYears, z.union([z.literal(1), z.literal(2), z.literal(3)])).default(1),
    // Campi legacy mantenuti temporaneamente per normalizzare bozze e record
    // precedenti. Non vengono più mostrati nel form.
    LeaseUpdatePeriod: z.string().default('annual'),
    LeaseUpdateDateType: z.preprocess(normalizeUpdateDateType, z.enum(leaseUpdateDateTypes)).default('anniversario'),
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

const DAY_MS = 86_400_000;

function parseIsoUtc(value: string): Date | null {
    if (!isIsoDate(value)) return null;
    return new Date(`${value}T00:00:00Z`);
}

function toIsoUtc(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function calculateLeaseEndDate(
    startDate: string,
    durationMonths: number | null | undefined,
): string {
    const start = parseIsoUtc(startDate);
    if (!start || typeof durationMonths !== 'number' || !Number.isInteger(durationMonths) || durationMonths <= 0) return '';

    const targetMonthStart = new Date(Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth() + durationMonths,
        1,
    ));
    const targetYear = targetMonthStart.getUTCFullYear();
    const targetMonth = targetMonthStart.getUTCMonth();
    const lastTargetDay = lastUtcDayOfMonth(targetYear, targetMonth);
    const startDay = start.getUTCDate();

    if (startDay > lastTargetDay) {
        return toIsoUtc(new Date(Date.UTC(targetYear, targetMonth, lastTargetDay)));
    }

    const end = new Date(Date.UTC(targetYear, targetMonth, startDay));
    end.setUTCDate(end.getUTCDate() - 1);
    return toIsoUtc(end);
}

function addUtcDays(value: string, days: number): string {
    const date = parseIsoUtc(value);
    if (!date) return '';
    date.setUTCDate(date.getUTCDate() + days);
    return toIsoUtc(date);
}

function lastUtcDayOfMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function preferredUtcDay(year: number, month: number, preferredDay: number): Date {
    return new Date(Date.UTC(year, month, Math.min(normalizeDayOfMonth(preferredDay), lastUtcDayOfMonth(year, month))));
}

function addUtcMonths(value: string, months: number, preferredDay?: number): string {
    const source = parseIsoUtc(value);
    if (!source) return '';
    const target = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + months, 1));
    return toIsoUtc(preferredUtcDay(target.getUTCFullYear(), target.getUTCMonth(), preferredDay ?? source.getUTCDate()));
}

function inclusiveUtcDays(start: string, end: string): number {
    const startDate = parseIsoUtc(start);
    const endDate = parseIsoUtc(end);
    if (!startDate || !endDate) return 0;
    return Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
}

function roundMoney(value: number): number {
    return Number(value.toFixed(2));
}

export function billingPeriodStep(billingPeriod: LeaseBillingPeriod): { days?: number; months?: number } {
    if (billingPeriod === 'weekly') return { days: 7 };
    if (billingPeriod === 'biweekly') return { days: 14 };
    if (billingPeriod === 'bimonthly') return { months: 2 };
    if (billingPeriod === 'quarterly') return { months: 3 };
    if (billingPeriod === 'fourmonthly') return { months: 4 };
    if (billingPeriod === 'semiannual') return { months: 6 };
    if (billingPeriod === 'annual') return { months: 12 };
    return { months: 1 };
}

export function firstStandardPeriodEndDate(startDate: string, billingPeriod: LeaseBillingPeriod): string {
    if (!parseIsoUtc(startDate)) return '';
    const step = billingPeriodStep(billingPeriod);
    const nextStart = step.days ? addUtcDays(startDate, step.days) : addUtcMonths(startDate, step.months ?? 1);
    return addUtcDays(nextStart, -1);
}

export function proposeFirstBillEndDate(input: {
    startDate: string;
    leaseEndDate: string;
    billingPeriod: LeaseBillingPeriod;
    receiptPeriodDay: number;
}): string {
    const start = parseIsoUtc(input.startDate);
    if (!start || !parseIsoUtc(input.leaseEndDate) || input.leaseEndDate < input.startDate) return '';
    const step = billingPeriodStep(input.billingPeriod);
    let proposed: string;
    if (step.days) {
        proposed = addUtcDays(input.startDate, step.days - 1);
    } else {
        let ordinaryStart = toIsoUtc(preferredUtcDay(start.getUTCFullYear(), start.getUTCMonth(), input.receiptPeriodDay));
        if (ordinaryStart <= input.startDate) ordinaryStart = addUtcMonths(ordinaryStart, step.months ?? 1, input.receiptPeriodDay);
        proposed = addUtcDays(ordinaryStart, -1);
    }
    return proposed > input.leaseEndDate ? input.leaseEndDate : proposed;
}

export interface FirstBillProrataResult {
    rentAmount: number;
    chargesAmount: number;
    totalAmount: number;
    coveredDays: number;
    standardPeriodDays: number;
    ratio: number;
}

export function calculateFirstBillProrata(data: Pick<LeaseFormData,
    'LeaseStartDate' | 'LeaseEndDate' | 'LeaseBillingPeriod' | 'LeaseFirstBillEndDate' | 'LeaseRentHC' | 'LeaseMaintenance'
>): FirstBillProrataResult | null {
    const standardEnd = firstStandardPeriodEndDate(data.LeaseStartDate, data.LeaseBillingPeriod);
    if (!parseIsoUtc(data.LeaseStartDate) || !parseIsoUtc(data.LeaseEndDate) || !parseIsoUtc(data.LeaseFirstBillEndDate)
        || data.LeaseFirstBillEndDate < data.LeaseStartDate || data.LeaseFirstBillEndDate > data.LeaseEndDate
        || !standardEnd || data.LeaseFirstBillEndDate > standardEnd
        || !Number.isFinite(data.LeaseRentHC) || !Number.isFinite(data.LeaseMaintenance)) return null;
    const coveredDays = inclusiveUtcDays(data.LeaseStartDate, data.LeaseFirstBillEndDate);
    const standardPeriodDays = inclusiveUtcDays(data.LeaseStartDate, standardEnd);
    if (standardPeriodDays <= 0) return null;
    const ratio = Math.min(1, Math.max(0, coveredDays / standardPeriodDays));
    const rentAmount = roundMoney(data.LeaseRentHC * ratio);
    const chargesAmount = roundMoney(data.LeaseMaintenance * ratio);
    return { rentAmount, chargesAmount, totalAmount: roundMoney(rentAmount + chargesAmount), coveredDays, standardPeriodDays, ratio };
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
        const standardEnd = firstStandardPeriodEndDate(data.LeaseStartDate, data.LeaseBillingPeriod);
        if (isIsoDate(data.LeaseFirstBillEndDate) && standardEnd && data.LeaseFirstBillEndDate > standardEnd) {
            ctx.addIssue({ code: 'custom', path: ['LeaseFirstBillEndDate'], message: 'La prima ricevuta non può superare il primo periodo contrattuale.' });
        }
    }
    if (data.LeaseRentHC <= 0) {
        ctx.addIssue({ code: 'custom', path: ['LeaseRentHC'], message: 'Inserisci un canone maggiore di zero.' });
    }
    if (data.LeaseDepositDate && !isIsoDate(data.LeaseDepositDate)) {
        ctx.addIssue({ code: 'custom', path: ['LeaseDepositDate'], message: 'Inserisci una data valida per il pagamento del deposito.' });
    }
    if (data.LeaseReceiptUseAlternateAddress && !data.LeaseReceiptAlternateAddress.trim()) {
        ctx.addIssue({ code: 'custom', path: ['LeaseReceiptAlternateAddress'], message: "Inserisci l'indirizzo alternativo della ricevuta." });
    }
    if (data.LeaseReceiptSdiCode && !/^[A-Z0-9]{7}$/.test(data.LeaseReceiptSdiCode)) {
        ctx.addIssue({ code: 'custom', path: ['LeaseReceiptSdiCode'], message: 'Il Codice SDI deve contenere esattamente 7 caratteri alfanumerici.' });
    }
    if (data.LeaseReceiptPecEmail && !z.string().email().safeParse(data.LeaseReceiptPecEmail).success) {
        ctx.addIssue({ code: 'custom', path: ['LeaseReceiptPecEmail'], message: 'Inserisci un indirizzo PEC valido.' });
    }
    data.LeaseInsuranceContracts.forEach((contract, index) => {
        if (!contract.LeaseInsuranceDescription.trim()) ctx.addIssue({ code: 'custom', path: ['LeaseInsuranceContracts', index, 'LeaseInsuranceDescription'], message: "Inserisci la descrizione dell'assicurazione." });
        if (contract.LeaseInsuranceStartDate && !isIsoDate(contract.LeaseInsuranceStartDate)) ctx.addIssue({ code: 'custom', path: ['LeaseInsuranceContracts', index, 'LeaseInsuranceStartDate'], message: 'Inserisci una data iniziale valida.' });
        if (contract.LeaseInsuranceEndDate && !isIsoDate(contract.LeaseInsuranceEndDate)) ctx.addIssue({ code: 'custom', path: ['LeaseInsuranceContracts', index, 'LeaseInsuranceEndDate'], message: 'Inserisci una data di scadenza valida.' });
        if (isIsoDate(contract.LeaseInsuranceStartDate) && isIsoDate(contract.LeaseInsuranceEndDate) && contract.LeaseInsuranceEndDate < contract.LeaseInsuranceStartDate) ctx.addIssue({ code: 'custom', path: ['LeaseInsuranceContracts', index, 'LeaseInsuranceEndDate'], message: 'La data di scadenza non può precedere la data iniziale.' });
    });
    if (data.LeaseUpdateType === 'percentuale' && data.LeaseUpdatePercent <= 0) {
        ctx.addIssue({ code: 'custom', path: ['LeaseUpdatePercent'], message: 'Inserisci una percentuale di aggiornamento maggiore di zero.' });
    }
    if (data.LeaseUpdateType === 'indice' && !data.LeaseUpdateIndex.trim()) {
        ctx.addIssue({ code: 'custom', path: ['LeaseUpdateIndex'], message: 'Seleziona un indice ISTAT di riferimento.' });
    }
    if (data.LeaseUpdateType !== 'nessuno' && data.LeaseUpdateDateType === 'specifica' && !isIsoDate(data.LeaseUpdateDateSpecific)) {
        ctx.addIssue({ code: 'custom', path: ['LeaseUpdateDateSpecific'], message: "Inserisci la data specifica dell'aggiornamento." });
    }
});

export type LeaseFormData = z.infer<typeof baseLeaseFormSchema>;

export interface LeaseDraftSnapshot {
    formData: Partial<LeaseFormData>;
    activeTab: string;
    updatedAt: string;
}

export const leaseDraftSchema = z.object({
    formData: baseLeaseFormSchema.partial().passthrough().default({}),
    activeTab: z.string().default('general'),
    updatedAt: z.string().default(''),
}).nullable();

export function isVatEnabled(value: string): boolean {
    return ['percent', 'percentage', 'percentuale', 'iva_percentuale'].includes(value);
}

function safeNonNegativeAmount(value: unknown): number {
    const parsed = finiteNumberOrZero(value);
    return parsed >= 0 ? parsed : 0;
}

function safeVatPercent(value: unknown): number {
    const parsed = finiteNumberOrZero(value);
    return parsed >= 0 && parsed <= 100 ? parsed : 0;
}

export function calculateLeasePeriodicAmount(data: Pick<LeaseFormData, 'LeaseRentHC' | 'LeaseRentVatPercent' | 'LeaseMaintenance' | 'LeaseMaintenanceVatPercent' | 'PaymentItems'>): number {
    const rent = safeNonNegativeAmount(data.LeaseRentHC);
    const rentVatPercent = safeVatPercent(data.LeaseRentVatPercent);
    const maintenance = safeNonNegativeAmount(data.LeaseMaintenance);
    const maintenanceVatPercent = safeVatPercent(data.LeaseMaintenanceVatPercent);
    const paymentItems = Array.isArray(data.PaymentItems) ? data.PaymentItems : [];
    const itemTotal = paymentItems.reduce((sum, item) => {
        const amount = safeNonNegativeAmount(item?.LeasePaymentItems_Amount);
        const vatPercent = safeVatPercent(item?.LeasePaymentItems_TaxPercent);
        return sum + amount + amount * vatPercent / 100;
    }, 0);
    const total = rent
        + rent * rentVatPercent / 100
        + maintenance
        + maintenance * maintenanceVatPercent / 100
        + itemTotal;
    return Number(total.toFixed(2));
}

export function normalizeLeaseFormData(data: unknown): LeaseFormData {
    const source = typeof data === 'object' && data !== null ? data as Record<string, unknown> : {};
    const hasCanonical = (key: string) => Object.prototype.hasOwnProperty.call(source, key);
    const legacyVatPercent = isVatEnabled(String(source.LeaseVatType ?? ''))
        ? normalizeVatPercent(source.LeaseVatPercent)
        : 0;
    const merged = {
        ...defaultLeaseValues,
        ...source,
        LeaseIdentificativo: typeof (hasCanonical('LeaseIdentificativo') ? source.LeaseIdentificativo : source.LeaseTitle) === 'string'
            ? hasCanonical('LeaseIdentificativo') ? source.LeaseIdentificativo : source.LeaseTitle
            : hasCanonical('LeaseIdentificativo') ? '' : defaultLeaseValues.LeaseIdentificativo,
        LeaseNumeroRegistrazione: typeof (hasCanonical('LeaseNumeroRegistrazione') ? source.LeaseNumeroRegistrazione : source.LeaseRegistrationNumber) === 'string'
            ? hasCanonical('LeaseNumeroRegistrazione') ? source.LeaseNumeroRegistrazione : source.LeaseRegistrationNumber
            : '',
        LeaseTenantIds: source.LeaseTenantIds ?? [],
        LeaseGarantIds: source.LeaseGarantIds ?? [],
        LeaseBillingPeriod: normalizeBillingPeriod(source.LeaseBillingPeriod),
        LeasePaymentTiming: normalizePaymentTiming(hasCanonical('LeasePaymentTiming') ? source.LeasePaymentTiming : source.LeasePaymentArrears),
        LeaseRinnovoTacito: normalizeBoolean(hasCanonical('LeaseRinnovoTacito') ? source.LeaseRinnovoTacito : source.LeaseFixedAutoRenew),
        LeasePaymentMethod: normalizePaymentMethod(hasCanonical('LeasePaymentMethod') ? source.LeasePaymentMethod : source.LeasePaymentMethodID),
        LeasePaymentDay: normalizeDayOfMonth(hasCanonical('LeaseReceiptPeriodDay')
            ? source.LeasePaymentDay
            : hasCanonical('LeaseDayToBePaid') ? source.LeaseDayToBePaid : source.LeasePaymentDay),
        LeaseReceiptPeriodDay: normalizeDayOfMonth(hasCanonical('LeaseReceiptPeriodDay')
            ? source.LeaseReceiptPeriodDay
            : hasCanonical('LeaseDayToBePaid') ? source.LeasePaymentDay : undefined),
        LeasePaymentCreateOffsetDays: normalizePaymentCreateOffset(hasCanonical('LeasePaymentCreateOffsetDays') ? source.LeasePaymentCreateOffsetDays : source.LeasePaymentCreateDay),
        LeaseRentVatPercent: normalizeVatPercent(hasCanonical('LeaseRentVatPercent')
            ? source.LeaseRentVatPercent
            : source.LeaseRentHCTaxPercent ?? legacyVatPercent),
        LeaseMaintenanceVatPercent: normalizeVatPercent(hasCanonical('LeaseMaintenanceVatPercent')
            ? source.LeaseMaintenanceVatPercent
            : source.LeaseMaintenanceTaxPercent ?? legacyVatPercent),
        LeaseSpeseType: normalizeLeaseExpenseType(hasCanonical('LeaseSpeseType') ? source.LeaseSpeseType : source.LeaseMaintenanceType),
        LeaseSpeseDescription: typeof (hasCanonical('LeaseSpeseDescription') ? source.LeaseSpeseDescription : source.LeaseMaintenanceDescription) === 'string'
            ? hasCanonical('LeaseSpeseDescription') ? source.LeaseSpeseDescription : source.LeaseMaintenanceDescription
            : '',
        PaymentItems: hasCanonical('PaymentItems') ? source.PaymentItems : normalizeLegacyPaymentItems(source),
        LeaseDeposit: hasCanonical('LeaseDeposit') ? source.LeaseDeposit : source.LeaseSecurityDeposit ?? 0,
        LeaseDepositType: normalizeLeaseDepositType(hasCanonical('LeaseDepositType') ? source.LeaseDepositType : source.LeaseSecurityDepositType),
        LeaseDepositTerms: hasCanonical('LeaseDepositTerms') ? source.LeaseDepositTerms : source.LeaseSecurityDepositTerms ?? '',
        LeaseDepositDocument: typeof (hasCanonical('LeaseDepositDocument') ? source.LeaseDepositDocument : source.LeaseSecurityDepositDoc) === 'string'
            ? hasCanonical('LeaseDepositDocument') ? source.LeaseDepositDocument : source.LeaseSecurityDepositDoc
            : '',
        LeaseDepositDate: hasCanonical('LeaseDepositDate')
            ? source.LeaseDepositDate
            : source.LeaseSecurityDepositDate ?? source.LeaseSecurityDepositPaymentDate ?? '',
        LeaseReceiptUseAlternateAddress: normalizeBoolean(hasCanonical('LeaseReceiptUseAlternateAddress') ? source.LeaseReceiptUseAlternateAddress : source.LeaseIsOtherQuittanceAddress),
        LeaseReceiptAlternateAddress: normalizeString(hasCanonical('LeaseReceiptAlternateAddress') ? source.LeaseReceiptAlternateAddress : source.LeaseOtherQuittanceAddress).trim(),
        LeaseReceiptDocumentTitle: normalizeReceiptDocumentTitle(hasCanonical('LeaseReceiptDocumentTitle') ? source.LeaseReceiptDocumentTitle : source.LeaseMentionText),
        LeaseReceiptAutoNumbering: normalizeBoolean(hasCanonical('LeaseReceiptAutoNumbering') ? source.LeaseReceiptAutoNumbering : source.LeaseNumbering),
        LeaseReceiptNumberingPrefix: normalizeString(hasCanonical('LeaseReceiptNumberingPrefix') ? source.LeaseReceiptNumberingPrefix : source.LeaseNumberingPrefix).trim(),
        LeaseReceiptNumberingScope: normalizeReceiptNumberingScope(hasCanonical('LeaseReceiptNumberingScope') ? source.LeaseReceiptNumberingScope : source.LeaseUseGlobalNumbering),
        LeaseReceiptSdiCode: normalizeString(hasCanonical('LeaseReceiptSdiCode') ? source.LeaseReceiptSdiCode : source.RecipientCode).trim().toUpperCase(),
        LeaseReceiptPecEmail: normalizeString(hasCanonical('LeaseReceiptPecEmail') ? source.LeaseReceiptPecEmail : source.PECEmail).trim(),
        LeaseReceiptFooterText: normalizeString(hasCanonical('LeaseReceiptFooterText') ? source.LeaseReceiptFooterText : source.LeasePaymentReceivedComments).trim(),
        LeaseDueNoticeText: normalizeString(hasCanonical('LeaseDueNoticeText') ? source.LeaseDueNoticeText : source.LeasePaymentAvisComments).trim(),
        LeaseBalanceCarryMode: normalizeBalanceCarryMode(hasCanonical('LeaseBalanceCarryMode') ? source.LeaseBalanceCarryMode : source.LeaseSoldeReport),
        LeaseNotifyLandlordRentAvailable: normalizeBoolean(hasCanonical('LeaseNotifyLandlordRentAvailable') ? source.LeaseNotifyLandlordRentAvailable : source.LeaseRentNotifyLandlord ?? true),
        LeaseNotifyTenantRentAvailable: normalizeBoolean(hasCanonical('LeaseNotifyTenantRentAvailable') ? source.LeaseNotifyTenantRentAvailable : source.LeaseRentNotifyTenant ?? true),
        LeaseNotifyLandlordLeaseEnd: normalizeBoolean(hasCanonical('LeaseNotifyLandlordLeaseEnd') ? source.LeaseNotifyLandlordLeaseEnd : source.LeaseAnniversaryNotifyLandlord ?? true),
        LeaseNotifyTenantLeaseEnd: normalizeBoolean(hasCanonical('LeaseNotifyTenantLeaseEnd') ? source.LeaseNotifyTenantLeaseEnd : source.LeaseAnniversaryNotifyTenant ?? true),
        LeaseNotifyTenantLateRent: normalizeBoolean(hasCanonical('LeaseNotifyTenantLateRent') ? source.LeaseNotifyTenantLateRent : source.LeaseLateRentNotifyTenant),
        LeaseInsuranceContracts: normalizeLeaseInsuranceContracts(hasCanonical('LeaseInsuranceContracts') ? source.LeaseInsuranceContracts : source.LeaseContracts ?? source.leaseContractsJs),
        LeaseUpdateType: normalizeLeaseUpdateType(hasCanonical('LeaseUpdateType') ? source.LeaseUpdateType : source.LeaseRentRevisionType),
        LeaseUpdatePercent: hasCanonical('LeaseUpdatePercent') ? source.LeaseUpdatePercent : source.LeaseRentRevisionPercent ?? 0,
        LeaseUpdateIndex: hasCanonical('LeaseUpdateIndex') ? source.LeaseUpdateIndex : source.LeaseIndexValues ?? source.LeaseUpdateIndexBase ?? defaultLeaseValues.LeaseUpdateIndex,
        LeaseUpdateAuto: normalizeBoolean(hasCanonical('LeaseUpdateAuto') ? source.LeaseUpdateAuto : source.LeaseRentRevision),
        LeaseUpdateAmountType: normalizeUpdateAmountType(hasCanonical('LeaseUpdateAmountType') ? source.LeaseUpdateAmountType : source.LeaseRentRevisionAmountType),
        LeaseUpdateYears: normalizeUpdateYears(hasCanonical('LeaseUpdateYears') ? source.LeaseUpdateYears : source.LeaseRentRevisionYears),
        LeaseUpdateDateType: normalizeUpdateDateType(hasCanonical('LeaseUpdateDateType') ? source.LeaseUpdateDateType : source.LeaseRentRevisionDateType),
        LeaseUpdateDateSpecific: hasCanonical('LeaseUpdateDateSpecific') ? source.LeaseUpdateDateSpecific : source.LeaseRentRevisionDate ?? source.LeaseUpdateSpecificDate ?? '',
    };
    const typeId = normalizeLeaseTypeId(merged.LeaseType);
    const leaseType = getLeaseTypeById(typeId);
    if (!hasCanonical('LeaseRinnovoTacito') && !hasCanonical('LeaseFixedAutoRenew')) {
        merged.LeaseRinnovoTacito = leaseType?.autoRenewDefault ?? defaultLeaseValues.LeaseRinnovoTacito;
    }
    merged.LeaseType = typeId;
    const parsed = baseLeaseFormSchema.parse(merged);
    const normalized = {
        ...parsed,
        LeaseMonthlyAmount: calculateLeasePeriodicAmount(parsed),
    };
    if (!normalized.LeaseFirstBill) return normalized;
    const firstBill = calculateFirstBillProrata(normalized);
    return {
        ...normalized,
        LeaseFirstBillAmount: firstBill?.rentAmount ?? 0,
        LeaseFirstBillCharges: firstBill?.chargesAmount ?? 0,
    };
}

export function normalizeLeaseDraft(data: unknown): LeaseDraftSnapshot | null {
    const parsed = leaseDraftSchema.parse(data);
    if (!parsed) return null;
    return {
        formData: normalizeLeaseFormData(parsed.formData),
        activeTab: ['general', 'tenants', 'guarantors', 'receipts', 'settings', 'insurance', 'documents', 'contract', 'signature'].includes(parsed.activeTab) ? parsed.activeTab : 'general',
        updatedAt: parsed.updatedAt || '',
    };
}
