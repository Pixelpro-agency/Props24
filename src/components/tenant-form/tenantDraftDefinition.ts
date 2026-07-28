import type { DraftDefinition } from '../../db/draftRepository.port';
import {
    normalizeTenantDraft,
    type TenantFormData,
} from './schema';

export const TENANT_DRAFT_SCHEMA_VERSION = 1;

export const tenantDraftDefinition: DraftDefinition<TenantFormData> = {
    formType: 'tenant',
    schemaVersion: TENANT_DRAFT_SCHEMA_VERSION,
    parse(payload, schemaVersion) {
        if (schemaVersion !== TENANT_DRAFT_SCHEMA_VERSION) {
            throw new Error(
                `Versione bozza inquilino non supportata: ${schemaVersion}.`,
            );
        }

        return normalizeTenantDraft(payload);
    },
};
