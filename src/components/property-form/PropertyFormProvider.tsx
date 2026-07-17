import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertySchema, defaultPropertyValues } from './schema';
import type { PropertyFormData } from './schema';
import type { PropertyTabId } from './PropertyFormTabs';
import { useFormPersistence } from './hooks/useFormPersistence';
import { DuplicatePropertyIdentifierError, DuplicatePropertyLocationError } from '../../db/databaseErrors';

interface PropertyFormContextProps {
    // Aggiungeremo logica specifica come gestione tab, step, ecc.
    activeTab: string;
    setActiveTab: (tabId: PropertyTabId | string) => void;
}

const PropertyFormContext = createContext<PropertyFormContextProps | undefined>(undefined);

export function usePropertyFormContext() {
    const context = useContext(PropertyFormContext);
    if (!context) {
        throw new Error('usePropertyFormContext must be used within a PropertyFormProvider');
    }
    return context;
}

interface PropertyFormProviderProps {
    children: ReactNode;
    activeTab: string;
    setActiveTab: (tabId: PropertyTabId | string) => void;
    onSubmit: (data: PropertyFormData) => Promise<void>;
    onSubmitError?: (message: string) => void;
}

export function PropertyFormProvider({ children, activeTab, setActiveTab, onSubmit, onSubmitError }: PropertyFormProviderProps) {
    const methods = useForm<PropertyFormData>({
        resolver: zodResolver(propertySchema) as any,
        defaultValues: defaultPropertyValues as any, // Keep default values for initial load
        mode: 'onChange', // Permetti la validazione in tempo reale su onChange per i draft
    });

    const { clearDraft } = useFormPersistence(methods);

    const handleFormSubmit = async (data: PropertyFormData) => {
        try {
            await onSubmit(data);
            clearDraft();
        } catch (error) {
            if (error instanceof DuplicatePropertyIdentifierError) {
                const message = "Esiste gia un'unita con questo identificativo.";
                methods.setError('PropertyTitle', { type: 'manual', message });
                methods.setFocus('PropertyTitle');
                onSubmitError?.(message);
                return;
            }
            if (error instanceof DuplicatePropertyLocationError) {
                const message = "Immobile gia registrato. Esiste gia un'unita con lo stesso indirizzo, citta e CAP.";
                methods.setError('PropertyAddress', { type: 'manual', message });
                methods.setError('PropertyCity', { type: 'manual', message });
                methods.setError('PropertyPostalCode', { type: 'manual', message });
                methods.setFocus('PropertyAddress');
                onSubmitError?.(message);
                return;
            }
            onSubmitError?.(error instanceof Error ? error.message : 'Errore durante il salvataggio della nuova unita.');
        }
    };

    return (
        <PropertyFormContext.Provider value={{ activeTab, setActiveTab }}>
            <FormProvider {...methods}>
                {/* 
                    L'elemento form wrappa direttamente tutto l'interno del provider
                    In questo modo i bottoni con type="submit" in altre sezioni possono "trovarlo"
                    Il form preventDefault e poi passa i dati se validi.
                */}
                <form
                    id="property-form"
                    onSubmit={methods.handleSubmit(handleFormSubmit as any)}
                    className="flex flex-col flex-1 h-full"
                >
                    {children}
                </form>
            </FormProvider>
        </PropertyFormContext.Provider>
    );
}
