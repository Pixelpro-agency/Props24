import type { DraftDefinition } from '../../db/draftRepository.port';
import {
    normalizePropertyDraftState,
    type PropertyFormState,
} from './schema';

export const PROPERTY_DRAFT_SCHEMA_VERSION = 2;

export const propertyDraftDefinition: DraftDefinition<PropertyFormState> = {
    formType: 'property',
    schemaVersion: PROPERTY_DRAFT_SCHEMA_VERSION,
    parse(payload, schemaVersion) {
        if (schemaVersion !== 1 && schemaVersion !== PROPERTY_DRAFT_SCHEMA_VERSION) {
            throw new Error(
                `Versione bozza unità non supportata: ${schemaVersion}.`,
            );
        }

        if (schemaVersion === 1) {
            return normalizePropertyDraftState({
                ...(typeof payload === 'object' && payload !== null ? payload : {}),
                PropertyBuildingId: '',
            });
        }
        return normalizePropertyDraftState(payload);
    },
};
