import { useState } from 'react';
import { FormProvider, useForm, type Resolver, type UseFormReturn } from 'react-hook-form';
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
import {
    DuplicateBuildingIdentifierError,
    DuplicateBuildingLocationError,
} from '../../db/databaseErrors';

export interface BuildingFormProps {
    onSubmit(data: BuildingFormData): void | Promise<void>;
    initialValues?: BuildingFormData;
    mode?: 'create' | 'edit';
    onCancel?: () => void;
    methods?: UseFormReturn<BuildingFormData>;
    onSaveDraft?: () => void;
    isSavingDraft?: boolean;
    actionsDisabled?: boolean;
}

export function BuildingForm({
    methods,
    ...props
}: BuildingFormProps) {
    if (methods) {
        return <BuildingFormContent {...props} methods={methods} />;
    }

    return <OwnedBuildingForm {...props} />;
}

type BuildingFormContentProps = Omit<BuildingFormProps, 'methods'> & {
    methods: UseFormReturn<BuildingFormData>;
};

function OwnedBuildingForm({
    initialValues,
    ...props
}: Omit<BuildingFormProps, 'methods'>) {
    const methods = useForm<BuildingFormData>({
        resolver: zodResolver(buildingFormSchema) as Resolver<BuildingFormData>,
        defaultValues: {
            ...(initialValues ?? defaultBuildingValues),
            features: [...(initialValues?.features ?? defaultBuildingValues.features)],
        },
        mode: 'onChange',
    });

    return (
        <BuildingFormContent
            {...props}
            initialValues={initialValues}
            methods={methods}
        />
    );
}

function BuildingFormContent({
    onSubmit,
    mode = 'create',
    onCancel,
    methods,
    onSaveDraft,
    isSavingDraft = false,
    actionsDisabled = false,
}: BuildingFormContentProps) {
    const [activeTab, setActiveTab] = useState<BuildingTabId>('general');
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    const focusGeneralField = (field: 'identifier' | 'address') => {
        if (activeTab === 'general') {
            methods.setFocus(field);
        } else {
            setActiveTab('general');
            setTimeout(() => methods.setFocus(field), 0);
        }
    };

    const handleSubmit = async (data: BuildingFormData) => {
        setSubmissionError(null);
        methods.clearErrors(['identifier', 'address', 'city', 'postalCode', 'country']);
        try {
            await onSubmit(data);
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Non è stato possibile salvare l'edificio.";
            setSubmissionError(message);

            if (error instanceof DuplicateBuildingIdentifierError) {
                methods.setError('identifier', { type: 'server', message });
                focusGeneralField('identifier');
            } else if (error instanceof DuplicateBuildingLocationError) {
                for (const field of ['address', 'city', 'postalCode', 'country'] as const) {
                    methods.setError(field, { type: 'server', message });
                }
                focusGeneralField('address');
            }
        }
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'units': return <BuildingUnitsTab mode={mode} />;
            case 'additional': return <BuildingAdditionalTab />;
            case 'financial': return <BuildingFinancialTab />;
            default: return <BuildingGeneralTab />;
        }
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)} className="flex flex-col gap-6">
                <BuildingFormTabs activeTab={activeTab} onTabChange={setActiveTab} />
                {submissionError && (
                    <div role="alert" className="mx-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        {submissionError}
                    </div>
                )}
                <div className="rounded-lg bg-white p-6 shadow-sm">{renderActiveTab()}</div>
                <div className="flex justify-end gap-3">
                    {onSaveDraft && (
                        <button
                            type="button"
                            onClick={onSaveDraft}
                            disabled={actionsDisabled || isSavingDraft}
                            className="rounded-md border border-green-600 px-5 py-2.5 font-medium text-green-700 disabled:opacity-60"
                        >
                            {isSavingDraft ? 'Salvataggio bozza...' : 'Salva bozza'}
                        </button>
                    )}
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={actionsDisabled || methods.formState.isSubmitting}
                            className="rounded-md border border-gray-300 px-5 py-2.5 font-medium text-gray-700 disabled:opacity-60"
                        >
                            Annulla
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={actionsDisabled || methods.formState.isSubmitting}
                        className="rounded-md bg-green-600 px-5 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {methods.formState.isSubmitting
                            ? 'Salvataggio...'
                            : mode === 'edit' ? 'Salva modifiche' : 'Salva'}
                    </button>
                </div>
            </form>
        </FormProvider>
    );
}
