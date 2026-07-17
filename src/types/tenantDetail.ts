import type { Tenant } from './tenant';

export interface TenantDetailAddress {
    street?: string;
    city?: string;
    zip?: string;
    country?: string;
    displayName?: string; // Es. "Largo Luca della Robbia 25 - 2° Piano - Torino"
}

export interface TenantLease {
    id: string; // originariamente number nel json, ma usiamo string come nel resto dell'app
    propertyName: string;
    address: string;
    contractType: string;
    status: 'Attiva' | 'Inattiva' | 'Terminata';
    dateRange: {
        start: string;
        end: string;
    };
    rent: {
        amount: number;
        currency: string;
        frequency: string;
    };
    expenses?: {
        amount: number;
        currency: string;
        type: string;
    };
}

export interface TenantMessage {
    id: string;
    subject: string;
    date: string;
    preview: string;
}

export interface TenantFinance {
    income: {
        amount: number;
        type: 'income';
    };
    balance: {
        amount: number;
        type: 'debt' | 'credit' | 'neutral';
        status: 'negative' | 'positive' | 'neutral';
    };
}

export interface TenantTab {
    id: string;
    label: string;
    active?: boolean;
    badge?: number;
}

// Interfaccia estesa per la pagina di dettaglio
export interface TenantDetail extends Omit<Tenant, 'address1' | 'address2' | 'city' | 'zip' | 'state' | 'country' | 'proAddress' | 'proCity' | 'proZip' | 'proState' | 'proCountry'> {
    // Override parziale di alcuni campi che vogliamo raggruppare o chiamare in modo diverso
    addresses: {
        rentedProperty?: TenantDetailAddress | null;
        tenantAddress?: TenantDetailAddress;
    };
    employment?: {
        profession?: string;
        workAddress?: TenantDetailAddress;
    };
    loginStatus: {
        status: 'active' | 'pending_invitation' | 'inactive';
    };
    inviteLink?: {
        url: string;
        description: string;
    };

    // Dati tab
    finances?: TenantFinance;
    currentLease?: TenantLease | null;
    futureLeases?: TenantLease[];
    historicalLeases?: TenantLease[];
    archivedLeases?: TenantLease[];
    leases: TenantLease[];
    messages: TenantMessage[];
    activityHistory: any[]; // Potremmo definirlo meglio in futuro
}
