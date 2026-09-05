# Props24 — Implementazioni residue

## 1. Scopo

Questo documento contiene esclusivamente:

- modifiche ancora necessarie;
- decisioni ancora richieste all’utente;
- dipendenze tra le task;
- file da verificare;
- criteri di chiusura;
- collaudi ancora da eseguire.

Non è:

- documentazione dell’architettura corrente;
- cronologia delle modifiche;
- raccolta di prompt già eseguiti;
- elenco delle funzionalità già completate;

Stato verificato sul repository:

```txt
Repository: Pixelpro-agency/Props24
Branch: main
SHA applicativo esaminato: 4007e98e9f821ffe15b4724303d138f99307b70d
```

Le task completate non vengono replicate in questo documento. Il loro stato sintetico è mantenuto nella Todo list, mentre cronologia, evidenze tecniche e modifiche restano nella storia Git e nei test. Le sezioni seguenti contengono esclusivamente attività residue o task parziali con componenti ancora aperte.

## Mappa dei documenti

- [Todo list e stato di avanzamento](./todo-list.md)
- [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md)
- [Database locale e migrazione Supabase](./specifiche/database-locale-e-migrazione.md)
- [Specifica Nuovo edificio](./specifiche/nuovo-edificio.md)
- [Ruoli, inviti e workspace](./specifiche/ruoli-inviti-e-workspace.md)
- [Decisioni da validare](./decisioni-da-validare.md)
- [Schema PostgreSQL/Supabase target](./specifiche/schema-supabase.md)

Questo documento conserva il dettaglio delle task residue; la Todo list ne mostra lo stato sintetico e il registro delle decisioni conserva le decisioni ancora operative per il lavoro non concluso.

## 2. Regole operative

Ogni prompt deve seguire:

- `docs/Metodologia/ruoli-e-flusso-operativo-props24.md`;
- `docs/Metodologia/regole-prompt-esecutivi-props24.md`.

Regole minime:

- una sola task verificabile;
- Chat Analisi responsabile di analisi, prompt e revisione;
- modalità Desktop esplicita, scelta tra:
  - `DESKTOP_ESECUTORE`: modifica locale dei soli file autorizzati e controlli tecnici;
  - `DESKTOP_COLLAUDATORE`: collaudo locale indipendente senza modifica dei file;
- file modificabili e file consultabili separati;
- nessun refactor fuori scope;
- massimo tre tentativi ragionati;
- test tecnici mirati;
- `fileModificati.md` obbligatorio e sovrascritto per ogni `DESKTOP_ESECUTORE`;
- `fileModificati.md` non richiesto per `DESKTOP_COLLAUDATORE`;
- nessun commit o push eseguito da Desktop;
- revisione locale della Chat Analisi prima della pubblicazione;
- commit e push su `main` eseguiti dall’utente soltanto dopo l’approvazione;
- branch separati e pull request soltanto quando richiesti esplicitamente.

Flusso Git, revisione e collaudo:

1. la Chat Analisi delimita la task e prepara il prompt;
2. l’utente prepara localmente `main` e consegna il prompt a Desktop;
3. Desktop Esecutore modifica i file, esegue i controlli e crea `fileModificati.md`;
4. la Chat Analisi revisiona l’intero stato locale tramite l’artefatto e il report;
5. eventuali fix usano un nuovo prompt `DESKTOP_ESECUTORE` e sovrascrivono l’artefatto;
6. quando necessario, un prompt separato `DESKTOP_COLLAUDATORE` esegue il collaudo;
7. soltanto dopo l’approvazione la Chat Analisi fornisce i comandi finali;
8. l’utente elimina l’artefatto temporaneo, crea il commit e fa push su `main`.

Non:

- ripristinare o inventare smoke test;
- correggere il lint globale come effetto collaterale;
- applicare il vecchio vincolo “una sola chiave `props24.localDb`”;
- cancellare chiavi auth o database account-scoped;
- introdurre backend o servizi esterni dentro task locali non correlate;
- riaprire l’intero flusso Nuova locazione per correggere un difetto isolato;
- dichiarare successo quando un’azione produce soltanto `console.log`, un toast o un modal senza mutazione reale.

## 3. Decisioni e materiali necessari

### 3.1 Funzioni future, route e servizi esterni

Le funzioni non disponibili restano visibili quando utili, gialle, realmente disabilitate, non cliccabili e accompagnate da spiegazione. Non usano route fittizie o falsi successi. La convenzione è definita nella [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md).

### 3.2 Supabase, backend e produzione

La destinazione approvata è Supabase con PostgreSQL e il relativo Blocco S è ora la priorità tecnica corrente.

La fase locale già costruita non viene considerata lavoro da buttare: costituisce la baseline funzionale e di dominio da preservare. Devono invece essere sostituiti progressivamente lo storage runtime locale, l'autenticazione simulata, i seed runtime temporanei e gli adapter specifici del database JSON quando non avranno più consumer.

H1, H2 e H3 non vengono automaticamente chiuse dal Blocco S:

- S2 implementa Supabase Auth, Profile/Workspace/Membership e RLS minimi necessari alla persistence condivisa; H1 conserva hardening, recupero credenziali e altri flussi di autenticazione di produzione non necessari al primo ambiente condiviso;
- S2 implementa soltanto workspace, membership e authorization minimi; H2 conserva portale inquilino, multi-ruolo completo, deleghe e permission model avanzato;
- la foundation Supabase Storage viene introdotta già in S2, il relativo port/adapter in S3 e i file dei domini vengono migrati progressivamente in S5/S6; S7 consolida il dominio documentale ed elimina Data URL e persistence locale residua;
- H3 conserva quindi esclusivamente il modello documentale/autorizzativo avanzato non necessario al cutover iniziale, comprese eventuali policy avanzate di sharing, quote, deduplicazione, retention e access grants.

# BLOCCO B — Unità

## TASK B7 — Import ed export unità

**Stato:** rinviata.

**Obiettivo:**

- Importa ed Esporta restano visibili;
- stile giallo;
- controlli realmente disabilitati;
- nessuna route o successo simulato;
- implementazione futura con formato, validazione, errori e rollback definiti da task dedicata.

## TASK B8 — Analisi catastale futura

**Origine:** commento in `Tab2Additional.tsx`.

