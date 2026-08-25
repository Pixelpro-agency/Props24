# Props24 — Todo list e stato di avanzamento

## Scopo

Questa Todo list è il riepilogo operativo dello stato del progetto. [Implementazioni residue](./implementazioni.md) contiene dettaglio, dipendenze e criteri di chiusura; [Decisioni da validare](./decisioni-da-validare.md) contiene le domande professionali complete. Specifiche e codice verificato restano le fonti tecniche. La Todo non sostituisce la futura documentazione architetturale.

- [Implementazioni residue](./implementazioni.md)
- [Decisioni da validare](./decisioni-da-validare.md)
- [Fase locale prioritaria](./specifiche/fase-locale-prioritaria.md)
- [Database locale e migrazione futura](./specifiche/database-locale-e-migrazione.md)
- [Specifica Nuovo edificio](./specifiche/nuovo-edificio.md)
- [Ruoli, inviti e workspace](./specifiche/ruoli-inviti-e-workspace.md)

## Riepilogo

- Task principali: 72
- Completate integralmente: 16
- Parzialmente completate: 2
- Non concluse: 54
- Decisioni professionali aperte o rinviate: 13
- Di cui rinviate con risposta/decisione già registrata: 7
- Di cui ancora senza risposta: 6
- Prossimo punto tecnico: B3.1 — Contratto cataloghi e schema Unit

`IN ATTESA`, `FUTURO`, `RINVIATO` e `DECISIONE PRODOTTO` sono sottoinsiemi delle 54 task non concluse e non vanno sommati nuovamente.

## Percorso operativo immediato

> **NUOVO CICLO — COMPLETAMENTO LOCALE DELLE UNITÀ**
>
> Obiettivo: completare il perimetro Unit localmente implementabile consolidando campi canonici, ID annidati, modifica/lifecycle e collaudo finale. B7 — Import/Export resta rinviata e B8 — Analisi catastale resta futura/backend e non bloccano questo ciclo.
>
> Baseline applicativa di partenza: `1834fb8733341673b2f7a1421e64b47c18615a86`.
>
> Baseline tecnica: 78 file di test / 973 test passati, build positiva e lint mirato B2 positivo.
>
> - [ ] B3 — Campi canonici Unit
>   - [ ] B3.1 — Contratto cataloghi e schema Unit — **PROSSIMA TASK**
>   - [ ] B3.2 — UI e round-trip campi canonici Unit
>   - [ ] B3.3 — Gate tecnico consolidato B3
> - [ ] B4 — ID annidati canonici
>   - [ ] B4.1 — Generatore canonico e ID di documento catastale, chiavi e contratti
>   - [ ] B4.2 — ID canonici di fotografie, contatti e documenti
>   - [ ] B4.3 — Gate tecnico consolidato B4
> - [ ] B6 — Modifica e lifecycle unità
>   - [ ] B6.1 — Lifecycle repository Unit
>   - [ ] B6.2 — Route e form Modifica Unit
>   - [ ] B6.3 — Guard e bozza edit Unit
>   - [ ] B6.4 — Azioni reali lista e dettaglio Unit
>   - [ ] B6.5 — Gate tecnico consolidato B6
> - [ ] B9 — Collaudo browser finale delle Unità locali
>
> Durante il ciclo il planning non viene aggiornato dopo ogni sotto-task. Stato ed evidenze intermedie restano nei commit, nei test e nelle revisioni della Chat Analisi; Todo, implementazioni e specifiche verranno riallineate in modo organico alla chiusura del ciclo.

Le attività concluse dei cicli precedenti restano registrate nei rispettivi blocchi; cronologia, evidenze tecniche e modifiche sono conservate nella storia Git.

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
- [ ] B3 — Campi placeholder — **IN CORSO NEL NUOVO CICLO; UN-01, UN-02 e UN-03 validate**
  - [ ] B3.1 — Contratto cataloghi e schema Unit — **PROSSIMA TASK**
  - [ ] B3.2 — UI e round-trip campi canonici Unit — **APERTO**
  - [ ] B3.3 — Gate tecnico consolidato B3 — **APERTO**
- [ ] B4 — ID annidati canonici — **APERTO; pianificato nel ciclo corrente**
  - [ ] B4.1 — Generatore canonico e ID di documento catastale, chiavi e contratti — **APERTO**
  - [ ] B4.2 — ID canonici di fotografie, contatti e documenti — **APERTO**
  - [ ] B4.3 — Gate tecnico consolidato B4 — **APERTO**
- [x] B5 — Bozza unità — **COMPLETATA; repository condiviso, salvataggio manuale, restore, guard e cleanup verificati**
- [ ] B6 — Modifica e lifecycle unità — **APERTO; pianificato nel ciclo corrente**
  - [ ] B6.1 — Lifecycle repository Unit — **APERTO**
  - [ ] B6.2 — Route e form Modifica Unit — **APERTO**
  - [ ] B6.3 — Guard e bozza edit Unit — **APERTO**
  - [ ] B6.4 — Azioni reali lista e dettaglio Unit — **APERTO**
  - [ ] B6.5 — Gate tecnico consolidato B6 — **APERTO**
