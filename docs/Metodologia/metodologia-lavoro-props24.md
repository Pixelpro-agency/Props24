# Props24 — Metodologia di lavoro con chat separate, GitHub gestito dall’utente e collaudo locale

## Scopo

Questo documento definisce il metodo obbligatorio con cui vengono analizzate, implementate, revisionate, collaudate e integrate le modifiche di Props24.

Il flusso usa tre chat con ruoli permanenti e non sovrapponibili:

1. **Chat Amministratore / Analista**
2. **Chat Esecutore GitHub**
3. **ChatGPT Desktop / Collaudatore**

L’utente resta il proprietario del progetto e l’unico soggetto che autorizza:

- l’avvio di una task;
- l’allargamento dello scope;
- l’apertura o la modifica di una pull request;
- il merge nel branch principale;
- l’eventuale modifica di questa metodologia.

Inoltre, l’utente è l’unico soggetto che applica materialmente le modifiche ai file del progetto e compie operazioni Git o GitHub di scrittura.

## Modalità operativa senza scritture GitHub delle chat

Per mantenere i permessi critici sotto il controllo dell’utente:

- nessuna chat crea, modifica o elimina file nel repository remoto;
- nessuna chat crea branch, commit, tag o pull request;
- nessuna chat esegue push, force push, rebase o merge;
- nessuna chat modifica direttamente `main` o un branch task;
- le chat possono leggere GitHub e analizzare branch, commit, diff e pull request già creati dall’utente;
- quando una modifica è autorizzata, la Chat Esecutore prepara la modifica e consegna all’utente un tutorial applicativo preciso;
- l’utente applica le modifiche, crea il branch, esegue commit e push e, quando necessario, apre o aggiorna la pull request;
- dopo il push dell’utente, tutte le revisioni devono basarsi sul branch e sul commit SHA remoto comunicati dall’utente.

Il tutorial dell’Esecutore deve indicare:

1. branch base consigliato;
2. nome del branch task consigliato;
3. file da creare, modificare o eliminare;
4. per ogni file, posizione esatta e modifica completa da applicare;
5. comandi tecnici da eseguire;
6. risultati attesi;
7. controlli sul working tree;
8. messaggio di commit consigliato;
9. comandi Git suggeriti per branch, commit e push;
10. titolo e descrizione della draft PR, quando necessaria;
11. divieto di merge finché la task non è approvata.

Le istruzioni successive che attribuiscono all’Esecutore una scrittura Git o GitHub devono essere interpretate secondo questa modalità: l’Esecutore prepara e verifica la modifica, mentre l’utente la applica e pubblica.

Lo scopo della separazione è evitare che una singola chat:

- decida autonomamente cosa implementare;
- modifichi codice mentre sta ancora analizzando;
- approvi il proprio lavoro;
- corregga durante un collaudo;
- faccia merge senza una revisione indipendente;
- lavori su una versione diversa da quella controllata dalle altre chat.

---

# 1. Principi fondamentali

## 1.1 GitHub è la fonte condivisa del codice

Dopo l’avvio di questa metodologia, la versione condivisa del progetto è quella presente nel repository GitHub.

Le chat non devono basarsi su:

- vecchi ZIP;
- vecchi Repomix;
- copie locali non sincronizzate;
- file incollati in conversazioni precedenti;
- report privi di branch e commit SHA;
- supposizioni sulla versione attuale del codice.

Ogni revisione deve indicare almeno:

```txt
Repository: owner/repository
Branch base: main
Branch task: task/...
Commit revisionato: <SHA>
Pull request: #<numero>, se esiste
```

Quando il repository remoto e la copia locale differiscono, la discrepanza deve essere risolta prima di proseguire.

## 1.2 `main` deve restare stabile

Nessuna chat deve modificare direttamente `main`.

Ogni task usa un branch dedicato creato dall’ultimo stato approvato del branch base.

Esempi:

```txt
task/a1-building-repository
task/b2-property-duplicate-rule
fix/d2-direct-debit-payment-state
docs/update-implementazioni-building
```

Il push di un branch task è consentito prima del collaudo perché non rende la modifica definitiva.

L’azione definitiva è il merge nel branch base.

## 1.3 Una task per branch

Ogni branch deve contenere un solo obiettivo verificabile.

Sono consentiti nello stesso branch:

- il primo commit della task;
- commit correttivi richiesti dalla Chat Amministratore;
- test aggiunti o modificati se autorizzati;
- aggiornamento finale di `docs/implementazioni.md` dopo l’approvazione;
- correzioni documentali strettamente collegate alla stessa task.

Non sono consentiti nello stesso branch:

- due feature indipendenti;
- refactor non richiesti;
- pulizie generali;
- aggiornamenti di dipendenze non necessari;
- correzioni casuali incontrate durante il lavoro;
- modifiche a task future.

## 1.4 Nessuna chat cambia ruolo

Ogni chat deve rispettare il proprio ruolo per tutta la durata del lavoro.

Una richiesta fuori ruolo deve essere fermata e rinviata alla chat competente.

Esempi:

- la Chat Amministratore non implementa codice;
- la Chat Esecutore non decide i requisiti;
- il Collaudatore non corregge i difetti;
- nessuna chat esegue il merge senza autorizzazione dell’utente.

Il ruolo non cambia perché una task sembra semplice o perché una correzione appare evidente.

## 1.5 Nessuna modifica senza autorizzazione

La lettura e l’analisi possono essere svolte quando richieste.

Le azioni di scrittura richiedono un’autorizzazione esplicita e vengono comunque eseguite materialmente dall’utente:

- creare branch;
- modificare file;
- creare commit;
- effettuare push;
- aprire o aggiornare pull request;
- segnare una task come completata;
- aggiornare `docs/implementazioni.md`;
- fare merge;
- eliminare branch.

---

# 2. Documenti operativi

## 2.1 `docs/implementazioni.md`

`docs/implementazioni.md` è il piano operativo vivo del lavoro ancora da svolgere.

Deve contenere:

- problemi ancora aperti;
- decisioni richieste;
- task residue;
- dipendenze;
- file coinvolti;
- criteri di completamento;
- collaudi ancora necessari.

Non deve diventare:

- una cronologia completa del progetto;
- un changelog di ogni commit;
- la documentazione architetturale definitiva;
- un elenco di task già concluse;
- una copia dei report delle chat.

Può essere modificato soltanto:

1. dopo un’analisi approvata dall’utente;
2. dopo la chiusura effettiva di una task;
3. per correggere un’informazione dimostrata falsa dal codice corrente;
4. tramite un prompt che autorizza esplicitamente la modifica del file.

## 2.2 Documentazione tecnica futura

La documentazione tecnica definitiva sarà separata da `implementazioni.md`.

Descriverà lo stato reale del progetto dopo la chiusura delle implementazioni e seguirà la struttura che l’utente fornirà attraverso un progetto di riferimento.

La metodologia corrente non deve anticipare o inventare quella struttura.

## 2.3 Precedenza delle fonti

Quando le fonti sono in conflitto, usare questo ordine:

1. decisione esplicita più recente dell’utente;
2. codice del commit SHA in revisione;
3. test eseguiti su quello stesso commit;
4. documentazione tecnica owner aggiornata;
5. `docs/implementazioni.md`;
6. vecchi report, prompt e conversazioni.

Un documento vecchio non prevale sul codice corrente senza una verifica.

---

# 3. Ruolo 1 — Chat Amministratore / Analista

## 3.1 Responsabilità

La Chat Amministratore:

- raccoglie i requisiti dell’utente;
- legge il repository GitHub;
- legge `docs/implementazioni.md`;
- individua i confini della task;
- chiede i file o le decisioni mancanti;
- verifica se una richiesta è già implementata;
- scompone il lavoro in task piccole;
- prepara il prompt esecutivo;
- revisiona branch, commit e pull request;
- controlla lo scope della diff;
- valuta i report di test;
- prepara eventuali prompt correttivi;
- autorizza il passaggio al collaudo;
- valuta il report del Collaudatore;
- dichiara la task approvata o da correggere;
- prepara il prompt per aggiornare `docs/implementazioni.md`;
- indica all’utente quando il branch può essere unito.

## 3.2 Azioni vietate

La Chat Amministratore non deve:

- modificare codice applicativo;
- creare soluzioni direttamente nel repository;
- creare commit della task;
- eseguire push;
- correggere il branch durante la revisione;
- fare collaudo browser al posto del Collaudatore;
- fare merge;
- approvare una task senza leggere la diff;
- accettare un report senza branch e SHA;
- cambiare i requisiti senza consenso dell’utente;
- ampliare autonomamente la task.

Può leggere GitHub e confrontare branch o commit.

Può scrivere un documento fuori dal repository soltanto quando l’utente chiede esplicitamente di prepararlo; l’inserimento nel repository resta compito dell’utente.

## 3.3 Input minimo

Per avviare un’analisi servono:

```txt
Repository
Branch base
Task o macroblocco da analizzare
Requisiti dell’utente
File di riferimento esterni, se necessari
docs/implementazioni.md aggiornato
```

## 3.4 Output dell’analisi

Prima di scrivere il prompt esecutivo, la Chat Amministratore deve indicare:

1. obiettivo compreso;
2. stato attuale verificato;
3. file rilevanti;
4. dipendenze;
5. decisioni mancanti;
6. rischi di regressione;
7. task proposta;
8. criteri di approvazione.

Se mancano informazioni, si ferma e le chiede.

## 3.5 Prompt esecutivo

Ogni prompt preparato dalla Chat Amministratore deve contenere:

```txt
Titolo e ID task
Obiettivo unico
Repository e branch base
Nome branch richiesto
File modificabili
File consultabili in sola lettura
Comportamento richiesto
Contratti e dati da preservare
Divieti di scope
Test tecnici
Regole Git
Formato del commit
Regole push e pull request
Report finale
Gestione dei fallimenti
```

Formula obbligatoria:

> Fai massimo 3 tentativi ragionati. Dopo il terzo tentativo fermati e riporta log, file modificati, comandi eseguiti, errori e cosa resta da capire.

## 3.6 Revisione statica

Dopo il push del branch, la Chat Amministratore deve controllare:

- branch base corretto;
- commit SHA;
- file modificati;
- diff completa;
- file fuori scope;
- dipendenze modificate;
- test dichiarati;
- eventuale CI;
- messaggi di commit;
- assenza di segreti;
- assenza di file generati inutili;
- coerenza con `docs/implementazioni.md`;
- compatibilità con le task già chiuse.

Esiti ammessi:

```txt
APPROVATO STATICAMENTE
FIX NECESSARIO
REVISIONE BLOCCATA
```

`APPROVATO STATICAMENTE` non equivale ad approvazione finale quando la task richiede collaudo browser.

## 3.7 Valutazione del collaudo

Dopo il report Desktop, la Chat Amministratore verifica:

- branch;
- SHA collaudato;
- ambiente;
- dati iniziali;
- passaggi;
- risultati;
- console;
- persistenza;
- stato finale;
- working tree;
- finding;
- limitazioni strumentali.

Esiti ammessi:

```txt
APPROVATO FINALE
FIX NECESSARIO
COLLAUDO BLOCCATO
```

---

# 4. Ruolo 2 — Chat Esecutore / Preparatore delle modifiche

## 4.1 Responsabilità

La Chat Esecutore:

- legge il prompt approvato;
- verifica repository e branch base;
- legge soltanto il contesto necessario;
- prepara modifiche esclusivamente per i file autorizzati;
- applica la correzione minima in un ambiente locale o in artefatti consegnabili, senza scrivere sul repository remoto;
- esegue i test indicati quando dispone di un checkout locale adatto;
- prepara un tutorial completo per permettere all’utente di applicare le modifiche;
- propone nome del branch, messaggio di commit e contenuto della draft pull request;
- restituisce file preparati, istruzioni, comandi, test e report;
- prepara eventuali correzioni riferendosi allo stesso branch task creato dall’utente;
- prepara l’aggiornamento di `docs/implementazioni.md` soltanto dopo un prompt esplicito.

L’Esecutore può leggere GitHub e può operare su una copia locale o su file separati. Il risultato diventa condiviso soltanto dopo che l’utente lo ha applicato e pushato nel repository remoto.

## 4.2 Azioni vietate

La Chat Esecutore non deve:

- ridefinire l’obiettivo;
- aggiungere feature non richieste;
- modificare file non autorizzati;
- leggere indiscriminatamente l’intero repository;
- correggere debito tecnico fuori scope;
- cambiare dipendenze senza autorizzazione;
- modificare `main`;
- creare branch sul remoto;
- creare commit o tag;
- eseguire push;
- aprire o aggiornare pull request;
- fare force push;
- fare rebase distruttivi;
- fare merge;
- segnare autonomamente la task come approvata;
- aggiornare `docs/implementazioni.md` prima del collaudo finale;
- eseguire un collaudo browser sostituendosi alla Chat Desktop;
- proseguire dopo tre tentativi falliti.

## 4.3 Tutorial per la preparazione del branch

L’Esecutore deve fornire all’utente questi comandi, adattati al branch base reale:

```bash
git fetch origin
git switch main
git pull --ff-only
git status --short
git switch -c <branch-task>
```

Se il branch base non è `main`, usare quello indicato nel prompt.

Se l’utente segnala che il working tree contiene modifiche non previste:

- non cancellarle;
- non nasconderle automaticamente;
- non includerle nel commit;
- fermarsi quando impediscono di isolare la task.

## 4.4 Modifica dei file e commit suggerito

Per ciascun file l’Esecutore deve consegnare una delle seguenti forme:

- file completo, quando è nuovo o la sostituzione integrale è più sicura;
- patch precisa con contesto sufficiente;
- istruzioni puntuali con simbolo, funzione o blocco da sostituire, senza formule vaghe come “aggiungilo sotto”.

Deve anche indicare come verificare che la modifica sia stata applicata correttamente.

I commit suggeriti devono essere piccoli e descrittivi.

Formato consigliato:

```txt
feat(area): descrizione
fix(area): descrizione
docs(area): descrizione
test(area): descrizione
refactor(area): descrizione
```

Esempi:

```txt
feat(buildings): add account-scoped building repository
fix(leases): prevent automatic paid state for direct debit
docs(planning): update remaining building tasks
```

Non usare messaggi generici come:

```txt
update
changes
fix stuff
final
```

## 4.5 Push e pull request eseguiti dall’utente

L’Esecutore suggerisce all’utente, dopo l’applicazione e i test:

```bash
git push -u origin <branch-task>
```

Quando richiesta, l’Esecutore prepara titolo e descrizione della draft PR; l’utente la apre verso il branch base.

La PR deve riportare:

- ID e titolo task;
- obiettivo;
- file principali;
- test eseguiti;
- limitazioni;
- elementi non verificati;
- assenza di merge.

La PR resta draft fino all’approvazione statica e al collaudo finale.

## 4.6 Report dell’Esecutore

Il report deve contenere esclusivamente:

1. repository;
2. branch base;
3. branch task;
4. commit SHA: `DA FORNIRE DALL’UTENTE DOPO IL PUSH`;
5. pull request: `DA APRIRE DALL’UTENTE`, se prevista;
6. file letti;
7. file modificati;
8. riepilogo delle modifiche;
9. comandi eseguiti;
10. esito test con exit code;
11. tentativi utilizzati;
12. warning;
13. limiti e non verificato;
14. stato del working tree;
15. tutorial di branch, commit e push consegnato;
16. conferma che la chat non ha eseguito scritture GitHub o merge.

Deve consegnare i file completi quando sono nuovi o quando una sostituzione integrale è più sicura; negli altri casi può consegnare patch precise.

## 4.7 Gestione dei fallimenti

Sono consentiti al massimo tre tentativi ragionati.

Ogni tentativo deve:

1. partire dall’errore reale;
2. formulare una causa plausibile;
3. applicare la correzione minima autorizzata;
4. rieseguire lo stesso test.

Dopo il terzo fallimento:

- fermarsi;
- non ampliare lo scope;
- non avviare un quarto tentativo;
- indicare chiaramente se lo stato preparato è incompleto e non deve essere applicato;
- riportare errore, stack, file coinvolti e cosa resta da capire;
- attendere un nuovo prompt della Chat Amministratore.

## 4.8 Correzioni richieste dopo revisione

Un prompt correttivo usa lo stesso branch.

L’Esecutore deve:

- verificare lo SHA corrente;
- preparare soltanto il fix richiesto;
- indicare i file e i blocchi da aggiornare;
- proporre un nuovo messaggio di commit;
- ricordare all’utente di non riscrivere la cronologia e di pushare senza force;
- attendere il nuovo SHA fornito dall’utente.

La Chat Amministratore revisiona l’intera differenza branch-base, non soltanto l’ultimo commit.

---

# 5. Ruolo 3 — ChatGPT Desktop / Collaudatore

## 5.1 Responsabilità

Il Collaudatore:

- usa una copia locale pulita del repository;
- recupera il branch remoto approvato staticamente;
- verifica lo SHA esatto;
- avvia l’applicazione;
- prepara dati di test isolati;
- esegue il collaudo browser richiesto;
- controlla UI, persistenza, reload e console;
- registra i risultati;
- ripristina lo stato finale richiesto;
- restituisce un report;
- non modifica il codice.

## 5.2 Azioni vietate

Il Collaudatore non deve:

- correggere direttamente un difetto;
- cambiare codice;
- creare commit;
- fare push;
- aprire o aggiornare PR;
- fare merge;
- modificare il database tramite console;
- usare React DevTools per alterare lo stato;
- usare `dispatchEvent` o manipolazioni DOM per forzare risultati;
- dichiarare un difetto quando il browser non ha realmente applicato il valore;
- superare tre tentativi;
- cambiare requisiti;
- proseguire dopo una perdita di dati critica.

## 5.3 Preparazione locale

Procedura minima:

```bash
git fetch origin
git switch <branch-task>
git pull --ff-only
git status --short
git rev-parse HEAD
npm install
npm run dev
```

`npm install` può essere sostituito da `npm ci` quando appropriato e quando il lockfile è allineato.

Il report deve riportare lo SHA restituito da:

```bash
git rev-parse HEAD
```

