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
- sostituto della futura documentazione tecnica.

Stato verificato sul repository:

```txt
Repository: Pixelpro-agency/Props24
Branch: main
SHA esaminato: de9aec98d63146aeea9e191ae6f53df77ddf161b
```

Il piano è aggiornato sulla base delle decisioni prodotto consolidate. Il codice applicativo non è stato riesaminato integralmente a questo SHA.

Prima di trasformare una voce in prompt esecutivo, verificarla nuovamente sul codice corrente.

## Mappa dei documenti

- [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md)
- [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md)
- [Specifica Nuovo edificio](./specifiche/nuovo-edificio.md)
- [Decisioni da validare](./decisioni-da-validare.md)

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

### 3.1 Nuovo edificio

La specifica consolidata è disponibile in [Specifica Nuovo edificio](./specifiche/nuovo-edificio.md). Le sole decisioni residue — unicità dell'identificativo, indirizzi coincidenti, routing, creazione unità dal form, lifecycle e regole professionali sui millesimi — sono nel registro [Decisioni da validare](./decisioni-da-validare.md).

### 3.2 Duplicati delle unità

Ogni unità usa un UUID interno. Il controllo primario usa una chiave catastale normalizzata account-scoped; quando non è disponibile usa un fingerprint operativo secondario, con regole distinte per unità associate o meno a un edificio. La specifica è in [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md); gli edge case professionali restano in [Decisioni da validare](./decisioni-da-validare.md).

### 3.3 Campi unità ancora senza valori

Restano da validare soltanto i cataloghi professionali di:

- tipo di locazione dell’unità;
- periodicità di pagamento;
- classe energetica;
- eventuali valori legacy da normalizzare.

Riferimento: [Decisioni da validare](./decisioni-da-validare.md).

### 3.4 Duplicati anagrafici

La strategia resta aperta e deve essere validata in [Decisioni da validare](./decisioni-da-validare.md), includendo:

- codice fiscale obbligatorio o facoltativo per persona;
- partita IVA obbligatoria o facoltativa per società;
- gestione soggetti esteri;
- duplicati sempre bloccati oppure ammessi con conferma;
- ruolo di SIRET ed email come segnali secondari.

### 3.5 Modifiche non salvate

La decisione è consolidata in [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md): bozza manuale separata, nessun autosalvataggio, stato dirty, modale applicativa `Resta`/`Abbandona`/`Salva bozza`, ripresa o eliminazione della bozza e `beforeunload` nativo per refresh e chiusura.

### 3.6 Funzioni future, route e servizi esterni

Le funzioni non disponibili restano visibili quando utili, gialle, realmente disabilitate, non cliccabili e accompagnate da spiegazione. Non usano route fittizie o falsi successi. La convenzione è definita nella [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md).

### 3.7 Backend e produzione

La destinazione approvata è Supabase con PostgreSQL, secondo [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md). Restano da definire in task future:

- autenticazione e autorizzazione;
- storage documentale;
- invio email;
- servizi documentali;
- deployment.

## 4. Ordine operativo

Ordine immediato:

1. storico, repair e migrazione conservativi dei pagamenti;
2. contratto repository compatibile con Supabase/PostgreSQL;
3. repository condiviso delle bozze manuali;
4. guard condiviso;
5. integrazioni separate in Nuovo inquilino, Nuova unità e Nuova locazione;
6. repository e form Nuovo edificio;
7. lista, lifecycle e collaudo edifici;
8. completamento e collaudo dei quattro CRUD.

Classificazione complessiva:

1. Blocco A — Edifici;
2. Blocco B — Unità;
3. Blocco C — Inquilini e contatti;
4. Blocco D — Difetti residui locazioni e pagamenti;
5. Blocco E — Preferenze account-scoped;
6. Blocco F — Modifiche non salvate;
7. Blocco G — Azioni simulate, mock e route;
8. Blocco H — Sicurezza, backend e storage documentale;
9. Blocco I — Automazioni locazione e servizi documentali;
10. Blocco J — Qualità, test e pulizia;
11. Blocco K — Audit e collaudo conclusivi;
12. Blocco L — Documentazione tecnica.

