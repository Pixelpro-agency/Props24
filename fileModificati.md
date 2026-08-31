# Props24 — File modificati per revisione

## Task

- C1.1 — Contratto Contact–Tenant e lifecycle Contact
- DESKTOP_ESECUTORE

## Baseline

- branch: main
- SHA: 47b2072946bdc210fbc6e8a45f2d0353e269c6ba
- working tree iniziale: pulito

## Tentativi

- 1: implementazione e test mirati; le fixture confrontavano dati precedenti alla normalizzazione database; corrette le sole aspettative usando lo stato persistito.
- 2: test mirati verdi, 3 file e 43 test. Suite concorrente: singolo timeout fuori scope dovuto a contesa; ripetizione isolata verde senza modifiche.

## Contratto Contact–Tenant

- File modificati: `src/types/tenant.ts`, `src/components/tenant-form/schema.ts` e test autorizzati.
- `contactId?: string` aggiunto a Guarantor ed EmergencyContact senza sostituire `id`.
- Legacy senza `contactId` preservato; nessun matching euristico.
- Schema, draft e form preservano `contactId` esplicito senza default vuoto, lookup o scritture.
- Nessuna modifica agli ID riservati a C2.

## Lifecycle Contact

- `restore` aggiunto a porta, operazioni locali, adapter e bridge legacy `restoreContact`.
- Preserva campi, ID e `createdAt`; imposta `archived: false`, aggiorna `updatedAt`, una write e una notifica account-scoped.

## Delete protection

- Blocker preservato per Lease e aggiunto per Tenant guarantor/emergency, incluso Tenant archiviato.
- Legacy inline e `relation.id` senza `contactId` non bloccano.
- Account isolation verificata; nessun cascade; `canDelete` read-only.

## Confini rispettati

- C1.2, C1.3, C2, C3, C4, C5, C6 non implementate.
- Nuova view Rubrica non creata; docs non modificate.

## Test baseline

- `npx vitest run tests/db/contactRepositoryAdapter.test.ts tests/contacts/contactRepositoryComposition.test.ts tests/db/tenantDraftDefinition.test.ts`: 3 file, 32 test PASS.

## Test mirati C1.1

- Stesso comando: 3 file, 43 test PASS.

## Regression Lease

- 2 file, 27 test PASS.

## Regression Tenant form

- 6 file, 69 test PASS.

## Suite completa

- 93 file, 1110 test, PASS.

## Build

- PASS; warning storico Vite sulla dimensione chunk.

## ESLint

- 0 errori, 0 warning.

## UTF-8

- File controllati: tutti gli 8 file reali modificati, diff e questo report.
- UTF-8 valido: sì; byte NUL: 0; mojibake involontario: 0.

## Diff check

- `git diff --check`: PASS.

## File modificati

- src/components/tenant-form/schema.ts
- src/db/contactRepository.port.ts
- src/db/contactRepository.ts
- src/db/databaseErrors.ts
- src/db/localContactRepository.ts
- src/types/tenant.ts
- tests/db/contactRepositoryAdapter.test.ts
- tests/db/tenantDraftDefinition.test.ts
- fileModificati.md (creato, non destinato al commit)

## Diff completa

