import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';

const STORAGE_KEY = 'property_form_draft';

export function useFormPersistence(methods: UseFormReturn<any>) {
    // Carica la bozza al mount del componente
    useEffect(() => {
        const loadDraft = () => {
            try {
                const savedDraft = localStorage.getItem(STORAGE_KEY);
                if (savedDraft) {
                    const parsedData = JSON.parse(savedDraft);
                    // Resetta il form con i dati salvati, ma mantieni lo status pristine/dirty per capire se utente ha cambiato da ora
                    methods.reset(parsedData);
                    console.log('Bozza form ripristinata dal LocalStorage.');
                }
            } catch (error) {
                console.error('Errore durante il caricamento della bozza dal LocalStorage:', error);
            }
        };

        // Eseguiamo un leggero ritardo per assicurarci che React Hook Form sia pienamente inizializzato con i defaultValues
        const timeout = setTimeout(loadDraft, 50);
        return () => clearTimeout(timeout);
    }, [methods]); // Esegue solo 1 volta quando methods viene passato (inizializzazione)

    // Salva le modifiche ogni volta che i valori cambiano
    useEffect(() => {
        const subscription = methods.watch((value) => {
            try {
                // Non salviamo se non ci sono dati effettivi o se tutti i campi importanti sono vuoti
                if (Object.keys(value).length > 0) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
                }
            } catch (error) {
                console.error('Errore durante il salvataggio automatico nel LocalStorage:', error);
            }
        });

        return () => subscription.unsubscribe();
    }, [methods]);

    // Funzione per ripulire la bozza dopo un submit completato con successo
    const clearDraft = () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Errore pulizia bozza:', error);
        }
    };

    return { clearDraft };
}
