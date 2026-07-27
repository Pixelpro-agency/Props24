import type { ContactRecord } from './database.types';

export type ContactMutableFields = Omit<
    ContactRecord,
    'id' | 'archived' | 'createdAt' | 'updatedAt'
>;

export type ContactCreateInput = ContactMutableFields;

export type ContactUpdateInput = Partial<ContactMutableFields>;

export type ContactDeleteCheck = {
    canDelete: boolean;
    reason?: string;
};

export interface ContactRepository {
    list(): Promise<ContactRecord[]>;
    getById(id: string): Promise<ContactRecord | null>;
    create(input: ContactCreateInput): Promise<ContactRecord>;
    update(id: string, input: ContactUpdateInput): Promise<ContactRecord>;
    archive(id: string): Promise<ContactRecord>;
    canDelete(id: string): Promise<ContactDeleteCheck>;
    delete(id: string): Promise<void>;
}
