import { TextInput } from '../../property-form/ui/TextInput';
import { NumberInput } from '../../property-form/ui/NumberInput';
import { TextArea } from '../../property-form/ui/TextArea';
import { FormSection } from '../../property-form/ui/FormSection';

export function BuildingGeneralTab() {
    return (
        <FormSection title="Informazioni generali">
            <TextInput name="identifier" label="Identificativo" required />
            <TextInput name="color" label="Colore" placeholder="#22c55e" />
            <TextInput name="address" label="Indirizzo" required />
            <TextInput name="address2" label="Indirizzo 2" />
            <TextInput name="city" label="Città" required />
            <TextInput name="postalCode" label="CAP" required />
            <TextInput name="county" label="Provincia" />
            <TextInput name="state" label="Regione" />
            <TextInput name="country" label="Paese" required />
            <NumberInput name="size" label="Superficie m²" min={0} />
            <NumberInput name="constructionYear" label="Anno di costruzione" min={0} step={1} />
            <TextArea name="description" label="Descrizione" rows={3} />
            <TextArea name="privateNote" label="Nota privata" rows={3} />
        </FormSection>
    );
}
