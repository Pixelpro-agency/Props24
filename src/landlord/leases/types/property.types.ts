export interface Property {
    PropertyID: number;
    PropertyAddress: string;
    PropertyRent?: number;
    PropertyMaintenance?: number;
    PropertyCurrency: string;
}

export interface PropertyDefaults {
    rent?: number;
    maintenance?: number;
    currency: string;
}

export interface PropertyCountResponse {
    count: number;
}
