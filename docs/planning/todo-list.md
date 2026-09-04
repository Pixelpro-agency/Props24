# Props24 — Todo list e stato di avanzamento

## Scopo

Questa Todo list è il riepilogo operativo dello stato del progetto. [Implementazioni residue](./implementazioni.md) contiene dettaglio, dipendenze e criteri di chiusura; [Decisioni da validare](./decisioni-da-validare.md) contiene le decisioni professionali ancora aperte o rinviate e le decisioni validate ancora rilevanti per task non concluse. Specifiche e codice verificato restano le fonti tecniche.

- [Implementazioni residue](./implementazioni.md)
- [Decisioni da validare](./decisioni-da-validare.md)
- [Fase locale prioritaria](./specifiche/fase-locale-prioritaria.md)
- [Database locale e migrazione Supabase](./specifiche/database-locale-e-migrazione.md)
- [Specifica Nuovo edificio](./specifiche/nuovo-edificio.md)
- [Ruoli, inviti e workspace](./specifiche/ruoli-inviti-e-workspace.md)

## Riepilogo

- Task principali: 75
- Completate integralmente: 27
- Parzialmente completate: 3
- Non concluse: 45
- Decisioni professionali aperte o rinviate: 13
- Di cui rinviate con risposta/decisione già registrata: 7
- Di cui ancora senza risposta: 6
- Prossimo punto tecnico: S0 — Analisi tecnica della persistenza corrente e piano di migrazione Supabase

`IN ATTESA`, `FUTURO`, `RINVIATO` e `DECISIONE PRODOTTO` sono sottoinsiemi delle 45 task non concluse e non vanno sommati nuovamente.

## Percorso operativo immediato

> **NUOVA PRIORITÀ — BLOCCO S: SUPABASE E PERSISTENZA CONDIVISA**
>
> Baseline applicativa di partenza: `4007e98e9f821ffe15b4724303d138f99307b70d`.
>
> I Blocchi A, B e C già completati costituiscono la baseline funzionale da preservare durante la migrazione. La migrazione della persistenza non autorizza regressioni dei CRUD, delle business rule, degli ID persistenti, dell'isolamento dei dati, delle bozze, dei lifecycle o dei flussi già collaudati.
>
> La priorità tecnica corrente è S0 — analisi completa dell'attuale persistenza locale, dei repository, dei reader/writer, delle authority e dei consumer.
>
> Nessuna migrazione Supabase e nessuna eliminazione del database locale devono iniziare prima della chiusura di S0 e dell'approvazione della scomposizione risultante.
>
> I dati correnti di `database.json` e dei database `localStorage` sono dati temporanei di sviluppo e collaudo. Non sono dati di produzione e non devono essere importati automaticamente nel database Supabase definitivo. Il nuovo ambiente condiviso verrà popolato tramite seed di test espliciti e soprattutto tramite i CRUD reali dell'applicazione.
>
> Sequenza prioritaria decisa:
>
> 1. Blocco S — migrazione a Supabase/PostgreSQL e rimozione progressiva della persistenza runtime locale;
> 2. sezione Finanze, da progettare anche sulla base dei riferimenti Rentila forniti dall'utente;
> 3. risposta e riallineamento delle decisioni da validare;
> 4. prosecuzione delle altre task di progetto ancora rilevanti.
>
> Le task esistenti che potrebbero diventare obsolete, cambiare ownership o essere assorbite dalla migrazione Supabase verranno rivalutate soltanto sulla base della matrice finale S0.12.

## Blocco S — Supabase e persistenza condivisa

- [ ] S0 — Analisi tecnica della persistenza corrente e piano di migrazione — **PROSSIMA TASK / PRIORITÀ CORRENTE**
  - [ ] S0.1 — Schema corrente `LocalDatabase`, collection, record, nested data e seed
  - [ ] S0.2 — `jsonDb`, localStorage, inizializzazione, migrazioni, validazione, cache e subscription
  - [ ] S0.3 — CRUD e persistenza Buildings
  - [ ] S0.4 — CRUD e persistenza Properties / Unit
  - [ ] S0.5 — CRUD e persistenza Contacts
  - [ ] S0.6 — CRUD e persistenza Tenants
  - [ ] S0.7 — CRUD e persistenza Leases
  - [ ] S0.8 — CRUD e persistenza Payments
  - [ ] S0.9 — Documents, Drafts, Settings e collection residue
  - [ ] S0.10 — Auth locale, account isolation e composition root
  - [ ] S0.11 — Consumer, read-model, selector, subscription e dipendenze runtime
  - [ ] S0.12 — Matrice finale keep/adapt/delete, ordine di migrazione e scomposizione definitiva S1–S7
