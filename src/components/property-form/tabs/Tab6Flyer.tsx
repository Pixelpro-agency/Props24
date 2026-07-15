import { FormSection } from '../ui/FormSection';
import { TextArea } from '../ui/TextArea';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { EyeOff } from 'lucide-react';

export function Tab6Flyer() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FormSection title="Flyer digitale" defaultOpen={true}>
                <div className="flex flex-col gap-8">

                    <TextArea
                        name="PropertyPublicDescription"
                        label="Descrizione pubblica"
                        orientation="horizontal"
                        rows={5}
                        helpText="Descrivi brevemente l'immobile: tipo, dimensioni, disposizione, comfort e caratteristiche particolari. Descrizione della proprietà mostrata sul flyer digitale."
                    />

                    <TextArea
                        name="PropertyHouseRules"
                        label="Regole di casa"
                        orientation="horizontal"
                        rows={4}
                        helpText="Regole della casa riportate sul flyer digitale."
                    />

                    <div className="pt-2">
                        <ToggleSwitch
                            name="PropertyPublic"
                            label="Disponibilità"
                            sideText={
                                <span className="flex items-center gap-1.5 font-medium">
                                    La proprietà è in modalità <strong>Privata</strong> <EyeOff className="w-4 h-4 text-gray-400" />
                                </span>
                            }
                            helpText="Attiva il foyer elettronico se stai cercando un inquilino. I candidati potranno rispondere al tuo annuncio direttamente dal nostro sito."
                        />
                    </div>

                    <div className="pt-2">
                        <ToggleSwitch
                            name="PropertyPublicAddress"
                            label="Indirizzo"
                            sideText={
                                <span className="flex items-center gap-1.5 font-medium">
                                    L'indirizzo dell'immobile è <strong>Privata</strong> <EyeOff className="w-4 h-4 text-gray-400" />
                                </span>
                            }
                        />
                    </div>

                    <div className="pt-2">
                        <ToggleSwitch
                            name="PropertyPublicPhone"
                            label="Telefono"
                            sideText={
                                <span className="flex items-center gap-1.5 font-medium">
                                    Il numero di telefono è <strong>Privata</strong> <EyeOff className="w-4 h-4 text-gray-400" />
                                </span>
                            }
                        />
                    </div>

                </div>
            </FormSection>
        </div>
    );
}
