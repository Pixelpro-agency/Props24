# Props24 — Audit dei quattro flussi di creazione e piano esecutivo

## 1. Risultato dell’audit

Sono stati esaminati i sorgenti relativi a:

* Nuovo edificio;
* Nuova unità;
* Nuovo inquilino;
* Nuova locazione;
* database locale;
* repository;
* normalizzazione;
* relazioni;
* bozze;
* pagamenti generati;
* pagine di lista e dettaglio.

### Verifiche tecniche eseguite

* `npm run build`: completato correttamente.
* TypeScript: compilazione superata.
* Build Vite: completata.
* `npm run lint`: non superato, con 52 errori e 17 warning.
* I problemi di lint sono in parte preesistenti e distribuiti anche fuori dal perimetro dei quattro inserimenti.
* Per questo motivo, ogni task userà ESLint soltanto sui file autorizzati e modificati.
* La verifica browser automatizzata non è stata completabile nell’ambiente di audit perché la navigazione locale del browser è stata bloccata amministrativamente. Il collaudo finale in browser è quindi previsto come task separata.

Gli smoke test non fanno parte del progetto e non devono essere ripristinati, richiesti o ricreati.

---

# 2. Difetti confermati

## Gravità critica

### Edificio non realmente creabile

Il modulo edifici è ancora simulato:

* `BuildingsPage.tsx` esegue solo un `console.log` quando si preme “Nuovo edificio”;
* non esiste la route di creazione;
* `useBuildings.ts` legge `mockBuildings`;
* non esiste un repository operativo per gli edifici;
* archiviazione ed eliminazione sono simulate;
* il database contiene già `buildings`, ma la UI non lo utilizza.

### Una nuova unità non può essere collegata a un edificio

`createProperty()` salva sempre:

```ts
relations: {
  buildingId: null,
  tenantIds: [],
  leaseIds: [],
}
```

Nel form non esiste un selettore dell’edificio.

Di conseguenza:

* l’unità non appartiene realmente a nessun edificio;
* `unitsCount` non può riflettere correttamente le nuove unità;
* non è possibile costruire la catena edificio → unità → locazione.

### La regola anti-duplicato impedisce più unità allo stesso indirizzo

La chiave di unicità usa soltanto:

* indirizzo;
* città;
* CAP.

Due appartamenti nello stesso edificio vengono quindi considerati duplicati anche se hanno:

* piano diverso;
* interno diverso;
* denominazione diversa;
* relazione a un edificio comune.

### Il calcolo automatico della fine locazione sbaglia le date di fine mese

Il codice usa direttamente `setUTCMonth()` e poi sottrae un giorno.

Esempi errati:

* 31 gennaio più un mese può produrre 2 marzo;
* 31 agosto più sei mesi può produrre 2 marzo dell’anno successivo.

### Il metodo “addebito” crea ricavi falsamente incassati

In `paymentRepository.ts`, una rata con metodo `addebito` e scadenza passata viene generata direttamente come:

```ts
status: 'paid'
```

Questo produce dati finanziari non veri senza che l’utente abbia registrato l’incasso.

---

## Gravità alta

### Alcuni campi della nuova unità sono placeholder non compilabili

Nel form sono presenti select che contengono soltanto “Scegli”:

* tipo di locazione;
* frequenza di pagamento;
* classe energetica.

Il campo tipo unità non è realmente obbligatorio nello schema, nonostante sia fondamentale.

### Gli ID dei dati annidati usano `Math.random`

Il problema riguarda:

* chiavi dell’unità;
* contratti dell’unità;
* fotografie;
* contatti;
* documenti;
* garanti dell’inquilino;
* contatti di emergenza;
* documenti dell’inquilino.

Il progetto dispone già del generatore canonico `generateId()`.

### I garanti dell’inquilino usano una rubrica mock

`Tab3Guarantors.tsx` legge `existingContacts` da `mockTenants.ts`.

La UI dichiara che il garante viene salvato nella rubrica, ma in realtà:

* non viene creato un `ContactRecord`;
* non viene conservato un riferimento canonico al contatto;
* il sistema dei garanti degli inquilini è diverso da quello usato nelle locazioni.

### I duplicati anagrafici non vengono bloccati

Esiste `findTenantByFiscalCode()`, ma `createTenant()` non lo usa.

La validazione del database produce soltanto un warning per codici fiscali duplicati.

### Esistono chiavi `localStorage` esterne al database canonico

Sono create:

```text
properties-column-visibility
tenants-column-visibility
```

Devono essere migrate in `database.settings` e rimosse.

---

## Gravità media

### La bozza della nuova unità scrive a ogni variazione

`useFormPersistence.ts` salva direttamente il database a ogni modifica del form, senza debounce.

Con foto e documenti questo può causare:

* molte serializzazioni;
* rallentamenti;
* maggiore rischio di quota;
* scritture ripetute inutili.

### Il lint globale non è ancora utilizzabile come gate

Il repository presenta errori estranei ai quattro flussi. Ogni prompt deve correggere il lint dei soli file che modifica, senza espandere la task a tutto il progetto.

---

# 3. Stato effettivo dei quattro inserimenti

## Nuovo edificio

Stato attuale: **non operativo**.

Deve essere costruito il flusso completo:

```text
form
→ validazione
→ buildingRepository
→ saveJsonDb
→ props24.localDb.buildings
→ aggiornamento lista
```

## Nuova unità

Stato attuale: **salvataggio reale ma incompleto**.

La maggior parte dei campi viene conservata in `formData`, ma mancano:

* associazione edificio;
* regola corretta per unità allo stesso indirizzo;
* opzioni reali per alcune select;
* ID canonici nei dati annidati;
* autosalvataggio controllato.

## Nuovo inquilino

Stato attuale: **salvataggio reale con incoerenze nei dati collegati**.

I campi principali di persona e società vengono salvati, ma vanno corretti:

* garanti;
* rubrica contatti;
* ID annidati;
* controllo duplicati;
* coerenza della transazione.

## Nuova locazione

Stato attuale: **salvataggio reale con due difetti finanziari e temporali importanti**.

Sono già reali:

* proprietà;
* inquilini;
* garanti;
* `formData`;
* relazioni;
* piano pagamenti;
* deposito;
* bozza.

Vanno corretti:

* calcolo della data finale;
* incasso automatico improprio dell’addebito;
* verifica completa del round-trip dei campi visibili.

---

# 4. Ordine obbligatorio di esecuzione

Eseguire i prompt esattamente in quest’ordine:

1. Repository canonico degli edifici.
2. Creazione e lista reale degli edifici.
3. Relazione tra unità ed edificio.
4. Completamento di tutti i campi della nuova unità.
5. Completamento della creazione inquilino.
6. Correzione della creazione locazione.
7. Eliminazione delle chiavi `localStorage` parallele.
8. Collaudo finale dei quattro flussi.

Non eseguire due prompt contemporaneamente.

Dopo ogni prompt:

* esaminare il report;
* allegare `fileModificati.md`;
* verificare che la task sia chiusa;
* soltanto dopo procedere al prompt successivo.

