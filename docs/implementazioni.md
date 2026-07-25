# Props24 — Implementazioni residue e piano operativo

> Documento di passaggio tra chat.  
> Questo file descrive esclusivamente il lavoro ancora da analizzare, decidere o implementare nello snapshot corrente del progetto.  
> Non è una documentazione dell’architettura già realizzata e non deve essere usato per riaprire task già chiuse senza una nuova evidenza nel codice.

## 1. Scopo del documento

Questo documento deve consentire a una nuova chat di:

1. comprendere quali interventi restano aperti;
2. sapere quali file leggere prima di proporre modifiche;
3. distinguere i difetti confermati dalle decisioni ancora richieste all’utente;
4. scomporre il lavoro in prompt esecutivi piccoli e verificabili;
5. non iniziare alcuna implementazione senza l’autorizzazione esplicita dell’utente;
6. non copiare automaticamente piani precedenti diventati parzialmente obsoleti.

Lo snapshot esaminato comprende:

- cartella `src/`;
- cartella `public/`;
- `package.json`;
- `package-lock.json`;
- cartella `docs/`;
- `COMING_SOON.md`;
- `README.md`.

Stack rilevante:

- React 19;
- TypeScript;
- Vite;
- React Router 7;
- React Hook Form;
- Zod;
- TanStack Query e TanStack Table;
- Tailwind CSS;
- database locale normalizzato e separato per account.

## 2. Regole di lavoro obbligatorie

### 2.1 Nessuna implementazione automatica

La chat che riceve questo documento deve prima:

1. leggere i file richiesti dalla task;
2. spiegare cosa ha compreso;
3. segnalare eventuali file o decisioni mancanti;
4. attendere l’autorizzazione dell’utente;
5. soltanto dopo preparare un prompt esecutivo.

Non modificare direttamente il progetto durante la fase di analisi.

### 2.2 Una task per volta

Ogni prompt esecutivo deve avere:

- un solo obiettivo verificabile;
- file modificabili esplicitamente elencati;
- file consultabili in sola lettura;
- comportamento richiesto;
- comportamenti da preservare;
- divieti di scope;
- test mirati;
- collaudo browser quando necessario;
- formato del report finale;
- generazione di `fileModificati.md` soltanto nelle task con modifiche.

Formula obbligatoria per le task di codice:

> Fai massimo 3 tentativi ragionati. Dopo il terzo tentativo fermati e riporta log, file modificati, comandi eseguiti, errori e cosa resta da capire.

Formula obbligatoria per i collaudi browser senza modifiche:

> Fai massimo 3 tentativi ragionati. Dopo il terzo tentativo fermati e riporta log, dati di test creati, passaggi eseguiti, errori e cosa resta da capire.

### 2.3 Stato corrente come unica fonte tecnica

I documenti precedenti contengono alcune assunzioni non più affidabili. Prima di ogni task verificare il codice corrente.

In particolare:

- non imporre più il vecchio vincolo letterale “una sola chiave `props24.localDb`”;
- il database è ora separato per account con chiavi derivate da `props24.localDb.<accountId>`;
- le chiavi locali dell’autenticazione sono intenzionali nella simulazione attuale;
- il problema residuo è la presenza di preferenze UI salvate in chiavi parallele come `properties-column-visibility` e `tenants-column-visibility`;
- `COMING_SOON.md` non è una fonte aggiornata delle route: deve essere confrontato con `src/App.tsx` e `src/utils/routes.ts`;
- non riaprire il punto 11 o il flusso Nuova locazione in generale; intervenire soltanto sui difetti residui identificati in questo documento.

### 2.4 Nessuna espansione arbitraria

Non:

- creare backend reali non richiesti;
- sostituire il database locale con un database remoto;
- implementare tutte le route future soltanto perché sono presenti nei menu;
- inventare campi del Nuovo edificio;
- introdurre librerie senza necessità dimostrata;
- cambiare design globale;
- rifattorizzare aree non coinvolte;
- correggere il lint globale come effetto collaterale;
- ricreare smoke test;
- modificare dati seed senza una task specifica;
- rimuovere funzioni future prima della decisione dell’utente.

---

# 3. Informazioni e file ancora necessari dall’utente

## 3.1 Nuovo edificio — materiale obbligatorio

Prima di progettare il form Nuovo edificio servono i file dell’altro progetto citato dall’utente.

Inviare almeno:

- componente o pagina del form Nuovo edificio del progetto di riferimento;
- eventuali componenti delle schede;
- schema o tipi dei dati;
- screenshot dell’interfaccia, quando il codice non basta a ricostruire il layout;
- elenco esatto dei campi;
- comportamento dei pulsanti;
- sezioni o schede richieste;
- eventuali documenti caricabili;
- regole di collegamento con le unità;
- eventuale pagina dettaglio/modifica dell’edificio;
- azioni richieste nella lista edifici.

Decisioni da ricevere:

1. un edificio deve avere soltanto i campi già presenti in `BuildingRecord` oppure dati aggiuntivi;
2. il nome dell’edificio è obbligatorio e univoco;
3. sono consentiti più edifici allo stesso indirizzo;
4. quali campi distinguono due edifici apparentemente uguali;
5. se il form deve permettere di associare unità già esistenti;
6. se una nuova unità può creare un edificio al volo;
7. se serve una pagina dettaglio edificio;
8. se serve una pagina modifica edificio;
9. regole esatte di archiviazione, ripristino ed eliminazione;
10. comportamento dei documenti dell’edificio;
11. necessità di quote millesimali o criteri di ripartizione;
12. destinazione dopo il salvataggio.

