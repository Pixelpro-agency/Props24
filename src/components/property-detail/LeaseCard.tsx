import {
    MapPin,
    Users,
    Pencil,
    Eye,
    Calendar,
    Banknote,
    FileText,
    ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Lease } from '../../types/propertyDetail';

interface LeaseCardProps {
    lease: Lease;
}

function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function formatCurrency(value: number): string {
    return value.toLocaleString('it-IT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }) + '€';
}

export function LeaseCard({ lease }: LeaseCardProps) {
    const statusColors: Record<string, string> = {
        active: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        ended: 'bg-red-100 text-red-700',
    };

    const statusLabels: Record<string, string> = {
        active: 'Attiva',
        pending: 'In attesa',
        ended: 'Terminata',
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">
                        {lease.name || 'Locazione'}
                    </h4>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[lease.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[lease.status] || lease.status}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Link
                        to={`/leases/${lease.id}/edit`}
                        className="p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                        title="Modifica"
                    >
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                    </Link>
                    <Link
                        to={`/leases/${lease.id}`}
                        className="p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                        title="Visualizza"
                    >
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                    </Link>
                </div>
            </div>

            {/* Details */}
            <div className="px-4 py-3 space-y-2.5">
                {/* Address */}
                {lease.name && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
                        <span className="truncate">{lease.name}</span>
                    </div>
                )}

                {/* Tenant */}
                <div className="flex items-center gap-2 text-sm">
                    <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <Link
                        to={lease.tenant.link || `/tenants/${lease.tenant.id}`}
                        className="text-blue-600 hover:underline font-medium truncate"
                    >
                        {lease.tenant.name}
                    </Link>
                </div>

                {/* Contract type */}
                <div className="flex items-start gap-2 text-sm text-gray-600">
                    <FileText className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
                    <span>{lease.type}</span>
                </div>

                {/* Period */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                        {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                    </span>
                </div>

                {/* Rent */}
                <div className="flex items-center gap-2 text-sm">
                    <Banknote className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-gray-600">Affitto:</span>
                    <span className="font-semibold text-[#72a333]">
                        {formatCurrency(lease.rentAmount)}
                    </span>
                </div>

                {/* Utilities */}
                <div className="flex items-center gap-2 text-sm">
                    <Banknote className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-gray-600">Spese accessorie:</span>
                    <span className="font-semibold text-[#72a333]">
                        {formatCurrency(lease.utilitiesAmount)}
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                <Link
                    to={`/leases/${lease.id}`}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
                >
                    <ExternalLink className="w-3 h-3" />
                    Visualizza locazione
                </Link>
            </div>
        </div>
    );
}