---

# PROMPT 1 — Repository canonico degli edifici

```txt
Obiettivo:

Implementare il livello dati reale degli edifici usando esclusivamente `props24.localDb`, senza modificare ancora le pagine React.

Al termine della task devono esistere operazioni repository reali per creare, leggere, archiviare, ripristinare ed eliminare in sicurezza un edificio.

Stato verificato:

- `LocalDatabase` contiene già `buildings`.
- `BuildingRecord` contiene già id, timestamp, archivio, nome, indirizzo, città, CAP, provincia/contea, regione/stato, paese, superficie, numero unità e descrizione.
- Non esiste un repository operativo degli edifici.
- `unitsCount` deve essere sempre derivato dalle unità che hanno `relations.buildingId` uguale all’ID dell’edificio.
- `unitsCount` non deve essere accettato come dato manuale dell’utente.

File autorizzati:

- `src/db/buildingRepository.ts` — nuovo file
- `src/db/databaseValidation.ts`
- `src/db/databaseErrors.ts`
- `src/types/building.ts`

Documentazione di riferimento:

- `report_consegna_prompt_1_2_3_props24(1).md`
- `01-context-selection(34).mdx`

Contratti da preservare:

- L’unica chiave locale è `props24.localDb`.
- Tutte le scritture devono passare da repository e concludersi con una sola `saveJsonDb`.
- Non creare chiavi `localStorage`.
- Non chiedere modifiche manuali a console o storage.
- Gli ID devono essere creati con il generatore canonico già esistente.
- `createdAt` e `updatedAt` devono essere ISO.
- `unitsCount` deve essere derivato dalle unità canoniche.
- Un edificio archiviato deve restare nel database.
- Un edificio referenziato da almeno un’unità non può essere eliminato.
- Nessun dato mock deve essere introdotto.

Attività richieste:

1. Creare `buildingRepository.ts`.
2. Definire un input tipizzato per la creazione e l’aggiornamento dell’edificio.
3. Normalizzare almeno:
   - name;
   - address;
   - city;
   - postalCode;
   - county;
   - state;
   - country;
   - size;
   - description.
4. Rendere obbligatori:
   - nome;
   - indirizzo;
   - città;
   - CAP;
   - paese.
5. Rifiutare superfici negative o non finite.
6. Implementare:
   - `listBuildings`;
   - `getBuildingById`;
   - `createBuilding`;
   - `updateBuilding`;
   - `archiveBuilding`;
   - `restoreBuilding`;
   - `deleteBuilding`.
7. Bloccare duplicati completamente identici per nome normalizzato e indirizzo completo normalizzato.
8. Consentire edifici allo stesso indirizzo quando hanno un nome o identificatore differente.
9. Bloccare l’eliminazione se almeno una proprietà contiene quell’ID in `relations.buildingId`.
10. Fare in modo che ogni operazione restituisca il record normalizzato realmente salvato.
11. Rafforzare la validazione del database:
    - campi principali dell’edificio obbligatori;
    - ID univoci;
    - `unitsCount` coerente con il conteggio derivato.
12. Non creare componenti UI in questa task.

Comando di test mirato:

- Dalla root, in Windows PowerShell:

  `npm.cmd run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npx.cmd eslint src/db/buildingRepository.ts src/db/databaseValidation.ts src/db/databaseErrors.ts src/types/building.ts`

Non usare `npm.cmd run lint` come gate globale, perché esistono errori preesistenti fuori dal perimetro.

File Repomix post-task:

- Non creare backup, cartelle timestamp, copie, baseline o manifest aggiuntivi.
- Identificare soltanto i file modificati o creati durante questa task.
- Dopo il test, creare `$repomixInclude` con i loro percorsi relativi separati da virgole.
- Eseguire dalla root:

  `npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "$repomixInclude"`

- Non includere `fileModificati.md` nella propria generazione.
- Non modificare il codice dopo aver generato `fileModificati.md`.
- Se nessun file è stato modificato, non creare né aggiornare `fileModificati.md`.

In caso di fallimento:

- Sono ammessi al massimo tre tentativi ragionati.
- Ogni tentativo deve basarsi sull’output del comando e sui soli file autorizzati.
- Applicare la correzione minima e rieseguire lo stesso comando.
- Non allargare il perimetro.
- Non generare `fileModificati.md` tra i tentativi.
- Dopo il terzo fallimento, interrompere la task e riportare comando, exit code, errore, stack rilevante, file e righe.
- Se sono stati modificati file, generare comunque `fileModificati.md` prima di interrompere.

Non modificare:

- pagine React;
- form unità;
- inquilini;
- locazioni;
- pagamenti;
- email;
- firma;
- smoke test;
- package o dipendenze.

Risultato atteso:

- Esiste un repository degli edifici reale e transazionale.
- Un edificio valido può essere salvato in `database.buildings`.
- `unitsCount` non è modificabile manualmente.
- Un edificio con unità collegate non può essere eliminato.
- Build e lint mirato passano.

Report finale:

- comando eseguito ed esito;
- elenco dei file effettivamente modificati;
- percorso di `fileModificati.md`;
- numero dei file inclusi;
- esito di Repomix.

Non incollare il contenuto di `fileModificati.md`.
```

---

# PROMPT 2 — Creazione e lista reale degli edifici