- [ ] S1 — Contratto target e schema PostgreSQL/Supabase — **DIPENDE DA S0**
- [ ] S2 — Infrastruttura Supabase, Auth e workspace minimo condiviso — **DIPENDE DA S1**
- [ ] S3 — Repository boundary, adapter asincroni e composition root Supabase — **DIPENDE DA S1/S2**
- [ ] S4 — Migrazione domini semplici e pilot CRUD — **DIPENDE DA S3**
- [ ] S5 — Migrazione domini core Tenant e Property/Unit — **DIPENDE DA S4**
- [ ] S6 — Migrazione transazionale Lease e Payments — **DIPENDE DA S5**
- [ ] S7 — Storage/documenti, residui, rimozione runtime locale e collaudo finale — **DIPENDE DA S6**

## Blocco A — Edifici

- [x] A0 — Specifica Nuovo edificio — **COMPLETATA**
- [x] A1 — Repository edifici — **COMPLETATA; contratto canonico, ED-01/ED-02, lifecycle account-scoped e gate tecnico verificati**
  - [x] A1.1 — Contratto dati e normalizzazione edificio — **COMPLETATA**
  - [x] A1.2 — Regole edificio, errori e integrità DB — **COMPLETATA**
  - [x] A1.3 — Repository edifici account-scoped e lifecycle — **COMPLETATA**
  - [x] A1.4 — Copertura automatizzata e gate tecnico A1 — **COMPLETATA**
- [x] A2 — Form Nuovo edificio — **COMPLETATA; contratto, UI, submit reale e gate tecnico consolidato verificati**
  - [x] A2.1 — Contratto form edificio — **COMPLETATA; 58 file / 796 test, build e lint positivi**
  - [x] A2.2 — UI completa del form edificio — **COMPLETATA; 59 file / 806 test, build e lint positivi**
  - [x] A2.3 — Submit reale edificio — **COMPLETATA; 60 file / 812 test, build e lint positivi**
  - [x] A2.4 — Gate tecnico consolidato A2 — **COMPLETATA; 61 file / 815 test, build e lint positivi**
- [x] A3 — Route e accessi edificio — **COMPLETATA; route create/detail, protezione auth, accessi UI, persistenza post-submit e collaudo browser verificati**
  - [x] A3.1 — Route, pagina Nuovo edificio e destinazione dettaglio minima — **COMPLETATA; 62 file / 827 test, build e lint positivi**
  - [x] A3.2 — Accessi UI al Nuovo edificio — **COMPLETATA; 63 file / 830 test, build e lint positivi**
  - [x] A3.3 — Gate tecnico consolidato A3 — **COMPLETATA; 64 file / 836 test, build e lint positivi**
  - [x] A3.4 — Collaudo browser route e accessi — **COMPLETATA; PASS; nessun finding**
- [x] A4 — Lista edifici reale — **COMPLETATA; repository account-scoped, subscription, attivi/archivio, ricerca, ordinamento, ID reali, unitsCount derivato e browser QA verificati**
- [x] A5 — Azioni edificio — **COMPLETATA; lifecycle singolo e bulk, atomicità, errori di dominio, selezione e browser QA verificati**
  - [x] A5.1 — Operazioni bulk atomiche repository edifici — **COMPLETATA**
  - [x] A5.2 — Azioni UI singole e bulk — **COMPLETATA**
  - [x] A5.3 — Gate tecnico consolidato A5 — **COMPLETATA**
  - [x] A5.4 — Collaudo browser azioni edificio — **COMPLETATA; PASS; nessun finding**
- [x] A6 — Dettaglio e modifica edificio — **COMPLETATA; dettaglio reale, unità collegate, creazione unità in contesto, modifica, lifecycle e gate consolidato verificati**
  - [x] A6.1 — Dettaglio Building reale e unità collegate — **COMPLETATA**
  - [x] A6.2 — Aggiungi unità dal Building con contesto `buildingId` — **COMPLETATA**
  - [x] A6.3 — Modifica Building — **COMPLETATA**
  - [x] A6.4 — Lifecycle dal dettaglio Building — **COMPLETATA**
  - [x] A6.5 — Gate tecnico consolidato A6 — **COMPLETATA**
