import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { clearDraft as clearDatabaseDraft, getDraft, setDraft } from '../../../db/jsonDb';
import { normalizePropertyDraft, type PropertyFormData } from '../schema';

export function useFormPersistence(methods: UseFormReturn<PropertyFormData>) {
    useEffect(() => {
        const savedDraft = getDraft('propertyForm');
        if (!savedDraft || typeof savedDraft !== 'object') return;

        try {
            methods.reset(normalizePropertyDraft(savedDraft));
        } catch (error) {
            console.error('Bozza proprietà corrotta ignorata:', error);
        }
    }, [methods]);

    useEffect(() => {
        const subscription = methods.watch((value) => {
            try {
                setDraft('propertyForm', normalizePropertyDraft(value));
            } catch (error) {
                console.error('Errore durante il salvataggio automatico della bozza:', error);
            }
        });

        return () => subscription.unsubscribe();
    }, [methods]);

    const clearDraft = () => {
        clearDatabaseDraft('propertyForm');
    };

    return { clearDraft };
}