```txt
Obiettivo:

Sostituire completamente il flusso mock degli edifici con una pagina reale di creazione e una lista alimentata da `props24.localDb`.

Questa task deve usare il repository creato nel Prompt 1.

Stato verificato:

- `BuildingsPage.tsx` usa ancora `console.log`.
- `useBuildings.ts` legge `mockBuildings`.
- Non esiste una route “Nuovo edificio”.
- Archiviazione ed eliminazione sono simulate.
- La tabella non usa esplicitamente l’ID applicativo come row ID.

File autorizzati:

- `src/App.tsx`
- `src/pages/BuildingsPage.tsx`
- `src/pages/NewBuildingPage.tsx` — nuovo file
- `src/hooks/useBuildings.ts`
- `src/components/building-form/schema.ts` — nuovo file
- `src/components/building-form/BuildingForm.tsx` — nuovo file
- `src/components/buildings/BuildingsHeader.tsx`
- `src/components/buildings/BuildingsTable.tsx`
- `src/components/buildings/BuildingsToolbar.tsx`
- `src/components/buildings/EmptyState.tsx`
- `src/components/buildings/FloatingActions.tsx`
- `src/types/building.ts`
- `src/data/mockBuildings.ts` — autorizzata l’eliminazione

Documentazione di riferimento:

- `report_consegna_prompt_1_2_3_props24(1).md`
- `01-context-selection(34).mdx`
- contratto pubblico di `src/db/buildingRepository.ts`

Contratti da preservare:

- Unico database `props24.localDb`.
- Nessuna nuova chiave locale.
- La UI non deve scrivere direttamente nello storage.
- Le scritture devono usare `buildingRepository`.
- I timestamp e gli ID vengono creati dal repository.
- `unitsCount` è solo informativo e derivato.
- Nessun mock o array hardcoded deve alimentare il runtime edifici.
- Nessuna Recovery UI.
- Nessun `alert`, `window.confirm` o successo simulato.

Attività richieste:

1. Aggiungere la route:

   `/properties/buildings/new`

2. Implementare `NewBuildingPage`.
3. Creare un form con tutti i dati realmente persistibili del record:
   - nome/identificativo;
   - indirizzo;
   - città;
   - CAP;
   - provincia/contea;
   - regione/stato;
   - paese;
   - superficie;
   - descrizione.
4. Non mostrare un input modificabile per `unitsCount`.
5. Validare il form con uno schema Zod unico.
6. Mostrare gli errori vicino ai campi e in un riepilogo accessibile.
7. Disabilitare il doppio submit.
8. Salvare tramite `createBuilding`.
9. Dopo il salvataggio, tornare alla lista reale.
10. Riscrivere `useBuildings.ts` affinché:
    - legga `listBuildings`;
    - si aggiorni tramite `subscribeJsonDb`;
    - gestisca attivi e archiviati;
    - mantenga ricerca e ordinamento.
11. Eliminare ogni importazione di `mockBuildings`.
12. Eliminare `src/data/mockBuildings.ts` quando non più referenziato.
13. Collegare il pulsante “Nuovo edificio” alla nuova route.
14. Collegare archiviazione, ripristino ed eliminazione al repository.
15. In caso di eliminazione bloccata da unità collegate, mostrare un errore reale.
16. Configurare TanStack Table con `getRowId: row => row.id`.
17. La selezione bulk deve usare gli ID reali degli edifici.
18. Non lasciare pulsanti che simulano operazioni tramite `console.log`.

Verifica funzionale obbligatoria:

Creare un edificio con valori riconoscibili in tutti i campi, per esempio:

- nome: `Edificio Audit A`;
- indirizzo: `Via Audit 10`;
- città: `Torino`;
- CAP: `10100`;
- provincia: `TO`;
- regione: `Piemonte`;
- paese: `IT`;
- superficie: `900`;
- descrizione: `Edificio creato dal collaudo`.

Dopo il salvataggio:

- l’edificio deve comparire immediatamente nella lista;
- dopo refresh deve essere ancora presente;
- `unitsCount` deve essere zero;
- nessun campo deve essere sostituito da dati mock;
- la console non deve contenere errori React o Promise non gestite.

Comando di test mirato:

- Dalla root, in Windows PowerShell:

  `npm.cmd run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npx.cmd eslint src/App.tsx src/pages/BuildingsPage.tsx src/pages/NewBuildingPage.tsx src/hooks/useBuildings.ts src/components/building-form/schema.ts src/components/building-form/BuildingForm.tsx src/components/buildings/BuildingsHeader.tsx src/components/buildings/BuildingsTable.tsx src/components/buildings/BuildingsToolbar.tsx src/components/buildings/EmptyState.tsx src/components/buildings/FloatingActions.tsx src/types/building.ts`

Non usare il lint globale.

File Repomix post-task:

- Non creare backup, copie o cartelle timestamp.
- Dopo il test, includere soltanto i file realmente modificati o creati.
- Creare `$repomixInclude` con i percorsi relativi separati da virgole.
- Eseguire:

  `npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "$repomixInclude"`

- Non includere `fileModificati.md`.
- Non modificare codice dopo Repomix.
- Se nessun file è cambiato, non creare `fileModificati.md`.

In caso di fallimento:

- Massimo tre tentativi ragionati.
- Usare esclusivamente output del terminale e file autorizzati.
- Non ampliare il perimetro.
- Rieseguire sempre lo stesso comando.
- Dopo il terzo fallimento, produrre il report e interrompere.
- Generare `fileModificati.md` soltanto alla fine.

Non modificare:

- repository di unità, inquilini o locazioni;
- pagamenti;
- dashboard;
- email;
- firma;
- package;
- smoke test.

Risultato atteso:

- “Nuovo edificio” apre un form reale.
- Tutti i campi compilati vengono salvati in `props24.localDb.buildings`.
- La lista legge esclusivamente il database.
- Il record sopravvive al refresh.
- Non rimangono mock o `console.log` operativi nel modulo edifici.

Report finale:

- esito del comando;
- file modificati;
- percorso e conteggio di `fileModificati.md`;
- esito Repomix.

Non incollare il contenuto di `fileModificati.md`.
```

---

# PROMPT 3 — Relazione canonica tra unità ed edificio

