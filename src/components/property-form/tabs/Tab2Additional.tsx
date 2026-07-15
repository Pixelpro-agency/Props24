import { useFormContext } from 'react-hook-form';
import { FormSection } from '../ui/FormSection';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { CheckboxGrid } from '../ui/CheckboxGrid';
import { TextInput } from '../ui/TextInput';

// Lista dei PropertyTypeID (dalla Select in Tab1) che richiedono di mostrare
// i campi extra (Parcheggio, Cantina, Millesimi, ecc.).
// Tipicamente: Appartamento(1), Casa(2), Stanza(11), ecc.
// Se non c'è DB, assumiamo che i tipi principali (1-5) e altri residenziali (11-13) abbiano gli extra.
const typesWithExtras = ['1', '2', '3', '4', '5', '11', '12', '14'];

export function Tab2Additional() {
    const { watch } = useFormContext();
    const propertyTypeId = watch('PropertyTypeID');

    // Determina se mostrare i campi accessori (Logica PTExtras)
    const showExtras = !propertyTypeId || typesWithExtras.includes(propertyTypeId);
    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <FormSection title="Informazioni aggiuntive" defaultOpen={true}>
                <div className="flex flex-col gap-6">
                    <ToggleSwitch
                        name="PropertyFurnished"
                        label="Ammobiliato"
                    />
                    <ToggleSwitch
                        name="PropertySmokers"
                        label="Fumatori accettati"
                    />
                    <ToggleSwitch
                        name="PropertyAnimals"
                        label="Animali accettati"
                    />

                    {showExtras && (
                        <>
                            <CheckboxGrid
                                name="PropertyEquipment"
                                categories={[
                                    {
                                        category: 'Attrezzatura',
                                        items: [
                                            { id: 'internet', label: 'Accesso Internet' },
                                            { id: 'water_softener', label: 'Addolcitore d\'acqua' },
                                            { id: 'ac', label: 'Aria condizionata' },
                                            { id: 'tv_antenna', label: 'Antenna TV collettiva' },
                                            { id: 'car_charging', label: 'Terminale per auto elettriche' },
                                            { id: 'fiber', label: 'Cavo/fibra' },
                                            { id: 'central_heating', label: 'Riscaldamento centralizzato' },
                                            { id: 'fireplace', label: 'Camino' },
                                            { id: 'smoke_detector', label: 'Rivelatori di fumo' },
                                            { id: 'home_automation', label: 'Automazione domestica' },
                                            { id: 'double_glazing', label: 'Doppi vetri' },
                                            { id: 'central_hot_water', label: 'Produzione acqua calda centralizzata' },
                                            { id: 'solar_panels', label: 'Pannelli solari' },
                                            { id: 'parking', label: 'Parcheggio' },
                                            { id: 'sauna', label: 'Sauna' },
                                            { id: 'blinds', label: 'Tende' },
                                            { id: 'electric_blinds', label: 'Tende elettriche' },
                                            { id: 'connected_thermostat', label: 'Termostato collegato' },
                                            { id: 'ventilation', label: 'Ventilazione' },
                                            { id: 'trash_chute', label: 'Scivolo spazzatura' },
                                            { id: 'mechanical_ventilation', label: 'Ventilazione meccanica' },
                                            { id: 'shutters', label: 'Tapparelle' },
                                            { id: 'electric_shutters', label: 'Tapparelle elettriche' }
                                        ]
                                    },
                                    {
                                        category: 'Aree esterne',
                                        items: [
                                            { id: 'play_area', label: 'Area attrezzata con giochi' },
                                            { id: 'balcony', label: 'Balcone' },
                                            { id: 'bbq', label: 'Barbecue' },
                                            { id: 'garden_space', label: 'Spazio verde / giardino' },
                                            { id: 'garden', label: 'Giardino' },
                                            { id: 'terrace', label: 'Terrazza' }
                                        ]
                                    },
                                    {
                                        category: 'Stabile',
                                        items: [
                                            { id: 'disabled_access', label: 'Accesso per i disabili' },
                                            { id: 'elevator', label: 'Ascensore' },
                                            { id: 'shared_laundry', label: 'Lavanderia in comune' },
                                            { id: 'cellar', label: 'Cantina' },
                                            { id: 'cinema', label: 'Cinema' },
                                            { id: 'concierge', label: 'Concierge' },
                                            { id: 'fiber_building', label: 'Fibra ottica' },
                                            { id: 'garage_building', label: 'Garage' },
                                            { id: 'bike_parking', label: 'Posto bici' },
                                            { id: 'laundry_room', label: 'Lavanderia' },
                                            { id: 'bike_room', label: 'Sala biciclette' }
                                        ]
                                    },
                                    {
                                        category: 'Sicurezza',
                                        items: [
                                            { id: 'alarm', label: 'Allarme' },
                                            { id: 'fire_alarm', label: 'Allarme antincendio' },
                                            { id: 'window_bars', label: 'Barre per finestre' },
                                            { id: 'safe', label: 'Sicuro' },
                                            { id: 'digicode', label: 'Digicode' },
                                            { id: 'guard', label: 'Sorvegliante' },
                                            { id: 'intercom', label: 'Citofono' },
                                            { id: 'armored_door', label: 'Porta blindata' },
                                            { id: 'security_service', label: 'Servizio di sicurezza' },
                                            { id: 'security_system', label: 'Sistema di sicurezza' },
                                            { id: 'video_surveillance', label: 'Videosorveglianza' },
                                            { id: 'videophone', label: 'Videotelefono' }
                                        ]
                                    },
                                    {
                                        category: 'Impianti sportivi',
                                        items: [
                                            { id: 'gym', label: 'Palestra' },
                                            { id: 'pool', label: 'Piscina' },
                                            { id: 'sports_hall', label: 'Palazzetto dello sport' },
                                            { id: 'spa', label: 'Spa' },
                                            { id: 'tennis', label: 'Tennis' },
                                            { id: 'playground', label: 'Parco giochi' }
                                        ]
                                    }
                                ]}
                            />

                            <TextInput name="PropertyParking" label="Parcheggio" orientation="horizontal" />
                            <TextInput name="PropertyOtherExpenses" label="Altre pertinenze" orientation="horizontal" />
                            <TextInput name="PropertyCave" label="Cantina" orientation="horizontal" />
                            <TextInput name="PropertyLot" label="Unità" orientation="horizontal" />
                            <TextInput name="PropertyThousandths" label="Millesimi" orientation="horizontal" />
                        </>
                    )}
                </div>
            </FormSection>

            <FormSection title="Riferimenti catastali" defaultOpen={true}>
                <div className="flex flex-col gap-6">
                    <TextInput name="PropertyCadastreSheet" label="Foglio catasto" orientation="horizontal" />
                    <TextInput name="PropertyCadastrePart" label="Particella catasto" orientation="horizontal" />
                    <TextInput name="PropertyCadastreSub" label="Subalterno catasto" orientation="horizontal" />
                    <TextInput name="PropertyUrbanSection" label="Sezione urbana" orientation="horizontal" />
                    <TextInput name="PropertyCadastreCat" label="Categoria catasto" orientation="horizontal" />
                    <TextInput name="PropertyCadastralIncome" label="Rendita catastale" orientation="horizontal" />
                </div>
            </FormSection>

            <FormSection title="Dati Rendita Catastale" defaultOpen={true}>
                <div className="flex flex-col gap-6">
                    <TextInput name="PropertyCadastralIncomeDataZone" label="Zona censuaria" orientation="horizontal" />
                    <TextInput name="PropertyCadastralIncomeDataClass" label="Classe" orientation="horizontal" />
                    <TextInput name="PropertyCadastralIncomeDataEntry" label="Partita" orientation="horizontal" />
                    <TextInput name="PropertyCadastralIncomeDataConsistencyRooms" label="Numero locali" orientation="horizontal" />
                </div>
            </FormSection>

        </div>
    );
}
