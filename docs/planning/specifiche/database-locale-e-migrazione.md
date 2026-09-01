# Props24 — Database locale e migrazione futura

## 1. Destinazione approvata

Provider futuro approvato: Supabase. Database: PostgreSQL.

MongoDB non è il target corrente. Il database locale non deve imitare API proprietarie di Supabase, ma usare contratti di dominio e repository migrabili.

## 2. Obiettivi del database locale

Il database locale deve permettere test funzionali completi, isolamento account, schema versionato, migrazioni idempotenti, mutazioni atomiche e dati ricaricabili dopo refresh. La UI non accede direttamente a `localStorage`: usa repository, selettori, subscription coerenti ed errori di dominio. Non sono ammesse scritture parziali.

## 3. Campi trasversali

Dove applicabile:

```text
id
accountId
schemaVersion
createdAt
updatedAt
archivedAt
```

`id` usa identificativi canonici basati su UUID; i timestamp sono ISO; `accountId` è obbligatorio sui dati account-scoped. Nessun ID persistito nasce durante il render e `Date.now()` o `Math.random()` non sono ID definitivi. Le relazioni usano ID, non copie incontrollate.

La generazione dei nuovi ID persistenti usa l'utility canonica `generateId(prefix)`. La prima sorgente è `globalThis.crypto.randomUUID()`; quando non disponibile viene usato `globalThis.crypto.getRandomValues()` per costruire un UUID v4. Se non è disponibile una sorgente crittografica adeguata, la generazione fallisce esplicitamente invece di ricorrere a timestamp, `Math.random()` o contatori riavviabili.

`jsonDb.generateId` resta un re-export compatibile della stessa utility canonica. I prefissi semantici possono identificare il tipo di record, ma non modificano l'identità già assegnata.

Gli ID già persistiti, compresi quelli legacy, non vengono riscritti soltanto per uniformarne il formato. Normalizzazione, draft, validazione delle mutation, lettura e reload preservano l'ID esistente.

### ID annidati delle Unit

Gli ID annidati persistenti delle Unit seguono lo stesso contratto create-once/preserve-thereafter.

Sono coperti:

```text
PropertyCadastreDocument.id
PropertyKeys[].id
PropertyContracts[].id
PropertyContracts[].file.id
PropertyPhotos[].id
PropertyContacts[].id
PropertyDocuments[].id
PropertyDocuments[].file.id
```

L'ID nasce esclusivamente quando viene creato realmente un nuovo oggetto o file. Render, rerender, normalizzazione, draft, validazione della mutation, persistenza e reload non rigenerano un'identità già assegnata.

La modifica di un'entità annidata conserva il suo ID. La sostituzione reale di un file crea invece un nuovo oggetto file e quindi un nuovo file ID, senza modificare l'ID dell'entità parent. Gli ID legacy esistenti vengono preservati senza migrazione automatica del formato.

### ID annidati dei Tenant

Gli ID annidati persistenti dei Tenant seguono lo stesso contratto create-once/preserve-thereafter.

Sono coperti:

```text
TenantGuarantors[].id
TenantEmergencyContacts[].id
TenantPhoto.id
TenantIDCard.id
TenantIDCardBack.id
TenantCompanyRegistryFile.id
TenantDocuments[].id
TenantDocuments[].file.id
```

Le nuove relazioni Garante ed Emergency ricevono rispettivamente ID con prefisso `tenant-guarantor` e `tenant-emergency`; l'ID della relazione resta distinto dal `contactId` del `ContactRecord`.

Le nuove foto usano `tenant-photo`; i nuovi file Tenant usano `tenant-file`; i nuovi parent `TenantDocument` usano `tenant-document`. Nome file, dimensione, `lastModified`, timestamp e fingerprint analoghi non costituiscono identità persistente.

L'ID nasce esclusivamente quando un nuovo oggetto o file viene realmente acquisito e accettato dal form. Validazioni fallite, letture file fallite, superamento quota, render, rerender, refresh, normalizzazione e restore della bozza non consumano nuovi ID.

La modifica dei metadata conserva l'ID dell'entità e del file. Una reale sostituzione di file conserva l'ID del parent e genera soltanto un nuovo file ID. Quando un `TenantDocument` collega un documento globale già esistente, il parent Tenant riceve una propria identità mentre `existingDocumentId` e l'ID del file globale vengono preservati.

Normalizzazione, draft, `createTenant`, serializzazione JSON e reload preservano byte-for-byte gli ID già presenti, inclusi quelli legacy. Un database canonico con tutti gli ID presenti non richiede una scrittura di read-repair al semplice reload.