```txt
Obiettivo:

Permettere alla pagina “Nuova unità” di associare realmente l’unità a un edificio esistente e correggere la regola anti-duplicato affinché siano consentite più unità nello stesso edificio.

Stato verificato:

- `createProperty()` imposta sempre `buildingId: null`.
- Il form non presenta il selettore edificio.
- Il database possiede già `PropertyRecord.relations.buildingId`.
- `recalculateBuildingUnits()` è già disponibile.
- La regola corrente considera duplicate due unità con lo stesso indirizzo, città e CAP.
- Questa regola impedisce la creazione di appartamenti diversi nello stesso stabile.

File autorizzati:

- `src/components/property-form/schema.ts`
- `src/components/property-form/tabs/Tab1Info.tsx`
- `src/components/property-form/PropertyFormProvider.tsx`
- `src/pages/NewProperty.tsx`
- `src/db/propertyRepository.ts`
- `src/db/businessRules.ts`
- `src/db/databaseValidation.ts`
- `src/db/databaseErrors.ts`
- `src/db/jsonDb.ts`
- `src/hooks/useBuildings.ts`

Documentazione di riferimento:

- `report_consegna_prompt_1_2_3_props24(1).md`
- `01-context-selection(34).mdx`
- contratto di `buildingRepository.ts`

Contratti da preservare:

- La relazione canonica resta `PropertyRecord.relations.buildingId`.
- Il valore visibile nel form può essere conservato come proiezione, ma repository e normalizzazione devono mantenerlo sempre sincronizzato con la relazione canonica.
- Le relazioni non devono essere dedotte da nomi o indirizzi.
- Un edificio viene collegato esclusivamente tramite il suo ID.
- Non selezionare edifici archiviati per nuove unità.
- Una unità può anche non appartenere a un edificio.
- Una sola `saveJsonDb` per la creazione.
- `unitsCount` deve aggiornarsi automaticamente.
- Nessuna nuova chiave locale.

Attività richieste:

1. Aggiungere al form un campo tipizzato `PropertyBuildingId`.
2. Inserire nella scheda principale un selettore:
   - “Nessun edificio”;
   - edifici attivi letti dal database.
3. Salvare il valore in `relations.buildingId`.
4. Verificare nel repository che l’edificio selezionato:
   - esista;
   - non sia archiviato.
5. Quando si seleziona un edificio:
   - compilare coerentemente indirizzo, città, CAP, provincia, regione e paese;
   - impedire che il record unità venga salvato con indirizzo principale incompatibile con l’edificio selezionato.
6. Lasciare modificabili i dati specifici dell’unità:
   - indirizzo secondario;
   - piano;
   - numero interno;
   - identificativo unità.
7. Conservare il supporto alle unità indipendenti senza edificio.
8. Correggere `normalizePropertyLocationKey`.
9. La verifica di duplicato fisico deve considerare almeno:
   - edificio selezionato;
   - indirizzo;
   - indirizzo secondario;
   - città;
   - CAP;
   - piano;
   - interno.
10. Due unità nello stesso edificio e allo stesso indirizzo devono essere consentite quando piano, interno o identificativo sono differenti.
11. Continuare a impedire due unità realmente identiche.
12. Mantenere l’unicità dell’identificativo `PropertyTitle`.
13. Aggiornare i messaggi di errore affinché non dichiarino più che ogni unità allo stesso indirizzo è un duplicato.
14. Normalizzare i record precedenti:
    - `PropertyBuildingId` assente non deve causare perdita del record;
    - se esiste `relations.buildingId`, la proiezione del form deve essere sincronizzata.
15. Dopo il salvataggio, il conteggio unità dell’edificio deve essere ricalcolato.

Verifica funzionale obbligatoria:

1. Usare l’edificio `Edificio Audit A`.
2. Creare:
   - unità `Audit A-1`, piano `1`, interno `1`;
   - unità `Audit A-2`, piano `1`, interno `2`.
3. Le due unità devono poter condividere indirizzo, città e CAP.
4. Entrambe devono avere `relations.buildingId` uguale all’ID reale dell’edificio.
5. Dopo refresh:
   - entrambe devono essere presenti;
   - l’edificio deve mostrare `unitsCount: 2`.
6. Tentare una terza unità con tutti i dati identificativi uguali a `Audit A-1`: deve essere bloccata.

Comando di test mirato:

- Dalla root, in Windows PowerShell:

  `npm.cmd run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npx.cmd eslint src/components/property-form/schema.ts src/components/property-form/tabs/Tab1Info.tsx src/components/property-form/PropertyFormProvider.tsx src/pages/NewProperty.tsx src/db/propertyRepository.ts src/db/businessRules.ts src/db/databaseValidation.ts src/db/databaseErrors.ts src/db/jsonDb.ts src/hooks/useBuildings.ts`

Non usare il lint globale.

File Repomix post-task:

- Nessun backup o artefatto intermedio.
- Includere soltanto file modificati o creati dalla task.
- Eseguire:

  `npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "$repomixInclude"`

- Non includere `fileModificati.md`.
- Non modificare codice dopo la generazione.
- Se non ci sono modifiche, non creare il file.

In caso di fallimento:

- Massimo tre tentativi ragionati.
- Correzione minima nei soli file autorizzati.
- Riesecuzione dello stesso comando.
- Nessun Repomix tra i tentativi.
- Al terzo fallimento, report completo e interruzione.

Non modificare:

- campi non collegati alla relazione edificio in questa task;
- inquilini;
- locazioni;
- pagamenti;
- email;
- firma;
- smoke test.

Risultato atteso:

- La nuova unità può essere collegata a un edificio reale.
- Il collegamento sopravvive al refresh.
- Più unità dello stesso edificio sono consentite.
- `unitsCount` è derivato correttamente.
- I duplicati realmente identici restano bloccati.

Report finale:

- test ed esito;
- file modificati;
- percorso e numero dei file in `fileModificati.md`;
- esito Repomix.
```

---

# PROMPT 4 — Persistenza completa di tutti i campi della nuova unità

```txt
Obiettivo:

Rendere integralmente compilabili e persistenti tutti i controlli visibili nella pagina “Nuova unità”, senza perdere campi, file o dati annidati dopo il salvataggio e il refresh.

Questa task deve preservare la relazione edificio implementata dal Prompt 3.

Stato verificato:

- Tutti i nomi dei controlli visibili risultano presenti nello schema.
- Alcune select contengono soltanto il placeholder “Scegli”.
- `PropertyTypeID` può essere salvato vuoto.
- Cinque tab generano ID con `Math.random`.
- La bozza viene salvata a ogni modifica senza debounce.
- Foto e documenti possono rendere la scrittura frequente e pesante.

File autorizzati:

- `src/components/property-form/schema.ts`
- `src/components/property-form/PropertyFormProvider.tsx`
- `src/components/property-form/hooks/useFormPersistence.ts`
- `src/components/property-form/tabs/Tab1Info.tsx`
- `src/components/property-form/tabs/Tab2Additional.tsx`
- `src/components/property-form/tabs/Tab3Financial.tsx`
- `src/components/property-form/tabs/Tab4Passwords.tsx`
- `src/components/property-form/tabs/Tab5Contracts.tsx`
- `src/components/property-form/tabs/Tab6Flyer.tsx`
- `src/components/property-form/tabs/Tab7Photos.tsx`
- `src/components/property-form/tabs/Tab8Contacts.tsx`
- `src/components/property-form/tabs/Tab9Documents.tsx`
- `src/db/propertyRepository.ts`
- `src/db/jsonDb.ts`

Documentazione di riferimento:

- `report_consegna_prompt_1_2_3_props24(1).md`
- `01-context-selection(34).mdx`

Contratti da preservare:

- `formData` conserva l’intero contenuto del form.
- `relations.buildingId` resta la relazione canonica dell’edificio.
- Non rimuovere campi già esistenti.
- Non rinominare campi persistiti senza migrazione retrocompatibile.
- Gli array vuoti restano `[]`.
- I file locali restano serializzabili tramite `dataUrl`.
- Gli ID usano `generateId`, mai `Math.random`.
- La bozza resta in `database.drafts.propertyForm`.
- La bozza viene cancellata soltanto dopo salvataggio riuscito.
- Nessuna chiave locale aggiuntiva.

Attività richieste:

1. Rendere `PropertyTypeID` obbligatorio.
2. Sostituire le select con solo placeholder con opzioni canoniche reali:
   - tipo di locazione;
   - frequenza di pagamento;
   - classe energetica.
3. Definire le opzioni in un solo punto per evitare valori divergenti.
4. Usare valori persistiti stabili, non le etichette visuali.
5. Generare dinamicamente un intervallo sensato di anni per la spesa energetica, senza fermarsi al 2026.
6. Verificare campo per campo che ogni controllo visibile:
   - sia registrato;
   - sia incluso nello schema;
   - sia incluso nei valori iniziali;
   - venga normalizzato;
   - venga salvato in `PropertyRecord.formData`.
7. Non scartare valori validi uguali a zero.
8. Non convertire automaticamente stringhe compilate in valori vuoti.
9. Sostituire tutti gli ID basati su `Math.random` con `generateId`:
   - chiavi;
   - contratti;
   - fotografie;
   - contatti;
   - documenti.
10. Assicurarsi che gli ID restino uguali dopo refresh.
11. Conservare metadata dei file:
    - nome;
    - MIME type;
    - dimensione;
    - ultima modifica;
    - `dataUrl`.
12. Aggiungere un debounce ragionevole, indicativamente 400–700 ms, alla bozza.
13. Evitare cicli di autosalvataggio confrontando una firma stabile dell’ultima bozza salvata.
14. Annullare il timer al dismount.
15. Non cancellare la bozza in caso di errore.
16. Cancellare la bozza dopo la creazione riuscita.
17. Evitare doppio submit e doppio toast.
18. Non introdurre nuovi mock.

Verifica funzionale obbligatoria:

Creare una nuova unità e compilare ogni controllo visibile delle nove schede con un valore riconoscibile e diverso dal default.

In particolare includere almeno:

- edificio;
- tipo;
- identificativo;
- indirizzo e dati geografici;
- piano e interno;
- superfici e stanze;
- canone e spese;
- tipo locazione;
- periodicità;
- prestazione energetica;
- note;
- dotazioni;
- dati catastali;
- dati finanziari;
- almeno una chiave;
- almeno un contratto;
- testo brochure;
- almeno una foto;
- almeno un contatto;
- almeno un documento.

Poi:

1. attendere l’autosalvataggio;
2. aggiornare la pagina e verificare il ripristino della bozza;
3. salvare;
4. aggiornare nuovamente;
5. verificare in sola lettura che tutti i valori siano presenti in `props24.localDb`;
6. verificare che gli ID annidati non cambino;
7. verificare che la bozza sia stata eliminata soltanto dopo il successo.

Non modificare manualmente il contenuto di localStorage durante la verifica.

Comando di test mirato:

- Dalla root, in Windows PowerShell:

  `npm.cmd run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npx.cmd eslint src/components/property-form/schema.ts src/components/property-form/PropertyFormProvider.tsx src/components/property-form/hooks/useFormPersistence.ts src/components/property-form/tabs/Tab1Info.tsx src/components/property-form/tabs/Tab2Additional.tsx src/components/property-form/tabs/Tab3Financial.tsx src/components/property-form/tabs/Tab4Passwords.tsx src/components/property-form/tabs/Tab5Contracts.tsx src/components/property-form/tabs/Tab6Flyer.tsx src/components/property-form/tabs/Tab7Photos.tsx src/components/property-form/tabs/Tab8Contacts.tsx src/components/property-form/tabs/Tab9Documents.tsx src/db/propertyRepository.ts src/db/jsonDb.ts`

File Repomix post-task:

- Seguire la procedura canonica.
- Includere soltanto i file realmente modificati.
- Eseguire:

  `npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "$repomixInclude"`

- Nessuna modifica dopo Repomix.
- Nessun file se non ci sono modifiche.

In caso di fallimento:

- Massimo tre tentativi ragionati.
- Nessun allargamento del perimetro.
- Nessuna modifica di file non autorizzati.
- Stesso comando dopo ogni correzione.
- Al terzo fallimento, generare eventualmente Repomix, riportare l’errore e interrompere.

Non modificare:

- edificio repository;
- inquilini;
- locazioni;
- pagamenti;
- email;
- firma;
- dashboard;
- smoke test.

Risultato atteso:

- Ogni controllo visibile della nuova unità è compilabile.
- Tutti i dati sono conservati nel record.
- I dati sopravvivono al refresh.
- Gli ID annidati sono stabili.
- La bozza non causa scritture a ogni singolo evento.
- Non rimangono placeholder privi di valori reali.

Report finale:

- test ed esito;
- file modificati;
- percorso e conteggio di `fileModificati.md`;
- esito Repomix.
```

