import { useState } from 'react';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    buildingFormSchema,
    defaultBuildingValues,
    type BuildingFormData,
} from './schema';
import { BuildingFormTabs, type BuildingTabId } from './BuildingFormTabs';
import { BuildingGeneralTab } from './tabs/BuildingGeneralTab';
import { BuildingUnitsTab } from './tabs/BuildingUnitsTab';
import { BuildingAdditionalTab } from './tabs/BuildingAdditionalTab';
import { BuildingFinancialTab } from './tabs/BuildingFinancialTab';

export interface BuildingFormProps {
    onSubmit(data: BuildingFormData): void | Promise<void>;
}

export function BuildingForm({ onSubmit }: BuildingFormProps) {
    const [activeTab, setActiveTab] = useState<BuildingTabId>('general');
    const methods = useForm<BuildingFormData>({
        resolver: zodResolver(buildingFormSchema) as Resolver<BuildingFormData>,
        defaultValues: {
            ...defaultBuildingValues,
            features: [...defaultBuildingValues.features],
        },
        mode: 'onChange',
    });

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'units': return <BuildingUnitsTab />;
            case 'additional': return <BuildingAdditionalTab />;
            case 'financial': return <BuildingFinancialTab />;
            default: return <BuildingGeneralTab />;
        }
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit((data) => onSubmit(data))} className="flex flex-col gap-6">
                <BuildingFormTabs activeTab={activeTab} onTabChange={setActiveTab} />
                <div className="rounded-lg bg-white p-6 shadow-sm">{renderActiveTab()}</div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={methods.formState.isSubmitting}
                        className="rounded-md bg-green-600 px-5 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {methods.formState.isSubmitting ? 'Salvataggio...' : 'Salva'}
                    </button>
                </div>
            </form>
        </FormProvider>
    );
}
