import type { DraftDefinition } from '../../db/draftRepository.port';
import {
    normalizePropertyDraft,
    type PropertyFormData,
} from './schema';

export const PROPERTY_DRAFT_SCHEMA_VERSION = 1;

export const propertyDraftDefinition: DraftDefinition<PropertyFormData> = {
    formType: 'property',
    schemaVersion: PROPERTY_DRAFT_SCHEMA_VERSION,
    parse(payload, schemaVersion) {
        if (schemaVersion !== PROPERTY_DRAFT_SCHEMA_VERSION) {
            throw new Error(
                `Versione bozza unità non supportata: ${schemaVersion}.`,
            );
        }

        return normalizePropertyDraft(payload);
    },
};