Non eseguire in parallelo task che modificano gli stessi repository, form o contratti persistiti.

---

# BLOCCO A — Edifici

## TASK A0 — Specifica Nuovo edificio

**Stato:** prerequisito documentale soddisfatto.

**Riferimento:** [Specifica Nuovo edificio](./specifiche/nuovo-edificio.md).

**Output:**

- mappa campi;
- sezioni o schede;
- obbligatorietà;
- relazioni;
- documenti;
- regole CRUD;
- navigazione;
- file da creare o modificare;
- conferma delle task A1–A7.

Non modificare codice.

## TASK A1 — Repository edifici

**Dipendenza:** specifica consolidata A0.

**Obiettivo:**

- creare `src/db/buildingRepository.ts`;
- implementare list, get, create, update, archive, restore e delete;
- usare ID canonici e timestamp ISO;
- normalizzare gli input;
- effettuare una sola `saveJsonDb` per mutazione;
- derivare `unitsCount`;
- bloccare eliminazione con unità collegate;
- applicare la regola duplicati approvata;
- restituire il record riletto dal database;
- aggiornare errori e validazione.

**File da verificare:**

- `src/db/buildingRepository.ts`;
- `src/db/database.types.ts`;
- `src/db/databaseErrors.ts`;
- `src/db/databaseValidation.ts`;
- `src/db/dataSelectors.ts`;
- `src/types/building.ts`.

**Chiusura:**

- lifecycle completo;
- nessun dato mock;
- errori di dominio distinguibili;
- integrità verificata;
- build e lint mirato positivi.

## TASK A2 — Form Nuovo edificio

**Dipendenze:** specifica consolidata A0, A1.

**Obiettivo:**

- form completo secondo il riferimento;
- React Hook Form e schema Zod;
- errori sul campo e focus prioritario;
- input numerici sicuri;
- bozza manuale account-scoped e separata;
- nessuna scrittura automatica;
- guard condiviso delle modifiche non salvate;
- cinque schede attive e tre visibili, gialle e disabilitate;
- gestione quota;
- submit singolo;
- toast singolo;
- round-trip di ogni controllo visibile.

**File da definire dopo A0.**

## TASK A3 — Route e accessi edificio

**Dipendenza:** A2.

**Obiettivo:**

- aggiungere `/properties/buildings/new`;
- collegare pulsante, empty state e quick-add;
- proteggere la route con autenticazione;
- gestire annullamento e destinazione post-submit;
- aggiornare `src/utils/routes.ts`.

**File da verificare:**

- `src/App.tsx`;
- `src/utils/routes.ts`;
- `src/data/menu.ts`;
- `src/components/buildings/BuildingsHeader.tsx`;
- `src/components/buildings/EmptyState.tsx`.

## TASK A4 — Lista edifici reale

**Dipendenze:** A1, A3.

**Obiettivo:**

- sostituire `mockBuildings`;
- leggere il repository account-scoped;
- sottoscrivere le modifiche DB;
- gestire attivi e archivio;
- mantenere ricerca e ordinamento;
- usare ID reali per righe e selezione;
- mostrare `unitsCount` derivato;
- aggiornarsi dopo le mutazioni.

**File da verificare:**

- `src/hooks/useBuildings.ts`;
- `src/pages/BuildingsPage.tsx`;
- `src/components/buildings/*`;
- `src/data/mockBuildings.ts`.

## TASK A5 — Azioni edificio

**Dipendenza:** A4.

**Obiettivo:**

- archiviazione e ripristino;
- eliminazione protetta;
- azioni singole e bulk;
- conferma modale;
- selezione pulita dopo mutazione;
- errori reali e nessuna cancellazione parziale silenziosa;
- eliminare i `console.log` operativi.

## TASK A6 — Dettaglio e modifica edificio

**Stato:** da confermare in A0.

**Vincoli:**

- riusare schema e normalizzatore;
- mostrare unità tramite relazione canonica;
- non propagare automaticamente un cambio indirizzo alle unità;
- non creare route senza approvazione.

## TASK A7 — Collaudo edifici

Verificare:

- create;
- reload;
- lista e ricerca;
- archivio e ripristino;
- eliminazione libera e bloccata;
- edit, se previsto;
- isolamento tra account;
- `unitsCount`;
- console;
- nessuna modifica del codice durante il collaudo.

