# Props24 — Regole per costruire prompt esecutivi

## Scopo

Questo documento stabilisce come la Chat Analisi costruisce prompt completi per ChatGPT Desktop. Ogni prompt deve scegliere un solo ruolo:

```text
DESKTOP_ESECUTORE
DESKTOP_COLLAUDATORE
```

La stessa esecuzione non può cumulare o cambiare ruolo. `GITHUB_READ_ONLY` può essere usata dalla Chat Analisi per una revisione remota, ma non è una modalità Desktop di modifica.

## Precedenza delle fonti

Prevalgono, nell’ordine: decisione esplicita più recente dell’utente; stato locale autorizzato composto da SHA base e diff corrente; test e controlli sullo stesso stato; documentazione tecnica owner aggiornata; `docs/planning/implementazioni.md`; vecchi report, prompt, conversazioni, ZIP o Repomix.

Un documento vecchio non prevale sui file correnti. `fileModificati.md` rappresenta lo stato da revisionare ma non sostituisce i file reali. I conflitti non autorizzano decisioni inventate: una decisione mancante che cambia comportamento, dati o risultato torna alla Chat Analisi.

## 1. Decisione della modalità

- task che crea, modifica, rinomina o elimina file → `DESKTOP_ESECUTORE`;
- test browser indipendente → `DESKTOP_COLLAUDATORE`;
- fix dopo un collaudo → nuovo prompt `DESKTOP_ESECUTORE`;
- nuovo collaudo dopo un fix → nuovo prompt `DESKTOP_COLLAUDATORE`;
- analisi senza modifiche locali → attività read-only della Chat Analisi.

La Chat Analisi decide la modalità prima di consegnare il prompt.

## 2. Regole comuni

Ogni prompt deve:

- indicare ID, titolo, obiettivo unico e modalità;
- delimitare file, area e azioni autorizzate;
- distinguere file modificabili da file consultabili;
- indicare root locale, branch e SHA attesi;
- prescrivere controlli riproducibili e relativo report;
- vietare modifiche fuori scope e refactor opportunistici;
- fissare il massimo di tre tentativi ragionati;
- ordinare l’avvio immediato;
- richiedere soltanto comunicazioni su modifiche, controlli, risultati, errori e blocchi reali.

Ogni prompt deve vietare preamboli, piani, ragionamenti esposti, alternative non richieste, domande già risolte, approvazione autonoma e operazioni Git/GitHub di scrittura.

Desktop Esecutore inizia immediatamente, svolge internamente verifiche e ragionamenti, non espone piani, ipotesi o ragionamenti e non presenta scelte tecniche equivalenti. Può formulare una sola domanda, breve, specifica e basata su evidenze, soltanto davanti a un blocco tecnico oggettivo: file obbligatorio assente; branch o SHA incompatibile; modifiche preesistenti che impediscono di isolare lo scope; anchor indispensabile assente; istruzioni obbligatorie incompatibili; decisione di prodotto mancante che cambia il risultato; strumento indispensabile indisponibile senza alternativa; errore bloccante dopo tre tentativi.

Non sono blocchi le informazioni recuperabili dai file autorizzati, la scelta fra metodi equivalenti, il nome di un artefatto temporaneo, la necessità di controlli, un dubbio risolvibile dal codice o una preferenza personale.

## 3. Template `DESKTOP_ESECUTORE`

````markdown
# TASK <ID> — <titolo>

## Modalità obbligatoria

```text
DESKTOP_ESECUTORE
```

Agisci esclusivamente come ChatGPT Desktop / Esecutore locale. Avvia immediatamente la task.

Non presentare preamboli, piani o ragionamenti; non discutere il requisito; non chiedere conferme già contenute nel prompt; non approvare il tuo lavoro; non eseguire collaudo browser.

Svolgi internamente verifiche e ragionamenti e non presentare scelte tecniche equivalenti. Puoi porre una sola domanda, breve, specifica e basata su evidenze reali, soltanto davanti a un blocco tecnico oggettivo: file obbligatorio assente; branch o SHA incompatibile; modifiche preesistenti che impediscono lo scope; anchor indispensabile assente; istruzioni obbligatorie incompatibili; decisione di prodotto mancante che cambia il risultato; strumento indispensabile indisponibile senza alternativa; errore bloccante dopo tre tentativi. Informazioni recuperabili, scelte tecniche equivalenti, controlli da eseguire e dubbi risolvibili dai file non sono blocchi.

