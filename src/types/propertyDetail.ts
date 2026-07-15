// === PROPERTY DETAIL TYPES ===

export interface PropertyAddress {
    street: string;
    postalCode: string;
    city: string;
    country: string;
}

export interface PropertySpecs {
    surface: number;       // m²
    rooms: number;
    bedrooms: number;
    bathrooms: number;
    floor: number;
}

export interface PropertyRent {
    total: number;         // canone spese incluse
    base: number;          // canone spese escluse
    utilities: number;     // spese accessorie
}

export interface PropertyFeatures {
    furnished: boolean;
    smokersAllowed: boolean;
    petsAllowed: boolean;
    equipment: string[];
}

export interface PropertyMedia {
    photos: string[];
    hasStreetView: boolean;
    coordinates?: { lat: number; lng: number };
}

export interface PropertyVisibility {
    isPublic: boolean;
    addressPublic: boolean;
    phonePublic: boolean;
}

export interface PropertyUrls {
    publicProfile: string;
    icalExport: string;
    icalImport?: string;
    edit: string;
    delete: string;
    finances?: string;
    balanceSheet?: string;
}

export interface Tenant {
    id: string;
    name: string;
    link?: string;
}

export type LeaseStatus = 'active' | 'pending' | 'ended';

export interface Lease {
    id: string;
    name?: string;
    type: string;
    startDate: string;      // ISO format
    endDate: string;         // ISO format
    status: LeaseStatus;
    rentAmount: number;
    utilitiesAmount: number;
    tenant: Tenant;
    links?: {
        edit: string;
        view: string;
    };
}

export interface MonthlyFinanceData {
    month: string;
    income: number;
    expenses: number;
}

export interface FinancialData {
    year: number;
    availableYears: number[];
    grossIncome: number;
    expenses: number;
    netResult: number;
    occupancyRate: number;
    occupancyDays: number;
    profitabilityNet: number;
    purchasePriceKnown: boolean;
    chartData: MonthlyFinanceData[];
}

export interface Note {
    id: string;
    text: string;
    createdAt: string;       // ISO format
}

export type ActivityType = 'payment' | 'lease' | 'maintenance' | 'note' | 'general';

export interface Activity {
    id: string;
    type: ActivityType;
    description: string;
    date: string;            // ISO format
}

export interface PropertyDetail {
    id: string;
    title: string;
    type: string;
    address: PropertyAddress;
    specs: PropertySpecs;
    rent: PropertyRent;
    features: PropertyFeatures;
    media: PropertyMedia;
    visibility: PropertyVisibility;
    urls: PropertyUrls;
    tenant?: Tenant;
    leases: Lease[];
    finances: FinancialData;
    notes: Note[];
    activities: Activity[];
}