Senza queste informazioni è consentita soltanto l’analisi del livello dati esistente, non la definizione definitiva del form.

## 3.2 Modifiche non salvate — decisioni obbligatorie

Inviare l’eventuale discussione precedente oppure rispondere a questi punti:

1. mostrare un modal quando si cambia route con form modificato;
2. intercettare anche pulsante indietro, sidebar, navbar, menu e link interni;
3. usare `beforeunload` su refresh e chiusura scheda;
4. opzioni del modal:
   - resta nella pagina;
   - abbandona modifiche;
   - salva bozza e abbandona;
5. la bozza deve essere salvata automaticamente o soltanto su richiesta;
6. un form ripristinato da bozza è considerato “modificato”;
7. il cambio scheda interna del form deve essere sempre libero;
8. il logout deve essere bloccato o confermato quando esistono modifiche;
9. comportamento in caso di salvataggio bozza fallito;
10. comportamento dopo submit riuscito;
11. pagine da coprire:
    - Nuova unità;
    - modifica unità;
    - Nuovo edificio;
    - modifica edificio;
    - Nuovo inquilino;
    - modifica inquilino;
    - Nuova locazione;
    - modifica locazione.

## 3.3 Audit globale — politica richiesta

L’utente deve decidere quale sia lo scopo dell’audit:

- soltanto catalogare le funzioni mancanti;
- disabilitare e marcare chiaramente ciò che non è implementato;
- rimuovere le voci non necessarie;
- implementare soltanto una lista di priorità;
- implementare tutte le funzioni necessarie al prodotto minimo.

Non trasformare automaticamente tutte le route mancanti in task di sviluppo.

## 3.4 File root ancora utili

Prima di scrivere prompt esecutivi completi servono anche, se presenti:

- `vite.config.ts` o equivalente;
- `tsconfig.json`;
- `tsconfig.app.json`;
- `tsconfig.node.json`;
- `eslint.config.js` o equivalente;
- `index.html`.

Servono per preparare comandi di build/lint affidabili e non devono essere ricostruiti per supposizione.

## 3.5 Documenti citati ma non allegati

Il file `docs/planning/DB + CRUD fix.md` cita:

- `report_consegna_prompt_1_2_3_props24(1).md`;
- `01-context-selection(34).mdx`.

Inviare questi file soltanto se contengono vincoli ancora obbligatori non riportati nel codice o in questo documento.

---

# 4. Quadro delle aree ancora aperte

## Priorità critica

1. rendere operativo il CRUD degli edifici;
2. collegare realmente unità ed edifici;
3. correggere la regola che impedisce più unità allo stesso indirizzo;
4. eliminare l’incasso automatico falso per il metodo `addebito`;
5. correggere il calcolo automatico della fine contratto nei giorni di fine mese;
6. sostituire garanti mock e dati annidati non canonici nel flusso inquilino.

## Priorità alta

7. completare i campi ancora placeholder della Nuova unità;
8. rendere obbligatorio il tipo unità;
9. usare ID canonici nei dati annidati;
10. bloccare duplicati anagrafici reali;
11. rendere operative le azioni CRUD ancora simulate nelle liste;
12. introdurre la gestione condivisa delle modifiche non salvate;
13. migrare le preferenze colonne dalle chiavi locali parallele al database account-scoped.

## Priorità media

14. completare modifica e lifecycle delle unità;
15. completare modifica e lifecycle degli inquilini;
16. rendere reale o dichiaratamente non operativa l’importazione unità;
17. completare l’audit globale di route, link, bottoni e azioni;
18. riallineare il registro `COMING_SOON.md` dopo le decisioni.

## Chiusura

19. audit statico finale;
20. collaudo browser dei quattro flussi di creazione;
21. collaudo globale delle azioni approvate;
22. documentazione tecnica finale secondo il modello che l’utente fornirà successivamente.

---

# 5. Piano scomposto in task esecutive

Le task seguenti sono intenzionalmente piccole. Non devono essere fuse senza una motivazione esplicita.

## BLOCCO A — Nuovo edificio e CRUD edifici

### TASK A0 — Acquisizione requisiti Nuovo edificio

**Stato:** BLOCCATA IN ATTESA DEI FILE DELL’UTENTE.

**Obiettivo:** costruire una specifica completa e verificabile del form Nuovo edificio usando il progetto di riferimento.

**File correnti da leggere:**

- `src/pages/BuildingsPage.tsx`;
- `src/hooks/useBuildings.ts`;
- `src/components/buildings/*`;
- `src/types/building.ts`;
- `src/db/database.types.ts`;
- `src/db/jsonDb.ts`;
- `src/db/databaseValidation.ts`;
- `src/db/dataSelectors.ts`;
- `src/data/mockBuildings.ts`;
- `src/data/menu.ts`;
- `src/utils/routes.ts`;
- `src/App.tsx`.

**Output richiesto:**

- elenco campi;
- struttura schede/sezioni;
- valori obbligatori;
- relazioni;
- allegati;
- navigazione;
- regole CRUD;
- mappa file da creare/modificare;
- suddivisione definitiva A1–A7.

Non scrivere codice.

---

### TASK A1 — Repository canonico degli edifici

**Dipendenza:** A0 approvata.

**Obiettivo:** creare il livello dati reale per gli edifici.

**Problemi correnti confermati:**

- `LocalDatabase` contiene `buildings`;
- `BuildingRecord` esiste;
- non esiste `src/db/buildingRepository.ts`;
- la lista usa `mockBuildings`;
- creazione, archiviazione ed eliminazione sono simulate con `console.log`;
- `unitsCount` viene ricalcolato dal database ma non esiste un lifecycle repository completo.

**File candidati:**

