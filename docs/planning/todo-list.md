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
- Completate integralmente: 5
- Parzialmente completate: 4
- Non concluse: 63
- Domande professionali aperte: 26
- Prossimo punto: F3.3 — Nuova locazione

`IN ATTESA`, `FUTURO`, `RINVIATO` e `DECISIONE PRODOTTO` sono sottoinsiemi delle 63 task non concluse e non vanno sommati nuovamente. D1A/D1B, D2A–D2D e F3.1–F3.4 sono sottopunti e non aumentano il numero delle 72 task principali.

## Percorso operativo immediato

> - [x] F1 — Repository condiviso delle bozze manuali — **COMPLETATA**
> - [x] F2 — Guard condiviso delle modifiche non salvate — **COMPLETATA**
> - [x] PRODUCT-ALIGNMENT-DOC-1 — Allineamento prodotto documentato — **COMPLETATO; nessuna funzione implementata**
> - [x] F3.1 — Integrazione in Nuovo inquilino — **COMPLETATA**
> - [x] F3.2 — Integrazione in Nuova unità — **COMPLETATA**
> - [ ] F3.3 — Integrazione in Nuova locazione — **PROSSIMA TASK TECNICA; audit ancora necessario**
> - [ ] F3.4 — Integrazione in Nuovo edificio — **APERTA; dipende dal Blocco A**
> - [ ] A1/A2 — Repository e form Nuovo edificio — **IN ATTESA delle decisioni indicate**
> - [ ] A4–A7 — Lista, lifecycle e collaudo edifici — **APERTO**
> - [ ] K1/K2 — Audit e collaudo trasversale dei quattro CRUD — **FINALE**

Questa sezione è un percorso sintetico e non sostituisce le voci complete dei blocchi.
La prossima task tecnica è F3.3 — Nuova locazione. F3 resta aperta fino alle
integrazioni residue; F4 non può iniziare prima di F3.3 e F3.4. Inviti, portale
inquilino, workspace professionali, visure e KPI restano attività future.

## Baseline trasversale già raggiunta

- [x] Workflow Chat Analisi / Desktop consolidato
- [x] Specifiche della fase locale prioritaria consolidate
- [x] Specifica Nuovo edificio consolidata
- [x] Infrastruttura Vitest introdotta
- [x] Calcolo automatico sicuro della data finale
- [x] D2A — Rate generate senza incasso automatico
- [x] D2B — Conferma manuale completa dei pagamenti
- [x] D2C — Repair, migrazione e consumer finanziari conservativi
- [x] Pilot repository `contacts`
- [x] Isolamento account e subscription `contacts`
- [x] Provider, store e hook asincrono `contacts`
- [x] Consumer garanti di Nuova locazione migrati
- [x] QA browser del pilot `contacts`
- [x] Click-through del backdrop corretto e ricollaudato
- [x] Pianificazione aggiornata dopo il pilot
- [x] F1 — Infrastruttura condivisa e account-scoped del repository bozze
- [x] F2 — Data Router, macchina a stati, hook, dialog accessibile e gate logout
- [x] F3.1 — Bozza manuale e guard integrati e collaudati in Nuovo inquilino
- [x] F3.2 — Bozza manuale e guard integrati e collaudati in Nuova unità

Questa baseline non rientra nel conteggio delle 72 task principali.

## Blocco A — Edifici

- [x] A0 — Specifica Nuovo edificio — **COMPLETATA**
- [ ] A1 — Repository edifici — **IN ATTESA: ED-01, ED-02**
- [ ] A2 — Form Nuovo edificio — **IN ATTESA: ED-06, ED-07, PA-08, PA-09; ED-04 validata; dipende da A1, F1, F2**
- [ ] A3 — Route e accessi edificio — **APERTO; ED-03 validata; dipende da A2**
- [ ] A4 — Lista edifici reale — **APERTO; dipende da A1, A3**
- [ ] A5 — Azioni edificio — **APERTO; ED-05 validata; dipende da A4**
- [ ] A6 — Dettaglio e modifica edificio — **APERTO; ED-03 ed ED-05 validate**
- [ ] A7 — Collaudo edifici — **APERTO; dipende da A1–A6**

## Blocco B — Unità