---

# BLOCCO B — Unità

## TASK B1 — Relazione unità–edificio

**Dipendenza:** A1.

**Obiettivo:**

- campo edificio tipizzato;
- soli edifici validi e non archiviati;
- opzione nessun edificio;
- persistenza di `relations.buildingId`;
- round-trip in create, edit e draft;
- ricalcolo `unitsCount` dopo ogni lifecycle dell’unità.

**File da verificare:**

- `src/components/property-form/schema.ts`;
- `src/components/property-form/tabs/Tab1Info.tsx`;
- `src/components/property-form/PropertyFormProvider.tsx`;
- `src/pages/NewProperty.tsx`;
- `src/db/propertyRepository.ts`;
- `src/db/databaseValidation.ts`;
- `src/db/dataSelectors.ts`.

## TASK B2 — Duplicati unità

**Dipendenza:** regola di unicità in [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md).

**Obiettivo:**

- permettere più unità nello stesso edificio e indirizzo;
- bloccare soltanto duplicati secondo la chiave approvata;
- escludere il record corrente in edit;
- gestire unità senza edificio;
- produrre errori di dominio.

**Casi obbligatori:**

- stesso edificio e interno differente;
- duplicato identico;
- edit senza falso positivo;
- edificio differente allo stesso indirizzo;
- nessun edificio.

## TASK B3 — Campi placeholder

**Dipendenza:** cataloghi professionali in [Decisioni da validare](./decisioni-da-validare.md).

**Obiettivo:**

- opzioni canoniche per tipo locazione, periodicità e classe energetica;
- `PropertyTypeID` obbligatorio;
- normalizzazione legacy;
- nessun enum duplicato e discordante;
- round-trip nel dettaglio.

## TASK B4 — ID annidati canonici

**Obiettivo:**

- sostituire `Date.now()` e `Math.random` nei dati persistiti;
- usare il generatore canonico;
- mantenere ID stabili in draft, submit e reload;
- impedire rigenerazioni durante render o normalizzazione;
- coprire documento catastale, chiavi, contratti, fotografie, contatti e documenti.

**File da verificare:**

- `src/components/property-form/tabs/Tab2Additional.tsx`;
- `Tab4Passwords.tsx`;
- `Tab5Contracts.tsx`;
- `Tab7Photos.tsx`;
- `Tab8Contacts.tsx`;
- `Tab9Documents.tsx`;
- `src/db/jsonDb.ts`.

## TASK B5 — Bozza unità

**Obiettivo:**

- salvataggio manuale;
- bozza separata dal record definitivo;
- nessuna scrittura automatica;
- gestione quota visibile;
- nessuna perdita degli allegati;
- cancellazione soltanto dopo submit riuscito;
- guard condiviso delle modifiche non salvate.

## TASK B6 — Modifica e lifecycle unità

**Obiettivo:**

- route edit approvata;
- idratazione una sola volta;
- riuso del form;
- aggiornamento reale;
- archivio e ripristino;
- eliminazione protetta da relazioni;
- azioni lista e dettaglio reali;
- rimuovere l’alert mock da `PropertyDetailPage.tsx`.

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

- OCR/analisi del documento catastale;
- qualità e completezza;
- validazione dei dati estratti;
- conferma utente prima della compilazione automatica;
- distinzione tra file salvato e documento realmente verificato.

## TASK B9 — Collaudo unità

Verificare:

- due unità nello stesso edificio;
- nove schede;
- allegati;
- ID stabili;
- draft;
- create ed edit;
- archive/restore;
- buildingId e unitsCount;
- reload;
- isolamento account;
- nessun doppio submit;
- nessuna scrittura eccessiva.

---

# BLOCCO C — Inquilini e contatti

Le bozze degli inquilini seguono il repository condiviso, il salvataggio manuale e il guard descritti nella [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md).

## TASK C1 — Garanti e rubrica

**Obiettivo:**

- rimuovere `existingContacts` da `mockTenants.ts`;
- usare `contactRepository`;
- ricerca nella rubrica reale;
- creazione del nuovo garante come `ContactRecord`;
- relazione tramite ID;
- nessun contatto duplicato o orfano;
- modello canonico unico tra inquilini e locazioni.

