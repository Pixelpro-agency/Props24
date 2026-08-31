import { describe, expect, it } from 'vitest';

import {
    normalizeDraftKey,
} from '../../src/db/draftRepository';
import {
    TENANT_DRAFT_SCHEMA_VERSION,
    tenantDraftDefinition,
} from '../../src/components/tenant-form/tenantDraftDefinition';
import { normalizeTenantFormData } from '../../src/components/tenant-form/schema';

describe('tenant draft definition', () => {
    it('dichiara form e versione canonici', () => {
        expect(tenantDraftDefinition.formType).toBe('tenant');
        expect(tenantDraftDefinition.schemaVersion).toBe(1);
        expect(TENANT_DRAFT_SCHEMA_VERSION).toBe(1);
    });

    it('accetta payload parziale e applica i default senza validazione submit', () => {
        const parsed = tenantDraftDefinition.parse({
            TenantEmail: 'tenant@example.com',
        }, 1);

        expect(parsed.TenantEmail).toBe('tenant@example.com');
        expect(parsed.TenantFirstName).toBe('');
        expect(parsed.TenantLastName).toBe('');
        expect(parsed.TenantType).toBe('person');
        expect(parsed.TenantCountry).toBe('IT');
        expect(parsed.TenantGuarantors).toEqual([]);
        expect(parsed.TenantEmergencyContacts).toEqual([]);
        expect(parsed.TenantDocuments).toEqual([]);
    });

    it('conserva array annidati e allegati validi', () => {
        const file = {
            id: 'file-1',
            name: 'documento.pdf',
            type: 'application/pdf',
            size: 120,
            lastModified: 1,
            dataUrl: 'data:application/pdf;base64,AA==',
        };
        const parsed = tenantDraftDefinition.parse({
            TenantPhoto: file,
            TenantIDCard: file,
            TenantIDCardBack: file,
            TenantCompanyRegistryFile: file,
            TenantGuarantors: [{
                id: 'guarantor-relation-1',
                contactId: 'contact-1',
                contactType: 'person',
                firstName: 'Mario',
                lastName: 'Rossi',
            }],
            TenantEmergencyContacts: [{
                id: 'emergency-relation-1',
                contactId: 'contact-2',
                contactType: 'person',
                firstName: 'Luisa',
                lastName: 'Verdi',
                isPrimary: true,
            }],
            TenantDocuments: [{
                id: 'document-1',
                fileName: 'documento.pdf',
                categoryId: 1,
                categoryLabel: 'Altro',
                uploadDate: '2026-07-29',
                fileSize: 120,
                isShared: false,
                fileUrl: '',
                file,
            }],
        }, 1);

        expect(parsed.TenantPhoto).toEqual(file);
        expect(parsed.TenantIDCard).toEqual(file);
        expect(parsed.TenantIDCardBack).toEqual(file);
        expect(parsed.TenantCompanyRegistryFile).toEqual(file);
        expect(parsed.TenantGuarantors[0]).toMatchObject({
            id: 'guarantor-relation-1',
            contactId: 'contact-1',
        });
        expect(parsed.TenantEmergencyContacts[0]).toMatchObject({
            id: 'emergency-relation-1',
            contactId: 'contact-2',
            isPrimary: true,
        });
        expect(parsed.TenantEmergencyContacts[0]?.isPrimary).toBe(true);
        expect(parsed.TenantDocuments[0]?.file).toEqual(file);
    });

    it('preserva relazioni legacy senza inventare contactId', () => {
        const parsed = tenantDraftDefinition.parse({
            TenantGuarantors: [{
                id: 'contact-with-the-same-id',
                contactType: 'person',
                firstName: 'Mario',
                lastName: 'Rossi',
                email: 'mario@example.test',
            }],
            TenantEmergencyContacts: [{
                id: 'emergency-legacy',
                contactType: 'person',
                firstName: 'Mario',
                lastName: 'Rossi',
                email: 'mario@example.test',
                isPrimary: true,
            }],
        }, 1);

        expect(parsed.TenantGuarantors[0]).toMatchObject({
            id: 'contact-with-the-same-id',
            firstName: 'Mario',
        });
        expect(parsed.TenantGuarantors[0]).not.toHaveProperty('contactId');
        expect(parsed.TenantEmergencyContacts[0]).toMatchObject({
            id: 'emergency-legacy',
            isPrimary: true,
        });
        expect(parsed.TenantEmergencyContacts[0]).not.toHaveProperty('contactId');
    });

    it('preserva contactId esplicito nella normalizzazione form definitiva', () => {
        const normalized = normalizeTenantFormData({
            TenantFirstName: 'Ada',
            TenantLastName: 'Lovelace',
            TenantGuarantors: [{
                id: 'guarantor-relation-1',
                contactId: 'contact-1',
                contactType: 'person',
            }],
            TenantEmergencyContacts: [{
                id: 'emergency-relation-1',
                contactId: 'contact-2',
                contactType: 'person',
                isPrimary: true,
            }],
        });

        expect(normalized.TenantGuarantors[0]?.contactId).toBe('contact-1');
        expect(normalized.TenantEmergencyContacts[0]).toMatchObject({
            contactId: 'contact-2',
            isPrimary: true,
        });
    });

    it('rifiuta email non valida e versione incompatibile', () => {
        expect(() => tenantDraftDefinition.parse({
            TenantEmail: 'non-valida',
        }, 1)).toThrow();
        expect(() => tenantDraftDefinition.parse({}, 2))
            .toThrow('Versione bozza inquilino non supportata: 2.');
    });

    it('esclude activeTab dal payload normalizzato', () => {
        const parsed = tenantDraftDefinition.parse({
            TenantFirstName: 'Ada',
            activeTab: 'info3',
        }, 1);

        expect(parsed).not.toHaveProperty('activeTab');
    });

    it('usa il contratto F1 per normalizzare la chiave create', () => {
        expect(normalizeDraftKey(tenantDraftDefinition.formType, {
            mode: 'create',
        })).toEqual({
            formType: 'tenant',
            mode: 'create',
            entityId: null,
        });
    });
});