---

# PROMPT 5 — Persistenza completa della creazione inquilino

```txt
Obiettivo:

Rendere coerente e transazionale la creazione di un inquilino persona o società, includendo tutti i campi visibili, garanti reali, contatti di emergenza, documenti e controlli anti-duplicato.

Stato verificato:

- I campi principali vengono già mappati in `TenantRecord`.
- I garanti usano contatti mock.
- La UI dichiara che il garante viene salvato in rubrica, ma non crea un `ContactRecord`.
- I garanti dell’inquilino non hanno una relazione canonica con `database.contacts`.
- Codici fiscali duplicati producono soltanto un warning.
- Garanti, contatti di emergenza e documenti usano `Math.random`.

File autorizzati:

- `src/types/tenant.ts`
- `src/components/tenant-form/schema.ts`
- `src/components/tenant-form/TenantFormProvider.tsx`
- `src/components/tenant-form/tabs/Tab1General.tsx`
- `src/components/tenant-form/tabs/Tab2Additional.tsx`
- `src/components/tenant-form/tabs/Tab3Guarantors.tsx`
- `src/components/tenant-form/tabs/Tab4Emergency.tsx`
- `src/components/tenant-form/tabs/Tab5Documents.tsx`
- `src/pages/NewTenantPage.tsx`
- `src/db/tenantRepository.ts`
- `src/db/contactRepository.ts`
- `src/db/businessRules.ts`
- `src/db/databaseValidation.ts`
- `src/db/databaseErrors.ts`
- `src/db/database.types.ts`
- `src/db/jsonDb.ts`
- `src/data/mockTenants.ts` — autorizzata soltanto la rimozione delle dipendenze runtime o l’eliminazione se non più usato

Documentazione di riferimento:

- `report_consegna_prompt_1_2_3_props24(1).md`
- `01-context-selection(34).mdx`

Contratti da preservare:

- Una sola scrittura finale per la creazione completa dell’inquilino.
- Non salvare prima un contatto e poi lasciare il tenant incompleto se la seconda scrittura fallisce.
- Gli ID usano `generateId`.
- Le date persistite devono essere ISO.
- I file restano locali come `dataUrl`.
- Gli array restano array.
- I garanti selezionati dalla rubrica usano ID reali.
- I nuovi garanti vengono materializzati nella rubrica nella stessa transazione del tenant.
- Nessuna chiave locale aggiuntiva.
- La simulazione dell’invito email resta fuori perimetro e non va implementata.

Attività richieste:

1. Verificare che tutti i campi visibili di persona e società siano mappati nel record.
2. Non perdere i valori specifici della modalità non attiva quando l’utente passa tra persona e società, salvo scelta esplicita di pulizia.
3. Aggiungere ai garanti un riferimento `contactId` stabile.
4. Sostituire `existingContacts` mock con i contatti reali di `database.contacts`.
5. Escludere o distinguere chiaramente i contatti archiviati.
6. Quando viene scelto un contatto esistente:
   - salvare il suo ID;
   - mostrare i dati reali;
   - non duplicarlo nella rubrica.
7. Quando viene compilato un nuovo garante:
   - conservarlo nella bozza;
   - durante `createTenant`, creare il `ContactRecord` nella stessa copia del database;
   - assegnare il suo ID al garante;
   - salvare contatto e tenant con una sola `saveJsonDb`.
8. Mantenere uno snapshot anagrafico nel garante solo se necessario per retrocompatibilità, ma considerare `contactId` la relazione canonica.
9. Aggiornare la normalizzazione dei record legacy che non hanno `contactId`, senza cancellare i garanti esistenti.
10. Estendere `canDeleteContact` affinché blocchi anche i contatti referenziati dai garanti degli inquilini.
11. Bloccare il codice fiscale duplicato per persone quando non vuoto.
12. Per società, bloccare duplicati non vuoti di identificatori fiscali realmente usati:
    - partita IVA;
    - SIRET, se compilato.
13. Consentire la creazione quando gli identificatori facoltativi sono vuoti.
14. Mostrare errori comprensibili vicino ai campi duplicati.
15. Sostituire `Math.random` con `generateId` per:
    - garanti;
    - contatti di emergenza;
    - documenti.
16. Preservare gli ID dopo refresh.
17. Conservare tutti i metadata e i `dataUrl` dei documenti.
18. Rispettare le quote esistenti.
19. Non cancellare la bozza in caso di errore.
20. Cancellarla soltanto dopo salvataggio riuscito.
21. Non cambiare la simulazione dell’invito email.

Verifica funzionale obbligatoria:

### Persona

Creare una persona compilando tutti i campi visibili:

- anagrafica;
- nascita;
- nazionalità;
- codice fiscale;
- documento;
- contatti;
- indirizzo;
- dati professionali;
- banca;
- indirizzo futuro;
- note;
- un garante esistente;
- un nuovo garante;
- un contatto di emergenza;
- un documento.

Dopo salvataggio e refresh verificare:

- record tenant completo;
- nuovo garante presente una sola volta in `database.contacts`;
- `contactId` valido;
- ID annidati stabili;
- documento ancora disponibile.

### Società

Creare una società compilando:

- denominazione;
- partita IVA;
- SIRET;
- capitale;
- descrizione;
- contatti;
- indirizzo;
- dati bancari;
- garante e documento.

Dopo refresh tutti i valori devono restare presenti.

### Duplicati

- Ripetere il codice fiscale della persona: salvataggio bloccato.
- Ripetere partita IVA o SIRET della società: salvataggio bloccato.
- Lasciare gli identificatori facoltativi vuoti su un record diverso: salvataggio consentito.

Comando di test mirato:

- Dalla root, in Windows PowerShell:

  `npm.cmd run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npx.cmd eslint src/types/tenant.ts src/components/tenant-form/schema.ts src/components/tenant-form/TenantFormProvider.tsx src/components/tenant-form/tabs/Tab1General.tsx src/components/tenant-form/tabs/Tab2Additional.tsx src/components/tenant-form/tabs/Tab3Guarantors.tsx src/components/tenant-form/tabs/Tab4Emergency.tsx src/components/tenant-form/tabs/Tab5Documents.tsx src/pages/NewTenantPage.tsx src/db/tenantRepository.ts src/db/contactRepository.ts src/db/businessRules.ts src/db/databaseValidation.ts src/db/databaseErrors.ts src/db/database.types.ts src/db/jsonDb.ts`

File Repomix post-task:

- Nessun backup o artefatto persistente aggiuntivo.
- Includere solo file modificati o creati.
- Eseguire:

  `npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "$repomixInclude"`

- Non includere `fileModificati.md`.
- Non modificare codice dopo la generazione.
- Se non ci sono modifiche, non creare il file.

In caso di fallimento:

- Massimo tre tentativi ragionati.
- Usare solo file autorizzati e output terminale.
- Nessun tentativo casuale.
- Stesso comando a ogni ciclo.
- Dopo il terzo fallimento, produrre il report e interrompere.

Non modificare:

- invio o simulazione email;
- edifici;
- unità;
- locazioni;
- pagamenti;
- firma;
- dashboard;
- smoke test.

Risultato atteso:

- Persona e società conservano tutti i campi visibili.
- I garanti usano la rubrica reale.
- I nuovi garanti vengono creati atomicamente.
- Gli identificatori duplicati vengono bloccati.
- Gli ID annidati sono stabili.
- Tutti i dati sopravvivono al refresh.

Report finale:

- comando ed esito;
- file modificati;
- percorso e conteggio `fileModificati.md`;
- esito Repomix.
```

