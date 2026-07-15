import { motion } from 'framer-motion';

/* ── Shimmer base ──────────────────────────────────────── */
function Shimmer({ className }: { className?: string }) {
    return (
        <div
            className={`relative overflow-hidden bg-gray-200 rounded ${className ?? ''}`}
        >
            <div
                className="absolute inset-0 animate-shimmer"
                style={{
                    background:
                        'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                }}
            />
        </div>
    );
}

/* ── Skeleton blocks ─────────────────────────────────── */

function GreetingSkeleton() {
    return (
        <div className="mb-8">
            <Shimmer className="h-8 w-64 rounded-md" />
        </div>
    );
}

function QuickActionsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 bg-white"
                >
                    <Shimmer className="w-14 h-14 rounded-full mb-3" />
                    <Shimmer className="h-4 w-20" />
                </div>
            ))}
        </div>
    );
}

function StatTilesSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="flex flex-col bg-[#f9f9f9] border border-[#e5e5e5] rounded-sm overflow-hidden"
                >
                    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-[#e5e5e5]">
                        <Shimmer className="h-4 w-20" />
                        <Shimmer className="h-4 w-4 rounded" />
                    </div>
                    <div className="flex items-center p-4">
                        <Shimmer className="w-9 h-9 rounded mr-4" />
                        <div className="h-10 w-px bg-gray-200 mr-4" />
                        <div className="flex flex-col gap-1">
                            <Shimmer className="h-8 w-12" />
                            <Shimmer className="h-3 w-16" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function RevenuePanelSkeleton() {
    return (
        <div className="bg-white border border-[#e5e5e5] rounded-sm shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 bg-[#f9f9f9] border-b border-[#e5e5e5]">
                <Shimmer className="h-5 w-32" />
                <Shimmer className="h-5 w-5 rounded" />
            </div>
            <div className="p-4 flex-grow flex flex-col">
                <div className="flex gap-2 mb-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Shimmer key={i} className="h-8 w-24 rounded" />
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Shimmer key={i} className="h-20 rounded" />
                    ))}
                </div>
                <Shimmer className="h-10 w-full rounded mt-6" />
            </div>
        </div>
    );
}

function NewsPanelSkeleton() {
    return (
        <div className="bg-white border border-[#e5e5e5] rounded-sm shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 bg-[#f9f9f9] border-b border-[#e5e5e5]">
                <Shimmer className="h-5 w-40" />
                <Shimmer className="h-5 w-5 rounded" />
            </div>
            <div className="flex-grow flex flex-col items-center justify-center p-8 min-h-[200px]">
                <Shimmer className="w-10 h-10 rounded-full mb-3" />
                <Shimmer className="h-4 w-48" />
            </div>
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="bg-white border border-[#e5e5e5] rounded-sm shadow-sm flex flex-col h-full">
            <div className="flex bg-[#f9f9f9] border-b border-[#e5e5e5] gap-2 px-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Shimmer key={i} className="h-8 w-24 rounded" />
                ))}
            </div>
            <div className="p-4 flex-grow flex items-center justify-center min-h-[300px]">
                <Shimmer className="w-full h-[250px] rounded" />
            </div>
        </div>
    );
}

/* ── Main Skeleton ────────────────────────────────────── */

export function DashboardSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 -mt-6"
        >
            <GreetingSkeleton />
            <QuickActionsSkeleton />
            <StatTilesSkeleton />

            {/* Revenue + News row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <RevenuePanelSkeleton />
                </div>
                <div className="lg:col-span-1">
                    <NewsPanelSkeleton />
                </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <ChartSkeleton />
                <ChartSkeleton />
            </div>
        </motion.div>
    );
}
