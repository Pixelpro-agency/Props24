# Props24 — Metodo per costruire prompt esecutivi

## 1. Scopo

Questo documento definisce come la Chat Amministratore / Analista deve preparare un prompt esecutivo per la Chat Esecutore / Preparatore delle modifiche di Props24.

Il prompt deve fornire il contesto minimo sufficiente per realizzare una sola modifica verificabile sul codice corrente, senza lasciare all’Esecutore decisioni di prodotto, interpretazioni dei requisiti o libertà di ampliare lo scope.

Questo documento integra `docs/Metodologia/metodologia-lavoro-props24.md`. In caso di conflitto prevalgono:

1. la decisione esplicita più recente dell’utente;
2. `docs/Metodologia/metodologia-lavoro-props24.md`;
3. il codice del branch e del commit SHA indicati;
4. i test eseguiti sullo stesso SHA;
5. `docs/planning/implementazioni.md`;
6. questo documento;
7. vecchi report, prompt e conversazioni.

## 2. Separazione dei ruoli

La Chat Amministratore / Analista:

- raccoglie e chiarisce i requisiti;
- legge il repository e il piano operativo;
- verifica lo stato corrente;
- delimita una task;
- sceglie il contesto necessario;
- prepara il prompt esecutivo;
- revisiona successivamente branch, SHA, diff, test e PR.

La Chat Esecutore / Preparatore:

- esegue soltanto il prompt approvato;
- prepara modifiche esclusivamente per i file autorizzati;
- esegue i test tecnici;
- consegna file completi o patch precise;
- produce un tutorial affinché l’utente applichi le modifiche;
- suggerisce branch, commit, push e draft pull request;
- non esegue scritture Git o GitHub;
- non decide requisiti e non approva il proprio lavoro.

Il Collaudatore Desktop:

- esegue il collaudo browser soltanto dopo l’approvazione statica;
- usa il branch e lo SHA indicati;
- non modifica il codice.

L’utente:

- applica materialmente le modifiche ai file;
- crea e gestisce i branch;
- esegue commit e push;
- apre o aggiorna le pull request;
- autorizza ed esegue il merge.

Un prompt esecutivo non deve trasferire all’Esecutore responsabilità proprie dell’Analista, del Collaudatore o dell’utente.

## 2.1 Modalità esecutiva diretta e non discorsiva

### Avvio immediato

Quando riceve un prompt approvato, la Chat Esecutore deve iniziare immediatamente l’esecuzione.

Non deve precedere il lavoro con:

- “ho capito”;
- “procederò così”;
- “prima analizziamo”;
- “il piano è”;
- riepiloghi del requisito;
- spiegazioni del metodo;
- richieste di conferma già risolte;
- alternative tecniche non richieste;
- domande generiche.

Un prompt esecutivo approvato costituisce già l’autorizzazione a preparare la modifica nei limiti indicati.

### Ragionamento interno

La Chat Esecutore deve verificare internamente:

- file;
- branch;
- SHA;
- anchor della modifica;
- compatibilità;
- test;
- errori;
- rischi dentro lo scope.

Non deve esporre:

- catena di ragionamento;
- ipotesi intermedie;
- analisi passo per passo;
- tentativi mentali;
- valutazioni non richieste.

Deve comunicare soltanto:

- artefatto prodotto;
- comando da eseguire;
- risultato osservato;
- errore reale;
- blocco tecnico;
- report richiesto.

### Requisiti già decisi

La Chat Esecutore non deve chiedere nuovamente:

- quale file modificare;
- quale comportamento implementare;
- dove salvare lo script;
- quale branch usare;
- se procedere;
- se applicare la modifica;
- se usare una patch o uno script;

quando queste informazioni sono già definite dal prompt.

Non deve trasformare un requisito approvato in una nuova fase di analisi.

### Unica eccezione: blocco tecnico reale

È ammessa una domanda soltanto quando esiste almeno uno di questi blocchi oggettivi:

- file obbligatorio realmente assente;
- branch o SHA differente in modo incompatibile con la modifica;
- working tree con modifiche preesistenti che impediscono di isolare la task;
- anchor indispensabile non trovata;
- due istruzioni obbligatorie realmente incompatibili;
- decisione di prodotto mancante che cambierebbe dati, comportamento o risultato;
- strumento indispensabile non disponibile e senza alternativa autorizzata;
- errore che resta bloccante dopo tre tentativi ragionati.

