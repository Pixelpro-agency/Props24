/**
 * Hook per gestire i dati entrate/spese della dashboard.
 *
 * Fornisce:
 * - Revenue stats per il periodo selezionato
 * - Property income distribution (pie chart) per il periodo selezionato
 * - Line chart data (12 mesi / 10 anni)
 * - Funzione per cambiare periodo
 */
import { useState, useMemo, useCallback } from 'react';
import type {
    RevenuePeriod,
    RevenueStats,
    PropertyIncome,
    MonthlyDataPoint,
    LineChartPeriod,
} from '../types/dashboard';
import {
    mockRevenueByPeriod,
    mockPropertyIncomeByPeriod,
    mockMonthlyData12Months,
    mockYearlyData10Years,
} from '../data/mockDashboardData';

interface DashboardRevenueReturn {
    /* ── Revenue stats tab ──────────── */
    revenuePeriod: RevenuePeriod;
    setRevenuePeriod: (p: RevenuePeriod) => void;
    revenueStats: RevenueStats;

    /* ── Pie chart tab ──────────────── */
    piePeriod: RevenuePeriod;
    setPiePeriod: (p: RevenuePeriod) => void;
    propertyIncomes: PropertyIncome[];

    /* ── Line chart tab ─────────────── */
    lineChartPeriod: LineChartPeriod;
    setLineChartPeriod: (p: LineChartPeriod) => void;
    lineChartData: MonthlyDataPoint[];
}

export function useDashboardRevenue(): DashboardRevenueReturn {
    /* ── Revenue stats ──────────────── */
    const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('current_month');

    const revenueStats = useMemo<RevenueStats>(
        () => mockRevenueByPeriod[revenuePeriod],
        [revenuePeriod],
    );

    /* ── Pie chart ──────────────────── */
    const [piePeriod, setPiePeriod] = useState<RevenuePeriod>('current_month');

    const propertyIncomes = useMemo<PropertyIncome[]>(
        () => mockPropertyIncomeByPeriod[piePeriod] ?? [],
        [piePeriod],
    );

    /* ── Line chart ─────────────────── */
    const [lineChartPeriod, setLineChartPeriodRaw] = useState<LineChartPeriod>('12_months');

    const setLineChartPeriod = useCallback((p: LineChartPeriod) => {
        setLineChartPeriodRaw(p);
    }, []);

    const lineChartData = useMemo<MonthlyDataPoint[]>(
        () => (lineChartPeriod === '12_months' ? mockMonthlyData12Months : mockYearlyData10Years),
        [lineChartPeriod],
    );

    return {
        revenuePeriod,
        setRevenuePeriod,
        revenueStats,
        piePeriod,
        setPiePeriod,
        propertyIncomes,
        lineChartPeriod,
        setLineChartPeriod,
        lineChartData,
    };
}
