# S2.1 — Configurazione Supabase e ambienti

## Scopo

S2.1 definisce la foundation infrastrutturale Supabase necessaria a Props24 prima della creazione dello schema business PostgreSQL.

La task introduce:

* Supabase CLI versionata nel progetto;
* ambiente Supabase locale;
* progetto Supabase hosted Development;
* contratto delle variabili environment;
* separazione fra configurazione client e secret server-side;
* allineamento della major version PostgreSQL locale/remota;
* regole operative sicure per linking, reset e comandi CLI;
* prerequisiti per migration, Auth, RLS, Storage e test delle task S2 successive.

S2.1 non modifica ancora l'authority runtime dell'applicazione e non introduce lo schema business approvato in S1.

---

## Ambienti

Props24 distingue quattro ambienti concettuali:

```text
LOCAL
→ Supabase stack locale tramite Docker
→ sviluppo e test sulla macchina

DEVELOPMENT
→ progetto Supabase hosted condiviso
→ primo ambiente remoto reale

STAGING
→ ambiente futuro di QA/pre-production

PRODUCTION
→ ambiente futuro autoritativo con dati reali
```

Durante S2.1 vengono materializzati soltanto:

```text
LOCAL
DEVELOPMENT
```

Staging e Production restano definiti contrattualmente ma vengono creati soltanto quando necessari.

---

## Progetto Development

Il primo progetto hosted deve identificare esplicitamente il proprio ambiente, per esempio:

```text
props24-dev
```

oppure:

```text
Props24 Development
```

Non deve essere denominato semplicemente `Props24`, per evitare ambiguità future con Staging e Production.

Il progetto Development:

* non contiene dati production;
* non importa `database.json`;
* non importa `props24.localDb.*`;
* non importa account locali;
* non importa Draft locali;
* non importa Data URL;
* utilizza soltanto dati sintetici e dati creati tramite i futuri workflow di sviluppo/test.

La regione viene scelta fra quelle europee disponibili al momento della creazione.

Staging e Production dovranno normalmente mantenere una collocazione geografica coerente salvo requisito contrario documentato.

---

## Tooling locale

Supabase CLI viene installata come `devDependency` del repository.

Non viene richiesta un'installazione globale come dependency del progetto.

Uso previsto:

```text
npm / npx
→ versione CLI dichiarata nel progetto
→ stesso tooling per sviluppatori e CI
```

Il requisito Node operativo corrente del repository è:

```text
>=22.12.0

```text
S2.1 era stata completata con il requisito `^20.19.0 || >=22.12.0`. Con l'introduzione di `@supabase/supabase-js` in S2.3 il requisito è stato ristretto a Node 22.12 o successivo. Questo aggiornamento non riapre S2.1 e non modifica il contratto degli ambienti Supabase.
```

Su Windows il prerequisito locale per lo stack Supabase è:

```text
Docker Desktop
+
Node/npm
+
Git Bash
```

Non viene introdotto WSL come requisito senza una necessità tecnica separata.

---

## Struttura repository

`supabase init` viene eseguito nella root Props24.

Struttura target iniziale:

```text
Props24/
├── src/
├── tests/
├── docs/
├── package.json
└── supabase/
    └── config.toml
```

`supabase/config.toml` è configurazione condivisa e viene versionato in Git.

Gli artefatti temporanei/local state della CLI non vengono versionati.

Almeno:

```text
supabase/.temp/
supabase/.branches/
```

devono essere ignorati.

---

## Configurazione e secret

Nessun secret viene hardcoded in:

```text
supabase/config.toml
package.json
vite.config.ts
src/
docs/
```

Quando una configurazione Supabase deve leggere un secret, viene usato un environment reference appropriato.

Il repository deve proteggere:

```text
.env
.env.*
```

mantenendo versionabile:

```text
.env.example
```

---

## Contratto environment frontend

Le sole variabili Supabase previste per il browser sono:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

`.env.example` contiene esclusivamente nomi e placeholder.

La publishable key può essere inclusa nel frontend perché l'accesso reale ai dati resta protetto da Auth, RLS e authorization server/database-side.

---

## Secret server-side

Le credenziali privilegiate restano server/system-only.

Una eventuale secret key futura usa una variabile senza prefisso `VITE_`, per esempio:

```text
SUPABASE_SECRET_KEY
```

È vietato:

```text
VITE_SUPABASE_SECRET_KEY
```

Qualunque variabile `VITE_*` deve essere considerata pubblicabile nel bundle browser.

---

## API key model

Props24 adotta direttamente la nomenclatura Supabase corrente:

```text
publishable key
→ client/browser

