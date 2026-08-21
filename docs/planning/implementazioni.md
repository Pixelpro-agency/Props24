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
SHA applicativo esaminato: 165f9d31bee68dd82425d0010ccc3498e6dd46aa
```

La chiusura tecnica di D2C, il pilot del repository contatti e le integrazioni F3.1/F3.2/F3.3 sono stati verificati sul codice pubblicato e nei collaudi dedicati. Le altre task devono essere riverificate prima di diventare prompt esecutivi.

## Mappa dei documenti

- [Todo list e stato di avanzamento](./todo-list.md)
- [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md)
- [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md)
- [Specifica Nuovo edificio](./specifiche/nuovo-edificio.md)
- [Ruoli, inviti e workspace](./specifiche/ruoli-inviti-e-workspace.md)
- [Decisioni da validare](./decisioni-da-validare.md)

Questo documento conserva il dettaglio delle task; la Todo list ne mostra lo stato sintetico e il registro delle decisioni contiene le domande professionali complete.

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

La specifica consolidata è disponibile in [Specifica Nuovo edificio](./specifiche/nuovo-edificio.md). ED-01–ED-07 sono validate: identificativo e duplicati sono account-scoped, il post-submit apre il dettaglio, le unità usano il form dedicato, il lifecycle è protetto e Criteri di ripartizione è eliminata. Il campo millesimi esistente resta semplice e facoltativo.

### 3.2 Duplicati delle unità

Ogni unità usa un UUID interno. Il controllo duplicati usa la chiave catastale normalizzata account-scoped solo quando completa; con dati incompleti non usa fingerprint o fallback alternativi.

### 3.3 Campi unità ancora senza valori

Sono validati i cataloghi professionali di:

- tipo di locazione dell’unità;
- periodicità di pagamento;
- classe energetica;
- eventuali valori legacy da normalizzare.

Riferimento: [Decisioni da validare](./decisioni-da-validare.md).

### 3.4 Duplicati anagrafici

La strategia è validata: identificativi fiscali italiani anche nei flussi italiani con soggetti esteri; duplicato fiscale nello stesso account = blocco senza override; email non probatoria; SIREN/SIRET fuori scope. Il CF dell'account Props24, se presente, è invece globalmente univoco fra account.

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

## 4. Stato operativo

F1 — repository condiviso delle bozze manuali — e F2 — guard condiviso delle modifiche non salvate — sono completate. L’allineamento di prodotto su ruoli, inviti e workspace è documentato, ma nessuna funzione è stata implementata. F3.1 — Nuovo inquilino —, F3.2 — Nuova unità — e F3.3 — Nuova locazione — sono completate e collaudate. F3 resta aperta; F3.4 resta dipendente dal Blocco A e F4 non può iniziare prima di questa integrazione residua. Inviti, portale inquilino, workspace professionali, visure e KPI restano futuri e non sono stati implementati.

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

**Dipendenze:** specifica consolidata A0; decisioni ED-01 ed ED-02.

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

**Dipendenze:** specifica consolidata A0; A1; F1; F2. ED-04, ED-06 ed ED-07 sono validate; PA-08 e PA-09 restano aperte.

**Obiettivo:**

- form completo secondo il riferimento;
- React Hook Form e schema Zod;
- errori sul campo e focus prioritario;
- input numerici sicuri;
- bozza manuale account-scoped e separata;
- nessuna scrittura automatica;
- guard condiviso delle modifiche non salvate;
- quattro schede attive e tre visibili, gialle e disabilitate;
- nessun Criterio di ripartizione; millesimi facoltativi senza logica speciale;
- submit singolo;
- toast singolo;
- round-trip di ogni controllo visibile.
- dopo il salvataggio, mostrare “Aggiungi unità” e aprire il form Nuova unità con `buildingId` e indirizzo precompilati, senza creazione inline.

**File esecutivi:** devono essere confermati tramite audit tecnico pre-esecutivo sulla base della specifica A0 già consolidata.

## TASK A3 — Route e accessi edificio

**Dipendenze:** A2; ED-03 validata.

**Obiettivo:**

- aggiungere `/properties/buildings/new`;
- collegare pulsante, empty state e quick-add;
- proteggere la route con autenticazione;
- gestire annullamento e aprire il dettaglio edificio dopo il submit;
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

**Dipendenze:** A4; ED-05 validata.

**Obiettivo:**

- archiviazione e ripristino;
- eliminazione protetta;
- azioni singole e bulk;
- conferma modale;
- selezione pulita dopo mutazione;
- errori reali e nessuna cancellazione parziale silenziosa;
- eliminare i `console.log` operativi.

## TASK A6 — Dettaglio e modifica edificio

**Stato:** aperta; routing del dettaglio e lifecycle sono definiti da ED-03 ed ED-05 validate.

**Vincoli:**

- riusare schema e normalizzatore;
- mostrare unità tramite relazione canonica;
- non propagare automaticamente un cambio indirizzo alle unità;
- mostrare le unità collegate e aprire il dettaglio unità dal relativo click;
- supportare modifica, archivio, ripristino ed eliminazione protetta.

## TASK A7 — Collaudo edifici

**Dipendenze:** completamento di A1–A6 e decisioni pertinenti al perimetro effettivamente implementato.

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
- con dati catastali incompleti non applicare fingerprint o altri fallback;
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

**Dipendenze:** F1 — Repository condiviso delle bozze manuali; F2 — Guard condiviso.

**Stato:** COMPLETATA con F3.2. Restano fuori scope la modifica e il lifecycle completo dell’unità, trattati da B6, e il collaudo dell’intero blocco B9.

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

### B9A — Card e KPI unità

Le card future definite sono:

- Affittate;
- Valore locativo;
- Valore patrimoniale;
- Guadagno lordo, basato sugli incassi effettivi nel periodo;
- Guadagno netto, al netto di tasse e costi realmente disponibili.

Affittate = unità non archiviate collegate a una locazione attiva secondo lo stato canonico della locazione. Valore patrimoniale usa il valore di acquisizione; un selettore comune offre Ultimo mese, Anno corrente, Ultimi 12 mesi e Dall'inizio; dati assenti non valgono zero e sono segnalati come incompleti. Il Tasso di occupazione è futuro per affitti brevi; la Copertura locativa è soprattutto aggregata e non è una card standard della singola unità tradizionale. B9A resta futura.

# BLOCCO C — Inquilini e contatti

Le bozze degli inquilini seguono il repository condiviso, il salvataggio manuale e il guard descritti nella [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md).

## TASK C1 — Garanti e rubrica

**Baseline già completata:**

- porta asincrona `ContactRepository`;
- adapter locale;
- binding immutabile all'account;
- `subscribe` account-scoped con callback di invalidazione senza payload;
- provider autenticato;
- store/hook asincrono con loading, error, refresh e protezioni dalle risposte stale;
- consumer dei garanti di Nuova locazione migrati;
- creazione di persone e società tramite repository;
- protezione degli ID garanti nella bozza legacy di Nuova locazione durante il caricamento asincrono dei contatti;
- collaudo browser dedicato;
- click-through del backdrop corretto.

**Attività residue:**

- rimuovere le dipendenze residue da `existingContacts` e dai mock;
- migrare i consumer contatti di Nuovo inquilino;
- completare rubrica e lifecycle dei contatti;
- consolidare il modello canonico tra inquilini e locazioni;
- gestire contatti di emergenza, duplicati e record orfani;
- integrare CT-01–CT-05 riallineate e validate, inclusi flussi esteri italiani e hard block account-scoped.

## TASK C2 — ID annidati

**Obiettivo:**

- sostituire `Math.random` per garanti, emergenze e documenti;
- mantenere ID stabili in draft e reload;
- migrare record senza ID valido;
- evitare rigenerazioni involontarie.

## TASK C3 — Duplicati anagrafici

**Dipendenza:** CT-01–CT-05 sono validate e riallineate.

**Obiettivo:**

- regole distinte per persona e società;
- controllo CF e partita IVA secondo decisione; nessun SIREN/SIRET corrente;
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

### C10A — Card inquilini

Le tre card approvate sono:

- Attivi = inquilini non archiviati;
- Connessi = inquilini con invito accettato e account collegato;
- Con locazione = inquilini distinti presenti in almeno una locazione attiva.

Gli stati degli inviti restano documentati nella TASK C7 e non sostituiscono le tre card principali della lista inquilini. Non aggiungere altre card senza una decisione separata.

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

Riferimenti: [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md) e [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md).

## TASK D2 — Addebito senza incasso automatico

**Stato:** D2A, D2B e D2C completate; decisioni residue di D2D ancora aperte.

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
- PA-01 riguarda soltanto l'eventuale catalogo futuro di Finanze e non riapre D2B;
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

### D2C — Storico, repair e migrazione completati

- gli status mancanti o sconosciuti vengono normalizzati conservativamente come non pagati e ricondotti a `late` o `pending` secondo la scadenza;
- il metodo contrattuale, incluso l’addebito, non ricostruisce `paidDate`;
- gli incassi storici realmente supportati da `paidDate` e, quando presente, da una `confirmation` coerente vengono tutelati;
- le rate generate duplicate per `leaseId + category + dueDate` vengono selezionate in base all’evidenza, mentre i pagamenti manuali non vengono deduplicati;
- le cronologie legacy non vuote vengono preservate e normalizzate senza sostituzioni integrali basate sulla forma degli ID o su singole anomalie;
- le cronologie legacy vuote vengono ricostruite conservativamente con sole rate contrattuali eleggibili `late` o `pending`;
- migrazione e repair non inventano incassi, spese, `paidDate`, `confirmation` o `receiptNumber`;
- il repair di un database account viene persistito immediatamente soltanto quando modifica il valore memorizzato, poi riletto e verificato; una seconda inizializzazione non riscrive il database;
- consumer finanziari e saldi usano una semantica condivisa: la cassa richiede `paid` e `paidDate`, lo scaduto considera soltanto ricavi arrivati alla scadenza;
- i movimenti con `accountingRole: deposit` restano esclusi dai consumer generali di ricavo e spesa;
- la copertura dedicata a D2C comprende 31 test. La baseline complessiva corrente è mantenuta nella TASK J1.

### D2D — Eccezioni ancora da decidere

**Decisioni collegate:** PA-10, PA-11 e PA-12.

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

## TASK F1 — Repository condiviso delle bozze manuali

**Stato:** COMPLETATA.

L’infrastruttura condivisa e account-scoped del repository bozze è completata. L’integrazione è conclusa in Nuovo inquilino, Nuova unità e Nuova locazione; resta da applicare, dopo il Blocco A, a Nuovo edificio.

### F1A — Contratto e operazioni pure — COMPLETATA

- port asincrono `DraftRepository` con `get`, `list`, `save` e `delete`, senza subscription;
- form supportati: `building`, `property`, `tenant` e `lease`;
- modalità `create` ed `edit`;
- chiave logica univoca composta da `accountId`, `formType`, `mode` ed `entityId`, con `entityId: null` in create e stringa valida in edit;
- normalizzazione e costruzione della chiave, lettura, elenco, upsert e cancellazione come operazioni pure;
- validazione payload tramite `DraftDefinition`, cloni difensivi ed errori dominio dedicati.

### F1B — Schema canonico e migrazione — COMPLETATA

- database locale canonico aggiornato da `schemaVersion` 3 a `schemaVersion` 4 con `drafts: DraftRecord<unknown>[]`;
- migrazione degli slot embedded `tenantForm`, `propertyForm` e `leaseForm` e import delle standalone `tenant_form_draft` e `property_form_draft`;
- riconciliazione con equivalenza JSON ricorsiva, ordine degli array significativo e conservazione dei conflitti reali;
- rimozione delle standalone soltanto dopo scrittura verificata, rollback e migrazione idempotente;
- validazione dei record canonici, inclusa la proprietà `payload` obbligatoria e la validità di `payload: null`;
- esclusione di `drafts` dal CRUD generico;
- bridge temporaneo `getDraft`, `setDraft` e `clearDraft`;
- mutazione `createLease` atomica per il dominio Lease, pagamenti, deposito e relazioni, senza cancellazione della bozza; dopo la create riuscita il cleanup F1 avviene separatamente tramite `DraftRepository` e, se fallisce, il recovery ritenta soltanto la delete senza rollback o seconda create.

### F1C — Adapter locale account-scoped — COMPLETATA

- factory `createLocalDraftRepository({ accountId })` basata su un unico `createJsonDbAccountScope(accountId)`;
- account catturato alla costruzione e indipendenza dai cambi successivi dell’account globale;
- letture senza scritture applicative, una scrittura per save valida e delete esistente, nessuna scrittura per validazione rifiutata o delete assente;
- rilettura del record dal database verificato dopo la save;
- isolamento logico e fisico tra account;
- quota tradotta in `DraftStorageQuotaError`, altri errori gateway in `DraftStorageError`, con errori dominio e cause preservati;
- nessuna subscription.

La verifica conclusiva F1 ha registrato 74 test mirati e 218 test complessivi passati, senza test falliti o saltati; ESLint, build e `git diff --check` sono risultati positivi.

**Fuori dal perimetro F1:** le integrazioni nei singoli form restano task F3. F3.1, F3.2 e F3.3 sono concluse; F3.4 resta aperta. Il contratto approvato prevede salvataggio manuale e nessun debounce o autosave.

## TASK F2 — Guard condiviso

**Stato:** COMPLETATA.

### F2A — Data Router e infrastruttura test — COMPLETATA

- migrazione da `BrowserRouter` a `createBrowserRouter` e `RouterProvider`;
- configurazione condivisa e riusabile tramite `createAppRoutes`;
- `QueryClientProvider` e `AuthProvider` conservati sopra il router;
- ramo autenticato con provider contatti account-scoped, `Layout` e `Outlet`;
- tutte le 17 route, i componenti e i redirect preservati;
- aggiunte esclusivamente come dev dependency `jsdom`, `@testing-library/react` e `@testing-library/user-event`;
- nessun comportamento applicativo modificato intenzionalmente.

### F2B — Contratto e macchina a stati pura — COMPLETATA

- fasi `idle`, `blocked`, `saving`, `discarding` e `proceeding`;
- prima navigazione sospesa preservata ed eventi concorrenti ignorati;
- `Resta`, save e discard asincroni con retry ed errore normalizzato;
- bypass one-shot e helper puri per blocco, dialog e disponibilità azioni;
- nessuna dipendenza da React, router, auth o database.

### F2C — Hook e dialog — COMPLETATA

- binding ufficiale con `useBlocker` e `useBeforeUnload` per refresh e chiusura;
- `UnsavedChangesDialog` basato sulle primitive accessibili Headless UI;
- azioni `Resta`, `Abbandona` e `Salva bozza`;
- operazioni serializzate, errori mostrati senza chiudere il dialog e bypass utilizzabile nello stesso tick;
- callback aggiornate senza closure obsolete;
- titolo e descrizione associati, focus iniziale, focus trap, ripristino del focus, Escape e backdrop equivalenti a Resta, alert accessibile e pulsanti disabilitati durante le operazioni;
- compatibilità React Strict Mode verificata da F2C-FIX1.

### F2D — Integrazione logout — COMPLETATA

- test integrato con `AuthProvider` e `LogoutPage` reali;
- sessione e account conservati mentre il dialog è aperto e durante operazioni pendenti;
- logout eseguito soltanto dopo save o discard riusciti;
- `Resta` ed errori non cancellano la sessione;
- prima destinazione `/logout` preservata rispetto a navigazioni concorrenti;
- nessuna doppia operazione sotto Strict Mode;
- smoke browser della baseline applicativa positivo.

### Verifica finale F2

La verifica conclusiva registra 5 file di test specifici F2 e 124 test specifici F2. La suite complessiva comprende 21 file e 342 test passati, con 0 falliti e 0 saltati. Lint focalizzato, build e `git diff --check` sono positivi. Lo smoke browser è positivo. Restano non bloccanti il warning Vite sulla dimensione del chunk e gli avvisi LF→CRLF.

**Fuori dal perimetro F2:** le integrazioni nei singoli form restano task F3. Il guard è ora attivo e collaudato in Nuovo inquilino, Nuova unità e Nuova locazione; Nuovo edificio resta da integrare. F3 e F4 non sono completate.

## TASK F3 — Integrazioni

**Dipendenze tecniche:** F1 e F2 sono soddisfatte. F3 resta aperta.

Mantenere task separate per form:

1. **F3.1 — Nuovo inquilino — COMPLETATA.** Repository condiviso e controller account-scoped, salvataggio esclusivamente manuale, restore/cancellazione, baseline dirty, guard di navigazione e logout, history browser, submit con cleanup e recovery sono integrati. Strict Mode e destinazione sospesa dopo `Salva bozza` sono coperti; collaudo tecnico e browser conclusi.
2. **F3.2 — Nuova unità — COMPLETATA.** Definition e controller Property, restore con `Riprendi`, `Elimina e ricomincia` e `Annulla`, guard di sidebar, header Indietro, footer Annulla, browser back e logout sono integrati. `Resta` non scrive; `Abbandona` ripristina la baseline persistita; `Salva bozza` conserva la destinazione. Submit singolo, cleanup atomico e recovery evitano duplicazioni; duplicati, focus errori, account scope e responsive sono verificati. `useFormPersistence.ts` legacy è eliminato. Le condizioni del guard sono sincronizzate con `useLayoutEffect` prima delle navigazioni imperative del commit corrente; reducer, bypass e `navigate(-1)` restano invariati. Il round-trip `Resta → Abbandona → remount → Riprendi` è coperto. Collaudo finale: 38 file, 549 test, 20/20 scenari browser, build e lint PASS, nessun errore console e nessun fallimento di rete osservato.
3. **F3.3 — Nuova locazione — COMPLETATA.** Controller Lease create-only account-scoped con chiave F1 canonica `formType: lease`, `mode: create`, `entityId: null`; salvataggio esclusivamente manuale, senza autosave o debounce, e apertura con `Riprendi bozza`, `Elimina e ricomincia` e `Annulla`. `activeTab` è persistita come stato UX ma esclusa dal dirty; i riferimenti Property, Tenant e Guarantor sono riconciliati senza cancellazione silenziosa degli ID. Il guard copre navigazioni applicative, header, footer, sidebar, browser back, logout e `beforeunload`, con `Resta`, `Abbandona`, `Salva bozza` e destinazione sospesa preservata. Dopo la create riuscita il cleanup F1 è separato dal repository Lease; il recovery ritenta soltanto la cancellazione senza seconda create. Il submit lock sincrono create-only viene rilasciato se `createLease` fallisce e resta acquisito dopo una create riuscita, anche nel cleanup/recovery. Il ramo edit Lease resta separato e preservato. Collaudo conclusivo: 47 file e 683 test, tre suite complete consecutive verdi, build e lint PASS, browser reale isolato PASS, doppio submit senza duplicazione, una sola locazione QA, cleanup QA completato, zero errori console, unhandled rejection o failure di rete e nessun residuo QA.
4. **F3.4 — Nuovo edificio — APERTA.** Resta dipendente dal Blocco A.

Non unire le integrazioni se modificano form complessi diversi.

## TASK F4 — Collaudo trasversale

**Stato:** APERTA; non avviabile ora.

**Dipendenze:** completamento dell’integrazione residua F3.4, oltre alla baseline F2 già soddisfatta.

Verificare create/edit, route, back, annulla, logout, refresh, bozza, abbandona, resta, submit riuscito e fallito.

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

**Stato:** infrastruttura attiva e copertura estesa; task ancora aperta perché accompagna le implementazioni future.

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
- repair e migrazione dei pagamenti;
- deduplicazione delle rate generate;
- consumer finanziari conservativi;
- isolamento account dei contatti;
- adapter `ContactRepository`;
- composition root;
- store asincrono, risposte obsolete, disconnect e reconnect.

Snapshot verificato della suite:

```text
13 file di test
144 test passati
0 test falliti
0 test saltati
```

Aree residue:

- repository futuri;
- duplicati non ancora definiti;
- lifecycle e CRUD mancanti;
- bozze manuali;
- guard condiviso;
- D1B — storico append-only e override motivato;
- D2D — prepagato, ricevuta e confirmation precedenti;
- funzioni future gialle e realmente disabilitate.
- audit finali.

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
- suite automatica completa positiva;
- report separato del debito globale residuo;
- nessun allargamento automatico.

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