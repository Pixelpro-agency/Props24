export interface Tenant {
    TenantID: number;
    TenantType: 'person' | 'company';
    TenantFirstName?: string;
    TenantLastName?: string;
    TenantCompanyName?: string;
    TenantEmail: string;
    TenantMobilePhone: string;
}

export interface TenantFormData {
    AddTenantID?: string;
    TenantType: 'person' | 'company';
    TenantFirstName?: string;
    TenantLastName?: string;
    TenantCompanyName?: string;
    TenantEmail: string;
    TenantEmailIgnoreUnique?: boolean;
    TenantMobilePhone: string;
}

export interface Garant {
    ContactID: number;
    ContactType: 'person' | 'company';
    ContactFirstName?: string;
    ContactLastName?: string;
    ContactCompanyName?: string;
    ContactEmail: string;
    ContactMobilePhone: string;
    ContactProfessionID: number;
    ContactAddress?: string;
    ContactCity?: string;
    ContactZip?: string;
    ContactCountry?: string;
}

export interface GarantFormData {
    TargetGarantID?: string; // used for updating or if selecting existing
    ContactType: 'person' | 'company';
    ContactFirstName?: string;
    ContactLastName?: string;
    ContactBirthDate?: string;
    ContactBirthPlace?: string;
    ContactCompanyName?: string;
    ContactCompanyVat?: string;
    ContactEmail: string;
    ContactMobilePhone: string;
    ContactAddress?: string;
    ContactCity?: string;
    ContactZip?: string;
    ContactCountry?: string;
    ContactNotes?: string;
}

export interface VerificationData {
    method: 'sms' | 'whatsapp';
    phone: string;
}

export interface SignatureResponse {
    success: boolean;
    message?: string;
}