- nuovo `src/db/buildingRepository.ts`;
- `src/db/database.types.ts`, soltanto se A0 richiede nuovi campi;
- `src/db/databaseErrors.ts`;
- `src/db/databaseValidation.ts`;
- `src/db/dataSelectors.ts`;
- `src/types/building.ts`.

**Operazioni minime:**

- `listBuildings`;
- `getBuildingById`;
- `createBuilding`;
- `updateBuilding`;
- `archiveBuilding`;
- `restoreBuilding`;
- `deleteBuilding`;
- normalizzazione input;
- timestamp ISO;
- ID tramite `generateId`;
- `unitsCount` esclusivamente derivato;
- blocco eliminazione quando esistono unità collegate;
- protezione duplicati secondo le decisioni di A0;
- singola scrittura `saveJsonDb` per mutazione.

**Criteri di chiusura:**

- nessun dato mock;
- record riletto dal database dopo ogni scrittura;
- validazione integrità aggiornata;
- errori di dominio distinguibili dalla UI;
- build e lint mirato positivi.

---

### TASK A2 — Schema, form e bozza Nuovo edificio

**Dipendenze:** A0 e A1.

**Obiettivo:** creare il form completo secondo il materiale di riferimento.

**File da definire dopo A0. Possibili file nuovi:**

- `src/pages/NewBuildingPage.tsx`;
- `src/components/building-form/BuildingFormProvider.tsx`;
- `src/components/building-form/BuildingFormTabs.tsx`;
- `src/components/building-form/schema.ts`;
- `src/components/building-form/hooks/useBuildingFormPersistence.ts`;
- componenti delle singole sezioni.

**Requisiti trasversali:**

- React Hook Form;
- schema Zod;
- errori associati al campo corretto;
- focus sul primo errore prioritario;
- campi numerici sicuri durante input transitorio;
- draft account-scoped;
- debounce;
- gestione quota;
- niente ID con `Math.random`;
- nessuna scrittura diretta a `localStorage`;
- nessun campo inventato rispetto ai file forniti.

**Criteri di chiusura:**

- ogni controllo visibile entra nel payload;
- round-trip completo;
- draft ripristinabile;
- submit singolo;
- toast singolo;
- nessuna perdita al cambio scheda interna.

---

### TASK A3 — Route e accessi al Nuovo edificio

**Dipendenze:** A2.

**Obiettivo:** collegare realmente il form.

**File candidati:**

- `src/App.tsx`;
- `src/utils/routes.ts`;
- `src/data/menu.ts`;
- `src/components/buildings/BuildingsHeader.tsx`;
- eventuale menu navbar, se richiesto dall’utente.

**Risultato richiesto:**

- route `/properties/buildings/new`;
- quick-add Edifici non più marcato come route mancante;
- pulsante Nuovo edificio navigante;
- empty state navigante;
- accesso protetto dall’autenticazione;
- ritorno coerente alla lista dopo annullamento;
- destinazione post-submit definita da A0.

---

### TASK A4 — Lista edifici collegata al database

**Dipendenze:** A1 e A3.

**Obiettivo:** sostituire `mockBuildings` con il database account-scoped.

**File candidati:**

- `src/hooks/useBuildings.ts`;
- `src/pages/BuildingsPage.tsx`;
- `src/components/buildings/BuildingsTable.tsx`;
- `src/types/building.ts`;
- `src/data/mockBuildings.ts`, da rimuovere dal runtime e cancellare soltanto se non più usato.

**Requisiti:**

- subscription alle modifiche DB;
- attivi e archivio reali;
- ricerca e ordinamento reali;
- `unitsCount` reale;
- selezione basata sugli ID dei record e non sugli indici della tabella;
- aggiornamento immediato dopo creazione;
- nessun `console.log` come implementazione.

---

### TASK A5 — Azioni edificio: archivia, ripristina, elimina

**Dipendenza:** A4.

**Obiettivo:** rendere operative le azioni singole e bulk.

**Requisiti:**

- archiviazione atomica;
- ripristino;
- eliminazione soltanto quando consentita;
- messaggio chiaro se esistono unità collegate;
- selezione pulita dopo mutazione;
- nessuna cancellazione parziale silenziosa;
- conteggi aggiornati;
- conferma modale;
- gestione errori senza uncaught.

---

### TASK A6 — Dettaglio e modifica edificio

**Stato:** DA CONFERMARE CON A0.

**Obiettivo:** implementare dettaglio e modifica soltanto se richiesti dal progetto di riferimento.

**Possibili route:**

- `/properties/buildings/:id`;
- `/properties/buildings/:id/edit`.

**Vincoli:**

- non creare queste pagine se l’utente richiede soltanto creazione e lista;
- l’edit deve riusare schema e normalizzatore del create;
- le unità collegate devono essere mostrate tramite relazione canonica;
- il cambio di indirizzo non deve riscrivere automaticamente gli indirizzi delle unità senza una decisione esplicita.

---

### TASK A7 — Collaudo edificio

**Obiettivo:** verificare:

- creazione;
- reload;
- lista;
- ricerca;
- archivio;
- ripristino;
- eliminazione libera;
- eliminazione bloccata con unità;
- modifica, se implementata;
- isolamento account;
- `unitsCount`;
- console pulita;
- working tree invariato durante il collaudo.

---

## BLOCCO B — Nuova unità e CRUD proprietà residuo

### TASK B1 — Relazione unità–edificio

**Dipendenza:** A1.

**Problema confermato:**

`createProperty()` salva sempre:

```ts
relations: {
  buildingId: null,
  tenantIds: [],
  leaseIds: [],
}
```

Il form non espone alcun edificio.

