import type { FinancialData } from '../types/propertyDetail';
import type { LeaseRecord, LocalDatabase, PaymentRecord, TenantRecord } from './database.types';

export type LeaseTemporalStatus = 'current' | 'future' | 'historical' | 'inactive' | 'archived';

export const LOCATION_DATA: Record<string, { postalCode: string; county: string; state: string; country: string }> = {
    Milano: { postalCode: '20100', county: 'MI', state: 'Lombardia', country: 'IT' },
    Monza: { postalCode: '20900', county: 'MB', state: 'Lombardia', country: 'IT' },
    Bergamo: { postalCode: '24100', county: 'BG', state: 'Lombardia', country: 'IT' },
    Lodi: { postalCode: '26900', county: 'LO', state: 'Lombardia', country: 'IT' },
    Torino: { postalCode: '10100', county: 'TO', state: 'Piemonte', country: 'IT' },
    Roma: { postalCode: '00100', county: 'RM', state: 'Lazio', country: 'IT' },
    Firenze: { postalCode: '50100', county: 'FI', state: 'Toscana', country: 'IT' },
    Rimini: { postalCode: '47921', county: 'RN', state: 'Emilia-Romagna', country: 'IT' },
    Bormio: { postalCode: '23032', county: 'SO', state: 'Lombardia', country: 'IT' },
    Baveno: { postalCode: '28831', county: 'VB', state: 'Piemonte', country: 'IT' },
};

const TENANT_CREDIT_CATEGORIES = new Set(['tenant_credit', 'overpayment', 'refund_due', 'deposit_credit']);

