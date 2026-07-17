import type { ContactRecord, DocumentRecord, LeaseRecord, MessageRecord, PaymentRecord, PropertyRecord, TenantRecord } from '../db/database.types';

export interface LeaseDetail {
    lease: LeaseRecord;
    property: PropertyRecord | null;
    tenants: TenantRecord[];
    guarantors: ContactRecord[];
    payments: PaymentRecord[];
    documents: DocumentRecord[];
    communications: MessageRecord[];
    balance: number;
    depositAmount: number;
    prepaidAppliedAmount: number;
    temporalStatus: 'current' | 'future' | 'historical' | 'inactive' | 'archived';
}