- [ ] B7 — Import ed export unità — **RINVIATO**
- [ ] B8 — Analisi catastale futura — **FUTURO — BACKEND**
- [ ] B9 — Collaudo unità — **APERTO; dipende dal completamento delle task precedenti del blocco**
  - [ ] B9A — Card unità: Affittate, Valore locativo, Valore patrimoniale, Guadagno lordo e Guadagno netto; Tasso di occupazione solo per futuri affitti brevi e Copertura locativa soprattutto aggregata — **FUTURO; KPI-01 e KPI-02 validate**

## Blocco C — Inquilini e contatti

- [ ] C1 — Garanti e rubrica — **PARZIALE; CT-01–CT-05 validate e riallineate**
  - [x] Porta asincrona `ContactRepository`
  - [x] Adapter locale
  - [x] Binding immutabile all’account
  - [x] Subscription account-scoped senza payload
  - [x] Provider autenticato
  - [x] Store e hook asincrono
  - [x] Garanti di Nuova locazione migrati
  - [x] Creazione persona e società tramite repository
  - [x] Protezione degli ID garanti nella bozza di Nuova locazione durante il caricamento asincrono dei contatti
  - [x] Collaudo browser
  - [x] Click-through del backdrop corretto
  - [ ] Rimuovere dipendenze residue da `existingContacts` e mock — **APERTO**
  - [ ] Migrare i consumer contatti di Nuovo inquilino — **APERTO**
  - [ ] Completare rubrica e lifecycle dei contatti — **APERTO**
  - [ ] Consolidare il modello canonico tra inquilini e locazioni — **APERTO**
  - [ ] Gestire contatti di emergenza, duplicati e record orfani — **APERTO**
  - [ ] Integrare CT-01–CT-05, casi esteri italiani e hard block account-scoped — **DECISIONI VALIDATE**
- [ ] C2 — ID annidati — **APERTO**
- [ ] C3 — Duplicati anagrafici — **APERTO; CT-01–CT-05 validate**
- [ ] C4 — Creazione atomica — **APERTO; dipende da C1–C3**
- [ ] C5 — Modifica e lifecycle — **APERTO**
- [ ] C6 — Azioni lista ancora simulate — **DECISIONE PRODOTTO**
- [ ] C7 — Inviti email — **FUTURO — BACKEND**
- [ ] C8 — Allegati delle bozze — **FUTURO — STORAGE**
- [ ] C9 — Verifica documentale/OCR — **FUTURO — BACKEND**
- [ ] C10 — Collaudo inquilini — **APERTO; dipende dal completamento del blocco**
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
- [ ] G2 — Integrare l’inventario route nella documentazione tecnica — **APERTO; dipende da G1 e confluisce in L2**
- [ ] G3 — Edifici, unità e inquilini — **DECISIONE PRODOTTO**
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
  - [ ] Copertura progressiva delle task future — **APERTO**

Baseline tecnica del Blocco A: 73 file, 902 test passati, 0 falliti, 0 saltati; build e lint positivi; collaudo browser A7 PASS senza finding.

Baseline tecnica corrente post-B2: 78 file, 973 test passati; build positiva; lint mirato B2 positivo. B2.3 ha chiuso il gate tecnico consolidato con tutti i 37 requisiti coperti e B2.4 ha concluso il browser QA con PASS senza finding applicativi. Il lint globale non è stato rieseguito nel ciclo B2; l'ultimo rilievo storico resta 40 errori e 15 warning fuori scope e non costituisce una nuova baseline finché J2 non eseguirà l'audit lint dedicato.

Collaudo browser F4: PASS senza finding; create Building, Unit, Tenant e Lease verificati con route, back, annulla, logout, refresh/persistenza, bozze, Resta, Abbandona, submit riuscito e fallito. F4-10 resta una limitazione strumentale relativa alla mancata osservabilità del dialog nativo beforeunload, senza evidenza di difetto applicativo.

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

## Blocco L — Documentazione tecnica

- [ ] L1 — Acquisizione modello — **IN ATTESA dei documenti modello dell’altro progetto**
- [ ] L2 — Documentazione Props24 — **FUTURO**
  - [ ] Entrypoint e composizione dell’app — **FUTURO**
  - [ ] Struttura delle cartelle e ownership dei moduli — **FUTURO**
  - [ ] Route e navigazione — **FUTURO**
  - [ ] API, fetch e integrazioni esterne — **FUTURO**
  - [ ] Database locale e storage — **FUTURO**
  - [ ] Porte, repository e adapter — **FUTURO**
  - [ ] Subscription e flussi di aggiornamento — **FUTURO**
  - [ ] Autenticazione e isolamento account — **FUTURO**
  - [ ] Lifecycle dei quattro CRUD — **FUTURO**
  - [ ] Documenti e pagamenti — **FUTURO**
  - [ ] Contratti e invarianti da preservare — **FUTURO**
  - [ ] Test e comandi di verifica — **FUTURO**
  - [ ] Estensione futura PostgreSQL/Supabase — **FUTURO**
- [ ] L3 — README — **FUTURO**
- [ ] L4 — README database — **FUTURO**

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

- [ ] Azioni lista inquilini — **DECISIONE PRODOTTO; riferimento C6/G3**
- [ ] Azioni edificio, unità e inquilini — **DECISIONE PRODOTTO; riferimento G3**
- [ ] Dashboard e navbar — **DECISIONE PRODOTTO; riferimento G5**
- [ ] Route future — **DECISIONE PRODOTTO; riferimento G6**
