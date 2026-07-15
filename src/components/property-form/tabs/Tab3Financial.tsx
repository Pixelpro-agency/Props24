import { FormSection } from '../ui/FormSection';
import { TextInput } from '../ui/TextInput';
import { NumberInput } from '../ui/NumberInput';

export function Tab3Financial() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <FormSection title="Informazioni finanziarie" defaultOpen={true}>
                <div className="flex flex-col gap-6">
                    <TextInput
                        name="PropertyAcquisitionDate"
                        label="Data di acquisto"
                        type="date"
                        orientation="horizontal"
                    />

                    <NumberInput
                        name="PropertyInitialPrice"
                        label="Prezzo d'acquisto"
                        symbol="€"
                        orientation="horizontal"
                        helpText="Importo utilizzato per calcolare la redditività nella sezione Bilancio"
                    />

                    <NumberInput
                        name="PropertyAcquisitionCosts"
                        label="Spese di acquisto"
                        symbol="€"
                        orientation="horizontal"
                        helpText="Importo d'acquisto (onorario del notaio, imposta di registro, ecc.)."
                    />

                    <NumberInput
                        name="PropertyAgencyCosts"
                        label="Compensi dell'agente"
                        symbol="€"
                        orientation="horizontal"
                        helpText="Compensi dell'agente immobiliare."
                    />

                    <NumberInput
                        name="PropertyCurrentValue"
                        label="Valore attuale"
                        symbol="€"
                        orientation="horizontal"
                        helpText="Stima del valore di mercato del tuo immobile."
                    />

                    <NumberInput
                        name="PropertySalePrice"
                        label="Prezzo di vendita"
                        symbol="€"
                        orientation="horizontal"
                        helpText="Importo indicativo per il prezzo di vendita dell'immobile."
                    />
                </div>
            </FormSection>

            <FormSection title="Informazioni fiscali" defaultOpen={true}>
                <div className="flex flex-col gap-6">
                    <TextInput
                        name="PropertyFiscalCode"
                        label="Codice fiscale"
                        orientation="horizontal"
                        helpText="Codice fiscale assegnato all'immobile dalle autorità fiscali."
                    />
                </div>
            </FormSection>

        </div>
    );
}
