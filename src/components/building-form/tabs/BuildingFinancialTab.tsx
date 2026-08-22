import { TextInput } from '../../property-form/ui/TextInput';
import { NumberInput } from '../../property-form/ui/NumberInput';
import { FormSection } from '../../property-form/ui/FormSection';

export function BuildingFinancialTab() {
    return (
        <FormSection title="Informazioni finanziarie">
            <TextInput name="acquisitionDate" label="Data di acquisto" type="date" />
            <NumberInput name="purchasePrice" label="Prezzo d'acquisto" min={0} step="any" />
            <NumberInput name="acquisitionCosts" label="Spese di acquisto" min={0} step="any" />
            <NumberInput name="imu" label="IMU" min={0} step="any" />
        </FormSection>
    );
}
