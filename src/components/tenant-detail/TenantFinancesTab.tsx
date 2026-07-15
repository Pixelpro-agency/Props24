import { Coins } from 'lucide-react';
import type { TenantFinance } from '../../types/tenantDetail';

interface TenantFinancesTabProps {
    finances?: TenantFinance;
}

export function TenantFinancesTab({ finances }: TenantFinancesTabProps) {
    if (!finances) {
        return (
            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <Coins className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500">Nessun dato finanziario disponibile</p>
            </div>
        );
    }

    const formatCurrency = (amount: number, currency: string = '€') => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
        }).format(amount).replace('€', currency).trim() + ' ' + currency; // Forza il formato dello screenshot
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Finanze</h3>

                <div className="space-y-4">
                    {/* Card Reddito */}
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50/30 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                        <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Reddito</div>
                            <div className="text-2xl font-semibold text-green-600">
                                {formatCurrency(finances.income.amount)}
                            </div>
                        </div>
                    </div>

                    {/* Card Saldo */}
                    <div className={`border rounded-lg p-4 flex justify-between items-center relative overflow-hidden ${finances.balance.status === 'negative'
                        ? 'border-red-200 bg-red-50/30'
                        : finances.balance.status === 'positive'
                            ? 'border-green-200 bg-green-50/30'
                            : 'border-gray-200 bg-gray-50/30'
                        }`}>
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${finances.balance.status === 'negative' ? 'bg-red-500' :
                            finances.balance.status === 'positive' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0 border border-gray-200">
                                <div className="flex -space-x-2">
                                    <div className="w-5 h-5 bg-gray-300 rounded-full border border-white"></div>
                                    <div className="w-5 h-5 bg-gray-300 rounded-full border border-white translate-y-1"></div>
                                    <div className="w-5 h-5 bg-gray-300 rounded-full border border-white"></div>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Saldo locatario</div>
                                <div className={`text-3xl font-bold ${finances.balance.status === 'negative' ? 'text-red-600' :
                                    finances.balance.status === 'positive' ? 'text-green-600' : 'text-gray-900'
                                    }`}>
                                    {formatCurrency(finances.balance.amount)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
                <button className="py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Finanze
                </button>
                <button className="py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Situazione saldo
                </button>
            </div>
        </div>
    );
}