## Obiettivo unico

<risultato verificabile>

## Stato locale atteso

- repository: <owner/repository>
- root locale: <percorso>
- branch locale atteso: <branch>
- SHA base atteso: <SHA>

Prima di modificare esegui soltanto:

```bash
git branch --show-current
git rev-parse HEAD
git status --short
```

Non sincronizzare GitHub e non cambiare branch.

## File modificabili

- <percorso>

## File consultabili in sola lettura

- <percorso>

## File da non modificare

- <percorso o glob>

## Comportamento richiesto

1. <azione>
2. <azione>

## Contratti da preservare

- <contratto>

## Controlli tecnici

```bash
<comando>
```

Registra comando, exit code e risultato. Non eseguire test esclusi dal prompt.

## `fileModificati.md`

Dopo le modifiche crea o sovrascrivi obbligatoriamente `fileModificati.md` nella root. Includi stato iniziale, working tree, file coinvolti, controlli, statistiche, diff completa senza colori, contenuto completo dei file nuovi o rinominati non visibili integralmente nella diff, warning e conferme.

Non includere `fileModificati.md` tra i file della task, nello staging o nel commit.

## Git e GitHub

Sono consentiti soltanto comandi Git in sola lettura. Sono vietati fetch, pull, switch, checkout, add, commit, push, merge, rebase, reset, clean, stash, tag, cherry-pick e comandi equivalenti.

Non modificare GitHub, non aprire pull request e non integrare in `main`.

## Gestione dei fallimenti

Fai massimo tre tentativi ragionati. Ogni tentativo parte dall’errore reale, applica la correzione minima autorizzata e ripete il controllo pertinente. Dopo il terzo fallimento fermati e riporta il blocco reale.

## Report finale

Riporta:

- esito e modalità;
- repository, root, branch e SHA base;
- file letti, rinominati, modificati, creati ed eliminati;
- riepilogo modifiche;
- comandi, controlli ed exit code;
- tentativi utilizzati;
- warning, limiti e working tree;
- percorso di `fileModificati.md`;
- commit eseguito: no;
- push eseguito: no;
- GitHub modificato: no;
- collaudo browser eseguito: no;
- stato: pronto per la revisione della Chat Analisi.
````

### Requisiti inderogabili dell’Esecutore

Il prompt deve sempre specificare:

- ID e titolo task;
- modalità `DESKTOP_ESECUTORE`;
- obiettivo unico;
- root, branch locale e SHA base;
- file modificabili e consultabili;
- comportamento e contratti da preservare;
- file esclusi;
- controlli tecnici;
- massimo tre tentativi;
- creazione obbligatoria di `fileModificati.md`;
- report finale;
- divieto di commit, push, GitHub e collaudo browser.

## 4. Template `DESKTOP_COLLAUDATORE`

````markdown
# COLLAUDO <ID> — <titolo>

## Modalità obbligatoria

```text
DESKTOP_COLLAUDATORE
```

Agisci esclusivamente come ChatGPT Desktop / Collaudatore locale. Avvia immediatamente il collaudo. Non cambiare ruolo durante il prompt.

## Stato locale da verificare

- root locale: <percorso>
- branch locale atteso: <branch>
- SHA base atteso: <SHA>

Verifica branch, SHA e working tree con soli comandi Git in lettura.

## Area da collaudare

<area e confini>

## Ambiente

- comando di avvio: <comando>
- URL: <URL>
- browser: <browser>
- account e dati di test: <dati>
- stato iniziale: <stato>

## Passaggi e risultati attesi

1. <passaggio>
   - atteso: <risultato>

## Controlli obbligatori

- UI e dati osservabili;
- console;
- reload e persistenza;
- stato finale richiesto: <stato>;
- working tree finale.

## Finding e matrice

Registra finding numerati con: ID, Severità, Scenario, Stato iniziale, Passaggi eseguiti, Risultato atteso, Risultato reale, Evidenza, Console, Reload e persistenza, Impatto, Stato finale dei dati e Limitazioni strumentali. Descrivi il comportamento osservato senza proporre automaticamente una modifica tecnica. Produci una matrice `PASS / FAIL / BLOCCATO`.

La Chat Analisi valuterà ogni finding come `CONFERMATO`, `NON CONFERMATO`, `LIMITAZIONE STRUMENTALE` oppure `DA DIAGNOSTICARE`.