```diff
diff --git a/src/components/tenant-form/schema.ts b/src/components/tenant-form/schema.ts
index 48384ea..c8b28fb 100644
--- a/src/components/tenant-form/schema.ts
+++ b/src/components/tenant-form/schema.ts
@@ -23,6 +23,7 @@ export const tenantStoredFileSchema = z.object({
 
 export const tenantGuarantorSchema = z.object({
     id: stringField,
+    contactId: z.string().min(1).optional(),
     contactType: z.enum(['person', 'company']).default('person'),
     companyName: stringField,
     firstName: stringField,
@@ -40,6 +41,7 @@ export const tenantGuarantorSchema = z.object({
 
 export const tenantEmergencyContactSchema = z.object({
     id: stringField,
+    contactId: z.string().min(1).optional(),
     contactType: z.enum(['person', 'company']).default('person'),
     companyName: stringField,
     firstName: stringField,
diff --git a/src/db/contactRepository.port.ts b/src/db/contactRepository.port.ts
index 1c9a469..799b7ba 100644
--- a/src/db/contactRepository.port.ts
+++ b/src/db/contactRepository.port.ts
@@ -20,6 +20,7 @@ export interface ContactRepository {
     create(input: ContactCreateInput): Promise<ContactRecord>;
     update(id: string, input: ContactUpdateInput): Promise<ContactRecord>;
     archive(id: string): Promise<ContactRecord>;
+    restore(id: string): Promise<ContactRecord>;
     canDelete(id: string): Promise<ContactDeleteCheck>;
     delete(id: string): Promise<void>;
     subscribe(callback: () => void): () => void;
diff --git a/src/db/contactRepository.ts b/src/db/contactRepository.ts
index 6717481..92b42b9 100644
--- a/src/db/contactRepository.ts
+++ b/src/db/contactRepository.ts
@@ -79,10 +79,24 @@ export function createContactRepositoryOperations(gateway: ContactDatabaseGatewa
             contacts[index] = { ...contacts[index], archived: true, updatedAt: timestamp() };
             return gateway.saveDatabase({ ...db, contacts }).contacts[index];
         },
+        restore(id: string): ContactRecord {
+            const db = gateway.getDatabase();
+            const index = db.contacts.findIndex((contact) => contact.id === id);
+            if (index === -1) throw new LeaseContactNotFoundError();
+            const contacts = [...db.contacts];
+            contacts[index] = { ...contacts[index], archived: false, updatedAt: timestamp() };
+            return gateway.saveDatabase({ ...db, contacts }).contacts[index];
+        },
         canDelete(id: string): ContactDeleteCheck {
             const db = gateway.getDatabase();
-            const used = db.leases.some((lease) => lease.guarantorIds.includes(id));
-            return used ? { canDelete: false, reason: 'Il garante è collegato a una locazione.' } : { canDelete: true };
+            const usedByLease = db.leases.some((lease) => lease.guarantorIds.includes(id));
+            const usedByTenant = db.tenants.some((tenant) => (
+                tenant.guarantors.some((guarantor) => guarantor.contactId === id)
+                || tenant.emergencyContacts.some((contact) => contact.contactId === id)
+            ));
+            return usedByLease || usedByTenant
+                ? { canDelete: false, reason: 'Il contatto è collegato a un record persistito.' }
+                : { canDelete: true };
         },
         delete(id: string): boolean {
             const db = gateway.getDatabase();
@@ -122,6 +136,10 @@ export function archiveContact(id: string): ContactRecord {
     return legacyContacts.archive(id);
 }
 
+export function restoreContact(id: string): ContactRecord {
+    return legacyContacts.restore(id);
+}
+
 export function canDeleteContact(id: string): ContactDeleteCheck {
     return legacyContacts.canDelete(id);
 }
diff --git a/src/db/databaseErrors.ts b/src/db/databaseErrors.ts
index a1c60ab..0e8d07c 100644
--- a/src/db/databaseErrors.ts
+++ b/src/db/databaseErrors.ts
@@ -282,14 +282,14 @@ export class LeasePaymentOperationError extends Error {
 
 export class LeaseContactNotFoundError extends Error {
     constructor() {
-        super('Garante non trovato.');
+        super('Contatto non trovato.');
         this.name = 'LeaseContactNotFoundError';
     }
 }
 
 export class LeaseContactInUseError extends Error {
     constructor() {
-        super('Il contatto è collegato a una locazione e non può essere eliminato.');
+        super('Il contatto è collegato a un record persistito e non può essere eliminato.');
         this.name = 'LeaseContactInUseError';
     }
 }
diff --git a/src/db/localContactRepository.ts b/src/db/localContactRepository.ts
index 02e21b9..b9f22f6 100644
--- a/src/db/localContactRepository.ts
+++ b/src/db/localContactRepository.ts
@@ -17,6 +17,7 @@ export function createLocalContactRepository(
         create: async (input) => contacts.create(input),
         update: async (id, input) => contacts.update(id, input),
         archive: async (id) => contacts.archive(id),
+        restore: async (id) => contacts.restore(id),
         canDelete: async (id) => contacts.canDelete(id),
         delete: async (id) => {
             contacts.delete(id);
diff --git a/src/types/tenant.ts b/src/types/tenant.ts
index 4a38b87..e7239bb 100644
--- a/src/types/tenant.ts
+++ b/src/types/tenant.ts
@@ -61,6 +61,7 @@ export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
 // Garante
 export interface Guarantor {
     id: string;
+    contactId?: string;
     contactType: ContactType;
     companyName?: string;
     firstName?: string;
@@ -79,6 +80,7 @@ export interface Guarantor {
 // Contatto di emergenza
 export interface EmergencyContact {
     id: string;
+    contactId?: string;
     contactType: ContactType;
     companyName?: string;
     firstName?: string;
diff --git a/tests/db/contactRepositoryAdapter.test.ts b/tests/db/contactRepositoryAdapter.test.ts
index fffa4f6..ea5a1a4 100644
--- a/tests/db/contactRepositoryAdapter.test.ts
+++ b/tests/db/contactRepositoryAdapter.test.ts
@@ -227,6 +227,40 @@ function linkedDatabase(linkedContactId = 'contact-linked'): LocalDatabase {
   };
 }
 
+function tenantLinkedDatabase(
+  relation: 'guarantor' | 'emergency',
+  options: { archived?: boolean; explicitContactId?: boolean } = {},
+): LocalDatabase {
+  const database = linkedDatabase('contact-linked');
+  const tenant = database.tenants[0];
+  tenant.archived = options.archived ?? false;
+  tenant.leaseIds = [];
+  const explicitContactId = options.explicitContactId ?? true;
+  if (relation === 'guarantor') {
+    tenant.guarantors = [{
+      id: 'contact-linked',
+      ...(explicitContactId ? { contactId: 'contact-linked' } : {}),
+      contactType: 'person',
+      firstName: 'Mario',
+      lastName: 'Rossi',
+      email: 'mario@example.test',
+    }];
+  } else {
+    tenant.emergencyContacts = [{
+      id: 'contact-linked',
+      ...(explicitContactId ? { contactId: 'contact-linked' } : {}),
+      contactType: 'person',
+      firstName: 'Mario',
+      lastName: 'Rossi',
+      email: 'mario@example.test',
+      isPrimary: true,
+    }];
+  }
+  database.leases = [];
+  database.properties = [];
+  return database;
+}
+
 function personInput(overrides: Partial<ContactCreateInput> = {}): ContactCreateInput {
   return {
     type: 'person',
@@ -426,6 +460,51 @@ describe('local contact repository adapter', () => {
     expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes + 1);
   });
 
+  it('restores an archived contact preserving its data with one write and notification', async () => {
+    const archivedContact = contact({ archived: true, notes: 'Da preservare' });
+    const { repository, storage } = await arrange(emptyDatabase([archivedContact]));
+    const callback = vi.fn();
+    repository.subscribe(callback);
+    const writes = storage.writesFor(ACCOUNT_KEY).length;
+
+    const restored = await repository.restore('contact-existing');
+
+    expect(restored).toEqual({ ...archivedContact, archived: false, updatedAt: NOW });
+    expect(restored.id).toBe(archivedContact.id);
+    expect(restored.createdAt).toBe(archivedContact.createdAt);
+    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes + 1);
+    expect(callback).toHaveBeenCalledTimes(1);
+  });
+
+  it('rejects restoring a missing contact without writes or notifications', async () => {
+    const { repository, storage } = await arrange();
+    const callback = vi.fn();
+    repository.subscribe(callback);
+    const writes = storage.writesFor(ACCOUNT_KEY).length;
+
+    await expect(repository.restore('contact-missing')).rejects.toMatchObject({
+      name: 'LeaseContactNotFoundError',
+    });
+    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes);
+    expect(callback).not.toHaveBeenCalled();
+  });
+
+  it('restores only the shared id in the captured account', async () => {
+    const sharedId = 'contact-shared';
+    const first = emptyDatabase([contact({ id: sharedId, archived: true })]);
+    const second = emptyDatabase([contact({ id: sharedId, archived: true })]);
+    const { repository, storage } = await arrangeAccounts(first, second);
+    const firstWrites = storage.writesFor(ACCOUNT_KEY).length;
+    const secondWrites = storage.writesFor(SECOND_ACCOUNT_KEY).length;
+
+    await repository.restore(sharedId);
+
+    expect(storedDatabase(storage, ACCOUNT_KEY).contacts[0].archived).toBe(false);
+    expect(storedDatabase(storage, SECOND_ACCOUNT_KEY).contacts[0].archived).toBe(true);
+    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(firstWrites + 1);
+    expect(storage.writesFor(SECOND_ACCOUNT_KEY)).toHaveLength(secondWrites);
+  });
+
   it('blocks deleting a linked contact with the domain error and no write', async () => {
     const { repository, storage } = await arrange(linkedDatabase());
     const writes = storage.writesFor(ACCOUNT_KEY).length;
@@ -441,6 +520,58 @@ describe('local contact repository adapter', () => {
     expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes);
   });
 
+  it.each([
+    ['guarantor', false],
+    ['emergency', false],
+    ['guarantor', true],
+  ] as const)('blocks delete for a %s relation on archived=%s tenant', async (relation, archived) => {
+    const fixture = tenantLinkedDatabase(relation, { archived });
+    const { repository, storage } = await arrange(fixture);
+    const originalTenant = structuredClone(storedDatabase(storage, ACCOUNT_KEY).tenants[0]);
+    const writes = storage.writesFor(ACCOUNT_KEY).length;
+
+    await expect(repository.canDelete('contact-linked')).resolves.toMatchObject({ canDelete: false });
+    await expect(repository.delete('contact-linked')).rejects.toMatchObject({
+      name: 'LeaseContactInUseError',
+    });
+    expect(storedDatabase(storage, ACCOUNT_KEY).tenants[0]).toEqual(originalTenant);
+    expect(storedDatabase(storage, ACCOUNT_KEY).contacts).toHaveLength(1);
+    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes);
+  });
+
+  it.each(['guarantor', 'emergency'] as const)(
+    'does not infer a %s link from matching legacy inline data or relation id',
+    async (relation) => {
+      const fixture = tenantLinkedDatabase(relation, { explicitContactId: false });
+      const { repository, storage } = await arrange(fixture);
+      const originalTenants = structuredClone(storedDatabase(storage, ACCOUNT_KEY).tenants);
+      const writes = storage.writesFor(ACCOUNT_KEY).length;
+
+      await expect(repository.canDelete('contact-linked')).resolves.toEqual({ canDelete: true });
+      await expect(repository.delete('contact-linked')).resolves.toBeUndefined();
+      expect(storedDatabase(storage, ACCOUNT_KEY).tenants).toEqual(originalTenants);
+      expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(writes + 1);
+    },
+  );
+
+  it('does not let a tenant reference in another account block delete', async () => {
+    const first = emptyDatabase([contact({ id: 'contact-linked' })]);
+    const second = tenantLinkedDatabase('guarantor');
+    const { repository, storage } = await arrangeAccounts(first, second);
+    const firstWrites = storage.writesFor(ACCOUNT_KEY).length;
+    const secondWrites = storage.writesFor(SECOND_ACCOUNT_KEY).length;
+
+    await expect(repository.canDelete('contact-linked')).resolves.toEqual({ canDelete: true });
+    await repository.delete('contact-linked');
+
+    expect(storedDatabase(storage, ACCOUNT_KEY).contacts).toEqual([]);
+    expect(storedDatabase(storage, SECOND_ACCOUNT_KEY).contacts).toHaveLength(1);
+    expect(storedDatabase(storage, SECOND_ACCOUNT_KEY).tenants[0].guarantors[0])
+      .toMatchObject({ contactId: 'contact-linked' });
+    expect(storage.writesFor(ACCOUNT_KEY)).toHaveLength(firstWrites + 1);
+    expect(storage.writesFor(SECOND_ACCOUNT_KEY)).toHaveLength(secondWrites);
+  });
+
   it('deletes an unlinked contact with one write and resolves undefined', async () => {
     const { repository, storage } = await arrange();
     const writes = storage.writesFor(ACCOUNT_KEY).length;
diff --git a/tests/db/tenantDraftDefinition.test.ts b/tests/db/tenantDraftDefinition.test.ts
index 0147975..1abb464 100644
--- a/tests/db/tenantDraftDefinition.test.ts
+++ b/tests/db/tenantDraftDefinition.test.ts
@@ -7,6 +7,7 @@ import {
     TENANT_DRAFT_SCHEMA_VERSION,
     tenantDraftDefinition,
 } from '../../src/components/tenant-form/tenantDraftDefinition';
+import { normalizeTenantFormData } from '../../src/components/tenant-form/schema';
 
 describe('tenant draft definition', () => {
     it('dichiara form e versione canonici', () => {
@@ -45,13 +46,15 @@ describe('tenant draft definition', () => {
             TenantIDCardBack: file,
             TenantCompanyRegistryFile: file,
             TenantGuarantors: [{
-                id: 'guarantor-1',
+                id: 'guarantor-relation-1',
+                contactId: 'contact-1',
                 contactType: 'person',
                 firstName: 'Mario',
                 lastName: 'Rossi',
             }],
             TenantEmergencyContacts: [{
-                id: 'emergency-1',
+                id: 'emergency-relation-1',
+                contactId: 'contact-2',
                 contactType: 'person',
                 firstName: 'Luisa',
                 lastName: 'Verdi',
@@ -74,11 +77,74 @@ describe('tenant draft definition', () => {
         expect(parsed.TenantIDCard).toEqual(file);
         expect(parsed.TenantIDCardBack).toEqual(file);
         expect(parsed.TenantCompanyRegistryFile).toEqual(file);
-        expect(parsed.TenantGuarantors[0]?.id).toBe('guarantor-1');
+        expect(parsed.TenantGuarantors[0]).toMatchObject({
+            id: 'guarantor-relation-1',
+            contactId: 'contact-1',
+        });
+        expect(parsed.TenantEmergencyContacts[0]).toMatchObject({
+            id: 'emergency-relation-1',
+            contactId: 'contact-2',
+            isPrimary: true,
+        });
         expect(parsed.TenantEmergencyContacts[0]?.isPrimary).toBe(true);
         expect(parsed.TenantDocuments[0]?.file).toEqual(file);
     });
 
+    it('preserva relazioni legacy senza inventare contactId', () => {
+        const parsed = tenantDraftDefinition.parse({
+            TenantGuarantors: [{
+                id: 'contact-with-the-same-id',
+                contactType: 'person',
+                firstName: 'Mario',
+                lastName: 'Rossi',
+                email: 'mario@example.test',
+            }],
+            TenantEmergencyContacts: [{
+                id: 'emergency-legacy',
+                contactType: 'person',
+                firstName: 'Mario',
+                lastName: 'Rossi',
+                email: 'mario@example.test',
+                isPrimary: true,
+            }],
+        }, 1);
+
+        expect(parsed.TenantGuarantors[0]).toMatchObject({
+            id: 'contact-with-the-same-id',
+            firstName: 'Mario',
+        });
+        expect(parsed.TenantGuarantors[0]).not.toHaveProperty('contactId');
+        expect(parsed.TenantEmergencyContacts[0]).toMatchObject({
+            id: 'emergency-legacy',
+            isPrimary: true,
+        });
+        expect(parsed.TenantEmergencyContacts[0]).not.toHaveProperty('contactId');
+    });
+
+    it('preserva contactId esplicito nella normalizzazione form definitiva', () => {
+        const normalized = normalizeTenantFormData({
+            TenantFirstName: 'Ada',
+            TenantLastName: 'Lovelace',
+            TenantGuarantors: [{
+                id: 'guarantor-relation-1',
+                contactId: 'contact-1',
+                contactType: 'person',
+            }],
+            TenantEmergencyContacts: [{
+                id: 'emergency-relation-1',
+                contactId: 'contact-2',
+                contactType: 'person',
+                isPrimary: true,
+            }],
+        });
+
+        expect(normalized.TenantGuarantors[0]?.contactId).toBe('contact-1');
+        expect(normalized.TenantEmergencyContacts[0]).toMatchObject({
+            contactId: 'contact-2',
+            isPrimary: true,
+        });
+    });
+
     it('rifiuta email non valida e versione incompatibile', () => {
         expect(() => tenantDraftDefinition.parse({
             TenantEmail: 'non-valida',
```

## Working tree finale

 M src/components/tenant-form/schema.ts
 M src/db/contactRepository.port.ts
 M src/db/contactRepository.ts
 M src/db/databaseErrors.ts
 M src/db/localContactRepository.ts
 M src/types/tenant.ts
 M tests/db/contactRepositoryAdapter.test.ts
 M tests/db/tenantDraftDefinition.test.ts
?? fileModificati.md

## Conferme finali

- file fuori scope: no
- documentazione modificata: no
- browser QA: no
- staging: no
- commit: no
- push: no
- GitHub modificato: no
- fileModificati.md destinato al commit: no
