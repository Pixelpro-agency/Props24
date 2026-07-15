/**
 * Extended tenant type and mock data for the Tenants list page.
 * Adds list-view fields (status, balance, propertyName, archived) that are
 * not in the base Tenant type used by the form.
 */

export type TenantStatus = 'attivo' | 'candidato' | 'inattivo';

export interface TenantListItem {
    id: string;
    type: 'person' | 'company';
    avatarColor: string;
    /** Display name (computed from firstName/lastName or companyName) */
    displayName: string;
    /** Sub-label: address or company description */
    subtitle: string;
    propertyId: string | null;
    propertyName: string | null;
    mobilePhone: string | null;
    email: string | null;
    balance: number;
    status: TenantStatus;
    archived: boolean;
}

export const TENANT_STATUS_CONFIG: Record<TenantStatus, { label: string; color: string; textColor: string }> = {
    attivo: { label: 'Attivo', color: 'bg-green-100', textColor: 'text-green-700' },
    candidato: { label: 'Candidato', color: 'bg-yellow-100', textColor: 'text-yellow-700' },
    inattivo: { label: 'Inattivo', color: 'bg-gray-100', textColor: 'text-gray-600' },
};

export const mockTenantList: TenantListItem[] = [
    {
        id: 'tenant-001',
        type: 'person',
        avatarColor: '#3b82f6',
        displayName: 'Mario Rossi',
        subtitle: 'Via Roma 10, Milano',
        propertyId: '1',
        propertyName: 'Appartamento Centrale',
        mobilePhone: '+39 333 1234567',
        email: 'mario.rossi@email.com',
        balance: 0,
        status: 'attivo',
        archived: false,
    },
    {
        id: 'tenant-002',
        type: 'company',
        avatarColor: '#ef4444',
        displayName: 'Tech Solutions S.r.l.',
        subtitle: 'Via della Innovazione 25, Roma',
        propertyId: '4',
        propertyName: 'Ufficio Duomo',
        mobilePhone: '+39 02 12345678',
        email: 'info@techsolutions.it',
        balance: -1250,
        status: 'attivo',
        archived: false,
    },
    {
        id: 'tenant-003',
        type: 'person',
        avatarColor: '#22c55e',
        displayName: 'Giulia Verdi',
        subtitle: 'Corso Vittorio Emanuele 100, Torino',
        propertyId: '2',
        propertyName: 'Bilocale Navigli',
        mobilePhone: '+39 345 5678901',
        email: 'giulia.verdi@email.com',
        balance: 450,
        status: 'attivo',
        archived: false,
    },
    {
        id: 'tenant-004',
        type: 'person',
        avatarColor: '#8b5cf6',
        displayName: 'Luca Bianchi',
        subtitle: 'Via Dante 5, Roma',
        propertyId: '8',
        propertyName: 'Stanza Porta Romana',
        mobilePhone: '+39 340 9876543',
        email: 'luca.bianchi@email.com',
        balance: 0,
        status: 'attivo',
        archived: false,
    },
    {
        id: 'tenant-005',
        type: 'company',
        avatarColor: '#f59e0b',
        displayName: 'Studio Legale Neri & Associati',
        subtitle: 'Piazza della Repubblica 8, Firenze',
        propertyId: '4',
        propertyName: 'Ufficio Duomo',
        mobilePhone: '+39 055 9988776',
        email: 'info@studioneri.it',
        balance: -3200,
        status: 'candidato',
        archived: false,
    },
    {
        id: 'tenant-006',
        type: 'person',
        avatarColor: '#14b8a6',
        displayName: 'Famiglia Moretti',
        subtitle: 'Via Manzoni 15, Bergamo',
        propertyId: '16',
        propertyName: 'Casa di Città Bergamo',
        mobilePhone: '+39 347 1122334',
        email: 'moretti.fam@email.com',
        balance: 0,
        status: 'attivo',
        archived: false,
    },
    {
        id: 'tenant-007',
        type: 'person',
        avatarColor: '#ec4899',
        displayName: 'Paolo Galli',
        subtitle: 'Camping Lago Maggiore, Baveno',
        propertyId: '21',
        propertyName: 'Roulotte Campeggio',
        mobilePhone: '+39 335 4455667',
        email: 'paolo.galli@email.com',
        balance: 150,
        status: 'attivo',
        archived: false,
    },
    {
        id: 'tenant-008',
        type: 'person',
        avatarColor: '#6366f1',
        displayName: 'Sara Colombo',
        subtitle: 'Via Garibaldi 22, Torino',
        propertyId: null,
        propertyName: null,
        mobilePhone: '+39 331 7788990',
        email: 'sara.colombo@email.com',
        balance: 0,
        status: 'inattivo',
        archived: true,
    },
];