La domanda deve essere:

- una sola;
- breve;
- specifica;
- riferita all’evidenza reale;
- priva di alternative non necessarie.

Non costituiscono blocco:

- informazioni recuperabili leggendo i file autorizzati;
- scelta del percorso dello script;
- scelta del nome dello script;
- scelta tra più metodi equivalenti;
- necessità di mostrare comandi;
- dubbio risolvibile con il codice corrente;
- preferenza personale dell’Esecutore.

### Esecuzione per fasi

La Chat Esecutore deve svolgere esclusivamente la fase richiesta nel messaggio corrente.

### Operazioni sul branch task

Dopo che la modifica è stata applicata e verificata, la Chat Esecutore deve fornire all’utente i comandi per:

- eliminare gli artefatti temporanei;
- aggiungere allo staging soltanto i file autorizzati;
- verificare la diff in staging;
- creare il commit sul branch task;
- eseguire il push del solo branch task;
- recuperare il commit SHA finale;
- produrre il report per la Chat Analisi.

Il commit e il push del branch task appartengono alla fase ordinaria della Chat Esecutore.

### Integrazione in main

La Chat Esecutore non deve:

- fare push direttamente su `main`;
- fornire anticipatamente comandi per aggiornare `main`;
- fare merge;
- fare squash;
- fare cherry-pick su `main`;
- cambiare il branch base;
- dichiarare che il branch può essere integrato;
- sostituirsi alla Chat Analisi nella revisione.

Dopo il push del branch task, deve fermarsi.

La Chat Analisi:

1. legge branch e SHA su GitHub;
2. confronta il branch task con `main`;
3. verifica file, diff, scope e test;
4. richiede eventuali correzioni sullo stesso branch;
5. quando tutto è corretto, fornisce all’utente i comandi per integrare la modifica in `main`.

## 2.2 Standard per gli script di applicazione

Quando la Chat Esecutore non può modificare direttamente il checkout locale e la task richiede modifiche testuali, deve usare come modalità predefinita un solo script Python.

Lo script deve:

- avere un nome derivato dalla task, per esempio `docs02_apply.py`;
- essere salvato nella root del repository, accanto a `package.json`;
- essere eseguito con `python ./<nome-script>.py`;
- usare soltanto la libreria standard Python;
- modificare esclusivamente i file autorizzati;
- verificare di essere eseguito dalla root corretta;
- verificare l’esistenza dei file target;
- verificare gli anchor prima di modificare;
- interrompersi senza scritture parziali quando un anchor manca;
- essere idempotente;
- non duplicare blocchi già inseriti;
- conservare la codifica UTF-8;
- conservare per quanto possibile lo stile di newline già presente;
- produrre un output breve con file modificati o errore;
- non eseguire comandi Git;
- non creare commit;
- non eseguire push;
- non installare dipendenze;
- non modificare file fuori scope.

La Chat Esecutore deve fornire un solo percorso operativo.

Non deve dire contemporaneamente:

- salvalo nei Download;
- salvalo fuori dal repository;
- salvalo nella root;
- usa un percorso assoluto;
- scegli tu dove metterlo.

Lo standard è:

```txt
salvare nella root del repository
eseguire con python ./<nome-script>.py
```

Dopo l’esecuzione devono essere mostrati almeno:

```bash
git diff --check
git diff --name-only
git status --short
```

Lo script è un artefatto temporaneo e non deve essere incluso nel commit.

Prima dello staging deve essere eliminato con:

```bash
rm -f ./<nome-script>.py
```

La revisione ordinaria usa esclusivamente:

```txt
branch task remoto
commit SHA
diff GitHub tra main e branch task
```

## 3. Prerequisiti prima di scrivere il prompt

Prima di produrre un prompt esecutivo, l’Analista deve conoscere:

```txt
Repository: Pixelpro-agency/Props24
Branch base: main, salvo indicazione diversa
ID e titolo della task
Obiettivo unico
Requisiti approvati dall’utente
Stato corrente verificato nel codice
File rilevanti
Contratti e comportamenti da preservare
Test tecnici disponibili
Necessità o meno di un successivo collaudo browser
```

