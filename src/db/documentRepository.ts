import { generateId, getJsonDb, saveJsonDb } from './jsonDb';
import type { DocumentRecord } from './database.types';
import type { StoredLocalFile } from '../components/property-form/schema';
import { LeaseDocumentDuplicateError, LeaseDocumentNotFoundError, LeaseDocumentQuotaError, LeaseNotFoundError } from './databaseErrors';
import { downloadDataUrl } from '../utils/html';

const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'text/html', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
const SINGLE_LIMIT = 2 * 1024 * 1024;
const TOTAL_LIMIT = 3 * 1024 * 1024;

export interface LeaseDocumentInput {
    categoryId: number;
    categoryLabel: string;
    title: string;
    description: string;
    isShared: boolean;
    file: StoredLocalFile;
}

function now() { return new Date().toISOString(); }

function addActivity(db: ReturnType<typeof getJsonDb>, leaseId: string, description: string) {
    return db.leases.map((lease) => lease.id === leaseId ? {
        ...lease,
        activity: [...lease.activity, { id: generateId('lease-activity'), type: 'document' as const, description, createdAt: now() }],
        updatedAt: now(),
    } : lease);
}

function physicalLeaseSize(db: ReturnType<typeof getJsonDb>, leaseId: string): number {
    return db.documents
        .filter((doc) => doc.ownerType === 'lease' && doc.ownerId === leaseId && !doc.sourceDocumentId && doc.file)
        .reduce((sum, doc) => sum + (doc.file?.size || 0), 0);
}

function validateFile(db: ReturnType<typeof getJsonDb>, leaseId: string, file: StoredLocalFile) {
    if (!file || !file.dataUrl) throw new LeaseDocumentQuotaError('Seleziona un file.');
    if (!ALLOWED_TYPES.has(file.type)) throw new LeaseDocumentQuotaError('Formato documento non supportato.');
    if (file.size > SINGLE_LIMIT) throw new LeaseDocumentQuotaError('Il file supera 2 MB.');
    if (physicalLeaseSize(db, leaseId) + file.size > TOTAL_LIMIT) throw new LeaseDocumentQuotaError('I documenti della locazione superano 3 MB.');
}

export function listGlobalDocuments(): DocumentRecord[] {
    return getJsonDb().documents.filter((doc) => doc.ownerType === 'global');
}

export function listLeaseDocuments(leaseId: string): DocumentRecord[] {
    return getJsonDb().documents.filter((doc) => doc.ownerType === 'lease' && doc.ownerId === leaseId);
}

export function getDocumentById(id: string): DocumentRecord | null {
    return getJsonDb().documents.find((doc) => doc.id === id) || null;
}

export function resolveDocumentFile(id: string, seen = new Set<string>()): StoredLocalFile {
    if (seen.has(id)) throw new LeaseDocumentNotFoundError();
    seen.add(id);
    const doc = getDocumentById(id);
    if (!doc) throw new LeaseDocumentNotFoundError();
    if (doc.sourceDocumentId) return resolveDocumentFile(doc.sourceDocumentId, seen);
    if (!doc.file) throw new LeaseDocumentNotFoundError();
    return doc.file;
}

export function createLeaseDocument(leaseId: string, input: LeaseDocumentInput): DocumentRecord {
    const db = getJsonDb();
    if (!db.leases.some((lease) => lease.id === leaseId)) throw new LeaseNotFoundError();
    validateFile(db, leaseId, input.file);
    const record: DocumentRecord = { id: generateId('document'), ownerType: 'lease', ownerId: leaseId, sourceDocumentId: null, categoryId: input.categoryId, categoryLabel: input.categoryLabel, title: input.title || input.file.name, description: input.description, isShared: input.isShared, file: input.file, createdAt: now(), updatedAt: now() };
    return saveJsonDb({ ...db, leases: addActivity(db, leaseId, 'Documento aggiunto.'), documents: [...db.documents, record] }).documents.find((doc) => doc.id === record.id) as DocumentRecord;
}

export function linkExistingDocument(leaseId: string, sourceDocumentId: string, metadata: Omit<LeaseDocumentInput, 'file'>): DocumentRecord {
    const db = getJsonDb();
    if (!db.leases.some((lease) => lease.id === leaseId)) throw new LeaseNotFoundError();
    const source = db.documents.find((doc) => doc.id === sourceDocumentId && doc.ownerType === 'global');
    if (!source) throw new LeaseDocumentNotFoundError();
    if (db.documents.some((doc) => doc.ownerType === 'lease' && doc.ownerId === leaseId && doc.sourceDocumentId === sourceDocumentId)) throw new LeaseDocumentDuplicateError();
    const record: DocumentRecord = { id: generateId('document-link'), ownerType: 'lease', ownerId: leaseId, sourceDocumentId, categoryId: metadata.categoryId, categoryLabel: metadata.categoryLabel, title: metadata.title || source.title, description: metadata.description, isShared: metadata.isShared, file: null, createdAt: now(), updatedAt: now() };
    return saveJsonDb({ ...db, leases: addActivity(db, leaseId, 'Documento esistente collegato.'), documents: [...db.documents, record] }).documents.find((doc) => doc.id === record.id) as DocumentRecord;
}

export function updateLeaseDocument(id: string, input: Partial<Omit<DocumentRecord, 'id' | 'ownerType' | 'ownerId' | 'sourceDocumentId' | 'file' | 'createdAt'>>): DocumentRecord {
    const db = getJsonDb();
    const doc = db.documents.find((item) => item.id === id && item.ownerType === 'lease');
    if (!doc || !doc.ownerId) throw new LeaseDocumentNotFoundError();
    const next = { ...doc, ...input, updatedAt: now() };
    return saveJsonDb({ ...db, leases: addActivity(db, doc.ownerId, 'Documento aggiornato.'), documents: db.documents.map((item) => item.id === id ? next : item) }).documents.find((item) => item.id === id) as DocumentRecord;
}

export function deleteLeaseDocument(id: string): boolean {
    const db = getJsonDb();
    const doc = db.documents.find((item) => item.id === id && item.ownerType === 'lease');
    if (!doc || !doc.ownerId) throw new LeaseDocumentNotFoundError();
    saveJsonDb({ ...db, leases: addActivity(db, doc.ownerId, 'Documento eliminato.'), documents: db.documents.filter((item) => item.id !== id) });
    return true;
}

export function downloadDocument(id: string): void {
    const file = resolveDocumentFile(id);
    downloadDataUrl(file.dataUrl, file.name);
}
