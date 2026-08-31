import { generateId, getJsonDb, saveJsonDb } from './jsonDb';
import type { ContactRecord, LocalDatabase } from './database.types';
import { LeaseContactInUseError, LeaseContactNotFoundError } from './databaseErrors';
import type { ContactDeleteCheck } from './contactRepository.port';

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

export type ContactDatabaseGateway = {
    getDatabase(): LocalDatabase;
    saveDatabase(database: LocalDatabase): LocalDatabase;
};

export function createContactRepositoryOperations(gateway: ContactDatabaseGateway) {
    const operations = {
        list(): ContactRecord[] {
            return gateway.getDatabase().contacts;
        },
        getById(id: string): ContactRecord | null {
            return gateway.getDatabase().contacts.find((contact) => contact.id === id) || null;
        },
        create(input: ContactInput): ContactRecord {
            const db = gateway.getDatabase();
            const now = timestamp();
            const record: ContactRecord = {
                id: generateId('contact'),
                ...normalizeContactInput(input),
                archived: false,
                createdAt: now,
                updatedAt: now,
            };
            return gateway.saveDatabase({ ...db, contacts: [...db.contacts, record] }).contacts.find((contact) => contact.id === record.id) as ContactRecord;
        },
        update(id: string, input: ContactInput): ContactRecord {
            const db = gateway.getDatabase();
            const index = db.contacts.findIndex((contact) => contact.id === id);
            if (index === -1) throw new LeaseContactNotFoundError();
            const updated: ContactRecord = {
                ...db.contacts[index],
                ...normalizeContactInput({ ...db.contacts[index], ...input }),
                updatedAt: timestamp(),
            };
            const contacts = [...db.contacts];
            contacts[index] = updated;
            return gateway.saveDatabase({ ...db, contacts }).contacts[index];
        },
        archive(id: string): ContactRecord {
            const db = gateway.getDatabase();
            const index = db.contacts.findIndex((contact) => contact.id === id);
            if (index === -1) throw new LeaseContactNotFoundError();
            const contacts = [...db.contacts];
            contacts[index] = { ...contacts[index], archived: true, updatedAt: timestamp() };
            return gateway.saveDatabase({ ...db, contacts }).contacts[index];
        },
        restore(id: string): ContactRecord {
            const db = gateway.getDatabase();
            const index = db.contacts.findIndex((contact) => contact.id === id);
            if (index === -1) throw new LeaseContactNotFoundError();
            const contacts = [...db.contacts];
            contacts[index] = { ...contacts[index], archived: false, updatedAt: timestamp() };
            return gateway.saveDatabase({ ...db, contacts }).contacts[index];
        },
        canDelete(id: string): ContactDeleteCheck {
            const db = gateway.getDatabase();
            const usedByLease = db.leases.some((lease) => lease.guarantorIds.includes(id));
            const usedByTenant = db.tenants.some((tenant) => (
                tenant.guarantors.some((guarantor) => guarantor.contactId === id)
                || tenant.emergencyContacts.some((contact) => contact.contactId === id)
            ));
            return usedByLease || usedByTenant
                ? { canDelete: false, reason: 'Il contatto è collegato a un record persistito.' }
                : { canDelete: true };
        },
        delete(id: string): boolean {
            const db = gateway.getDatabase();
            const contact = db.contacts.find((item) => item.id === id);
            if (!contact) throw new LeaseContactNotFoundError();
            const check = operations.canDelete(id);
            if (!check.canDelete) throw new LeaseContactInUseError();
            gateway.saveDatabase({ ...db, contacts: db.contacts.filter((item) => item.id !== id) });
            return true;
        },
    };
    return operations;
}

const legacyContacts = createContactRepositoryOperations({
    getDatabase: getJsonDb,
    saveDatabase: saveJsonDb,
});

export function listContacts(): ContactRecord[] {
    return legacyContacts.list();
}

export function getContactById(id: string): ContactRecord | null {
    return legacyContacts.getById(id);
}

export function createContact(input: ContactInput): ContactRecord {
    return legacyContacts.create(input);
}

export function updateContact(id: string, input: ContactInput): ContactRecord {
    return legacyContacts.update(id, input);
}

export function archiveContact(id: string): ContactRecord {
    return legacyContacts.archive(id);
}

export function restoreContact(id: string): ContactRecord {
    return legacyContacts.restore(id);
}

export function canDeleteContact(id: string): ContactDeleteCheck {
    return legacyContacts.canDelete(id);
}

export function deleteContact(id: string): boolean {
    return legacyContacts.delete(id);
}
