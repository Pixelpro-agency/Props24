import { useState, useMemo, useCallback, useEffect } from 'react';
import type {
    RevenuePeriod,
    RevenueStats,
    PropertyIncome,
    MonthlyDataPoint,
    LineChartPeriod,
} from '../types/dashboard';
import { getLineChartData, getPropertyIncome, getRevenueStats } from '../db/dashboardRepository';
import { subscribeJsonDb } from '../db/jsonDb';

interface DashboardRevenueReturn {
    revenuePeriod: RevenuePeriod;
    setRevenuePeriod: (p: RevenuePeriod) => void;
    revenueStats: RevenueStats;
    piePeriod: RevenuePeriod;
    setPiePeriod: (p: RevenuePeriod) => void;
    propertyIncomes: PropertyIncome[];
    lineChartPeriod: LineChartPeriod;
    setLineChartPeriod: (p: LineChartPeriod) => void;
    lineChartData: MonthlyDataPoint[];
}

export function useDashboardRevenue(): DashboardRevenueReturn {
    const [dbVersion, setDbVersion] = useState(0);
    const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('current_month');
    const [piePeriod, setPiePeriod] = useState<RevenuePeriod>('current_month');
    const [lineChartPeriod, setLineChartPeriodRaw] = useState<LineChartPeriod>('12_months');

    useEffect(() => subscribeJsonDb(() => setDbVersion((version) => version + 1)), []);

    const revenueStats = useMemo<RevenueStats>(
        () => getRevenueStats(revenuePeriod),
        [revenuePeriod, dbVersion],
    );

    const propertyIncomes = useMemo<PropertyIncome[]>(
        () => getPropertyIncome(piePeriod),
        [piePeriod, dbVersion],
    );

    const setLineChartPeriod = useCallback((p: LineChartPeriod) => {
        setLineChartPeriodRaw(p);
    }, []);

    const lineChartData = useMemo<MonthlyDataPoint[]>(
        () => getLineChartData(lineChartPeriod),
        [lineChartPeriod, dbVersion],
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
