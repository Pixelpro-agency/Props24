import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    defaultPropertyValues,
    normalizePropertyDraftState,
    normalizePropertyFormData,
    normalizePropertyMutationData,
} from '../../src/components/property-form/schema';
import { propertyDraftDefinition } from '../../src/components/property-form/propertyDraftDefinition';
import type { LocalDatabase } from '../../src/db/database.types';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const KEY = 'props24.localDb.user-001';
const NOW = '2026-08-25T12:00:00.000Z';
const IDS = ['photo-test', 'contact-test', 'document-test', 'file-document-test'];
const storedFile = (id: string) => ({ id, name: 'file.pdf', type: 'application/pdf', size: 7, lastModified: 123, dataUrl: 'data:application/pdf;base64,WA==' });
const payload = () => ({
    ...defaultPropertyValues,
    PropertyTypeID: 'appartamento',
    PropertyTitle: 'Unità ID B4.2',
    PropertyAddress: 'Via Roma',
    PropertyCity: 'Roma',
    PropertyPostalCode: '00100',
    PropertyPhotos: [{ ...storedFile(IDS[0]), type: 'image/png', name: 'photo.png' }],
    PropertyContacts: [{ id: IDS[1], firstName: 'Ada', lastName: 'Rossi', profession: '', email: '', phone: '', comments: '' }],
    PropertyDocuments: [{ id: IDS[2], type: 'altro', description: 'Documento', releaseDate: '', comments: '', shared: false, file: storedFile(IDS[3]) }],
});
const idsOf = (value: ReturnType<typeof payload>) => [
    value.PropertyPhotos[0]?.id,
    value.PropertyContacts[0]?.id,
    value.PropertyDocuments[0]?.id,
    value.PropertyDocuments[0]?.file?.id,
];
const emptyDb = (): LocalDatabase => ({ meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' }, properties: [], buildings: [], tenants: [], leases: [], payments: [], contacts: [], documents: [], reservations: [], catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [], candidates: [], settings: {}, userProfile: {}, drafts: [] });

async function modules(storage: MemoryStorage) {
    installJsonDbWindow(storage);
    vi.resetModules();
    const db = await import('../../src/db/jsonDb');
    const repo = await import('../../src/db/propertyRepository');
    db.setActiveDatabaseAccount('user-001');
    return { db, repo };
}

afterEach(() => { uninstallJsonDbWindow(); vi.resetModules(); });

describe('round-trip degli ID B4.2', () => {
    it('normalizzazione e draft sono idempotenti e preservano gli ID legacy', () => {
        const input = payload();
        for (const normalize of [normalizePropertyFormData, normalizePropertyDraftState, normalizePropertyMutationData]) {
            const once = normalize(input) as ReturnType<typeof payload>;
            const twice = normalize(once) as ReturnType<typeof payload>;
            expect(idsOf(once)).toEqual(IDS);
            expect(idsOf(twice)).toEqual(IDS);
        }
        expect(idsOf(propertyDraftDefinition.parse(input, 2) as ReturnType<typeof payload>)).toEqual(IDS);

        const legacy = payload();
        legacy.PropertyPhotos[0].id = 'photo-old-123';
        legacy.PropertyContacts[0].id = 'contact-old-123';
        legacy.PropertyDocuments[0].id = 'document-old-123';
        legacy.PropertyDocuments[0].file!.id = 'file-old-document-123';
        expect(idsOf(normalizePropertyFormData(legacy) as ReturnType<typeof payload>)).toEqual(['photo-old-123', 'contact-old-123', 'document-old-123', 'file-old-document-123']);
    });

    it('create, JSON persistito e reload conservano i quattro ID', async () => {
        const storage = new MemoryStorage({ [KEY]: JSON.stringify(emptyDb()) });
        const first = await modules(storage);
        const created = first.repo.createProperty(payload());
        expect(idsOf(created.formData as ReturnType<typeof payload>)).toEqual(IDS);
        expect(idsOf(JSON.parse(storage.getItem(KEY)!).properties[0].formData)).toEqual(IDS);

        uninstallJsonDbWindow();
        const reloaded = await modules(storage);
        expect(idsOf(reloaded.db.getJsonDb().properties[0].formData as ReturnType<typeof payload>)).toEqual(IDS);
    });
});
