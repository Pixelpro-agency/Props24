import { Activity } from 'lucide-react';

interface TenantActivityTabProps {
    activityHistory?: any[];
}

export function TenantActivityTab({ activityHistory = [] }: TenantActivityTabProps) {
    if (!activityHistory || activityHistory.length === 0) {
        return (
            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <Activity className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500">Nessuna attività</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Attività recenti</h3>
            <div className="space-y-6">
                {/* Timeline UI placeholder in caso ci fossero dati */}
                <p className="text-sm text-gray-500">Timeline attività (non implementata nel design richiesto)</p>
            </div>
        </div>
    );
}
