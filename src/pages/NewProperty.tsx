import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormContext } from 'react-hook-form';
import { PropertyFormProvider } from '../components/property-form/PropertyFormProvider';
import { PropertyFormTabs, PROPERTY_TABS } from '../components/property-form/PropertyFormTabs';
import { Tab1Info } from '../components/property-form/tabs/Tab1Info';
import { Tab2Additional } from '../components/property-form/tabs/Tab2Additional';
import { Tab3Financial } from '../components/property-form/tabs/Tab3Financial';
import { Tab4Passwords } from '../components/property-form/tabs/Tab4Passwords';
import { Tab5Contracts } from '../components/property-form/tabs/Tab5Contracts';
import { Tab6Flyer } from '../components/property-form/tabs/Tab6Flyer';
import { Tab7Photos } from '../components/property-form/tabs/Tab7Photos';
import { Tab8Contacts } from '../components/property-form/tabs/Tab8Contacts';
import { Tab9Documents } from '../components/property-form/tabs/Tab9Documents';
import type { PropertyTabId } from '../components/property-form/PropertyFormTabs';
import type { PropertyFormData } from '../components/property-form/schema';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { createProperty } from '../db/propertyRepository';

export function NewProperty() {
  const navigate = useNavigate();
  const [activeTab, setActiveTabId] = useState<PropertyTabId>(PROPERTY_TABS[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setActiveTab = (id: string | PropertyTabId) => {
    setActiveTabId(id as PropertyTabId);
  };

  const handleSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const record = createProperty(data);
      navigate(`/properties/units/${record.id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Errore durante il salvataggio della nuova unita.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-normal text-gray-800">Nuova unita</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              form="property-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors min-w-[100px] justify-center"
            >
              {isSubmitting ? 'Salvataggio...' : (
                <>
                  <Save className="w-4 h-4 ml-[-4px]" />
                  Salva
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <PropertyFormProvider
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSubmit={handleSubmit}
        onSubmitError={setSubmitError}
      >
        <div className="flex-1 min-h-0 bg-gray-50/50 flex flex-col">
          <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
            <PropertyFormTabs />

            <div className="flex-1 overflow-y-auto p-6 pb-32 relative" id="property-form-content">
              <PropertyFormErrors submitError={submitError} />

              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm min-h-[400px]">
                {activeTab === 'info1' && <Tab1Info />}
                {activeTab === 'info2' && <Tab2Additional />}
                {activeTab === 'info9' && <Tab3Financial />}
                {activeTab === 'info10' && <Tab4Passwords />}
                {activeTab === 'info3' && <Tab5Contracts />}
                {activeTab === 'info6' && <Tab6Flyer />}
                {activeTab === 'info4' && <Tab7Photos />}
                {activeTab === 'info7' && <Tab8Contacts />}
                {activeTab === 'info5' && <Tab9Documents />}
              </div>
            </div>
          </div>
        </div>
      </PropertyFormProvider>
    </div>
  );
}

function PropertyFormErrors({ submitError }: { submitError: string | null }) {
  const { formState: { errors } } = useFormContext<PropertyFormData>();
  const hasErrors = Object.keys(errors).length > 0;

  if (!hasErrors && !submitError) return null;

  return (
    <div role="alert" className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-red-800">
            Impossibile salvare. Ci sono degli errori da correggere:
          </h3>
          {submitError && (
            <p className="mt-2 text-sm text-red-700">{submitError}</p>
          )}
          {hasErrors && (
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>
                  <span className="font-semibold">{field}</span>: {(error as { message?: string })?.message || 'Campo non valido'}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
