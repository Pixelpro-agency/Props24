import { FormSection } from '../ui/FormSection';
import { TextInput } from '../ui/TextInput';
import { NumberInput } from '../ui/NumberInput';
import { TextArea } from '../ui/TextArea';
import { Select } from '../ui/Select';
import { ColorPicker } from '../ui/ColorPicker';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';

export function Tab1Info() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 3.1.1 Tipo & 3.1.2 Identificativo */}
            <FormSection title="Tipo" defaultOpen={true}>
                <div className="flex flex-col gap-6">
                    <Select
                        name="PropertyTypeID"
                        label="Tipo"
                        orientation="horizontal"
                        options={[
                            { value: 'appartamento', label: 'Appartamento' },
                            { value: 'negozio', label: 'Negozio' },
                            { value: 'ufficio_condiviso', label: 'Ufficio condiviso' },
                            { value: 'ufficio', label: 'Ufficio' },
                            { value: 'roulotte', label: 'Roulotte' },
                            { value: 'cantina', label: 'Cantina' },
                            { value: 'chalet', label: 'Chalet' },
                            { value: 'stanza', label: 'Stanza' },
                            { value: 'commercio', label: 'Commercio' },
                            { value: 'magazzino', label: 'Magazzino' },
                            { value: 'garage', label: 'Garage' },
                            { value: 'laboratorio', label: 'Laboratorio' },
                            { value: 'locale_professionale', label: 'Locale professionale' },
                            { value: 'casa', label: 'Casa' },
                            { value: 'casa_di_citta', label: 'Casa di città' },
                            { value: 'mansarda', label: 'Mansarda' },
                            { value: 'casa_mobile', label: 'Casa mobile' },
                            { value: 'parcheggio', label: 'Parcheggio' },
                            { value: 'terreno', label: 'Terreno' },
                            { value: 'nuda_proprieta', label: 'Nuda proprietà' },
                            { value: 'altro', label: 'Altro' },
                        ]}
                    />
                </div>
            </FormSection>

            <FormSection title="Identificativo" defaultOpen={true}>
                <div className="flex flex-col gap-6">
                    <TextInput
                        name="PropertyTitle"
                        label="Identificativo"
                        placeholder="Nuova proprietà"
                        orientation="horizontal"
                        required
                        helpText="Assegna un identificativo, un nome o un numero univoco. Puoi inserire o inventare un riferimento libero."
                    />
                    <div className="grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4">
                        <label className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase pt-3 text-right">
                            Colore
                        </label>
                        <div className="flex-1 w-full max-w-[500px]">
                            <ColorPicker
                                name="PropertyAvatarHexColor"
                                label=""
                            />
                        </div>
                    </div>
                </div>
            </FormSection>

            {/* 3.1.3 Indirizzo */}
            <FormSection title="Indirizzo" defaultOpen={true}>
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4">
                        <label className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase pt-3 text-right">
                            Indirizzo <span className="text-red-500">*</span>
                        </label>
                        <div className="flex-1 w-full max-w-[500px]">
                            <AddressAutocomplete
                                name="PropertyAddress"
                                label=""
                                placeholder="Inserisci una posizione"
                                required
                            />
                        </div>
                    </div>
                    <TextInput
                        name="PropertyAddress2"
                        label="Indirizzo 2"
                        orientation="horizontal"
                    />
                    <TextInput
                        name="PropertyFloor"
                        label="Piano"
                        orientation="horizontal"
                    />
                    <TextInput
                        name="PropertyDoorNum"
                        label="Numero"
                        orientation="horizontal"
                    />
                    <TextInput
                        name="PropertyCity"
                        label="Città"
                        required
                        orientation="horizontal"
                    />
                    <TextInput
                        name="PropertyPostalCode"
                        label="CAP"
                        required
                        orientation="horizontal"
                    />
                    <TextInput
                        name="PropertyCounty"
                        label="Provincia"
                        orientation="horizontal"
                    />
                    <TextInput
                        name="PropertyState"
                        label="Regione"
                        orientation="horizontal"
                    />
                    <Select
                        name="PropertyCountry"
                        label="Paese"
                        orientation="horizontal"
                        options={[
                            { value: 'IT', label: 'Italia' },
                            { value: 'AF', label: 'Afghanistan' },
                            { value: 'AX', label: 'Aland Islands' },
                            { value: 'AL', label: 'Albania' },
                            { value: 'DZ', label: 'Algeria' },
                            { value: 'AD', label: 'Andorra' },
                            { value: 'AO', label: 'Angola' },
                            { value: 'AI', label: 'Anguilla' },
                            { value: 'AQ', label: 'Antartide' },
                            { value: 'AG', label: 'Antigua e Barbuda' },
                            { value: 'AN', label: 'Antille Olandesi' },
                            { value: 'SA', label: 'Arabia Saudita' },
                            { value: 'AR', label: 'Argentina' },
                            { value: 'AM', label: 'Armenia' },
                            { value: 'AW', label: 'Aruba' },
                            { value: 'AU', label: 'Australia' },
                            { value: 'AT', label: 'Austria' },
                            { value: 'AZ', label: 'Azerbaigian' },
                            { value: 'BS', label: 'Bahamas' },
                            { value: 'BH', label: 'Bahrein' },
                            { value: 'BD', label: 'Bangladesh' },
                            { value: 'BB', label: 'Barbados' },
                            { value: 'BE', label: 'Belgio' },
                            { value: 'BZ', label: 'Belize' },
                            { value: 'BJ', label: 'Benin' },
                            { value: 'BM', label: 'Bermuda' },
                            { value: 'BT', label: 'Bhutan' },
                            { value: 'BY', label: 'Bielorussia' },
                            { value: 'BO', label: 'Bolivia' },
                            { value: 'BA', label: 'Bosnia Erzegovina' },
                            { value: 'BW', label: 'Botswana' },
                            { value: 'BR', label: 'Brasile' },
                            { value: 'IO', label: 'British Antarctic Territory' },
                            { value: 'BN', label: 'Brunei' },
                            { value: 'BG', label: 'Bulgaria' },
                            { value: 'BF', label: 'Burkina Faso' },
                            { value: 'BI', label: 'Burundi' },
                            { value: 'KH', label: 'Cambogia' },
                            { value: 'CM', label: 'Camerun' },
                            { value: 'CA', label: 'Canada' },
                            { value: 'CV', label: 'Capo Verde' },
                            { value: 'TD', label: 'Ciad' },
                            { value: 'CL', label: 'Cile' },
                            { value: 'CN', label: 'Cina' },
                            { value: 'CY', label: 'Cipro' },
                            { value: 'CO', label: 'Colombia' },
                            { value: 'KM', label: 'Comore' },
                            { value: 'CG', label: 'Congo' },
                            { value: 'KP', label: 'Corea del Nord' },
                            { value: 'KR', label: 'Corea del Sud' },
                            { value: 'CR', label: 'Costa Rica' },
                            { value: 'CI', label: 'Costa d’Avorio' },
                            { value: 'HR', label: 'Croazia' },
                            { value: 'CU', label: 'Cuba' },
                            { value: 'DK', label: 'Danimarca' },
                            { value: 'DM', label: 'Dominica' },
                            { value: 'EC', label: 'Ecuador' },
                            { value: 'EG', label: 'Egitto' },
                            { value: 'SV', label: 'El Salvador' },
                            { value: 'AE', label: 'Emirati Arabi Uniti' },
                            { value: 'ER', label: 'Eritrea' },
                            { value: 'EE', label: 'Estonia' },
                            { value: 'ET', label: 'Etiopia' },
                            { value: 'RU', label: 'Federazione Russa' },
                            { value: 'FJ', label: 'Figi' },
                            { value: 'PH', label: 'Filippine' },
                            { value: 'FI', label: 'Finlandia' },
                            { value: 'FR', label: 'Francia' },
                            { value: 'GA', label: 'Gabon' },
                            { value: 'GM', label: 'Gambia' },
                            { value: 'GE', label: 'Georgia' },
                            { value: 'DE', label: 'Germania' },
                            { value: 'GH', label: 'Ghana' },
                            { value: 'JM', label: 'Giamaica' },
                            { value: 'JP', label: 'Giappone' },
                            { value: 'GI', label: 'Gibilterra' },
                            { value: 'DJ', label: 'Gibuti' },
                            { value: 'JO', label: 'Giordania' },
                            { value: 'GR', label: 'Grecia' },
                            { value: 'GD', label: 'Grenada' },
                            { value: 'GL', label: 'Groenlandia' },
                            { value: 'GP', label: 'Guadalupa' },
                            { value: 'GU', label: 'Guam' },
                            { value: 'GT', label: 'Guatemala' },
                            { value: 'GF', label: 'Guiana Francese' },
                            { value: 'GN', label: 'Guinea' },
                            { value: 'GQ', label: 'Guinea Equatoriale' },
                            { value: 'GW', label: 'Guinea-Bissau' },
                            { value: 'GY', label: 'Guyana' },
                            { value: 'HT', label: 'Haiti' },
                            { value: 'HN', label: 'Honduras' },
                            { value: 'IN', label: 'India' },
                            { value: 'ID', label: 'Indonesia' },
                            { value: 'IR', label: 'Iran' },
                            { value: 'IQ', label: 'Iraq' },
                            { value: 'IE', label: 'Irlanda' },
                            { value: 'IS', label: 'Islanda' },
                            { value: 'BV', label: 'Isola Bouvet' },
                            { value: 'NF', label: 'Isola Norfolk' },
                            { value: 'CX', label: 'Isola di Christmas' },
                            { value: 'KY', label: 'Isole Cayman' },
                            { value: 'CC', label: 'Isole Cocos (Keeling)' },
                            { value: 'CK', label: 'Isole Cook' },
                            { value: 'FK', label: 'Isole Falkland' },
                            { value: 'FO', label: 'Isole Faroe' },
                            { value: 'MP', label: 'Isole Marianne Settentrionali' },
                            { value: 'MH', label: 'Isole Marshall' },
                            { value: 'UM', label: 'Isole Minori lontane dagli Stati Uniti' },
                            { value: 'SB', label: 'Isole Solomon' },
                            { value: 'TC', label: 'Isole Turks e Caicos' },
                            { value: 'VI', label: 'Isole Vergini Americane' },
                            { value: 'VG', label: 'Isole Vergini Britanniche' },
                            { value: 'IL', label: 'Israele' },
                            { value: 'KZ', label: 'Kazakistan' },
                            { value: 'KE', label: 'Kenya' },
                            { value: 'KG', label: 'Kirghizistan' },
                            { value: 'KI', label: 'Kiribati' },
                            { value: 'KW', label: 'Kuwait' },
                            { value: 'LA', label: 'Laos' },
                            { value: 'LS', label: 'Lesotho' },
                            { value: 'LV', label: 'Lettonia' },
                            { value: 'LB', label: 'Libano' },
                            { value: 'LR', label: 'Liberia' },
                            { value: 'LY', label: 'Libia' },
                            { value: 'LI', label: 'Liechtenstein' },
                            { value: 'LT', label: 'Lituania' },
                            { value: 'LU', label: 'Lussemburgo' },
                            { value: 'MK', label: 'Macedonia, Repubblica' },
                            { value: 'MG', label: 'Madagascar' },
                            { value: 'MW', label: 'Malawi' },
                            { value: 'MY', label: 'Malaysia' },
                            { value: 'MV', label: 'Maldive' },
                            { value: 'ML', label: 'Mali' },
                            { value: 'MT', label: 'Malta' },
                            { value: 'MA', label: 'Marocco' },
                            { value: 'MQ', label: 'Martinica' },
                            { value: 'MR', label: 'Mauritania' },
                            { value: 'MU', label: 'Maurizio' },
                            { value: 'YT', label: 'Mayotte' },
                            { value: 'MX', label: 'Messico' },
                            { value: 'FM', label: 'Micronesia' },
                            { value: 'MD', label: 'Moldavia' },
                            { value: 'MC', label: 'Monaco' },
                            { value: 'MN', label: 'Mongolia' },
                            { value: 'ME', label: 'Montenegro' },
                            { value: 'MS', label: 'Montserrat' },
                            { value: 'MZ', label: 'Mozambico' },
                            { value: 'MM', label: 'Myanmar' },
                            { value: 'NA', label: 'Namibia' },
                            { value: 'NR', label: 'Nauru' },
                            { value: 'NP', label: 'Nepal' },
                            { value: 'NI', label: 'Nicaragua' },
                            { value: 'NE', label: 'Niger' },
                            { value: 'NG', label: 'Nigeria' },
                            { value: 'NU', label: 'Niue' },
                            { value: 'NO', label: 'Norvegia' },
                            { value: 'NC', label: 'Nuova Caledonia' },
                            { value: 'NZ', label: 'Nuova Zelanda' },
                            { value: 'OM', label: 'Oman' },
                            { value: 'NL', label: 'Paesi Bassi' },
                            { value: 'PK', label: 'Pakistan' },
                            { value: 'PW', label: 'Palau' },
                            { value: 'PS', label: 'Palestina' },
                            { value: 'PA', label: 'Panama' },
                            { value: 'PG', label: 'Papua Nuova Guinea' },
                            { value: 'PY', label: 'Paraguay' },
                            { value: 'PE', label: 'Perù' },
                            { value: 'PN', label: 'Pitcairn' },
                            { value: 'PF', label: 'Polinesia Francese' },
                            { value: 'PL', label: 'Polonia' },
                            { value: 'PT', label: 'Portogallo' },
                            { value: 'PR', label: 'Portorico' },
                            { value: 'QA', label: 'Qatar' },
                            { value: 'GB', label: 'Regno Unito' },
                            { value: 'CZ', label: 'Repubblica Ceca' },
                            { value: 'CF', label: 'Repubblica Centrafricana' },
                            { value: 'CD', label: 'Repubblica Democratica del Congo' },
                            { value: 'DO', label: 'Repubblica Dominicana' },
                            { value: 'RO', label: 'Romania' },
                            { value: 'RW', label: 'Ruanda' },
                            { value: 'RE', label: 'Réunion' },
                            { value: 'EH', label: 'Sahara Occidentale' },
                            { value: 'KN', label: 'Saint Kitts e Nevis' },
                            { value: 'LC', label: 'Saint Lucia' },
                            { value: 'PM', label: 'Saint Pierre e Miquelon' },
                            { value: 'VC', label: 'Saint Vincent e Grenadines' },
                            { value: 'BL', label: 'Saint-Barthélemy' },
                            { value: 'MF', label: 'Saint-Martin' },
                            { value: 'WS', label: 'Samoa' },
                            { value: 'AS', label: 'Samoa Americane' },
                            { value: 'SM', label: 'San Marino' },
                            { value: 'SH', label: 'Sant’Elena' },
                            { value: 'SN', label: 'Senegal' },
                            { value: 'RS', label: 'Serbia' },
                            { value: 'SC', label: 'Seychelles' },
                            { value: 'SL', label: 'Sierra Leone' },
                            { value: 'SG', label: 'Singapore' },
                            { value: 'SX', label: 'Sint Maarten' },
                            { value: 'SY', label: 'Siria' },
                            { value: 'SK', label: 'Slovacchia' },
                            { value: 'SI', label: 'Slovenia' },
                            { value: 'SO', label: 'Somalia' },
                            { value: 'ES', label: 'Spagna' },
                            { value: 'LK', label: 'Sri Lanka' },
                            { value: 'US', label: 'Stati Uniti' },
                            { value: 'ZA', label: 'Sudafrica' },
                            { value: 'SD', label: 'Sudan' },
                            { value: 'SR', label: 'Suriname' },
                            { value: 'SJ', label: 'Svalbard e Jan Mayen' },
                            { value: 'SE', label: 'Svezia' },
                            { value: 'CH', label: 'Svizzera' },
                            { value: 'SZ', label: 'Swaziland' },
                            { value: 'ST', label: 'São Tomé e Príncipe' },
                            { value: 'TJ', label: 'Tagikistan' },
                            { value: 'TH', label: 'Tailandia' },
                            { value: 'TW', label: 'Taiwan' },
                            { value: 'TZ', label: 'Tanzania' },
                            { value: 'TF', label: 'Territori australi francesi' },
                            { value: 'IO', label: 'Territorio Britannico dell’Oceano Indiano' },
                            { value: 'TL', label: 'Timor Est' },
                            { value: 'TG', label: 'Togo' },
                            { value: 'TK', label: 'Tokelau' },
                            { value: 'TO', label: 'Tonga' },
                            { value: 'TT', label: 'Trinidad e Tobago' },
                            { value: 'TN', label: 'Tunisia' },
                            { value: 'TR', label: 'Turchia' },
                            { value: 'TM', label: 'Turkmenistan' },
                            { value: 'TV', label: 'Tuvalu' },
                            { value: 'UA', label: 'Ucraina' },
                            { value: 'UG', label: 'Uganda' },
                            { value: 'HU', label: 'Ungheria' },
                            { value: 'UY', label: 'Uruguay' },
                            { value: 'UZ', label: 'Uzbekistan' },
                            { value: 'VU', label: 'Vanuatu' },
                            { value: 'VA', label: 'Vaticano' },
                            { value: 'VE', label: 'Venezuela' },
                            { value: 'VN', label: 'Vietnam' },
                            { value: 'WF', label: 'Wallis e Futuna' },
                            { value: 'YE', label: 'Yemen' },
                            { value: 'ZM', label: 'Zambia' },
                            { value: 'ZW', label: 'Zimbabwe' },
                        ]}
                    />
                </div>
            </FormSection>

            {/* 3.1.4 Descrizione (Dimensioni) */}
            <FormSection title="Descrizione">
                <div className="flex flex-col gap-6">
                    <NumberInput
                        name="PropertySize"
                        label="Superficie m2"
                        min={0}
                        orientation="horizontal"
                    />
                    <NumberInput
                        name="PropertyRoomsNum"
                        label="Numero locali"
                        min={0}
                        orientation="horizontal"
                    />
                    <NumberInput
                        name="PropertyRoomsNumChambres"
                        label="Numero di camere da letto"
                        min={0}
                        orientation="horizontal"
                    />
                    <NumberInput
                        name="PropertyRoomsNumBaths"
                        label="Bagni"
                        min={0}
                        orientation="horizontal"
                    />
                    <div className="grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4">
                        <label className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase pt-3 text-right">
                            Descrizione
                        </label>
                        <div className="flex-1 w-full max-w-[500px]">
                            <TextArea
                                name="PropertyComments"
                                label=""
                                placeholder="Descrivi brevemente l'immobile: tipo, dimensioni, disposizione, comfort e caratteristiche particolari. Descrizione dell'immobile sul contratto di locazione."
                                rows={4}
                            />
                        </div>
                    </div>
                </div>
            </FormSection>

            {/* 3.1.5 Locazione */}
            <FormSection title="Informazioni sulla locazione">
                <div className="flex flex-col gap-6">
                    <Select
                        name="PropertyStatusManual"
                        label="Stato locativo"
                        orientation="horizontal"
                        helpText="Indicare lo stato di locazione dell'immobile (affittato, sfitto, in ristrutturazione, ecc.)."
                        options={[
                            { value: '0', label: 'Automatico' },
                            { value: 'disponibile', label: 'Disponibile' },
                            { value: 'affittato', label: 'Affittato' },
                            { value: 'preavviso', label: 'Preavviso / Uscita' },
                            { value: 'ricerca', label: 'Ricerca inquilini' },
                            { value: 'non_disponibile', label: 'Non disponibile' },
                            { value: 'lavori', label: 'Lavori' },
                        ]}
                    />
                    <Select
                        name="PropertyRentType"
                        label="Tipo di locazione"
                        orientation="horizontal"
                        options={[
                            { value: '', label: 'Scegli' }
                        ]}
                    />
                    <NumberInput
                        name="PropertyRent"
                        label="Affitto (spese escluse)"
                        symbol="€"
                        min={0}
                        orientation="horizontal"
                        helpText="Importo annuale. L’ammontare inserito sarà riportato nella brochure elettronica (vi si accede cliccando sul nome del bene in Proprietà). Questa voce non va a modificare l’ammontare specificato nella sezione Locazioni."
                    />
                    <NumberInput
                        name="PropertyMaintenance"
                        label="Spese accessorie"
                        symbol="€"
                        min={0}
                        orientation="horizontal"
                        helpText="Importo annuale. L’ammontare inserito sarà riportato nella brochure elettronica (vi si accede cliccando sul nome del bene in Proprietà). Questa voce non va a modificare l’ammontare specificato nella sezione Locazioni."
                    />
                    <Select
                        name="PropertyBillingPeriod"
                        label="Frequenza di pagamento"
                        orientation="horizontal"
                        options={[
                            { value: '', label: 'Scegli' }
                        ]}
                    />
                </div>
            </FormSection>

            {/* 3.1.6 Prestazione Energetica */}
            <FormSection title="Prestazione Energetica" collapsible={false} defaultOpen={true}>
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4">
                        <label className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase pt-3 text-right">
                            Classe Energetica
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4 items-center flex-1 w-full max-w-[500px]">
                            <div className="w-full sm:w-1/2">
                                <TextInput
                                    name="PropertyEnergyConsumptionIndex2"
                                    label=""
                                    placeholder="Es. 100"
                                />
                            </div>
                            <div className="w-full sm:w-1/2">
                                <Select
                                    name="PropertyEnergyConsumption2"
                                    label=""
                                    options={[
                                        { value: '', label: 'Scegli' },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4">
                        <label className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase pt-3 text-right">
                            Spesa Annuale
                        </label>
                        <div className="flex flex-col flex-1 w-full max-w-[500px]">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-1/3">
                                    <NumberInput name="PropertyEnergyConsumptionAmountFrom2" label="" symbol="€" />
                                </div>
                                <div className="w-full sm:w-1/3">
                                    <NumberInput name="PropertyEnergyConsumptionAmountTo2" label="" symbol="€" />
                                </div>
                                <div className="w-full sm:w-1/3">
                                    <Select
                                        name="PropertyEnergyConsumptionYear2"
                                        label=""
                                        options={[
                                            { value: '', label: 'Anno' },
                                            { value: '2024', label: '2024' },
                                            { value: '2025', label: '2025' },
                                            { value: '2026', label: '2026' }
                                        ]}
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">Costi energetici annuali stimati per un utilizzo standard.</p>
                        </div>
                    </div>
                </div>
            </FormSection>

            {/* 3.1.7 Note Generali */}
            <FormSection title="Note / Note" collapsible={false} defaultOpen={true}>
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4">
                        <label className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase pt-3 text-right">
                            Nota Privata
                        </label>
                        <div className="flex-1 w-full max-w-[500px] flex flex-col gap-1.5">
                            <TextArea
                                name="PropertyCommentsNew"
                                label=""
                                rows={4}
                            />
                            <p className="text-sm text-gray-500">Solo tu puoi leggere questa nota.</p>
                        </div>
                    </div>
                </div>
            </FormSection>

        </div>
    );
}
