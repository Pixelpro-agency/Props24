import type { LeaseTypeOption } from '../data/leaseTypes';
import type { LeaseFormData, paymentItemSchema } from '../schema/leaseFormSchema';
import type { z } from 'zod';

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

export type PaymentItem = z.infer<typeof paymentItemSchema>;
export type { LeaseFormData };
export type CanonicalLeaseType = LeaseTypeOption;

export interface LeaseResponse {
    success: boolean;
    leaseId?: string | number;
    message?: string;
}

export interface DraftResponse {
    success: boolean;
    draftId?: string | number;
    message?: string;
}