- [x] A7 — Collaudo edifici — **COMPLETATA; PASS; nessun finding; Blocco A completato**

## Blocco B — Unità

- [x] B1 — Relazione unità–edificio — **COMPLETATA; relazione canonica, create standalone, draft, mutazioni repository, gate tecnico e collaudo browser verificati**
  - [x] B1.1 — Contratto relazione unità–edificio e mutazioni repository — **COMPLETATA**
  - [x] B1.2 — Stato form e bozza della relazione Building — **COMPLETATA**
  - [x] B1.3 — Nuova unità standalone e boundary relazione Building — **COMPLETATA E RIALLINEATA**
  - [x] B1.4 — Gate tecnico consolidato B1 — **COMPLETATA**
- [x] B2 — Duplicati unità — **COMPLETATA; B2.1–B2.4 verificate; identità catastale canonica, enforcement repository, preservazione collisioni legacy, gate tecnico e browser QA completati**
  - [x] B2.1 — Contratto identità catastale delle unità — **COMPLETATA; campi catastali mancanti, chiave canonica pura e copertura automatizzata verificate; 77 file / 952 test; commit `8fdee1577cdc5a18fff2468a6b4dda1cd826a0fe`**
  - [x] B2.2 — Enforcement repository dei duplicati catastali — **COMPLETATA; create/update atomiche e account-scoped, nessun fallback, collisioni legacy preservate come warning; commit `1834fb8733341673b2f7a1421e64b47c18615a86`**
  - [x] B2.3 — Gate tecnico consolidato B2 — **COMPLETATA; PASS; 37 requisiti coperti, 78 file / 973 test, build e lint mirato positivi**
  - [x] B2.4 — Collaudo browser duplicati unità — **COMPLETATA; PASS; nessun finding applicativo, collisione normalizzata, retry, assenza di falsi positivi, Building e persistenza verificati**
- [x] B3 — Campi canonici Unit — **COMPLETATA; cataloghi canonici, mutation strict, normalizzazione legacy conservativa, machine ID persistiti, label read-model e round-trip verificati**
  - [x] B3.1 — Contratto cataloghi e schema Unit — **COMPLETATA**
  - [x] B3.2 — UI e round-trip campi canonici Unit — **COMPLETATA**
  - [x] B3.3 — Gate tecnico consolidato B3 — **COMPLETATA; PASS; 83 file / 1040 test, build e lint mirato positivi**
- [x] B4 — ID annidati canonici — **COMPLETATA; generatore canonico unico, 8 categorie di ID annidati Unit, identità create-once/preserve-thereafter e legacy preservato**
  - [x] B4.1 — Generatore canonico e ID di documento catastale, chiavi e contratti — **COMPLETATA**
  - [x] B4.2 — ID canonici di fotografie, contatti e documenti — **COMPLETATA**
  - [x] B4.3 — Gate tecnico consolidato B4 — **COMPLETATA; PASS; 88 file / 1055 test, build e lint mirato positivi**
- [x] B5 — Bozza unità — **COMPLETATA; repository condiviso, salvataggio manuale, restore, guard e cleanup verificati**
- [x] B6 — Modifica e lifecycle unità — **COMPLETATA; lifecycle repository account-scoped, edit reale, bozza e guard edit entity-scoped, azioni singole e bulk reali, eliminazione protetta, relazione Building preservata e gate tecnico consolidato verificati**
  - [x] B6.1 — Lifecycle repository Unit — **COMPLETATA**
  - [x] B6.2 — Route e form Modifica Unit — **COMPLETATA**
  - [x] B6.3 — Guard e bozza edit Unit — **COMPLETATA**
  - [x] B6.4 — Azioni reali lista e dettaglio Unit — **COMPLETATA**
  - [x] B6.5 — Gate tecnico consolidato B6 — **COMPLETATA; PASS; 93 file / 1099 test, build e lint mirato positivi**
