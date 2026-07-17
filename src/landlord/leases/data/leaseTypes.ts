export interface LeaseTypeOption {
    id: string;
    label: string;
    durationMonths: number | null;
    multiTenant: boolean;
    autoRenewDefault: boolean;
    hasVat: boolean;
}

export const LEASE_TYPE_ALIASES: Record<string, string> = {
    '1': 'canone_libero_4+4',
    '2': 'canone_libero_4+4_con_cedolare_secca',
    '3': 'uso_commerciale_6+6',
    '4': 'canone_concordato_3+2_con_cedolare_secca',
    '5': 'studenti',
    '7': 'turistico',
    '8': 'transitorio',
    '10': 'box_o_garage',
    '11': 'uso_commerciale_6+6',
    '26': 'uso_commerciale_transitorio',
    '103': 'uso_commerciale_9+9',
    '105': 'uso_commerciale_6+2',
    abitativo: 'canone_libero_4+4',
    residential: 'canone_libero_4+4',
    commerciale: 'uso_commerciale_6+6',
    commercial: 'uso_commerciale_6+6',
};

export const LEASE_TYPES: LeaseTypeOption[] = [
    { id: 'canone_libero_4+4', label: 'Canone libero 4+4', durationMonths: 48, multiTenant: false, autoRenewDefault: true, hasVat: false },
    { id: 'canone_concordato_3+2', label: 'Canone concordato 3+2', durationMonths: 36, multiTenant: false, autoRenewDefault: true, hasVat: false },
    { id: 'canone_concordato_3+2_con_cedolare_secca', label: 'Canone concordato 3+2 con cedolare secca', durationMonths: 36, multiTenant: false, autoRenewDefault: true, hasVat: false },
    { id: 'canone_libero_4+4_con_cedolare_secca', label: 'Canone libero 4+4 con cedolare secca', durationMonths: 48, multiTenant: false, autoRenewDefault: true, hasVat: false },
    { id: 'uso_commerciale_6+6', label: 'Uso commerciale 6+6', durationMonths: 72, multiTenant: false, autoRenewDefault: true, hasVat: true },
    { id: 'uso_commerciale_9+9', label: 'Uso commerciale 9+9', durationMonths: 108, multiTenant: false, autoRenewDefault: true, hasVat: true },
    { id: 'uso_commerciale_6+2', label: 'Uso commerciale 6+2', durationMonths: 72, multiTenant: false, autoRenewDefault: true, hasVat: true },
    { id: 'uso_commerciale_transitorio', label: 'Uso commerciale transitorio', durationMonths: null, multiTenant: false, autoRenewDefault: false, hasVat: true },
    { id: 'studenti', label: 'Studenti', durationMonths: null, multiTenant: true, autoRenewDefault: false, hasVat: false },
    { id: 'turistico', label: 'Turistico', durationMonths: null, multiTenant: true, autoRenewDefault: false, hasVat: false },
    { id: 'transitorio', label: 'Transitorio', durationMonths: null, multiTenant: false, autoRenewDefault: false, hasVat: false },
    { id: 'box_o_garage', label: 'Box o garage', durationMonths: null, multiTenant: false, autoRenewDefault: false, hasVat: false },
    { id: 'deposito_temporaneo_vetrine', label: 'Deposito temporaneo / vetrine', durationMonths: null, multiTenant: false, autoRenewDefault: false, hasVat: true },
    { id: 'canone_concordato_6+2_con_cedolare_secca', label: 'Canone concordato 6+2 con cedolare secca', durationMonths: 72, multiTenant: false, autoRenewDefault: true, hasVat: false },
    { id: 'altro', label: 'Altro', durationMonths: null, multiTenant: true, autoRenewDefault: false, hasVat: false },
];

export function normalizeLeaseTypeId(id: unknown): string {
    const value = String(id ?? '').trim();
    if (!value) return '';
    return LEASE_TYPE_ALIASES[value] || value;
}

export function getLeaseTypeById(id: unknown): LeaseTypeOption | null {
    const normalized = normalizeLeaseTypeId(id);
    return LEASE_TYPES.find((item) => item.id === normalized) || null;
}

export function leaseTypeLabel(id: unknown): string {
    return getLeaseTypeById(id)?.label || 'Locazione';
}