## 4. Repository

La UI non conosce chiavi di storage, formato fisico locale, dettagli Supabase o query SQL future. I repository offrono operazioni di dominio come `list`, `get`, `create`, `update`, `archive`, `restore`, eliminazione protetta e `subscribe` quando necessario. Le mutazioni multirecord sono una singola operazione atomica.

### Pilot implementato: contacts

Il dominio contatti costituisce il primo pilot concreto del confine repository:

- espone una porta di dominio asincrona `ContactRepository`;
- offre `list`, `getById`, `create`, `update`, `archive`, `restore`, `canDelete`, `delete` e `subscribe`;
- usa `subscribe` come invalidazione senza payload, lasciando al consumer una nuova lettura;
- l'adapter locale cattura l'`accountId` al momento della composizione;
- il repository non cambia account quando cambia lo stato globale;
- scritture e notifiche dello storage raggiungono soltanto l'account corretto;
- il gateway globale legacy resta temporaneamente compatibile per i consumer non ancora migrati;
- la composizione del repository avviene sotto l'app autenticata;
- `useContactList` gestisce caricamento iniziale, conservazione della lista precedente durante loading o error, retry, subscription con reference counting, risposte fuori ordine e completamenti dopo la disconnessione;
- `LeaseForm` e `AddGuarantorModal` usano il nuovo percorso repository per i garanti;
- i Garanti di Nuovo inquilino e i Contatti di emergenza usano la stessa rubrica `ContactRecord` tramite `useContactList` e `ContactRepository`, conservando `contactId` come riferimento canonico distinto dall'ID della relazione Tenant;
- i riferimenti Tenant linked preservano archived, missing e stati temporaneamente non verificabili senza matching euristico o cancellazioni implicite; i dati canonici Contact restano read-only nei consumer Tenant, mentre `comments` e `isPrimary` restano metadata della relazione;
- proprietà e inquilini usati da `LeaseForm` passano ancora dal gateway globale;
- il pilot non implica che tutti i domini o consumer siano già migrati;
- non introduce SDK Supabase, backend, SQL o Realtime.

### Contratto approvato per il completamento Contact–Tenant

Il ciclo C completa il pilot contacts senza introdurre ancora la futura view Rubrica.

`ContactRecord` resta l'identità canonica della rubrica. Lease e Tenant non devono creare copie indipendenti dello stesso concetto come nuova fonte canonica.

Le relazioni Contact del Tenant conservano un proprio `id` persistente e un `contactId` distinto che punta al `ContactRecord`. Il `contactId` resta opzionale per compatibilità con i Tenant legacy già persistiti senza relazione esplicita.

I record legacy inline vengono preservati. La normalizzazione non cerca automaticamente un Contact corrispondente mediante nome, email, telefono, CF, partita IVA o altre euristiche e non crea Contact durante una semplice lettura o migrazione.

I metadati della relazione non vengono spostati sul Contact globale. `isPrimary` dei contatti di emergenza resta quindi una proprietà Tenant-specific.

Il lifecycle Contact comprende `restore`. La delete protection considera sia `Lease.guarantorIds` sia i `contactId` persistiti nelle relazioni Contact dei Tenant. Un riferimento attivo impedisce la delete senza cascade impliciti.

Un Contact creato esplicitamente dall'utente mediante `ContactRepository.create` è una mutazione autonoma della rubrica e può esistere senza Tenant o Lease collegati. Non viene cancellato automaticamente quando un form Tenant viene abbandonato o la successiva create Tenant fallisce.

La create atomica C4 riguarda il record Tenant e l'integrità dei riferimenti persistiti: non deve produrre Tenant parziali o `contactId` dangling. Non deve invece eseguire rollback di Contact autonomi precedentemente creati con un'azione esplicita dell'utente.

La canonicalizzazione degli ID annidati Tenant è completata e consolidata da C2. L'enforcement dei duplicati fiscali account-scoped CT-01–CT-05 è completato e consolidato da C3 per `ContactRepository.create/update` e per la create Tenant corrente.

### Identità fiscale locale di Contact e Tenant

C3 mantiene separate le identità persistenti `ContactRecord` e `TenantRecord`. Il duplicate check è account-scoped all'interno della rispettiva collezione e non introduce un vincolo fiscale incrociato fra `contacts` e `tenants`.

Per `ContactRecord` il modello fiscale corrente resta:

```text
type
fiscalCode
vatNumber
```

Semantica:

- `type = person`: `fiscalCode` è l'unica chiave fiscale hard-block;
- `type = company`: `fiscalCode` identifica fiscalmente l'ente e `vatNumber`, quando valorizzata, è una seconda chiave hard-block;
- `vatNumber` di un Contact persona non costituisce chiave hard-block;
- valori vuoti non collidono.

Per `TenantRecord` viene distinta l'identità della persona fisica dall'identità dell'ente.

Il modello comprende:

```text
fiscalCode
vatNumberPersonal
companyFiscalCode
vatNumber
```

Semantica:

```text
Tenant person
fiscalCode → CF della persona

Tenant company
companyFiscalCode → CF dell'ente
vatNumber         → P.IVA dell'ente

Tenant company / rappresentante legale
fiscalCode        → CF del rappresentante
vatNumberPersonal → eventuale P.IVA personale del rappresentante
```

`fiscalCode` e `vatNumberPersonal` del rappresentante legale non costituiscono identità fiscale della società.

Il form Tenant espone il nuovo campo:

```text
TenantCompanyFiscalCode
```

che viene persistito in:

```text
TenantRecord.companyFiscalCode
```

I record Tenant company legacy che non possiedono `companyFiscalCode` vengono normalizzati con stringa vuota. Non viene copiato o reinterpretato automaticamente il precedente `fiscalCode`, perché potrebbe appartenere al rappresentante legale.

Il confronto fiscale usa business rules condivise e deterministiche. `ContactRepository.create` e `ContactRepository.update` eseguono il controllo prima della scrittura definitiva; l'update Contact esclude il record corrente tramite ID. La create Tenant esegue lo stesso controllo prima della generazione e persistenza del nuovo Tenant.

L'update Tenant reale non è ancora implementato e appartiene a C5. Quando verrà introdotto dovrà riusare le stesse pure business rules C3, escludendo il Tenant corrente tramite ID invece di duplicare la logica fiscale.

Anche i record archived partecipano al controllo dei duplicati; account differenti restano isolati e possono contenere gli stessi identificativi. Contact e Tenant vengono confrontati esclusivamente all'interno della propria collezione: non esiste hard block fiscale `Contact ↔ Tenant`.

Email, telefono, nome, indirizzo, SIRET e SIREN non sono chiavi hard-block correnti. Identificatori fiscali vuoti non collidono e i Tenant company legacy privi di `companyFiscalCode` non ricevono inferenze dal `fiscalCode` del rappresentante legale.

## 5. Bozze separate

L'archivio bozze è separato dai record definitivi e usa almeno:

```text
id
accountId
formType
mode
entityId opzionale
payload
schemaVersion
createdAt
updatedAt
```

`formType` distingue almeno `building`, `property`, `tenant`, `lease`; `mode` distingue `create` ed `edit`.

Caricare una bozza non crea entità definitive. La bozza è aggiornata soltanto manualmente, resta dopo l'abbandono di modifiche non salvate, viene eliminata dopo submit riuscito ed è eliminabile esplicitamente all'apertura del form. Gli allegati già supportati localmente possono ancora contribuire alla dimensione del JSON delle bozze; quota, performance e strategia di migrazione restano da verificare nelle task dedicate. Il modello di produzione non deve affidarsi a Data URL persistenti senza limiti.

Il repository condiviso è implementato con contratto asincrono e adapter locale account-scoped. Usa chiavi logiche per form, modalità ed eventuale entità, schema canonico versionato e migrazione delle forme legacy; non dipende da una singola chiave globale. I payload restano specifici per ciascun form e vengono validati dalla relativa definition. La baseline persistita è clonata e non viene mutata dalle modifiche dirty del form.

Nuovo inquilino, Nuova unità, Nuova locazione e Nuovo edificio usano il repository condiviso, il caricamento iniziale con ripresa o cancellazione, save manuale, delete esplicita e cleanup post-submit. Non esiste alcuna bozza globale.

La bozza create del Tenant può conservare relazioni Contact con `contactId` già esistenti o creati esplicitamente dall'utente. Riprendere, normalizzare o visualizzare la bozza non crea nuovi Contact e non cancella Contact già esistenti.

Il caricamento asincrono o il refresh della rubrica non modifica da solo il payload della bozza, non rende dirty il form e non produce autosave. Riferimenti Contact archiviati, mancanti o temporaneamente non verificabili vengono preservati finché l'utente non esegue un'azione esplicita.

