import {
    archiveContact,
    canDeleteContact,
    createContact,
    deleteContact,
    getContactById,
    listContacts,
    updateContact,
} from './contactRepository';
import type { ContactRepository } from './contactRepository.port';

export function createLocalContactRepository(): ContactRepository {
    return {
        list: async () => listContacts(),
        getById: async (id) => getContactById(id),
        create: async (input) => createContact(input),
        update: async (id, input) => updateContact(id, input),
        archive: async (id) => archiveContact(id),
        canDelete: async (id) => canDeleteContact(id),
        delete: async (id) => {
            deleteContact(id);
        },
    };
}
