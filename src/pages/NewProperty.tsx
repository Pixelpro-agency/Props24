import { useCallback, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { useAuth } from '../auth/AuthContext';
import { PropertyFormContent } from '../components/property-form/PropertyFormContent';
import { PropertyFormProvider } from '../components/property-form/PropertyFormProvider';
import { PROPERTY_TABS, type PropertyTabId } from '../components/property-form/PropertyFormTabs';
import {
    defaultPropertyFormStateValues,
    normalizePropertyDraftState,
    type PropertyFormData,
    type PropertyFormState,
} from '../components/property-form/schema';
import type { BuildingRecord } from '../db/database.types';
import { createProperty } from '../db/propertyRepository';
import { useBuildingDetail } from '../hooks/useBuildingDetail';

export function NewProperty() {
    const { search } = useLocation();
    const query = new URLSearchParams(search);
    if (!query.has('buildingId')) return <NewPropertyForm />;
    return <BuildingContextNewProperty buildingId={query.get('buildingId') ?? ''} />;
}

function BuildingContextNewProperty({ buildingId }: { buildingId: string }) {
    const { account } = useAuth();
    const { loading, building } = useBuildingDetail(account?.id ?? null, buildingId);
    if (loading) return <p role="status" className="p-6">Caricamento edificio...</p>;
    if (!building) return <div className="p-6"><p role="alert">Edificio non disponibile.</p><Link to="/properties/buildings">Torna agli edifici</Link></div>;
    if (building.archived) return <div className="p-6"><p role="alert">L'edificio è archiviato e non può ricevere nuove unità.</p><Link to="/properties/buildings">Torna agli edifici</Link></div>;
    return <NewPropertyForm building={building} />;
}

function NewPropertyForm({ building }: { building?: BuildingRecord }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTabId] = useState<PropertyTabId>(PROPERTY_TABS[0].id);
    const [isFormBusy, setIsFormBusy] = useState(true);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const buildingId = building?.id;
    const buildingAddress = building?.address;
    const buildingAddress2 = building?.address2;
    const buildingCity = building?.city;
    const buildingPostalCode = building?.postalCode;
    const buildingCounty = building?.county;
    const buildingState = building?.state;
    const buildingCountry = building?.country;
    const contextFields = useMemo(() => buildingId ? {
        PropertyBuildingId: buildingId,
        PropertyAddress: buildingAddress ?? '',
        PropertyAddress2: buildingAddress2 ?? '',
        PropertyCity: buildingCity ?? '',
        PropertyPostalCode: buildingPostalCode ?? '',
        PropertyCounty: buildingCounty ?? '',
        PropertyState: buildingState ?? '',
        PropertyCountry: buildingCountry ?? '',
    } : null, [
        buildingId,
        buildingAddress,
        buildingAddress2,
        buildingCity,
        buildingPostalCode,
        buildingCounty,
        buildingState,
        buildingCountry,
    ]);
    const initialState = useMemo<PropertyFormState | undefined>(() => contextFields
        ? normalizePropertyDraftState({ ...defaultPropertyFormStateValues, ...contextFields })
        : undefined, [contextFields]);
    const constrainSnapshot = useCallback((snapshot: PropertyFormState) => contextFields
        ? { ...snapshot, ...contextFields }
        : snapshot, [contextFields]);

    const handleCreateProperty = (data: PropertyFormData) => {
        setSubmitError(null);
        const record = building ? createProperty(data, { buildingId: building.id }) : createProperty(data);
        return { id: record.id };
    };

    return <div className="flex min-h-full flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4"><div className="flex items-center max-w-7xl mx-auto"><div className="flex items-center gap-4">
            <button type="button" aria-label="Indietro" onClick={() => navigate(-1)} disabled={isFormBusy} className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-2xl font-normal text-gray-800">Nuova unita</h1>
        </div></div></div>
        <PropertyFormProvider
            mode="create"
            activeTab={activeTab}
            setActiveTab={(id) => setActiveTabId(id as PropertyTabId)}
            onCreateProperty={handleCreateProperty}
            onPropertyCreated={({ id }) => navigate(`/properties/units/${id}`)}
            onSubmitError={setSubmitError}
            onExitDraft={() => navigate(-1)}
            onFormBusyChange={setIsFormBusy}
            initialState={initialState}
            constrainSnapshot={building ? constrainSnapshot : undefined}
        >
            <PropertyFormContent activeTab={activeTab} submitError={submitError} addressReadOnly={Boolean(building)} />
        </PropertyFormProvider>
    </div>;
}
