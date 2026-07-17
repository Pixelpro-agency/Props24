import { generateId, getJsonDb, saveJsonDb } from './jsonDb';
import type { ContactRecord } from './database.types';
import { LeaseContactNotFoundError } from './databaseErrors';

export type ContactInput = Partial<Omit<ContactRecord, 'id' | 'createdAt' | 'updatedAt' | 'archived'>>;

function timestamp(): string {
    return new Date().toISOString();
}

function normalizeContactInput(input: ContactInput): Omit<ContactRecord, 'id' | 'createdAt' | 'updatedAt' | 'archived'> {
    const type = input.type === 'company' ? 'company' : 'person';
    const next: Omit<ContactRecord, 'id' | 'createdAt' | 'updatedAt' | 'archived'> = {
        type,
        companyName: input.companyName || '',
        firstName: input.firstName || '',
        lastName: input.lastName || '',
        birthDate: input.birthDate || '',
        birthPlace: input.birthPlace || '',
        fiscalCode: input.fiscalCode || '',
        vatNumber: input.vatNumber || '',
        email: input.email || '',
        phone: input.phone || '',
        address: input.address || '',
        city: input.city || '',
        zip: input.zip || '',
        country: input.country || 'IT',
        notes: input.notes || '',
    };
    if (type === 'company' && !next.companyName.trim()) throw new Error('Inserisci il nome della società garante.');
    if (type === 'person' && (!next.firstName.trim() || !next.lastName.trim())) throw new Error('Inserisci nome e cognome del garante.');
    return next;
}

export function listContacts(): ContactRecord[] {
    return getJsonDb().contacts;
}

export function getContactById(id: string): ContactRecord | null {
    return getJsonDb().contacts.find((contact) => contact.id === id) || null;
}

export function createContact(input: ContactInput): ContactRecord {
    const db = getJsonDb();
    const now = timestamp();
    const record: ContactRecord = {
        id: generateId('contact'),
        ...normalizeContactInput(input),
        archived: false,
        createdAt: now,
        updatedAt: now,
    };
    return saveJsonDb({ ...db, contacts: [...db.contacts, record] }).contacts.find((contact) => contact.id === record.id) as ContactRecord;
}

export function updateContact(id: string, input: ContactInput): ContactRecord {
    const db = getJsonDb();
    const index = db.contacts.findIndex((contact) => contact.id === id);
    if (index === -1) throw new LeaseContactNotFoundError();
    const updated: ContactRecord = {
        ...db.contacts[index],
        ...normalizeContactInput({ ...db.contacts[index], ...input }),
        updatedAt: timestamp(),
    };
    const contacts = [...db.contacts];
    contacts[index] = updated;
    return saveJsonDb({ ...db, contacts }).contacts[index];
}

export function archiveContact(id: string): ContactRecord {
    const db = getJsonDb();
    const index = db.contacts.findIndex((contact) => contact.id === id);
    if (index === -1) throw new LeaseContactNotFoundError();
    const contacts = [...db.contacts];
    contacts[index] = { ...contacts[index], archived: true, updatedAt: timestamp() };
    return saveJsonDb({ ...db, contacts }).contacts[index];
}

export function canDeleteContact(id: string): { canDelete: boolean; reason?: string } {
    const db = getJsonDb();
    const used = db.leases.some((lease) => lease.guarantorIds.includes(id));
    return used ? { canDelete: false, reason: 'Il garante è collegato a una locazione.' } : { canDelete: true };
}

export function deleteContact(id: string): boolean {
    const db = getJsonDb();
    const contact = db.contacts.find((item) => item.id === id);
    if (!contact) throw new LeaseContactNotFoundError();
    const check = canDeleteContact(id);
    if (!check.canDelete) throw new Error(check.reason);
    saveJsonDb({ ...db, contacts: db.contacts.filter((item) => item.id !== id) });
    return true;
}
