import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { LeaseForm } from '../components/LeaseForm';
import { getJsonDb, subscribeJsonDb } from '../../../db/jsonDb';

function activePropertyCount(): number {
    return getJsonDb().properties.filter((property) => !property.archived).length;
}

export const NewLeasePage: React.FC = () => {
    const [propertyCount, setPropertyCount] = useState(() => activePropertyCount());

    useEffect(() => {
        const refresh = () => setPropertyCount(activePropertyCount());
        refresh();
        return subscribeJsonDb(refresh);
    }, []);

    return (
        <div className="mx-auto max-w-7xl p-4 font-sans md:p-6 lg:p-8">
            <div className="mb-8 flex items-end justify-between border-b border-gray-200 pb-3">
                <h1 className="m-0 flex items-center gap-2 text-3xl font-normal text-[#333]">
                    <Link to="/leases" className="text-gray-300 hover:text-gray-500" aria-label="Indietro">
                        <ChevronLeft className="h-7 w-7" />
                    </Link>
                    Nuova locazione
                </h1>
            </div>

            {propertyCount === 0 ? (
                <div className="rounded border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center">
                    <h2 className="text-xl font-semibold text-gray-800">Non avete delle Proprietà.</h2>
                    <Link to="/properties/new" className="mt-5 inline-flex rounded bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700">
                        Crea una Proprietà
                    </Link>
                </div>
            ) : (
                <LeaseForm />
            )}
        </div>
    );
};
