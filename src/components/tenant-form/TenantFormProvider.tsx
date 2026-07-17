import { createContext, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tenantSchema, defaultTenantValues } from './schema';
import type { TenantFormData } from './schema';
import type { TenantTabId } from './TenantFormTabs';
import { useTenantFormPersistence } from './hooks/useTenantFormPersistence';

interface TenantFormContextProps {
    activeTab: string;
    setActiveTab: (tabId: TenantTabId | string) => void;
}

const TenantFormContext = createContext<TenantFormContextProps | undefined>(undefined);

export function useTenantFormContext() {
    const context = useContext(TenantFormContext);
    if (!context) {
        throw new Error('useTenantFormContext must be used within a TenantFormProvider');
    }
    return context;
}

interface TenantFormProviderProps {
    children: ReactNode;
    activeTab: string;
    setActiveTab: (tabId: TenantTabId | string) => void;
    onSubmit: (data: TenantFormData) => Promise<void>;
    onSubmitError?: (message: string) => void;
    onDraftErrorClearReady?: (clearDraftError: () => void) => void;
}

export function TenantFormProvider({ children, activeTab, setActiveTab, onSubmit, onSubmitError, onDraftErrorClearReady }: TenantFormProviderProps) {
    const methods = useForm<TenantFormData>({
        resolver: zodResolver(tenantSchema) as any,
        defaultValues: defaultTenantValues as any,
        mode: 'onChange',
        shouldFocusError: true,
    });

    const { clearDraft, draftError, clearDraftError } = useTenantFormPersistence(methods);
    const onSubmitErrorRef = useRef(onSubmitError);

    useEffect(() => {
        onSubmitErrorRef.current = onSubmitError;
    }, [onSubmitError]);

    useEffect(() => {
        onDraftErrorClearReady?.(clearDraftError);
    }, [clearDraftError, onDraftErrorClearReady]);

    useEffect(() => {
        if (draftError) onSubmitErrorRef.current?.(draftError);
    }, [draftError]);

    const validationMessages = (errors: Record<string, unknown>) => {
        const messages = new Set<string>();
        const seen = new WeakSet<object>();
        const walk = (value: unknown) => {
            if (!value || typeof value !== 'object') return;
            if (value instanceof Element) return;
            if (seen.has(value)) return;
            seen.add(value);
            const record = value as { message?: unknown };
            if (typeof record.message === 'string') messages.add(record.message);
            Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
                if (key !== 'ref') walk(child);
            });
        };
        walk(errors);
        return Array.from(messages).join('\n') || 'Controlla i campi obbligatori prima di salvare.';
    };

    const handleFormSubmit = async (data: TenantFormData) => {
        try {
            await onSubmit(data);
            clearDraft();
        } catch (error) {
            onSubmitError?.(error instanceof Error ? error.message : 'Errore durante il salvataggio del nuovo inquilino.');
        }
    };

    return (
        <TenantFormContext.Provider value={{ activeTab, setActiveTab }}>
            <FormProvider {...methods}>
                <form
                    id="tenant-form"
                    onSubmit={methods.handleSubmit(handleFormSubmit as any, (errors) => {
                        onSubmitError?.(validationMessages(errors as Record<string, unknown>));
                    })}
                    className="flex flex-col flex-1 h-full"
                >
                    {children}
                </form>
            </FormProvider>
        </TenantFormContext.Provider>
    );
}