- [ ] B7 — Import ed export unità — **RINVIATO**
- [ ] B8 — Analisi catastale futura — **FUTURO — BACKEND**
- [x] B9 — Collaudo unità — **COMPLETATA; PASS funzionale; due Unit nello stesso Building, nove schede, draft create/edit, create/edit, reload, lifecycle singolo e bulk, selection safety, relazione Building, unitsCount e isolamento account verificati; nessun finding applicativo; file chooser e ispezione storage interna limitati dallo strumento**
  - [ ] B9R — Verifiche browser residue delle Unit — **IN ATTESA DI STRUMENTO ADEGUATO; B9 resta completata con PASS funzionale. Da rieseguire quando il browser/tooling consentirà file chooser reale e ispezione read-only affidabile dello storage: B9-06 allegati reali; B9-07 ID annidati dopo create; B9-13 doppio submit create osservato nel browser; B9-15 stabilità ID dopo reload; B9-20 stabilità ID dopo edit; B9-35 assenza di scritture persistite durante operazioni read-only. I relativi contratti sono già coperti dai gate automatizzati B4/B6, ma la verifica browser diretta resta pendente.**
  - [ ] B9A — Card unità: Affittate, Valore locativo, Valore patrimoniale, Guadagno lordo e Guadagno netto; Tasso di occupazione solo per futuri affitti brevi e Copertura locativa soprattutto aggregata — **FUTURO; KPI-01 e KPI-02 validate**

## Blocco C — Inquilini e contatti

- [x] C1 — Garanti e rubrica — **COMPLETATA; ContactRepository e lifecycle account-scoped, `contactId` canonico Tenant, compatibilità legacy, delete protection Lease/Tenant, Garanti Tenant e contatti di emergenza sulla rubrica reale, draft/guard e gate consolidato verificati**
  - [x] Pilot `ContactRepository` asincrono e adapter locale account-scoped
  - [x] Provider autenticato, subscription e `useContactList`
  - [x] Garanti di Nuova locazione migrati alla rubrica reale
  - [x] Creazione persona e società tramite repository nel flusso Lease
  - [x] Protezione dei riferimenti garanti nelle bozze Lease durante loading/error della rubrica
  - [x] Collaudo browser del pilot contacts
  - [x] C1.1 — Contratto Contact–Tenant e lifecycle Contact — **COMPLETATA; `contactId` distinto dall'ID della relazione, legacy preservati, restore e delete protection Lease/Tenant verificati**
  - [x] C1.2 — Migrazione Garanti di Nuovo inquilino — **COMPLETATA; rubrica reale, Contact esistenti/nuovi, riferimenti archived/missing e refresh canonico verificati**
  - [x] C1.3 — Contatti di emergenza e modello comune — **COMPLETATA; rubrica reale, requisito telefono, `isPrimary` Tenant-specific ed exactly-one primary verificati**
  - [x] C1.4 — Gate tecnico consolidato C1 — **COMPLETATA; PASS; nessun finding; 95 file / 1137 test, build positiva e lint mirato 0 errori/0 warning**
- [x] C2 — ID annidati canonici Tenant — **COMPLETATA; 8 categorie ID persistenti canonicalizzate e verificate create-once/preserve-thereafter attraverso form, draft, normalizzazione, createTenant, JSON e reload**
  - [x] C2.1 — ID canonici delle relazioni Tenant — **COMPLETATA; `TenantGuarantors[].id` e `TenantEmergencyContacts[].id` usano il generatore canonico condiviso**
  - [x] C2.2 — ID canonici di allegati e documenti Tenant — **COMPLETATA; foto, fronte/retro identità, visura società, TenantDocument e relativo file canonicalizzati**
  - [x] C2.3 — Gate tecnico consolidato C2 — **COMPLETATA; PASS; ID canonici e legacy preservati byte-for-byte, nessun read-repair su DB canonico, 98 file / 1155 test PASS**
- [x] C3 — Duplicati anagrafici — **COMPLETATA; CT-01–CT-05 applicate tramite hard block fiscale account-scoped senza override; identità person/company distinte, Contact↔Contact e Tenant↔Tenant separati**
  - [x] C3.1 — Contratto identità fiscale e modello company Tenant — **COMPLETATA; `TenantCompanyFiscalCode`/`companyFiscalCode`, normalizzazione fiscale, pure finder/assert, archived/exclude-current e legacy-safe**
  - [x] C3.2 — Enforcement ContactRepository — **COMPLETATA; create/update Contact bloccano CF person e CF/P.IVA company, senza write su collisione e con account isolation**
  - [x] C3.3 — Enforcement Tenant create e UI — **COMPLETATA; person per CF, company per CF ente/P.IVA, nessun uso del CF rappresentante, feedback RHF sul campo corretto e nessuna mutazione parziale**
  - [x] C3.4 — Gate tecnico consolidato C3 — **COMPLETATA; 7 file / 37 test fiscali PASS, legacy/no-cross-domain/regressioni verificati; build/lint/UTF-8 positivi e failure Property globali non riprodotte nel collaudo isolato 44/44**
