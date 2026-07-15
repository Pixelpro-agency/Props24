/**
 * Types for the Leases listing page.
 * Defines the shape of a lease row, filter state, column config, and export columns.
 */

// ── Status ────────────────────────────────────────────────────────────────────

export type LeaseStatus = 'attiva' | 'inattivo';

export const LEASE_STATUS_CONFIG: Record<LeaseStatus, { label: string; color: string; textColor: string }> = {
    attiva: { label: 'Attiva', color: 'bg-green-100', textColor: 'text-green-700' },
    inattivo: { label: 'Inattivo', color: 'bg-gray-100', textColor: 'text-gray-500' },
};

// ── Lease listing row ─────────────────────────────────────────────────────────

export interface LeaseListItem {
    id: string;
    /** References */
    propertyId: string;
    propertyTitle: string;
    propertyAddress: string;
    tenantId: string | null;
    tenantName: string | null;
    tenantEmail: string | null;
    /** Lease type (value from leaseTypeOptions + display label) */
    leaseTypeValue: string;
    leaseTypeLabel: string;
    /** Financial */
    monthlyAmount: number;       // canone spese incluse
    rentHC: number;              // canone spese escluse
    maintenance: number;         // spese accessorie
    securityDeposit: number;     // deposito cauzionale
    vatAmount: number;           // IVA
    otherExpenses: number;       // altre spese
    balance: number;             // saldo
    /** Dates */
    startDate: string;           // DD/MM/YYYY
    endDate: string | null;      // DD/MM/YYYY or null if open-ended
    /** State */
    status: LeaseStatus;
    archived: boolean;
    /** Document Templates */
    templateLinks?: {
        pdf?: string;
        word?: string;
        odt?: string;
    };
    /** Identifiers */
    identificativo: string | null;
    numeroRegistrazione: string | null;
    /** Notes */
    notes: string;
}

// ── Filters ───────────────────────────────────────────────────────────────────

export type ExpiresInFilter = '' | '30' | '60' | '90' | '91';

export interface LeaseFilters {
    dateFrom: string;             // DD/MM/YYYY or ''
    dateTo: string;               // DD/MM/YYYY or ''
    propertyIds: string[];        // max 2
    leaseType: string;            // value from leaseTypeOptions or ''
    expiresIn: ExpiresInFilter;   // scadenza filter
    status: '' | '1' | '0';      // 1 = Attive, 0 = Inattivo
    query: string;                // free-text search
}

export const EMPTY_LEASE_FILTERS: LeaseFilters = {
    dateFrom: '',
    dateTo: '',
    propertyIds: [],
    leaseType: '',
    expiresIn: '',
    status: '',
    query: '',
};

// ── Column visibility ─────────────────────────────────────────────────────────

export type LeaseColumnId =
    | 'LeaseType'
    | 'LeaseTenants'
    | 'LeaseMonthlyAmount'
    | 'LeaseMaintenance'
    | 'LeaseSecurityDeposit'
    | 'LeaseStartDate'
    | 'LeaseBalance'
    | 'LeaseActive';

export interface LeaseColumnConfig {
    id: LeaseColumnId;
    label: string;
    defaultVisible: boolean;
}

export const LEASE_COLUMNS: LeaseColumnConfig[] = [
    { id: 'LeaseType', label: 'Tipo', defaultVisible: true },
    { id: 'LeaseTenants', label: 'Inquilino', defaultVisible: true },
    { id: 'LeaseMonthlyAmount', label: 'Affitto', defaultVisible: true },
    { id: 'LeaseMaintenance', label: 'Spese', defaultVisible: true },
    { id: 'LeaseSecurityDeposit', label: 'Deposito cauzionale', defaultVisible: true },
    { id: 'LeaseStartDate', label: 'Durata', defaultVisible: true },
    { id: 'LeaseBalance', label: 'Saldo', defaultVisible: false },
    { id: 'LeaseActive', label: 'Stato', defaultVisible: true },
];

// ── Export columns ────────────────────────────────────────────────────────────

export interface LeaseExportColumn {
    id: string;
    label: string;
    required: boolean;
}

export const LEASE_EXPORT_COLUMNS: LeaseExportColumn[] = [
    // Required (always selected, disabled)
    { id: '13', label: 'Identificativo', required: true },
    { id: '17', label: 'Tipo', required: true },
    { id: '109', label: 'Fine della locazione', required: true },
    { id: '107', label: 'Canone spese incluse', required: true },
    { id: '113', label: 'Spese', required: true },
    { id: '117', label: 'Deposito cauzionale', required: true },
    { id: '15', label: 'Proprietà', required: true },
    { id: '103', label: 'Inizio della locazione', required: true },
    { id: '105', label: 'Locatari (Persona / Società)', required: true },
    { id: '111', label: 'Canone spese escluse', required: true },
    { id: '115', label: 'IVA', required: true },
    { id: '119', label: 'Altre spese', required: true },
    // Optional
    { id: '121', label: 'Note', required: false },
    { id: '123', label: 'Altre spese (dettaglio)', required: false },
];