**Stato:** richiede backend e servizio documentale.

**Obiettivo futuro:**

- etichetta UI futura “Carica visura” e caricamento manuale;
- visura catastale distinta dalla visura camerale;
- OCR/analisi futura del documento catastale;
- estrazione di foglio, particella, subalterno, categoria, rendita e altri riferimenti catastali;
- qualità e completezza;
- validazione dei dati estratti;
- anteprima e autorizzazione esplicita, con fonte e trattamento dichiarati;
- conferma utente prima della compilazione automatica;
- distinzione tra file salvato e documento realmente verificato.

Riferimento visuale: [colonne della visura catastale](./riferimenti%20catastali%20-%20colonne%20visura%20catastale%20agenzia%20delle%20entrate%20tramite%20CF.png).

## TASK B9R — Verifiche browser residue delle Unit

**Stato:** in attesa di strumento adeguato.

B9 è conclusa con PASS funzionale e nessun finding applicativo riproducibile. Restano tuttavia alcune verifiche browser dirette che non è stato possibile eseguire per limiti dello strumento Chrome utilizzato nel collaudo.

Quando il tooling consentirà file chooser reale e accesso read-only affidabile allo storage browser, rieseguire esclusivamente:

- B9-06 — caricamento reale degli allegati tramite file chooser e verifica della loro persistenza dopo submit e reload;
- B9-07 — lettura degli ID annidati persistiti dopo la creazione della Unit;
- B9-13 — doppio submit della create osservato tramite interazione browser reale, verificando la creazione di una sola Unit;
- B9-15 — confronto degli ID annidati prima e dopo reload;
- B9-20 — confronto degli ID annidati prima e dopo edit, senza sostituzione dei relativi oggetti o file;
- B9-35 — confronto read-only dello storage prima e dopo lista, dettaglio, cambio scheda senza modifiche e reload, verificando l'assenza di scritture persistite non motivate.

Queste verifiche residue non riaprono B9 e non costituiscono finding applicativi. I contratti interessati sono già coperti dai test automatizzati B4/B6; B9R conserva esclusivamente il debito di verifica browser diretta e potrà essere chiusa quando lo strumento permetterà di osservare realmente tali comportamenti.

Le verifiche che dipendono dalla persistence/storage devono essere rieseguite contro l'authority effettiva al momento del collaudo. Dopo il cutover del Blocco S non devono richiedere l'ispezione del vecchio `localStorage`; B9-35 dovrà verificare l'assenza di mutation read-only sulla nuova authority Supabase.

## TASK B9A — Card e KPI unità

**Stato:** futuro.

Le card future definite sono:

- Affittate;
- Valore locativo;
- Valore patrimoniale;
- Guadagno lordo, basato sugli incassi effettivi nel periodo;
- Guadagno netto, al netto di tasse e costi realmente disponibili.

Affittate = unità non archiviate collegate a una locazione attiva secondo lo stato canonico della locazione. Valore patrimoniale usa il valore di acquisizione; un selettore comune offre Ultimo mese, Anno corrente, Ultimi 12 mesi e Dall'inizio; dati assenti non valgono zero e sono segnalati come incompleti. Il Tasso di occupazione è futuro per affitti brevi; la Copertura locativa è soprattutto aggregata e non è una card standard della singola unità tradizionale.

# BLOCCO C — Inquilini e contatti

Nel Blocco C non restano attività operative non-future. Le attività residue autonome sono C7 — Inviti email, C9 — Verifica documentale/OCR e C10A — Card inquilini.

La precedente C8 — Allegati delle bozze — è stata assorbita dal Blocco S dopo S0.12: modello file/draft in S1, Storage port in S3, file Property/Tenant in S5 e cleanup finale dei Data URL in S7. Non introdurre una soluzione IndexedDB intermedia.

## TASK C7 — Inviti email

**Origine:** commento in `TenantsPage.tsx`.

**Obiettivo futuro:**

- servizio email reale;
- stato invito distinto da invio effettivo;
- gestione errori e retry;
- nessun messaggio che implichi invio quando è stato aggiornato soltanto lo stato locale.
- invito manuale e distinto per partecipante, associato atomicamente ad account, email, partecipante e locazione;
- stati `non_preparato`, `pronto`, `inviato`, `accettato`, `scaduto`, `revocato`, `fallito`;
- sezione dell’invito visibile anche senza email, ma invio indisponibile o disabilitato finché manca un’email valida;
- “Invia” disponibile con email valida e nessun invito attivo;
- “Reinvia” disponibile soltanto negli stati compatibili;
- “Revoca” disponibile soltanto quando esiste un invito revocabile;
- nessuna azione deve fingere un invio reale;
- accettazione esplicita, collegamento account–partecipante e accesso limitato a “Le mie locazioni”.

## TASK C9 — Verifica documentale/OCR

**Origine:** commenti in `Tab1General.tsx`.

**Stato:** richiede backend.

Comprende:

- carta d’identità fronte/retro;
- leggibilità, completezza, scadenza e coerenza;
- visura camerale completa;
- data di emissione;
- pagine, QR code e codici ufficiali;
- estrazione dati soltanto dopo verifica;
- conferma utente prima della compilazione;
- stati UI che distinguano “file salvato” da “documento verificato”.

## TASK C10A — Card inquilini

Le tre card approvate sono:

- Attivi = inquilini non archiviati;
- Connessi = inquilini con invito accettato e account collegato;
- Con locazione = inquilini distinti presenti in almeno una locazione attiva.

Gli stati degli inviti restano documentati nella TASK C7 e non sostituiscono le tre card principali della lista inquilini. Non aggiungere altre card senza una decisione separata.

# BLOCCO D — Locazioni e pagamenti

## TASK D1 — Data finale sicura

**Stato:** resta da implementare D1B — Override motivato e storico.

### D1B — Override motivato e storico

**Influenze:** PA-06 e PA-07.

- override manuale esplicito;
- motivo obbligatorio;
- catalogo minimo:
  - `Decesso`;
  - `Sequestro o provvedimento dell'autorità`;
  - `Sfratto`;
  - `Altro`;
- spiegazione obbligatoria per `Altro`;
- storico append-only;
- conservazione a tempo indefinito, senza scadenza automatica;
- valore precedente e successivo;
- campi modificati;
- autore;
- timestamp.

