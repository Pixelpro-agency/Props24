import { createContext, useContext } from 'react';
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
    onSubmit: (data: TenantFormData) => void;
}

export function TenantFormProvider({ children, activeTab, setActiveTab, onSubmit }: TenantFormProviderProps) {
    const methods = useForm<TenantFormData>({
        resolver: zodResolver(tenantSchema) as any,
        defaultValues: defaultTenantValues as any,
        mode: 'onChange',
    });

    const { clearDraft } = useTenantFormPersistence(methods);

    const handleFormSubmit = async (data: TenantFormData) => {
        await onSubmit(data);
        clearDraft();
    };

    return (
        <TenantFormContext.Provider value={{ activeTab, setActiveTab }}>
            <FormProvider {...methods}>
                <form
                    id="tenant-form"
                    onSubmit={methods.handleSubmit(handleFormSubmit as any)}
                    className="flex flex-col flex-1 h-full"
                >
                    {children}
                </form>
            </FormProvider>
        </TenantFormContext.Provider>
    );
}