export function todayIso(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function isValidIsoDate(value: string): boolean {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function classifyLease(lease: LeaseRecord, referenceDate = todayIso()): LeaseTemporalStatus {
    if (lease.archived) return 'archived';
    if (!isValidIsoDate(lease.startDate) || !isValidIsoDate(lease.endDate)) return 'inactive';
    if (lease.status === 'terminata' || lease.endDate < referenceDate) return 'historical';
    if (lease.startDate > referenceDate) return 'future';
    if (lease.status === 'attiva' && lease.startDate <= referenceDate && lease.endDate >= referenceDate) return 'current';
    return 'inactive';
}

export function isLeaseCurrentlyActive(lease: LeaseRecord, referenceDate = todayIso()): boolean {
    return classifyLease(lease, referenceDate) === 'current';
}

export function isPaymentOverdue(payment: PaymentRecord, referenceDate = todayIso()): boolean {
    return payment.accountingRole === 'revenue'
        && (payment.status === 'late' || (payment.status === 'pending' && payment.dueDate <= referenceDate));
}

export function isPaymentFuture(payment: PaymentRecord, referenceDate = todayIso()): boolean {
    return payment.accountingRole === 'revenue' && payment.status === 'pending' && payment.dueDate > referenceDate;
}

export function isPaymentCollected(payment: PaymentRecord, referenceDate = todayIso()): boolean {
    return payment.accountingRole === 'revenue'
        && payment.status === 'paid'
        && Boolean(payment.paidDate)
        && String(payment.paidDate) <= referenceDate;
}

export function isPaidExpense(payment: PaymentRecord, referenceDate = todayIso()): boolean {
    return payment.accountingRole === 'expense'
        && payment.status === 'paid'
        && Boolean(payment.paidDate)
        && String(payment.paidDate) <= referenceDate;
}

export function isTenantCredit(payment: PaymentRecord): boolean {
    return payment.accountingRole === 'expense' && TENANT_CREDIT_CATEGORIES.has(payment.category);
}

export function tenantDisplayName(tenant: TenantRecord): string {
    return tenant.type === 'company'
        ? tenant.companyName || 'Azienda'
        : `${tenant.firstName} ${tenant.middleName} ${tenant.lastName}`.replace(/\s+/g, ' ').trim() || 'Inquilino';
}

export function currentLeasesForProperty(database: LocalDatabase, propertyId: string, referenceDate = todayIso()): LeaseRecord[] {
    return database.leases.filter((lease) => lease.propertyId === propertyId && isLeaseCurrentlyActive(lease, referenceDate));
}

export function currentLeasesForTenant(database: LocalDatabase, tenantId: string, referenceDate = todayIso()): LeaseRecord[] {
    return database.leases.filter((lease) => lease.tenantIds.includes(tenantId) && isLeaseCurrentlyActive(lease, referenceDate));
}

export function tenantsForLeases(database: LocalDatabase, leases: LeaseRecord[]): TenantRecord[] {
    const ids = Array.from(new Set(leases.flatMap((lease) => lease.tenantIds)));
    return ids
        .map((id) => database.tenants.find((tenant) => tenant.id === id))
        .filter((tenant): tenant is TenantRecord => Boolean(tenant));
}

export function classifyTenantStatus(database: LocalDatabase, tenant: TenantRecord, referenceDate = todayIso()): TenantRecord['status'] {
    if (tenant.archived) return 'inattivo';
    if (currentLeasesForTenant(database, tenant.id, referenceDate).length > 0) return 'attivo';
    if (tenant.status === 'candidato') return 'candidato';
    return 'inattivo';
}

export function selectTenantLease(database: LocalDatabase, tenantId: string, referenceDate = todayIso()): LeaseRecord | null {
    const leases = database.leases.filter((lease) => lease.tenantIds.includes(tenantId));
    const current = leases.filter((lease) => classifyLease(lease, referenceDate) === 'current');
    if (current[0]) return current.sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
    const future = leases.filter((lease) => classifyLease(lease, referenceDate) === 'future');
    if (future[0]) return future.sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
    const historical = leases.filter((lease) => classifyLease(lease, referenceDate) === 'historical');
    if (historical[0]) return historical.sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
    return leases.sort((a, b) => b.endDate.localeCompare(a.endDate))[0] || null;
}

export function calculateTenantBalance(database: LocalDatabase, tenantId: string, referenceDate = todayIso()): number {
    return database.payments
        .filter((payment) => payment.tenantId === tenantId)
        .reduce((balance, payment) => {
            if (isPaymentOverdue(payment, referenceDate)) return balance - payment.amount;
            if (isTenantCredit(payment) && isPaidExpense(payment, referenceDate)) return balance + payment.amount;
            return balance;
        }, 0);
}

function daysInYear(year: number): number {
    return new Date(Date.UTC(year, 1, 29)).getUTCDate() === 29 ? 366 : 365;
}

function availableYears(payments: PaymentRecord[], leases: LeaseRecord[], fallbackYear: number): number[] {
    const years = new Set<number>();
    payments.forEach((payment) => {
        if (isValidIsoDate(payment.dueDate)) years.add(Number(payment.dueDate.slice(0, 4)));
        if (payment.paidDate && isValidIsoDate(payment.paidDate)) years.add(Number(payment.paidDate.slice(0, 4)));
    });
    leases.forEach((lease) => {
        if (isValidIsoDate(lease.startDate)) years.add(Number(lease.startDate.slice(0, 4)));
        if (isValidIsoDate(lease.endDate)) years.add(Number(lease.endDate.slice(0, 4)));
    });
    if (years.size === 0) years.add(fallbackYear);
    return Array.from(years).sort((a, b) => b - a);
}

function occupiedDaysForYear(leases: LeaseRecord[], year: number): number {
    const days = new Set<string>();
    const startYear = `${year}-01-01`;
    const endYear = `${year}-12-31`;
    leases
        .filter((lease) => !lease.archived && (lease.status === 'attiva' || lease.status === 'terminata'))
        .forEach((lease) => {
            if (!isValidIsoDate(lease.startDate) || !isValidIsoDate(lease.endDate)) return;
            let cursor = new Date(`${lease.startDate > startYear ? lease.startDate : startYear}T00:00:00Z`);
            const end = new Date(`${lease.endDate < endYear ? lease.endDate : endYear}T00:00:00Z`);
            while (cursor <= end) {
                days.add(cursor.toISOString().slice(0, 10));
                cursor.setUTCDate(cursor.getUTCDate() + 1);
            }
        });
    return days.size;
}

export function getPropertyFinancialSummary(database: LocalDatabase, propertyId: string, year: number): FinancialData {
    const property = database.properties.find((item) => item.id === propertyId);
    const payments = database.payments.filter((payment) => payment.propertyId === propertyId);
    const leases = database.leases.filter((lease) => lease.propertyId === propertyId);
    const paidIncome = payments.filter((payment) => isPaymentCollected(payment, `${year}-12-31`) && payment.paidDate?.slice(0, 4) === String(year));
    const paidExpenses = payments.filter((payment) => isPaidExpense(payment, `${year}-12-31`) && payment.paidDate?.slice(0, 4) === String(year));
    const grossIncome = paidIncome.reduce((sum, payment) => sum + payment.amount, 0);
    const expenses = paidExpenses.reduce((sum, payment) => sum + payment.amount, 0);
    const occupancyDays = occupiedDaysForYear(leases, year);
    const purchasePrice = property?.formData.PropertyInitialPrice || 0;
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

    return {
        year,
        availableYears: availableYears(payments, leases, year),
        grossIncome,
        expenses,
        netResult: grossIncome - expenses,
        occupancyDays,
        occupancyRate: Math.round((occupancyDays / daysInYear(year)) * 100),
        profitabilityNet: purchasePrice > 0 ? Number((((grossIncome - expenses) / purchasePrice) * 100).toFixed(2)) : 0,
        purchasePriceKnown: purchasePrice > 0,
        chartData: months.map((month, index) => {
            const monthNumber = String(index + 1).padStart(2, '0');
            return {
                month,
                income: paidIncome.filter((payment) => payment.paidDate?.slice(5, 7) === monthNumber).reduce((sum, payment) => sum + payment.amount, 0),
                expenses: paidExpenses.filter((payment) => payment.paidDate?.slice(5, 7) === monthNumber).reduce((sum, payment) => sum + payment.amount, 0),
            };
        }),
    };
}

export function recalculateBuildingUnits(database: LocalDatabase): LocalDatabase {
    return {
        ...database,
        buildings: database.buildings.map((building) => ({
            ...building,
            unitsCount: database.properties.filter((property) => property.relations.buildingId === building.id).length,
        })),
    };
}
