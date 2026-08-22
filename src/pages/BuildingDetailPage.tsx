import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createBuildingRepository } from '../db/buildingRepository';

export function BuildingDetailPage() {
    const { account } = useAuth();
    const { id } = useParams<{ id: string }>();
    const repository = useMemo(
        () => account ? createBuildingRepository({ accountId: account.id }) : null,
        [account],
    );
    const building = id && repository ? repository.getById(id) : null;

    if (!building) {
        return (
            <main className="mx-auto w-full max-w-4xl p-6">
                <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
                    Edificio non trovato.
                </div>
                <Link className="mt-4 inline-block text-green-700 hover:underline" to="/properties/buildings">
                    Torna agli edifici
                </Link>
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-4xl p-6">
            <Link className="text-green-700 hover:underline" to="/properties/buildings">
                Torna agli edifici
            </Link>
            <section className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-medium text-gray-900">{building.identifier}</h1>
                <address className="mt-4 not-italic text-gray-700">
                    <p>{building.address}</p>
                    <p>{building.postalCode} {building.city}</p>
                    <p>{building.country}</p>
                </address>
            </section>
        </main>
    );
}