Un Contact creato esplicitamente mentre il form Tenant è aperto è già una voce autonoma della rubrica: `Abbandona`, eliminazione della bozza o fallimento della create Tenant non ne comportano la cancellazione automatica.

La modifica di una Unit usa una bozza account-scoped con chiave logica `formType: property`, `mode: edit` ed `entityId` uguale all'ID della Unit. La bozza edit è distinta dalla bozza create e dalle bozze edit di altre entità. La baseline iniziale deriva dal record persistito; il salvataggio è soltanto manuale e il restore produce inizialmente uno stato non dirty. `Abbandona` ripristina l'ultima baseline salvata senza eliminare la bozza persistita.

Dopo un update definitivo riuscito il cleanup della bozza è una mutazione separata. Se il cleanup fallisce, il record già aggiornato viene preservato e il recovery ritenta esclusivamente la cancellazione della bozza senza ripetere `updateProperty`.

La bozza create di Nuova locazione è account-scoped e usa la chiave logica `formType: lease`, `mode: create`, `entityId: null`. Il payload è validato e salvato soltanto manualmente; `activeTab` viene persistita senza contribuire al dirty. La riconciliazione preserva gli ID Property, Tenant e Guarantor e il restore non crea entità definitive.

`createLease` persiste atomicamente il dominio Lease previsto, inclusi pagamenti, deposito e relazioni, ma non cancella la bozza nella stessa mutazione. Dopo il successo, `DraftRepository` esegue il cleanup F1 come mutazione separata. Se la delete fallisce, la locazione già creata viene preservata e il recovery ritenta esclusivamente la cancellazione della bozza: non esegue rollback e non richiama `createLease`. Un submit lock sincrono create-only impedisce una seconda create concorrente dallo stesso form montato.

## 6. Storico append-only

L'archivio eventi di audit è separato e usa concettualmente:

```text
id
accountId
entityType
entityId
operation
reasonCode
reasonText opzionale
changedFields
before
after
actorAccountId
createdAt
```

Gli eventi sono immutabili, cronologici, contengono snapshot precedente e successivo, non includono dati sensibili non necessari e supportano inizialmente le locazioni, con estensione futura ad altri domini. Sono conservati a tempo indefinito e non hanno scadenza automatica.

## 7. Unicità delle unità

Ogni unità ha sempre un identificativo interno canonico basato su UUID. Quando i dati catastali ufficiali sono completi, la chiave normalizzata account-scoped usa Paese, Codice Comune, Terreni/Urbano, Sezione Urbana o Comune Catastale quando presente, Foglio, Particella e Subalterno quando presente.

La normalizzazione gestisce spazi e maiuscole/minuscole, conserva gli zeri significativi, distingue i campi assenti e viene verificata in create ed edit escludendo il record corrente. Indirizzo, piano e interno non costituiscono identità catastale ufficiale.

Senza dati sufficienti per costruire la chiave catastale completa non si esegue alcun controllo duplicati alternativo basato su indirizzo, edificio, scala, piano, interno o fingerprint.

Le nuove mutazioni `create` e `update` bloccano atomicamente una chiave catastale completa già presente nello stesso account mediante un errore di dominio specifico. `PropertyTitle`, indirizzo e relazione con il Building non costituiscono vincoli alternativi di unicità della Unit; in update il record corrente è escluso dal confronto.

Una collisione catastale completa già presente in un database legacy viene invece preservata e segnalata dalla validation come `PROPERTY_CADASTRAL_KEY_DUPLICATE` con severità `warning`: non costituisce corruzione strutturale del database. Il caricamento non elimina record, non rinomina `PropertyTitle`, non modifica i riferimenti catastali e non introduce repair automatici per scegliere o riscrivere una delle unità coinvolte.

## 8. Edifici e unità

Relazioni canoniche:

```text
unit.relations.buildingId
building.unitsCount derivato
```

Non si duplicano oggetti edificio nelle unità. `building.unitsCount` deriva dai dati reali.

Il lifecycle delle Unit è account-scoped e comprende archive, restore e delete singole, oltre a operazioni bulk atomiche. Archivio e ripristino preservano `unit.relations.buildingId` e non modificano `building.unitsCount`. Il ripristino della Unit resta consentito anche quando il Building collegato è archiviato.

L'eliminazione di una Unit libera collegata a un Building è consentita e ricalcola `building.unitsCount`. Il Building collegato non costituisce di per sé un blocker della delete.

La delete della Unit è invece bloccata da qualunque Lease persistente con `lease.propertyId` corrispondente e da qualunque Payment persistente con `payment.propertyId` corrispondente, indipendentemente dal loro stato corrente o storico. Le relazioni derivate `tenantIds` e `leaseIds` non costituiscono blocker autonomi e non viene eseguito alcun cascade.

