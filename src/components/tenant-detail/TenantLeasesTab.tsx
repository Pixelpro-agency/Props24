import { Link } from 'react-router-dom';
import { FileText, Eye, Edit2 } from 'lucide-react';
import type { TenantLease } from '../../types/tenantDetail';

interface TenantLeasesTabProps {
    leases: TenantLease[];
}

export function TenantLeasesTab({ leases }: TenantLeasesTabProps) {
    if (!leases || leases.length === 0) {
        return (
            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Nessuna locazione</h3>
                <p className="text-sm text-gray-500">Non ci sono locazioni associate a questo inquilino.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {leases.map((lease) => (
                <div key={lease.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    {lease.propertyName}
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${lease.status === 'Attiva' ? 'bg-green-100 text-green-800' :
                                        lease.status === 'Terminata' ? 'bg-gray-100 text-gray-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {lease.status}
                                    </span>
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">{lease.address}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 text-sm mb-4">
                            <div>
                                <p className="text-gray-500 text-xs">Tipo contratto</p>
                                <p className="font-medium text-gray-900">{lease.contractType}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Periodo</p>
                                <p className="font-medium text-gray-900">{lease.dateRange.start} - {lease.dateRange.end}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Affitto</p>
                                <p className="font-medium text-gray-900">{lease.rent.amount.toFixed(2)}{lease.rent.currency} <span className="text-gray-500 font-normal">/ {lease.rent.frequency === 'mensile' || lease.rent.frequency === 'monthly' ? 'mese' : lease.rent.frequency}</span></p>
                            </div>
                            {lease.expenses && (
                                <div>
                                    <p className="text-gray-500 text-xs">{lease.expenses.type}</p>
                                    <p className="font-medium text-gray-900">{lease.expenses.amount.toFixed(2)}{lease.expenses.currency}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                            <Link to={`/leases/${lease.id}/edit`} className="flex-1 flex justify-center items-center gap-2 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                <Edit2 className="w-4 h-4" />
                                Modifica
                            </Link>
                            <Link to={`/leases/${lease.id}`} className="flex-1 flex justify-center items-center gap-2 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                <Eye className="w-4 h-4" />
                                Visualizza
                            </Link>
                        </div>
                    </div>
                </div>
            ))}

            {leases.length > 0 && (
                <div className="text-center pt-2">
                    <Link to="/leases" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                        Visualizza tutte le locazioni
                    </Link>
                </div>
            )}
        </div>
    );
}
