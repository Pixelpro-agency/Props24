// Pagina "Nuovo Inquilino" — assembla header, breadcrumb, tabs e form
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantFormProvider } from '../components/tenant-form/TenantFormProvider';
import { TenantFormTabs, TENANT_TABS } from '../components/tenant-form/TenantFormTabs';
import type { TenantTabId } from '../components/tenant-form/TenantFormTabs';
import { Tab1General } from '../components/tenant-form/tabs/Tab1General';
import { Tab2Additional } from '../components/tenant-form/tabs/Tab2Additional';
import { Tab3Guarantors } from '../components/tenant-form/tabs/Tab3Guarantors';
import { Tab4Emergency } from '../components/tenant-form/tabs/Tab4Emergency';
import { Tab5Documents } from '../components/tenant-form/tabs/Tab5Documents';
import type { TenantFormData } from '../components/tenant-form/schema';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

function GlobalErrorBanner() {
    const { formState: { errors } } = useFormContext();

    if (Object.keys(errors).length === 0) return null;

    return (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
            <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                    <h3 className="text-sm font-medium text-red-800">
                        Impossibile salvare. Ci sono degli errori di validazione nel form:
                    </h3>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                        {Object.entries(errors).map(([field, error]) => (
                            <li key={field}>
                                <span className="font-semibold">{field}</span>: {(error as any)?.message || 'Campo non valido'}
                            </li>
                        ))}
                    </ul>
                    <p className="text-xs text-red-600 mt-2">
                        Controlla i vari tab per trovare e correggere gli errori (i campi obbligatori sono contrassegnati da *).
                    </p>
                </div>
            </div>
        </div>
    );
}

export function NewTenantPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTabId] = useState<TenantTabId>(TENANT_TABS[0].id);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const setActiveTab = (id: string | TenantTabId) => {
        setActiveTabId(id as TenantTabId);
    };

    const handleSubmit = async (data: TenantFormData) => {
        setIsSubmitting(true);

        // Simula chiamata di rete
        await new Promise(resolve => setTimeout(resolve, 800));

        console.log('=== TENANT SUBMITTED ===');
        console.log('JSON Payload:');
        console.log(JSON.stringify(data, null, 2));

        setIsSubmitting(false);
        setSubmitSuccess(true);

        // Nascondi il messaggio dopo 3 secondi
        setTimeout(() => setSubmitSuccess(false), 3000);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-normal text-gray-800">Nuovo inquilino</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {submitSuccess && (
                            <span className="text-sm text-green-600 font-medium animate-pulse">
                                ✓ Salvato con successo
                            </span>
                        )}
                        <button
                            type="submit"
                            form="tenant-form"
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

            {/* Form */}
            <TenantFormProvider
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onSubmit={handleSubmit}
            >
                <div className="flex-1 min-h-0 bg-gray-50/50 flex flex-col">
                    <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
                        <TenantFormTabs />

                        <div className="flex-1 overflow-y-auto p-6 pb-32 relative">
                            <GlobalErrorBanner />
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-[400px]">
                                {activeTab === 'info1' && <Tab1General />}
                                {activeTab === 'info2' && <Tab2Additional />}
                                {activeTab === 'info3' && <Tab3Guarantors />}
                                {activeTab === 'info5' && <Tab4Emergency />}
                                {activeTab === 'info4' && <Tab5Documents />}
                            </div>
                        </div>
                    </div>
                </div>
            </TenantFormProvider>
        </div>
    );
}
