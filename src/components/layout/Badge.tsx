import type { BadgeType, BadgeItem } from '../../types/menu';
import { clsx } from 'clsx';

interface BadgeProps {
    type: BadgeType;
    count?: number;
}

/** Badge singolo (legacy) */
export function Badge({ type, count }: BadgeProps) {
    if (!type || count === undefined) return null;

    return (
        <span
            className={clsx(
                "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide min-w-[20px] text-center",
                type === 'orange' ? "bg-brand-orange text-white" : "bg-brand-red text-white"
            )}
            title={undefined}
        >
            {count}
        </span>
    );
}

/** Badge singolo da BadgeItem (con tooltip e hidden) */
export function BadgeItemDisplay({ badge }: { badge: BadgeItem }) {
    // Se hidden e count === 0, non mostrare
    if (badge.hidden && badge.count === 0) return null;
    if (!badge.class) return null;

    return (
        <span
            className={clsx(
                "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide min-w-[20px] text-center",
                badge.class === 'orange' ? "bg-brand-orange text-white" : "bg-brand-red text-white"
            )}
            title={badge.tooltip}
        >
            {badge.count}
        </span>
    );
}

/** Lista di badge multipli */
export function BadgeList({ badges }: { badges: BadgeItem[] }) {
    const visibleBadges = badges.filter(b => !(b.hidden && b.count === 0));
    if (visibleBadges.length === 0) return null;

    return (
        <div className="flex items-center gap-1">
            {visibleBadges.map(badge => (
                <BadgeItemDisplay key={badge.id} badge={badge} />
            ))}
        </div>
    );
}

