import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormSection } from '../ui/FormSection';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { CheckboxGrid } from '../ui/CheckboxGrid';
import { TextInput } from '../ui/TextInput';
import type { PropertyFormData, StoredLocalFile } from '../schema';

// Lista dei PropertyTypeID (dalla Select in Tab1) che richiedono di mostrare
// i campi extra (Parcheggio, Cantina, Millesimi, ecc.).
// Tipicamente: Appartamento(1), Casa(2), Stanza(11), ecc.
// Se non c'è DB, assumiamo che i tipi principali (1-5) e altri residenziali (11-13) abbiano gli extra.
const typesWithExtras = ['1', '2', '3', '4', '5', '11', '12', '14'];

function newLocalFileId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return `cadastre-file-${crypto.randomUUID()}`;
    }

    return `cadastre-file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readFileAsStoredLocalFile(file: File): Promise<StoredLocalFile> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => {
            reject(reader.error || new Error('Impossibile leggere il documento selezionato.'));
        };

        reader.onabort = () => {
            reject(new Error('Impossibile leggere il documento selezionato.'));
        };

        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                reject(new Error('Impossibile leggere il documento selezionato.'));
                return;
            }

            resolve({
                id: newLocalFileId(),
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
                dataUrl: reader.result,
            });
        };

        reader.readAsDataURL(file);
    });
}

function formatFileSize(size: number): string {
    if (size >= 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }

    return `${Math.max(1, Math.ceil(size / 1024))} KB`;
}

export function Tab2Additional() {
    const { setValue, watch } = useFormContext<PropertyFormData>();
    const propertyTypeId = watch('PropertyTypeID');
    const cadastreDocument = watch('PropertyCadastreDocument');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileError, setFileError] = useState<string | null>(null);

    // Determina se mostrare i campi accessori (Logica PTExtras)
    const showExtras = !propertyTypeId || typesWithExtras.includes(propertyTypeId);

    // TODO: collegare il documento catastale a un servizio backend di analisi
    // documentale/OCR. La logica attuale salva soltanto il file nell'unità.
    const handleCadastreDocumentChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            setFileError('Impossibile leggere il documento selezionato.');
            return;
        }

        try {
            const storedFile = await readFileAsStoredLocalFile(file);

            setValue('PropertyCadastreDocument', storedFile, {
                shouldDirty: true,
                shouldValidate: true,
            });
            setFileError(null);
        } catch {
            setFileError('Impossibile leggere il documento selezionato.');
        } finally {
            event.target.value = '';
        }
    };

    const removeCadastreDocument = () => {
        setValue('PropertyCadastreDocument', null, {
            shouldDirty: true,
            shouldValidate: true,
        });
        setFileError(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
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
                    <div className="grid grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] items-start gap-4">
                        <div className="text-right pt-2">
                            <span className="block text-[11px] md:text-xs font-semibold text-gray-700 uppercase">
                                Documento catastale
                            </span>
                        </div>

                        <div className="w-full max-w-[600px]">
                            <label htmlFor="cadastre-document-input" className="sr-only">
                                Seleziona un documento catastale
                            </label>
                            <input
                                ref={fileInputRef}
                                id="cadastre-document-input"
                                type="file"
                                className="sr-only"
                                onChange={(event) => {
                                    void handleCadastreDocumentChange(event);
                                }}
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            >
                                Dati catasto
                            </button>

                            <p className="mt-2 text-sm text-gray-500">
                                Carica una foto, un PDF o un altro documento catastale.
                            </p>

                            {cadastreDocument && (
                                <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                                    <p className="text-sm font-medium text-green-800">
                                        Documento selezionato
                                    </p>
                                    <p className="mt-1 break-all text-sm text-gray-700">
                                        {cadastreDocument.name}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {formatFileSize(cadastreDocument.size)}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={removeCadastreDocument}
                                        className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus:underline"
                                    >
                                        Rimuovi
                                    </button>
                                </div>
                            )}

                            {fileError && (
                                <p role="alert" className="mt-2 text-sm text-red-600">
                                    {fileError}
                                </p>
                            )}
                        </div>
                    </div>

                    <TextInput name="PropertyCadastreSheet" label="Foglio" orientation="horizontal" />
                    <TextInput name="PropertyCadastrePart" label="Particella" orientation="horizontal" />
                    <TextInput name="PropertyCadastreSub" label="Subalterno" orientation="horizontal" />
                    <TextInput name="PropertyUrbanSection" label="Sezione urbana" orientation="horizontal" />
                    <TextInput name="PropertyCadastreCat" label="Categoria catastale" orientation="horizontal" />
                    <TextInput name="PropertyCadastralIncome" label="Rendita catastale" orientation="horizontal" />
                </div>
            </FormSection>

            <FormSection title="Dati Rendita Catastale" defaultOpen={true}>
                <div className="flex flex-col gap-6">
                    <TextInput name="PropertyCadastralIncomeDataZone" label="Zona censuaria" orientation="horizontal" />
                    <TextInput name="PropertyCadastralIncomeDataClass" label="Classe" orientation="horizontal" />
                    <TextInput name="PropertyCadastralIncomeDataConsistencyRooms" label="Numero locali" orientation="horizontal" />
                </div>
            </FormSection>

        </div>
    );
}
