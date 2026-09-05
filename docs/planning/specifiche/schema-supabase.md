# Schema PostgreSQL/Supabase — S1

## Scopo

Questa pagina è la facade del contratto target S1 per la migrazione della persistenza Props24 da `LocalDatabase` / `jsonDb` / `localStorage` a Supabase/PostgreSQL.

Le specifiche complete sono mantenute in documenti separati nella cartella:

`./schema-supabase/`

S1 traduce le evidenze tecniche S0 nel modello target approvato e costituisce il riferimento vincolante per le successive fasi S2–S7.

Non rappresenta ancora l'implementazione fisica delle migration SQL: S2 costruisce l'infrastruttura Supabase e traduce progressivamente questo contratto in schema, Auth, RLS, Storage e relativi test.

## Stato

```text
S1
→ COMPLETATA
→ APPROVATA

S1.1–S1.12
→ DEFINITE
→ CONSOLIDATE
→ PUBBLICATE

Prossima fase
→ S2 — Infrastruttura Supabase, Auth, workspace minimo, RLS e Storage foundation

Prossima task
→ S2.1 — Configurazione Supabase e ambienti
```

## Specifiche

1. [S1.1 — Principi strutturali del modello target](./schema-supabase/S1.1%20%E2%80%94%20Principi%20strutturali%20del%20modello%20target.md)
2. [S1.2 — Auth identity, Profile, Workspace e Membership](./schema-supabase/S1.2%20%E2%80%94%20Auth%20identity%2C%20Profile%2C%20Workspace%20e%20Membership.md)
3. [S1.3 — Schema Buildings e Properties](./schema-supabase/S1.3%20%E2%80%94%20Schema%20Buildings%20e%20Properties.md)
4. [S1.4 — Schema Contacts e Tenants](./schema-supabase/S1.4%20%E2%80%94%20Schema%20Contacts%20e%20Tenants.md)
5. [S1.5 — Schema Lease e Payments](./schema-supabase/S1.5%20%E2%80%94%20Schema%20Lease%20e%20Payments.md)
6. [S1.6 — Schema Documents, Files, Communications e Drafts](./schema-supabase/S1.6%20%E2%80%94%20Schema%20Documents%2C%20Files%2C%20Communications%20e%20Drafts.md)
7. [S1.7 — Lease Activity - Audit](./schema-supabase/S1.7%20%E2%80%94%20Lease%20Activity%20-%20Audit.md)
8. [S1.8 — Matrice constraint e index](./schema-supabase/S1.8%20%E2%80%94%20Matrice%20constraint%20e%20index.md)
9. [S1.9 — Matrice delle transaction command](./schema-supabase/S1.9%20%E2%80%94%20Matrice%20delle%20transaction%20command.md)
10. [S1.10 — Contratti query e read-model](./schema-supabase/S1.10%20%E2%80%94%20Contratti%20query%20e%20read-model.md)
11. [S1.11 — Matrice RLS](./schema-supabase/S1.11%20%E2%80%94%20Matrice%20RLS.md)
12. [S1.12 — Seed e contratto di cutover](./schema-supabase/S1.12%20%E2%80%94%20Seed%20e%20contratto%20di%20cutover.md)

## Contratto consolidato

S1 stabilisce come vincoli per l'implementazione almeno i seguenti principi:

* Supabase Auth User, Profile, Workspace, Workspace Profile e Membership sono identità distinte;
* i business data condivisi sono sempre workspace-scoped;
* Membership attiva e RLS costituiscono l'authorization authority del Workspace;
* il modello PostgreSQL usa tabelle, relazioni, constraint e index reali e non ricostruisce `LocalDatabase` come mega-record;
* Building, Property, Contact, Tenant, Lease, Payment, Document e le relative child entity hanno authority esplicite;
* i dati derivati, gli status temporali, i balance, le dashboard e gli altri read-model non diventano seconde authority persistite;
* le mutation multi-record e gli invariant cross-row passano da transaction command server/database-side;
* le root condivise utilizzano optimistic concurrency tramite `row_version`;
* le query/read-model sono side-effect free e non generano, riparano o modificano dati durante la lettura;
* il client non può eseguire direct business DML aggirando command, RLS o business rule;
* `owner` e `member` condividono nel primo modello i permessi business, mentre l'amministrazione Workspace/Membership resta owner-only;
* Draft e Private Note restano user-private oltre che workspace-scoped;
* PostgreSQL conserva metadata e relazioni dei file, mentre i byte utilizzano Supabase Storage privato;
* Storage, PostgreSQL e servizi esterni non vengono trattati come una singola transaction ACID e richiedono workflow compensativi quando necessario;
* nessuna business query o mutation utilizza implicit dual-write, shadow-write o fallback silenzioso verso la persistenza locale;
* i dati correnti di `database.json`, `localStorage`, gli account locali e i Data URL non vengono importati automaticamente nel nuovo ambiente;
* seed, migration SQL, business bootstrap e un eventuale legacy import sono processi separati;
* ogni capability runtime possiede in ogni momento una sola authority dichiarata: locale oppure Supabase;
* i cutover avvengono progressivamente soltanto dopo gate tecnici verificati;
* le destructive command i cui blocker non sono ancora presenti nell'authority Supabase restano temporaneamente fail-closed;
* il cleanup definitivo di `jsonDb`, Auth locale, Data URL, seed runtime e compatibility code appartiene a S7 dopo la verifica di zero consumer.

## Relazione con S0

Le evidenze tecniche del sistema locale che hanno originato questo contratto sono conservate nella facade:

* [Analisi S0 — Supabase](./analisi-s0-supabase.md)

S0 descrive il sistema corrente e i contratti comportamentali da preservare.

S1 descrive il modello target approvato.

Le fasi S2–S7 devono utilizzare entrambi con ruoli distinti:

```text
S0
→ evidenza tecnica della baseline corrente

S1
→ contratto target approvato

S2–S7
→ implementazione, cutover e cleanup
```

## Riferimenti operativi

Lo stato e la decomposizione delle task successive sono mantenuti in:

* [Todo list e stato di avanzamento](../todo-list.md)
* [Implementazioni residue](../implementazioni.md)
* [Decisioni da validare](../decisioni-da-validare.md)

Con il completamento di S1, il gate progettuale dello schema target è soddisfatto.

La prossima task tecnica è:

**S2.1 — Configurazione Supabase e ambienti.**