Deve inoltre verificare:

- che la task non sia già implementata;
- che non dipenda da decisioni ancora mancanti;
- che non unisca due obiettivi indipendenti;
- che i file candidati esistano sul branch base;
- che i comandi di test derivino dagli script e dalla configurazione reali;
- che eventuali file esterni forniti dall’utente siano sufficienti;
- che la task sia coerente con `docs/planning/implementazioni.md`, senza assumere che il piano prevalga sul codice.

Se una decisione può cambiare schema dati, comportamento UI, regole CRUD, navigazione o risultato osservabile, l’Analista deve fermarsi e chiederla all’utente prima di scrivere il prompt.

## 4. Principio del contesto minimo sufficiente

Ogni prompt deve includere soltanto il contesto necessario alla task:

1. un obiettivo verificabile;
2. repository, branch base e nome del branch task;
3. file modificabili;
4. file consultabili in sola lettura;
5. requisiti e comportamento richiesto;
6. contratti e comportamenti da preservare;
7. confini espliciti dello scope;
8. test tecnici mirati;
9. regole Git e pull request;
10. formato del report finale;
11. gestione dei fallimenti.

Non chiedere automaticamente all’Esecutore di leggere:

- l’intero repository;
- tutte le pagine e tutti i componenti;
- vecchi ZIP o Repomix;
- vecchi report o conversazioni;
- documentazione non collegata alla task;
- dati generati, cache, build o log;
- `package-lock.json`, salvo una task sulle dipendenze;
- file `.env`, credenziali o dati sensibili.

Quando il codice corrente smentisce un documento precedente, il prompt deve usare il comportamento verificato nel codice e segnalare la discrepanza.

## 5. Classificazione dei file

### 5.1 File modificabili

Elencare singolarmente i soli file che l’Esecutore può creare, modificare o eliminare.

Esempio:

```txt
File modificabili:
- src/db/buildingRepository.ts (nuovo)
- src/db/databaseValidation.ts
- src/types/building.ts
```

Un percorso con wildcard è ammesso soltanto quando la task riguarda realmente un piccolo modulo completo e il prompt delimita quali componenti possono cambiare.

Se durante l’esecuzione emerge la necessità di modificare un file non autorizzato, l’Esecutore deve fermarsi e riportarla. Non può aggiungerlo autonomamente allo scope.

### 5.2 File consultabili in sola lettura

Elencare i file utili a comprendere contratti, tipi, pattern già presenti e punti di integrazione, ma che non devono essere modificati.

Esempio:

```txt
File consultabili in sola lettura:
- src/db/jsonDb.ts
- src/db/propertyRepository.ts
- docs/planning/implementazioni.md, sezione TASK A1
```

I file consultabili non sono automaticamente modificabili.

### 5.3 File di test

Per ogni test pertinente il prompt deve indicare espressamente uno dei due stati:

- **modificabile**, se la task richiede nuovi casi o l’aggiornamento legittimo delle aspettative;
- **sola lettura**, se serve a comprendere il contratto o diagnosticare un fallimento ma non deve essere cambiato.

Un file di test non elencato non deve essere aperto indiscriminatamente. Il relativo comando può comunque essere eseguito quando è indicato nel prompt.

L’Esecutore non deve modificare un test per far passare una regressione del codice. Se l’aspettativa sembra errata o incompatibile con il requisito approvato, deve fermarsi e segnalarlo.

## 6. Contesto minimo per area Props24

La tabella indica punti di partenza, non autorizzazioni automatiche. L’Analista deve sempre verificare i percorsi sul codice corrente.

