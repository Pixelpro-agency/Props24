import { useCallback, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';

import {
    PropertyFormProvider,
    usePropertyFormContext,
} from '../components/property-form/PropertyFormProvider';
import {
    PROPERTY_TABS,
    PropertyFormTabs,
    type PropertyTabId,
} from '../components/property-form/PropertyFormTabs';
import type { PropertyFormData } from '../components/property-form/schema';
import { Tab1Info } from '../components/property-form/tabs/Tab1Info';
import { Tab2Additional } from '../components/property-form/tabs/Tab2Additional';
import { Tab3Financial } from '../components/property-form/tabs/Tab3Financial';
import { Tab4Passwords } from '../components/property-form/tabs/Tab4Passwords';
import { Tab5Contracts } from '../components/property-form/tabs/Tab5Contracts';
import { Tab6Flyer } from '../components/property-form/tabs/Tab6Flyer';
import { Tab7Photos } from '../components/property-form/tabs/Tab7Photos';
import { Tab8Contacts } from '../components/property-form/tabs/Tab8Contacts';
import { Tab9Documents } from '../components/property-form/tabs/Tab9Documents';
import { StatusToast } from '../components/ui/StatusToast';
import { createProperty } from '../db/propertyRepository';
import { useAuth } from '../auth/AuthContext';
import type { BuildingRecord } from '../db/database.types';
import { useBuildingDetail } from '../hooks/useBuildingDetail';
import {
    defaultPropertyFormStateValues,
    normalizePropertyDraftState,
    type PropertyFormState,
} from '../components/property-form/schema';

interface PropertyFormContentProps {
    activeTab: PropertyTabId;
    submitError: string | null;
    addressReadOnly?: boolean;
}

function PropertyFormContent({
    activeTab,
    submitError,
    addressReadOnly = false,
}: PropertyFormContentProps) {
    const navigate = useNavigate();
    const draft = usePropertyFormContext();
    const operationsPending =
        draft.isSubmitting || draft.isSavingDraft || draft.isDeletingDraft;
    const toast = !draft.isSubmitRecovery && draft.draftError
        ? {
            variant: 'error' as const,
            title: 'Errore bozza',
            message: draft.draftError,
        }
        : draft.draftSuccess
            ? {
                variant: 'success' as const,
                title: 'Bozza',
                message: draft.draftSuccess,
            }
            : null;

    return (
        <>
            <StatusToast
                toast={toast}
                onClose={draft.clearDraftFeedback}
            />
            <div className="bg-gray-50/50">
                <div className="max-w-7xl mx-auto w-full">
                    <PropertyFormTabs />
                    <div className="p-6" id="property-form-content">
                        <PropertyFormErrors submitError={submitError} />
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm min-h-[400px]">
                            {activeTab === 'info1' && (
                                <Tab1Info addressReadOnly={addressReadOnly} />
                            )}
                            {activeTab === 'info2' && <Tab2Additional />}
                            {activeTab === 'info9' && <Tab3Financial />}
                            {activeTab === 'info10' && <Tab4Passwords />}
                            {activeTab === 'info3' && <Tab5Contracts />}
                            {activeTab === 'info6' && <Tab6Flyer />}
                            {activeTab === 'info4' && <Tab7Photos />}
                            {activeTab === 'info7' && <Tab8Contacts />}
                            {activeTab === 'info5' && <Tab9Documents />}
                        </div>
                        <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    void draft.saveDraft()
                                        .catch(() => undefined);
                                }}
                                disabled={
                                    draft.draftPhase !== 'ready'
                                    || operationsPending
                                }
                                className="inline-flex items-center justify-center rounded-md border border-green-600 bg-white px-4 py-2.5 text-sm font-medium text-green-700 shadow-sm transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {draft.isSavingDraft
                                    ? 'Salvataggio bozza...'
                                    : 'Salva bozza'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                disabled={operationsPending}
                                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                disabled={operationsPending}
                                className="inline-flex min-w-[100px] items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {draft.isSubmitting ? 'Salvataggio...' : (
                                    <>
                                        <Save className="w-4 h-4 ml-[-4px]" />
                                        Salva
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export function NewProperty() {
    const { search } = useLocation();
    const query = new URLSearchParams(search);

    if (!query.has('buildingId')) return <NewPropertyForm />;

    return <BuildingContextNewProperty buildingId={query.get('buildingId') ?? ''} />;
}

function BuildingContextNewProperty({ buildingId }: { buildingId: string }) {
    const { account } = useAuth();
    const { loading, building } = useBuildingDetail(
        account?.id ?? null,
        buildingId,
    );

    if (loading) {
        return <p role="status" className="p-6">Caricamento edificio...</p>;
    }
    if (!building) {
        return (
            <div className="p-6">
                <p role="alert">Edificio non disponibile.</p>
                <Link to="/properties/buildings">Torna agli edifici</Link>
            </div>
        );
    }
    if (building.archived) {
        return (
            <div className="p-6">
                <p role="alert">
                    L'edificio è archiviato e non può ricevere nuove unità.
                </p>
                <Link to="/properties/buildings">Torna agli edifici</Link>
            </div>
        );
    }

    return <NewPropertyForm building={building} />;
}

function NewPropertyForm({ building }: { building?: BuildingRecord }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTabId] = useState<PropertyTabId>(
        PROPERTY_TABS[0].id,
    );
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
    const contextFields = useMemo(() => (
        buildingId ? {
            PropertyBuildingId: buildingId,
            PropertyAddress: buildingAddress ?? '',
            PropertyAddress2: buildingAddress2 ?? '',
            PropertyCity: buildingCity ?? '',
            PropertyPostalCode: buildingPostalCode ?? '',
            PropertyCounty: buildingCounty ?? '',
            PropertyState: buildingState ?? '',
            PropertyCountry: buildingCountry ?? '',
        } : null
    ), [
        buildingId,
        buildingAddress,
        buildingAddress2,
        buildingCity,
        buildingPostalCode,
        buildingCounty,
        buildingState,
        buildingCountry,
    ]);
    const initialState = useMemo<PropertyFormState | undefined>(() => (
        contextFields
            ? normalizePropertyDraftState({
                ...defaultPropertyFormStateValues,
                ...contextFields,
            })
            : undefined
    ), [contextFields]);
    const constrainSnapshot = useCallback((snapshot: PropertyFormState) => (
        contextFields ? { ...snapshot, ...contextFields } : snapshot
    ), [contextFields]);

    const setActiveTab = (id: string | PropertyTabId) => {
        setActiveTabId(id as PropertyTabId);
    };

    const handleCreateProperty = (data: PropertyFormData) => {
        setSubmitError(null);
        const record = building
            ? createProperty(data, { buildingId: building.id })
            : createProperty(data);
        return { id: record.id };
    };

    const handlePropertyCreated = ({ id }: { id: string }) => {
        navigate(`/properties/units/${id}`);
    };

    return (
        <div className="flex min-h-full flex-col">
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            aria-label="Indietro"
                            onClick={() => navigate(-1)}
                            disabled={isFormBusy}
                            className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-normal text-gray-800">
                            Nuova unita
                        </h1>
                    </div>
                </div>
            </div>
            <PropertyFormProvider
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onCreateProperty={handleCreateProperty}
                onPropertyCreated={handlePropertyCreated}
                onSubmitError={setSubmitError}
                onExitDraft={() => navigate(-1)}
                onFormBusyChange={setIsFormBusy}
                initialState={initialState}
                constrainSnapshot={building ? constrainSnapshot : undefined}
            >
                <PropertyFormContent
                    activeTab={activeTab}
                    submitError={submitError}
                    addressReadOnly={Boolean(building)}
                />
            </PropertyFormProvider>
        </div>
    );
}

function PropertyFormErrors({ submitError }: { submitError: string | null }) {
    const {
        formState: { errors },
    } = useFormContext<PropertyFormData>();
    const hasErrors = Object.keys(errors).length > 0;

    if (!hasErrors && !submitError) return null;

    return (
        <div
            role="alert"
            className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm"
        >
            <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                    <h3 className="text-sm font-medium text-red-800">
                        Impossibile salvare. Ci sono degli errori da correggere:
                    </h3>
                    {submitError ? (
                        <p className="mt-2 text-sm text-red-700">
                            {submitError}
                        </p>
                    ) : null}
                    {hasErrors ? (
                        <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                            {Object.entries(errors).map(([field, error]) => (
                                <li key={field}>
                                    <span className="font-semibold">
                                        {field}
                                    </span>
                                    : {(error as { message?: string })?.message
                                        || 'Campo non valido'}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
