import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';

const STORAGE_KEY = 'tenant_form_draft';
const AUTOSAVE_INTERVAL_MS = 30000; // Salvataggio automatico ogni 30 secondi

export function useTenantFormPersistence(methods: UseFormReturn<any>) {
    // Carica la bozza al mount del componente
    useEffect(() => {
        const loadDraft = () => {
            try {
                const savedDraft = localStorage.getItem(STORAGE_KEY);
                if (savedDraft) {
                    const parsedData = JSON.parse(savedDraft);
                    methods.reset(parsedData);
                    console.log('Bozza inquilino ripristinata dal LocalStorage.');
                }
            } catch (error) {
                console.error('Errore caricamento bozza inquilino:', error);
            }
        };

        const timeout = setTimeout(loadDraft, 50);
        return () => clearTimeout(timeout);
    }, [methods]);

    // Autosalvataggio ogni 30 secondi (solo se il form è stato modificato)
    useEffect(() => {
        const interval = setInterval(() => {
            const values = methods.getValues();
            if (methods.formState.isDirty && Object.keys(values).length > 0) {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
                    console.log('Bozza inquilino salvata automaticamente.');
                } catch (error) {
                    console.error('Errore salvataggio bozza inquilino:', error);
                }
            }
        }, AUTOSAVE_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [methods]);

    // Salva anche al cambio valori (debounced tramite watch)
    useEffect(() => {
        const subscription = methods.watch((value) => {
            try {
                if (Object.keys(value).length > 0) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
                }
            } catch (error) {
                console.error('Errore salvataggio automatico inquilino:', error);
            }
        });

        return () => subscription.unsubscribe();
    }, [methods]);

    const clearDraft = () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Errore pulizia bozza inquilino:', error);
        }
    };

    return { clearDraft };
}