## TASK C2 — ID annidati

**Obiettivo:**

- sostituire `Math.random` per garanti, emergenze e documenti;
- mantenere ID stabili in draft e reload;
- migrare record senza ID valido;
- evitare rigenerazioni involontarie.

## TASK C3 — Duplicati anagrafici

**Dipendenza:** decisioni anagrafiche in [Decisioni da validare](./decisioni-da-validare.md).

**Obiettivo:**

- regole distinte per persona e società;
- controllo CF, partita IVA e SIRET secondo decisione;
- edit che esclude il record corrente;
- identificatori vuoti non trattati come duplicati;
- errori sul campo e scheda corretta;
- nessuna mutazione parziale.

## TASK C4 — Creazione atomica

**Dipendenze:** C1–C3.

**Obiettivo:**

- validare tenant e contatti prima della scrittura;
- una sola `saveJsonDb`;
- nessun tenant parziale;
- nessun contatto orfano;
- record riletto e normalizzato.

## TASK C5 — Modifica e lifecycle

**Obiettivo:**

- pagina o flusso edit;
- update repository;
- archivio e ripristino;
- eliminazione protetta dalle locazioni;
- preservare invito e documenti;
- sostituire azioni bulk con mutazioni reali;
- aggiornare `DataTable.tsx`, dove Modifica è ancora pending.

## TASK C6 — Azioni lista ancora simulate

**Stato:** richiede decisione per ogni azione.

Elementi:

- bulk delete/archive in `useTenantActions.ts`;
- export;
- download;
- notifica email;
- terminazione locazione;
- opzioni statiche nei modali.

Per ciascuno: implementare, collegare, disabilitare o rimuovere.

Import/export e azioni non operative rispettano la convenzione gialla e disabilitata.

## TASK C7 — Inviti email

**Origine:** commento in `TenantsPage.tsx`.

**Obiettivo futuro:**

- servizio email reale;
- stato invito distinto da invio effettivo;
- gestione errori e retry;
- nessun messaggio che implichi invio quando è stato aggiornato soltanto lo stato locale.

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

## TASK C10 — Collaudo inquilini

Verificare:

- persona e società;
- documenti;
- garante esistente e nuovo;
- contatto emergenza;
- duplicati fiscali;
- create/edit;
- archive/restore;
- invito locale;
- reload;
- isolamento account;
- ID stabili;
- nessun record orfano.

---

# BLOCCO D — Locazioni e pagamenti

## TASK D1 — Data finale sicura

**Stato:** calcolo automatico completato; override motivato e storico ancora da implementare.

### D1A — Calcolo automatico completato

- helper unico e testabile;
- somma mesi con clamp e regola inclusiva;
- stesso helper nell'effetto automatico e nel cambio tipo;
- protezione della data modificata manualmente;
- preservazione della data in edit;
- protezione della data già presente nella bozza ripristinata;
- test automatici sui casi limite;
- verifica manuale dei flussi principali.

Riferimenti: [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md) e [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md).

**Casi automatici coperti:**

```txt
2026-01-01 + 1 mese → 2026-01-31
2025-01-31 + 1 mese → 2025-02-28
2024-01-31 + 1 mese → 2024-02-29
2026-08-31 + 6 mesi → 2027-02-28
```

Verificare inoltre:

- 29 febbraio;
- 30 aprile;
- durate 36, 48, 72 e 108 mesi;
- cambio data iniziale;
- cambio tipo;
- edit con data presente.

### D1B — Override motivato e storico

- override manuale esplicito;
- motivo obbligatorio;
- catalogo minimo:
  - `Decesso`;
  - `Sequestro o provvedimento dell'autorità`;
  - `Sfratto`;
  - `Altro`;
- spiegazione obbligatoria per `Altro`;
- storico append-only;
- valore precedente e successivo;
- campi modificati;
- autore;
- timestamp.

D1B deve essere implementata con una task separata e non deve essere accorpata a D2.

Riferimenti: [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md) e [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md).

## TASK D2 — Addebito senza incasso automatico

