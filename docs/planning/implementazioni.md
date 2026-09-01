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
SHA applicativo esaminato: 8537adff923bb914c425efb978d80dc7f9eccfb0
Baseline di partenza del ciclo C: 7bbfdab336813f5f075b85223198d446fd252144
```

Le task completate non vengono replicate in questo documento. Il loro stato sintetico è mantenuto nella Todo list, mentre cronologia, evidenze tecniche e modifiche restano nella storia Git e nei test. Le sezioni seguenti contengono esclusivamente attività residue o task parziali con componenti ancora aperte.

## Mappa dei documenti

- [Todo list e stato di avanzamento](./todo-list.md)
- [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md)
- [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md)
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

### 3.1 Duplicati anagrafici

La strategia è validata: identificativi fiscali italiani anche nei flussi italiani con soggetti esteri; duplicato fiscale nello stesso account = blocco senza override; email non probatoria; SIREN/SIRET fuori scope. Il CF dell'account Props24, se presente, è invece globalmente univoco fra account.

### 3.2 Modifiche non salvate

La decisione è consolidata in [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md): bozza manuale separata, nessun autosalvataggio, stato dirty, modale applicativa `Resta`/`Abbandona`/`Salva bozza`, ripresa o eliminazione della bozza e `beforeunload` nativo per refresh e chiusura.

### 3.3 Funzioni future, route e servizi esterni

Le funzioni non disponibili restano visibili quando utili, gialle, realmente disabilitate, non cliccabili e accompagnate da spiegazione. Non usano route fittizie o falsi successi. La convenzione è definita nella [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md).

### 3.4 Backend e produzione

La destinazione approvata è Supabase con PostgreSQL, secondo [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md). Restano da definire in task future:

- autenticazione e autorizzazione;
- storage documentale;
- invio email;
- servizi documentali;
- deployment.

## 4. Stato operativo

Il Blocco A — Edifici e il Blocco F — Modifiche non salvate sono completati e collaudati.

Nel Blocco B — Unità sono completate localmente B1–B6 e B9: relazione unità–edificio, duplicati catastali, campi canonici, ID annidati canonici, bozze manuali, modifica/lifecycle e collaudo browser finale.

B9 si è conclusa con PASS funzionale e nessun finding applicativo riproducibile. Il file chooser per gli allegati e l'ispezione read-only dello storage interno non erano disponibili nello strumento di collaudo; i contratti di persistenza e identità interessati restano coperti dai gate automatizzati B4/B6.

La baseline tecnica corrente resta 93 file di test e 1099 test passati, con build positiva e lint mirato B6 senza errori.

Lo SHA applicativo corrente è `590204e6482d28b8caa778cc63eec3fc88d4cddb`.

Nel Blocco B restano residue B7 — Import/Export, rinviata; B8 — Analisi catastale, futura/backend; B9R — verifiche browser residue delle Unit, in attesa di strumento adeguato; e B9A — Card e KPI Unit, futura. B9R non riapre il PASS funzionale di B9: conserva soltanto i controlli browser che non erano osservabili con lo strumento disponibile.

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

C1 — Garanti e rubrica e C2 — ID annidati canonici Tenant sono completate e verificate. Il ciclo locale prosegue nell'ordine C3 → C4 → C5 → C6 → C10. C3 completa l'ultima fondazione ancora residua prima di C4; C4 mantiene la dipendenza dai contratti già consolidati in C1 e C2 oltre che dal completamento di C3. C5 è owner del lifecycle reale Tenant, incluse le mutazioni singole e bulk; C6 non deve duplicare C5 e resta owner soltanto delle ulteriori azioni lista simulate o ancora da classificare.

C7 — Inviti email, C8 — Allegati delle bozze, C9 — Verifica documentale/OCR e C10A — Card inquilini restano future e non bloccano C10 nel perimetro locale. C10 verifica l'invito locale già supportato, non l'invio email backend futuro.

Le bozze degli inquilini seguono il repository condiviso, il salvataggio manuale e il guard descritti nella [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md).

## TASK C3 — Duplicati anagrafici

**Dipendenza:** CT-01–CT-05 sono validate e riallineate.

C3 viene completata tramite C3.1 → C3.2 → C3.3 → C3.4.

Il modello Contact–Tenant consolidato da C1 e le identità persistenti consolidate da C2 devono essere preservati. C3 introduce gli hard block fiscali account-scoped previsti da CT-01–CT-05 senza trasformare email, telefono, SIRET/SIREN o altri segnali secondari in prove di duplicazione.

Il controllo dei duplicati resta separato per dominio persistente:

- `ContactRecord` viene confrontato con gli altri `ContactRecord` dello stesso account;
- `TenantRecord` viene confrontato con gli altri `TenantRecord` dello stesso account;
- C3 non introduce un hard block incrociato Contact↔Tenant.

Un Contact può quindi rappresentare una persona o società che in seguito assume anche il ruolo di Tenant senza dover essere cancellato dalla rubrica. Questa separazione preserva il modello Contact autonomo consolidato da C1.

### Contratto fiscale consolidato

Persona:

- il codice fiscale è facoltativo nella prima anagrafica;
- se valorizzato, lo stesso CF nello stesso account costituisce duplicato;
- la P.IVA personale non costituisce chiave di duplicazione della persona;
- valori fiscali vuoti non costituiscono identità e non collidono.

Società/ente:

- il codice fiscale dell'ente è distinto dal codice fiscale dell'eventuale rappresentante legale;
- stesso CF dell'ente nello stesso account = duplicato;
- stessa P.IVA dell'ente, quando valorizzata, nello stesso account = duplicato;
- è sufficiente la collisione di uno dei due identificatori per bloccare la mutazione;
- valori vuoti non costituiscono identità e non collidono.

Gli stessi identificativi fiscali restano ammessi in account differenti.

Email, telefono, nome, indirizzo, SIRET e SIREN non costituiscono chiavi hard-block correnti.

### Modello Tenant società

Lo stato attuale usa `TenantFiscalCode` anche nella sezione del rappresentante legale delle società. Questo campo non deve essere reinterpretato come codice fiscale dell'ente.

C3 introduce quindi un campo distinto:

```text
TenantCompanyFiscalCode
```

nel form e:

```text
companyFiscalCode
```

nel `TenantRecord`.

Per un Tenant `person`:

```text
TenantFiscalCode → TenantRecord.fiscalCode
```

Per un Tenant `company`:

```text
TenantCompanyFiscalCode → TenantRecord.companyFiscalCode
TenantVatNumber         → TenantRecord.vatNumber
```

Il campo:

```text
TenantFiscalCode
```

presente nella sezione Rappresentante legale continua a rappresentare il codice fiscale della persona fisica rappresentante e non partecipa al duplicate check della società.

Analogamente:

```text
TenantVatNumberPersonal
```

non partecipa al duplicate check della società.

I Tenant company legacy privi di `companyFiscalCode` vengono normalizzati con valore vuoto. Non viene eseguita alcuna migrazione euristica che copi il vecchio `fiscalCode` in `companyFiscalCode`, perché ciò confonderebbe l'identità fiscale dell'ente con quella del rappresentante legale.

### C3.1 — Contratto identità fiscale e modello company Tenant

Consolidare le pure business rules fiscali condivise prima di applicare qualsiasi mutation block.

Obiettivi:

- mantenere una normalizzazione deterministica e condivisa degli identificatori fiscali;
- introdurre la normalizzazione della P.IVA necessaria al confronto;
- introdurre `TenantCompanyFiscalCode` e `TenantRecord.companyFiscalCode`;
- aggiornare default, schema, normalizzazione e persistenza Tenant in modo legacy-safe;
- distinguere esplicitamente identità fiscale persona e società;
- introdurre finder/assert pure per Contact e Tenant;
- supportare l'esclusione del record corrente tramite ID per i futuri update;
- considerare anche record archived nel duplicate check;
- ignorare identificatori vuoti;
- escludere email, telefono, nome, indirizzo, SIRET e SIREN;
- non introdurre ancora hard block nelle mutation repository.

Il contratto deve essere riutilizzabile da C3.2, C3.3 e dal futuro update Tenant di C5 senza duplicare logica.

### C3.2 — Enforcement ContactRepository

Applicare il contratto C3.1 alle mutation:

```text
ContactRepository.create
ContactRepository.update
```

Regole:

- persona: hard block sul CF valorizzato;
- società: hard block sul CF oppure sulla P.IVA valorizzata;
- update esclude il Contact corrente;
- Contact archived partecipano al controllo;
- account differenti restano indipendenti;
- valori vuoti non collidono;
- email non blocca;
- SIRET/SIREN non partecipano;
- nessun override;
- nessuna scrittura deve avvenire quando il controllo fallisce.

Il controllo deve vivere nell'authority repository/business rules e non soltanto nei consumer UI.

I consumer esistenti che creano Contact con CF/P.IVA vuoti, inclusi i flussi Tenant Garanti/Emergency, restano validi perché CT-01/CT-02 non rendono questi identificatori obbligatori nella prima anagrafica.

### C3.3 — Enforcement Tenant create e UI

Applicare il contratto C3.1 alla create Tenant corrente.

Persona:

```text
TenantFiscalCode
```

è la chiave fiscale.

Società:

```text
TenantCompanyFiscalCode
TenantVatNumber
```

sono le chiavi fiscali dell'ente.

Non usare come identità fiscale della società:

```text
TenantFiscalCode
TenantVatNumberPersonal
TenantSiret
TenantEmail
```

Il controllo deve avvenire prima della mutation definitiva del Tenant.

In caso di duplicato:

- nessun Tenant viene aggiunto;
- nessun record parziale viene persistito;
- il form resta aperto;
- l'utente riceve un errore sul campo fiscale coinvolto;
- la UI porta o mantiene l'utente nella scheda `Informazioni generali`;
- non esiste override per proseguire comunque.

La quick create Tenant può continuare a creare record senza CF/P.IVA perché questi identificatori restano facoltativi nella prima anagrafica.

C3.3 riguarda esclusivamente la create corrente. L'update Tenant reale appartiene a C5, ma userà le stesse pure rules C3.1 con esclusione del record corrente.

### C3.4 — Gate tecnico consolidato C3

Verificare almeno:

- persona con CF duplicato;
- persona con CF diverso;
- persona con CF vuoto;
- P.IVA personale non probatoria;
- società con CF ente duplicato;
- società con P.IVA duplicata;
- società con uno solo dei due identificatori valorizzato;
- società con entrambi vuoti;
- CF del rappresentante legale non usato come identità dell'ente;
- email uguale ammessa;
- SIRET uguale ammesso;
- record archived incluso nel duplicate check;
- update Contact che esclude il record corrente;
- collisione con un altro Contact bloccata;
- stesso identificatore ammesso in account differenti;
- nessun hard block Contact↔Tenant;
- Tenant company legacy senza `companyFiscalCode` preservato senza matching euristico;
- nessuna mutazione parziale su hard block;
- regressioni C1;
- regressioni C2;
- suite completa;
- build;
- lint mirato;
- UTF-8 e mojibake.

## TASK C4 — Creazione atomica

**Dipendenze:** C1 e C2 completate; C3 da completare.

**Obiettivo:**

- rendere la create definitiva del Tenant account-scoped e atomica;
- validare integralmente il Tenant e i riferimenti Contact prima della scrittura;
- applicare i vincoli duplicati definiti da C3;
- eseguire una sola mutation definitiva del dominio Tenant;
- nessun Tenant parziale;
- nessun riferimento `contactId` dangling;
- nessuna relazione Tenant incoerente;
- rileggere e normalizzare il record persistito;
- preservare il submit lock e il recovery della bozza già consolidati.

Un Contact creato esplicitamente tramite `ContactRepository` prima del submit Tenant è una voce autonoma della rubrica e non viene considerato orfano se il successivo Tenant non viene creato. C4 non esegue rollback o cancellazione automatica di Contact autonomi; il vincolo “nessun record orfano” riguarda riferimenti e mutazioni parziali prodotti dalla create Tenant stessa.

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

## TASK G3 — Residui azioni unità e inquilini

**Stato:** da rivalutare dopo G1.

G3 non deve riaprire il lifecycle degli edifici né il lifecycle delle Unit già completato in B6, e non deve duplicare attività residue già assegnate a B7, C5 o C6.

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

Riferimenti: [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md) e [Specifica della fase locale prioritaria](./specifiche/fase-locale-prioritaria.md). Storage documentale definitivo, gestione sicura di password e codici, OCR, PDF, scraping, firme e servizi esterni restano funzioni future dipendenti da backend e storage sicuro. I dati e gli allegati già supportati localmente restano validi nel perimetro di collaudo.

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
- duplicati anagrafici e lifecycle ancora da completare, inclusi C3 e C5;
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