**Obiettivo:**

- introdurre un campo tipizzato per l’edificio;
- mostrare soltanto edifici validi e non archiviati;
- salvare `relations.buildingId`;
- consentire esplicitamente “nessun edificio”;
- preservare la relazione in modifica e bozza;
- ricalcolare `unitsCount` dopo create, update, archive, restore e delete dell’unità.

**File candidati:**

- `src/components/property-form/schema.ts`;
- `src/components/property-form/tabs/Tab1Info.tsx` oppure sezione stabilita dall’utente;
- `src/components/property-form/PropertyFormProvider.tsx`;
- `src/db/propertyRepository.ts`;
- `src/db/databaseValidation.ts`;
- `src/db/dataSelectors.ts`;
- `src/pages/NewProperty.tsx`;
- futura pagina edit proprietà.

---

### TASK B2 — Regola duplicati per unità nello stesso edificio

**Problema confermato:**

`assertUniquePropertyLocation()` usa soltanto:

- indirizzo;
- città;
- CAP.

Due unità dello stesso stabile vengono quindi bloccate.

**Obiettivo:** definire una chiave coerente con unità multiple.

**Decisione consigliata da validare con l’utente:**

- identificativo unità sempre univoco;
- stesso indirizzo consentito;
- collisione soltanto quando coincidono edificio e identificatori dell’unità, per esempio piano/interno/numero;
- unità senza edificio gestite con una regola esplicita.

**File candidati:**

- `src/db/businessRules.ts`;
- `src/db/databaseErrors.ts`;
- `src/db/propertyRepository.ts`;
- `src/db/databaseValidation.ts`;
- schema proprietà.

**Test obbligatori:**

- due unità stesso edificio e stesso indirizzo con interno differente;
- duplicato identico;
- stessa unità in edit senza falso positivo;
- stessa ubicazione ma edificio differente;
- unità senza edificio.

---

### TASK B3 — Completamento campi placeholder della Nuova unità

**Problemi confermati:**

Nel form corrente contengono soltanto “Scegli”:

- `PropertyRentType`;
- `PropertyBillingPeriod`;
- `PropertyEnergyConsumption2`.

`PropertyTypeID` ha opzioni ma non è obbligatorio nello schema.

**Obiettivo:**

- definire opzioni canoniche;
- normalizzare valori legacy;
- rendere obbligatorio `PropertyTypeID`;
- definire regole per campi energetici;
- garantire round-trip e visualizzazione nel dettaglio;
- non duplicare enum discordanti in più file.

**Input richiesto:**

- valori desiderati, quando non ricavabili dal progetto di riferimento;
- significato di “Tipo di locazione” nella scheda unità, distinto dal tipo contratto della locazione;
- periodicità da mostrare;
- classi energetiche richieste.

---

### TASK B4 — ID canonici nei dati annidati dell’unità

**Problema confermato:**

Sono ancora creati con `Date.now()` e `Math.random`:

- documento catastale;
- chiavi;
- contratti;
- fotografie;
- contatti;
- documenti.

**Obiettivo:**

- usare il generatore canonico;
- mantenere ID stabili in draft, submit e reload;
- evitare rigenerazione durante render o normalizzazione;
- impedire duplicati;
- verificare modifica ed eliminazione degli elementi annidati.

**File candidati:**

- `Tab2Additional.tsx`;
- `Tab4Passwords.tsx`;
- `Tab5Contracts.tsx`;
- `Tab7Photos.tsx`;
- `Tab8Contacts.tsx`;
- `Tab9Documents.tsx`;
- `src/db/jsonDb.ts`, soltanto per esporre un helper appropriato se necessario.

---

### TASK B5 — Persistenza bozza unità con debounce e gestione errori

**Problema confermato:**

`useFormPersistence.ts` scrive la bozza a ogni variazione.

**Obiettivo:**

- debounce;
- firma dell’ultimo payload salvato;
- evitare scritture identiche;
- gestione quota;
- errore visibile e non soltanto console;
- cleanup timer;
- cancellazione bozza soltanto dopo submit riuscito;
- nessuna perdita di file;
- compatibilità con il futuro guard delle modifiche non salvate.

**File candidati:**

- `src/components/property-form/hooks/useFormPersistence.ts`;
- `PropertyFormProvider.tsx`;
- `NewProperty.tsx`;
- errori DB comuni.

---

### TASK B6 — Modifica unità reale

**Problemi confermati:**

- `updateProperty()` esiste ma non è collegato a una pagina;
- il pulsante Modifica nel dettaglio non esegue alcuna navigazione;
- non esiste una route edit;
- il dettaglio usa ancora un messaggio di eliminazione mock.

**Obiettivo:**

- route edit;
- idratazione una sola volta per propertyId;
- riuso dello stesso form;
- associazione edificio preservata;
- protezioni se esistono locazioni o pagamenti;
- eliminazione reale mediante repository;
- gestione archiviato;
- ritorno al dettaglio con toast.

**Possibile route:**

`/properties/units/:id/edit`

La route deve essere approvata prima di essere introdotta.

---

### TASK B7 — Lifecycle, export e import unità

Questa task deve essere ulteriormente separata dopo l’audit globale.

**Problemi correnti:**

- l’export della lista esegue soltanto `console.log`;
- l’import mostra successo simulato e chiede di controllare la console;
- manca un ripristino unità chiaramente collegato nella lista;
- i messaggi di eliminazione possono non riflettere tutte le ragioni di blocco.

**Decisione richiesta:**

- implementare davvero import/export;
- mantenerli disabilitati e dichiarati futuri;
- rimuoverli temporaneamente.

Non dichiarare successo per un import che non crea record.