| Area | Codice da valutare | Contesto da preservare |
| --- | --- | --- |
| Edifici | `src/pages/BuildingsPage.tsx`, `src/hooks/useBuildings.ts`, `src/components/buildings/`, `src/types/building.ts`, repository DB interessati | relazione con unità, `unitsCount` derivato, lifecycle e isolamento account |
| Unità | `src/pages/NewProperty.tsx`, `src/pages/PropertiesPage.tsx`, `src/components/property-form/`, `src/db/propertyRepository.ts`, tipi proprietà | relazione edificio-unità, draft, dati annidati, regole duplicati |
| Inquilini | pagine e componenti tenant, `src/db/tenantRepository.ts`, `src/db/contactRepository.ts`, tipi tenant | persona/società, contatti, garanti, documenti, ID canonici |
| Locazioni | `src/landlord/leases/`, `src/db/leaseRepository.ts`, `src/db/paymentRepository.ts` | date, rate, pagamenti, snapshot, firma e comportamento edit |
| Database locale | `src/db/jsonDb.ts`, `src/db/database.types.ts`, repository e validatori interessati | chiavi account-scoped, scrittura atomica, migrazione e integrità |
| Preferenze UI | pagine interessate, `src/hooks/useLocalStorage.ts`, settings e relativo repository | isolamento per account e migrazione delle chiavi legacy |
| Navigazione | `src/App.tsx`, `src/utils/routes.ts`, `src/data/menu.ts`, `src/data/navbar.ts` e accessi UI coinvolti | route reali, autenticazione, nessun falso link o falso successo |
| Form e modifiche non salvate | form interessato, hook/provider draft, routing e guard condiviso | dirty state, submit, annulla, reload, logout e cambio route |
| Solo documentazione | documento target e fonti direttamente necessarie | nessuna modifica runtime e nessuna affermazione non verificata |

Per una modifica interna a un repository dati non includere automaticamente pagine, menu e design. Per una modifica UI non cambiare schema o persistenza se il requisito non lo richiede.

## 7. Contratti da esplicitare

Il prompt deve indicare i contratti rilevanti quando la task può cambiare:

- forma dei record persistiti;
- ID e relazioni tra entità;
- isolamento dei dati per account;
- migrazione o validazione del database;
- regole CRUD e condizioni di blocco;
- route e navigazione;
- schema e payload dei form;
- comportamento di draft, reload o edit;
- calcoli di date, rate, pagamenti o dashboard;
- messaggi e stati osservabili dalla UI;
- compatibilità con dati già persistiti.

Per un refactor interno non aggiungere o modificare contratti non coinvolti.

## 8. Confini generali da preservare

Salvo autorizzazione esplicita, il prompt deve vietare:

- modifiche dirette a `main`;
- force push, rebase distruttivo e merge;
- feature aggiuntive;
- refactor e pulizie generali;
- correzione del lint globale;
- modifica del design globale;
- nuove dipendenze;
- backend o database remoti;
- modifica di dati seed;
- cancellazione di funzioni future;
- modifica di file fuori scope;
- uso di `Math.random` per ID persistiti;
- scritture applicative in chiavi globali parallele al database account-scoped;
- `console.log` o toast di successo come sostituti di una mutazione reale;
- modifica di `docs/planning/implementazioni.md` prima dell’approvazione finale e senza prompt documentale dedicato.

## 9. Test tecnici

Il prompt deve fornire comandi reali e mirati, ricavati dal repository.

I comandi disponibili nel progetto devono essere verificati prima di inserirli. In base allo stato corrente possono includere:

```txt
npm run build
npm run lint -- <percorsi supportati dalla configurazione reale>
<eventuale comando di test già presente e verificato>
```

Non inventare una suite, uno script o uno smoke test inesistente.

Se il lint globale contiene debito preesistente, il prompt deve:

- preferire il lint dei file modificati, quando tecnicamente supportato;
- separare gli errori preesistenti da quelli introdotti;
- non autorizzare la correzione dell’intero repository.

Il test tecnico non sostituisce il successivo collaudo browser quando la task cambia un comportamento UI, una persistenza osservabile o un flusso utente.

## 10. Gestione dei fallimenti

Ogni prompt di codice deve contenere questa formula:

> Fai massimo 3 tentativi ragionati. Dopo il terzo tentativo fermati e riporta log, file modificati, comandi eseguiti, errori e cosa resta da capire.

Ogni tentativo deve:

1. partire dall’errore reale;
2. formulare una causa plausibile usando soltanto il contesto autorizzato;
3. applicare la correzione minima dentro lo scope;
4. rieseguire lo stesso test pertinente.

