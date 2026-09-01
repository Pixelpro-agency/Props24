# Props24 — File modificati per revisione

## Task

C3.2 — Enforcement ContactRepository

## Baseline

- branch: `main`
- SHA: `2293c9244769bdefc90843aa38e26e1f868b8ec2`
- working tree iniziale: pulito
- baseline mirata: 2 file, 40 test PASS

## Tentativi

- Tentativo 1: enforcement create/update e test dedicato; 8/10 PASS, due aspettative `instanceof` non valide attraverso `vi.resetModules` pur con domain shape corretta.
- Tentativo 2: aspettative allineate al module graph senza modifiche applicative; 10/10 PASS.

## Inventario writer Contact

- Authority: `createContactRepositoryOperations`.
- Local adapter: delega integralmente all'authority.
- Wrapper legacy `createContact`/`updateContact`: delegano alla stessa istanza operations.
- Altri writer persistenti: nessuno; bypass: nessuno.

## Enforcement create

- getDatabase → normalize → assert → timestamp/generateId/record/save.
- Person: solo CF; company: CF/P.IVA; archived incluso; type-aware; vuoti ed email ignorati.

## Enforcement update

- Record corrente + patch → normalize → assert con exclude current → timestamp/save.
- Collisioni altro record bloccate per CF e company VAT; person VAT ignorata; duplicati legacy non nascosti da exclude self.

## Account isolation

- Identità presente solo in B riutilizzabile in A; write solo A.
- Repository catturato A continua a scandire/bloccare A dopo switch globale a B; zero write A/B sul fallimento.

## Legacy wrappers

- createContact e updateContact sottoposti allo stesso enforcement; nessun bypass.

## Atomicità failure

- Create/update duplicate: write delta 0, notification 0, DB invariato, input/patch immutati.

## Error propagation

- `DuplicateContactFiscalIdentityError`, field ed existingContactId preservati; messaggio originale; nessun wrapping.

## Test C3.2

- `npx vitest run tests/db/contactFiscalEnforcement.test.ts`: 1 file, 10 test PASS.

## Regression C3.1

- 3 file, 13 test PASS.

## Regression C1

- 3 file, 60 test PASS.

## Consumer regression

- `tests/contacts/contactListStore.test.ts`, `tests/contacts/contactRepositoryComposition.test.ts`: 2 file, 8 test PASS.

## Full suite

- Run unica: 102 file, 1178 test PASS, 0 fail, exit code 0.

## Build

- PASS; warning storico Vite sui chunk.

## ESLint

- 0 errori, 0 warning.

## UTF-8

- UTF-8 valido; NUL 0; mojibake 0.

## Static checks

- Assert Contact: import + uso create + uso update in contactRepository; definition businessRules.
- Assert Tenant in Contact/local adapter: 0.
- Nessuna duplicazione nel local adapter; tutti i writer convergono sulle operations condivise.

## Scope

- Nessun file fuori scope.

## File modificati

- `src/db/contactRepository.ts`
- `tests/db/contactFiscalEnforcement.test.ts` (nuovo)
- `fileModificati.md` (report)

## Diff completa file tracciati

