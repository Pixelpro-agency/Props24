import { useEffect, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { normalizeTenantDraft, type TenantFormData } from '../schema';
import { clearDraft as clearDatabaseDraft, getDraft, setDraft } from '../../../db/jsonDb';

const AUTOSAVE_DEBOUNCE_MS = 500;

export function useTenantFormPersistence(methods: UseFormReturn<TenantFormData>) {
    const [draftError, setDraftError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const savedDraft = getDraft('tenantForm');
            if (savedDraft) methods.reset(normalizeTenantDraft(savedDraft));
            setDraftError(null);
        } catch (error) {
            setDraftError('Impossibile ripristinare la bozza inquilino.');
            console.error('Errore caricamento bozza inquilino:', error);
        }
    }, [methods]);

    useEffect(() => {
        let timeoutId: number | undefined;
        const subscription = methods.watch((value) => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                try {
                    setDraft('tenantForm', normalizeTenantDraft(value));
                    setDraftError(null);
                } catch (error) {
                    setDraftError('Impossibile salvare i dati nel browser. Riduci la dimensione degli allegati e riprova.');
                    console.error('Errore salvataggio automatico inquilino:', error);
                }
            }, AUTOSAVE_DEBOUNCE_MS);
        });

        return () => {
            window.clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [methods]);

    const clearDraft = () => {
        try {
            clearDatabaseDraft('tenantForm');
        } catch (error) {
            console.error('Errore pulizia bozza inquilino:', error);
        }
    };

    const clearDraftError = () => setDraftError(null);

    return { clearDraft, draftError, clearDraftError };
}