Non sono consentiti:

- tentativi casuali;
- modifica di aspettative per nascondere una regressione;
- apertura indiscriminata dell’intero repository;
- ampliamento autonomo dei file modificabili;
- quarto tentativo;
- force push o riscrittura della cronologia.

Dopo il terzo fallimento l’Esecutore deve fermarsi e restituire lo stato reale, senza dichiarare la task completata.

## 11. Tutorial Git da richiedere all’Esecutore

Ogni prompt deve specificare:

```txt
Repository: Pixelpro-agency/Props24
Branch base: main
Branch task: <tipo>/<id-descrizione>
```

### Fase iniziale

Per una nuova task, la Chat Esecutore deve fornire:

```bash
git fetch origin
git switch main
git pull --ff-only
git status --short
git switch -c <branch-task>
```

Per una correzione sullo stesso branch deve invece fornire:

```bash
git fetch origin
git switch <branch-task>
git pull --ff-only
git status --short
git rev-parse HEAD
```

La Chat Esecutore deve inoltre:

- spiegare come controllare il working tree iniziale;
- non cancellare o includere modifiche preesistenti;
- consegnare per ogni file una patch precisa o il file completo;
- proporre commit piccoli e descrittivi;
- non creare branch, commit, tag o pull request;
- non eseguire direttamente operazioni Git o GitHub;
- non fare force push, rebase distruttivo o merge.

### Dopo modifica e test positivi

La Chat Esecutore deve fornire all’utente:

```bash
rm -f ./<script-temporaneo>.py

git add <soli-file-autorizzati>

git diff --cached --check
git diff --cached --name-only
git diff --cached

git commit -m "<messaggio-descrittivo>"

git push origin <branch-task>

git rev-parse HEAD
git status --short
```

Il push deve riguardare esclusivamente il branch task.

È vietato fornire:

```bash
git push origin main
```

o qualsiasi comando equivalente che aggiorni `main`.

Dopo il push del branch task, la Chat Esecutore deve richiedere lo SHA finale e lo stato del working tree, quindi produrre il report per la Chat Analisi.

## 12. Pull request aperta dall’utente

La pull request non è obbligatoria nel flusso standard.

La Chat Esecutore prepara titolo e descrizione di una draft PR soltanto quando:

- il prompt lo richiede espressamente;
- la Chat Analisi lo richiede dopo la revisione;
- l’utente decide di usare una PR.

Quando richiesta, la draft PR deve contenere:

- ID e titolo della task;
- obiettivo unico;
- modifiche principali;
- test eseguiti ed exit code;
- elementi non modificati;
- limiti e aspetti non verificati;
- indicazione che il collaudo non è ancora eseguito;
- formula `DRAFT — non fare merge`.

L’assenza di una PR non impedisce alla Chat Analisi di revisionare il branch remoto tramite SHA e confronto GitHub.

L’utente apre o aggiorna la PR. La creazione della PR non equivale ad approvazione statica, collaudo o autorizzazione al merge.

## 13. Report finale dell’Esecutore

Il risultato dell’Esecutore deve essere operativo, non discorsivo e basato soltanto su fatti osservabili.

Non deve contenere:

- esposizione del ragionamento;
- ricostruzione della comprensione;
- un piano prima dell’esecuzione;
- alternative non richieste;
- ripetizione integrale del prompt;
- anticipazione dell’integrazione in `main`;
- dichiarazioni di approvazione.

Dopo il push del branch task, il report deve contenere esclusivamente:

1. repository;
2. branch base;
3. SHA attuale del branch base, quando verificato;
4. branch task;
5. commit SHA pubblicato sul branch task;
6. file letti;
7. file modificati;
8. riepilogo delle modifiche;
9. comandi eseguiti;
10. test e controlli con exit code;
11. tentativi utilizzati;
12. warning;
13. limiti e non verificato;
14. stato del working tree;
15. conferma che il branch task è stato pubblicato;
16. conferma che `main` non è stato modificato;
17. conferma che non è stato eseguito alcun merge;
18. pull request, soltanto se esistente;
19. indicazione `Pronto per la revisione della Chat Analisi.`

