import { useFormContext } from 'react-hook-form';
import { FormSection } from '../../property-form/ui/FormSection';
import { BUILDING_FEATURE_VALUES, type BuildingFormData } from '../schema';

export function BuildingAdditionalTab() {
    const { register } = useFormContext<BuildingFormData>();

    return (
        <FormSection title="Informazioni aggiuntive">
            <fieldset>
                <legend className="mb-4 text-sm font-medium text-gray-700">Caratteristiche</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {BUILDING_FEATURE_VALUES.map((feature) => (
                        <label key={feature} htmlFor={feature} className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
                            <input
                                id={feature}
                                type="checkbox"
                                value={feature}
                                {...register('features')}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                            />
                            <span>{feature}</span>
                        </label>
                    ))}
                </div>
            </fieldset>
        </FormSection>
    );
}
