# Props24 — Ruoli e flusso operativo con Chat Analisi e ChatGPT Desktop

## Scopo

Questo documento definisce il flusso operativo permanente di Props24. I ruoli sono separati, una task resta circoscritta a un solo obiettivo e la pubblicazione avviene soltanto dopo la revisione richiesta.

I ruoli sono:

1. **Chat Analisi / Amministratore**;
2. **ChatGPT Desktop / Esecutore locale**, in modalità `DESKTOP_ESECUTORE`;
3. **ChatGPT Desktop / Collaudatore locale**, in modalità `DESKTOP_COLLAUDATORE`.

L’utente è proprietario delle operazioni Git di scrittura ed è l’unico che esegue materialmente commit e push.

## Principi obbligatori

- una task per volta e scope minimo verificabile;
- nessuna modifica fuori scope o refactor non richiesto;
- ruoli separati: nessun soggetto approva il proprio lavoro;
- Desktop non cambia ruolo durante lo stesso prompt;
- test e controlli reali, con risultati ed exit code;
- massimo tre tentativi ragionati;
- nessuna credenziale, file generato inutile o artefatto temporaneo nel commit;
- nessun commit o push intermedio;
- revisione delle modifiche locali tramite `fileModificati.md`;
- collaudo browser soltanto quando richiesto con un prompt separato;
- pubblicazione finale su `main` eseguita esclusivamente dall’utente.

## Precedenza delle fonti

In caso di conflitto si applica questo ordine:

1. decisione esplicita più recente dell’utente;
2. stato locale autorizzato della task, formato dallo SHA base e dalla diff corrente del working tree;
3. test e controlli eseguiti sullo stesso stato locale;
4. documentazione tecnica owner aggiornata;
5. `docs/planning/implementazioni.md`;
6. vecchi report, prompt, conversazioni, ZIP o Repomix.

Un documento vecchio non prevale sul codice o sui file correnti. `fileModificati.md` rappresenta lo stato locale da revisionare, ma non sostituisce i file reali. In presenza di conflitti non si inventano decisioni: una decisione mancante che cambia comportamento, dati o risultato deve tornare alla Chat Analisi.

## 1. Chat Analisi / Amministratore

### Responsabilità

La Chat Analisi:

- discute i requisiti con l’utente;
- legge GitHub quando serve verificare lo stato condiviso;
- legge la documentazione metodologica e `docs/planning/implementazioni.md`;
- individua una sola task, ne decide lo scope e sceglie la modalità Desktop;
- prepara un prompt esecutivo completo;
- dopo il lavoro dell’Esecutore legge `fileModificati.md` e il report Desktop;
- verifica file, contenuto, test, warning e rispetto dello scope;
- richiede eventuali fix e ripete la revisione sull’intero stato locale della task;
- decide se è necessario il collaudo e prepara il prompt del Collaudatore;
- valuta finding e report del collaudo;
- dichiara la task approvata o da correggere;
- soltanto alla fine fornisce all’utente i comandi Git per eliminare l’artefatto temporaneo, verificare la diff, creare il commit e fare push su `main`.
- verifica che il prompt ammetta domande soltanto davanti a un blocco tecnico oggettivo e che l’eventuale domanda sia unica, breve, specifica e basata su evidenze reali.

La Chat Analisi non:

- modifica direttamente i file locali;
- esegue il collaudo browser al posto di Desktop;
- approva senza leggere integralmente le modifiche;
- anticipa i comandi finali di commit e push;
- amplia lo scope senza una decisione esplicita.

## 2. ChatGPT Desktop / Esecutore locale

La modalità obbligatoria è:

```text
DESKTOP_ESECUTORE
```

L’Esecutore:

- inizia immediatamente, svolge internamente verifiche e ragionamenti e non espone piani, ipotesi o ragionamenti;
- lavora direttamente sulla copia locale;
- legge il prompt approvato;
- verifica branch, SHA e working tree con comandi Git in sola lettura;
- legge i file autorizzati e modifica esclusivamente quelli indicati;
- esegue i controlli tecnici richiesti;
- crea o sovrascrive `fileModificati.md`;
- produce il report finale e si ferma in attesa della revisione della Chat Analisi.

L’Esecutore non:

- decide o modifica i requisiti;
- modifica file fuori scope;
- esegue fetch, pull o cambi di branch;
- esegue `git add`, commit, push, merge o altre scritture Git;
- apre pull request o modifica GitHub;
- integra modifiche in `main`;
- approva il proprio lavoro;
- esegue collaudo browser nello stesso prompt.

L’Esecutore non chiede conferme già risolte e non presenta scelte tecniche equivalenti. Può porre una sola domanda, breve, specifica e basata sull’errore o sull’evidenza reale, soltanto davanti a un blocco tecnico oggettivo:

- file obbligatorio realmente assente;
- branch o SHA incompatibile con la task;
- modifiche preesistenti che impediscono di isolare lo scope;
- anchor indispensabile non trovata;
- due istruzioni obbligatorie incompatibili;
- decisione di prodotto mancante che cambia comportamento, dati o risultato;
- strumento indispensabile non disponibile e privo di alternativa autorizzata;
- errore ancora bloccante dopo tre tentativi.

Non sono blocchi le informazioni recuperabili dai file autorizzati, la scelta tra metodi tecnici equivalenti, il nome di un artefatto temporaneo, i controlli da eseguire, un dubbio risolvibile dal codice corrente o una preferenza personale dell’Esecutore.

## 3. ChatGPT Desktop / Collaudatore locale

La modalità obbligatoria è:

```text
DESKTOP_COLLAUDATORE
```

Il Collaudatore:

- viene usato soltanto su richiesta della Chat Analisi e riceve un prompt separato;
- verifica lo stato locale indicato;
- avvia l’applicazione ed esegue il piano di collaudo;
- controlla UI, dati osservabili, persistenza, reload, console e stato finale;
- produce finding numerati, matrice `PASS / FAIL / BLOCCATO` e report;
- non modifica codice o documentazione;
- non corregge i difetti;
- non crea `fileModificati.md`;
- non esegue commit o push.

Quando il test riguarda un comportamento utente, il Collaudatore usa interazioni reali dall’interfaccia. Può leggere la console per verificare errori, ma non usarla per produrre artificialmente lo stato da collaudare.

Il Collaudatore non deve:

- modificare il database tramite console o strumenti esterni non previsti dal piano;
- usare React DevTools per alterare lo stato;
- usare `dispatchEvent` o manipolazioni DOM per forzare risultati;
- modificare manualmente storage o stato applicativo per simulare un PASS, salvo preparazione iniziale esplicitamente richiesta dal piano;
- dichiarare PASS quando l’azione reale dell’utente non ha prodotto il risultato;
- confondere una limitazione strumentale con un difetto applicativo;
- proseguire dopo una perdita critica o irreversibile di dati senza fermarsi e documentarla;
- superare tre tentativi.

Un difetto rilevato torna alla Chat Analisi. L’eventuale correzione richiede un nuovo prompt `DESKTOP_ESECUTORE`; l’eventuale ricollaudo richiede poi un nuovo prompt `DESKTOP_COLLAUDATORE`.

Ogni finding contiene:

```text
ID
Severità
Scenario
Stato iniziale
Passaggi eseguiti
Risultato atteso
Risultato reale
Evidenza
Console
Reload e persistenza
Impatto
Stato finale dei dati
Limitazioni strumentali
```

Il Collaudatore descrive il comportamento osservato e non propone automaticamente una modifica tecnica. La Chat Analisi valuta ogni finding come:

```text
CONFERMATO
NON CONFERMATO
LIMITAZIONE STRUMENTALE
DA DIAGNOSTICARE
```

## 4. Flusso operativo

### Fase 1 — Analisi

La Chat Analisi verifica lo stato corrente, chiarisce i requisiti, delimita una task, sceglie `DESKTOP_ESECUTORE` e prepara il prompt.

### Fase 2 — Preparazione locale

L’utente porta localmente `main` allo stato corretto, apre ChatGPT Desktop sul progetto e consegna il prompt. Desktop non sincronizza GitHub autonomamente.

### Fase 3 — Esecuzione locale

Desktop Esecutore:

1. verifica branch, SHA e working tree;
2. legge i file autorizzati;
3. modifica direttamente i file;
4. esegue i controlli tecnici;
5. crea o sovrascrive `fileModificati.md`;
6. restituisce il report;
7. si ferma.

Non crea commit e non esegue push.

### Fase 4 — Revisione locale

L’utente allega alla Chat Analisi `fileModificati.md` e il report Desktop. La Chat Analisi controlla integralmente file, diff, rinomine, scope, test e warning.

Se serve un fix:

1. la Chat Analisi prepara un nuovo prompt `DESKTOP_ESECUTORE`;
2. Desktop applica soltanto la correzione richiesta;
3. Desktop sovrascrive `fileModificati.md` e produce un nuovo report;
4. la Chat Analisi revisiona di nuovo l’intero stato locale della task.

### Fase 5 — Collaudo quando necessario

Il collaudo è normalmente richiesto se la task cambia comportamento UI, persistenza, routing, CRUD, dati osservabili, interazioni browser o stato runtime. Le task esclusivamente documentali normalmente non richiedono collaudo browser.