Il report non deve sostituire la diff GitHub e non deve chiedere di allegare nuovamente file già disponibili sul branch remoto.

## 14. Template del prompt esecutivo

```txt
# TASK <ID> — <titolo>

## Ruolo

Agisci come Chat Esecutore / Preparatore delle modifiche di Props24.
Esegui soltanto il presente prompt. Non decidere requisiti, non ampliare lo scope e non approvare il tuo lavoro.
Non eseguire scritture Git o GitHub. L’utente applicherà le modifiche, creerà branch e commit, farà push e gestirà la pull request.

## Modalità di esecuzione obbligatoria

Inizia immediatamente il lavoro autorizzato.

Non esporre ragionamenti, piani, riepiloghi, interpretazioni o alternative.
Non chiedere conferme già contenute nel prompt.
Svolgi internamente le verifiche necessarie e comunica soltanto artefatti, comandi, risultati, errori reali o blocchi oggettivi.

Poni una domanda soltanto se un blocco tecnico reale impedisce l’esecuzione.
Non anticipare l’integrazione in `main`, il merge o il collaudo non ancora richiesti.

Quando non puoi modificare direttamente il checkout locale e la task richiede modifiche testuali, crea un solo script Python da salvare nella root del repository ed eseguire con:

python ./<nome-script>.py

## Obiettivo unico

<una sola modifica verificabile>

## Contesto verificato

- stato corrente:
- problema dimostrato:
- decisioni dell’utente:
- dipendenze già soddisfatte:

## Repository e Git

- Repository: Pixelpro-agency/Props24
- Branch base: main
- Branch task: <tipo>/<id-descrizione>
- Sincronizza il branch base con `git pull --ff-only`.
- Controlla il working tree prima di modificare.
- Non modificare `main`.
- Non fare force push, rebase distruttivo o merge.

## File modificabili

- <percorso>
- <percorso nuovo, dichiarato come nuovo>

## File consultabili in sola lettura

- <percorso>
- <sezione pertinente di docs/planning/implementazioni.md>

## Comportamento richiesto

- ...

## Contratti e comportamenti da preservare

- ...

## Non modificare

- ...

## Implementazione richiesta

- ...

## Test tecnici

- comando:
- risultato richiesto:
- file di test modificabili:
- file di test in sola lettura:

Non inventare test o script assenti dal repository.
Non correggere errori globali fuori scope.

## Gestione dei fallimenti

Fai massimo 3 tentativi ragionati. Dopo il terzo tentativo fermati e riporta log, file modificati, comandi eseguiti, errori e cosa resta da capire.

Ogni tentativo deve partire dall’errore reale, formulare una causa plausibile, applicare la correzione minima autorizzata e rieseguire il test pertinente.
Non modificare file fuori scope e non effettuare un quarto tentativo.

## Commit e push del branch task

- Consegna all’utente file completi o patch precise e indica esattamente dove applicare ogni modifica.
- Spiega come verificare localmente ogni modifica.
- Dopo test e diff positivi, fornisci i comandi per eliminare gli artefatti temporanei.
- Aggiungi allo staging soltanto i file autorizzati.
- Verifica la diff in staging prima del commit.
- Suggerisci un messaggio di commit descrittivo: `<tipo>(<area>): <descrizione>`.
- Fornisci i comandi per creare il commit sul branch task e fare push del solo branch task.
- Richiedi il commit SHA pubblicato e lo stato del working tree.
- Produci il report per la Chat Analisi.
- Non creare direttamente branch, commit, tag o pull request.
- Non eseguire direttamente push, force push, rebase o merge.
- Non fornire comandi che aggiornino `main`.
- Prepara titolo e descrizione di una draft PR soltanto quando richiesta.

## Integrazione in main

La Chat Esecutore non fornisce comandi per integrare il branch task in main.

Dopo il push del branch task, la Chat Analisi revisiona branch, SHA e diff GitHub.

Soltanto dopo l’approvazione, la Chat Analisi fornisce all’utente i comandi per integrare e pubblicare main.

## Risultato atteso

- <condizione tecnica osservabile>
- <assenza di regressione>

## Report finale

Non esporre ragionamenti, ricostruzioni della comprensione, piani, alternative non richieste o anticipazioni dell’integrazione in `main`.
Basa il report soltanto su fatti osservabili.

Dopo il push del branch task, riporta esclusivamente:
1. repository;
2. branch base;
3. SHA attuale del branch base, quando verificato;
4. branch task;
5. commit SHA pubblicato sul branch task;
6. file letti;
7. file modificati;
8. riepilogo;
9. comandi;
10. test e controlli con exit code;
11. tentativi;
12. warning;
13. limiti e non verificato;
14. working tree;
15. branch task pubblicato: sì/no;
16. `main` modificato: no;
17. merge eseguito: no;
18. pull request: soltanto se esistente;
19. stato: `Pronto per la revisione della Chat Analisi.`
```

