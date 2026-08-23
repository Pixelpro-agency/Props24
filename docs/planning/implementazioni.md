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
SHA applicativo esaminato: 144ca6500558b577fbe2858f70b9aa2a92a9b3fc
```

Le task completate non vengono replicate in questo documento. Il loro stato sintetico è mantenuto nella Todo list, mentre cronologia, evidenze tecniche e modifiche restano nella storia Git e nei test. Le sezioni seguenti contengono esclusivamente attività residue o task parziali con componenti ancora aperte.

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

A6.1 e A6.2 sono completate.

Il dettaglio Building mostra le unità collegate tramite la relazione canonica `relations.buildingId`. Dal Building attivo è ora possibile aprire il normale form Nuova unità in contesto `buildingId`; il contesto è account-scoped, persiste tramite query string, precompila e vincola l'indirizzo del Building e viene mantenuto correttamente anche nelle bozze.

La creazione produce Property reali figlie del Building, non nuovi Building. Più Property possono condividere lo stesso indirizzo del Building; `unitsCount` resta derivato dalla relazione canonica. Il precedente fallback di duplicato basato su indirizzo/città/CAP è stato rimosso in coerenza con UN-04. La chiave catastale completa resta responsabilità della futura B2.

Il prossimo punto tecnico è A6.3 — Modifica Building. A6 resta aperta fino al completamento di A6.3–A6.5.

# BLOCCO A — Edifici

## TASK A6 — Dettaglio e modifica edificio

**Stato:** aperta; suddivisa in A6.1–A6.5.

**Contratto trasversale:**

- il `Building` è il contenitore gestionale delle unità collegate;
- la lista Edifici mostra una riga per Building;
- `unitsCount` resta derivato;
- una Property appartiene al Building esclusivamente tramite `relations.buildingId`;
- nessun raggruppamento euristico per indirizzo, piano, interno o altri campi;
- le unità collegate sono mostrate dentro il dettaglio Building;
- una unità collegata non genera una nuova riga Building;
- il click sull'unità apre il dettaglio unità;
- il cambio indirizzo Building non riscrive automaticamente gli indirizzi delle unità;
- ED-03, ED-04 ed ED-05 restano vincolanti.

### A6.3 — Modifica Building

**Dipendenza:** A6.2 completata.

**Stato:** prossima task.

**Obiettivo:**

- riusare schema e `BuildingForm`;
- precompilare tutti i campi editabili;
- usare `repository.update`;
- rispettare ED-01/ED-02 escludendo il record corrente;
- non propagare automaticamente l'indirizzo alle unità;
- mostrare errori reali senza falso successo.

### A6.4 — Lifecycle dal dettaglio Building

**Dipendenza:** A6.3 completata.

**Obiettivo:**

- archiviare dal dettaglio;
- ripristinare dal dettaglio;
- eliminare con conferma esplicita;
- riusare i contratti A5;
- bloccare la delete con unità collegate;
- dopo delete riuscita tornare alla lista;
- nessuna cancellazione parziale.

### A6.5 — Gate tecnico consolidato A6

**Dipendenza:** A6.4 completata.

**Obiettivo:**

- consolidare lista → dettaglio;
- Building → unità collegate;
- unità → dettaglio unità;
- creazione unità in contesto Building;
- persistenza `buildingId`;
- edit;
- archive/restore/delete;
- delete bloccata;
- account isolation;
- subscription/reload;
- regressioni A1–A5.

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

Riferimenti: [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md) e [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md).

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

## TASK F3 — Integrazioni

**Dipendenze tecniche:** F1 e F2 sono soddisfatte. F3 resta aperta esclusivamente per l'integrazione Nuovo edificio.

### F3.4 — Nuovo edificio

**Stato:** APERTA.

**Dipendenza:** completamento del Blocco A.

**Obiettivo:**

- integrare il repository condiviso delle bozze nel form Nuovo edificio;
- bozza manuale account-scoped, senza autosalvataggio;
- ripresa, eliminazione e baseline clean;
- dirty state;
- guard condiviso `Resta` / `Abbandona` / `Salva bozza`;
- `beforeunload`;
- cleanup della bozza soltanto dopo create riuscita;
- preservare i dati dopo submit fallito;
- evitare doppie create durante submit/cleanup/recovery;
- non modificare il contratto Building definito da A2.

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

**Stato:** PARZIALE; l'infrastruttura e la copertura automatizzata sono attive, ma J1 accompagna le implementazioni ancora residue.

La baseline automatizzata verificata corrente è mantenuta nella Todo list e non viene duplicata qui.

**Aree residue:**

- repository e consumer ancora da implementare;
- duplicati e lifecycle non ancora completati;
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