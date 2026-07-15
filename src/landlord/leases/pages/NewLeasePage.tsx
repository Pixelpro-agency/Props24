import React from 'react';
import { useProperties } from '../hooks/useProperties';
import { EmptyState } from '../components/EmptyState';
import { LeaseForm } from '../components/LeaseForm';
import { MoreHorizontal } from 'lucide-react';

export const NewLeasePage: React.FC = () => {
    const { hasProperties, isLoading } = useProperties();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 font-sans">

            {/* Page Header */}
            <div className="flex justify-between items-end border-b border-gray-200 pb-3 mb-8">
                <h1 className="text-3xl font-normal text-[#333] flex items-center gap-2 m-0">
                    <a href="/leases" className="text-gray-300 hover:text-gray-500 font-light text-2xl" aria-label="Indietro">&lt;</a>
                    Nuova locazione
                </h1>
                <div className="flex items-center gap-2">
                    <button className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 bg-white shadow-sm transition-colors text-gray-600">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Conditional Content */}
            {!hasProperties ? (
                <EmptyState
                    message="Non avete delle Proprietà."
                    highlightedText="Proprietà"
                    action={{
                        label: "Crea una Proprietà",
                        href: "/properties/new"
                    }}
                />
            ) : (
                <LeaseForm />
            )}
        </div>
    );
};
