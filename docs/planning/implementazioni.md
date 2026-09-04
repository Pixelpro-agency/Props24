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
- S2 implementerà soltanto l'identità, autenticazione e workspace minimi necessari alla persistenza condivisa;
- H1 conserverà l'eventuale hardening e i flussi di autenticazione di produzione non necessari al primo ambiente condiviso;
- H2 conserverà portale inquilino, multi-ruolo completo, deleghe e permission model avanzato;
- S7 potrà introdurre la base Supabase Storage necessaria a eliminare i Data URL runtime, mentre H3 conserverà il modello documentale e autorizzativo completo ancora futuro.

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

Nel Blocco C non restano attività operative non-future. Le sole attività residue sono C7 — Inviti email, C8 — Allegati delle bozze, C9 — Verifica documentale/OCR e C10A — Card inquilini, tutte classificate come future e separate dal perimetro locale già approvato.

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

## TASK C8 — Allegati delle bozze

**Origine:** commento in `useTenantFormPersistence.ts`.

**Obiettivo:**

- spostare allegati fuori dai Data URL nel database localStorage;
- valutare IndexedDB nel periodo locale;
- definire storage backend/cloud per produzione;
- evitare aumento arbitrario delle quote;
- migrazione e cleanup sicuri;
- mantenere bozza e record coerenti.

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

# BLOCCO E — Preferenze account-scoped

Le preferenze devono usare il contratto repository e l'isolamento descritti in [Database locale e migrazione Supabase](./specifiche/database-locale-e-migrazione.md), senza trasformare questo blocco in un redesign delle preferenze.

## TASK E1 — Visibilità colonne nel database

**Obiettivo:**

- struttura tipizzata in `settings`;
- repository preferenze;
- isolamento per account;
- migrazione di `properties-column-visibility` e `tenants-column-visibility`;
- rimozione chiavi legacy soltanto dopo scrittura verificata;
- subscription UI;
- nessuna perdita di altre impostazioni.

**Non eliminare:**

- chiavi auth;
- `props24.localDb.<accountId>`;
- indice account/migrazione;
- meccanismi di isolamento.

## TASK E2 — Audit storage

Inventariare e classificare:

- auth;
- database per account;
- indice/migrazione;
- preferenze legacy;
- allegati;
- chiavi estranee.

Verificare:

- login/logout fra due account;
- preferenze differenti;
- migrazione idempotente;
- nessuna lettura o scrittura diretta dalle pagine.

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

## Stato tecnico preliminare da verificare e completare in S0

L'analisi iniziale del repository mostra già un'architettura non uniforme.

### Persistenza fisica

L'attuale `LocalDatabase` contiene in un unico oggetto collection quali:

* buildings;
* properties;
* tenants;
* leases;
* payments;
* contacts;
* documents;
* messages;
* drafts;
* settings;
* altre collection ancora vuote o future.

`jsonDb` usa database locali account-scoped e il salvataggio corrente lavora sull'intero oggetto database.

Il primo account locale usa inoltre `database.json` come seed runtime quando necessario.

### Boundary già parzialmente migrabili

Esistono già boundary utili da preservare o evolvere, fra cui:

* `ContactRepository` con port asincrono e adapter locale;
* `DraftRepository` con port asincrono e adapter locale;
* `BuildingRepository` con gateway account-scoped;
* `TenantRepository` con operations/gateway per una parte importante delle mutation.

### Boundary ancora misti o diretti

Esistono ancora flussi che usano direttamente o parzialmente:

* `getJsonDb`;
* `saveJsonDb`;
* accesso all'intero `LocalDatabase`.

Properties/Unit e Lease sono esempi da analizzare con particolare attenzione.

Tenant contiene sia boundary repository sia reader o funzioni legacy ancora legate al database globale.

### Auth locale

L'autenticazione corrente è una simulazione locale con account e sessione persistiti nel browser.

Il collegamento fra account autenticato e database avviene attivando lo scope locale relativo all'account.

Questo modello non è il target del database condiviso.

Questi punti sono evidenze preliminari e non sostituiscono S0.

---

## TASK S0 — Analisi tecnica della persistenza corrente e piano di migrazione

**Stato:** priorità corrente.

**Modalità:** analisi read-only del repository. Nessuna implementazione Supabase durante S0.

### Obiettivo