D1B deve essere implementata con una task separata e non deve essere accorpata a D2.

Riferimenti: [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md) e [Database locale e migrazione Supabase](./specifiche/database-locale-e-migrazione.md).

## TASK D2 — Addebito senza incasso automatico

**Stato:** D2A, D2B e D2C sono completate; resta aperta esclusivamente D2D.

### D2D — Eccezioni ancora da decidere

**Decisioni collegate:** PA-10, PA-11 e PA-12.

- semantica dell’affitto prepagato ancora da validare;
- politica di conservazione o annullamento del numero ricevuta quando un pagamento torna non pagato;
- eventuale conservazione, annullamento o invalidazione della `confirmation` precedente dopo il ritorno a non pagato.

Pagamenti parziali e documenti di pagamento sono futuri.

**Casi ancora dipendenti da D2D o D3:**

- rinnovo;
- politica ricevute e trattamento della `confirmation` precedente;
- semantica del prepagato;
- regressione complessiva della locazione.

## TASK D3 — Regressione locazione mirata

**Decisioni collegate:** PA-10, PA-11, PA-12 e PA-13.

Verificare:

- date, inclusi 29 febbraio e 30 aprile;
- durate 36, 48, 72 e 108 mesi;
- cambio data iniziale e cambio tipo;
- edit con data presente;
- stati rate;
- deposito escluso dai ricavi;
- prepagato senza doppio ricavo;
- contratto e snapshot;
- edit;
- firma locale;
- nessuna regressione dei flussi già completati.

### D3A — Terminologia e card locazioni

Usare “Deposito cauzionale”. Le tre card approvate sono:

- Attive = locazioni non archiviate che risultano attive secondo lo stato canonico e il periodo della locazione;
- Canoni di affitto;
- Depositi cauzionali.

Canoni di affitto e Depositi cauzionali restano subordinati a KPI-03 per base temporale e distinzione tra valori contrattuali e incassi reali. Non modificare modelli dati o nomi tecnici persistiti.

# BLOCCO E — Preferenze — riallineamento S0.12

Le precedenti E1 ed E2 non costituiscono più task operative autonome.

La visibilità colonne corrente è una preferenza UI/browser-local e non deve essere trasferita nel database business Supabase soltanto per renderla persistente. `properties-column-visibility`, `tenants-column-visibility` e preferenze analoghe possono restare locali salvo futura decisione esplicita di sincronizzazione cross-device.

L'audit dello storage/persistence locale previsto da E2 è stato assorbito da S0.1, S0.2, S0.9, S0.10 e S0.11. Il controllo conclusivo dei residui appartiene a S7 — Final storage audit.

# BLOCCO S — Supabase e persistenza condivisa

## Scopo

Il Blocco S sostituisce progressivamente l'attuale persistenza runtime locale con Supabase/PostgreSQL per consentire:

* un database condiviso fra più collaboratori;
* test realistici dei CRUD già implementati;
* verifica delle relazioni e delle business rule su persistenza reale;
* autenticazione e isolamento server-side minimi;
* sviluppo successivo del progetto sulla nuova authority di persistenza;
* eliminazione finale del database JSON locale, dei seed runtime temporanei e del codice di compatibilità non più necessario.

Non è una semplice copia di `database.json` dentro PostgreSQL.

La migrazione deve distinguere:

* contratti di dominio da preservare;
* business rule da preservare;
* repository e port da mantenere o adattare;
* adapter locali da sostituire;
* reader/writer ancora accoppiati direttamente a `jsonDb`;
* dati di test da non migrare;
* codice legacy da eliminare soltanto dopo il cutover verificato.

## Baseline da preservare

I comportamenti già consolidati nei Blocchi A, B e C restano contratti applicativi.

La migrazione non deve modificare implicitamente:

* identità canoniche e ID persistiti;
* duplicate rule;
* relazioni tramite ID;
* lifecycle;
* delete protection;
* atomicità delle operazioni bulk;
* business rule fiscali;
* integrità Contact–Tenant;
* Building–Property;
* Tenant–Lease;
* Property–Lease;
* Payment–Lease;
* draft create/edit e logical key;
* guard delle modifiche non salvate;
* semantica corrente dei pagamenti;
* isolamento dei dati;
* read-model già approvati.

Una modifica a uno di questi contratti richiede una task funzionale esplicita e non può essere introdotta come semplice conseguenza tecnica della migrazione.

## Principi obbligatori della migrazione

### 1. Nessun big-bang

La migrazione avviene per dominio e per authority.

Il database locale può continuare temporaneamente a servire i domini non ancora migrati, ma ogni dominio deve avere in ogni momento una sola authority runtime dichiarata.

### 2. Nessun dual-write implicito

Non introdurre, salvo task esplicitamente progettata e verificata, scritture parallele dello stesso dato su localStorage e Supabase.

Una write Supabase fallita non deve produrre un fallback silenzioso sul database locale.

Il fallback silenzioso creerebbe due authority divergenti.

### 3. Cutover esplicito

Per ogni dominio devono essere identificati:

* reader;
* writer;
* repository/port;
* adapter;
* consumer;
* subscription;
* test;
* authority prima del cutover;
* authority dopo il cutover.

Il codice locale viene eliminato soltanto quando non esistono più consumer runtime del vecchio adapter.

### 4. Repository prima dello storage

La UI non deve conoscere:

* localStorage;
* SQL;
* dettagli fisici delle tabelle;
* query Supabase non appartenenti al proprio adapter.

Quando un dominio usa ancora direttamente `getJsonDb()` o `saveJsonDb()`, S0 deve identificarlo e la migrazione deve introdurre o completare il relativo repository boundary prima del cutover.

### 5. Contratti asincroni

Supabase è una persistenza remota.

I repository destinati a Supabase devono avere contratti compatibili con operazioni asincrone, errori remoti, loading, retry e risposte obsolete.

Non creare wrapper fittizi sincroni sopra operazioni remote.

### 6. PostgreSQL reale, non JSON globale

`LocalDatabase` non viene tradotto in una singola riga o tabella JSONB contenente tutto il database.

Il modello target deve usare tabelle, foreign key, unique constraint, index e transaction boundary dove rappresentano realmente il dominio.