---

# PROMPT 6 — Correzione della creazione locazione

```txt
Obiettivo:

Correggere il calcolo delle date e la generazione dello stato dei pagamenti nella pagina “Nuova locazione”, verificando contemporaneamente che ogni campo visibile venga conservato nel record canonico.

Stato verificato:

- `createLease()` esegue una transazione reale.
- `LeaseRecord.formData` conserva i dati del form.
- Le relazioni vengono ricostruite.
- Il calcolo della fine contratto usa `setUTCMonth()` direttamente e fallisce nei fine mese.
- Il metodo `addebito` marca automaticamente come pagate rate scadute.
- Anche la riparazione dei pagamenti contiene una condizione speciale per l’addebito.

File autorizzati:

- `src/landlord/leases/components/LeaseForm/index.tsx`
- `src/landlord/leases/schema/leaseFormSchema.ts`
- `src/landlord/leases/data/leaseTypes.ts`
- `src/db/leaseRepository.ts`
- `src/db/paymentRepository.ts`
- `src/db/databaseValidation.ts`
- `src/db/jsonDb.ts`
- `src/utils/leaseDates.ts` — nuovo file consentito

Documentazione di riferimento:

- `report_consegna_prompt_1_2_3_props24(1).md`
- `01-context-selection(34).mdx`

Contratti da preservare:

- Proprietà, inquilini e garanti sono collegati per ID reali.
- Una sola `saveJsonDb` per la creazione.
- Le date persistite sono `YYYY-MM-DD` o timestamp ISO secondo il campo.
- Nessun pagamento generato diventa `paid` senza azione esplicita dell’utente.
- Le rate passate non pagate sono `late`.
- Le rate odierne o future non pagate sono `pending`, secondo la regola temporale già adottata.
- Il metodo di pagamento è solo metadata contrattuale.
- Deposito con `accountingRole: deposit`.
- Prepagato non produce doppio ricavo.
- Pagamenti futuri non sono incassati.
- Nessuna modifica alla simulazione email.
- Nessuna firma qualificata o PDF falso.

Attività richieste:

1. Creare una sola utility condivisa per il calcolo della data finale.
2. Eliminare le due implementazioni duplicate presenti nel form.
3. Gestire correttamente i mesi con diversa lunghezza.
4. Considerare il periodo contrattuale inclusivo.
5. Garantire almeno questi risultati:
   - inizio `2026-01-01`, durata 1 mese → fine `2026-01-31`;
   - inizio `2025-01-31`, durata 1 mese → fine `2025-02-28`;
   - inizio `2024-01-31`, durata 1 mese → fine `2024-02-29`;
   - inizio `2026-08-31`, durata 6 mesi → fine `2027-02-28`.
6. Non sovrascrivere una data finale modificata manualmente dall’utente.
7. Non usare conversioni dipendenti dal fuso orario locale.
8. Rimuovere da `paymentStatus()` la promozione automatica a `paid` per `addebito`.
9. Rimuovere la stessa assunzione dalla riparazione dei dati.
10. Non trasformare retroattivamente in incassato un pagamento solo perché il contratto usa addebito.
11. Mantenere:
    - `paid` soltanto quando esiste un’operazione esplicita di incasso;
    - `paidDate` soltanto sui record `paid`.
12. Verificare che ogni controllo visibile del form locazione sia incluso nello schema e in `formData`.
13. Non eliminare campi schema non visualizzati se servono alla retrocompatibilità.
14. Verificare coerenza tra:
    - `PropertyID`;
    - `LeaseTenantIds`;
    - `LeaseGarantIds`;
    - tipo;
    - inizio;
    - fine;
    - canone;
    - spese;
    - deposito;
    - periodicità;
    - proiezioni di `LeaseRecord`.
15. Preservare bozza, conflitti, rinnovo, piano pagamenti, deposito e prepagato.
16. Non introdurre limiti fissi di data.

Verifica funzionale obbligatoria:

1. Creare una locazione con inizio 31 gennaio e durata automatica di un mese.
2. Verificare il risultato corretto in anno normale e bisestile.
3. Creare una locazione con metodo `addebito`.
4. Verificare che:
   - nessuna rata venga creata `paid`;
   - le rate scadute siano `late`;
   - le rate non scadute siano `pending`;
   - `paidDate` sia `null`.
5. Compilare ogni campo visibile con valori riconoscibili.
6. Salvare e aggiornare la pagina.
7. Riaprire il dettaglio e la modifica.
8. Verificare che `LeaseRecord.formData` conservi i valori.
9. Verificare che proprietà, tenant e garanti abbiano gli ID corretti.
10. Verificare che il deposito non compaia nei ricavi.
11. Verificare che il prepagato non crei un secondo ricavo.

Comando di test mirato:

- Dalla root, in Windows PowerShell:

  `npm.cmd run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npx.cmd eslint src/landlord/leases/components/LeaseForm/index.tsx src/landlord/leases/schema/leaseFormSchema.ts src/landlord/leases/data/leaseTypes.ts src/db/leaseRepository.ts src/db/paymentRepository.ts src/db/databaseValidation.ts src/db/jsonDb.ts src/utils/leaseDates.ts`

File Repomix post-task:

- Includere esclusivamente i file modificati o creati.
- Non creare backup o baseline.
- Eseguire:

  `npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "$repomixInclude"`

- Non includere `fileModificati.md`.
- Nessuna modifica dopo Repomix.
- Se non ci sono modifiche, non creare il file.

In caso di fallimento:

- Massimo tre tentativi ragionati.
- Soltanto file autorizzati.
- Correzione minima basata sull’output.
- Stesso comando di test.
- Nessun Repomix intermedio.
- Al terzo fallimento, report e interruzione.

Non modificare:

- email;
- firma;
- ricevute;
- contratto HTML;
- CSV;
- edifici;
- unità;
- inquilini;
- smoke test;
- package.

Risultato atteso:

- Le date di fine mese sono corrette.
- L’addebito non crea incassi falsi.
- Tutti i campi visibili della locazione sono persistiti.
- Relazioni e pagamenti sopravvivono al refresh.
- Build e lint mirato passano.

Report finale:

- comando ed esito;
- file modificati;
- percorso e conteggio `fileModificati.md`;
- esito Repomix.
```

