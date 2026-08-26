import { useFormContext } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Save } from 'lucide-react';

import { StatusToast } from '../ui/StatusToast';
import { usePropertyFormContext } from './PropertyFormProvider';
import { PropertyFormTabs, type PropertyTabId } from './PropertyFormTabs';
import type { PropertyFormData } from './schema';
import { Tab1Info } from './tabs/Tab1Info';
import { Tab2Additional } from './tabs/Tab2Additional';
import { Tab3Financial } from './tabs/Tab3Financial';
import { Tab4Passwords } from './tabs/Tab4Passwords';
import { Tab5Contracts } from './tabs/Tab5Contracts';
import { Tab6Flyer } from './tabs/Tab6Flyer';
import { Tab7Photos } from './tabs/Tab7Photos';
import { Tab8Contacts } from './tabs/Tab8Contacts';
import { Tab9Documents } from './tabs/Tab9Documents';

interface PropertyFormContentProps {
    activeTab: PropertyTabId;
    submitError: string | null;
    addressReadOnly?: boolean;
    mode?: 'create' | 'edit';
}

export function PropertyFormContent({ activeTab, submitError, addressReadOnly = false, mode = 'create' }: PropertyFormContentProps) {
    const navigate = useNavigate();
    const draft = usePropertyFormContext();
    const operationsPending = draft.isSubmitting || draft.isSavingDraft || draft.isDeletingDraft;
    const toast = !draft.isSubmitRecovery && draft.draftError
        ? { variant: 'error' as const, title: 'Errore bozza', message: draft.draftError }
        : draft.draftSuccess
            ? { variant: 'success' as const, title: 'Bozza', message: draft.draftSuccess }
            : null;

    return <>
        <StatusToast toast={toast} onClose={draft.clearDraftFeedback} />
        <div className="bg-gray-50/50"><div className="max-w-7xl mx-auto w-full">
            <PropertyFormTabs />
            <div className="p-6" id="property-form-content">
                <PropertyFormErrors submitError={submitError} />
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm min-h-[400px]">
                    {activeTab === 'info1' && <Tab1Info addressReadOnly={addressReadOnly} />}
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
                    <button type="button" onClick={() => { void draft.saveDraft().catch(() => undefined); }} disabled={draft.draftPhase !== 'ready' || operationsPending} className="inline-flex items-center justify-center rounded-md border border-green-600 bg-white px-4 py-2.5 text-sm font-medium text-green-700 shadow-sm transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60">
                        {draft.isSavingDraft ? 'Salvataggio bozza...' : 'Salva bozza'}
                    </button>
                    <button type="button" onClick={() => navigate(-1)} disabled={operationsPending} className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">Annulla</button>
                    <button type="submit" disabled={operationsPending} className="inline-flex min-w-[100px] items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {draft.isSubmitting ? 'Salvataggio...' : <><Save className="w-4 h-4 ml-[-4px]" />{mode === 'edit' ? 'Salva modifiche' : 'Salva'}</>}
                    </button>
                </div>
            </div>
        </div></div>
    </>;
}

function PropertyFormErrors({ submitError }: { submitError: string | null }) {
    const { formState: { errors } } = useFormContext<PropertyFormData>();
    const hasErrors = Object.keys(errors).length > 0;
    if (!hasErrors && !submitError) return null;
    return <div role="alert" className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm"><div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div><h3 className="text-sm font-medium text-red-800">Impossibile salvare. Ci sono degli errori da correggere:</h3>
            {submitError ? <p className="mt-2 text-sm text-red-700">{submitError}</p> : null}
            {hasErrors ? <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">{Object.entries(errors).map(([field, error]) => <li key={field}><span className="font-semibold">{field}</span>: {(error as { message?: string })?.message || 'Campo non valido'}</li>)}</ul> : null}
        </div>
    </div></div>;
}
