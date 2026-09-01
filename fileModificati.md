# Props24 — File modificati per revisione

## Task

- C2.2 — ID canonici di allegati e documenti Tenant
- modalità DESKTOP_ESECUTORE

## Baseline

- branch: `main`
- SHA: `0e28d589176f0865fcf7f4085c9d0012b1f6d6a4`
- working tree iniziale: pulito
- baseline test: 5 file, 46 test PASS

## Tentativi

- Tentativo 1: sostituiti fingerprint/helper/generatore debole nei tre writer; primo test mirato 6/9 PASS, con tre fixture/selettori non aderenti al DOM reale.
- Tentativo 2: corretti ruoli e payload round-trip; secondo test mirato 7/9 PASS, con input nel portal e messaggio duplicato multiplo.
- Tentativo 3: selettori portal/multipli corretti; 9/9 test PASS.
- Gate ESLint: rilevati sette cast `any` nei due uploader autorizzati; sostituiti con cast tipizzati React Hook Form; ESLint finale PASS.

## Generatore canonico

- authority: `src/utils/id.ts`
- foto: `generateId('tenant-photo')`
- file: `generateId('tenant-file')`
- documento: `generateId('tenant-document')`
- fingerprint e generatori deboli eliminati.

## PhotoUpload

- Create genera una sola identità dopo validazione, lettura e quota.
- Rerender preserva l'ID.
- Replace e remove/reupload generano nuovi ID.
- Failure lascia il form invariato e non consuma ID.

## SimpleFileUpload

- TenantIDCard, TenantIDCardBack e TenantCompanyRegistryFile usano `tenant-file`.
- Replace e remove/reupload generano nuovi ID.
- Failure/read error/abort non consumano ID; generazione immediatamente prima di `setValue`.

## TenantDocuments

- Nuovo locale: parent `tenant-document`, file `tenant-file`, identità distinte.
- Edit metadata e toggle shared preservano entrambi.
- Replace file preserva il parent e genera solo un nuovo file ID.
- Delete non genera; una nuova creazione riceve nuove identità.

## Documento globale esistente

- `existingDocumentId` conserva l'ID globale.
- Il parent TenantDocument riceve un nuovo `tenant-document` solo al link valido.
- `existing.file.id` resta byte-for-byte e non viene generato un `tenant-file`.
- Duplicato bloccato senza consumare ID.
- Edit/cambio globale preservano il parent e usano il file ID globale; globale→locale genera solo tenant-file, locale→globale usa il file globale.

## Failure semantics

- Nessun ID persistente viene consumato se l'oggetto non entra nello stato form.

## Draft / normalization

- Tutte le sei categorie C2.2 sono preservate byte-for-byte; zero generazione.

## Legacy

- ID esistenti preservati; nessun backfill read-time; `jsonDb` non modificato.

## Scope

- C2.1 non modificata; C2.3/C3/C4/C5/C6 non anticipate; docs non modificate.

## Test baseline

- `npx vitest run tests/db/persistedIdGenerator.test.ts tests/db/tenantDraftDefinition.test.ts tests/tenant-form/TenantRelationNestedIds.integration.test.tsx tests/tenant-form/Tab3GuarantorsContacts.integration.test.tsx tests/tenant-form/Tab4EmergencyContacts.integration.test.tsx`: 5 file, 46 test PASS.

## Test C2.2

- 1 file, 9 test PASS.

## Regression C2.1

- 1 file, 6 test PASS.

## Regression C1 UI

- 2 file, 27 test PASS.

## Generator/draft

- 2 file, 13 test PASS.

## Tenant regression

- 10 file, 111 test PASS.

## Contact regression

- 3 file, 41 test PASS.

## Lease regression

- 2 file, 27 test PASS.

## Suite completa

- Run unica: 97 file PASS; 1152 test PASS; 0 fail; codice ritorno 0; nessuna intermittenza.

## Build

- PASS; warning storico Vite sulla dimensione dei chunk.

## ESLint

- 0 errori, 0 warning.

## UTF-8

- UTF-8 valido; byte NUL 0; mojibake 0.

## Static checks

