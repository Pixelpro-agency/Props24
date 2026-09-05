# Analisi S0 — Supabase

## Scopo

Questa pagina è la facade dell'analisi tecnica S0 relativa alla migrazione della persistenza Props24 da `LocalDatabase` / `jsonDb` / `localStorage` a Supabase/PostgreSQL.

Le analisi complete sono mantenute in documenti separati nella cartella:

`./analisi-s0-supabase/`

La separazione evita di concentrare l'intera analisi S0 in un singolo documento troppo esteso e permette di utilizzare ogni sottoanalisi come riferimento operativo nelle successive task S1–S7.

S0 è un'analisi tecnica del sistema corrente e dei contratti da preservare. Non costituisce lo schema PostgreSQL definitivo: la progettazione target inizia con S1.

## Stato

```text
S0
→ COMPLETATA

S0.1–S0.12
→ ANALIZZATE
→ CONSOLIDATE
→ PUBBLICATE

Fase successiva
→ S1 — COMPLETATA E APPROVATA

Priorità corrente
→ S2 — Infrastruttura Supabase, Auth, workspace minimo, RLS e Storage foundation

S2.1
→ COMPLETATA E VERIFICATA

Prossima task
→ S2.2 — Migration SQL e versioning
```

## Analisi

1. [S0.1 — Schema corrente `LocalDatabase`, collection, record, nested data e seed](./analisi-s0-supabase/S0.1%20%E2%80%94%20Schema%20corrente%20%60LocalDatabase%60%2C%20collection%2C%20record%2C%20nested%20data%20e%20seed.md)
2. [S0.2 — Analisi del motore di persistenza locale `jsonDb`](./analisi-s0-supabase/S0.2%20%E2%80%94%20Analisi%20del%20motore%20di%20persistenza%20locale%20%60jsonDb%60.md)
3. [S0.3 — CRUD e persistenza Buildings](./analisi-s0-supabase/S0.3%20%E2%80%94%20CRUD%20e%20persistenza%20Buildings.md)
4. [S0.4 — Properties / Unit: CRUD, relazioni, lifecycle e persistenza](./analisi-s0-supabase/S0.4%20%E2%80%94%20Properties%20-%20Unit%20CRUD%2C%20relazioni%2C%20lifecycle%20e%20persistenza.md)
5. [S0.5 — Contacts](./analisi-s0-supabase/S0.5%20%E2%80%94%20Contacts.md)
6. [S0.6 — Tenants](./analisi-s0-supabase/S0.6%20%E2%80%94%20Tenants.md)
7. [S0.7 — Leases](./analisi-s0-supabase/S0.7%20%E2%80%94%20Leases.md)
8. [S0.8 — Payments](./analisi-s0-supabase/S0.8%20%E2%80%94%20Payments.md)
9. [S0.9 — Documents, Drafts, Settings e collezioni residue](./analisi-s0-supabase/S0.9%20%E2%80%94%20Documents%2C%20Drafts%2C%20Settings%20e%20collezioni%20residue.md)
10. [S0.10 — Auth locale, account isolation e composition root](./analisi-s0-supabase/S0.10%20%E2%80%94%20Auth%20locale%2C%20account%20isolation%20e%20composition%20root.md)
11. [S0.11 — Consumer, read-model, selector, subscription e dipendenze runtime](./analisi-s0-supabase/S0.11%20%E2%80%94%20Consumer%2C%20read-model%2C%20selector%2C%20subscription%20e%20dipendenze%20runtime.md)
12. [S0.12 — Matrice finale, ordine di migrazione e decomposizione definitiva S1–S7](./analisi-s0-supabase/S0.12%20%E2%80%94%20Matrice%20finale%2C%20ordine%20di%20migrazione%20e%20decomposizione%20definitiva%20S1%E2%80%93S7.md)

## Risultato operativo

L'analisi S0 stabilisce come vincoli per le fasi successive almeno i seguenti principi:

* il database locale completato nei Blocchi A/B/C resta baseline comportamentale, non modello fisico da copiare;
* `LocalDatabase` non deve essere ricostruito come mega-record o mega-read-model sopra PostgreSQL;
* business authority, dati derivati, query/read-model e stato UI devono essere distinti;
* Supabase Auth, Profile, Workspace e Membership sono concetti distinti;
* i business data condivisi sono workspace-scoped;
* RLS/server authorization costituisce il confine di sicurezza;
* repository, command e query/read-model devono avere boundary esplicite;
* le query devono essere side-effect free;
* le mutation multi-record devono avere vere transaction boundary;
* non sono ammessi implicit dual-write o silent fallback Supabase → locale;
* PostgreSQL conserva metadata e relazioni, mentre i file binari utilizzano Supabase Storage;
* i dati locali correnti sono dati di sviluppo/collaudo e non vengono importati automaticamente come produzione;
* la persistence locale viene eliminata progressivamente soltanto dopo il cutover verificato di tutti i consumer.

La decomposizione operativa definitiva del Blocco S è mantenuta in:

* [Todo list e stato di avanzamento](../todo-list.md)
* [Implementazioni residue](../implementazioni.md)

S1 ha utilizzato S0.1–S0.12 come evidenza tecnica di partenza e ne ha tradotto i contratti nel modello target approvato. Le fasi S2–S7 devono continuare a utilizzare S0 come evidenza della baseline locale e S1 come contratto target, senza riaprire decisioni già verificate senza una ragione esplicita.