```diff
diff --git a/src/db/contactRepository.ts b/src/db/contactRepository.ts
index 92b42b9..94b851b 100644
--- a/src/db/contactRepository.ts
+++ b/src/db/contactRepository.ts
@@ -2,6 +2,7 @@ import { generateId, getJsonDb, saveJsonDb } from './jsonDb';
 import type { ContactRecord, LocalDatabase } from './database.types';
 import { LeaseContactInUseError, LeaseContactNotFoundError } from './databaseErrors';
 import type { ContactDeleteCheck } from './contactRepository.port';
+import { assertUniqueContactFiscalIdentity } from './businessRules';
 
 export type ContactInput = Partial<Omit<ContactRecord, 'id' | 'createdAt' | 'updatedAt' | 'archived'>>;
 
@@ -48,10 +49,12 @@ export function createContactRepositoryOperations(gateway: ContactDatabaseGatewa
         },
         create(input: ContactInput): ContactRecord {
             const db = gateway.getDatabase();
+            const normalizedInput = normalizeContactInput(input);
+            assertUniqueContactFiscalIdentity(db, normalizedInput);
             const now = timestamp();
             const record: ContactRecord = {
                 id: generateId('contact'),
-                ...normalizeContactInput(input),
+                ...normalizedInput,
                 archived: false,
                 createdAt: now,
                 updatedAt: now,
@@ -62,9 +65,11 @@ export function createContactRepositoryOperations(gateway: ContactDatabaseGatewa
             const db = gateway.getDatabase();
             const index = db.contacts.findIndex((contact) => contact.id === id);
             if (index === -1) throw new LeaseContactNotFoundError();
+            const normalizedInput = normalizeContactInput({ ...db.contacts[index], ...input });
+            assertUniqueContactFiscalIdentity(db, normalizedInput, id);
             const updated: ContactRecord = {
                 ...db.contacts[index],
-                ...normalizeContactInput({ ...db.contacts[index], ...input }),
+                ...normalizedInput,
                 updatedAt: timestamp(),
             };
             const contacts = [...db.contacts];
```

## Contenuto integrale file nuovi

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ContactRecord, LocalDatabase } from '../../src/db/database.types';
import type { ContactCreateInput } from '../../src/db/contactRepository.port';
import { installJsonDbWindow, MemoryStorage, uninstallJsonDbWindow } from './jsonDbStorageHarness';

const ACCOUNT_A = 'user-001';
const ACCOUNT_B = 'user-002';
const KEY_A = 'props24.localDb.user-001';
const KEY_B = 'props24.localDb.user-002';
const NOW = '2026-09-01T12:00:00.000Z';

const contact = (id: string, overrides: Partial<ContactRecord> = {}): ContactRecord => ({
    id, type: 'person', companyName: '', firstName: 'Mario', lastName: 'Rossi', birthDate: '', birthPlace: '',
    fiscalCode: '', vatNumber: '', email: '', phone: '', address: '', city: '', zip: '', country: 'IT', notes: '',
    archived: false, createdAt: NOW, updatedAt: NOW, ...overrides,
});

const input = (overrides: Partial<ContactCreateInput> = {}): ContactCreateInput => ({
    type: 'person', companyName: '', firstName: 'Ada', lastName: 'Lovelace', birthDate: '', birthPlace: '',
    fiscalCode: '', vatNumber: '', email: '', phone: '', address: '', city: '', zip: '', country: 'IT', notes: '',
    ...overrides,
});

const database = (contacts: ContactRecord[] = []): LocalDatabase => ({
    meta: { schemaVersion: 4, seedVersion: 1, createdAt: NOW, updatedAt: NOW, source: 'seed' },
    properties: [], buildings: [], tenants: [], leases: [], payments: [], contacts, documents: [], reservations: [],
    catalogs: [], inventory: [], maintenance: [], tasks: [], notes: [], messages: [], candidates: [], settings: {},
    userProfile: {}, drafts: [],
});

async function arrange(dbA = database(), dbB = database()) {
    const storage = new MemoryStorage({ [KEY_A]: JSON.stringify(dbA), [KEY_B]: JSON.stringify(dbB) });
    installJsonDbWindow(storage);
    vi.resetModules();
    const jsonDb = await import('../../src/db/jsonDb');
    jsonDb.setActiveDatabaseAccount(ACCOUNT_A);
    const { createLocalContactRepository } = await import('../../src/db/localContactRepository');
    const repositoryA = createLocalContactRepository({ accountId: ACCOUNT_A });
    storage.resetOperationLogs();
    return { storage, jsonDb, repositoryA };
}

const persisted = (storage: MemoryStorage, key = KEY_A): LocalDatabase => JSON.parse(storage.getItem(key)!) as LocalDatabase;

afterEach(() => {
    uninstallJsonDbWindow();
    vi.resetModules();
});