- [x] C4 — Creazione atomica Tenant — **COMPLETATA; create Tenant account-scoped con authority unica, validazioni complete pre-save, una sola mutation definitiva, return dal database salvato e nessun Tenant parziale**
  - [x] Riferimenti Contact — **`contactId` esistenti nello stesso account obbligatori per le nuove create; Contact archived ancora validi; inline legacy senza `contactId` ammessi; cross-account e dangling bloccati**
  - [x] Integrità relazioni — **relation ID non vuoti/univoci, massimo 5 Emergency ed exactly-one primary quando la collection è valorizzata**
  - [x] Atomicità — **1 write sul successo, 0 write sulle validation failure, Contact autonomi preservati senza rollback**
  - [x] FIX C4-F01 — **fixture C2 allineata aggiungendo i Contact reali mancanti senza rimuovere `contactId` o alterare gli otto nested ID**
  - [x] Gate tecnico — **14 test C4 PASS; regressioni C1/C2/C3 e submit/draft positive; full suite 106 file / 1206 test PASS; build/lint/UTF-8 positivi**
- [x] C5 — Modifica e lifecycle — **COMPLETATA**
  - [x] C5.1 — Repository Tenant: update e lifecycle
  - [x] C5.2 — Route e form Modifica Tenant
  - [x] C5.3 — Bozza edit e guard Tenant
  - [x] C5.4 — Lifecycle reale lista e dettaglio Tenant
  - [x] C5.5 — Gate tecnico consolidato C5
  - [x] C5.6 — Collaudo browser C5 — **PASS CON LIMITAZIONI STRUMENTALI non bloccanti**
- [x] C6 — Azioni lista ancora simulate — **COMPLETATA; controlli non disponibili realmente disabilitati e codice legacy Tenant simulato rimosso**
  - [x] C6.1 — Chiusura controlli Tenant simulati visibili — **COMPLETATA; Importa/Esporta/Messaggio realmente disabilitati, azioni singole pending coerenti e falso menu Ordina rimosso**
  - [x] C6.2 — Cleanup legacy e gate consolidato C6 — **COMPLETATA; modali e handler legacy rimossi, nessun URL export legacy o simulazione C6 residua; 113 file / 1287 test PASS, build e lint mirato positivi**
- [ ] C7 — Inviti email — **FUTURO — BACKEND**
- [ ] C8 — Allegati delle bozze — **FUTURO — STORAGE**
- [ ] C9 — Verifica documentale/OCR — **FUTURO — BACKEND**
- [x] C10 — Collaudo inquilini — **COMPLETATA; PASS CON LIMITAZIONI STRUMENTALI; Persona/Società, relazioni Contact, duplicati fiscali, edit, lifecycle, invito locale, reload e isolamento account verificati; finding logout/SearchBar corretto e collaudato; nessun finding applicativo residuo**
  - [ ] C10A — Card inquilini: Attivi, Connessi e Con locazione — **FUTURO**

## Blocco D — Locazioni e pagamenti

- [ ] D1 — Data finale sicura — **PARZIALE**
  - [x] D1A — Calcolo automatico sicuro
  - [ ] D1B — Override motivato e storico append-only a tempo indefinito — **APERTO; PA-07 validata, PA-06 rinviata**
- [ ] D2 — Addebito senza incasso automatico — **PARZIALE**
  - [x] D2A — Stato iniziale conservativo delle rate generate
  - [x] D2B — Conferma manuale completa
  - [x] D2C — Repair, migrazione e consumer finanziari
  - [ ] D2D — Prepagato, ricevuta e confirmation precedenti — **IN ATTESA: PA-10, PA-11, PA-12**
- [ ] D3 — Regressione locazione mirata — **IN ATTESA/APERTO; influenzato da PA-10–PA-13**
  - [ ] D3A — Tre card locazioni: Attive, Canoni di affitto e Depositi cauzionali — **FUTURO; in attesa di KPI-03**

## Blocco E — Preferenze