## 15. Checklist dell’Analista

Prima di consegnare il prompt:

```txt
[ ] La task ha un solo obiettivo.
[ ] I requisiti sono stati approvati dall’utente.
[ ] Il codice corrente è stato verificato su GitHub.
[ ] Repository, branch base e branch task sono indicati.
[ ] I file modificabili sono minimi ed espliciti.
[ ] I file in sola lettura sono distinti dai file modificabili.
[ ] I test sono classificati come modificabili o in sola lettura.
[ ] I contratti da preservare sono espliciti.
[ ] I confini di scope sono espliciti.
[ ] I comandi di test esistono realmente.
[ ] Il collaudo browser è definito oppure dichiarato non necessario.
[ ] La regola dei tre tentativi è presente.
[ ] È vietata ogni scrittura Git o GitHub da parte della chat.
[ ] Il prompt ordina l’avvio immediato dell’esecuzione.
[ ] Il prompt vieta piani, riepiloghi e ragionamenti esposti.
[ ] Le domande sono ammesse soltanto per blocchi tecnici reali.
[ ] Il percorso dello script è unico e non ambiguo.
[ ] Lo script deve essere salvato nella root del repository.
[ ] Il comando usa python ./<nome-script>.py.
[ ] Gli artefatti temporanei sono esclusi dal commit.
[ ] Il prompt richiede il push del solo branch task.
[ ] Il prompt vieta il push diretto su main.
[ ] Il prompt vieta all’Esecutore di fornire anticipatamente i comandi di integrazione in main.
[ ] Il report finale contiene branch task e SHA remoto.
[ ] La revisione usa la diff GitHub tra main e branch task.
[ ] Repomix non è richiesto.
[ ] fileModificati.md non è richiesto né generato.
[ ] La PR è facoltativa salvo richiesta esplicita.
[ ] I comandi per integrare in main spettano alla Chat Analisi dopo l’approvazione.
[ ] Non sono inclusi segreti, cache, build, dump o dati generati.
[ ] Nessuna decisione tecnica o di prodotto è lasciata implicitamente all’Esecutore.
```

## 16. Regola conclusiva

Un buon prompt esecutivo non è il più lungo possibile: è quello che permette all’Esecutore di preparare una sola modifica corretta e all’utente di applicarla, verificarla e pubblicarla senza dover interpretare istruzioni vaghe.

Se per eseguirlo l’Esecutore deve scegliere requisiti, scoprire autonomamente lo scope o decidere quali contratti cambiare, il prompt non è ancora pronto e deve tornare alla fase di analisi.

> Un prompt esecutivo non deve obbligare l’utente a guidare nuovamente l’Esecutore su percorso dei file, formato dell’artefatto, ordine dei comandi o fase corrente. Queste scelte operative devono essere già determinate dal prompt e applicate senza discussione.

> L’Esecutore può ragionare quanto necessario per lavorare correttamente, ma non deve trasferire all’utente il proprio processo di ragionamento. Deve trasferire soltanto il risultato operativo e le evidenze richieste.

> Il completamento della fase della Chat Esecutore coincide con il push verificato del branch task e la consegna del relativo SHA. Non coincide con l’integrazione in main.

> Il branch task remoto e la relativa diff GitHub sono la fonte della revisione. Repomix, copie aggregate dei file e fileModificati.md non devono sostituire branch, commit e diff.

> La Chat Analisi è l’unico ruolo che, dopo avere approvato la modifica, può fornire all’utente i comandi per integrare il branch task in main.
