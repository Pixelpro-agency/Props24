import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { PropertyRecord } from '../db/database.types';
import { useBuildingDetail } from '../hooks/useBuildingDetail';
import { BuildingEditForm } from '../components/building-form/BuildingEditForm';

function UnitCard({ unit }: { unit: PropertyRecord }) {
    const data = unit.formData;
    const location = [data.PropertyPostalCode, data.PropertyCity].filter(Boolean).join(' ');

    return (
        <li className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-lg font-medium text-gray-900">
                    <Link className="hover:text-green-700 hover:underline" to={`/properties/units/${unit.id}`}>
                        {data.PropertyTitle || 'Unità senza nome'}
                    </Link>
                </h3>
                {unit.archived && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        Archiviata
                    </span>
                )}
            </div>
            <address className="mt-2 not-italic text-sm text-gray-600">
                {data.PropertyAddress && <p>{data.PropertyAddress}</p>}
                {data.PropertyAddress2 && <p>{data.PropertyAddress2}</p>}
                {location && <p>{location}</p>}
            </address>
            {(data.PropertyFloor || data.PropertyDoorNum) && (
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    {data.PropertyFloor && <div><dt className="inline text-gray-500">Piano: </dt><dd className="inline">{data.PropertyFloor}</dd></div>}
                    {data.PropertyDoorNum && <div><dt className="inline text-gray-500">Interno: </dt><dd className="inline">{data.PropertyDoorNum}</dd></div>}
                </dl>
            )}
        </li>
    );
}

export function BuildingDetailPage() {
    const { account } = useAuth();
    const { id } = useParams<{ id: string }>();
    const accountId = account?.id ?? null;
    const buildingId = id ?? null;

    return (
        <BuildingDetailContent
            key={`${accountId ?? ''}:${buildingId ?? ''}`}
            accountId={accountId}
            buildingId={buildingId}
        />
    );
}

function BuildingDetailContent({
    accountId,
    buildingId,
}: {
    accountId: string | null;
    buildingId: string | null;
}) {
    const { loading, building, units } = useBuildingDetail(accountId, buildingId);
    const [isEditing, setIsEditing] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    if (loading) {
        return <main className="mx-auto w-full max-w-5xl p-6"><p role="status">Caricamento edificio...</p></main>;
    }

    if (!building) {
        return (
            <main className="mx-auto w-full max-w-5xl p-6">
                <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
                    Edificio non trovato.
                </div>
                <Link className="mt-4 inline-block text-green-700 hover:underline" to="/properties/buildings">
                    Torna agli edifici
                </Link>
            </main>
        );
    }

    const locality = [building.postalCode, building.city].filter(Boolean).join(' ');

    return (
        <main className="mx-auto w-full max-w-5xl p-6">
            <Link className="text-green-700 hover:underline" to="/properties/buildings">Torna agli edifici</Link>
            {updateSuccess && (
                <p role="status" className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-green-800">
                    Edificio aggiornato correttamente.
                </p>
            )}
            {isEditing && accountId ? (
                <section className="mt-4">
                    <BuildingEditForm
                        accountId={accountId}
                        building={building}
                        onCancel={() => setIsEditing(false)}
                        onUpdated={() => {
                            setIsEditing(false);
                            setUpdateSuccess(true);
                        }}
                    />
                </section>
            ) : (
            <section className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <h1 className="text-2xl font-medium text-gray-900">{building.identifier}</h1>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                        {building.archived ? 'Archiviato' : 'Attivo'}
                    </span>
                </div>
                {!building.archived && (
                    <Link
                        className="mt-4 inline-flex rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        to={`/properties/new?buildingId=${encodeURIComponent(building.id)}`}
                    >
                        Aggiungi unità
                    </Link>
                )}
                <button
                    type="button"
                    onClick={() => {
                        setUpdateSuccess(false);
                        setIsEditing(true);
                    }}
                    className="ml-3 mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Modifica
                </button>
                <address className="mt-4 not-italic text-gray-700">
                    <p>{building.address}</p>
                    {building.address2 && <p>{building.address2}</p>}
                    <p>{locality}</p>
                    {building.county && <p>{building.county}</p>}
                    {building.state && <p>{building.state}</p>}
                    <p>{building.country}</p>
                </address>
                <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div><dt className="text-sm text-gray-500">Unità</dt><dd className="font-medium">{units.length}</dd></div>
                    {building.size !== null && <div><dt className="text-sm text-gray-500">Superficie</dt><dd className="font-medium">{building.size.toLocaleString('it-IT')} m²</dd></div>}
                    {building.constructionYear !== null && <div><dt className="text-sm text-gray-500">Anno di costruzione</dt><dd className="font-medium">{building.constructionYear}</dd></div>}
                </dl>
                {building.description && <p className="mt-5 text-gray-700">{building.description}</p>}
            </section>
            )}

            <section className="mt-8" aria-labelledby="linked-units-heading">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="linked-units-heading" className="text-xl font-medium text-gray-900">Unità collegate</h2>
                    <p className="text-sm text-gray-600">{units.length} {units.length === 1 ? 'unità' : 'unità'}</p>
                </div>
                {units.length === 0 ? (
                    <p className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-gray-600">Nessuna unità collegata.</p>
                ) : (
                    <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                        {units.map((unit) => <UnitCard key={unit.id} unit={unit} />)}
                    </ul>
                )}
            </section>
        </main>
    );
}
