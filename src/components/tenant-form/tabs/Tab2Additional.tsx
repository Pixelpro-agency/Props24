import { useFormContext } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { FormSection } from '../../property-form/ui/FormSection';
import { TextInput } from '../../property-form/ui/TextInput';
import { Select } from '../../property-form/ui/Select';
import { TextArea } from '../../property-form/ui/TextArea';
import { PhoneInput } from '../ui/PhoneInput';
import { COUNTRIES } from '../../../types/tenant';

const sectionVariants: any = {
    hidden: { opacity: 0, height: 0, overflow: 'hidden' },
    visible: { opacity: 1, height: 'auto', overflow: 'visible', transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, height: 0, overflow: 'hidden', transition: { duration: 0.2, ease: 'easeIn' } },
};

export function Tab2Additional() {
    const { watch } = useFormContext();
    const isPerson = watch('TenantType') === 'person';

    return (
        <div className="p-6 space-y-2">
            <AnimatePresence mode="wait">
                {isPerson && (
                    <motion.div key="work-address" variants={sectionVariants} initial="hidden" animate="visible" exit="exit">
                        <FormSection title="Indirizzo di lavoro">
                            <TextInput name="TenantProEmployer" label="Datore di lavoro" orientation="horizontal" />
                            <TextInput name="TenantProAddress" label="Indirizzo" orientation="horizontal" placeholder="Inserisci una posizione" />
                            <TextInput name="TenantProCity" label="Città" orientation="horizontal" />
                            <TextInput name="TenantProZip" label="CAP" orientation="horizontal" />
                            <TextInput name="TenantProState" label="Regione" orientation="horizontal" />
                            <Select name="TenantProCountry" label="Paese" orientation="horizontal" options={COUNTRIES} />
                            <PhoneInput name="TenantProPhoneNat" label="Telefono" orientation="horizontal" />
                        </FormSection>
                    </motion.div>
                )}
            </AnimatePresence>

            <FormSection title="Coordinate bancarie">
                <TextInput name="TenantBankName" label="Banca" orientation="horizontal" />
                <TextInput name="TenantBankAddress" label="Indirizzo" orientation="horizontal" />
                <TextInput name="TenantBankCity" label="Città" orientation="horizontal" />
                <TextInput name="TenantBankZip" label="CAP" orientation="horizontal" />
                <Select name="TenantBankCountry" label="Paese" orientation="horizontal" options={COUNTRIES} />
                <TextInput name="TenantBankIBAN" label="IBAN" orientation="horizontal" style={{ textTransform: 'uppercase' }} />
                <TextInput name="TenantBankSwiftBic" label="Swift/BIC" orientation="horizontal" style={{ textTransform: 'uppercase' }} />
            </FormSection>

            <FormSection title="Informazioni aggiuntive">
                <TextArea
                    name="TenantLeaveAddress"
                    label="Nuovo indirizzo"
                    orientation="horizontal"
                    helpText="Nuovo indirizzo del locatario per la corrispondenza futura successiva alla sua partenza."
                />
                <TextArea
                    name="TenantNotes"
                    label="Nota privata"
                    orientation="horizontal"
                    rows={5}
                    helpText="Solo tu puoi leggere questa nota."
                />
            </FormSection>
        </div>
    );
}
