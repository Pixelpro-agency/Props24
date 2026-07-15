import { Activity, ExternalLink } from 'lucide-react';
import type { Activity as ActivityType } from '../../types/propertyDetail';

interface ActivityTimelineProps {
    activities: ActivityType[];
}

const typeIcons: Record<string, string> = {
    payment: '💰',
    lease: '📋',
    maintenance: '🔧',
    note: '📝',
    general: '📌',
};

function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
    if (activities.length === 0) {
        return (
            <div className="text-center py-8">
                <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Qui non c'è nulla…</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Timeline */}
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />

                {activities.map((activity) => (
                    <div key={activity.id} className="relative pl-8 pb-4 last:pb-0">
                        {/* Dot */}
                        <div className="absolute left-1.5 top-1.5 w-3 h-3 bg-white border-2 border-gray-300 rounded-full" />

                        {/* Content */}
                        <div className="text-sm">
                            <span className="mr-1.5">
                                {typeIcons[activity.type] || '📌'}
                            </span>
                            <span className="text-gray-700">{activity.description}</span>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {formatDate(activity.date)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Show all link */}
            <a
                href="/dashboard"
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium pt-2 border-t border-gray-100"
            >
                <ExternalLink className="w-3 h-3" />
                Mostra tutto
            </a>
        </div>
    );
}
