# Props24 — File modificati per revisione

## Task

- ID: A1.1
- titolo: Contratto dati e normalizzazione edificio
- modalità: DESKTOP_ESECUTORE

## Esito

FALLIMENTO — blocco sullo stato locale iniziale.

## Stato di partenza

- repository: Pixelpro-agency/Props24
- root locale: `C:\Users\Utente\Desktop\gestionale Props24`
- branch locale: `main`
- SHA base: `706e32110afbcf6a5e83a9fbbe781a92d3dea0e7`
- data locale: 2026-08-21

## Working tree iniziale

```text
 M docs/planning/todo-list.md
```

La task ammette come unica eccezione al working tree pulito l'eventuale presenza di `fileModificati.md`. La modifica preesistente a `docs/planning/todo-list.md` non rientra nell'eccezione e impedisce di partire dallo stato locale richiesto.

## File coinvolti

### Rinominati

- nessuno

### Modificati dalla task A1.1

- nessuno

### Creati

- `fileModificati.md` — solo artefatto temporaneo di blocco

### Eliminati

- nessuno

## Modifiche eseguite

Nessuna modifica applicativa o documentale A1.1 eseguita. La modifica preesistente a `docs/planning/todo-list.md` non è stata alterata, ripristinata o attribuita ad A1.1.

## Controlli eseguiti

- `git -c safe.directory='C:/Users/Utente/Desktop/gestionale Props24' branch --show-current`
  - exit code: 0
  - risultato: `main`
- `git -c safe.directory='C:/Users/Utente/Desktop/gestionale Props24' rev-parse HEAD`
  - exit code: 0
  - risultato: `706e32110afbcf6a5e83a9fbbe781a92d3dea0e7`
- `git -c safe.directory='C:/Users/Utente/Desktop/gestionale Props24' status --short`
  - exit code: 0
  - risultato: modifica preesistente a `docs/planning/todo-list.md`

Non sono stati eseguiti test, build o lint perché il blocco è stato rilevato prima di qualsiasi modifica A1.1.

## Statistiche

Nessuna diff A1.1.

## Diff dei file tracciati

Non inclusa: la sola diff tracciata è preesistente e non appartiene ad A1.1.

## Warning e limiti

- stato locale incompatibile con il requisito iniziale della task;
- impossibile avviare A1.1 senza che l'utente disponga della modifica preesistente;
- tentativi utilizzati: 1.

## Conferme

- schemaVersion modificato: no
- business rule ED-01/ED-02 implementate: no
- repository edificio implementato: no
- UI modificata: no
- documentazione modificata da A1.1: no
- file fuori scope modificati da A1.1: no
- collaudo browser eseguito: no
- commit eseguito: no
- push eseguito: no
- GitHub modificato: no
- fileModificati.md destinato al commit: no