- [ ] B1 — Relazione unità–edificio — **APERTO; dipende da A1**
- [ ] B2 — Duplicati unità — **APERTO; influenzato da UN-04**
- [ ] B3 — Campi placeholder — **IN ATTESA: UN-01, UN-02, UN-03**
- [ ] B4 — ID annidati canonici — **APERTO**
- [x] B5 — Bozza unità — **COMPLETATA; repository condiviso, salvataggio manuale, restore, guard e cleanup verificati**
- [ ] B6 — Modifica e lifecycle unità — **APERTO**
- [ ] B7 — Import ed export unità — **RINVIATO**
- [ ] B8 — Analisi catastale futura — **FUTURO — BACKEND**
- [ ] B9 — Collaudo unità — **APERTO; dipende dal completamento delle task precedenti del blocco**
  - [ ] B9A — Sei card unità: Affittate, Valore locativo, Valore patrimoniale, Redditività lorda, Redditività netta e Tasso di occupazione — **FUTURO; in attesa di KPI-01 e KPI-02**

## Blocco C — Inquilini e contatti

- [ ] C1 — Garanti e rubrica — **PARZIALE; CT-01, CT-02 e CT-05 validate; CT-03 e CT-04 aperte**
  - [x] Porta asincrona `ContactRepository`
  - [x] Adapter locale
  - [x] Binding immutabile all’account
  - [x] Subscription account-scoped senza payload
  - [x] Provider autenticato
  - [x] Store e hook asincrono
  - [x] Garanti di Nuova locazione migrati
  - [x] Creazione persona e società tramite repository
  - [x] Protezione degli ID garanti nella bozza legacy di Nuova locazione durante il caricamento asincrono dei contatti
  - [x] Collaudo browser
  - [x] Click-through del backdrop corretto
  - [ ] Rimuovere dipendenze residue da `existingContacts` e mock — **APERTO**
  - [ ] Migrare i consumer contatti di Nuovo inquilino — **APERTO**
  - [ ] Completare rubrica e lifecycle dei contatti — **APERTO**
  - [ ] Consolidare il modello canonico tra inquilini e locazioni — **APERTO**
  - [ ] Gestire contatti di emergenza, duplicati e record orfani — **APERTO**
  - [ ] Integrare CT-01, CT-02 e CT-05 — **DECISIONI VALIDATE**
  - [ ] Definire casi esteri e politica duplicati — **IN ATTESA: CT-03, CT-04**
- [ ] C2 — ID annidati — **APERTO**
- [ ] C3 — Duplicati anagrafici — **IN ATTESA: CT-03, CT-04; CT-01, CT-02 e CT-05 validate**
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
  - [ ] D1B — Override motivato e storico append-only — **APERTO; influenzato da PA-06, PA-07**
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
  - [ ] F3.3 — Nuova locazione — **PROSSIMA TASK TECNICA; audit ancora necessario**
  - [ ] F3.4 — Nuovo edificio, dopo il Blocco A — **APERTO**
  - [ ] Sostituire i flussi legacy residui e integrare restore/cancellazione
        delle bozze in Nuova locazione e Nuovo edificio — **APERTO**
  - [ ] Applicare ai form residui il contratto manuale senza debounce o autosave — **APERTO**
  - [ ] Test end-to-end dei form — **APERTO**
- [ ] F4 — Collaudo trasversale — **APERTO; non avviabile prima di F3.3 e F3.4**

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
  - [ ] H2A — Portale inquilino invitato
  - [ ] H2B — Account multi-ruolo e workspace
  - [ ] H2C — Gestione professionale e deleghe
- [ ] H3 — Storage documentale — **FUTURO — STORAGE/BACKEND**

## Blocco I — Automazioni e servizi documentali

- [ ] I1 — Indici ISTAT aggiornabili — **FUTURO — BACKEND**
- [ ] I2 — Generazione programmata e avvisi — **FUTURO — BACKEND**
- [ ] I3 — Aggiornamento canone — **FUTURO — BACKEND**
- [ ] I4 — Ricevute, fatture e numerazione — **FUTURO — BACKEND; influenzato da PA-02, PA-04, PA-05, PA-11**
- [ ] I5 — Riporto saldo, conguagli e riconciliazione — **FUTURO — BACKEND; influenzato da PA-03, PA-10**
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
  - [ ] Copertura progressiva delle task future — **APERTO**