## Divieti

Non modificare codice o documentazione e non correggere direttamente difetti. Non modificare il database tramite console o strumenti esterni non previsti dal piano. Non usare React DevTools per alterare lo stato, `dispatchEvent` o manipolazioni DOM per forzare risultati. Non modificare manualmente storage o stato applicativo per simulare un PASS, salvo preparazione iniziale richiesta esplicitamente dal piano. Non dichiarare PASS se l’azione reale dell’utente non produce il risultato e non confondere una limitazione strumentale con un difetto applicativo. Dopo una perdita critica o irreversibile di dati fermati e documentala. Non superare tre tentativi. Non creare `fileModificati.md`. Non eseguire commit, push o altre scritture Git/GitHub.

Quando il test riguarda un comportamento utente, usa interazioni reali dall’interfaccia. La console può essere letta per verificare errori, ma non usata per produrre artificialmente lo stato da collaudare.

## Gestione dei fallimenti

Fai massimo tre tentativi ragionati. Dopo il terzo fallimento fermati e riporta log, dati, passaggi, errore e blocco reale.

## Report finale

Riporta ID, modalità, root, branch, SHA, comando, URL, browser, account e dati, stato iniziale, passaggi, atteso e reale, console, reload e persistenza, stato finale, finding, matrice, tentativi, limiti e working tree.
````

### Requisiti inderogabili del Collaudatore

Il prompt deve sempre specificare:

- ID e modalità `DESKTOP_COLLAUDATORE`;
- root, branch e SHA base;
- area da collaudare;
- comando di avvio, URL e browser;
- account, dati e stato iniziale;
- passaggi e risultati attesi;
- controlli console, reload e persistenza;
- stato finale;
- finding e matrice `PASS / FAIL / BLOCCATO`;
- massimo tre tentativi;
- divieto di modificare file;
- divieto di creare `fileModificati.md`;
- report finale.

## 5. Regola completa di `fileModificati.md`

È obbligatorio dopo ogni esecuzione `DESKTOP_ESECUTORE`, compresi i prompt correttivi e ogni variazione da riesaminare. Deve essere sovrascritto.

Non è richiesto per `DESKTOP_COLLAUDATORE` o per analisi read-only senza modifiche. Serve alla revisione locale della Chat Analisi, non sostituisce il report, non è documentazione e non deve essere pubblicato.

Il file va creato nella root con questa struttura minima:

````markdown
# Props24 — File modificati per revisione

## Task

- ID:
- titolo:
- modalità: DESKTOP_ESECUTORE

## Stato di partenza

- repository:
- branch locale:
- SHA base:
- data e ora locale:

## Working tree

```text
<output di git status --short>
```

## File coinvolti

### Rinominati

- vecchio percorso → nuovo percorso

### Modificati

- percorso

### Creati

- percorso

### Eliminati

- percorso

## Controlli eseguiti

- comando:
- exit code:
- risultato:

## Statistiche

```text
<output di git diff --stat, integrato con i file nuovi non tracciati>
```

## Diff dei file tracciati

```diff
<output completo e senza colori di git diff --find-renames>
```

## Contenuto completo dei file nuovi o rinominati non presenti nella diff

### `percorso/file`

```text
<contenuto completo>
```

## Warning e limiti

- ...

## Conferme

- file fuori scope modificati: sì/no
- commit eseguito: no
- push eseguito: no
- fileModificati.md destinato al commit: no
````

L’artefatto deve includere abbastanza contenuto per vedere integralmente modifiche, rinomine, eliminazioni, file nuovi e controlli. Non deve includere sé stesso tra i file della task. Resta locale fino all’approvazione della Chat Analisi.

## 6. Controllo del prompt prima della consegna

La Chat Analisi verifica che:

- sia selezionata una sola modalità;
- obiettivo, scope e file siano non ambigui;
- branch e SHA attesi siano dichiarati;
- test e criteri siano eseguibili;
- il ruolo non possa approvare il proprio lavoro;
- l’Esecutore debba produrre `fileModificati.md`;
- il Collaudatore non possa modificare file né produrre l’artefatto;
- non siano previsti commit, push o PR intermedi;
- il flusso termini con un report e il ritorno alla Chat Analisi.
- l’Esecutore possa porre domande soltanto davanti a un blocco tecnico oggettivo documentato;
- i finding del Collaudatore siano completi e le interazioni non manipolino artificialmente lo stato.
