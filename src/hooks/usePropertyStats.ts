import { useMemo } from 'react';
import type { Property, PropertyStats } from '../types/property';

/**
 * Formato valuta italiano: 1.234,56 €
 */
export function formatCurrency(value: number): string {
    return value.toLocaleString('it-IT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }) + ' €';
}

/**
 * Calcola statistiche aggregate per le proprietà filtrate.
 * - rentedCount: quante hanno tenant !== null
 * - rentalValue: somma dei rent di tutte le proprietà con affitto
 * - assetValue: somma degli assetValue di tutte le proprietà
 */
export function usePropertyStats(data: Property[]): PropertyStats {
    return useMemo(() => {
        let rentedCount = 0;
        let rentalValue = 0;
        let assetValue = 0;

        for (const p of data) {
            if (p.tenant !== null) {
                rentedCount++;
            }
            if (p.rent !== null) {
                rentalValue += p.rent;
            }
            if (p.assetValue !== null) {
                assetValue += p.assetValue;
            }
        }

        return { rentedCount, rentalValue, assetValue };
    }, [data]);
}
