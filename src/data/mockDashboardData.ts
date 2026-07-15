/**
 * Mock data for the Dashboard (Scrivania) panels.
 *
 * - Revenue stats per 4 periodi (mese corrente, mese scorso, anno in corso, 12 mesi)
 * - Distribuzione entrate per proprietà (pie chart)
 * - Andamento entrate/spese nel tempo (line chart)
 *
 * I valori sono coerenti con i mock di proprietà, inquilini e locazioni esistenti.
 */
import type {
    RevenueStats,
    PropertyIncome,
    MonthlyDataPoint,
} from '../types/dashboard';

/* ─── Revenue Stats per periodo ─────────────────────────────── */

export const mockRevenueByPeriod: Record<string, RevenueStats> = {
    current_month: {
        period: 'current_month',
        paidRentCount: 7,
        paidRentAmount: 8370,
        latePaymentsCount: 2,
        rentToCollect: 2900,
        grossIncome: 8370,
        monthlyExpenses: 1250,
        netResult: 7120,
    },
    last_month: {
        period: 'last_month',
        paidRentCount: 9,
        paidRentAmount: 10520,
        latePaymentsCount: 1,
        rentToCollect: 1400,
        grossIncome: 10520,
        monthlyExpenses: 1480,
        netResult: 9040,
    },
    year_to_date: {
        period: 'year_to_date',
        paidRentCount: 18,
        paidRentAmount: 18890,
        latePaymentsCount: 3,
        rentToCollect: 4300,
        grossIncome: 18890,
        monthlyExpenses: 2730,
        netResult: 16160,
    },
    last_12_months: {
        period: 'last_12_months',
        paidRentCount: 96,
        paidRentAmount: 112400,
        latePaymentsCount: 8,
        rentToCollect: 5250,
        grossIncome: 112400,
        monthlyExpenses: 16200,
        netResult: 96200,
    },
};

/* ─── Pie Chart: income by property (mese corrente) ─────────── */

const PIE_COLORS = [
    '#72a333', '#f4c414', '#3b82f6', '#ef4444', '#8b5cf6',
    '#14b8a6', '#f59e0b', '#ec4899', '#6366f1', '#06b6d4',
];