- [ ] E1 — Visibilità colonne nel database — **APERTO**
- [ ] E2 — Audit storage — **APERTO**

## Blocco F — Modifiche non salvate

- [x] F0 — Specifica — **COMPLETATA**
- [x] F1 — Repository condiviso delle bozze manuali — **COMPLETATA**
  - [x] F1A — Contratto asincrono, chiavi logiche e operazioni pure
  - [x] F1B — Schema canonico 4, migrazione legacy e bridge compatibile
  - [x] F1C — Adapter locale account-scoped e test infrastrutturali
- [x] F2 — Guard condiviso — **COMPLETATA**
  - [x] F2A — Migrazione controllata a Data Router e infrastruttura test DOM
  - [x] F2B — Contratto e macchina a stati pura
  - [x] F2C — Hook React Router, beforeunload e dialog accessibile
  - [x] F2C-FIX1 — Compatibilità reale con React Strict Mode
  - [x] F2D — Integrazione logout e gate finale
- [x] F3 — Integrazioni — **COMPLETATA; F3.1–F3.4 integrate con repository bozze e guard condivisi**
  - [x] F3.1 — Nuovo inquilino — **COMPLETATA**
  - [x] F3.2 — Nuova unità — **COMPLETATA**
  - [x] F3.3 — Nuova locazione — **COMPLETATA**
  - [x] F3.4 — Nuovo edificio — **COMPLETATA; 76 file / 927 test, build positiva, lint mirato F3.4 positivo; commit dbe8a9a2910848196874305aec57f73e5783aa1a**
- [x] F4 — Collaudo trasversale — **COMPLETATA; PASS; nessun finding; F4-10 limitazione strumentale beforeunload; Blocco F completato**

## Blocco G — Azioni simulate, mock e route

- [ ] G1 — Inventario statico aggiornato — **APERTO**
- [ ] G3 — Residui azioni unità e inquilini — **DA RIVALUTARE DOPO G1; non deve riaprire i lifecycle già completati delle Unit o dei Tenant, non deve duplicare B7 e non deve riaprire azioni Tenant già classificate dalla specifica della fase locale**
- [ ] G4 — Locazioni — **DECISIONE PRODOTTO / FUTURO**
- [ ] G5 — Dashboard e navbar — **DECISIONE PRODOTTO**
- [ ] G6 — Route future — **DECISIONE PRODOTTO / FUTURO**
- [ ] G7 — Coerenza UI delle funzioni future — **APERTO**
- [ ] G8 — Feedback — **APERTO**

## Blocco H — Sicurezza, backend e storage

- [ ] H1 — Autenticazione di produzione — **FUTURO — BACKEND**
- [ ] H2 — Identità, workspace e accessi — **FUTURO — BACKEND**
  - [x] AC-01 — CF account Props24 facoltativo alla registrazione iniziale e globalmente univoco se valorizzato, con blocco del riuso fra account; regola distinta dai duplicati tenant/contatti account-scoped — **VALIDATA; influenza H1 e H2**
  - [ ] H2A — Portale inquilino invitato
  - [ ] H2B — Account multi-ruolo e workspace
  - [ ] H2C — Gestione professionale e deleghe
- [ ] H3 — Storage documentale — **FUTURO — STORAGE/BACKEND**

## Blocco I — Automazioni e servizi documentali

- [ ] I1 — Indici ISTAT aggiornabili — **FUTURO — BACKEND**
- [ ] I2 — Generazione programmata e avvisi — **FUTURO — BACKEND**
- [ ] I3 — Aggiornamento canone — **FUTURO — BACKEND**
- [ ] I4 — Ricevute, fatture e documenti pagamento — **FUTURO — BACKEND; PA-02, PA-04 e PA-05 rinviate; PA-11 senza risposta**
- [ ] I5 — Pagamenti parziali, crediti e debiti — **FUTURO — BACKEND; PA-03 rinviata; PA-10 senza risposta**
- [ ] I6 — Notifiche locazione — **FUTURO — BACKEND**
- [ ] I7 — Documenti deposito e assicurazioni — **FUTURO — STORAGE**
- [ ] I8 — Documenti durante creazione locazione — **FUTURO — STORAGE**
- [ ] I9 — Modelli, cataloghi e inventari — **FUTURO — BACKEND**
- [ ] I10 — Periodicità forfettaria — **FUTURO; influenzato da UN-02**