JSONB resta possibile per payload realmente variabili o snapshot quando motivato, non come sostituto automatico dello schema relazionale.

### 7. Workspace come confine condiviso

L'attuale separazione `props24.localDb.<accountId>` non può essere copiata come modello definitivo perché il nuovo obiettivo comprende collaborazione sullo stesso dataset.

S1/S2 devono definire almeno:

* identità autenticata;
* workspace;
* membership;
* `workspace_id` o equivalente sui dati condivisi;
* accesso minimo necessario ai collaboratori;
* isolamento fra workspace differenti.

Il permission engine completo di H2 resta fuori dal primo cutover salvo quanto strettamente necessario alla sicurezza del database condiviso.

### 8. RLS e autorizzazione server-side

Il client non costituisce il confine di sicurezza.

Le tabelle esposte all'app devono essere protette mediante il modello autorizzativo Supabase/PostgreSQL definito in S1/S2.

Chiavi amministrative o privilegi server-side non devono essere inclusi nel frontend.

### 9. Atomicità multi-record

Le operazioni che oggi modificano più collection con una singola `saveJsonDb()` devono ottenere una vera boundary transazionale nel modello target.

Particolare attenzione:

* creazione e modifica Lease;
* generazione e riconciliazione Payments;
* relazioni Property/Lease/Tenant;
* deposito;
* operazioni bulk;
* eventuali mutation che toccano più tabelle.

Non sostituire una write atomica locale con una sequenza di mutation remote indipendenti che può lasciare persistenza parziale.

### 10. File fuori dal database relazionale

Gli attuali Data URL runtime non costituiscono il modello target.

Quando il dominio documentale viene migrato:

* PostgreSQL conserva metadata e relazioni;
* lo storage binario usa Supabase Storage o il meccanismo approvato;
* il database non deve contenere l'intero file codificato come Data URL salvo fixture di test isolate.

### 11. Dati correnti non migrati come produzione

`src/db/database.json`, `props24.localDb.*`, gli account locali e i dataset creati durante A/B/C sono dati di sviluppo e collaudo.

Non costituiscono una sorgente dati di produzione.

Il database Supabase di sviluppo può avere seed dedicati minimi, ma il comportamento principale deve essere verificato creando nuovi record tramite i CRUD dell'applicazione.

Fixture isolate usate esclusivamente dai test automatizzati possono restare se utili e chiaramente separate dal runtime.

### 12. Eliminazione progressiva

Non eliminare anticipatamente:

* `jsonDb.ts`;
* `database.json`;
* adapter locali;
* migration locali;
* auth locale;
* chiavi localStorage;
* subscription locali;

finché esistono consumer runtime che ne dipendono.

La cancellazione finale richiede una ricerca verificata dei consumer residui, test positivi e collaudo browser sulla nuova authority.

---

## Esito dell'analisi S0

S0.1–S0.12 sono completate.

L'analisi ha identificato reader, writer, authority, repository/port, storage, scope, relazioni, transaction boundary, subscription, consumer runtime e classificazione keep/adapt/delete dell'attuale persistence.

Le evidenze tecniche S0 sono conservate sotto:

`docs/planning/specifiche/analisi-s0-supabase/`

S0 ha inoltre stabilito che:

- `LocalDatabase` non deve sopravvivere come runtime contract ricostruito sopra PostgreSQL;
- query/read-model devono essere distinti dalle command/repository;
- Supabase Auth deve essere distinto da Workspace/Membership;
- RLS rappresenta la security authority finale;
- Contacts è il pilot preferito;
- Property/Tenant precedono Lease/Payments;
- Payment resta la financial authority;
- Storage foundation deve essere disponibile prima della migrazione dei file Property/Tenant;
- nessun dominio può usare implicit dual-write o silent fallback;
- i dati locali correnti non costituiscono dati di produzione da importare automaticamente.

S1 — Contratto target e schema PostgreSQL/Supabase è completata e approvata. Il contratto canonico S1.1–S1.12 è pubblicato nella [facade Schema Supabase](./specifiche/schema-supabase.md) e nei documenti della relativa cartella.

La prossima task tecnica è S2 — Infrastruttura Supabase, Auth, workspace minimo, RLS e Storage foundation. La prima sottotask è S2.1 — Configurazione Supabase e ambienti.

## TASK S2 — Infrastruttura Supabase, Auth, workspace minimo, RLS e Storage foundation

**Dipende da:** S1 — completata e approvata.

### S2.1 — Configurazione Supabase e ambienti

Definire configurazione progetto, environment e separazione degli ambienti.

### S2.2 — Migration SQL e versioning

Introdurre un meccanismo riproducibile e versionato per creare e aggiornare lo schema.

### S2.3 — Supabase Auth adapter

Sostituire progressivamente:

* password locali;
* registry account locali;
* sessione `{accountId}`;

con Auth reale.

### S2.4 — Profile, Workspace e Membership foundation

Implementare soltanto il modello minimo approvato da S1.

### S2.5 — Bootstrap/join workspace minimo

Distinguere:

* creazione di un workspace;
* accesso/membership a workspace esistente.

Nuovo utente non significa automaticamente nuovo database isolato.

### S2.6 — RLS baseline e test cross-workspace

Verificare almeno:

```text
User A membro Workspace X
→ accesso X

User B membro Workspace X
→ accesso X

User C non membro Workspace X
→ accesso negato
```

### S2.7 — Supabase Storage foundation

Introdurre:

* bucket necessari;
* path/naming strategy;
* authorization minima;
* test upload/read/delete.

Non eseguire ancora il consolidamento completo del dominio Documents.

### S2.8 — Session, logout, cache e scope transition

Preservare i contratti correnti di teardown, cache invalidation e unsaved-changes guard.

### S2.9 — Seed sviluppo/test

Creare seed minimi espliciti separati dai dati locali storici.

### S2.10 — Gate S2

Verificare Auth reale, workspace/membership, RLS e Storage foundation.

**Gate S2:** Auth reale, membership/workspace minimo, RLS cross-workspace e Storage foundation verificati.

---

## TASK S3 — Repository, command, query, Storage adapter e composition Supabase

**Dipende da:** S1/S2.

### S3.1 — Supabase client infrastructure