describe('ContactRepository fiscal enforcement C3.2', () => {
    it('create person duplicata, anche archived, propaga errore e lascia DB/input/notification invariati', async () => {
        const existing = contact('contact-existing', { fiscalCode: ' rss 123 ', archived: true });
        const { repositoryA, storage } = await arrange(database([existing]));
        const callback = vi.fn();
        const unsubscribe = repositoryA.subscribe(callback);
        const candidate = input({ fiscalCode: 'RSS123' });
        const original = structuredClone(candidate);
        const before = storage.getItem(KEY_A);

        await expect(repositoryA.create(candidate)).rejects.toMatchObject({
            name: 'DuplicateContactFiscalIdentityError', field: 'fiscalCode', existingContactId: existing.id,
        });
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(storage.getItem(KEY_A)).toBe(before);
        expect(callback).not.toHaveBeenCalled();
        expect(candidate).toEqual(original);
        unsubscribe();
    });

    it('create person ignora VAT ed email e consente CF uguale a una company', async () => {
        const existing = contact('company-existing', {
            type: 'company', companyName: 'Company', firstName: '', lastName: '', fiscalCode: 'SAME123',
            vatNumber: 'VAT-SAME', email: 'same@example.test',
        });
        const { repositoryA, storage } = await arrange(database([existing]));
        const created = await repositoryA.create(input({ fiscalCode: 'SAME123', vatNumber: 'VAT-SAME', email: 'same@example.test' }));
        expect(created.type).toBe('person');
        expect(storage.writesFor(KEY_A)).toHaveLength(1);
    });

    it('create company blocca CF e VAT con priorità deterministica al CF', async () => {
        const first = contact('company-cf', { type: 'company', companyName: 'One', firstName: '', lastName: '', fiscalCode: 'CF-ONE', vatNumber: 'VAT-ONE' });
        const second = contact('company-vat', { type: 'company', companyName: 'Two', firstName: '', lastName: '', fiscalCode: 'CF-TWO', vatNumber: 'VAT-TWO' });
        const { repositoryA, storage } = await arrange(database([first, second]));
        const company = (fiscalCode: string, vatNumber: string) => input({ type: 'company', companyName: 'New', firstName: '', lastName: '', fiscalCode, vatNumber });
        await expect(repositoryA.create(company('cf-one', 'vat-two'))).rejects.toMatchObject({ field: 'fiscalCode', existingContactId: first.id });
        await expect(repositoryA.create(company('CF-NEW', ' vat-two '))).rejects.toMatchObject({ field: 'vatNumber', existingContactId: second.id });
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
    });

    it('update propria identità e person VAT non probatoria passano', async () => {
        const first = contact('person-a', { fiscalCode: 'CF-A', vatNumber: 'VAT-SHARED' });
        const second = contact('person-b', { fiscalCode: 'CF-B', vatNumber: 'VAT-B' });
        const { repositoryA, storage } = await arrange(database([first, second]));
        await expect(repositoryA.update(second.id, { notes: 'self' })).resolves.toMatchObject({ fiscalCode: 'CF-B', notes: 'self' });
        await expect(repositoryA.update(second.id, { vatNumber: 'VAT-SHARED' })).resolves.toMatchObject({ vatNumber: 'VAT-SHARED' });
        expect(storage.writesFor(KEY_A)).toHaveLength(2);
    });

    it('update verso CF altrui è atomico, senza notification e senza mutare patch', async () => {
        const first = contact('person-a', { fiscalCode: 'CF-A' });
        const second = contact('person-b', { fiscalCode: 'CF-B' });
        const { repositoryA, storage } = await arrange(database([first, second]));
        const callback = vi.fn();
        const unsubscribe = repositoryA.subscribe(callback);
        const patch = { fiscalCode: ' cf-a ', notes: 'non salvare' };
        const original = structuredClone(patch);
        const before = storage.getItem(KEY_A);
        await expect(repositoryA.update(second.id, patch)).rejects.toMatchObject({ field: 'fiscalCode', existingContactId: first.id });
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(storage.getItem(KEY_A)).toBe(before);
        expect(callback).not.toHaveBeenCalled();
        expect(patch).toEqual(original);
        unsubscribe();
    });

    it('update company verso VAT altrui viene bloccato', async () => {
        const first = contact('company-a', { type: 'company', companyName: 'A', firstName: '', lastName: '', fiscalCode: 'CF-A', vatNumber: 'VAT-A' });
        const second = contact('company-b', { type: 'company', companyName: 'B', firstName: '', lastName: '', fiscalCode: 'CF-B', vatNumber: 'VAT-B' });
        const { repositoryA, storage } = await arrange(database([first, second]));
        await expect(repositoryA.update(second.id, { vatNumber: 'vat-a' })).rejects.toMatchObject({ field: 'vatNumber', existingContactId: first.id });
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
    });

    it('exclude self non nasconde un altro duplicato legacy', async () => {
        const first = contact('legacy-a', { fiscalCode: 'LEGACY-DUP' });
        const second = contact('legacy-b', { fiscalCode: 'LEGACY-DUP' });
        const { repositoryA, storage } = await arrange(database([first, second]));
        await expect(repositoryA.update(second.id, { notes: 'update' })).rejects.toMatchObject({ existingContactId: first.id });
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
    });

    it('account isolation consente riuso fiscale presente solo in B e scrive soltanto A', async () => {
        const inB = contact('contact-b', { fiscalCode: 'CROSS123' });
        const { repositoryA, storage, jsonDb } = await arrange(database(), database([inB]));
        jsonDb.setActiveDatabaseAccount(ACCOUNT_B);
        await expect(repositoryA.create(input({ fiscalCode: 'CROSS123' }))).resolves.toMatchObject({ fiscalCode: 'CROSS123' });
        expect(storage.writesFor(KEY_A)).toHaveLength(1);
        expect(storage.writesFor(KEY_B)).toHaveLength(0);
        expect(persisted(storage, KEY_B).contacts).toEqual([inB]);
    });

    it('repository catturato continua a bloccare sul database A dopo switch globale a B', async () => {
        const inA = contact('contact-a', { fiscalCode: 'DUP-A' });
        const { repositoryA, storage, jsonDb } = await arrange(database([inA]), database());
        jsonDb.setActiveDatabaseAccount(ACCOUNT_B);
        await expect(repositoryA.create(input({ fiscalCode: 'dup-a' }))).rejects.toMatchObject({
            name: 'DuplicateContactFiscalIdentityError', field: 'fiscalCode', existingContactId: inA.id,
        });
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(storage.writesFor(KEY_B)).toHaveLength(0);
    });

    it('wrapper legacy create e update condividono lo stesso enforcement senza bypass', async () => {
        const first = contact('legacy-a', { fiscalCode: 'AAA' });
        const second = contact('legacy-b', { fiscalCode: 'BBB' });
        const { storage, jsonDb } = await arrange(database([first, second]));
        jsonDb.setActiveDatabaseAccount(ACCOUNT_A);
        const { createContact, updateContact } = await import('../../src/db/contactRepository');
        expect(() => createContact(input({ fiscalCode: ' aaa ' }))).toThrow('Esiste già un contatto con lo stesso codice fiscale.');
        expect(() => updateContact(second.id, { fiscalCode: 'AAA' })).toThrow('Esiste già un contatto con lo stesso codice fiscale.');
        expect(storage.writesFor(KEY_A)).toHaveLength(0);
        expect(persisted(storage).contacts).toEqual([first, second]);
    });
});
```

## Working tree finale

```text
 M src/db/contactRepository.ts
?? fileModificati.md
?? tests/db/contactFiscalEnforcement.test.ts
```

## Conferme finali

- C3.2 implementata: sì
- C3.1 business rules modificate: no
- Contact create enforcement: sì
- Contact update enforcement: sì
- exclude current: sì
- archived included: sì
- empty ignored: sì
- person VAT ignored: sì
- company CF enforced: sì
- company VAT enforced: sì
- account isolation: sì
- legacy create enforced: sì
- legacy update enforced: sì
- zero write on duplicate: sì
- zero notification on duplicate: sì
- input immutable: sì
- ContactRepository port modificata: no
- localContactRepository modificato: no
- Tenant repository modificato: no
- C3.3 anticipata: no
- C4 anticipata: no
- C5 anticipata: no
- docs modificate: no
- browser QA: no
- staging: no
- commit: no
- push: no
- GitHub: no
- fileModificati.md destinato al commit: no