Il collaudo è valido soltanto per quello SHA.

## 5.4 Regola dello SHA

Se dopo il collaudo viene creato un nuovo commit di codice, il collaudo precedente non è più valido.

Serve un nuovo collaudo almeno sulle aree influenzate.

Eccezione:

- un commit successivo modifica esclusivamente `docs/implementazioni.md` o altra documentazione non runtime;
- la Chat Amministratore verifica che la diff successiva al collaudo sia esclusivamente documentale.

## 5.5 Report del Collaudatore

Il report deve contenere:

1. repository;
2. branch;
3. SHA collaudato;
4. comando applicazione;
5. URL;
6. browser;
7. account e dati di test;
8. working tree iniziale;
9. passaggi eseguiti;
10. risultato atteso;
11. risultato reale;
12. reload e persistenza;
13. console;
14. dati finali;
15. working tree finale;
16. limitazioni non bloccanti;
17. finding numerati;
18. matrice PASS / FAIL / BLOCCATO;
19. esito finale.

Formula obbligatoria:

> Fai massimo 3 tentativi ragionati. Dopo il terzo tentativo fermati e riporta log, dati di test creati, passaggi eseguiti, errori e cosa resta da capire.

## 5.6 Finding

Ogni finding deve includere:

```txt
ID
Severità
Scenario
Passaggi
Atteso
Reale
Evidenza
Impatto
Stato finale dei dati
```

Il Collaudatore non propone automaticamente una modifica tecnica. Descrive il comportamento osservato.

La Chat Amministratore confronta il finding con il codice e decide se è:

```txt
CONFERMATO
NON CONFERMATO
LIMITAZIONE STRUMENTALE
DA DIAGNOSTICARE
```

---

# 6. Ruolo dell’utente

L’utente:

- definisce le priorità;
- fornisce requisiti e file di riferimento;
- autorizza l’analisi;
- approva i prompt;
- decide quando l’Esecutore può scrivere;
- decide quando aprire la PR;
- decide quando aggiornare `docs/implementazioni.md`;
- decide quando rendere la PR pronta;
- autorizza il merge;
- decide se eliminare il branch;
- può fermare il flusso in qualsiasi momento.

L’utente non deve più allegare ogni volta l’intero repository.

Per passare il lavoro tra le chat sono sufficienti:

```txt
Repository
Branch
SHA
PR
ID task
Report
```

I file esterni restano necessari soltanto quando non appartengono al repository, per esempio:

- progetto di riferimento;
- screenshot;
- requisiti del cliente;
- documenti di esempio;
- dati non pubblicati su GitHub.

---

# 7. Flusso completo di una task

## Fase 0 — Preparazione

L’utente indica alla Chat Amministratore:

- macroblocco;
- requisiti;
- repository;
- branch base;
- file esterni;
- autorizzazione ad analizzare.

La Chat Amministratore non scrive codice.

## Fase 1 — Analisi

La Chat Amministratore:

1. legge GitHub;
2. legge `docs/implementazioni.md`;
3. verifica lo stato corrente;
4. chiede ciò che manca;
5. propone una task;
6. attende l’approvazione.

## Fase 2 — Prompt esecutivo

La Chat Amministratore produce un prompt blindato per la Chat Esecutore.

L’utente trasferisce il prompt nella chat esecutiva.

## Fase 3 — Implementazione

La Chat Esecutore:

1. legge il branch base e il contesto autorizzato;
2. prepara le modifiche ai soli file autorizzati;
3. esegue i test possibili sul proprio ambiente;
4. consegna file o patch e un tutorial applicativo completo;
5. propone branch, commit e draft PR;
6. restituisce il report senza scrivere su GitHub.

L’utente:

1. sincronizza il branch base;
2. crea il branch task;
3. applica le modifiche indicate;
4. esegue i test indicati;
5. crea commit;
6. esegue push;
7. apre o aggiorna la draft PR, se richiesta;
8. comunica branch, SHA, PR e risultati alla Chat Amministratore.

## Fase 4 — Revisione statica

La Chat Amministratore:

1. legge branch e SHA;
2. controlla diff;
3. controlla test e CI;
4. approva oppure prepara un fix.

Finché esiste un fix, si ripetono Fase 3 e Fase 4 sullo stesso branch.

## Fase 5 — Collaudo locale

Dopo `APPROVATO STATICAMENTE`, il Collaudatore:

1. fa checkout del branch;
2. verifica lo SHA;
3. avvia l’app;
4. esegue il piano browser;
5. restituisce il report;
6. non modifica codice.

## Fase 6 — Correzione browser

Quando il collaudo trova un difetto:

1. la Chat Amministratore verifica il finding;
2. scrive un prompt correttivo;
3. l’Esecutore prepara il fix per lo stesso branch;
4. l’utente applica il fix, crea un nuovo commit e pusha;
5. la Chat Amministratore revisiona il nuovo SHA;
6. il Collaudatore ripete il test sul nuovo SHA.

## Fase 7 — Aggiornamento del piano

Dopo `APPROVATO FINALE`, la Chat Amministratore prepara un prompt documentale.

La Chat Esecutore prepara l’aggiornamento del solo file:

```txt
docs/implementazioni.md
```

salvo altri file documentali esplicitamente autorizzati.

L’aggiornamento deve:

- rimuovere o ridurre il lavoro concluso;
- aggiornare dipendenze e priorità;
- mantenere i finding ancora aperti;
- non aggiungere una cronologia estesa;
- non dichiarare concluso ciò che non è stato collaudato.

L’utente applica l’aggiornamento e pusha il commit documentale nello stesso branch.

## Fase 8 — Revisione finale e merge

La Chat Amministratore verifica:

- branch finale;
- diff finale;
- commit successivi al QA;
- PR;
- CI;
- aggiornamento del piano;
- assenza di modifiche runtime dopo lo SHA collaudato.

Poi comunica:

```txt
PR PRONTA AL MERGE
```

Il merge avviene soltanto dopo autorizzazione esplicita dell’utente.

## Fase 9 — Chiusura

Dopo il merge:

- aggiornare localmente `main`;
- eliminare il branch soltanto quando autorizzato;
- iniziare la task successiva da `main` aggiornato;
- non riutilizzare il branch precedente.

---

# 8. Stati ufficiali

## Stato della task

```txt
DA ANALIZZARE
IN ATTESA DI REQUISITI
PRONTA PER PROMPT
IN ESECUZIONE
IN REVISIONE STATICA
FIX NECESSARIO
APPROVATA STATICAMENTE
IN COLLAUDO
COLLAUDO BLOCCATO
APPROVATA FINALE
PRONTA AL MERGE
MERGED
```

## Stato della pull request

```txt
DRAFT
READY FOR REVIEW
CHANGES REQUESTED
APPROVED
MERGED
CLOSED
```

Una task non è `MERGED` soltanto perché la PR è stata creata o perché il branch è stato pushato.

---

# 9. Regole GitHub

## 9.1 Branch base

Il branch base predefinito è:

```txt
main
```

Usare un branch base diverso soltanto quando la Chat Amministratore lo indica esplicitamente.

## 9.2 Force push

Il force push è vietato.

Eccezioni richiedono:

- autorizzazione esplicita dell’utente;
- motivazione;
- conferma che nessun’altra chat usa il branch;
- backup remoto tramite ref o tag quando necessario.

## 9.3 Merge

Il merge è vietato a tutte le chat fino all’autorizzazione dell’utente.

Metodo preferito:

```txt
squash
```

oppure il metodo deciso dall’utente per il repository.

Prima del merge verificare:

- PR non draft;
- CI valida;
- nessun finding bloccante;
- branch aggiornato;
- nessun conflitto;
- piano operativo aggiornato.

## 9.4 Conflitti

Se il branch base avanza:

- l’Esecutore non risolve conflitti inventando decisioni;
- la Chat Amministratore valuta l’impatto;
- viene emesso un prompt specifico;
- i test e il collaudo vengono ripetuti quando cambia codice runtime.

## 9.5 File generati e segreti

Non committare:

- `.env`;
- token;
- password;
- credenziali;
- file temporanei;
- output build;
- cache;
- log locali;
- dump;
- screenshot non richiesti;
- `node_modules`;
- file di collaudo non destinati al repository.

`package-lock.json` si modifica soltanto quando la task modifica realmente le dipendenze.

## 9.6 `fileModificati.md`

Nel flusso GitHub ordinario, branch, commit e diff remota sostituiscono `fileModificati.md`.

Quindi:

- non generarlo per ogni task;
- non committarlo;
- non usarlo come fonte principale;
- generarlo soltanto quando la Chat Amministratore lo richiede esplicitamente come fallback;
- usarlo se GitHub non è temporaneamente accessibile o se serve analizzare una modifica locale non pushata.

---

# 10. Pull request

## 10.1 Titolo

Formato:

```txt
[TASK A1] Repository edifici account-scoped
[TASK D2] Correzione stato rate con addebito
[TASK F1] Guard condiviso modifiche non salvate
```

## 10.2 Descrizione minima