## Blocco J — Qualità

- [ ] J1 — Test automatizzati — **PARZIALE**
  - [x] Vitest e configurazione Node
  - [x] Business rule di base
  - [x] Calcolo data finale
  - [x] Generazione rate conservativa
  - [x] Conferma manuale completa
  - [x] Repair e migrazione pagamenti
  - [x] Deduplicazione rate generate
  - [x] Consumer finanziari
  - [x] Isolamento account `contacts`
  - [x] Adapter `ContactRepository`
  - [x] Composition root
  - [x] Store asincrono e risposte obsolete
  - [x] Repository bozze: contratto, migrazione e adapter account-scoped
  - [x] Data Router e configurazione route condivisa
  - [x] Macchina a stati pura del guard
  - [x] Hook React Router e beforeunload
  - [x] Dialog accessibile delle modifiche non salvate
  - [x] Compatibilità React Strict Mode del guard
  - [x] Integrazione auth/logout del guard
  - [x] Integrazione bozza manuale e guard in Nuovo inquilino — F3.1
  - [x] Integrazione bozza manuale e guard in Nuova unità — F3.2
  - [x] Integrazione Nuova locazione: restore, riconciliazione riferimenti, guard, cleanup/recovery e submit lock — F3.3
  - [x] Contratto dati e normalizzazione edificio — A1.1
  - [x] Regole edificio, errori e integrità DB — A1.2
  - [x] Repository edifici account-scoped e lifecycle — A1.3
  - [x] Gate tecnico consolidato repository edifici — A1.4
  - [x] Contratto relazione unità–edificio e mutazioni repository — B1.1
  - [x] Stato form e bozza della relazione Building — B1.2
  - [x] Nuova unità standalone e boundary relazione Building — B1.3
  - [x] Gate tecnico consolidato relazione unità–edificio — B1.4
  - [x] Contratto form edificio — A2.1
  - [x] UI completa del form edificio — A2.2
  - [x] Submit reale edificio — A2.3
  - [x] Gate tecnico consolidato form edificio — A2.4
  - [x] Route, pagina Nuovo edificio e dettaglio minimo — A3.1
  - [x] Accessi UI al Nuovo edificio — A3.2
  - [x] Gate tecnico consolidato routing edifici — A3.3
  - [x] Collaudo browser route e accessi edificio — A3.4
  - [x] Lista edifici reale, gate e collaudo browser — A4
  - [x] Operazioni bulk atomiche repository edifici — A5.1
  - [x] Azioni UI singole e bulk edifici — A5.2
  - [x] Gate tecnico consolidato azioni edificio — A5.3
  - [x] Collaudo browser azioni edificio — A5.4
  - [x] Dettaglio Building reale e unità collegate — A6.1
  - [x] Aggiungi unità dal Building con contesto `buildingId` — A6.2
  - [x] Modifica Building dal dettaglio — A6.3
  - [x] Lifecycle dal dettaglio Building — A6.4
  - [x] Gate tecnico consolidato A6 — A6.5
  - [x] Collaudo browser finale edifici — A7
  - [x] Integrazione automatizzata bozze e guard Nuovo edificio — F3.4
  - [x] Collaudo browser trasversale modifiche non salvate — F4
  - [x] Contratto identità catastale delle unità — B2.1
  - [x] Enforcement repository dei duplicati catastali — B2.2
  - [x] Gate tecnico consolidato duplicati unità — B2.3
  - [x] Collaudo browser duplicati unità — B2.4
  - [x] Campi canonici Unit, UI, round-trip e gate tecnico — B3.1–B3.3
  - [x] ID annidati canonici Unit, round-trip e gate tecnico — B4.1–B4.3
  - [x] Modifica e lifecycle Unit, edit, bozza/guard edit, azioni lista/dettaglio e gate tecnico consolidato — B6.1–B6.5
  - [x] Collaudo browser finale delle Unit — B9; PASS funzionale senza finding applicativi, con limitazioni strumentali su file chooser e ispezione storage interna
  - [x] Contratto Contact–Tenant, lifecycle Contact, Garanti Tenant, contatti di emergenza e gate tecnico consolidato — C1.1–C1.4
  - [x] ID annidati canonici Tenant, writer reali e round-trip completo normalization/draft/createTenant/JSON/reload — C2.1–C2.3
  - [x] Contratto identità fiscale e modello company Tenant — C3.1
  - [x] Enforcement duplicati fiscali Contact create/update, archived, exclude-current e account isolation — C3.2
  - [x] Enforcement duplicati fiscali Tenant create, mapping errori UI, info1, draft preserve e retry — C3.3
  - [x] Gate fiscale consolidato C3, legacy, empty IDs, no cross-domain Contact↔Tenant e regressioni — C3.4
  - [x] Creazione atomica Tenant account-scoped, authority unica, integrità delle relazioni e `contactId`, single-save e no partial writes — C4
  - [x] Update, edit/draft, lifecycle e gate tecnico Tenant — C5.1–C5.5
  - [x] Azioni Tenant non lifecycle, controlli future disabled, cleanup legacy e gate consolidato — C6.1–C6.2
  - [x] Collaudo browser finale Inquilini e Contatti, isolamento account e regressione teardown logout/SearchBar — C10/C10-F01
  - [ ] Copertura progressiva delle task future — **APERTO**

