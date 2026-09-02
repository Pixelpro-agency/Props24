import { Save } from 'lucide-react';
import { StatusToast } from '../ui/StatusToast';
import { useTenantFormContext } from './TenantFormProvider';
import { TenantFormTabs, type TenantTabId } from './TenantFormTabs';
import { Tab1General } from './tabs/Tab1General';
import { Tab2Additional } from './tabs/Tab2Additional';
import { Tab3Guarantors } from './tabs/Tab3Guarantors';
import { Tab4Emergency } from './tabs/Tab4Emergency';
import { Tab5Documents } from './tabs/Tab5Documents';

interface TenantFormContentProps {
    mode: 'create' | 'edit';
    activeTab: TenantTabId;
    submitError: string | null;
    clearSubmitError(): void;
    onCancel(): void;
}

export function TenantFormContent({ mode, activeTab, submitError, clearSubmitError, onCancel }: TenantFormContentProps) {
    const form = useTenantFormContext();
    const operationsPending = form.isSubmitting || form.isSavingDraft || form.isDeletingDraft;
    const toast = submitError
        ? { variant: 'error' as const, title: 'Errore', message: submitError }
        : form.draftError
            ? { variant: 'error' as const, title: 'Errore bozza', message: form.draftError }
            : form.draftSuccess
                ? { variant: 'success' as const, title: 'Bozza', message: form.draftSuccess }
                : null;
    return <>
        <StatusToast toast={toast} onClose={() => { clearSubmitError(); form.clearDraftFeedback(); }} />
        <div className="bg-gray-50/50"><div className="max-w-7xl mx-auto w-full">
            <TenantFormTabs />
            <div className="p-6">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-[400px]">
                    {activeTab === 'info1' && <Tab1General />}
                    {activeTab === 'info2' && <Tab2Additional />}
                    {activeTab === 'info3' && <Tab3Guarantors />}
                    {activeTab === 'info5' && <Tab4Emergency />}
                    {activeTab === 'info4' && <Tab5Documents />}
                </div>
                <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => void form.saveDraft().catch(() => undefined)} disabled={form.draftPhase !== 'ready' || operationsPending} className="inline-flex items-center justify-center rounded-md border border-green-600 bg-white px-4 py-2.5 text-sm font-medium text-green-700 shadow-sm transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60">
                        {form.isSavingDraft ? 'Salvataggio bozza...' : 'Salva bozza'}
                    </button>
                    <button type="button" onClick={onCancel} disabled={operationsPending} className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">Annulla</button>
                    <button type="submit" disabled={operationsPending} className="inline-flex min-w-[100px] items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {form.isSubmitting ? 'Salvataggio...' : <><Save className="w-4 h-4 ml-[-4px]" />{mode === 'edit' ? 'Salva modifiche' : 'Salva'}</>}
                    </button>
                </div>
            </div>
        </div></div>
    </>;
}
