# Props24 — Metodo per costruire prompt esecutivi

## 1. Scopo

Questo documento definisce come la Chat Amministratore / Analista deve preparare un prompt esecutivo per la Chat Esecutore / Preparatore delle modifiche di Props24.

Il prompt deve fornire il contesto minimo sufficiente per realizzare una sola modifica verificabile sul codice corrente, senza lasciare all’Esecutore decisioni di prodotto, interpretazioni dei requisiti o libertà di ampliare lo scope.

Questo documento integra `docs/metodologia-lavoro-props24.md`. In caso di conflitto prevalgono:

1. la decisione esplicita più recente dell’utente;
2. `docs/metodologia-lavoro-props24.md`;
3. il codice del branch e del commit SHA indicati;
4. i test eseguiti sullo stesso SHA;
5. `docs/implementazioni.md`;
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
- che la task sia coerente con `docs/implementazioni.md`, senza assumere che il piano prevalga sul codice.

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
- `COMING_SOON.md` come fonte autoritativa;
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
- docs/implementazioni.md, sezione TASK A1
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
- modifica di `docs/implementazioni.md` prima dell’approvazione finale e senza prompt documentale dedicato.

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

L’Esecutore deve consegnare all’utente questi comandi suggeriti:

```bash
git fetch origin
git switch <branch-base>
git pull --ff-only
git status --short
git switch -c <branch-task>
```

Il prompt deve inoltre imporre all’Esecutore:

- di spiegare come controllare il working tree iniziale;
- di non cancellare o includere modifiche preesistenti;
- di consegnare per ogni file una patch precisa o il file completo;
- di proporre commit piccoli e descrittivi;
- di suggerire il push del solo branch task;
- di preparare titolo e descrizione della draft PR quando richiesta;
- di attendere branch, SHA e PR comunicati dall’utente;
- di non creare branch, commit, tag o pull request;
- di non eseguire push, force push, rebase o merge;
- di richiedere all’utente lo SHA finale dopo il push.

Il branch, i commit e la diff remota sostituiscono normalmente `fileModificati.md`. Non generarlo né committarlo salvo richiesta esplicita dell’Analista come fallback.

## 12. Pull request aperta dall’utente

Quando richiesta, l’Esecutore deve preparare per l’utente una PR draft contenente:

- ID e titolo della task;
- obiettivo unico;
- modifiche principali;
- test eseguiti ed exit code;
- elementi non modificati;
- limiti e aspetti non verificati;
- indicazione che il collaudo non è ancora eseguito;
- formula `DRAFT — non fare merge`.

L’utente apre o aggiorna la PR. La creazione della PR non equivale ad approvazione statica, collaudo o autorizzazione al merge.

## 13. Report finale dell’Esecutore

Il prompt deve richiedere:

1. repository;
2. branch base;
3. branch task;
4. commit SHA: da fornire dall’utente dopo il push;
5. pull request: da aprire dall’utente, se prevista;
6. file letti;
7. file modificati;
8. riepilogo delle modifiche;
9. comandi eseguiti;
10. esito dei test con exit code;
11. tentativi utilizzati;
12. warning;
13. limiti e non verificato;
14. stato del working tree;
15. tutorial di applicazione, branch, commit e push consegnato;
16. conferma che la chat non ha eseguito scritture GitHub o merge.

Il report non deve sostituire la diff e non deve incollare file completi già disponibili su GitHub.

## 14. Template del prompt esecutivo

```txt
# TASK <ID> — <titolo>

## Ruolo

Agisci come Chat Esecutore / Preparatore delle modifiche di Props24.
Esegui soltanto il presente prompt. Non decidere requisiti, non ampliare lo scope e non approvare il tuo lavoro.
Non eseguire scritture Git o GitHub. L’utente applicherà le modifiche, creerà branch e commit, farà push e gestirà la pull request.

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
- <sezione pertinente di docs/implementazioni.md>

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

## Commit, push e PR

- Consegna all’utente file completi o patch precise e indica esattamente dove applicare ogni modifica.
- Spiega come verificare localmente ogni modifica.
- Suggerisci un messaggio di commit descrittivo: `<tipo>(<area>): <descrizione>`.
- Fornisci i comandi suggeriti per creare il branch, aggiungere soltanto i file della task, creare il commit e fare push.
- Prepara titolo e descrizione di una draft PR verso `main` quando richiesta.
- Inserisci nella descrizione proposta obiettivo, modifiche, test, limiti, elementi non modificati e `DRAFT — non fare merge`.
- Non creare branch, commit, tag o pull request.
- Non eseguire push, force push, rebase o merge.
- Non generare `fileModificati.md`, salvo richiesta esplicita.

## Risultato atteso

- <condizione tecnica osservabile>
- <assenza di regressione>

## Report finale

Riporta esclusivamente:
1. repository;
2. branch base;
3. branch task;
4. commit SHA: da fornire dall’utente;
5. PR: da aprire dall’utente, se prevista;
6. file letti;
7. file modificati;
8. riepilogo;
9. comandi;
10. test ed exit code;
11. tentativi;
12. warning;
13. limiti e non verificato;
14. working tree;
15. tutorial applicativo e Git consegnato;
16. conferma di nessuna scrittura GitHub e nessun merge.
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
[ ] È richiesto il tutorial per applicazione, commit, push e draft PR.
[ ] È vietata ogni scrittura Git o GitHub da parte della chat.
[ ] Il report richiede branch, SHA, PR, test ed exit code.
[ ] Non è richiesta la generazione ordinaria di fileModificati.md.
[ ] Non sono inclusi segreti, cache, build, dump o dati generati.
[ ] Nessuna decisione tecnica o di prodotto è lasciata implicitamente all’Esecutore.
```

## 16. Regola conclusiva

Un buon prompt esecutivo non è il più lungo possibile: è quello che permette all’Esecutore di preparare una sola modifica corretta e all’utente di applicarla, verificarla e pubblicarla senza dover interpretare istruzioni vaghe.

Se per eseguirlo l’Esecutore deve scegliere requisiti, scoprire autonomamente lo scope o decidere quali contratti cambiare, il prompt non è ancora pronto e deve tornare alla fase di analisi.