Costruire una mappa verificata dell'intera persistence architecture corrente prima di decidere schema, adapter e ordine definitivo di migrazione.

Per ogni dominio o infrastruttura devono essere identificati almeno:

* record e struttura dati;
* reader;
* writer;
* authority della mutation;
* repository/port;
* adapter/gateway;
* consumer UI/hook;
* read-model e selector;
* account scope;
* relazioni;
* business rule;
* errori di dominio;
* operazioni singole e bulk;
* requisiti di atomicità;
* subscription/invalidation;
* seed o migration legacy coinvolti;
* test che proteggono il contratto;
* codice da preservare;
* codice da adattare;
* codice da eliminare al termine della migrazione.

### S0.1 — Schema LocalDatabase e seed

Analizzare:

* `database.types.ts`;
* `database.json`;
* struttura di tutte le collection;
* dati annidati;
* relazioni duplicate o derivate;
* metadata;
* schemaVersion;
* seedVersion;
* dati legacy;
* record e collection ancora placeholder.

Output richiesto:

mappa concettuale delle entità e delle relazioni correnti, senza ancora trasformarla nello schema SQL definitivo.

### S0.2 — jsonDb e persistenza fisica

Analizzare integralmente:

* inizializzazione;
* account key;
* default account;
* database secondari;
* seed;
* cache in memoria;
* read;
* write;
* normalize;
* validate;
* repair;
* migration;
* rollback;
* quota;
* rilettura dopo write;
* subscription;
* eventi browser;
* reset;
* cleanup legacy.

Output richiesto:

flusso completo dalla richiesta di lettura/scrittura fino al localStorage e ritorno.

### S0.3 — Buildings

Mappare CRUD, lifecycle, bulk, repository, gateway, relation con Unit, business rule, subscription e test.

### S0.4 — Properties / Unit

Mappare CRUD, lifecycle, Building relation, Lease/Tenant projection, read-model, accessi diretti a `jsonDb`, business rule e test.

### S0.5 — Contacts

Mappare port, operations, local adapter, composition, consumer, lifecycle, fiscal identity, referential protection e test.

### S0.6 — Tenants

Mappare create/update/lifecycle, gateway, reader legacy, Contact relation, fiscal rule, nested identity, delete blocker, drafts, consumer e test.

### S0.7 — Leases

Mappare create/update/lifecycle e soprattutto tutte le mutation multi-collection:

* Lease;
* Property;
* Tenant;
* Payment;
* Documents;
* activity;
* deposit;
* signature/communication quando rilevanti.

Identificare le transaction boundary richieste dal target.

### S0.8 — Payments

Mappare schedule, create/update, conferma pagamento, depositi, prepagato, repair, consumer finanziari, relazioni e atomicità.

### S0.9 — Documents, Drafts, Settings e residui

Analizzare:

* document repository;
* file/Data URL;
* draft port e adapter;
* settings;
* userProfile;
* messages;
* collection placeholder;
* eventuali chiavi storage esterne al database principale.

### S0.10 — Auth e isolamento

Analizzare:

* `AuthContext`;
* `authStorage`;
* account seed;
* login;
* register;
* session;
* logout;
* collegamento account → database;
* isolamento corrente;
* implicazioni per workspace condivisi.

Non progettare ancora il permission engine completo H2.

### S0.11 — Consumer e dipendenze runtime

Cercare tutti i consumer di:

* `getJsonDb`;
* `saveJsonDb`;
* `createJsonDbAccountScope`;
* repository locali;
* port;
* subscription;
* `database.json`;
* auth locale;
* chiavi localStorage.

Classificare ogni consumer come:

* già dietro boundary;
* da adattare;
* da spostare dietro repository;
* test-only;
* legacy eliminabile;
* ancora necessario durante la transizione.

### S0.12 — Matrice finale e decomposizione

Produrre una matrice finale almeno con:

`dominio | reader | writer | authority | repository/port | storage | scope | relazioni | atomicità | subscription | test | keep/adapt/delete`

Da questa matrice devono derivare:

* schema target preliminare;
* ordine reale di migrazione;
* dipendenze;
* task esistenti potenzialmente assorbite o rese obsolete;
* scomposizione dettagliata di S1–S7.

S0 non si chiude finché ogni accesso runtime rilevante alla persistence corrente non ha un owner noto.

---

