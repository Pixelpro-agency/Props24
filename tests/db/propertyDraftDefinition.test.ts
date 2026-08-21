import { describe, expect, it } from 'vitest';

import { normalizeDraftKey } from '../../src/db/draftRepository';
import {
    PROPERTY_DRAFT_SCHEMA_VERSION,
    propertyDraftDefinition,
} from '../../src/components/property-form/propertyDraftDefinition';

const file = {
    id: 'file-1',
    name: 'allegato.pdf',
    type: 'application/pdf',
    size: 120,
    lastModified: 1,
    dataUrl: 'data:application/pdf;base64,AA==',
};

describe('property draft definition', () => {
    it('dichiara form e versione canonici', () => {
        expect(propertyDraftDefinition.formType).toBe('property');
        expect(propertyDraftDefinition.schemaVersion).toBe(2);
        expect(PROPERTY_DRAFT_SCHEMA_VERSION).toBe(2);
        expect(normalizeDraftKey('property', { mode: 'create' })).toEqual({
            formType: 'property',
            mode: 'create',
            entityId: null,
        });
    });

    it('accetta una bozza completamente vuota e applica i default', () => {
        const parsed = propertyDraftDefinition.parse({}, 1);

        expect(parsed).toMatchObject({
            PropertyTitle: '',
            PropertyAddress: '',
            PropertyCity: '',
            PropertyPostalCode: '',
            PropertyCountry: 'IT',
            PropertyKeys: [],
            PropertyContracts: [],
            PropertyPhotos: [],
            PropertyContacts: [],
            PropertyDocuments: [],
            PropertyCadastreDocument: null,
        });
    });

    it('accetta payload parziale senza validazione submit', () => {
        expect(propertyDraftDefinition.parse({
            PropertyComments: 'Bozza incompleta',
        }, 1).PropertyComments).toBe('Bozza incompleta');
    });

    it('conserva allegati e array annidati senza condividere riferimenti', () => {
        const input = {
            activeTab: 'info4',
            extra: 'escluso',
            PropertyCadastreDocument: file,
            PropertyKeys: [{
                id: 'key-1',
                description: 'Portone',
                number: '12',
                quantity: 1,
                holder: 'QA',
                comments: '',
            }],
            PropertyContracts: [{
                id: 'contract-1',
                type: 'energia',
                description: 'Contratto',
                releaseDate: '2026-01-01',
                expiryDate: '',
                comments: '',
                file,
            }],
            PropertyPhotos: [file],
            PropertyContacts: [{
                id: 'contact-1',
                firstName: 'Ada',
                lastName: 'Rossi',
                profession: '',
                email: 'ada@example.test',
                phone: '',
                comments: '',
            }],
            PropertyDocuments: [{
                id: 'document-1',
                type: 'altro',
                description: 'Documento',
                releaseDate: '',
                comments: '',
                shared: false,
                file,
            }],
        };
        const inputBefore = structuredClone(input);
        const parsed = propertyDraftDefinition.parse(input, 1);

        expect(parsed.PropertyCadastreDocument).toEqual(file);
        expect(parsed.PropertyContracts[0]?.file).toEqual(file);
        expect(parsed.PropertyPhotos).toEqual([file]);
        expect(parsed.PropertyKeys[0]?.id).toBe('key-1');
        expect(parsed.PropertyContacts[0]?.id).toBe('contact-1');
        expect(parsed.PropertyDocuments[0]?.id).toBe('document-1');
        expect(parsed).not.toHaveProperty('activeTab');
        expect(parsed).not.toHaveProperty('extra');
        expect(parsed.PropertyKeys).not.toBe(input.PropertyKeys);
        expect(parsed.PropertyKeys[0]).not.toBe(input.PropertyKeys[0]);
        expect(parsed.PropertyPhotos).not.toBe(input.PropertyPhotos);
        expect(parsed.PropertyPhotos[0]).not.toBe(input.PropertyPhotos[0]);
        expect(parsed.PropertyContracts[0]?.file)
            .not.toBe(input.PropertyContracts[0]?.file);
        expect(input).toEqual(inputBefore);
        expect(input).toHaveProperty('activeTab');
    });

    it('rifiuta versione, allegato e array annidato invalidi', () => {
        expect(() => propertyDraftDefinition.parse({}, 3))
            .toThrow('Versione bozza unità non supportata: 3.');
        expect(() => propertyDraftDefinition.parse({
            PropertyPhotos: [{ ...file, size: 'invalid' }],
        }, 1)).toThrow();
        expect(() => propertyDraftDefinition.parse({
            PropertyKeys: [{ id: 12 }],
        }, 1)).toThrow();
    });
});
