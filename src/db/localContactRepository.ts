import { createContactRepositoryOperations } from './contactRepository';
import type { ContactRepository } from './contactRepository.port';
import { createJsonDbAccountScope } from './jsonDb';

export type LocalContactRepositoryOptions = {
    accountId: string;
};

export function createLocalContactRepository(
    options: LocalContactRepositoryOptions,
): ContactRepository {
    const database = createJsonDbAccountScope(options.accountId);
    const contacts = createContactRepositoryOperations(database);
    return {
        list: async () => contacts.list(),
        getById: async (id) => contacts.getById(id),
        create: async (input) => contacts.create(input),
        update: async (id, input) => contacts.update(id, input),
        archive: async (id) => contacts.archive(id),
        canDelete: async (id) => contacts.canDelete(id),
        delete: async (id) => {
            contacts.delete(id);
        },
    };
}