Baseline tecnica corrente: 113 file di test / 1288 test PASS. J1 resta parziale perché accompagna le implementazioni ancora residue. Il lint globale resta materia di J2 e non viene dedotto dai gate mirati.

- [ ] J2 — Baseline lint — **APERTO**
- [ ] J3 — Mock e file non usati — **APERTO**
- [ ] J4 — ID persistiti residui — **APERTO**
- [ ] J5 — Performance e quota locale — **APERTO**
- [ ] J6 — Accessibilità e falsi controlli — **APERTO**

## Blocco K — Audit conclusivi

- [ ] K1 — Audit statico CRUD — **FINALE**
- [ ] K2 — Collaudo browser CRUD — **FINALE**
- [ ] K3 — Audit globale azioni e route — **FINALE**
- [ ] K4 — Gate tecnico finale — **FINALE**

## Decisioni professionali ancora aperte o rinviate

### Rinviate con decisione o risposta già registrata

- [ ] [KPI-03](./decisioni-da-validare.md#kpi-03--kpi-delle-locazioni) — KPI delle locazioni — **RINVIATA; DA RIPROPORRE**
- [ ] [PA-01](./decisioni-da-validare.md#pa-01) — Catalogo futuro metodi di pagamento — **RINVIATA ALLA SEZIONE FINANZE; CATALOGO CORRENTE NON RIAPERTO**
- [ ] [PA-02](./decisioni-da-validare.md#pa-02) — Prove documentali — **RINVIATA; RISPOSTA PARZIALE GIÀ REGISTRATA**
- [ ] [PA-03](./decisioni-da-validare.md#pa-03) — Pagamenti parziali, crediti e debiti — **RINVIATA ALLA SEZIONE FINANZE**
- [ ] [PA-04](./decisioni-da-validare.md#pa-04) — Ricevute — **RINVIATA; REQUISITI PARZIALMENTE DEFINITI**
- [ ] [PA-05](./decisioni-da-validare.md#pa-05) — Tipologie documentali — **RINVIATA; DISTINZIONE MINIMA GIÀ DEFINITA**
- [ ] [PA-06](./decisioni-da-validare.md#pa-06) — Motivi override data finale — **RINVIATA; DA RIPROPORRE**

### Ancora senza risposta

- [ ] [PA-08](./decisioni-da-validare.md#pa-08) — Semantica valore IMU — **IN ATTESA DI RISPOSTA**
- [ ] [PA-09](./decisioni-da-validare.md#pa-09) — Dettaglio prezzo e spese acquisto — **IN ATTESA DI RISPOSTA**
- [ ] [PA-10](./decisioni-da-validare.md#pa-10) — Affitto prepagato — **IN ATTESA DI RISPOSTA**
- [ ] [PA-11](./decisioni-da-validare.md#pa-11) — Annullamento ricevute — **IN ATTESA DI RISPOSTA**
- [ ] [PA-12](./decisioni-da-validare.md#pa-12) — Confirmation precedente — **IN ATTESA DI RISPOSTA**
- [ ] [PA-13](./decisioni-da-validare.md#pa-13) — Rinnovo locazione — **IN ATTESA DI RISPOSTA**

## Decisioni prodotto ancora aperte

- [ ] Dashboard e navbar — **DECISIONE PRODOTTO; riferimento G5**
- [ ] Route future — **DECISIONE PRODOTTO; riferimento G6**
