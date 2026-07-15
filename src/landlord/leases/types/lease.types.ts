export interface LeaseType {
    LeaseTypeID: string;
    LeaseTypeTitle: string;
    LeaseTypeDuration: number;
    LeaseTypeHasVat: boolean;
    LeaseTypeAutoRenew: boolean;
    LeaseTypeReceiptName: string;
    LeaseTypeFile: string;
    LeaseTypeMultiTenant: boolean;
    LeaseTypeGarants: boolean;
    LeaseTypeUtilisation: number;
    LeaseTypeRevisionIndex: string;
}

export interface PaymentItem {
    LeasePaymentItems_ID?: number;
    LeasePaymentItems_Amount: number;
    LeasePaymentItems_TaxPercent: number;
    LeasePaymentItems_Type: string;
    LeasePaymentItems_Description: string;
}

export interface LeaseFormData {
    // Informazioni Generali -> Proprietà e Tipo
    PropertyID: string;
    LeaseType: string;

    // Informazioni Generali -> Identificativo
    LeaseIdentificativo?: string;
    LeaseNumeroRegistrazione?: string;

    // Tab Inquilini & Garanti (gestiti separatamente, salvati come stringa di ID o array)
    LeaseTenantIds: string;
    LeaseGarantIds?: string;

    // Informazioni Generali -> Durata
    LeaseStartDate: string;
    LeaseEndDate?: string;
    LeaseDurationType?: 'fixed' | '';
    LeaseRinnovoTacito?: boolean;

    // Informazioni Generali -> Pagamento e Finanze
    LeaseBillingPeriod: string; // Mensile, Settimanale
    LeasePaymentTiming?: 'anticipato' | 'arretrato';
    LeasePaymentMethod?: string; // Addebito, bonifico
    LeasePaymentDay?: number; // 1-31

    // Importi Affitto
    LeaseRentHC: number;
    LeaseMaintenance: number;
    LeaseSpeseType?: 'anticipo' | 'forfait';
    LeaseMonthlyAmount: number; // Totale spese incluse

    // Tasse
    LeaseVatType?: string;
    LeaseVatPercent?: number;
    LeaseIrpfType?: string;
    LeaseIrpfPercent?: number;
    LeaseIrpfAmount?: number;

    // Line items for payment
    PaymentItems?: PaymentItem[];

    // Prima Ricevuta Pro-Rata
    LeaseFirstBill?: boolean;
    LeaseFirstBillEndDate?: string;
    LeaseFirstBillAmount?: number;
    LeaseFirstBillCharges?: number;

    // Informazioni Generali -> Deposito Cauzionale e Saldo (Task 9)
    LeaseDeposit?: number; // Aliased as LeaseSecurityDeposit above
    LeaseSecurityDeposit?: number;
    LeaseDepositType?: string; // Trattenuto dal locatore ecc.
    LeaseDepositDocument?: 'nuovo' | 'esistente' | null;
    LeaseDepositDate?: string; // Aliased
    LeaseDepositPaymentDate?: string;

    // Affitti prepagati (Task 9)
    LeasePrepaidRent?: number;
    LeaseSaldoLocatario?: number; // Aliased

    // Informazioni Generali -> Aggiornamento Canone (Task 9)
    LeaseUpdateType?: 'no_review' | 'index' | 'percentage' | 'nessuno' | 'indice' | 'percentuale';
    LeaseUpdateIndex?: string; // Aliased
    LeaseUpdateIndexBase?: string; // ex: "gen 2026 0.8"
    LeaseUpdateAuto?: boolean;
    LeaseUpdatePeriod?: string; // 1 anno
    LeaseUpdateDateType?: 'anniversary' | 'specific_date' | 'anniversario' | 'specifica';
    LeaseUpdateDateSpecific?: string; // Aliased
    LeaseUpdateSpecificDate?: string;

    // Indici (Calcolati automaticamente)
    LeaseIrlIndex?: string;
    LeaseIlcIndex?: string;
    LeaseIccIndex?: string;

    // Draft Flag
    LeaseDraft?: 1 | 0;
}

export interface LeaseResponse {
    success: boolean;
    leaseId?: number;
    message?: string;
}

export interface DraftResponse {
    success: boolean;
    draftId?: number;
    message?: string;
}