export const mockPropertyIncomeByPeriod: Record<string, PropertyIncome[]> = {
    current_month: [
        { propertyId: '1', propertyName: 'Appartamento Centrale', income: 950, color: PIE_COLORS[0] },
        { propertyId: '4', propertyName: 'Ufficio Porta Nuova', income: 3200, color: PIE_COLORS[1] },
        { propertyId: '6', propertyName: 'Mansarda Brera', income: 800, color: PIE_COLORS[2] },
        { propertyId: '8', propertyName: 'Stanza Singola Città Studi', income: 450, color: PIE_COLORS[3] },
        { propertyId: '10', propertyName: 'Laboratorio Artigianale', income: 1100, color: PIE_COLORS[4] },
        { propertyId: '14', propertyName: 'Bilocale Sempione', income: 750, color: PIE_COLORS[5] },
        { propertyId: '16', propertyName: 'Casa di Città Bergamo', income: 1200, color: PIE_COLORS[6] },
    ],
    last_month: [
        { propertyId: '1', propertyName: 'Appartamento Centrale', income: 950, color: PIE_COLORS[0] },
        { propertyId: '3', propertyName: 'Negozio Corso Buenos Aires', income: 2500, color: PIE_COLORS[1] },
        { propertyId: '4', propertyName: 'Ufficio Porta Nuova', income: 3200, color: PIE_COLORS[2] },
        { propertyId: '6', propertyName: 'Mansarda Brera', income: 800, color: PIE_COLORS[3] },
        { propertyId: '8', propertyName: 'Stanza Singola Città Studi', income: 450, color: PIE_COLORS[4] },
        { propertyId: '10', propertyName: 'Laboratorio Artigianale', income: 1100, color: PIE_COLORS[5] },
        { propertyId: '14', propertyName: 'Bilocale Sempione', income: 750, color: PIE_COLORS[6] },
        { propertyId: '16', propertyName: 'Casa di Città Bergamo', income: 1200, color: PIE_COLORS[7] },
        { propertyId: '19', propertyName: 'Studio Professionale', income: 1400, color: PIE_COLORS[8] },
    ],
    year_to_date: [
        { propertyId: '1', propertyName: 'Appartamento Centrale', income: 1900, color: PIE_COLORS[0] },
        { propertyId: '3', propertyName: 'Negozio Corso Buenos Aires', income: 5000, color: PIE_COLORS[1] },
        { propertyId: '4', propertyName: 'Ufficio Porta Nuova', income: 6400, color: PIE_COLORS[2] },
        { propertyId: '6', propertyName: 'Mansarda Brera', income: 1600, color: PIE_COLORS[3] },
        { propertyId: '10', propertyName: 'Laboratorio Artigianale', income: 2200, color: PIE_COLORS[4] },
        { propertyId: '16', propertyName: 'Casa di Città Bergamo', income: 2400, color: PIE_COLORS[5] },
    ],
    last_12_months: [
        { propertyId: '1', propertyName: 'Appartamento Centrale', income: 11400, color: PIE_COLORS[0] },
        { propertyId: '3', propertyName: 'Negozio Corso Buenos Aires', income: 30000, color: PIE_COLORS[1] },
        { propertyId: '4', propertyName: 'Ufficio Porta Nuova', income: 38400, color: PIE_COLORS[2] },
        { propertyId: '6', propertyName: 'Mansarda Brera', income: 9600, color: PIE_COLORS[3] },
        { propertyId: '8', propertyName: 'Stanza Singola Città Studi', income: 5400, color: PIE_COLORS[4] },
        { propertyId: '10', propertyName: 'Laboratorio Artigianale', income: 13200, color: PIE_COLORS[5] },
        { propertyId: '14', propertyName: 'Bilocale Sempione', income: 9000, color: PIE_COLORS[6] },
        { propertyId: '16', propertyName: 'Casa di Città Bergamo', income: 14400, color: PIE_COLORS[7] },
        { propertyId: '19', propertyName: 'Studio Professionale', income: 16800, color: PIE_COLORS[8] },
        { propertyId: '21', propertyName: 'Roulotte Campeggio', income: 3600, color: PIE_COLORS[9] },
    ],
};

/* ─── Line Chart: andamento mensile (12 mesi) ──────────────── */

export const mockMonthlyData12Months: MonthlyDataPoint[] = [
    { label: 'apr', income: 0, expenses: 0 },
    { label: 'mag', income: 0, expenses: 0 },
    { label: 'giu', income: 320, expenses: 150 },
    { label: 'lug', income: 450, expenses: 180 },
    { label: 'ago', income: 450, expenses: 95 },
    { label: 'set', income: 1250, expenses: 320 },
    { label: 'ott', income: 1250, expenses: 210 },
    { label: 'nov', income: 1680, expenses: 540 },
    { label: 'dic', income: 2100, expenses: 1850 },
    { label: 'gen', income: 8370, expenses: 1250 },
    { label: 'feb', income: 10520, expenses: 1480 },
    { label: 'mar', income: 8370, expenses: 1250 },
];

/* ─── Line Chart: andamento annuale (10 anni) ──────────────── */

export const mockYearlyData10Years: MonthlyDataPoint[] = [
    { label: '2017', income: 0, expenses: 0 },
    { label: '2018', income: 0, expenses: 0 },
    { label: '2019', income: 0, expenses: 0 },
    { label: '2020', income: 15200, expenses: 4800 },
    { label: '2021', income: 38500, expenses: 9200 },
    { label: '2022', income: 56800, expenses: 12400 },
    { label: '2023', income: 78300, expenses: 14100 },
    { label: '2024', income: 98500, expenses: 15600 },
    { label: '2025', income: 112400, expenses: 16200 },
    { label: '2026', income: 18890, expenses: 2730 },
];
