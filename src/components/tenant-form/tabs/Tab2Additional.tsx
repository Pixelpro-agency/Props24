// Tab 2: Informazioni Aggiuntive
// Sezioni condizionali: Info società (solo company), Indirizzo lavoro (solo person)
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
    const tenantType = watch('TenantType');
    const isPerson = tenantType === 'person';
    const isCompany = tenantType === 'company';

    return (
        <div className="p-6 space-y-2">
            {/* === Sezione: Informazioni società (SOLO Società) === */}
            <AnimatePresence mode="wait">
                {isCompany && (
                    <motion.div
                        key="company-info"
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <FormSection title="Informazioni società">
                            <TextInput
                                name="TenantCompanyName"
                                label="Società"
                                orientation="horizontal"
                                required
                                helpText="Se compili questa casella, il nome della società apparirà nelle fatture generate da Rentila."
                            />
                            <TextInput
                                name="TenantVatNumber"
                                label="P.IVA"
                                orientation="horizontal"
                                helpText="Se compili questa casella, queste informazioni compariranno in automatico in alcuni documenti incluse le fatture."
                            />
                            <TextInput
                                name="TenantSiret"
                                label="Registro Imprese"
                                orientation="horizontal"
                            />
                            <TextInput
                                name="TenantCapital"
                                label="Capitale"
                                orientation="horizontal"
                            />
                            <TextInput
                                name="TenantCompanyDescription"
                                label="Settore di attività"
                                orientation="horizontal"
                            />
                        </FormSection>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* === Sezione: Indirizzo di lavoro (SOLO Privato) === */}
            <AnimatePresence mode="wait">
                {isPerson && (
                    <motion.div
                        key="work-address"
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <FormSection title="Indirizzo di lavoro">
                            <TextInput
                                name="TenantProEmployer"
                                label="Datore di lavoro"
                                orientation="horizontal"
                            />
                            <TextInput
                                name="TenantProAddress"
                                label="Indirizzo"
                                orientation="horizontal"
                                placeholder="Inserisci una posizione"
                            />
                            <TextInput
                                name="TenantProCity"
                                label="Città"
                                orientation="horizontal"
                            />
                            <TextInput
                                name="TenantProZip"
                                label="CAP"
                                orientation="horizontal"
                            />
                            <TextInput
                                name="TenantProState"
                                label="Regione"
                                orientation="horizontal"
                            />
                            <Select
                                name="TenantProCountry"
                                label="Paese"
                                orientation="horizontal"
                                options={COUNTRIES}
                            />
                            <PhoneInput
                                name="TenantProPhoneNat"
                                label="Telefono"
                                orientation="horizontal"
                            />
                        </FormSection>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* === Sezione: Coordinate bancarie (sempre visibile) === */}
            <FormSection title="Coordinate bancarie">
                <TextInput
                    name="TenantBankName"
                    label="Banca"
                    orientation="horizontal"
                />
                <TextInput
                    name="TenantBankAddress"
                    label="Indirizzo"
                    orientation="horizontal"
                />
                <TextInput
                    name="TenantBankCity"
                    label="Città"
                    orientation="horizontal"
                />
                <TextInput
                    name="TenantBankZip"
                    label="CAP"
                    orientation="horizontal"
                />
                <Select
                    name="TenantBankCountry"
                    label="Paese"
                    orientation="horizontal"
                    options={COUNTRIES}
                />
                <TextInput
                    name="TenantBankIBAN"
                    label="IBAN"
                    orientation="horizontal"
                    style={{ textTransform: 'uppercase' }}
                />
                <TextInput
                    name="TenantBankSwiftBic"
                    label="Swift/BIC"
                    orientation="horizontal"
                    style={{ textTransform: 'uppercase' }}
                />
            </FormSection>

            {/* === Sezione: Informazioni aggiuntive (sempre visibile) === */}
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
