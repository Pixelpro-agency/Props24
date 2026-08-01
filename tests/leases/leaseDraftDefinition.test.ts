import { describe, expect, it } from 'vitest';

import {
    LEASE_DRAFT_SCHEMA_VERSION,
    LEASE_FORM_TABS,
    leaseDraftDefinition,
    normalizeLeaseFormTab,
} from '../../src/landlord/leases/drafts/leaseDraftDefinition';

describe('leaseDraftDefinition', () => {
    it('espone il contratto lease v1 e le schede canoniche', () => {
        expect(leaseDraftDefinition.formType).toBe('lease');
        expect(LEASE_DRAFT_SCHEMA_VERSION).toBe(1);
        expect(LEASE_FORM_TABS).toEqual([
            'general', 'tenants', 'guarantors', 'receipts', 'settings',
            'insurance', 'documents', 'contract', 'signature',
        ]);
    });

    it('normalizza un payload canonico incompleto senza validare il submit', () => {
        const parsed = leaseDraftDefinition.parse({
            formData: { LeaseIdentificativo: 'Bozza' },
            activeTab: 'tenants',
        }, 1);
        expect(parsed.formData.LeaseIdentificativo).toBe('Bozza');
        expect(parsed.formData.PropertyID).toBe('');
        expect(parsed.activeTab).toBe('tenants');
    });

    it('accetta il payload legacy ed esclude updatedAt', () => {
        const parsed = leaseDraftDefinition.parse({
            formData: {}, activeTab: 'signature', updatedAt: '2026-01-01',
        }, 1);
        expect(parsed.activeTab).toBe('signature');
        expect(parsed).not.toHaveProperty('updatedAt');
    });

    it('riconduce una scheda sconosciuta a general', () => {
        expect(normalizeLeaseFormTab('unknown')).toBe('general');
        expect(leaseDraftDefinition.parse({ formData: {}, activeTab: 'x' }, 1).activeTab).toBe('general');
    });

    it('normalizza numeri e preserva array e riferimenti esterni', () => {
        const input = {
            formData: {
                PropertyID: 'property-missing',
                LeaseTenantIds: ['tenant-missing'],
                LeaseGarantIds: ['guarantor-missing'],
                LeaseRentHC: '1250',
                PaymentItems: [{ LeasePaymentItems_Title: 'Voce', LeasePaymentItems_Amount: 10 }],
                LeaseInsuranceContracts: [{
                    LeaseInsuranceType: 'locativa',
                    LeaseInsuranceDescription: 'Polizza',
                    LeaseInsuranceStartDate: '2026-01-01',
                    LeaseInsuranceEndDate: '2027-01-01',
                    LeaseInsuranceDocumentId: 'document-missing',
                }],
            },
            activeTab: 'insurance',
        };
        const parsed = leaseDraftDefinition.parse(input, 1);
        expect(parsed.formData.LeaseRentHC).toBe(1250);
        expect(parsed.formData.PropertyID).toBe('property-missing');
        expect(parsed.formData.LeaseTenantIds).toEqual(['tenant-missing']);
        expect(parsed.formData.LeaseGarantIds).toEqual(['guarantor-missing']);
        expect(parsed.formData.PaymentItems).toHaveLength(1);
        expect(parsed.formData.LeaseInsuranceContracts[0].LeaseInsuranceDocumentId).toBe('document-missing');
    });

    it('non muta input e restituisce grafi annidati indipendenti', () => {
        const input = { formData: {
            LeaseTenantIds: ['t1'], LeaseGarantIds: ['g1'],
            PaymentItems: [{ LeasePaymentItems_Description: 'Canone', LeasePaymentItems_Amount: 100 }],
            LeaseInsuranceContracts: [{
                LeaseInsuranceType: 'locativa', LeaseInsuranceDescription: 'Originale',
                LeaseInsuranceStartDate: '', LeaseInsuranceEndDate: '', LeaseInsuranceDocumentId: 'doc-1',
            }],
        }, activeTab: 'general' };
        const before = structuredClone(input);
        const parsed = leaseDraftDefinition.parse(input, 1);
        const parsedAgain = leaseDraftDefinition.parse(input, 1);
        parsed.formData.LeaseTenantIds.push('t2');
        parsed.formData.LeaseGarantIds.push('g2');
        parsed.formData.PaymentItems[0].LeasePaymentItems_Description = 'Mutato';
        parsed.formData.LeaseInsuranceContracts[0].LeaseInsuranceDescription = 'Mutata';
        expect(input).toEqual(before);
        expect(input.formData.LeaseTenantIds).toEqual(['t1']);
        expect(parsedAgain.formData.LeaseTenantIds).toEqual(['t1']);
        expect(parsedAgain.formData.LeaseGarantIds).toEqual(['g1']);
        expect(parsedAgain.formData.PaymentItems[0].LeasePaymentItems_Description).toBe('Canone');
        expect(parsedAgain.formData.LeaseInsuranceContracts[0].LeaseInsuranceDescription).toBe('Originale');
        expect(parsedAgain.formData.PaymentItems).not.toBe(parsed.formData.PaymentItems);
        expect(parsedAgain.formData.PaymentItems[0]).not.toBe(parsed.formData.PaymentItems[0]);
        expect(parsedAgain.formData.LeaseInsuranceContracts[0]).not.toBe(parsed.formData.LeaseInsuranceContracts[0]);
    });

    it('rifiuta versione incompatibile e payload nulli o incompatibili', () => {
        expect(() => leaseDraftDefinition.parse({ formData: {} }, 2)).toThrow('Versione');
        expect(() => leaseDraftDefinition.parse(null, 1)).toThrow('Payload');
        expect(() => leaseDraftDefinition.parse({}, 1)).toThrow('Payload');
        expect(() => leaseDraftDefinition.parse({ formData: null }, 1)).toThrow('Payload');
    });
});
