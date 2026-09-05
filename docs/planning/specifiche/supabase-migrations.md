# S2.2 — Migration SQL e versioning

## Scopo

`supabase/migrations/*.sql` è l'unica authority versionata della struttura fisica dello schema PostgreSQL Props24.

Non viene introdotta una tabella applicativa `schemaVersion`, `migrationVersion`, `seedVersion` o equivalente per rappresentare la versione fisica dello schema. Un eventuale `schema_version` appartenente ai dati di dominio, per esempio alla versione di un payload Draft, resta semanticamente distinto dalla migration history.

## Workflow scelto

Props24 adotta il seguente workflow:

```text
SQL-first
→ migration versionata nel repository
→ verifica locale
→ revisione Chat Analisi
→ dry-run Development
→ applicazione deliberata Development
```

Non è ammesso il flusso inverso in cui lo schema viene modificato manualmente dal Dashboard remoto e la migration viene ricostruita successivamente. Il Dashboard e il SQL Editor remoto non costituiscono una seconda source of truth dello schema applicativo.

## Directory

L'authority è `supabase/migrations/*.sql`. `supabase/schemas/` non viene utilizzata come seconda rappresentazione canonica. Props24 non mantiene contemporaneamente declarative schemas e migration history come authority concorrenti.

## Naming

Le migration vengono normalmente create tramite `supabase migration new <descrizione>`. Il timestamp o version identifier è generato dalla CLI. Il suffisso descrittivo usa lowercase snake_case e descrive il cambiamento reale.

## Immutabilità

Prima dell'applicazione a un ambiente Development condiviso, una migration ancora locale può essere corretta durante la revisione.

Dopo l'applicazione a Development la migration condivisa diventa immutabile. Ogni correzione successiva richiede una nuova migration forward. Non si riscrive retroattivamente una migration già applicata a Development, Staging o Production.

## Contenuto ammesso

Le migration future possono contenere, quando la relativa task ne è owner: table, constraint, index, function, trigger, policy, grant e data migration realmente necessarie. Le migration non contengono fixture demo o test.

## Seed separato

`migration ≠ seed`. Il business seed appartiene a S2.9 — Seed sviluppo/test. La migration baseline S2.2A non introduce `seed.sql`.

## Business bootstrap separato

```text
migration
≠ signup
≠ CreateWorkspace
≠ business bootstrap
≠ legacy import
```

## Local-first

Prima di una futura applicazione remota, ogni migration deve essere verificata localmente con il workflow appropriato. Il gate host S2.2 userà un reset locale senza seed, perché S2.9 non è ancora implementata.

## Remote Development

Il normale remote della working copy resta `Props24 Development`. Una migration viene applicata al Development soltanto dopo revisione della Chat Analisi e dry-run remoto positivo. Non viene creato uno script npm ordinario per il remote `db push`.

## Production safety

Nel workflow normale restano vietati `db reset --linked` su Production, remote reset automatici e schema change manuali non versionati. Production non viene materializzata né utilizzata in S2.2A.

## Drift e history mismatch

Se la migration history remota presenta versioni inattese o divergenze, il workflow si ferma per l'analisi. Non vengono applicati automaticamente `migration repair`, `db pull`, `squash` o `reset linked` per nascondere o riallineare il problema. Questi strumenti richiedono una task esplicita che analizzi la causa e autorizzi l'operazione.

## Squash e down

`migration squash` e `migration down` non fanno parte del workflow ordinario Props24. I rollback distruttivi non sono la normale strategia per gli ambienti condivisi: le correzioni avanzano tramite migration forward.

## Convenzioni SQL

Le migration business future rispettano integralmente S1, fra cui:

```text
lowercase snake_case
public.* per business table
private.* soltanto quando owner della relativa security task
UUID
FK reali
workspace consistency
row_version quando previsto
numeric per valori economici
text + CHECK per vocabolari finiti
NULL per assenza semantica
nessuna derived authority duplicata
nessun mega-JSON come sostituto dello schema relazionale
```

S2.2 non modifica questi contratti.

## PostgreSQL

```text
Development PostgreSQL
→ 17.6

Local PostgreSQL verificato
→ 17.6

major
→ 17
```

Le migration restano compatibili con PostgreSQL 17 salvo futura modifica esplicita dell'environment contract.

## Runtime boundary

S2.2A non modifica Auth locale, `jsonDb`, `LocalDatabase`, repository applicativi, query, command, UI o runtime business. Non avviene alcun cutover.

## Baseline S2.2A

La prima migration è `20260905165329_migration_history_baseline.sql` e inizializza la migration history senza introdurre business schema.

```text
Remote Development
→ APPLICATA E VERIFICATA

migration history LOCAL / DEVELOPMENT
→ 20260905165329 / 20260905165329
```

## Sequenza S2.2

```text
S2.2A
→ foundation repository + migration baseline

revisione Chat Analisi
→ obbligatoria prima del remote

gate host
→ local reset
→ migration history
→ remote dry-run
→ Development push
→ parity history

S2.2B
→ chiusura documentale/planning dopo verifica
```

## Gate verificato

Il gate host S2.2 è stato eseguito con esito positivo.

```text
migration
→ 20260905165329_migration_history_baseline.sql

local db reset --no-seed
→ PASS

migration history LOCAL
→ 20260905165329

Development prima del push
→ migration non presente

remote dry-run iniziale
→ soltanto 20260905165329_migration_history_baseline.sql

Development push
→ PASS

migration history LOCAL / REMOTE
→ 20260905165329 / 20260905165329

remote dry-run finale
→ Remote database is up to date

repository dopo il gate
→ invariato
```

La baseline non introduce business schema, seed, RLS, Auth adapter o runtime cutover.

## Stato

```text
S2.2
→ COMPLETATA E VERIFICATA

S2.2A
→ FOUNDATION REPOSITORY COMPLETATA

Gate host
→ PASS

Migration baseline LOCAL
→ APPLICATA

Migration baseline DEVELOPMENT
→ APPLICATA

Migration history LOCAL / DEVELOPMENT
→ ALLINEATA

Prossima task
→ S2.3 — Supabase Auth adapter
```