---

# PROMPT 7 — Una sola chiave localStorage

```txt
Obiettivo:

Eliminare le chiavi `localStorage` parallele usate per la visibilità delle colonne e spostare tali preferenze dentro `props24.localDb.settings`.

Stato verificato:

- `PropertiesPage.tsx` usa `properties-column-visibility`.
- `TenantsPage.tsx` usa `tenants-column-visibility`.
- `useLocalStorage.ts` scrive direttamente nello storage.
- `LocalDatabase` contiene già `settings`.
- Il vincolo architetturale consente una sola chiave: `props24.localDb`.

File autorizzati:

- `src/db/database.types.ts`
- `src/db/jsonDb.ts`
- `src/db/settingsRepository.ts` — nuovo file
- `src/pages/PropertiesPage.tsx`
- `src/pages/TenantsPage.tsx`
- `src/hooks/useLocalStorage.ts` — autorizzata l’eliminazione

Documentazione di riferimento:

- `report_consegna_prompt_1_2_3_props24(1).md`
- `01-context-selection(34).mdx`

Contratti da preservare:

- L’unica chiave persistente è `props24.localDb`.
- Le preferenze UI devono passare da repository e `saveJsonDb`.
- Nessuna scrittura diretta da pagina a `localStorage`.
- Le impostazioni devono sopravvivere al refresh.
- Le vecchie chiavi devono essere migrate automaticamente, quando presenti, e rimosse solo dopo salvataggio riuscito.
- Nessuna richiesta di modifica manuale dello storage.
- Non cancellare altre preferenze già presenti in `database.settings`.

Attività richieste:

1. Definire una struttura tipizzata e retrocompatibile per le impostazioni UI.
2. Creare `settingsRepository.ts` con lettura e aggiornamento delle sole preferenze interessate.
3. Conservare almeno:
   - visibilità colonne proprietà;
   - visibilità colonne inquilini.
4. Aggiornare `PropertiesPage.tsx` e `TenantsPage.tsx`.
5. Eliminare l’uso di `useLocalStorage`.
6. Eliminare il relativo hook se non più usato.
7. Durante il caricamento/migrazione:
   - leggere una sola volta le vecchie chiavi, se presenti;
   - importarne i valori validi in `database.settings`;
   - salvare il database;
   - rimuovere le vecchie chiavi soltanto dopo verifica della scrittura.
8. Non mantenere copie parallele.
9. Garantire che aggiornare una preferenza non cancelli le altre impostazioni.
10. Aggiornare le schermate quando cambia il database.
11. Non creare una seconda chiave per la versione o per la migrazione.

Verifica funzionale obbligatoria:

1. Cambiare la visibilità di una colonna proprietà.
2. Cambiare la visibilità di una colonna inquilino.
3. Aggiornare la pagina.
4. Verificare che entrambe le preferenze siano conservate.
5. Verificare in sola lettura che le preferenze si trovino in `props24.localDb.settings`.
6. Verificare che non esistano più:
   - `properties-column-visibility`;
   - `tenants-column-visibility`.
7. Dopo un normale utilizzo dell’app, l’unica chiave applicativa deve essere `props24.localDb`.

Comando di test mirato:

- Dalla root, in Windows PowerShell:

  `npm.cmd run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npx.cmd eslint src/db/database.types.ts src/db/jsonDb.ts src/db/settingsRepository.ts src/pages/PropertiesPage.tsx src/pages/TenantsPage.tsx; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; $hits = Get-ChildItem src -Recurse -Include *.ts,*.tsx | Select-String -Pattern 'localStorage\.' | Where-Object { $_.Path -notlike '*\src\db\jsonDb.ts' }; if ($hits) { $hits | ForEach-Object { Write-Host $_.Path ':' $_.LineNumber $_.Line }; exit 1 }`

File Repomix post-task:

- Includere soltanto file modificati o creati.
- Eseguire:

  `npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "$repomixInclude"`

- Non includere `fileModificati.md`.
- Nessuna modifica dopo Repomix.
- Nessun file se non ci sono modifiche.

In caso di fallimento:

- Massimo tre tentativi ragionati.
- Soltanto file autorizzati.
- Stesso comando dopo ogni correzione.
- Nessun Repomix tra i tentativi.
- Al terzo fallimento, report e interruzione.

Non modificare:

- form di edificio, unità, inquilino o locazione;
- email;
- firma;
- pagamenti;
- package;
- smoke test.

Risultato atteso:

- Le preferenze sopravvivono al refresh.
- Non esistono scritture dirette a localStorage fuori da `jsonDb.ts`.
- L’unica chiave applicativa è `props24.localDb`.

Report finale:

- comando ed esito;
- file modificati;
- percorso e conteggio `fileModificati.md`;
- esito Repomix.
```