Centralizzare client e configurazione.

Nessuna pagina/component business deve importare direttamente Supabase come data layer.

### S3.2 — Workspace runtime context

Rendere disponibile lo scope workspace autorizzato alle dependency applicative.

### S3.3 — Convenzioni repository async

Definire i contratti comuni per entity CRUD/lifecycle.

### S3.4 — Convenzioni transactional command

Definire il boundary applicativo delle mutation complesse.

### S3.5 — Query/read-model layer

Separare list/detail/analytics/search dai repository di mutation.

### S3.6 — Cache e invalidation

Definire policy per refresh, stale data e invalidazione delle query interessate.

### S3.7 — Subscription/Realtime policy

Stabilire dove servono:

* refetch;
* invalidation;
* Supabase Realtime;
* combinazioni.

Non introdurre Realtime ovunque per replicare `subscribeJsonDb()`.

### S3.8 — File/Storage port

Introdurre una dependency astratta per upload/read/delete file.

UI e domain repository non devono conoscere bucket/path raw.

### S3.9 — Policy authority locale/Supabase e cutover

Formalizzare:

```text
prima del cutover
→ local authority

dopo il cutover
→ Supabase authority
```

senza fallback o dual-write impliciti.

### S3.10 — Integration test harness Supabase

Preparare test per:

* repository async;
* workspace isolation;
* RLS;
* transaction rollback;
* stale scope;
* errori remoti.

**Gate S3:** repository/query/command/Storage composition pronta per i primi cutover senza accesso Supabase diretto dalla UI.

---

## TASK S4 — Pilot e migrazione domini semplici

**Dipende da:** S3.

### S4.1 — Contacts pilot Supabase

Verificare:

* CRUD;
* archive/restore;
* fiscal uniqueness;
* delete blockers;
* workspace sharing;
* cross-workspace denial;
* query refresh;
* constraint concorrenti.

### S4.2 — Cutover completo Contacts

Supabase diventa l'unica authority runtime Contact.

Eliminare i consumer Contact legacy ancora dipendenti da `jsonDb`.

### S4.3 — Buildings

Migrare:

* CRUD;
* lifecycle;
* bulk;
* uniqueness;
* relation authority;
* Building detail query;
* `unitsCount` come derived value.

### S4.4 — Drafts

Dopo la decisione S1 sulla ownership:

* preservare port async;
* logical key;
* schemaVersion;
* payload;
* cleanup;
* sostituire l'adapter locale.

### S4.5 — Gate S4

Contacts, Buildings e Drafts migrati non devono usare `jsonDb` come authority runtime.

---

## TASK S5 — Migrazione Property / Tenant e relativi file

**Dipende da:** S4.

### S5.1 — Property commands

Migrare create/update/lifecycle/bulk.

### S5.2 — Property relational children

Migrare i child definiti in S1 preservando nested identity e semantiche correnti.

### S5.3 — Property files → Storage

Migrare foto, documenti, contratti e file catastali secondo il modello S1/S3.

### S5.4 — Property list/detail queries

Eliminare la dipendenza dal `LocalDatabase` globale nei read-model Property.

### S5.5 — Tenant commands

Migrare create/update/lifecycle/bulk preservando business rule C1–C5.

### S5.6 — Tenant Contact relations

Migrare guarantor ed emergency relation preservando identity della relazione e `contactId`.

### S5.7 — Tenant files/documents → Storage

Migrare:

* photo;
* identity front/back;
* company registry;
* Tenant documents.

### S5.8 — Tenant list/detail queries

Eliminare i global reader Tenant.

### S5.9 — Invitation state corrente

Migrare soltanto lo stato realmente esistente.

Non introdurre un servizio email reale dentro S5.

### S5.10 — Eliminazione raw lookup `jsonDb` nei form

Sostituire lookup diretti verso Building, Contact, Documents e altri domini con query/reference dependency esplicite.

### S5.11 — Gate S5

Property e Tenant non devono più utilizzare `LocalDatabase` come authority runtime.

---

## TASK S6 — Migrazione transazionale Lease / Payments

**Dipende da:** S5.

### S6.1 — Lease relations

Migrare Property, Tenant e guarantor relations secondo il modello S1.

### S6.2 — Lease create/update transaction

Garantire atomicità di:

* Lease;
* relation;
* Payment generated;
* deposit;
* activity;
* altri child definiti in S1.

### S6.3 — Lease lifecycle

Migrare activate/deactivate/terminate/archive/restore/delete.

### S6.4 — Payment commands

Migrare:

* manual create/update/delete;
* confirm paid;
* mark unpaid;
* deposit;
* deposit return;
* prepaid.

### S6.5 — Schedule generation fuori dal read path

Eliminare generation/repair come side effect di normali query.

### S6.6 — Lease Activity append-oriented

Le command devono poter appendere audit event senza riscrivere l'intero aggregate.

### S6.7 — Documenti Lease necessari al runtime

Migrare ciò che serve a:

* contract snapshot;
* insurance;
* signature process;
* flussi Lease correnti.

### S6.8 — Prepared communications

Migrare `MessageRecord` preservando la semantica di comunicazione preparata, non invio certificato.

### S6.9 — Lease/Payment read-model

Migrare list/detail/balance e financial projections.

### S6.10 — Dashboard financial cutover

Dashboard deve leggere dalla nuova financial authority Payment.

### S6.11 — Compatibilità multi-tenant Payment

Preservare il comportamento corrente senza rendere lo schema incompatibile con future allocazioni/ripartizioni.

### S6.12 — Gate transazionale e rollback

Verificare che failure parziali non lascino:

* Lease incompleta;
* Payment orfani;
* relation parziali;
* activity incoerenti.

---

## TASK S7 — Consolidamento documentale, cleanup runtime locale e QA finale

**Dipende da:** S6.

### S7.1 — Consolidamento Property/Tenant/Lease/global Documents

Riconciliare definitivamente le rappresentazioni documentali secondo S1.

### S7.2 — Global Document library se ancora necessaria

Confermare i consumer reali prima di implementare o mantenere la capability.

### S7.3 — Provenance/link cleanup

Migrare e semplificare `sourceDocumentId` o l'equivalente target.

### S7.4 — Eliminazione Data URL runtime

Nessun business file runtime deve restare codificato nel database applicativo.

