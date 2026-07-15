// Tab 1: Informazioni Generali — form principale inquilino
// Include logica condizionale Privato/Società per show/hide sezioni
import { useFormContext } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { FormSection } from '../../property-form/ui/FormSection';
import { TextInput } from '../../property-form/ui/TextInput';
import { Select } from '../../property-form/ui/Select';
import { NumberInput } from '../../property-form/ui/NumberInput';
import { ToggleSwitch } from '../../property-form/ui/ToggleSwitch';
import { ColorPicker } from '../../property-form/ui/ColorPicker';
import { PhoneInput } from '../ui/PhoneInput';
import { PhotoUpload } from '../ui/PhotoUpload';
import { SimpleFileUpload } from '../ui/SimpleFileUpload';
import { COUNTRIES } from '../../../types/tenant';

// Animazione per sezioni condizionali
const sectionVariants: any = {
    hidden: { opacity: 0, height: 0, overflow: 'hidden' },
    visible: { opacity: 1, height: 'auto', overflow: 'visible', transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, height: 0, overflow: 'hidden', transition: { duration: 0.2, ease: 'easeIn' } },
};

export function Tab1General() {
    const { watch } = useFormContext();
    const tenantType = watch('TenantType');
    const isPerson = tenantType === 'person';

    return (
        <div className="p-6 space-y-2">
            {/* === Sezione: Tipo === */}
            <FormSection title="Tipo">
                <Select
                    name="TenantType"
                    label="Tipo di locatario"
                    orientation="horizontal"
                    options={[
                        { value: 'person', label: 'Privato singolo' },
                        { value: 'company', label: 'Società / Altro' },
                    ]}
                />
            </FormSection>

            {/* === Sezione: Foto e colore === */}
            <FormSection title="Foto e colore">
                <PhotoUpload
                    name="TenantPhoto"
                    label="Foto"
                />
                <ColorPicker
                    name="TenantAvatarHexColor"
                    label="Colore"
                    className="grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4"
                />
            </FormSection>

            {/* === Sezione: Informazioni personali (SOLO Privato) === */}
            <AnimatePresence mode="wait">
                {isPerson && (
                    <motion.div
                        key="personal-info"
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <FormSection title="Informazioni personali">
                            <Select
                                name="TenantTitle"
                                label="Titolo"
                                orientation="horizontal"
                                options={[
                                    { value: '', label: 'Scegli' },
                                    { value: 'Miss', label: 'Sig.na' },
                                    { value: 'Mrs', label: 'Sig.ra' },
                                    { value: 'Mr', label: 'Sig.' },
                                ]}
                            />
                            <TextInput
                                name="TenantFirstName"
                                label="Nome"
                                orientation="horizontal"
                                required
                                autoCapitalize="words"
                            />
                            <TextInput
                                name="TenantMiddleName"
                                label="2° nome"
                                orientation="horizontal"
                                autoCapitalize="words"
                            />
                            <TextInput
                                name="TenantLastName"
                                label="Cognome"
                                orientation="horizontal"
                                required
                                autoCapitalize="words"
                            />
                            <TextInput
                                name="TenantBirthDate"
                                label="Data di nascita"
                                orientation="horizontal"
                                type="date"
                            />
                            <TextInput
                                name="TenantBirthPlace"
                                label="Luogo di nascita"
                                orientation="horizontal"
                            />
                            <TextInput
                                name="TenantNationality"
                                label="Nazionalità"
                                orientation="horizontal"
                            />
                            <TextInput
                                name="TenantFiscalCode"
                                label="Codice fiscale"
                                orientation="horizontal"
                            />
                            <TextInput
                                name="TenantVatNumberPersonal"
                                label="P.IVA"
                                orientation="horizontal"
                                helpText="Se compili questa casella, queste informazioni compariranno in automatico in alcuni documenti incluse le fatture."
                            />
                        </FormSection>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* === Sezione: Situazione professionale (SOLO Privato) === */}
            <AnimatePresence mode="wait">
                {isPerson && (
                    <motion.div
                        key="professional"
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <FormSection title="Situazione professionale">
                            <TextInput
                                name="TenantProfession"
                                label="Professione"
                                orientation="horizontal"
                            />
                            <NumberInput
                                name="TenantRevenus"
                                label="Entrate mensili"
                                orientation="horizontal"
                                symbol="€"
                                min={0}
                                step={0.01}
                            />
                        </FormSection>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* === Sezione: Documento di identità (SOLO Privato) === */}
            <AnimatePresence mode="wait">
                {isPerson && (
                    <motion.div
                        key="identity"
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <FormSection title="Documento di identità">
                            <Select
                                name="TenantIDType"
                                label="Tipo"
                                orientation="horizontal"
                                options={[
                                    { value: '', label: 'Scegli' },
                                    { value: 'ID', label: 'Carta di identità' },
                                    { value: 'passport', label: 'Passaporto' },
                                    { value: 'drivinglicense', label: 'Patente di guida' },
                                    { value: 'residencepermit', label: 'Permesso di soggiorno' },
                                ]}
                            />
                            <TextInput
                                name="TenantIDNumber"
                                label="Numero"
                                orientation="horizontal"
                            />
                            <TextInput
                                name="TenantIDExpiry"
                                label="Scadenza"
                                orientation="horizontal"
                                type="date"
                            />
                            <SimpleFileUpload
                                name="TenantIDCard"
                                label="File"
                                accept=".gif,.png,.jpg,.jpeg,.pdf,.doc,.docx"
                                helpText="Copia dell'ID. Formati accettati: Word, PDF, Immagini (GIF, JPG, PNG)."
                            />
                        </FormSection>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* === Sezione: Contatti === */}
            <FormSection title="Contatti">
                <TextInput
                    name="TenantEmail"
                    label="Email"
                    orientation="horizontal"
                    type="email"
                />
                <ToggleSwitch
                    name="send_invite"
                    label="Invito"
                    helpText={
                        <span>
                            Invitare l'inquilino per dargli accesso al suo spazio personale.
                            <br />
                            Per invitare il tuo inquilino e dargli accesso al suo spazio, inserisci il suo indirizzo e-mail
                            (un indirizzo unico per inquilino). Potrà visualizzare le informazioni relative alla locazione,
                            le ricevute di affitto e inviarti messaggi tramite la sua interfaccia.
                        </span>
                    }
                />
                <TextInput
                    name="TenantEmailSecond"
                    label="E-mail secondaria"
                    orientation="horizontal"
                    type="email"
                    helpText="Indirizzo email secondario utilizzato per l'invio manuale delle ricevute di affitto (ad esempio per inoltrare una copia al commercialista o a terzi)."
                />
                <PhoneInput
                    name="TenantMobilePhoneNat"
                    label="Cellulare"
                    orientation="horizontal"
                />
                <PhoneInput
                    name="TenantPhoneNat"
                    label="Telefono"
                    orientation="horizontal"
                />
            </FormSection>

            {/* === Sezione: Indirizzo === */}
            <FormSection title={isPerson ? "Indirizzo residenza" : "Sede legale"}>
                <TextInput
                    name="TenantAddress1"
                    label="Indirizzo"
                    orientation="horizontal"
                    placeholder="Inserisci una posizione"
                />
                <TextInput
                    name="TenantAddress2"
                    label="Indirizzo 2"
                    orientation="horizontal"
                />
                <TextInput
                    name="TenantCity"
                    label="Città"
                    orientation="horizontal"
                />
                <TextInput
                    name="TenantZip"
                    label="CAP"
                    orientation="horizontal"
                />
                <TextInput
                    name="TenantState"
                    label="Regione"
                    orientation="horizontal"
                />
                <Select
                    name="TenantCountry"
                    label="Paese"
                    orientation="horizontal"
                    options={COUNTRIES}
                />
            </FormSection>
        </div>
    );
}