## TASK S1 — Contratto target e schema PostgreSQL/Supabase

Da dettagliare dopo S0.

Deve trasformare la matrice S0 in modello target:

* entità;
* tabelle;
* relazioni;
* FK;
* unique constraint;
* index;
* JSONB motivati;
* transaction boundary;
* workspace boundary;
* RLS;
* migrations.

Nessun CRUD viene migrato soltanto perché è stata creata una tabella.

## TASK S2 — Infrastruttura Supabase, Auth e workspace minimo

Da dettagliare dopo S1.

Comprende solo l'infrastruttura minima necessaria al database condiviso:

* configurazione client;
* environment;
* migrations;
* Supabase Auth;
* workspace minimo;
* membership minima;
* RLS;
* test dedicati.

Non chiude automaticamente H1/H2.

## TASK S3 — Repository boundary e adapter Supabase

Da dettagliare dopo S0–S2.

Obiettivo:

eliminare l'accoppiamento diretto fra UI e persistence fisica e rendere esplicito il cutover adapter per adapter.

Deve affrontare anche i repository ancora sincroni o parzialmente legati a `LocalDatabase`.

## TASK S4 — Domini semplici e pilot

Ordine definitivo deciso dopo S0.

Candidati preliminari:

* Contacts come pilot dell'adapter asincrono;
* Buildings come primo CRUD completo visibile;
* Drafts se la matrice conferma che il relativo port è sufficientemente isolato.

## TASK S5 — Domini core Tenant e Property/Unit

Da scomporre dopo i pilot.

Preservare tutti i contratti A/B/C già approvati.

## TASK S6 — Lease e Payments

Da affrontare soltanto dopo i domini da cui dipendono.

Richiede transaction boundary esplicite e non può essere una sequenza non atomica di write client indipendenti.

## TASK S7 — Storage, residui e rimozione della persistence locale

Da dettagliare sulla base dei consumer residui.

Comprende progressivamente:

* document/file storage supportato;
* settings e residui;
* rimozione dei consumer `jsonDb`;
* rimozione adapter locali runtime non più necessari;
* rimozione seed runtime temporanei;
* rimozione account/auth locali quando sostituiti;
* cleanup delle chiavi locali obsolete;
* audit finale dei riferimenti;
* suite automatica;
* browser QA sul database condiviso.

La rimozione del runtime locale è l'ultimo effetto del cutover, non il primo.


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

**Origine:** commenti in `AuthContext.tsx` e `authStorage.ts`.

**Obiettivo futuro:**

- backend di autenticazione;
- password mai salvate in localStorage;
- hashing lato server;
- sessioni con scadenza, rinnovo e revoca;
- autorizzazione server-side;
- logout e invalidazione;
- migrazione degli account locali;
- gestione errori e recupero credenziali.

Non implementare parzialmente dentro una task UI.

## TASK H2 — Identità, workspace e accessi

**Origine:** commento in `auth.types.ts`.

### H2A — Portale inquilino invitato

- accesso limitato alle proprie locazioni;
- permessi e visibilità definiti nella specifica ruoli e workspace;
- isolamento dai dati privati del proprietario e dalla scheda inquilino conservata dal proprietario;
- test backend e autorizzativi futuri.

### H2B — Account multi-ruolo e workspace

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

## TASK H3 — Storage documentale

Definire:

- storage binario;
- metadati nel database;
- limiti e quote;
- deduplicazione;
- upload, download ed eliminazione;
- cancellazione coordinata;
- migrazione dei Data URL;
- accesso per account e ruoli;
- `document_access_grants` per visibilità privata, professionisti autorizzati, tutti gli inquilini o inquilini selezionati;
- gestione offline e retry.

Dipendenze:

- C8;
- C9;
- B8;
- task documentali del Blocco I.

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

## TASK J5 — Performance e quota locale

Verificare:

- serializzazioni complete del database;
- allegati Data URL;
- debounce;
- dimensione delle bozze;
- subscription;
- render di tabelle;
- cleanup;
- comportamento con dataset realistici.

Non ottimizzare senza misure riproducibili.

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

### 2. Persistenza e isolamento

- tutti i campi nello scope effettuano round-trip;
- le preferenze sono isolate per account;
- i dati applicativi non dipendono direttamente dalla persistenza browser e il runtime target usa repository/adapter verso Supabase/PostgreSQL.

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