secret key
→ server/system
```

Le precedenti denominazioni `anon` e `service_role` non vengono utilizzate come nuovo contratto applicativo.

Questo non modifica il principio S1.11:

```text
client credential
→ soggetta a RLS

privileged server credential
→ mai browser
```

---

## Vite

`vite.config.ts` non contiene:

* URL Supabase hardcoded;
* publishable key hardcoded;
* secret key;
* service credentials;
* workaround per esporre environment server-side.

La configurazione client verrà letta tramite `import.meta.env` quando verrà introdotto il Supabase client nelle task successive.

S2.1 non introduce ancora il data adapter applicativo.

---

## PostgreSQL version parity

La major version PostgreSQL dell'ambiente locale deve coincidere con quella del progetto Development hosted.

Dopo la creazione del progetto remoto viene verificata esplicitamente tramite il database, per esempio:

```sql
show server_version;
```

oppure:

```sql
select version();
```

Il risultato remoto è l'authority per configurare:

```toml
[db]
major_version = <remote-major-version>
```

in `supabase/config.toml`.

Non viene mantenuto automaticamente il default generato dalla CLI se differisce dal progetto remoto.

Prima di S2.2 deve valere:

```text
PostgreSQL LOCAL major
=
PostgreSQL DEVELOPMENT major
```

---

## Linking

La working copy dello sviluppatore viene normalmente linkata soltanto a:

```text
Props24 Development
```

Il linking avviene tramite il project reference del progetto Development.

Production non viene utilizzata come normale progetto linked dello sviluppatore.

Token CLI, database password e altre credenziali:

* non vengono committati;
* non vengono documentati in chiaro;
* non vengono riportati in `fileModificati.md`;
* non devono essere condivisi nei prompt o nella chat.

---

## Sicurezza dei comandi CLI

I comandi locali e remoti devono essere semanticamente distinguibili.

Le operazioni ordinarie previste nel repository sono local-safe.

Script iniziali:

```text
supabase:start
supabase:stop
supabase:status
supabase:db:reset:local
```

Non vengono introdotti script facili da eseguire accidentalmente come:

```text
db reset --linked
automatic remote reset
automatic production database push
```

Il reset remoto della futura Production è vietato.

---

## Local Supabase

Il local stack viene avviato tramite Supabase CLI e Docker.

Il gate deve verificare almeno la disponibilità di:

```text
PostgreSQL
Auth
Storage
API/PostgREST
Studio
```

Il local stack è esclusivamente developer-local e non viene esposto pubblicamente.

---

## Schema API

S2.1 non crea ancora gli schema PostgreSQL S1.

Quando verrà introdotto lo schema:

```text
private
```

esso non dovrà essere configurato come exposed API schema.

Questa regola deriva dalla matrice RLS S1.11.

---

## Dipendenze applicative

S2.1 non installa ancora `@supabase/supabase-js` se non esiste un consumer applicativo reale.

L'SDK entra con il vero client/Auth boundary delle task successive.

Alla chiusura di S2.1 restano invariati:

```text
Auth locale
jsonDb
LocalDatabase
repository locali
runtime business corrente
```

Non avviene alcun cutover.

---

## Migration e seed

S2.1 non crea migration business.

Lo schema PostgreSQL approvato in S1 viene tradotto in SQL a partire da:

```text
S2.2 — Migration SQL e versioning
```

S2.1 non crea neppure business seed.

Le fixture sviluppo/test vengono implementate in:

```text
S2.9 — Seed sviluppo/test
```

Il contratto seed/cutover resta quello definito in S1.12.

---

## CI

S2.1 non implementa ancora una pipeline CI Supabase completa.

La foundation deve però rendere possibile un futuro flusso:

```text
clone
→ npm ci
→ Supabase local stack
→ migration/reset
→ test
```

senza dipendere da una CLI installata globalmente sulla macchina.

---

## Sequenza operativa S2.1

S2.1 viene eseguita in due step tecnici separati.

### S2.1A — Foundation locale e repository

Comprende:

```text
Supabase CLI project-local
Node engine
.gitignore
.env.example
supabase init
config.toml
npm script local-safe
documentazione
local prerequisites
```

Non richiede ancora un progetto Supabase remoto.

### Passaggio manuale

L'utente:

```text
crea/seleziona l'organizzazione Supabase
crea Props24 Development
sceglie la regione
conserva le credenziali in modo sicuro
esegue l'autenticazione CLI necessaria
```

Nessun secret viene riportato nei documenti o nei prompt.

### S2.1B — Link, version parity e gate

Comprende:

```text
link al progetto Development
verifica PostgreSQL remoto
allineamento db.major_version
avvio/verifica local stack
verifica environment contract
build/test baseline
gate finale S2.1
```

---

## Ambiente Development verificato

- Organization: `Props24`
- Project: `Props24 Development`
- Project ref: `wttahnbehhkqycvqrluu`
- Region: `Central EU (Frankfurt) — eu-central-1`
- Plan: `Free`
- Supabase CLI: `2.116.0`
- PostgreSQL remote: `17.6`
- PostgreSQL local verificato: `17.6`
- PostgreSQL major: `17`
- working copy linked al Development: verificato
- Docker Desktop host: verificato
- local stack core: avviato e verificato
- local stack stato finale: arrestato correttamente

### Warning di verifica

La suite completa presenta flakiness non deterministica in test preesistenti non modificati da S2.1. Dopo le modifiche S2.1A è stato ottenuto un run completo con 1288/1288 test passati; nei successivi controlli i failure hanno variato numero e file coinvolti e un rerun diagnostico mirato ha prodotto 69/69 PASS. Non è stata rilevata una regressione attribuibile a S2.1.

Il collector locale Vector/logging ha inoltre mostrato un problema non bloccante di accesso al Docker log source. PostgreSQL, Auth, Storage, REST/API e Studio sono risultati operativi.

## Gate S2.1

S2.1 è completata soltanto quando sono verificati tutti i seguenti punti:

```text
[x] Supabase CLI versionata nel progetto
[x] Node requirement esplicito
[x] Docker prerequisite verificato
[x] supabase/config.toml versionato
[x] temporary state Supabase ignorato
[x] .env e secret protetti da Git
[x] .env.example presente
[x] VITE_SUPABASE_URL definita nel contract
[x] VITE_SUPABASE_PUBLISHABLE_KEY definita nel contract
[x] nessuna secret key esposta tramite VITE_
[x] progetto Development hosted creato
[x] working copy linked al solo Development
[x] PostgreSQL major remota verificata
[x] PostgreSQL local major allineata
[x] local Supabase stack operativo
[x] nessuna migration business introdotta
[x] nessun business seed introdotto
[x] nessun runtime cutover
[x] nessun dual-write/fallback
[x] build/test baseline senza regressioni
```

## Vincoli consolidati

S2.1 stabilisce quindi che:

* Local e Development sono gli unici ambienti materializzati inizialmente;
* Staging e Production restano ambienti futuri distinti;
* la CLI è una dependency del progetto;
* Docker è il runtime locale dello stack Supabase;
* `config.toml` è versionato ma non contiene secret;
* environment reali non vengono committati;
* il browser riceve soltanto URL e publishable key;
* le credenziali privilegiate restano server-only;
* Development è l'unico normale remote linked durante questa fase;
* la major PostgreSQL locale deve coincidere con quella remota;
* gli script ordinari non espongono comandi distruttivi remote;
* S2.1 prepara la piattaforma ma non cambia ancora la persistence authority dell'applicazione.

## Stato

**S2.1 — COMPLETATA E VERIFICATA**

```text
S2.1A
→ foundation repository completata

setup manuale
→ Organization, Development, Docker e login completati

S2.1B/S2.1C
→ link, PostgreSQL parity, local stack e chiusura documentale verificati

Prossima task
→ S2.2 — Migration SQL e versioning
```