**Stato:** D2A e D2B completate; storico, repair e migrazione di D2C e decisioni residue di D2D ancora aperti.

### D2A — Stato iniziale delle rate generate completato

- il metodo contrattuale non determina più l’incasso;
- rata scaduta non pagata → `late`;
- rata odierna non pagata → `pending`;
- rata futura non pagata → `pending`;
- nessuna `paidDate` automatica;
- nessuna ricevuta automatica durante la generazione;
- stessa regola per rata ordinaria e prima rata personalizzata;
- copertura automatica dei cinque metodi canonici;
- test con date fisse e senza persistenza.

### D2B — Conferma manuale completa completata

- `paid` è raggiungibile dall’interfaccia soltanto mediante conferma esplicita completa;
- i metodi canonici sono bonifico, contanti, assegno, carta e addebito;
- il metodo effettivo è obbligatorio;
- la data è obbligatoria, ISO valida e non futura;
- l’importo è obbligatorio, finito, positivo e uguale al totale del pagamento con confronto ai centesimi;
- nessun pagamento parziale è ammesso nella prima fase;
- la nota è facoltativa e normalizzata;
- la conferma persiste metodo, data, importo, nota e `confirmedAt`;
- `PaymentRecord.confirmation` resta nullable per i record storici;
- il record `confirmation` viene normalizzato in modo conservativo al reload;
- pagamento e attività della locazione sono mutati atomicamente con una sola scrittura del database sul successo;
- una validazione fallita non produce scritture;
- nessuna ricevuta o numerazione viene generata automaticamente;
- i pagamenti manuali vengono creati soltanto `pending` o `late`;
- il form manuale non contiene più checkbox `Pagato` né campo `Data pagamento`;
- un pagamento manuale già pagato non è modificabile;
- il collaudo browser ha verificato persistenza reale dopo reload, creazione, conferma, ritorno a non pagato, modifica ed eliminazione;
- durante il collaudo finale non sono stati rilevati fallback in memoria né ricevute automatiche.

### D2C — Storico, repair e migrazione

Restano aperti:

- rimozione della ricostruzione automatica di `paidDate` basata sul solo addebito;
- fallback conservativo per stato mancante o sconosciuto;
- nessuna invenzione di incassi durante migrazione o repair;
- tutela degli incassi storici reali;
- idempotenza;
- fixture di migrazione e repair;
- verifica dell’impatto su dashboard, saldi e grafici.

D2C deve essere implementata soltanto dopo avere introdotto test deterministici sullo storico e una strategia conservativa per i record esistenti.

D2C è la prossima task tecnica del Blocco D.

### D2D — Eccezioni ancora da decidere

- semantica dell’affitto prepagato ancora da validare;
- politica di conservazione o annullamento del numero ricevuta quando un pagamento torna non pagato;
- eventuale conservazione, annullamento o invalidazione della `confirmation` precedente dopo il ritorno a non pagato;
- queste decisioni non devono bloccare D2B, purché D2B non modifichi prepagato o annullamento ricevute.

Pagamenti parziali e documenti di pagamento sono futuri. Riferimento: [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md).

**Copertura D2B confermata:**

- cinque metodi canonici: bonifico, contanti, assegno, carta e addebito;
- pagamento manuale scaduto, odierno e futuro creato non pagato;
- metodo obbligatorio e data non futura;
- importo completo con rifiuto di importi parziali o superiori;
- reload dopo la conferma e persistenza del record `confirmation`;
- nessuna ricevuta automatica;
- ritorno a non pagato, modifica successiva e pulizia del record QA;
- blocco della rata generata futura coperto dai test repository; fixture browser non disponibile nel collaudo finale.

**Casi ancora dipendenti da D2C, D2D o D3:**

- storico, migrazione e repair;
- rinnovo;
- politica ricevute e trattamento della conferma precedente;
- semantica del prepagato;
- dashboard, saldi e grafici;
- regressione complessiva della locazione.

## TASK D3 — Regressione locazione mirata

Verificare:

- date;
- stati rate;
- deposito escluso dai ricavi;
- prepagato senza doppio ricavo;
- contratto e snapshot;
- edit;
- firma locale;
- nessuna regressione dei flussi già completati.

---