### S7.5 — Eliminazione local Auth persistence

Rimuovere account/session storage locale quando nessun consumer ne dipende.

### S7.6 — Eliminazione runtime `jsonDb`

Rimuovere, quando zero consumer:

```text
getJsonDb
saveJsonDb
subscribeJsonDb
createJsonDbAccountScope
activeDatabaseAccountId
```

### S7.7 — Eliminazione runtime seed locale

`database.json` non deve più inizializzare utenti/runtime reali.

Può restare soltanto se isolato intenzionalmente come fixture di test.

### S7.8 — Eliminazione migration/read-repair legacy

Rimuovere normalizzazioni e repair richiesti esclusivamente dal vecchio JSON runtime.

### S7.9 — Cleanup placeholder collection

Eliminare le collection senza owner reale che non fanno parte del modello target.

### S7.10 — Final storage audit

Verificare che eventuali residui localStorage siano esclusivamente browser/UI preference intenzionali.

### S7.11 — Full automated gate

Eseguire suite completa, build e gate tecnici richiesti.

### S7.12 — Multi-user browser QA

Scenario minimo:

```text
User A + User B
→ stesso workspace
→ stessa mutation CRUD visibile

User C
→ workspace differente
→ nessun accesso
```

### S7.13 — Collaboration/concurrency QA

Verificare almeno:

* create/edit concorrenti;
* refresh;
* logout;
* workspace switch;
* stale data;
* errori rete;
* duplicate race;
* transaction failure.

### S7.14 — Chiusura formale Blocco S

Il Blocco S può essere chiuso soltanto quando la persistence locale non è più business authority runtime.

**Gate S7:** zero business consumer della persistence locale, collaborazione e isolamento verificati, Storage attivo, Data URL runtime rimossi e suite/QA finali positivi.

# BLOCCO G — Azioni simulate, mock e route

## TASK G1 — Inventario statico aggiornato

Produrre un report senza modifiche confrontando:

- `src/App.tsx`;
- `src/utils/routes.ts`;
- `src/data/menu.ts`;
- `src/data/navbar.ts`;
- link e bottoni;
- `console.log`;
- `href="#"`;
- handler senza mutazione;
- mock nel runtime;
- controlli pending;
- commenti TODO;
- funzionalità realmente disabilitate.

Classificare:

- funzionante;
- simulazione locale intenzionale;
- pending chiaramente disabilitato;
- attivo senza effetto;
- route mancante;
- mock runtime;
- codice mock non più usato;
- richiede browser.

## TASK G3 — Residui azioni unità e inquilini

**Stato:** da rivalutare dopo G1.

G3 non deve riaprire i lifecycle già operativi degli edifici, delle Unit o dei Tenant, non deve duplicare B7 e non deve riaprire azioni Tenant già classificate dalla specifica della fase locale.

Dopo G1 devono restare in G3 soltanto eventuali azioni realmente attive ma senza effetto o non ancora classificate che non abbiano già una task owner.

## TASK G4 — Locazioni

Commenti e controlli pending in `LeasesPage.tsx`:

- modello contratto precompilato;
- catalogo;
- inventario iniziale;
- copia locazione;
- finanze;
- riconciliazione spese;
- aggiornamento canone;
- altre azioni gialle.

Non attivare finché i relativi flussi non esistono.

## TASK G5 — Dashboard e navbar

Verificare e decidere:

- alert mock in `useNavbar.ts` e `src/data/navbar.ts`;
- PremiumBanner;
- NewsPanel;
- HelpFooter;
- QuickActions;
- profilo mock;
- eventuali file mock dashboard non più importati;
- destinazioni supporto, contatto, pagamenti e account.

## TASK G6 — Route future

Gruppi ancora referenziati e da classificare:

- finanze e pagamenti;
- impostazioni e profilo;
- documenti;
- contatti;
- messaggi;
- prenotazioni;
- cataloghi;
- inventario;
- manutenzione;
- attività;
- note;
- candidati;
- quesiti legali;
- strumenti;
- cestino;
- supporto e contatto;
- import inquilini e locazioni.

Non creare pagine vuote per far risultare la route esistente.

## TASK G7 — Coerenza UI delle funzioni future

Per ogni funzione rinviata:

- controllo visibile quando utile;
- stile giallo uniforme;
- controllo realmente disabilitato;
- tooltip o testo chiaro;
- `disabled`/`aria-disabled`;
- nessun click;
- nessun falso successo;
- nessun fallback `#` attivo.

## TASK G8 — Feedback

I FeedbackBox restano visibili, gialli e disabilitati, senza falso invio. Import ed export seguono la stessa convenzione. Riferimento: [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md).

# BLOCCO H — Sicurezza, backend e storage

Riferimenti: [Database locale e migrazione Supabase](./specifiche/database-locale-e-migrazione.md) e [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md). Storage documentale definitivo, gestione sicura di password e codici, OCR, PDF, scraping, firme e servizi esterni restano funzioni future dipendenti da backend e storage sicuro. I dati e gli allegati già supportati localmente restano validi nel perimetro di collaudo.

## TASK H1 — Autenticazione di produzione

S2 del Blocco S implementa l'Auth reale minimo necessario al database condiviso.

H1 resta aperta soltanto per gli aspetti di produzione non richiesti al primo cutover, fra cui:

- hardening delle policy Auth;
- recovery credenziali;
- eventuale verifica email;
- gestione avanzata delle sessioni e revoche;
- UX/error handling di produzione;
- eventuali requisiti di migrazione soltanto se in futuro esisteranno account reali da migrare.

Gli account locali correnti di sviluppo non devono essere importati automaticamente.

## TASK H2 — Identità, workspace e accessi

**Origine:** commento in `auth.types.ts`.

S2 realizza soltanto la foundation minima `user → membership → workspace` e le policy RLS necessarie alla persistence condivisa. Questo non chiude H2 e non implementa il permission model professionale completo.

### H2A — Portale inquilino invitato

- accesso limitato alle proprie locazioni;
- permessi e visibilità definiti nella specifica ruoli e workspace;
- isolamento dai dati privati del proprietario e dalla scheda inquilino conservata dal proprietario;
- test backend e autorizzativi futuri.

### H2B — Account multi-ruolo e workspace avanzato

