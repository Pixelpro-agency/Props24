import type { DraftDefinition } from '../../db/draftRepository.port';
import { normalizeBuildingDraftData, type BuildingFormData } from './schema';

export const BUILDING_DRAFT_SCHEMA_VERSION = 1;

export const buildingDraftDefinition: DraftDefinition<BuildingFormData> = {
    formType: 'building',
    schemaVersion: BUILDING_DRAFT_SCHEMA_VERSION,
    parse(payload, schemaVersion) {
        if (schemaVersion !== BUILDING_DRAFT_SCHEMA_VERSION) {
            throw new Error(`Versione bozza edificio non supportata: ${schemaVersion}.`);
        }
        return normalizeBuildingDraftData(payload);
    },
};
