/**
 * Static data for the leases section.
 * All 37 lease types + filter dropdown options from the Rentila spec (json.txt).
 */

// ── 37 Lease type options ─────────────────────────────────────────────────────

export interface LeaseTypeOption {
    value: string;
    label: string;
}

export const leaseTypeOptions: LeaseTypeOption[] = [
    { value: '1', label: 'Canone libero (4+4)' },
    { value: '2', label: 'Canone libero (4+4) con cedolare secca' },
    { value: '3', label: 'Canone concordato (3+2)' },
    { value: '4', label: 'Canone concordato (3+2) con cedolare secca' },
    { value: '35', label: 'Canone concordato (4+2) con cedolare secca' },
    { value: '113', label: 'Canone concordato (4+2)' },
    { value: '37', label: 'Canone concordato (5+2) con cedolare secca' },
    { value: '111', label: 'Canone Concordato (5+2)' },
    { value: '33', label: 'Canone Concordato (6+2) con cedolare secca' },
    { value: '109', label: 'Canone Concordato (6+2)' },
    { value: '117', label: 'Canone Concordato (7+2)' },
    { value: '7', label: 'Turistico' },
    { value: '17', label: 'Turistico con cedolare' },
    { value: '13', label: 'Parziale' },
    { value: '14', label: 'Parziale transitoria' },
    { value: '8', label: 'Transitorio' },
    { value: '9', label: 'Transitorio con cedolare secca' },
    { value: '5', label: 'Studenti' },
    { value: '6', label: 'Studenti con cedolare secca' },
    { value: '10', label: 'Box o garage' },
    { value: '11', label: 'Uso commerciale 6+6' },
    { value: '103', label: 'Uso commerciale 9+9' },
    { value: '27', label: 'Uso commerciale (parziale)' },
    { value: '26', label: 'Uso commerciale transitorio' },
    { value: '105', label: 'Uso commerciale 6+2' },
    { value: '115', label: 'Terreno' },
    { value: '15', label: 'Comodato / Usufrutto' },
    { value: '29', label: 'Usufrutto' },
    { value: '18', label: 'Rent2buy' },
    { value: '19', label: 'Leasing' },
    { value: '20', label: 'Sublocazione' },
    { value: '22', label: 'SPRAR' },
    { value: '119', label: 'Uso foresteria' },
    { value: '23', label: 'CAS' },
    { value: '21', label: 'Housing sociale' },
    { value: '31', label: 'Affitto Ramo d\'Azienda' },
    { value: '12', label: 'Altro' },
];

// ── Expiry filter options ─────────────────────────────────────────────────────

export const expiresInOptions = [
    { value: '', label: 'Fine della locazione' },
    { value: '30', label: '0-30 giorni' },
    { value: '60', label: '30-60 giorni' },
    { value: '90', label: '60-90 giorni' },
    { value: '91', label: '90+ giorni' },
] as const;

// ── Status filter options ─────────────────────────────────────────────────────

export const leaseStatusFilterOptions = [
    { value: '', label: 'Stato' },
    { value: '1', label: 'Attive' },
    { value: '0', label: 'Inattivo' },
] as const;

// ── Helper: get label from value ──────────────────────────────────────────────

export function getLeaseTypeLabel(value: string): string {
    return leaseTypeOptions.find((o) => o.value === value)?.label ?? 'Sconosciuto';
}
