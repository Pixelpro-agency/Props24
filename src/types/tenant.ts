// Tipi e interfacce per la gestione inquilini
import type { StoredLocalFile } from '../components/property-form/schema';

export type TenantType = 'person' | 'company';
export type ContactType = 'person' | 'company';

export type IDType = '' | 'ID' | 'passport' | 'drivinglicense' | 'residencepermit';

export type TenantTitle = '' | 'Miss' | 'Mrs' | 'Mr';

export type EmergencyRelationship = 'parent' | 'spouse' | 'sibling' | 'child' | 'friend' | 'other';

// Categorie documento (dal JSON originale)
export interface DocumentCategory {
    id: number;
    label: string;
}

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
    { id: 47, label: "Attestazione del datore di lavoro" },
    { id: 57, label: "Atto di acquisto" },
    { id: 51, label: "Avviso" },
    { id: 6, label: "Bilancio annuale" },
    { id: 7, label: "Busta paga" },
    { id: 25, label: "Cataloghi" },
    { id: 59, label: "Cauzione" },
    { id: 28, label: "Certificato" },
    { id: 40, label: "Comunicazione Revisione" },
    { id: 29, label: "Contratto" },
    { id: 44, label: "Contratto di assicurazione" },
    { id: 45, label: "Contratto di fornitura" },
    { id: 9, label: "Contratto di lavoro" },
    { id: 5, label: "Contratto di locazione" },
    { id: 24, label: "Contratto di manutenzione" },
    { id: 42, label: "Controllo tecnico" },
    { id: 49, label: "Coordinate bancarie" },
    { id: 13, label: "Diagnostica" },
    { id: 10, label: "Dichiarazione dei redditi" },
    { id: 43, label: "Documenti assemblea condominiale" },
    { id: 19, label: "Documento di identità" },
    { id: 11, label: "Documento pensione" },
    { id: 37, label: "Estratto conto" },
    { id: 8, label: "Fideiussione" },
    { id: 14, label: "Inventario" },
    { id: 53, label: "Manuale d'uso" },
    { id: 2, label: "Polizza assicurativa" },
    { id: 27, label: "Preventivo" },
    { id: 21, label: "Regolamento co-proprietà" },
    { id: 46, label: "Regolamento interno" },
    { id: 26, label: "Ricevuta" },
    { id: 20, label: "Ricevuta canone di locazione" },
    { id: 63, label: "Ricevuta registrazione (Agenzia Entrate)" },
    { id: 61, label: "Ricevuta risoluzione contratto" },
    { id: 65, label: "Saldo canone affitto" },
    { id: 22, label: "Tasse e imposte locali" },
    { id: 39, label: "Titolo di proprietà" },
    { id: 4, label: "Titolo di studio (Attestato)" },
    { id: 1, label: "Altro" },
];

// Garante
export interface Guarantor {
    id: string;
    contactType: ContactType;
    companyName?: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    birthPlace?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    comments?: string;
}

// Contatto di emergenza
export interface EmergencyContact {
    id: string;
    contactType: ContactType;
    companyName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    comments?: string;
    isPrimary?: boolean;
}

// Documento caricato
export interface TenantDocument {
    id: string;
    existingDocumentId?: string;
    fileName: string;
    categoryId: number;
    categoryLabel: string;
    description?: string;
    uploadDate: string;
    fileSize: number;
    isShared: boolean;
    fileUrl?: string;
    file?: StoredLocalFile | null;
}

export interface TenantInvitation {
    status: 'not_sent' | 'pending' | 'accepted';
    email: string;
    sentAt: string | null;
    acceptedAt: string | null;
}

// Inquilino completo per dettaglio e lista
export interface Tenant {
    id: string;
    type: TenantType;
    avatarColor?: string;
    avatarUrl?: string;
    photo?: StoredLocalFile | null;
    // Persona
    title?: TenantTitle;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    birthDate?: string;
    birthPlace?: string;
    nationality?: string;
    fiscalCode?: string;
    vatNumberPersonal?: string;
    profession?: string;
    monthlyIncome?: number;
    idType?: IDType;
    idNumber?: string;
    idExpiry?: string;
    identityDocumentFile?: StoredLocalFile | null;
    // Società
    companyName?: string;
    vatNumber?: string;
    siret?: string;
    capital?: string;
    companyDescription?: string;
    // Contatti
    email?: string;
    emailSecondary?: string;
    mobilePhone?: string;
    phone?: string;
    // Indirizzo residenza/sede
    address1?: string;
    address2?: string;
    city?: string;
    zip?: string;
    state?: string;
    country?: string;
    // Lavoro (persona)
    proEmployer?: string;
    proAddress?: string;
    proCity?: string;
    proZip?: string;
    proState?: string;
    proCountry?: string;
    proPhone?: string;
    // Banca
    bankName?: string;
    bankAddress?: string;
    bankCity?: string;
    bankZip?: string;
    bankCountry?: string;
    bankIBAN?: string;
    bankSwiftBic?: string;
    // Extra
    leaveAddress?: string;
    notes?: string;
    // Relazioni
    guarantors: Guarantor[];
    emergencyContacts: EmergencyContact[];
    documents: TenantDocument[];
    invitation?: TenantInvitation;
}

// Lista paesi (ridotta ai più comuni, Italia prima)
export const COUNTRIES = [
    { value: 'IT', label: 'Italia' },
    { value: 'DE', label: 'Germania' },
    { value: 'FR', label: 'Francia' },
    { value: 'ES', label: 'Spagna' },
    { value: 'GB', label: 'Regno Unito' },
    { value: 'US', label: 'Stati Uniti' },
    { value: 'CH', label: 'Svizzera' },
    { value: 'AT', label: 'Austria' },
    { value: 'BE', label: 'Belgio' },
    { value: 'NL', label: 'Paesi Bassi' },
    { value: 'PT', label: 'Portogallo' },
    { value: 'PL', label: 'Polonia' },
    { value: 'RO', label: 'Romania' },
    { value: 'GR', label: 'Grecia' },
    { value: 'HR', label: 'Croazia' },
    { value: 'SI', label: 'Slovenia' },
    { value: 'AL', label: 'Albania' },
    { value: 'RS', label: 'Serbia' },
    { value: 'BA', label: 'Bosnia ed Erzegovina' },
    { value: 'ME', label: 'Montenegro' },
    { value: 'MK', label: 'Macedonia del Nord' },
    { value: 'BG', label: 'Bulgaria' },
    { value: 'CZ', label: 'Repubblica Ceca' },
    { value: 'SK', label: 'Slovacchia' },
    { value: 'HU', label: 'Ungheria' },
    { value: 'SE', label: 'Svezia' },
    { value: 'NO', label: 'Norvegia' },
    { value: 'DK', label: 'Danimarca' },
    { value: 'FI', label: 'Finlandia' },
    { value: 'IE', label: 'Irlanda' },
    { value: 'LU', label: 'Lussemburgo' },
    { value: 'MT', label: 'Malta' },
    { value: 'CY', label: 'Cipro' },
    { value: 'EE', label: 'Estonia' },
    { value: 'LV', label: 'Lettonia' },
    { value: 'LT', label: 'Lituania' },
    { value: 'BR', label: 'Brasile' },
    { value: 'AR', label: 'Argentina' },
    { value: 'CN', label: 'Cina' },
    { value: 'JP', label: 'Giappone' },
];
