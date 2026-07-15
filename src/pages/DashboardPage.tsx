import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingCard } from '../components/dashboard/OnboardingCard';
import { GreetingHeader } from '../components/dashboard/GreetingHeader';
import { QuickActions } from '../components/dashboard/QuickActions';
import { StatTilesRow } from '../components/dashboard/StatTilesRow';
import { RevenuePanel } from '../components/dashboard/RevenuePanel';
import { PropertyPieChart } from '../components/dashboard/PropertyPieChart';
import { RevenueLineChart } from '../components/dashboard/RevenueLineChart';
import { NewsPanel } from '../components/dashboard/NewsPanel';

import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { useOnboardingProgress } from '../hooks/useOnboardingProgress';
import { useUserProfile } from '../hooks/useUserProfile';
import { useDashboardRevenue } from '../hooks/useDashboardRevenue';
import { useHasData } from '../hooks/useDashboardStats';
import { useNavigate } from 'react-router-dom';

/* ─── animation helpers ────────────────────────────────── */

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05,
        },
    },
};

const childVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
};

/* ─── page component ───────────────────────────────────── */

export function DashboardPage() {
    const { progress, steps, markStepComplete } = useOnboardingProgress();
    const { displayName, isLoading: isProfileLoading } = useUserProfile();
    const hasData = useHasData();
    const navigate = useNavigate();

    const {
        revenuePeriod,
        setRevenuePeriod,
        revenueStats,
        piePeriod,
        setPiePeriod,
        propertyIncomes,
        lineChartPeriod,
        setLineChartPeriod,
        lineChartData,
    } = useDashboardRevenue();

    /* Simulated loading state — in prod, this would depend on API status */
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    const handleStepClick = (stepNumber: number) => {
        const step = steps.find((s) => s.number === stepNumber);
        if (markStepComplete) {
            markStepComplete(stepNumber);
        }
        if (step?.href) {
            navigate(step.href);
        }
    };

    /* ── Loading state ──────────────────────────────────── */
    if (isLoading || isProfileLoading) {
        return (
            <AnimatePresence mode="wait">
                <DashboardSkeleton />
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="dashboard-content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 -mt-6"
            >
                {/* ── Greeting ─────────────────────── */}
                <motion.div variants={childVariants}>
                    <GreetingHeader userName={displayName} />
                </motion.div>

                {/* ── Onboarding (solo se non ci sono dati) ── */}
                {!hasData && (
                    <motion.div variants={childVariants} className="mb-8">
                        <OnboardingCard
                            steps={steps}
                            progress={progress}
                            onStepClick={handleStepClick}
                        />
                    </motion.div>
                )}



                {/* ── Quick Actions ────────────────── */}
                <motion.div variants={childVariants}>
                    <QuickActions />
                </motion.div>

                {/* ── Stat Tiles ──────────────────── */}
                <motion.div variants={childVariants}>
                    <StatTilesRow />
                </motion.div>

                {/* ── Revenue + News (2 colonne desktop) ── */}
                <motion.div
                    variants={childVariants}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
                >
                    {/* Colonna sinistra: Entrate e Spese (2/3) */}
                    <div className="lg:col-span-2">
                        <RevenuePanel
                            period={revenuePeriod}
                            onPeriodChange={setRevenuePeriod}
                            stats={revenueStats}
                        />
                    </div>

                    {/* Colonna destra: Notizie (1/3) */}
                    <div className="lg:col-span-1">
                        <NewsPanel />
                    </div>
                </motion.div>

                {/* ── Charts Row (Pie + Line) ─────── */}
                <motion.div
                    variants={childVariants}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
                >
                    {/* Pie Chart */}
                    <PropertyPieChart
                        period={piePeriod}
                        onPeriodChange={setPiePeriod}
                        data={propertyIncomes}
                    />

                    {/* Line Chart */}
                    <RevenueLineChart
                        period={lineChartPeriod}
                        onPeriodChange={setLineChartPeriod}
                        data={lineChartData}
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