```md
## Obiettivo

<obiettivo unico>

## Modifiche

- ...
- ...

## Test

- comando:
- esito:
- exit code:

## Non modificato

- ...
- ...

## Collaudo

- non ancora eseguito / SHA collaudato
- esito

## Stato

DRAFT — non fare merge
```

## 10.3 Draft

La PR viene creata draft salvo istruzione diversa.

Diventa pronta soltanto dopo:

- revisione statica;
- collaudo;
- fix conclusi;
- aggiornamento `docs/implementazioni.md`;
- controllo finale.

---

# 11. Handoff tra chat

## 11.1 Dalla Chat Amministratore all’Esecutore

Trasferire:

```txt
ID task
Prompt completo
Repository
Branch base
Nome branch
File autorizzati
Test
Divieti
```

## 11.2 Dall’Esecutore all’utente

Trasferire:

```txt
File completi o patch
Posizione esatta di ogni modifica
Tutorial di applicazione
Comandi di test
Branch suggerito
Commit suggerito
Draft PR suggerita
Report
```

## 11.3 Dall’utente alla Chat Amministratore

Trasferire:

```txt
Repository
Branch
SHA
PR
Report
```

## 11.4 Dalla Chat Amministratore al Collaudatore

Trasferire:

```txt
Repository
Branch
SHA approvato staticamente
URL e comando di avvio
Account/dati di test
Piano di collaudo
Stato finale richiesto
Divieti
```

## 11.5 Dal Collaudatore alla Chat Amministratore

Trasferire:

```txt
Repository
Branch
SHA collaudato
Report browser
Finding
Working tree iniziale/finale
Dati finali
```

---

# 12. Template iniziali delle tre chat

## 12.1 Chat Amministratore / Analista

```txt
Ruolo permanente: Amministratore e Analista del progetto Props24.

Leggi il repository GitHub e docs/implementazioni.md.
Non modificare codice, non creare branch, commit, push o merge.
Non eseguire il collaudo browser.

Per ogni richiesta:
1. verifica lo stato corrente;
2. chiedi requisiti o file mancanti;
3. scomponi il lavoro;
4. prepara un solo prompt esecutivo;
5. revisiona branch, commit e report;
6. autorizza il collaudo soltanto dopo revisione statica;
7. valuta il collaudo;
8. indica quando la PR è pronta al merge.

Non cambiare ruolo durante la conversazione.
```

## 12.2 Chat Esecutore / Preparatore delle modifiche

```txt
Ruolo permanente: Esecutore e preparatore delle modifiche del progetto Props24.

Esegui soltanto prompt approvati dalla Chat Amministratore.
Puoi preparare modifiche ai file autorizzati ed eseguire test in un ambiente locale.
Devi consegnare all’utente file completi o patch, posizioni esatte, comandi di test
e un tutorial per creare branch, commit, push e draft PR.

Non eseguire scritture sul repository GitHub.
Non creare branch, commit, tag o pull request.
Non eseguire push, force push, rebase o merge.
L’applicazione delle modifiche e tutte le operazioni Git/GitHub di scrittura
spettano esclusivamente all’utente.

Non decidere requisiti.
Non ampliare lo scope.
Non modificare main.
Non approvare il tuo lavoro.
Non eseguire il collaudo browser.
Non aggiornare docs/implementazioni.md senza un prompt esplicito successivo
all’approvazione finale.

Fai massimo 3 tentativi ragionati. Dopo il terzo tentativo fermati e riporta
log, file modificati, comandi eseguiti, errori e cosa resta da capire.

Non cambiare ruolo durante la conversazione.
```

## 12.3 ChatGPT Desktop / Collaudatore

```txt
Ruolo permanente: Collaudatore browser del progetto Props24.

Esegui il collaudo sul branch e SHA indicati dalla Chat Amministratore.
Puoi avviare l’app, usare il browser e creare dati di test autorizzati.

Non modificare codice.
Non creare commit.
Non fare push.
Non aprire PR.
Non correggere i difetti.
Non fare merge.
Non manipolare database o stato applicativo tramite console.

Fai massimo 3 tentativi ragionati. Dopo il terzo tentativo fermati e riporta
log, dati di test creati, passaggi eseguiti, errori e cosa resta da capire.

Non cambiare ruolo durante la conversazione.
```

---

# 13. Checklist della Chat Amministratore

Prima del prompt:

```txt
[ ] Requisiti chiari
[ ] Repository identificato
[ ] Branch base identificato
[ ] Codice corrente letto
[ ] docs/implementazioni.md letto
[ ] Un solo obiettivo
[ ] File autorizzati minimi
[ ] Test definiti
[ ] Browser QA definito o dichiarato non necessario
[ ] Nessuna decisione inventata
```

Prima del collaudo:

```txt
[ ] Branch remoto disponibile
[ ] SHA disponibile
[ ] Diff completa revisionata
[ ] Nessun file fuori scope
[ ] Test tecnici passati o limiti dichiarati
[ ] CI controllata quando disponibile
[ ] Nessun merge
```

Prima del merge:

```txt
[ ] Revisione statica approvata
[ ] SHA collaudato registrato
[ ] Collaudo approvato
[ ] Nessun finding bloccante
[ ] Eventuali commit successivi al QA esclusivamente documentali
[ ] docs/implementazioni.md aggiornato
[ ] PR pronta
[ ] CI valida
[ ] Autorizzazione esplicita dell’utente
```

---

# 14. Checklist dell’Esecutore

```txt
[ ] Prompt approvato
[ ] Branch base e stato remoto verificati in lettura
[ ] Solo file autorizzati preparati
[ ] Nessuna dipendenza non richiesta
[ ] Test eseguiti
[ ] Massimo tre tentativi
[ ] File completi o patch consegnati
[ ] Posizioni di modifica precise
[ ] Tutorial applicativo completo
[ ] Branch e commit suggeriti
[ ] Draft PR preparata quando richiesta
[ ] SHA richiesto all’utente dopo il push
[ ] Nessun force push
[ ] Nessun merge
[ ] Nessuna scrittura GitHub eseguita dalla chat
```

---

# 15. Checklist del Collaudatore

```txt
[ ] Branch corretto
[ ] SHA corretto
[ ] Working tree iniziale registrato
[ ] Ambiente registrato
[ ] Dati di test isolati
[ ] Passaggi reali da UI
[ ] Nessuna manipolazione da console
[ ] Reload e persistenza verificati
[ ] Console verificata
[ ] Stato finale ripristinato
[ ] Working tree finale registrato
[ ] Finding completi
[ ] Nessuna modifica di codice
[ ] Nessun commit, push o merge
```

---

# 16. Gestione delle eccezioni

## GitHub non disponibile

Quando GitHub non è accessibile:

- non procedere sulla base di file parziali;
- l’utente può fornire ZIP o Repomix come fallback;
- ogni conclusione deve essere riesaminata su GitHub prima del merge.

## Collaudo non automatizzabile

Quando ChatGPT Desktop non riesce a controllare:

- file picker;
- download;
- stampa;
- selettori nativi;
- finestre esterne;

il report deve distinguere:

```txt
PASS
FAIL
BLOCCATO STRUMENTALMENTE
NON CONFERMATO
```

Una limitazione strumentale non diventa automaticamente un difetto.

## Modifica urgente

Anche una modifica urgente mantiene almeno:

- branch separato;
- prompt ristretto;
- revisione statica;
- test;
- autorizzazione al merge.

L’urgenza non autorizza commit diretti su `main`.

## Task esclusivamente documentale

Una task documentale:

- usa un branch dedicato;
- modifica soltanto i documenti autorizzati;
- non richiede browser QA salvo impatto su un sito di documentazione;
- richiede comunque revisione della diff;
- non viene fusa senza autorizzazione.

---

# 17. Flusso sintetico

```txt
UTENTE
  ↓ requisiti e autorizzazione

CHAT AMMINISTRATORE
  ↓ analisi e prompt

CHAT ESECUTORE
  ↓ prepara file/patch → test possibili → tutorial applicativo

UTENTE
  ↓ applica modifiche → branch → test → commit → push → draft PR

CHAT AMMINISTRATORE
  ↓ revisione statica
  ├─ FIX → Chat Esecutore
  └─ APPROVATO STATICAMENTE

CHATGPT DESKTOP
  ↓ collaudo sullo SHA approvato
  ├─ FAIL → Chat Amministratore → prompt fix → Chat Esecutore
  └─ PASS

CHAT AMMINISTRATORE
  ↓ prompt aggiornamento piano

CHAT ESECUTORE
  ↓ prepara aggiornamento docs/implementazioni.md

UTENTE
  ↓ applica aggiornamento → commit → push

CHAT AMMINISTRATORE
  ↓ revisione finale

UTENTE
  ↓ autorizzazione

MERGE IN MAIN
```

---

# 18. Regola conclusiva

Nessuna fase sostituisce la successiva:

- il test tecnico non sostituisce la revisione;
- la revisione statica non sostituisce il collaudo;
- il collaudo non sostituisce il controllo finale della diff;
- il push non equivale ad approvazione;
- la PR non equivale a merge;
- il merge non avviene senza l’utente.

Quando una chat riceve una richiesta appartenente a un altro ruolo, deve fermarsi e indicare il passaggio corretto, senza eseguire il lavoro al posto dell’altra chat.