Il Collaudatore opera sulla stessa copia locale già modificata. Se trova un difetto, lo segnala senza correggerlo; il ciclo torna alla Chat Analisi e, se autorizzato, a un nuovo prompt Esecutore.

### Fase 6 — Chiusura e pubblicazione

Soltanto dopo revisione positiva di `fileModificati.md`, controlli tecnici positivi, eventuale collaudo positivo e assenza di finding bloccanti, la Chat Analisi fornisce all’utente i comandi per:

1. eliminare `fileModificati.md`;
2. verificare la diff;
3. aggiungere allo staging soltanto i file approvati;
4. creare il commit;
5. eseguire il push finale su `main`.

Desktop non anticipa questi comandi. Un branch separato o una pull request sono eccezioni utilizzabili soltanto su richiesta esplicita dell’utente o della Chat Analisi.

## 5. Regola di `fileModificati.md`

### Quando è obbligatorio

`fileModificati.md` è obbligatorio per ogni prompt `DESKTOP_ESECUTORE`: dopo la prima modifica, dopo ogni prompt correttivo e dopo ogni variazione che deve essere riesaminata. Deve essere sovrascritto, non accumulato.

### Quando non è richiesto

Non è richiesto in modalità `DESKTOP_COLLAUDATORE`, perché il Collaudatore non modifica file, né per analisi esclusivamente read-only senza modifiche locali.

### Scopo e posizione

L’artefatto consente alla Chat Analisi di revisionare le modifiche locali senza commit o push intermedi. Non sostituisce il report Desktop, non è documentazione del progetto e non deve essere pubblicato. Va creato nella root:

```text
fileModificati.md
```

### Contenuto obbligatorio

Deve contenere:

- ID, titolo e modalità della task;
- repository, branch locale, SHA base, data e ora locale;
- output di `git status --short`;
- file rinominati, modificati, creati ed eliminati;
- comandi, exit code e risultati dei controlli;
- statistiche della diff, integrate con i file nuovi non tracciati;
- output completo e senza colori di `git diff --find-renames`;
- contenuto completo dei file nuovi o rinominati non visibili integralmente nella diff;
- warning, limiti e conferme su scope, commit e push.

Deve mostrare integralmente modifiche, rinomine, eliminazioni e file nuovi. Non deve includere sé stesso tra i file della task.

Resta locale fino alla conclusione della revisione. Viene eliminato soltanto dopo l’approvazione della Chat Analisi e non deve mai essere aggiunto allo staging o incluso nel commit.

## 6. Regole Git e GitHub per Desktop

Desktop può eseguire soltanto operazioni Git in sola lettura, per esempio:

```bash
git branch --show-current
git rev-parse HEAD
git status --short
git diff
git diff --check
git diff --stat
git diff --name-only
git diff --name-status
git grep
```

Desktop non deve eseguire comandi equivalenti a:

```bash
git fetch
git pull
git switch
git checkout
git add
git commit
git push
git merge
git rebase
git reset
git clean
git stash
git tag
git cherry-pick
```

Non crea o modifica pull request. La pubblicazione ordinaria avviene una sola volta: l’utente, dopo l’approvazione della Chat Analisi, esegue commit e push su `main`.

## 7. Stati ufficiali

```text
DA ANALIZZARE
IN ATTESA DI REQUISITI
PRONTA PER PROMPT
IN ESECUZIONE LOCALE
IN REVISIONE LOCALE
FIX NECESSARIO
APPROVATA STATICAMENTE
IN COLLAUDO
COLLAUDO BLOCCATO
APPROVATA FINALE
PRONTA PER COMMIT
PUBBLICATA SU MAIN
```

Una pull request non ha una macchina a stati obbligatoria, perché non fa parte del flusso ordinario.

## 8. Checklist di chiusura

- una sola task e nessun file fuori scope;
- controlli tecnici eseguiti e risultati registrati;
- `fileModificati.md` completo e revisionato;
- eventuali fix nuovamente revisionati;
- eventuale collaudo concluso senza finding bloccanti;
- nessuna credenziale o file generato destinato al commit;
- `docs/planning/implementazioni.md` aggiornato soltanto se autorizzato dal prompt;
- nessun commit o push eseguito da Desktop;
- pubblicazione finale riservata all’utente.
- prompt Esecutore avviabile senza domande, salvo un blocco tecnico oggettivo documentato.

## 9. Massimo tre tentativi

Ogni ruolo operativo può fare al massimo tre tentativi ragionati. Ogni tentativo parte dall’errore reale, identifica una causa plausibile, applica la correzione minima autorizzata e ripete il controllo pertinente.

Dopo il terzo fallimento deve fermarsi, non ampliare lo scope e riportare errore, file coinvolti, log utili e blocco reale.
