/**
 * Dashboard (Scrivania) type definitions.
 * Used by dashboard components, hooks, and mock data.
 */

/* ── User Profile ─────────────────────────────────────── */

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    /** URL avatar (opzionale) */
    avatarUrl?: string;
}

/* ── Entity Counts (tiles) ────────────────────────────── */

export interface EntityCount {
    /** Elementi attivi (non archiviati) */
    active: number;
    /** Totale elementi */
    total: number;
    /** Elementi archiviati */
    archived: number;
}

export interface DashboardStats {
    properties: EntityCount;
    tenants: EntityCount;
    leases: EntityCount;
}

/* ── Revenue / Expenses ───────────────────────────────── */

export type RevenuePeriod =
    | 'current_month'
    | 'last_month'
    | 'year_to_date'
    | 'last_12_months';

export interface RevenueStats {
    period: RevenuePeriod;
    paidRentCount: number;
    paidRentAmount: number;
    latePaymentsCount: number;
    rentToCollect: number;
    grossIncome: number;
    monthlyExpenses: number;
    netResult: number;
}

/* ── Pie Chart (distribuzione entrate per proprietà) ─── */

export interface PropertyIncome {
    propertyId: string;
    propertyName: string;
    income: number;
    color: string;
}

/* ── Line Chart (andamento entrate/spese nel tempo) ──── */

export type LineChartPeriod = '12_months' | '10_years';

export interface MonthlyDataPoint {
    /** Label asse X, es. "gen", "feb", "2024" */
    label: string;
    income: number;
    expenses: number;
}