- Date.now: 0; Math.random: 0; crypto.randomUUID locale: 0; crypto.getRandomValues locale: 0.
- `generateId`: tenant-photo, tenant-file, tenant-document nei soli commit di nuovi oggetti.
- Fingerprint ID residui: 0.

## Diff check

- `git diff --check`: PASS.
- Nessun file fuori scope.

## File modificati

- `src/components/tenant-form/tabs/Tab5Documents.tsx`
- `src/components/tenant-form/ui/PhotoUpload.tsx`
- `src/components/tenant-form/ui/SimpleFileUpload.tsx`
- `tests/tenant-form/TenantAttachmentNestedIds.integration.test.tsx` (nuovo)
- `fileModificati.md` (nuovo)

## Diff completa file tracciati

```diff
diff --git a/src/components/tenant-form/tabs/Tab5Documents.tsx b/src/components/tenant-form/tabs/Tab5Documents.tsx
index cdf36ea..1354f42 100644
--- a/src/components/tenant-form/tabs/Tab5Documents.tsx
+++ b/src/components/tenant-form/tabs/Tab5Documents.tsx
@@ -13,11 +13,11 @@ import {
     MAX_TENANT_TOTAL_ATTACHMENT_BYTES,
     type TenantFormData,
 } from '../schema';
+import { generateId } from '../../../utils/id';
 
 type DocumentMode = 'new' | 'existing';
 type TenantDocumentForm = TenantFormData['TenantDocuments'][number];
 
-const generateId = () => `doc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
 const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
 
 function formatFileSize(bytes: number): string {
@@ -124,7 +124,10 @@ export function Tab5Documents() {
         setSelectedFile(file);
     };
 
-    const commitDocument = (nextDocument: TenantDocumentForm) => {
+    const commitDocument = (
+        nextDocument: TenantDocumentForm,
+        options: { createParentId?: boolean; createFileId?: boolean } = {},
+    ) => {
         const nextDocuments = editingIndex !== -1
             ? getValues().TenantDocuments.map((document) => document.id === editingDocumentId ? nextDocument : document)
             : [nextDocument, ...getValues().TenantDocuments];
@@ -133,8 +136,15 @@ export function Tab5Documents() {
             showDocumentError("Limite allegati superato.\nLa dimensione totale dei file dell'inquilino non può superare 3 MB.");
             return;
         }
-        if (editingIndex !== -1) update(editingIndex, nextDocument);
-        else prepend(nextDocument);
+        const committedDocument = {
+            ...nextDocument,
+            id: options.createParentId ? generateId('tenant-document') : nextDocument.id,
+            file: nextDocument.file && options.createFileId
+                ? { ...nextDocument.file, id: generateId('tenant-file') }
+                : nextDocument.file,
+        };
+        if (editingIndex !== -1) update(editingIndex, committedDocument);
+        else prepend(committedDocument);
         closeDocumentModal();
     };
 
@@ -149,7 +159,7 @@ export function Tab5Documents() {
         }
 
         const buildDocument = (file: NonNullable<TenantDocumentForm['file']>) => ({
-            id: editingDocumentId || generateId(),
+            id: editingDocumentId || '',
             fileName: file.name,
             existingDocumentId: undefined,
             categoryId: selectedCategory,
@@ -171,13 +181,16 @@ export function Tab5Documents() {
         reader.onload = (event) => {
             if (!selectedFile) return;
             commitDocument(buildDocument({
-                id: `tenant-doc-${selectedFile.lastModified}-${selectedFile.size}`,
+                id: '',
                 name: selectedFile.name,
                 type: selectedFile.type,
                 size: selectedFile.size,
                 lastModified: selectedFile.lastModified,
                 dataUrl: event.target?.result as string,
-            }));
+            }), {
+                createParentId: !editingDocumentId,
+                createFileId: true,
+            });
         };
         if (selectedFile) reader.readAsDataURL(selectedFile);
     };
@@ -197,7 +210,7 @@ export function Tab5Documents() {
             return;
         }
         commitDocument({
-            id: editingDocumentId || generateId(),
+            id: editingDocumentId || '',
             existingDocumentId: existing.id,
             fileName: existing.file.name,
             categoryId: selectedCategory || editingDocument?.categoryId || 1,
@@ -208,7 +221,7 @@ export function Tab5Documents() {
             isShared,
             fileUrl: '',
             file: existing.file,
-        });
+        }, { createParentId: !editingDocumentId });
     };
 
     const handleSaveDocument = () => {
diff --git a/src/components/tenant-form/ui/PhotoUpload.tsx b/src/components/tenant-form/ui/PhotoUpload.tsx
index 095075c..2affb5b 100644
--- a/src/components/tenant-form/ui/PhotoUpload.tsx
+++ b/src/components/tenant-form/ui/PhotoUpload.tsx
@@ -10,6 +10,7 @@ import {
     MAX_TENANT_TOTAL_ATTACHMENT_BYTES,
     type TenantFormData,
 } from '../schema';
+import { generateId } from '../../../utils/id';
 
 interface PhotoUploadProps {
     name: string;
@@ -29,7 +30,7 @@ export function PhotoUpload({
     accept = '.jpg,.jpeg,.png,.webp',
 }: PhotoUploadProps) {
     const { control, getValues, setValue } = useFormContext<TenantFormData>();
-    const value = useWatch({ control, name: name as any }) as { name?: string; type?: string; size?: number; dataUrl?: string } | null;
+    const value = useWatch({ control, name: name as keyof TenantFormData }) as { name?: string; type?: string; size?: number; dataUrl?: string } | null;
     const [error, setError] = useState<string | null>(null);
     const inputRef = useRef<HTMLInputElement>(null);
     const maxBytes = Math.min(maxSizeMB * 1024 * 1024, MAX_TENANT_PHOTO_BYTES);
@@ -55,7 +56,7 @@ export function PhotoUpload({
         reader.onload = (event) => {
             const result = event.target?.result as string;
             const storedFile = {
-                id: `${name}-${file.lastModified}-${file.size}`,
+                id: '',
                 name: file.name,
                 type: file.type,
                 size: file.size,
@@ -68,14 +69,17 @@ export function PhotoUpload({
                 if (inputRef.current) inputRef.current.value = '';
                 return;
             }
-            setValue(name as keyof TenantFormData, storedFile as any, { shouldDirty: true, shouldValidate: true });
+            setValue(name as keyof TenantFormData, {
+                ...storedFile,
+                id: generateId('tenant-photo'),
+            } as never, { shouldDirty: true, shouldValidate: true });
         };
         reader.readAsDataURL(file);
     };
 
     const handleRemove = () => {
         setError(null);
-        setValue(name as any, null, { shouldDirty: true, shouldValidate: true });
+        setValue(name as keyof TenantFormData, null as never, { shouldDirty: true, shouldValidate: true });
         if (inputRef.current) {
             inputRef.current.value = '';
         }
diff --git a/src/components/tenant-form/ui/SimpleFileUpload.tsx b/src/components/tenant-form/ui/SimpleFileUpload.tsx
index de33a91..406adab 100644
--- a/src/components/tenant-form/ui/SimpleFileUpload.tsx
+++ b/src/components/tenant-form/ui/SimpleFileUpload.tsx
@@ -12,6 +12,7 @@ import {
     MAX_TENANT_TOTAL_ATTACHMENT_BYTES,
     type TenantFormData,
 } from '../schema';
+import { generateId } from '../../../utils/id';
 
 interface SimpleFileUploadProps {
     name: string;
@@ -43,14 +44,6 @@ const SUPPORTED_FILE_TYPES = [
     'image/webp',
 ];
 
-function storedFileId(name: string, file: File): string {
-    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
-        return `${name}-${crypto.randomUUID()}`;
-    }
-
-    return `${name}-${Date.now()}-${file.lastModified}-${file.size}`;
-}
-
 export function SimpleFileUpload({
     name,
     label,
@@ -69,7 +62,7 @@ export function SimpleFileUpload({
     const { control, getValues, setValue } = useFormContext<TenantFormData>();
     const value = useWatch({
         control,
-        name: name as any,
+        name: name as keyof TenantFormData,
     }) as DisplayedStoredFile | null;
     const [error, setError] = useState<string | null>(null);
     const inputRef = useRef<HTMLInputElement>(null);
@@ -124,7 +117,7 @@ export function SimpleFileUpload({
             }
 
             const storedFile = {
-                id: storedFileId(name, file),
+                id: '',
                 name: file.name,
                 type: file.type,
                 size: file.size,
@@ -148,8 +141,11 @@ export function SimpleFileUpload({
             }
 
             setValue(
-                name as any,
-                storedFile as any,
+                name as keyof TenantFormData,
+                {
+                    ...storedFile,
+                    id: generateId('tenant-file'),
+                } as never,
                 {
                     shouldDirty: true,
                     shouldValidate: true,
@@ -169,8 +165,8 @@ export function SimpleFileUpload({
 
     const handleRemove = () => {
         setValue(
-            name as any,
-            null,
+            name as keyof TenantFormData,
+            null as never,
             {
                 shouldDirty: true,
                 shouldValidate: true,
```

## Contenuto integrale file nuovi

### tests/tenant-form/TenantAttachmentNestedIds.integration.test.tsx

```tsx
// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultTenantValues, normalizeTenantFormData, type TenantFormData } from '../../src/components/tenant-form/schema';
import { tenantDraftDefinition } from '../../src/components/tenant-form/tenantDraftDefinition';
import { PhotoUpload } from '../../src/components/tenant-form/ui/PhotoUpload';
import { SimpleFileUpload } from '../../src/components/tenant-form/ui/SimpleFileUpload';
import { Tab5Documents } from '../../src/components/tenant-form/tabs/Tab5Documents';

const mocks = vi.hoisted(() => ({
    generateId: vi.fn(),
    documents: [] as Array<Record<string, unknown>>,
}));

vi.mock('../../src/utils/id', () => ({ generateId: mocks.generateId }));
vi.mock('../../src/db/jsonDb', () => ({
    getJsonDb: () => ({ documents: mocks.documents }),
}));

function Values({ name }: { name: keyof TenantFormData }) {
    const value = useWatch<TenantFormData>({ name });
    return <output data-testid="values">{JSON.stringify(value)}</output>;
}

function Harness({ children, name, values = {} }: {
    children: React.ReactNode;
    name: keyof TenantFormData;
    values?: Partial<TenantFormData>;
}) {
    const methods = useForm<TenantFormData>({ defaultValues: { ...defaultTenantValues, ...values } });
    return <FormProvider {...methods}>{children}<Values name={name} /></FormProvider>;
}

const file = (name = 'file.pdf', type = 'application/pdf') => new File(['content'], name, { type, lastModified: 10 });
const values = () => JSON.parse(screen.getByTestId('values').textContent || 'null');

afterEach(cleanup);
beforeEach(() => {
    vi.clearAllMocks();
    mocks.documents = [];
    const counters: Record<string, number> = {};
    mocks.generateId.mockImplementation((prefix: string) => {
        counters[prefix] = (counters[prefix] || 0) + 1;
        return `${prefix}-uuid-${counters[prefix]}`;
    });
});

describe('ID canonici allegati Tenant', () => {
    it('PhotoUpload genera dopo lettura, preserva rerender e rinnova su replace/remove/reupload', async () => {
        const view = render(<Harness name="TenantPhoto"><PhotoUpload name="TenantPhoto" label="Foto" /></Harness>);
        const input = view.container.querySelector('input[type="file"]') as HTMLInputElement;
        expect(mocks.generateId).not.toHaveBeenCalled();
        fireEvent.change(input, { target: { files: [file('photo.jpg', 'image/jpeg')] } });
        await waitFor(() => expect(values()?.id).toBe('tenant-photo-uuid-1'));
        expect(mocks.generateId).toHaveBeenCalledWith('tenant-photo');
        view.rerender(<Harness name="TenantPhoto"><PhotoUpload name="TenantPhoto" label="Foto" /></Harness>);
        expect(values().id).toBe('tenant-photo-uuid-1');
        fireEvent.change(input, { target: { files: [file('photo.jpg', 'image/jpeg')] } });
        await waitFor(() => expect(values()?.id).toBe('tenant-photo-uuid-2'));
        await userEvent.click(screen.getByRole('button', { name: '' }));
        expect(values()).toBeNull();
        expect(mocks.generateId).toHaveBeenCalledTimes(2);
        fireEvent.change(input, { target: { files: [file('photo.jpg', 'image/jpeg')] } });
        await waitFor(() => expect(values()?.id).toBe('tenant-photo-uuid-3'));
    });

    it('PhotoUpload non consuma ID per file rifiutato', () => {
        const view = render(<Harness name="TenantPhoto"><PhotoUpload name="TenantPhoto" label="Foto" /></Harness>);
        fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file('bad.txt', 'text/plain')] } });
        expect(values()).toBeNull();
        expect(mocks.generateId).not.toHaveBeenCalled();
    });

    it.each(['TenantIDCard', 'TenantIDCardBack', 'TenantCompanyRegistryFile'] as const)(
        'SimpleFileUpload %s usa tenant-file e rinnova replace/remove/reupload',
        async (name) => {
            const view = render(<Harness name={name}><SimpleFileUpload name={name} label={name} /></Harness>);
            const input = view.container.querySelector('input[type="file"]') as HTMLInputElement;
            fireEvent.change(input, { target: { files: [file()] } });
            await waitFor(() => expect(values()?.id).toBe('tenant-file-uuid-1'));
            fireEvent.change(input, { target: { files: [file()] } });
            await waitFor(() => expect(values()?.id).toBe('tenant-file-uuid-2'));
            await userEvent.click(screen.getByRole('button', { name: `Rimuovi ${name}` }));
            expect(values()).toBeNull();
            expect(mocks.generateId).toHaveBeenCalledTimes(2);
            fireEvent.change(input, { target: { files: [file()] } });
            await waitFor(() => expect(values()?.id).toBe('tenant-file-uuid-3'));
        },
    );

    it('SimpleFileUpload non consuma ID per file rifiutato', () => {
        const view = render(<Harness name="TenantIDCard"><SimpleFileUpload name="TenantIDCard" label="Documento" /></Harness>);
        fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file('bad.txt', 'text/plain')] } });
        expect(values()).toBeNull();
        expect(mocks.generateId).not.toHaveBeenCalled();
    });

    it('Tab5 crea parent/file distinti, preserva metadata/toggle e rinnova solo il file in replace', async () => {
        const user = userEvent.setup();
        render(<Harness name="TenantDocuments"><Tab5Documents /></Harness>);
        await user.click(screen.getByRole('button', { name: 'Nuovo documento' }));
        await user.selectOptions(screen.getByRole('combobox'), '1');
        fireEvent.change(document.querySelector('#tenant-document-upload')!, { target: { files: [file()] } });
        expect(mocks.generateId).not.toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(values()).toHaveLength(1));
        expect(values()[0]).toMatchObject({ id: 'tenant-document-uuid-1', file: { id: 'tenant-file-uuid-1' } });
        expect(values()[0].id).not.toBe(values()[0].file.id);
        await user.click(screen.getByTitle('Non condiviso'));
        expect(values()[0].id).toBe('tenant-document-uuid-1');
        await user.click(screen.getByTitle('Modifica'));
        await user.clear(screen.getByRole('textbox'));
        await user.type(screen.getByRole('textbox'), 'aggiornata');
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        expect(values()[0]).toMatchObject({ id: 'tenant-document-uuid-1', file: { id: 'tenant-file-uuid-1' }, description: 'aggiornata' });
        expect(mocks.generateId).toHaveBeenCalledTimes(2);
        await user.click(screen.getByTitle('Modifica'));
        fireEvent.change(document.querySelector('#tenant-document-upload')!, { target: { files: [file('replacement.pdf')] } });
        await user.click(screen.getByRole('button', { name: 'Salva' }));
        await waitFor(() => expect(values()[0].file.id).toBe('tenant-file-uuid-2'));
        expect(values()[0].id).toBe('tenant-document-uuid-1');
    });

    it('Tab5 collega file globale senza tenant-file e blocca il duplicato senza consumare ID', async () => {
        mocks.documents = [{
            id: 'global-document-1',
            file: { id: 'global-file-1', name: 'global.pdf', type: 'application/pdf', size: 7, lastModified: 1, dataUrl: 'data:x' },
        }];
        const user = userEvent.setup();
        render(<Harness name="TenantDocuments"><Tab5Documents /></Harness>);
        const link = async () => {
            await user.click(screen.getByRole('button', { name: 'Nuovo documento' }));
            await user.click(screen.getByRole('button', { name: 'Esistente' }));
            await user.selectOptions(screen.getByRole('combobox'), 'global-document-1');
            expect(mocks.generateId).not.toHaveBeenCalled();
            await user.click(screen.getByRole('button', { name: 'Salva' }));
        };
        await link();
        expect(values()[0]).toMatchObject({ id: 'tenant-document-uuid-1', existingDocumentId: 'global-document-1', file: { id: 'global-file-1' } });
        mocks.generateId.mockClear();
        await link();
        expect((await screen.findAllByText('Questo documento è già collegato a questo inquilino.')).length).toBeGreaterThan(0);
        expect(values()).toHaveLength(1);
        expect(mocks.generateId).not.toHaveBeenCalled();
    });

    it('draft e normalization preservano byte-for-byte tutti i sei ID senza generazione', () => {
        const payload = {
            ...defaultTenantValues,
            TenantFirstName: 'Ada',
            TenantLastName: 'Lovelace',
            TenantPhoto: { id: 'photo-legacy-test', name: 'p', type: 'x', size: 1, lastModified: 1, dataUrl: 'x' },
            TenantIDCard: { id: 'id-front-legacy-test', name: 'f', type: 'x', size: 1, lastModified: 1, dataUrl: 'x' },
            TenantIDCardBack: { id: 'id-back-legacy-test', name: 'b', type: 'x', size: 1, lastModified: 1, dataUrl: 'x' },
            TenantCompanyRegistryFile: { id: 'registry-legacy-test', name: 'r', type: 'x', size: 1, lastModified: 1, dataUrl: 'x' },
            TenantDocuments: [{ id: 'document-legacy-test', fileName: 'd', categoryId: 1, categoryLabel: 'x', description: '', uploadDate: '', fileSize: 1, isShared: false, fileUrl: '', file: { id: 'document-file-legacy-test', name: 'd', type: 'x', size: 1, lastModified: 1, dataUrl: 'x' } }],
        };
        for (const result of [normalizeTenantFormData(payload), tenantDraftDefinition.parse(payload, 1)]) {
            expect(result.TenantPhoto?.id).toBe('photo-legacy-test');
            expect(result.TenantIDCard?.id).toBe('id-front-legacy-test');
            expect(result.TenantIDCardBack?.id).toBe('id-back-legacy-test');
            expect(result.TenantCompanyRegistryFile?.id).toBe('registry-legacy-test');
            expect(result.TenantDocuments[0].id).toBe('document-legacy-test');
            expect(result.TenantDocuments[0].file?.id).toBe('document-file-legacy-test');
        }
        expect(mocks.generateId).not.toHaveBeenCalled();
    });
});
```

## Working tree finale

```text
 M src/components/tenant-form/tabs/Tab5Documents.tsx
 M src/components/tenant-form/ui/PhotoUpload.tsx
 M src/components/tenant-form/ui/SimpleFileUpload.tsx
?? fileModificati.md
?? tests/tenant-form/TenantAttachmentNestedIds.integration.test.tsx
```

## Conferme finali

- C1 semantics preservate: sì
- C2.1 preservata: sì
- C2.3 anticipata: no
- C3 anticipata: no
- C4 anticipata: no
- C5 anticipata: no
- C6 anticipata: no
- jsonDb modificato: no
- tenantRepository modificato: no
- schema modificato: no
- docs modificate: no
- browser QA: no
- staging: no
- commit: no
- push: no
- GitHub: no
- fileModificati.md destinato al commit: no
