import type { DraftDefinition } from '../../../db/draftRepository.port';
import {
    normalizeLeaseDraft,
    normalizeLeaseFormData,
    type LeaseFormData,
} from '../schema/leaseFormSchema';

export const LEASE_DRAFT_SCHEMA_VERSION = 1;

export const LEASE_FORM_TABS = [
    'general',
    'tenants',
    'guarantors',
    'receipts',
    'settings',
    'insurance',
    'documents',
    'contract',
    'signature',
] as const;

export type LeaseFormTab = (typeof LEASE_FORM_TABS)[number];

export interface LeaseDraftPayload {
    formData: LeaseFormData;
    activeTab: LeaseFormTab;
}

export function normalizeLeaseFormTab(value: unknown): LeaseFormTab {
    return typeof value === 'string'
        && (LEASE_FORM_TABS as readonly string[]).includes(value)
        ? value as LeaseFormTab
        : 'general';
}

function isPayloadObject(payload: unknown): payload is Record<string, unknown> {
    return typeof payload === 'object' && payload !== null && !Array.isArray(payload);
}

export const leaseDraftDefinition: DraftDefinition<LeaseDraftPayload> = {
    formType: 'lease',
    schemaVersion: LEASE_DRAFT_SCHEMA_VERSION,
    parse(payload, schemaVersion) {
        if (schemaVersion !== LEASE_DRAFT_SCHEMA_VERSION) {
            throw new Error(
                `Versione bozza locazione non supportata: ${schemaVersion}.`,
            );
        }
        if (!isPayloadObject(payload) || !isPayloadObject(payload.formData)) {
            throw new Error('Payload della bozza locazione non valido.');
        }

        const legacy = normalizeLeaseDraft(structuredClone(payload));
        if (!legacy) {
            throw new Error('Payload della bozza locazione non valido.');
        }
        return {
            formData: normalizeLeaseFormData(structuredClone(legacy.formData)),
            activeTab: normalizeLeaseFormTab(legacy.activeTab),
        };
    },
};