# BLOCCO E — Preferenze account-scoped

Le preferenze devono usare il contratto repository e l'isolamento descritti in [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md), senza trasformare questo blocco in un redesign delle preferenze.

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

---

# BLOCCO F — Modifiche non salvate

## TASK F0 — Specifica

**Stato:** specifica condivisa disponibile in [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md).

La matrice approvata copre, per ogni form:

- nuova/modifica unità;
- nuovo/modifica edificio;
- nuovo/modifica inquilino;
- nuova/modifica locazione.

Scenari:

- form vuoto;
- form dirty;
- bozza esistente;
- bozza ripristinata;
- `Resta`;
- `Abbandona`;
- `Salva bozza`;
- submit riuscito;
- submit fallito;
- apertura con `Riprendi bozza`, `Elimina e ricomincia`, `Annulla`.

## TASK F1 — Guard condiviso

**Obiettivo:**

- soluzione riusabile con React Router 7;
- modale applicativa per la navigazione interna;
- avviso nativo `beforeunload` per refresh e chiusura;
- `Resta`, `Abbandona` e bozza manuale secondo specifica;
- stato submitting;
- nessun doppio modal;
- focus e accessibilità;
- nessun blocco dopo submit.

## TASK F2 — Integrazioni

Mantenere task separate per form:

1. unità;
2. inquilino;
3. locazione;
4. edificio, dopo il Blocco A.

Non unire le integrazioni se modificano form complessi diversi.

## TASK F3 — Collaudo trasversale

Verificare create/edit, route, back, annulla, logout, refresh, bozza, abbandona, resta, submit riuscito e fallito.

---

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

## TASK G2 — Integrare l’inventario route nella documentazione tecnica

**Dipendenza:** G1.

Dopo la TASK G1, l’inventario verificato delle route deve confluire nella futura documentazione tecnica.

La task deve:

- distinguere route reali, route mancanti, controlli disabilitati e servizi non-route;
- usare come fonte tecnica il confronto tra `src/App.tsx`, `src/utils/routes.ts` e gli accessi UI reali;
- non creare pagine vuote soltanto per far risultare una route esistente;
- non assegnare priorità di prodotto non approvate dall’utente;
- non creare un registro parallelo separato dalla documentazione tecnica.

## TASK G3 — Edifici, unità e inquilini

Azioni già confermate come non operative:

- edifici: create/archive/delete;
- unità: export e import;
- dettaglio unità: modifica/eliminazione mock;
- inquilini: bulk delete/archive/export;
- download, email e terminazione.

Separare una task per area dopo decisione prodotto.

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

---

# BLOCCO H — Sicurezza, backend e storage

Riferimenti: [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md) e [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md). Password e codici, foto, documenti, OCR, PDF, scraping e firme sono funzioni future dipendenti da backend e storage sicuro.

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

## TASK H2 — Ruolo inquilino invitato

**Origine:** commento in `auth.types.ts`.

Prima dell’implementazione:

- verificare il comportamento del prodotto di riferimento;
- definire permessi;
- definire visibilità della locazione;
- impedire accesso ai dati privati del proprietario;
- impedire accesso alla scheda inquilino dell’account proprietario;
- definire CRUD ammessi;
- testare isolamento e autorizzazione lato backend.

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
- gestione offline e retry.

Dipendenze:

- C8;
- C9;
- B8;
- task documentali del Blocco I.

---

# BLOCCO I — Automazioni locazione e servizi documentali

Queste task derivano da commenti espliciti nel codice. Non unirle al fix D1/D2.

Sono attività future dipendenti dal backend: PDF, OCR, scraping, firme, email, automazioni e generazione documentale. Vedere [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md) e [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md).

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

## TASK I4 — Ricevute, fatture e numerazione

**Origine:** scheda ricevute.

Comprende:

- generatore documenti;
- numerazione persistente;
- ambito locazione/locatore;
- gestione concorrenza;
- prefissi e formato;
- ricevuta e fattura;
- SDI e PEC soltanto con servizio reale;
- stato invio;
- errori e retry;
- nessun numero assegnato due volte.

## TASK I5 — Riporto saldo e riconciliazione

Prima di automatizzare definire:

- pagamenti parziali;
- crediti;
- debiti;
- saldo;
- riconciliazione;
- effetto sulle rate successive;
- correzioni e audit.

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

## TASK I8 — Documenti durante creazione locazione

Valutare una transazione che:

- crea locazione e documenti senza duplicare file nella bozza;
- evita record orfani;
- gestisce rollback;
- conserva la possibilità attuale di aggiungere documenti dopo il primo salvataggio.

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

---

# BLOCCO J — Qualità e pulizia

## TASK J1 — Test automatizzati

**Stato:** infrastruttura iniziale disponibile.

Il progetto usa Vitest come runner TypeScript, con:

- script `test` e `test:run` in `package.json`;
- configurazione Node in `vitest.config.ts`;
- ricerca limitata a `tests/**/*.test.ts`;
- suite baseline in `tests/db/databaseBaseline.test.ts`;
- copertura iniziale delle business rule pure per identificativi, chiavi di localizzazione, codici fiscali e sovrapposizione delle date.

La baseline non conclude la task J1. I test devono essere estesi tramite task dedicate e separate.

La copertura corrente include:

- calcolo sicuro della data finale;
- stato iniziale delle rate generate;
- contratto puro della conferma completa;
- normalizzazione del record `confirmation`;
- flusso repository della conferma completa;
- atomicità e assenza di salvataggi sugli errori;
- cinque metodi canonici;
- pagamenti manuali creati non pagati;
- blocco della modifica di un pagamento manuale già pagato;
- esclusione delle locazioni archiviate dal controllo di sovrapposizione.

Snapshot verificato della suite:

```text
81 test passati
0 test falliti
0 test saltati
```

Aree residue:

- repository e business rule non ancora coperte;
- migrazioni e repair;
- isolamento account;
- duplicati;
- operazioni atomiche;
- bozze manuali;
- guard condiviso;
- repair, migrazione e transizioni storiche dei pagamenti;
- annullamento e politica ricevute, deposito, prepagato e consumer finanziari;
- storico append-only e override motivato;
- funzioni future gialle e realmente disabilitate.

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

---

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

Basato sulle decisioni G1–G7:

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
- suite automatica, se introdotta;
- report separato del debito globale residuo;
- nessun allargamento automatico.

---

# BLOCCO L — Documentazione tecnica

## TASK L1 — Acquisizione modello

L’utente fornirà i documenti dell’altro progetto per definire:

- struttura;
- convenzioni;
- frontmatter;
- indici;
- livello di dettaglio;
- stile per programmatori e AI.

Non progettare la struttura definitiva prima di riceverli.

## TASK L2 — Documentazione Props24

La futura documentazione dovrà permettere di individuare rapidamente:

- entrypoint;
- route;
- moduli owner;
- dati e relazioni;
- repository e mutazioni;
- lifecycle dei quattro CRUD;
- autenticazione e isolamento account;
- documenti e pagamenti;
- contratti da preservare;
- comandi di sviluppo e verifica;
- estensioni previste e loro dipendenze.

Non copiare il piano operativo nella documentazione tecnica.

## TASK L3 — README

Il `README.md` root è ancora quello del template Vite e deve essere sostituito.

Il nuovo README dovrà essere una porta d’ingresso breve verso:

- scopo del progetto;
- prerequisiti;
- installazione e avvio;
- build e lint;
- mappa della documentazione;
- stato locale/produzione;
- regole per contribuire.

## TASK L4 — README database

`src/db/README.md` contiene previsioni ormai superate e va riscritto o sostituito dalla documentazione tecnica del modulo database.

Non deve continuare a descrivere come futuro ciò che è già presente.

---

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
- i dati locali sono migrabili tramite repository.

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

### 6. Gate tecnici e documentali

- build positiva;
- lint mirato positivo;
- audit statico completato;
- collaudo browser completato;
- documentazione tecnica separata e aggiornata.

Supabase resta una fase successiva e non blocca il collaudo locale. Le task backend e i servizi esterni non bloccano la chiusura della fase locale, purché:

- siano classificati esplicitamente;
- i controlli non operativi siano disabilitati;
- la UI non dichiari risultati falsi;
- i dati salvati localmente restino coerenti.