---

### TASK B8 — Collaudo unità

Verificare almeno:

- due unità nello stesso edificio;
- stessa via, piano/interno diversi;
- campi di tutte le nove schede;
- allegati;
- ID stabili;
- draft;
- create;
- edit;
- archive/restore;
- relazione buildingId;
- `unitsCount`;
- reload;
- isolamento account;
- nessun doppio submit;
- nessuna scrittura eccessiva.

---

## BLOCCO C — Nuovo inquilino e CRUD anagrafico residuo

### TASK C1 — Garanti reali e rubrica canonica

**Problemi confermati:**

- `Tab3Guarantors.tsx` importa `existingContacts` da `mockTenants.ts`;
- il testo afferma che il contatto viene salvato in rubrica;
- il submit salva copie annidate dentro il tenant;
- non viene creato o collegato un `ContactRecord`;
- le locazioni usano invece ID canonici di `contacts`.

**Obiettivo:**

- leggere i contatti dal repository;
- selezionare un contatto esistente;
- creare un nuovo contatto in modo transazionale;
- salvare riferimenti canonici;
- evitare copie divergenti;
- aggiornare i tipi e la migrazione dei record legacy;
- bloccare eliminazione del contatto se collegato;
- definire se i garanti del tenant e i garanti della locazione condividono lo stesso record.

**Decisione richiesta:**

- mantenere nel tenant un array di snapshot;
- salvare soltanto `contactIds`;
- usare entrambi con una chiara fonte canonica.

---

### TASK C2 — ID canonici dei dati annidati dell’inquilino

**Problema confermato:**

Usano ancora `Math.random`:

- garanti;
- contatti di emergenza;
- documenti.

**Obiettivo:**

- ID canonici;
- stabilità draft/reload;
- migrazione dei record senza ID valido;
- nessuna rigenerazione involontaria;
- test aggiunta/modifica/eliminazione.

---

### TASK C3 — Blocco duplicati anagrafici

**Problema confermato:**

- `findTenantByFiscalCode()` esiste;
- `createTenant()` non lo usa;
- il validatore segnala il duplicato come warning.

**Obiettivo:**

- regola distinta persona/società;
- codice fiscale persona;
- partita IVA società;
- eventuale email come segnale, non necessariamente chiave unica;
- errori di dominio;
- focus e scheda corretti;
- edit che esclude il record corrente;
- nessuna mutazione parziale.

**Decisioni richieste:**

- CF obbligatorio per persona oppure opzionale;
- partita IVA obbligatoria per società oppure opzionale;
- comportamento per soggetti esteri;
- duplicati consentiti con conferma o sempre bloccati.

---

### TASK C4 — Transazione creazione inquilino e contatti

**Dipendenze:** C1–C3.

**Obiettivo:**

- preparare tenant e nuovi contatti;
- validare tutto prima della scrittura;
- effettuare una sola `saveJsonDb`;
- nessun contatto orfano se il tenant fallisce;
- nessun tenant parziale se il contatto fallisce;
- restituire il record riletto e normalizzato.

---

### TASK C5 — Modifica, archivio e ripristino inquilino

**Problemi confermati:**

- non esiste `updateTenant`;
- non esistono repository reali di archive/restore;
- le azioni bulk usano `console.log`;
- alcuni modali della lista sono simulati.

**Obiettivo:**

- pagina o flusso edit;
- update repository;
- archiviazione;
- ripristino;
- cancellazione protetta dalle locazioni;
- stato invito preservato;
- documenti preservati;
- azioni lista reali;
- toast e report per operazioni parzialmente bloccate.

---

### TASK C6 — Import, export, email e terminazione dalla lista

**Stato:** DIPENDE DALL’AUDIT GLOBALE.

Elementi correnti simulati:

- delete/archive bulk nel relativo hook;
- export;
- download;
- email notification;
- terminazione locazione tramite modale locale con `console.log`;
- opzioni locazione statiche.

Per ciascun elemento decidere:

- implementare;
- collegare a repository esistente;
- disabilitare;
- rimuovere.

Non lasciare pulsanti apparentemente funzionanti che producono soltanto log.

---

### TASK C7 — Collaudo inquilino

Verificare:

- persona;
- società;
- carta identità fronte/retro;
- visura;
- garante esistente;
- nuovo garante;
- contatto di emergenza;
- documento;
- duplicati fiscali;
- create/edit;
- archive/restore;
- invito locale;
- reload;
- isolamento account;
- ID stabili;
- nessun record orfano.

---

## BLOCCO D — Difetti residui del flusso locazione a livello dati

> Il punto 11 e l’interfaccia Nuova locazione non vanno riaperti nel loro complesso.  
> Le task seguenti derivano da difetti ancora presenti nel codice corrente e devono restare isolate.

### TASK D1 — Calcolo fine contratto sicuro sui fine mese

**Problema confermato:**

In `LeaseForm/index.tsx`, sia l’effetto automatico sia `handleLeaseTypeChange()` usano direttamente:

```ts
date.setUTCMonth(date.getUTCMonth() + durationMonths);
date.setUTCDate(date.getUTCDate() - 1);
```

Questo comportamento è vulnerabile all’overflow dei giorni 29, 30 e 31.

**Obiettivo:**

- helper unico e testabile;
- sommare mesi con clamp al giorno valido;
- sottrarre un giorno secondo la regola contrattuale;
- usare lo stesso helper nell’effetto e nell’handler;
- non modificare una data finale inserita manualmente;
- preservare hydration edit e draft.

**Casi obbligatori:**

- 31 gennaio;
- 29 febbraio;
- 30 aprile;
- 31 agosto;
- durata 36, 48, 72 e 108 mesi;
- edit con data già presente;
- cambio tipo;
- cambio data iniziale.

