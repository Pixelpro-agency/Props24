import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { PropertyFormContent } from '../components/property-form/PropertyFormContent';
import { PropertyFormProvider } from '../components/property-form/PropertyFormProvider';
import { PROPERTY_TABS, type PropertyTabId } from '../components/property-form/PropertyFormTabs';
import { normalizePropertyFormState, type PropertyFormData } from '../components/property-form/schema';
import { getPropertyRecordById, updateProperty } from '../db/propertyRepository';

export function EditPropertyPage() {
    const { id = '' } = useParams();
    const { account } = useAuth();
    const hydrationKey = `${account?.id ?? ''}:${id}`;
    return <EditPropertyPageForRecord key={hydrationKey} propertyId={id} />;
}

function EditPropertyPageForRecord({ propertyId }: { propertyId: string }) {
    const navigate = useNavigate();
    const record = useMemo(() => getPropertyRecordById(propertyId), [propertyId]);
    const initialState = useMemo(() => record ? normalizePropertyFormState({
        ...record.formData,
        PropertyBuildingId: record.relations.buildingId ?? '',
    }) : null, [record]);
    const [activeTab, setActiveTab] = useState<PropertyTabId>(PROPERTY_TABS[0].id);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isFormBusy, setIsFormBusy] = useState(true);

    if (!initialState) return <div className="p-6"><p role="alert">Unità non trovata.</p><Link to="/properties/units">Torna alle unità</Link></div>;

    const handleUpdate = (data: PropertyFormData) => {
        setSubmitError(null);
        return updateProperty(propertyId, data) !== null;
    };

    return <div className="flex min-h-full flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4"><div className="flex items-center max-w-7xl mx-auto"><div className="flex items-center gap-4">
            <button type="button" aria-label="Indietro" disabled={isFormBusy} onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-2xl font-normal text-gray-800">Modifica unità</h1>
        </div></div></div>
        <PropertyFormProvider
            mode="edit"
            entityId={propertyId}
            activeTab={activeTab}
            setActiveTab={(tab) => setActiveTab(tab as PropertyTabId)}
            initialState={initialState}
            onUpdateProperty={handleUpdate}
            onPropertyUpdated={() => navigate(`/properties/units/${propertyId}`, { replace: true })}
            onExitDraft={() => navigate(`/properties/units/${propertyId}`, { replace: true })}
            onFormBusyChange={setIsFormBusy}
            onSubmitError={setSubmitError}
        >
            <PropertyFormContent mode="edit" activeTab={activeTab} submitError={submitError} />
        </PropertyFormProvider>
    </div>;
}