Le operazioni bulk validano l'intero insieme prima della scrittura e sono atomiche: se almeno una Unit della delete è bloccata, non viene eliminata nessuna Unit dell'insieme.

L'eliminazione dell'edificio resta separata ed è bloccata dalle relazioni non gestite. L'identificativo edificio è univoco per account. Nello stesso account, stesso indirizzo completo e stesso civico identificano lo stesso edificio; il suffisso è parte del civico e le divisioni interne non producono nuovi edifici.

## 9. Allegati e storage futuro

Nella fase locale alcuni allegati supportati possono ancora essere persistiti come Data URL nel database JSON locale. È una soluzione temporanea di collaudo, non il modello di produzione.

Il target prevede metadati nel database e binari in storage dedicato. IndexedDB può essere una soluzione locale temporanea e Supabase Storage è il candidato naturale per il backend.

Password e codici sensibili presenti nei flussi locali sono dati di test e non costituiscono una soluzione di sicurezza di produzione; in produzione non devono essere memorizzati in chiaro.

## 10. Migrazione verso Supabase/PostgreSQL

La migrazione sostituirà l'implementazione dei repository senza riscrivere i form. Il pilot contacts e il repository bozze condiviso sono verifiche concrete di questo confine, ma non costituiscono un'implementazione Supabase e non rendono ancora ogni form indipendente da `jsonDb`. La migrazione dovrà prevedere mapping dei record locali, migrazioni versionate, validazione prima dell'import, report degli scarti, idempotenza, isolamento account, transazioni, vincoli univoci, foreign key, Row Level Security, storage separato e rollback.

Supabase non viene implementato in questa task.

## 11. Sicurezza dei dati

I dati locali attuali sono di test e Desktop può crearli, modificarli o eliminarli durante QA autorizzato. Prima dei dati reali serve un gate di produzione; i prompt futuri devono distinguere test e produzione. Sviluppo e collaudo non devono modificare o cancellare dati di produzione.

## 12. Pagamenti legacy, repair e migrazione locale

### Normalizzazione conservativa

Soltanto `paid`, `pending` e `late` sono status riconosciuti. Uno status assente o sconosciuto non costituisce prova dell'incasso e viene normalizzato conservativamente come non pagato. `paidDate` non viene derivata dal metodo contrattuale, incluso l'addebito.

I record incoerenti vengono ricondotti a `late` o `pending` secondo scadenza e data di riferimento, senza inventare `paidDate`, `confirmation` o `receiptNumber`.

### Preservazione e ricostruzione

Le collezioni di pagamenti non vuote vengono preservate e normalizzate. Nessuna euristica sulla forma degli ID o su singole anomalie può eliminarle o sostituirle integralmente.

Le cronologie legacy vuote vengono ricostruite mediante il calendario contrattuale esistente. Le rate generate ricostruite sono esclusivamente `late` o `pending`, non sono `paid` e non producono spese sintetiche.

### Deduplicazione delle rate generate

Le rate generate duplicate usano la chiave:

```text
leaseId + category + dueDate
```

La selezione segue, nell'ordine, l'evidenza disponibile:

```text
confirmation coerente
paid con paidDate
non pagato
updatedAt
ID stabile
```

I pagamenti manuali non vengono deduplicati.

### Persistenza del repair

Il caricamento di un database account segue il flusso:

```text
lettura
→ normalizzazione e repair
→ confronto con il valore memorizzato
→ scrittura soltanto se differente
→ rilettura e verifica
→ cache
```

L'idempotenza deriva dai dati memorizzati, senza marker separati e senza aggiornamenti artificiali di `meta.updatedAt`: la seconda inizializzazione non riscrive un database già canonico. Durante una migrazione le sorgenti legacy non vengono rimosse prima della scrittura e verifica del database account. In caso di errore resta invariato il fallback in memoria.

### Consumer finanziari

Le metriche di cassa richiedono `status: paid` e una `paidDate` valida. `accountingRole` separa `revenue`, `expense` e `deposit`: lo scaduto considera soltanto `revenue`, mentre i movimenti `deposit` non entrano nei KPI generali di ricavo e spesa.

## Collegamenti

- [Fase locale prioritaria](./fase-locale-prioritaria.md)
- [Specifica Nuovo edificio](./nuovo-edificio.md)
- [Decisioni da validare](../decisioni-da-validare.md)