- identità unica con ruoli dipendenti da workspace o relazione;
- workspace personale/proprietario, accesso come inquilino, studio e cliente delegato;
- nessuna impersonificazione tecnica del cliente;
- revoca dell’accesso e audit dell’attore reale.

### H2C — Gestione professionale e deleghe

- account personale del professionista;
- cliente attivo sempre evidente;
- accettazione del cliente obbligatoria prima dell’accesso;
- ruoli e permessi futuri, deleghe, revoca e audit;
- nessun permission engine in questa fase.

## TASK H3 — Storage documentale avanzato

La foundation Storage necessaria alla migrazione runtime appartiene al Blocco S:

- S2 — bucket/policy foundation;
- S3 — File/Storage port;
- S5 — file Property/Tenant;
- S6 — documenti/file Lease necessari;
- S7 — consolidamento e cleanup Data URL.

H3 resta aperta per le capability documentali avanzate oltre il cutover:

- quote prodotto definitive;
- deduplicazione avanzata;
- retention;
- gestione offline/retry avanzata;
- condivisione documentale;
- grant per professionisti o Tenant selezionati;
- policy documentali multi-ruolo;
- modello autorizzativo documentale completo.

Il semplice completamento dello Storage Supabase nel Blocco S non chiude H3.

# BLOCCO I — Automazioni locazione e servizi documentali

Queste task derivano da commenti espliciti nel codice. Non unirle al fix D1/D2.

Sono attività future dipendenti dal backend: PDF, OCR, scraping, firme, email, automazioni e generazione documentale. Vedere [Database locale e migrazione Supabase](./specifiche/database-locale-e-migrazione.md) e [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md).

## TASK I1 — Indici ISTAT aggiornabili

**Origine:** `istatIndexOptions.ts`.

**Obiettivo futuro:**

- fonte attendibile;
- aggiornamento backend;
- versionamento dei valori già usati;
- nessuna modifica retroattiva dei contratti;
- data di acquisizione e tracciabilità;
- fallback quando il servizio non è disponibile.

## TASK I2 — Generazione programmata e avvisi

**Origine:** scheda pagamenti del form locazione.

**Obiettivo futuro:**

- scheduler backend attivo ad applicazione chiusa;
- generazione scadenze/ricevute;
- avvisi;
- idempotenza;
- retry;
- fuso orario;
- log e stato consegna.

## TASK I3 — Aggiornamento canone

**Obiettivo futuro:**

- calcolo reale;
- conferma del locatore;
- modifica controllata dei pagamenti futuri;
- nessuna riscrittura degli incassi passati;
- notifica;
- audit;
- uso dell’indice versionato.

## TASK I4 — Ricevute, fatture e documenti pagamento

**Origine:** scheda ricevute.

**Decisioni collegate:** PA-02, PA-04 e PA-05, tutte rinviate; PA-11 resta aperta e non analizzata.

Comprende in futuro:

- generatore documenti;
- numerazione persistente;
- ambito locazione/locatore;
- gestione concorrenza;
- prefissi e formato;
- distinzione fra Ricevuta, Fattura, Quietanza e Allegato del pagamento;
- per la ricevuta almeno locatore, conduttore, importo, data e metodo/tipologia;
- SDI e PEC soltanto con servizio reale;
- stato invio;
- errori e retry;
- nessun numero assegnato due volte.

## TASK I5 — Pagamenti parziali, crediti e debiti

PA-03 rinvia alla sezione Finanze pagamenti parziali, crediti e debiti; Rentila sarà soltanto riferimento funzionale da analizzare. PA-10 resta aperta e non analizzata. Prima di automatizzare definire:

- pagamenti parziali;
- crediti;
- debiti;
- saldo;
- riconciliazione;
- effetto sulle rate successive;
- correzioni e audit.

I conguagli distinguono spesa effettiva, acconti, periodo, criterio di attribuzione, saldo a debito o credito, giustificativi ed effetto sulla rata successiva. Il PDF è un giustificativo, non l’intero modello contabile.

## TASK I6 — Notifiche locazione

Collegare le preferenze salvate a:

- servizio backend;
- destinatari;
- canale;
- template;
- consenso;
- pianificazione;
- stato invio e retry.

## TASK I7 — Documenti deposito e assicurazioni

**Obiettivo:**

- collegare deposito e assicurazioni a `DocumentRecord`;
- gestire create ed edit;
- preservare riferimenti legacy;
- impedire riferimenti orfani;
- definire storage backend futuro.
- usare categorie coerenti, inclusi Deposito cauzionale, Assicurazioni, Ricevute e Comunicazioni;
- applicare grant espliciti: il collegamento alla locazione non implica condivisione con l’inquilino.

## TASK I8 — Documenti durante creazione locazione

Valutare una transazione che:

- crea locazione e documenti senza duplicare file nella bozza;
- evita record orfani;
- gestisce rollback;
- conserva la possibilità attuale di aggiungere documenti dopo il primo salvataggio.

La futura estrazione da contratti PDF o immagini deve sempre mostrare anteprima e richiedere conferma; nessun dato estratto è automaticamente verificato.

> Nota non pianificata: è emersa un’idea futura sull’affidabilità di clienti o inquilini tramite fonti esterne. Non è approvata, non ha priorità né task e richiede prima discovery e audit legale, privacy e qualità dei dati.

## TASK I9 — Modelli, cataloghi e inventari

Attivare le azioni della lista locazioni soltanto dopo:

- generatore di contratto;
- repository cataloghi;
- repository inventari;
- route e permessi;
- collegamento alla locazione.

## TASK I10 — Periodicità forfettaria

**Origine:** commento in `leaseFormSchema.ts`.

Prima di aggiungerla definire:

- significato contrattuale;
- generazione delle rate;
- scadenze;
- rinnovi;
- annualizzazione;
- ricavi;
- ricevute;
- migrazione e compatibilità dei record.

Non aggiungere soltanto un’opzione allo schema o alla select senza implementarne la semantica completa.

# BLOCCO J — Qualità e pulizia

## TASK J1 — Test automatizzati

**Stato:** PARZIALE; l'infrastruttura e la copertura automatizzata sono attive, ma J1 accompagna le implementazioni ancora residue.

