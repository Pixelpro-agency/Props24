import type {
    DashboardStats,
    LineChartPeriod,
    MonthlyDataPoint,
    PropertyIncome,
    RevenuePeriod,
    RevenueStats,
} from '../types/dashboard';
import { getJsonDb } from './jsonDb';
import type { PaymentRecord } from './database.types';
import { classifyTenantStatus, isLeaseCurrentlyActive, isPaymentOverdue, todayIso } from './dataSelectors';

function parseIsoDate(value: string): Date | null {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function inPeriod(payment: PaymentRecord, period: RevenuePeriod, referenceDate = todayIso()): boolean {
    const date = parseIsoDate(payment.dueDate);
    const now = parseIsoDate(referenceDate) || new Date();
    if (!date) return false;
    if (period === 'current_month') {
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }
    if (period === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.getFullYear() === lastMonth.getFullYear() && date.getMonth() === lastMonth.getMonth();
    }
    if (period === 'year_to_date') {
        return date.getFullYear() === now.getFullYear() && date <= now;
    }
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    return date >= cutoff && date <= now;
}

function paidInPeriod(payment: PaymentRecord, period: RevenuePeriod, referenceDate = todayIso()): boolean {
    if (!payment.paidDate) return false;
    return inPeriod({ ...payment, dueDate: payment.paidDate }, period, referenceDate);
}

function isPaidRevenue(payment: PaymentRecord, referenceDate = todayIso()): boolean {
    return payment.accountingRole === 'revenue'
        && payment.status === 'paid'
        && Boolean(payment.paidDate)
        && String(payment.paidDate) <= referenceDate;
}

function isOperationalExpense(payment: PaymentRecord, referenceDate = todayIso()): boolean {
    return payment.accountingRole === 'expense'
        && payment.status === 'paid'
        && Boolean(payment.paidDate)
        && String(payment.paidDate) <= referenceDate;
}

export function getDashboardStats(): DashboardStats {
    const db = getJsonDb();
    return {
        properties: {
            active: db.properties.filter((property) => !property.archived).length,
            total: db.properties.length,
            archived: db.properties.filter((property) => property.archived).length,
        },
        tenants: {
            active: db.tenants.filter((tenant) => classifyTenantStatus(db, tenant) === 'attivo').length,
            total: db.tenants.length,
            archived: db.tenants.filter((tenant) => tenant.archived).length,
        },
        leases: {
            active: db.leases.filter((lease) => isLeaseCurrentlyActive(lease)).length,
            total: db.leases.length,
            archived: db.leases.filter((lease) => lease.archived).length,
        },
    };
}

export function getRevenueStats(period: RevenuePeriod): RevenueStats {
    const referenceDate = todayIso();
    const payments = getJsonDb().payments;
    const accruedIncome = payments.filter((payment) => payment.accountingRole === 'revenue' && inPeriod(payment, period, referenceDate));
    const paidIncome = payments.filter((payment) => isPaidRevenue(payment, referenceDate) && paidInPeriod(payment, period, referenceDate));
    const overdueIncome = accruedIncome.filter((payment) => isPaymentOverdue(payment, referenceDate));
    const paidExpenses = payments.filter((payment) => isOperationalExpense(payment, referenceDate) && paidInPeriod(payment, period, referenceDate));

    return {
        period,
        paidRentCount: paidIncome.length,
        paidRentAmount: paidIncome.reduce((sum, payment) => sum + payment.amount, 0),
        latePaymentsCount: overdueIncome.length,
        rentToCollect: overdueIncome.reduce((sum, payment) => sum + payment.amount, 0),
        grossIncome: paidIncome.reduce((sum, payment) => sum + payment.amount, 0),
        monthlyExpenses: paidExpenses.reduce((sum, payment) => sum + payment.amount, 0),
        netResult: paidIncome.reduce((sum, payment) => sum + payment.amount, 0) - paidExpenses.reduce((sum, payment) => sum + payment.amount, 0),
    };
}

export function getPropertyIncome(period: RevenuePeriod): PropertyIncome[] {
    const db = getJsonDb();
    const referenceDate = todayIso();
    const colors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];
    return db.properties
        .map((property, index) => ({
            propertyId: property.id,
            propertyName: property.formData.PropertyTitle || 'Unita senza nome',
            income: db.payments
                .filter((payment) => payment.propertyId === property.id && isPaidRevenue(payment, referenceDate) && paidInPeriod(payment, period, referenceDate))
                .reduce((sum, payment) => sum + payment.amount, 0),
            color: colors[index % colors.length],
        }))
        .filter((item) => item.income > 0);
}

export function getLineChartData(period: LineChartPeriod): MonthlyDataPoint[] {
    const payments = getJsonDb().payments;
    const now = new Date();
    if (period === '10_years') {
        return Array.from({ length: 10 }, (_, index) => {
            const year = now.getFullYear() - 9 + index;
            const yearPayments = payments.filter((payment) => payment.paidDate && new Date(`${payment.paidDate}T00:00:00`).getFullYear() === year);
            return {
                label: String(year),
                income: yearPayments.filter((payment) => isPaidRevenue(payment)).reduce((sum, payment) => sum + payment.amount, 0),
                expenses: yearPayments.filter((payment) => isOperationalExpense(payment)).reduce((sum, payment) => sum + payment.amount, 0),
            };
        });
    }

    const labels = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
    return Array.from({ length: 12 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
        const monthPayments = payments.filter((payment) => {
            if (!payment.paidDate) return false;
            const paidDate = new Date(`${payment.paidDate}T00:00:00`);
            return paidDate.getFullYear() === date.getFullYear() && paidDate.getMonth() === date.getMonth();
        });
        return {
            label: labels[date.getMonth()],
            income: monthPayments.filter((payment) => isPaidRevenue(payment)).reduce((sum, payment) => sum + payment.amount, 0),
            expenses: monthPayments.filter((payment) => isOperationalExpense(payment)).reduce((sum, payment) => sum + payment.amount, 0),
        };
    });
}