Baseline verificata al termine di F3.2: 38 file, 549 test passati, 0 falliti, 0 saltati.

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

## Decisioni professionali ancora aperte

- [ ] [ED-01](./decisioni-da-validare.md#ed-01) — Unicità identificativo edificio — **IN ATTESA**
- [ ] [ED-02](./decisioni-da-validare.md#ed-02) — Edifici distinti allo stesso indirizzo — **IN ATTESA**
- [ ] [ED-06](./decisioni-da-validare.md#ed-06) — Somma obbligatoria dei millesimi — **IN ATTESA**
- [ ] [ED-07](./decisioni-da-validare.md#ed-07) — Significato dei millesimi — **IN ATTESA**
- [ ] [UN-01](./decisioni-da-validare.md#un-01) — Tipi di locazione dell’unità — **IN ATTESA**
- [ ] [UN-02](./decisioni-da-validare.md#un-02) — Periodicità di pagamento — **IN ATTESA**
- [ ] [UN-03](./decisioni-da-validare.md#un-03) — Classi energetiche — **IN ATTESA**
- [ ] [UN-04](./decisioni-da-validare.md#un-04) — Unità estere o senza catasto completo — **IN ATTESA**
- [ ] [CT-03](./decisioni-da-validare.md#ct-03) — Anagrafiche estere — **IN ATTESA**
- [ ] [CT-04](./decisioni-da-validare.md#ct-04) — Gestione duplicati anagrafici — **IN ATTESA**
- [ ] [PA-01](./decisioni-da-validare.md#pa-01) — Catalogo metodi di pagamento — **IN ATTESA**
- [ ] [PA-02](./decisioni-da-validare.md#pa-02) — Prove ufficiali del pagamento — **IN ATTESA**
- [ ] [PA-03](./decisioni-da-validare.md#pa-03) — Pagamenti parziali, crediti e debiti — **IN ATTESA**
- [ ] [PA-04](./decisioni-da-validare.md#pa-04) — Produzione e contenuto ricevuta — **IN ATTESA**
- [ ] [PA-05](./decisioni-da-validare.md#pa-05) — Tipi di documenti fiscali — **IN ATTESA**
- [ ] [PA-06](./decisioni-da-validare.md#pa-06) — Motivi override data finale — **IN ATTESA**
- [ ] [PA-07](./decisioni-da-validare.md#pa-07) — Retention dello storico — **IN ATTESA**
- [ ] [PA-08](./decisioni-da-validare.md#pa-08) — Semantica valore IMU — **IN ATTESA**
- [ ] [PA-09](./decisioni-da-validare.md#pa-09) — Dettaglio prezzo e spese acquisto — **IN ATTESA**
- [ ] [PA-10](./decisioni-da-validare.md#pa-10) — Affitto prepagato — **IN ATTESA**
- [ ] [PA-11](./decisioni-da-validare.md#pa-11) — Annullamento ricevute — **IN ATTESA**
- [ ] [PA-12](./decisioni-da-validare.md#pa-12) — Confirmation precedente — **IN ATTESA**
- [ ] [PA-13](./decisioni-da-validare.md#pa-13) — Rinnovo locazione — **IN ATTESA**
- [ ] [KPI-01](./decisioni-da-validare.md#kpi-01--valori-e-redditività-delle-unità) — Valori e redditività delle unità — **IN ATTESA**
- [ ] [KPI-02](./decisioni-da-validare.md#kpi-02--tasso-di-occupazione) — Tasso di occupazione — **IN ATTESA**
- [ ] [KPI-03](./decisioni-da-validare.md#kpi-03--kpi-delle-locazioni) — KPI delle locazioni — **IN ATTESA**

## Decisioni prodotto ancora aperte

- [ ] Azioni lista inquilini — **DECISIONE PRODOTTO; riferimento C6/G3**
- [ ] Azioni edificio, unità e inquilini — **DECISIONE PRODOTTO; riferimento G3**
- [ ] Dashboard e navbar — **DECISIONE PRODOTTO; riferimento G5**
- [ ] Route future — **DECISIONE PRODOTTO; riferimento G6**