---

# PROMPT 8 — Collaudo finale dei quattro flussi

```txt
Obiettivo:

Eseguire il collaudo finale, senza modificare codice, dei quattro flussi di creazione dopo la chiusura dei Prompt 1–7.

Questa task è esclusivamente di verifica.

File autorizzati alla modifica:

- Nessuno.

File autorizzati in sola lettura:

- repository e schema degli edifici;
- pagina e form nuovo edificio;
- repository, schema e form nuova unità;
- repository, schema e form nuovo inquilino;
- repository, schema e form nuova locazione;
- `src/db/jsonDb.ts`;
- `src/db/database.types.ts`;
- `src/db/databaseValidation.ts`;
- `src/db/settingsRepository.ts`;
- pagine di lista e dettaglio coinvolte.

Documentazione di riferimento:

- `report_consegna_prompt_1_2_3_props24(1).md`
- `01-context-selection(34).mdx`
- i sette report precedenti;
- i sette `fileModificati.md` precedenti.

Contratti da verificare:

- Una sola chiave: `props24.localDb`.
- Nessuna modifica manuale a localStorage o console.
- Tutte le scritture passano da repository.
- Date ISO.
- ID stabili e senza `Math.random`.
- Nessun mock nei quattro flussi.
- Relazioni tramite ID canonici.
- Deposito escluso dai ricavi.
- Pagamenti non incassati non diventano `paid`.
- Email simulata accettata e fuori perimetro.

Comandi di verifica:

1. Build:

   `npm.cmd run build`

2. Lint mirato dei file modificati dai Prompt 1–7, usando l’unione dei percorsi presenti nei relativi `fileModificati.md`.

3. Verifica statica delle scorciatoie vietate nel perimetro:

   - nessuna importazione di `mockBuildings`;
   - nessuna importazione di `existingContacts` nel form inquilino;
   - nessun `Math.random` nei form unità e inquilino;
   - nessuna scrittura diretta a `localStorage` fuori da `jsonDb.ts`;
   - nessun `console.log` usato come implementazione dei quattro salvataggi.

Non usare smoke test.

Scenario browser obbligatorio:

## A. Edificio

1. Creare un edificio compilando tutti i campi.
2. Salvare.
3. Aggiornare la pagina.
4. Verificare lista e record persistito.
5. Verificare `unitsCount = 0`.

## B. Unità

1. Creare due unità nello stesso edificio.
2. Usare lo stesso indirizzo principale.
3. Usare piano o interno differenti.
4. Compilare tutti i controlli visibili delle nove schede.
5. Inserire dati annidati e almeno un file.
6. Verificare il ripristino bozza.
7. Salvare entrambe.
8. Aggiornare.
9. Verificare:
   - dati completi;
   - ID stabili;
   - `buildingId` corretto;
   - `unitsCount = 2`.

## C. Inquilino

1. Creare una persona completa.
2. Creare una società completa.
3. Aggiungere garante esistente, nuovo garante, emergenza e documento.
4. Aggiornare.
5. Verificare tutti i dati.
6. Verificare contatti reali e non duplicati.
7. Verificare blocco dei duplicati fiscali.

## D. Locazione

1. Creare una locazione usando una delle unità e la persona.
2. Selezionare un garante reale.
3. Compilare ogni controllo visibile.
4. Usare una data di fine mese.
5. Usare metodo addebito.
6. Salvare e aggiornare.
7. Verificare:
   - data finale corretta;
   - relazioni corrette;
   - `formData` completo;
   - rate scadute `late`;
   - rate future `pending`;
   - nessuna rata generata `paid`;
   - deposito non incluso nei ricavi;
   - nessun doppio ricavo da prepagato.

## E. Persistenza e runtime

1. Aggiornare il browser dopo ogni creazione.
2. Navigare tra liste e dettagli.
3. Verificare assenza di:
   - errori React;
   - Promise non gestite;
   - loop di autosalvataggio;
   - doppio submit;
   - doppio toast.
4. Verificare in sola lettura che l’unica chiave applicativa sia:

   `props24.localDb`

5. Verificare che ogni record contenga timestamp ISO e ID stringa.
6. Verificare che le relazioni non dipendano da nomi, email o indirizzi.

In caso di fallimento:

- Non modificare alcun file.
- Non tentare patch.
- Riportare:
  - flusso;
  - passaggio esatto;
  - dato inserito;
  - risultato atteso;
  - risultato osservato;
  - errore console;
  - record o relazione incoerente;
  - file sorgente probabilmente coinvolto.
- Interrompere il collaudo sul difetto bloccante.
- Il difetto sarà oggetto di un nuovo prompt mirato separato.

File Repomix post-task:

- Non creare né aggiornare `fileModificati.md`, perché questa task non autorizza modifiche.

Risultato atteso:

- Tutti e quattro i metodi di creazione salvano ogni dato compilabile nel database locale.
- I record sopravvivono al refresh.
- Edificio, unità, inquilino e locazione sono collegati tramite ID reali.
- Nessuna funzione del perimetro dipende da mock.
- Nessuna rata è falsamente incassata.
- Nessuna chiave parallela resta in localStorage.
- Build e lint mirato passano.
- Console pulita nei flussi verificati.

Report finale:

- risultato build;
- risultato lint mirato;
- matrice A–E con PASS o FAIL;
- dettagli dell’eventuale primo errore;
- conferma:

  `Nessun fileModificati.md creato: nessun file modificato.`
```

---

# 5. Condizione finale di chiusura

Il lavoro può essere dichiarato concluso soltanto quando il Prompt 8 certifica contemporaneamente:

```text
Nuovo edificio
→ tutti i campi salvati
→ record persistente
→ lista reale

Nuova unità
→ tutti i campi salvati
→ edificio collegato
→ dati annidati stabili
→ più unità nello stesso edificio consentite

Nuovo inquilino
→ persona e società complete
→ garanti e contatti reali
→ documenti persistenti
→ duplicati fiscali bloccati

Nuova locazione
→ formData completo
→ relazioni reali
→ date corrette
→ pagamenti non falsamente incassati
```

La simulazione email non è una condizione di chiusura di questo ciclo.
