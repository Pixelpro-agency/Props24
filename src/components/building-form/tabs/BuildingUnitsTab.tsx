import { FormSection } from '../../property-form/ui/FormSection';

export function BuildingUnitsTab() {
    return (
        <FormSection title="Unità">
            <div role="note" className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <p>L'edificio può essere salvato senza unità.</p>
                <p>Dopo la creazione, le unità potranno essere aggiunte dal dettaglio edificio.</p>
                <p>Il flusso userà il normale form Nuova unità.</p>
            </div>
        </FormSection>
    );
}
