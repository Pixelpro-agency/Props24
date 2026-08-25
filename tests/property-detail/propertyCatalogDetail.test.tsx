// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PropertyInfoCard } from '../../src/components/property-detail/PropertyInfoCard';
import { PropertyDetails } from '../../src/components/property-detail/PropertyDetails';
import { mockPropertyDetail } from '../../src/data/mockPropertyDetail';

afterEach(cleanup);
describe('cataloghi nel dettaglio Unit', () => {
    it('mostra label canoniche invece degli ID', () => {
        const property = { ...mockPropertyDetail, type: 'ufficio', catalogs: { type: { value: 'ufficio', label: 'Ufficio' }, rentType: { value: 'studenti_con_cedolare_secca', label: 'Studenti con cedolare secca' }, billingPeriod: { value: 'quarterly', label: 'Trimestrale' }, energyClass: { value: 'A2', label: 'A2' } } };
        render(<><PropertyInfoCard property={property} /><PropertyDetails property={property} /></>);
        for (const text of ['Ufficio', 'Studenti con cedolare secca', 'Trimestrale', 'A2']) expect(screen.getByText(text)).toBeTruthy();
        expect(screen.queryByText('studenti_con_cedolare_secca')).toBeNull(); expect(screen.queryByText('quarterly')).toBeNull();
    });
    it('mostra fallback per campi vuoti', () => {
        render(<PropertyDetails property={{ ...mockPropertyDetail, catalogs: { ...mockPropertyDetail.catalogs, rentType: { value: '', label: '' }, billingPeriod: { value: '', label: '' }, energyClass: { value: '', label: '' } } }} />);
        expect(screen.getAllByText('Non specificato')).toHaveLength(3);
    });
});
