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
- Completate integralmente: 8
- Parzialmente completate: 4
- Non concluse: 60
- Decisioni professionali aperte o rinviate: 13
- Di cui rinviate con risposta/decisione già registrata: 7
- Di cui ancora senza risposta: 6
- Prossimo punto tecnico: A3.3 — Gate tecnico consolidato A3

`IN ATTESA`, `FUTURO`, `RINVIATO` e `DECISIONE PRODOTTO` sono sottoinsiemi delle 60 task non concluse e non vanno sommati nuovamente. A1.1–A1.4, A2.1–A2.4, A3.1–A3.4, B1.1–B1.4, D1A/D1B, D2A–D2D e F3.1–F3.4 sono sottopunti e non aumentano il numero delle 72 task principali.

## Percorso operativo immediato

> - [x] A1.1 — Contratto dati e normalizzazione edificio — **COMPLETATA; 48 file / 686 test, build e lint positivi**
> - [x] A1.2 — Regole edificio, errori e integrità DB — **COMPLETATA; 50 file / 701 test, build e lint positivi**
> - [x] A1.3 — Repository edifici account-scoped e lifecycle — **COMPLETATA; 51 file / 715 test, build e lint positivi**
> - [x] A1.4 — Copertura automatizzata e gate tecnico A1 — **COMPLETATA; 52 file / 723 test, build e lint positivi; A1 chiusa**
> - [x] B1 — Relazione unità–edificio — **COMPLETATA; B1.1–B1.4 verificate, 57 file / 760 test, build e lint positivi; collaudo browser finale PASS**
>   - [x] B1.1 — Contratto relazione unità–edificio e mutazioni repository — **COMPLETATA; 53 file / 734 test, build e lint positivi**
>   - [x] B1.2 — Stato form e bozza della relazione Building — **COMPLETATA; 55 file / 747 test, build e lint positivi**
>   - [x] B1.3 — Nuova unità standalone e boundary relazione Building — **COMPLETATA E RIALLINEATA; 56 file / 751 test nel tree pubblicato, build e lint positivi**
>   - [x] B1.4 — Gate tecnico consolidato B1 — **COMPLETATA; 57 file / 760 test, build e lint positivi**
> - [x] A2 — Form Nuovo edificio — **COMPLETATA; A2.1–A2.4 verificate, 61 file / 815 test, build e lint positivi**
>   - [x] A2.1 — Contratto form edificio — **COMPLETATA; 58 file / 796 test, build e lint positivi**
>   - [x] A2.2 — UI completa del form edificio — **COMPLETATA; 59 file / 806 test, build e lint positivi**
>   - [x] A2.3 — Submit reale edificio — **COMPLETATA; 60 file / 812 test, build e lint positivi**
>   - [x] A2.4 — Gate tecnico consolidato A2 — **COMPLETATA; 61 file / 815 test, build e lint positivi; A2 chiusa**
> - [ ] A3 — Route e accessi edificio — **APERTO; suddiviso in A3.1–A3.4**
>   - [x] A3.1 — Route, pagina Nuovo edificio e destinazione dettaglio minima — **COMPLETATA; 62 file / 827 test, build e lint positivi**
>   - [x] A3.2 — Accessi UI al Nuovo edificio — **COMPLETATA; 63 file / 830 test, build e lint positivi**
>   - [ ] A3.3 — Gate tecnico consolidato A3 — **PROSSIMA TASK**
>   - [ ] A3.4 — Collaudo browser route e accessi — **DOPO A3.3; chiude A3**
> - [ ] A4 — Lista edifici reale — **DOPO A1/A3**
> - [ ] A5 — Azioni edificio — **DOPO A4**
> - [ ] A6 — Dettaglio e modifica edificio — **DOPO il consolidamento del flusso edificio**
> - [ ] A7 — Collaudo edifici — **DOPO A1–A6**
> - [ ] F3.4 — Integrazione bozze e guard in Nuovo edificio — **DOPO il Blocco A**
> - [ ] F4 — Collaudo trasversale delle modifiche non salvate — **DOPO F3.4**

Questa sezione mostra soltanto il percorso operativo corrente e non sostituisce stato, dipendenze e criteri di chiusura riportati nei rispettivi blocchi.

Le attività già concluse restano registrate nei rispettivi blocchi; la cronologia delle implementazioni e delle verifiche precedenti è conservata nella storia Git e non viene duplicata in una baseline separata.

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
- [ ] A3 — Route e accessi edificio — **APERTO; suddiviso in A3.1–A3.4; ED-03 validata**
  - [x] A3.1 — Route, pagina Nuovo edificio e destinazione dettaglio minima — **COMPLETATA; 62 file / 827 test, build e lint positivi**
  - [x] A3.2 — Accessi UI al Nuovo edificio — **COMPLETATA; 63 file / 830 test, build e lint positivi**
  - [ ] A3.3 — Gate tecnico consolidato A3 — **PROSSIMA TASK**
  - [ ] A3.4 — Collaudo browser route e accessi — **DOPO A3.3; chiude A3**
- [ ] A4 — Lista edifici reale — **APERTO; dipende da A1, A3**
- [ ] A5 — Azioni edificio — **APERTO; ED-05 validata; dipende da A4**
- [ ] A6 — Dettaglio e modifica edificio — **APERTO; ED-03 ed ED-05 validate**
- [ ] A7 — Collaudo edifici — **APERTO; dipende da A1–A6**

## Blocco B — Unità

- [x] B1 — Relazione unità–edificio — **COMPLETATA; relazione canonica, create standalone, draft, mutazioni repository, gate tecnico e collaudo browser verificati**
  - [x] B1.1 — Contratto relazione unità–edificio e mutazioni repository — **COMPLETATA**
  - [x] B1.2 — Stato form e bozza della relazione Building — **COMPLETATA**
  - [x] B1.3 — Nuova unità standalone e boundary relazione Building — **COMPLETATA E RIALLINEATA**
  - [x] B1.4 — Gate tecnico consolidato B1 — **COMPLETATA**
- [ ] B2 — Duplicati unità — **APERTO; UN-04 validata**
- [ ] B3 — Campi placeholder — **APERTO; UN-01, UN-02 e UN-03 validate**
- [ ] B4 — ID annidati canonici — **APERTO**
- [x] B5 — Bozza unità — **COMPLETATA; repository condiviso, salvataggio manuale, restore, guard e cleanup verificati**
- [ ] B6 — Modifica e lifecycle unità — **APERTO**
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
- [ ] F3 — Integrazioni — **APERTO; dipendenze tecniche F1/F2 soddisfatte**
  - [x] F3.1 — Nuovo inquilino — **COMPLETATA**
  - [x] F3.2 — Nuova unità — **COMPLETATA**
  - [x] F3.3 — Nuova locazione — **COMPLETATA**
  - [ ] F3.4 — Nuovo edificio, dopo il Blocco A — **APERTO**
  - [ ] Sostituire i flussi legacy residui e integrare restore/cancellazione delle bozze in Nuovo edificio — **APERTO**
  - [ ] Applicare al form residuo Nuovo edificio il contratto manuale senza debounce o autosave; Nuovo inquilino, Nuova unità e Nuova locazione sono integrati — **APERTO**
  - [ ] Test end-to-end dei form — **APERTO**
- [ ] F4 — Collaudo trasversale — **APERTO; non avviabile prima di F3.4**

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
  - [ ] Copertura progressiva delle task future — **APERTO**

Baseline verificata al termine di A3.2: 63 file, 830 test passati, 0 falliti, 0 saltati; build e lint positivi.

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