---

### TASK D2 — Metodo addebito senza incasso automatico

**Problema confermato:**

`paymentRepository.ts` contiene una regola equivalente a:

```ts
if (method === 'addebito' && dueDate <= referenceDate) {
  return { status: 'paid', paidDate: dueDate };
}
```

Questo crea ricavi falsamente incassati.

**Obiettivo:**

- il metodo di pagamento non determina l’avvenuto incasso;
- rata scaduta non pagata → `late`;
- rata futura → `pending`;
- `paid` soltanto dopo azione esplicita;
- nessun `paidDate` automatico;
- nessuna ricevuta automatica;
- repair/migrazione coerenti;
- dashboard non gonfiata.

**Test obbligatori:**

- bonifico, contanti, assegno, addebito;
- scaduta, odierna, futura;
- rinnovo tacito;
- reload;
- ricevute;
- dashboard.

---

### TASK D3 — Collaudo regressivo locazione mirato

Verificare soltanto:

- date fine mese;
- metodo addebito;
- rate pending/late;
- nessuna rata paid automatica;
- deposito escluso dai ricavi;
- point 11 invariato;
- contratto e snapshot ancora coerenti;
- firma locale non regressa.

---

## BLOCCO E — Preferenze UI e storage account-scoped

### TASK E1 — Migrazione visibilità colonne nel database

**Problemi confermati:**

- `PropertiesPage.tsx` usa `properties-column-visibility`;
- `TenantsPage.tsx` usa `tenants-column-visibility`;
- `useLocalStorage.ts` scrive direttamente chiavi globali;
- `database.settings` esiste ma non viene usato per queste preferenze.

**Obiettivo:**

- struttura tipizzata in `settings`;
- repository preferenze;
- preferenze isolate per account;
- migrazione delle due chiavi legacy;
- rimozione dopo scrittura verificata;
- subscription UI;
- nessuna perdita di altre impostazioni.

**Importante:**

Non eliminare:

- chiavi auth;
- chiavi DB per account;
- meccanismo di migrazione del database.

Il nuovo vincolo è:

> nessuna preferenza applicativa di pagina deve vivere in una chiave parallela al database dell’account.

**File candidati:**

- `src/db/database.types.ts`;
- `src/db/jsonDb.ts`;
- nuovo `src/db/settingsRepository.ts`;
- `src/pages/PropertiesPage.tsx`;
- `src/pages/TenantsPage.tsx`;
- `src/hooks/useLocalStorage.ts`, eliminabile soltanto se non più usato.

---

### TASK E2 — Audit storage residuo

Dopo E1:

- inventariare tutte le chiavi create;
- distinguere auth, DB account e legacy;
- verificare logout/login tra due account;
- verificare preferenze distinte;
- verificare migrazione;
- nessuna lettura/scrittura diretta da componenti o pagine.

---

## BLOCCO F — Gestione condivisa delle modifiche non salvate

### TASK F0 — Specifica del comportamento

**Stato:** BLOCCATA IN ATTESA DELLE DECISIONI DELL’UTENTE.

Produrre una tabella per ogni form con:

- draft presente;
- debounce;
- stato dirty;
- submit;
- annulla;
- cambio route;
- refresh;
- logout;
- cambio scheda interno;
- edit/create.

Non scrivere codice.

---

### TASK F1 — Infrastruttura condivisa del guard

**Dipendenza:** F0.

**Obiettivo:** creare un’unica soluzione riusabile.

**Possibili file nuovi:**

- `src/hooks/useUnsavedChangesGuard.ts`;
- `src/components/ui/UnsavedChangesModal.tsx`;
- eventuale context/provider soltanto se necessario.

**Requisiti:**

- integrazione React Router 7;
- intercettazione navigazione interna;
- `beforeunload`;
- callback per confermare abbandono;
- callback opzionale per salvare bozza;
- stato submitting;
- niente doppio modal;
- niente blocco dopo submit;
- accessibilità;
- focus nel modal;
- nessun `window.confirm` come implementazione finale, salvo decisione diversa dell’utente.

---

### TASK F2 — Integrazione Nuova unità

Verificare:

- dirty state;
- draft;
- annulla;
- back;
- sidebar;
- navbar;
- refresh;
- submit riuscito;
- submit fallito;
- quota draft.

---

### TASK F3 — Integrazione Nuovo inquilino

Stessi scenari di F2, preservando:

- allegati;
- errore quota;
- ripristino bozza;
- tab;
- modali garanti/documenti.

---

### TASK F4 — Integrazione Nuova locazione e modifica locazione

Preservare:

- autosave esistente;
- hydration edit una sola volta;
- cambio scheda;
- documenti;
- contratto;
- firma;
- blocco edit durante firma;
- clear draft dopo create;
- nessun draft in edit salvo decisione esplicita.

---

### TASK F5 — Integrazione Nuovo edificio e pagine edit

Da eseguire soltanto dopo il blocco A.

---

### TASK F6 — Collaudo trasversale modifiche non salvate

Matrice minima:

- create/edit per quattro entità;
- route link;
- browser back;
- annulla;
- logout;
- refresh;
- salva bozza;
- abbandona;
- resta;
- submit;
- errore submit;
- due tab del browser, quando controllabile.

---

## BLOCCO G — Audit globale di bottoni, link, route e funzioni future

### TASK G1 — Inventario statico aggiornato

**Obiettivo:** produrre un report, senza modifiche, confrontando:

- route dichiarate in `src/App.tsx`;
- route riconosciute da `src/utils/routes.ts`;
- link in `src/data/menu.ts`;
- link in `src/data/navbar.ts`;
- link e pulsanti nei componenti;
- `console.log` usati come azione;
- `href="#"`;
- pulsanti senza handler;
- handler che mostrano successo senza mutazione;
- dati mock usati da pagine operative;
- TODO che dichiarano funzioni future;
- azioni volutamente disabilitate.

**Nota:**

`COMING_SOON.md` è datato e va usato soltanto come confronto, non come fonte autoritativa.

**Output:**

Per ogni elemento:

- percorso file;
- testo UI;
- route/handler;
- stato:
  - funzionante;
  - simulazione locale intenzionale;
  - dichiaratamente non implementato;
  - attivo ma senza effetto;
  - route mancante;
  - mock nel runtime;
  - da verificare in browser;
- priorità;
- decisione richiesta.

---

### TASK G2 — Decisione prodotto sulle funzioni future

**Stato:** BLOCCATA FINCHÉ L’UTENTE NON APPROVA L’INVENTARIO.

L’utente deve classificare ogni gruppo:

- implementare ora;
- disabilitare;
- nascondere;
- rimuovere;
- rinviare mantenendo evidenza gialla.

Non creare prompt di implementazione prima della classificazione.

---

### TASK G3 — Correzioni navigazione già supportata

Dopo G2, correggere soltanto link verso funzionalità già esistenti.

Possibili esempi da verificare sul codice corrente:

- registry delle route;
- link dinamici dettaglio/modifica locazione;
- link archivio dashboard;
- proprietà dettaglio;
- tenant dettaglio;
- logout;
- modelli documenti.

Non implementare nuove pagine in questa task.

---

### TASK G4 — Azioni attive ma simulate

Da separare per area.

Elementi già rilevati staticamente:

- Edifici: create/archive/delete;
- Proprietà: export;
- Import unità: submit simulato;
- Dettaglio proprietà: modifica ed eliminazione mock;
- Inquilini: bulk delete/archive/export;
- modali download/email/terminazione;
- dashboard: azioni verso pagine mancanti;
- premium/news/help senza destinazione verificata;
- import inquilini;
- route profilo/impostazioni/finanze/documenti/messaggi e altre sezioni future.

Ogni area deve diventare una task separata dopo G2.

---

### TASK G5 — Coerenza delle funzioni dichiaratamente non implementate

**Obiettivo:**

- controllo disabilitato realmente;
- stile coerente;
- tooltip chiaro;
- nessuna route inventata;
- nessun click;
- accessibilità `disabled`/`aria-disabled`;
- nessun elemento che sembra completato quando non lo è.

---

### TASK G6 — Aggiornamento registro Coming Soon

Da eseguire soltanto dopo l’audit e dopo le decisioni.

Aggiornare:

- route reali;
- route mancanti;
- elementi disabilitati;
- funzioni simulate;
- priorità approvate.

Questa è manutenzione del registro operativo, non ancora la documentazione architetturale finale.

---

## BLOCCO H — Audit e collaudo conclusivi

### TASK H1 — Audit statico dei quattro CRUD

Verificare:

- Edificio;
- Unità;
- Inquilino;
- Locazione.

Controlli:

- nessun mock nei flussi;
- ID canonici;
- date ISO;
- relazioni tramite ID;
- una mutazione atomica;
- errori di dominio;
- round-trip;
- draft;
- isolamento account;
- nessun pagamento falso;
- nessuna preferenza globale parallela;
- niente `console.log` come implementazione;
- nessun `Math.random` nei dati persistiti.

Produrre finding numerati e non correggere nella stessa task.

---

### TASK H2 — Collaudo browser dei quattro flussi

Scenario:

1. creare un edificio;
2. creare due unità nello stesso edificio;
3. creare persona e società;
4. creare garanti e contatti;
5. creare una locazione con una delle unità;
6. metodo addebito;
7. data iniziale di fine mese;
8. reload dopo ogni creazione;
9. verificare liste e dettagli;
10. verificare account separato vuoto;
11. verificare modifiche non salvate;
12. verificare archiviazione/ripristino;
13. verificare console.

Nessuna modifica di codice durante il collaudo.

---

### TASK H3 — Collaudo globale azioni e route

Basato esclusivamente sulle decisioni G2.

Verificare:

- ogni route dichiarata;
- ogni link visibile;
- ogni azione attiva;
- ogni controllo disabilitato;
- mobile/desktop essenziale;
- tastiera;
- console;
- nessuna pagina bianca;
- nessun falso successo.

---

### TASK H4 — Build e lint mirato finale

Poiché il lint globale può includere debito preesistente:

- build completa;
- lint su tutti i file modificati dalle task;
- report separato degli errori globali residui;
- nessun allargamento automatico dello scope;
- nessuno smoke test inventato.

---

## BLOCCO I — Documentazione tecnica finale

### TASK I1 — Acquisizione modello documentale

**Stato:** BLOCCATA.

L’utente fornirà i file di un altro progetto che mostrano:

- struttura delle cartelle documentali;
- convenzioni dei file;
- frontmatter;
- stile delle sezioni;
- cataloghi o indici;
- livello di dettaglio.

Fino a quel momento non progettare la nuova documentazione.

---

### TASK I2 — Documentazione Props24

Da definire dopo I1 e dopo la chiusura delle implementazioni.

La documentazione dovrà descrivere il progetto realmente risultante, non il piano e non la cronologia delle task.

Non usare `implementazioni.md` come documentazione architetturale finale.

---

# 6. Ordine operativo consigliato

L’ordine consigliato è:

1. A0 — ricevere e analizzare i file Nuovo edificio;
2. A1–A7 — chiudere edificio;
3. B1–B8 — chiudere unità e relazione edificio;
4. C1–C7 — chiudere inquilino e rubrica;
5. D1–D3 — correggere i due difetti dati residui della locazione;
6. E1–E2 — migrare preferenze UI;
7. F0–F6 — modifiche non salvate;
8. G1–G6 — audit globale e decisioni sulle funzioni future;
9. H1–H4 — audit e collaudi finali;
10. I1–I2 — documentazione tecnica.

Non eseguire blocchi in parallelo quando modificano gli stessi repository o gli stessi form.

---

# 7. Dipendenze principali

```text
File di riferimento Nuovo edificio
    ↓
A0 requisiti
    ↓
A1 repository edificio
    ↓
A2 form edificio
    ↓
A3 route
    ↓
A4/A5 lista e lifecycle
    ↓
B1 relazione unità-edificio
    ↓
B2–B8 unità completa
    ↓
C1–C7 inquilino completo
    ↓
D1/D2 correzioni locazione
    ↓
E1 preferenze account-scoped
    ↓
F guard condiviso
    ↓
G audit globale
    ↓
H audit e collaudo
    ↓
I documentazione
```

L’audit G1 può essere preparato in sola lettura prima degli altri blocchi, ma le sue correzioni devono attendere le decisioni dell’utente e la stabilizzazione dei quattro CRUD.

---

# 8. File tecnici principali per area

## Edifici

- `src/pages/BuildingsPage.tsx`
- `src/hooks/useBuildings.ts`
- `src/components/buildings/*`
- `src/types/building.ts`
- `src/data/mockBuildings.ts`
- `src/db/database.types.ts`
- `src/db/jsonDb.ts`
- `src/db/databaseValidation.ts`
- `src/db/dataSelectors.ts`
- `src/App.tsx`
- `src/data/menu.ts`
- `src/utils/routes.ts`

## Unità

- `src/pages/NewProperty.tsx`
- `src/pages/PropertiesPage.tsx`
- `src/pages/PropertyDetailPage.tsx`
- `src/components/property-form/*`
- `src/db/propertyRepository.ts`
- `src/db/businessRules.ts`
- `src/db/databaseErrors.ts`
- `src/db/databaseValidation.ts`
- `src/types/property.ts`
- `src/types/propertyDetail.ts`

## Inquilini

- `src/pages/NewTenantPage.tsx`
- `src/pages/TenantsPage.tsx`
- `src/pages/TenantDetailPage.tsx`
- `src/components/tenant-form/*`
- `src/components/tenants/*`
- `src/db/tenantRepository.ts`
- `src/db/contactRepository.ts`
- `src/db/businessRules.ts`
- `src/db/databaseErrors.ts`
- `src/db/databaseValidation.ts`
- `src/types/tenant.ts`
- `src/types/tenantDetail.ts`

## Locazioni residue

- `src/landlord/leases/components/LeaseForm/index.tsx`
- `src/landlord/leases/schema/leaseFormSchema.ts`
- `src/landlord/leases/data/leaseTypes.ts`
- `src/db/paymentRepository.ts`
- `src/db/leaseRepository.ts`
- `src/db/databaseValidation.ts`
- `src/db/jsonDb.ts`

## Storage e preferenze

- `src/db/database.types.ts`
- `src/db/jsonDb.ts`
- `src/pages/PropertiesPage.tsx`
- `src/pages/TenantsPage.tsx`
- `src/hooks/useLocalStorage.ts`
- nuovo `src/db/settingsRepository.ts`

## Navigazione e audit globale

- `src/App.tsx`
- `src/utils/routes.ts`
- `src/data/menu.ts`
- `src/data/navbar.ts`
- `src/components/layout/*`
- `src/components/navbar/*`
- `src/components/dashboard/*`
- tutte le pagine e i componenti contenenti azioni.

---

# 9. Criteri di chiusura complessivi

Il ciclo può essere dichiarato chiuso soltanto quando:

## Edificio

- create reale;
- record persistente;
- lista reale;
- archivio/ripristino;
- eliminazione protetta;
- unità collegate;
- conteggio derivato.

## Unità

- tutti i campi visibili salvati;
- edificio collegato;
- più unità allo stesso indirizzo consentite in modo controllato;
- ID annidati stabili;
- draft efficiente;
- edit reale;
- lifecycle coerente.

## Inquilino

- persona e società;
- documenti;
- garanti e rubrica reali;
- duplicati controllati;
- ID stabili;
- transazione atomica;
- edit e lifecycle reali.

## Locazione

- fine contratto corretta sui fine mese;
- addebito non incassato automaticamente;
- nessuna regressione del punto 11.

## Trasversale

- preferenze isolate per account;
- guard modifiche non salvate;
- route e azioni classificate;
- nessun falso successo;
- build;
- lint mirato;
- audit statico;
- browser QA;
- console pulita;
- working tree controllato;
- documentazione finale separata.

---

# 10. Primo passo della prossima chat

La prossima chat non deve iniziare a scrivere codice.

Deve chiedere e ricevere:

1. file del progetto di riferimento per Nuovo edificio;
2. requisiti e decisioni elencati in A0;
3. eventuale discussione precedente sulle modifiche non salvate;
4. politica desiderata per l’audit globale;
5. file root di configurazione mancanti.

Dopo la lettura deve produrre:

- analisi A0;
- mappa dei campi;
- differenze tra progetto di riferimento e Props24;
- file coinvolti;
- task definitive del solo blocco Edificio;
- richiesta di eventuali ulteriori file.

Soltanto dopo l’approvazione dell’utente si potrà scrivere il primo prompt esecutivo.
