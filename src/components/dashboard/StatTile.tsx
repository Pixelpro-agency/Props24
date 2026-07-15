import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import type { EntityCount } from '../../types/dashboard';

interface StatTileProps {
    title: string;
    icon: React.ElementType;
    counts: EntityCount;
    manageLink: string;
    archiveLink: string;
}

/* ── Animated Number Counter ───────────────────────────── */

function AnimatedCount({ value }: { value: number }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<number | null>(null);

    useEffect(() => {
        const start = 0;
        const end = value;
        const duration = 600; // ms
        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(start + (end - start) * eased));
            if (progress < 1) {
                ref.current = requestAnimationFrame(animate);
            }
        };

        ref.current = requestAnimationFrame(animate);
        return () => {
            if (ref.current) cancelAnimationFrame(ref.current);
        };
    }, [value]);

    return <>{display}</>;
}

export function StatTile({ title, icon: Icon, counts, manageLink, archiveLink }: StatTileProps) {
    return (
        <div className="flex flex-col bg-[#f9f9f9] border border-[#e5e5e5] rounded-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-[#e5e5e5]">
                <h3 className="text-gray-700 font-semibold text-sm">
                    {title}
                </h3>
                <Link
                    to={manageLink}
                    className="text-gray-400 hover:text-gray-700 transition-colors tooltip-trigger"
                    title="Gestire"
                >
                    <Settings className="w-4 h-4" />
                </Link>
            </div>

            {/* Content */}
            <div className="flex items-center p-4">
                {/* Icon */}
                <div className="flex-shrink-0 mr-4">
                    <Icon className="w-9 h-9 text-gray-400" strokeWidth={1.5} />
                </div>

                {/* Vertical Divider */}
                <div className="h-10 w-px bg-gray-200 mr-4"></div>

                {/* Stats */}
                <div className="flex items-start">
                    <span className="text-4xl leading-none font-medium text-[#72a333] mr-2">
                        <AnimatedCount value={counts.active} />
                    </span>
                    <div className="flex flex-col text-xs text-gray-500 leading-tight pt-1">
                        <span className="font-bold text-gray-700">DI {counts.total}</span>
                        <Link
                            to={archiveLink}
                            className="hover:underline hover:text-gray-700 uppercase"
                        >
                            {counts.archived} Archivio
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
