import { useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { normalizeTenantDraft, type TenantFormData } from '../schema';
import { clearDraft as clearDatabaseDraft, getDraft, setDraft } from '../../../db/jsonDb';
import { isQuotaExceededError } from '../../../db/databaseErrors';

const AUTOSAVE_DEBOUNCE_MS = 500;

export function useTenantFormPersistence(methods: UseFormReturn<TenantFormData>) {
    const [draftError, setDraftError] = useState<string | null>(null);
    const lastPersistedDraftRef = useRef<string>('');

    useEffect(() => {
        try {
            const savedDraft = getDraft('tenantForm');
            if (savedDraft) {
                const normalizedDraft = normalizeTenantDraft(savedDraft);
                lastPersistedDraftRef.current = JSON.stringify(normalizedDraft);
                methods.reset(normalizedDraft);
            } else {
                lastPersistedDraftRef.current = JSON.stringify(normalizeTenantDraft(methods.getValues()));
            }
            queueMicrotask(() => setDraftError(null));
        } catch (error) {
            queueMicrotask(() => setDraftError('Impossibile ripristinare la bozza inquilino.'));
            console.error('Errore caricamento bozza inquilino:', error);
        }
    }, [methods]);

    useEffect(() => {
        let timeoutId: number | undefined;
        // TODO: spostare gli allegati delle bozze su IndexedDB, backend o cloud
        // storage prima di aumentare i limiti locali, ad esempio fino a 15 MB.
        // I Data URL salvati nell'intero database localStorage aumentano
        // sensibilmente lo spazio occupato rispetto ai file originali.
        const subscription = methods.watch((value) => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                const normalizedDraft = normalizeTenantDraft(value);
                const serializedDraft = JSON.stringify(normalizedDraft);
                if (serializedDraft === lastPersistedDraftRef.current) {
                    setDraftError(null);
                    return;
                }

                try {
                    setDraft('tenantForm', normalizedDraft);
                    lastPersistedDraftRef.current = serializedDraft;
                    setDraftError(null);
                } catch (error) {
                    if (isQuotaExceededError(error)) {
                        setDraftError('Spazio locale del browser esaurito. Rimuovi allegati non necessari o libera spazio, quindi riprova.');
                        console.error('Quota locale esaurita durante il salvataggio automatico inquilino:', error);
                    } else {
                        setDraftError('Impossibile salvare automaticamente la bozza nel browser. Riprova.');
                        console.error('Errore salvataggio automatico inquilino:', error);
                    }
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
            lastPersistedDraftRef.current = JSON.stringify(normalizeTenantDraft(methods.getValues()));
            setDraftError(null);
        } catch (error) {
            console.error('Errore pulizia bozza inquilino:', error);
        }
    };

    const clearDraftError = () => setDraftError(null);

    return { clearDraft, draftError, clearDraftError };
}