La baseline automatizzata verificata corrente è mantenuta nella Todo list e non viene duplicata qui.

**Aree residue:**

- repository e consumer ancora da implementare;
- D1B — storico append-only e override motivato;
- D2D — prepagato, ricevuta e confirmation precedenti;
- funzioni future gialle e realmente disabilitate;
- audit e gate finali.

Vincoli:

- i test non devono mutare dati di produzione;
- non ricreare vecchi smoke test;
- non introdurre una suite ampia come effetto collaterale di una task funzionale;
- ogni task funzionale deve aggiungere o aggiornare soltanto i test mirati al proprio perimetro.

## TASK J2 — Baseline lint

**Obiettivo:**

- eseguire il lint globale sullo snapshot corrente;
- classificare errori per area;
- separare debito preesistente;
- creare task piccole;
- mantenere lint mirato come gate delle task;
- rendere globale il gate soltanto dopo pulizia esplicita.

Non conservare i vecchi conteggi come stato corrente.

## TASK J3 — Mock e file non usati

Dopo la sostituzione dei flussi runtime:

- verificare import reali;
- eliminare mock non più usati;
- preservare soltanto seed intenzionali;
- aggiornare `database.json` solo con una task dedicata;
- non cancellare file in base al nome.

File candidati da verificare:

- `mockBuildings.ts`;
- `mockTenantList.ts`;
- `mockTenantDetail.ts`;
- `mockTenants.ts`;
- `mockLeases.ts`;
- `mockProperties.ts`;
- `mockPropertyDetail.ts`;
- `mockDashboardData.ts`;
- `mockUserProfile.ts`.

## TASK J4 — ID persistiti residui

B4 ha già chiuso e verificato gli otto ID annidati persistenti delle Unit. J4 non riapre B4: resta un audit globale degli ID persistiti residui negli altri domini e nei flussi futuri.

Audit finale di:

- `Math.random`;
- `Date.now`;
- ID derivati da nome/file;
- collisioni;
- migrazioni di record esistenti.

Includere anche `LeaseDocumentModal.tsx` se l’ID del file diventa persistente.

## TASK J6 — Accessibilità e falsi controlli

Audit mirato di:

- tastiera;
- focus;
- modali;
- error summary;
- elementi disabilitati;
- link senza destinazione;
- contrasto dei warning;
- menu e tabelle;
- doppio submit;
- toast.

# BLOCCO K — Audit e collaudo conclusivi

## TASK K1 — Audit statico CRUD

Verificare edificio, unità, inquilino e locazione:

- nessun mock runtime;
- ID canonici;
- date coerenti;
- relazioni tramite ID;
- mutazioni atomiche;
- errori di dominio;
- round-trip;
- bozze manuali;
- storico append-only;
- conservazione a tempo indefinito, senza scadenza automatica;
- override data finale motivato;
- pagamento completo confermato;
- funzioni future gialle e disabilitate;
- isolamento account;
- nessuna mutazione di dati di produzione;
- nessun pagamento falso;
- nessuna preferenza globale parallela;
- nessun `console.log` come implementazione.

Produrre finding senza correggerli nella stessa task.

## TASK K2 — Collaudo browser CRUD

Scenario minimo:

1. creare edificio;
2. creare due unità nello stesso edificio;
3. creare persona e società;
4. creare contatti e garanti;
5. creare locazione con data di fine mese e metodo addebito;
6. reload dopo ogni creazione;
7. verificare liste, dettagli ed edit;
8. verificare secondo account vuoto;
9. verificare guard modifiche non salvate;
10. archivio e ripristino;
11. console.

## TASK K3 — Audit globale azioni e route

Basato sulle decisioni applicabili del Blocco G:

- ogni route dichiarata;
- ogni link visibile;
- ogni azione attiva;
- ogni controllo disabilitato;
- mobile e desktop essenziali;
- tastiera;
- nessuna pagina bianca;
- nessun falso successo.

## TASK K4 — Gate tecnico finale

- build completa;
- lint dei file modificati;
- suite automatica completa positiva;
- report separato del debito globale residuo;
- nessun allargamento automatico.

# 5. Criteri di chiusura complessivi

Il ciclo delle implementazioni può essere chiuso soltanto quando:

### 1. Correttezza dei quattro domini

- i quattro form prioritari sono funzionanti;
- gli edifici sono operativi;
- le unità sono collegate agli edifici;
- i duplicati sono gestiti correttamente;
- gli ID persistiti sono stabili;
- inquilini e contatti usano modelli canonici;
- le date delle locazioni sono corrette.

### 2. Persistenza, workspace e isolamento

- tutti i business data nello scope effettuano round-trip sulla authority target;
- due utenti autorizzati possono operare sullo stesso workspace;
- utenti non autorizzati non possono accedere a workspace differenti;
- RLS costituisce l'authority server-side di isolamento;
- i dati applicativi non dipendono direttamente dalla persistence browser;
- il runtime target usa repository/command/query verso Supabase/PostgreSQL;
- i file runtime usano Storage e non Data URL nel business database;
- le preferenze puramente UI/browser possono restare locali e non costituiscono business persistence.

### 3. Bozze e navigazione

- le bozze manuali funzionano;
- il guard delle modifiche non salvate funziona;

### 4. Locazioni e pagamenti

- lo storico locazioni è persistito e append-only;
- i pagamenti completi sono confermati manualmente;
- nessun metodo di pagamento produce un incasso automatico falso.

### 5. Funzioni attive e future

- le azioni attive sono realmente operative;
- le funzioni future sono visibili ma gialle e disabilitate;
- i mock runtime sono rimossi dai flussi approvati.

### 6. Gate tecnici e di collaudo

- build positiva;
- lint mirato positivo;
- audit statico completato;
- collaudo browser completato;

Supabase/PostgreSQL è la priorità tecnica corrente del Blocco S. Il database locale resta scaffolding transitorio soltanto per i domini non ancora migrati e per fixture di test esplicitamente isolate. Dopo il cutover completo non costituisce più una persistence authority runtime. Le task backend e i servizi esterni non bloccano la chiusura della fase locale, purché:

- siano classificati esplicitamente;
- i controlli non operativi siano disabilitati;
- la UI non dichiari risultati falsi;
- i dati salvati localmente restino coerenti.