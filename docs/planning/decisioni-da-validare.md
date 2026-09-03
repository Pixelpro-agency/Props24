# Props24 — Decisioni da validare con i professionisti

- [Todo list e stato di avanzamento](./todo-list.md)
- [Implementazioni residue](./implementazioni.md)

Questo registro contiene le decisioni professionali ancora aperte o rinviate e le decisioni già validate che influenzano task non ancora concluse. Le decisioni ormai assorbite integralmente da implementazioni e specifiche vengono rimosse dal registro operativo.

## Decisioni aperte o rinviate

### KPI-03 — KPI delle locazioni
- Area: KPI locazioni
- Destinatario: agente immobiliare, amministratore o consulente
- Domanda: Per le card delle locazioni, cosa deve rappresentare esattamente “Canoni di affitto” e “Depositi cauzionali”? Per i Canoni di affitto bisogna mostrare il totale contrattualmente dovuto, quello effettivamente incassato oppure entrambi, e su quale periodo? Per i Depositi cauzionali bisogna mostrare l'importo previsto dal contratto, quello effettivamente ricevuto oppure entrambi?
- Perché serve: rendere esplicita la base temporale e distinguere valori contrattuali da incassi reali.
- Task bloccate o influenzate: card KPI locazioni.
- Checklist collegata: D3A
- Stato: aperta, rinviata; da riproporre
- Risposta: decisione rinviata
- Data validazione: —

### PA-01
- Area: pagamenti
- Destinatario: commercialista o consulente
- Domanda: I metodi correnti `Bonifico`, `Contanti`, `Assegno`, `Carta` e `Addebito` restano validi per le funzioni implementate. Dopo lo sviluppo di Finanze / Registra un pagamento, il catalogo dovrà essere mantenuto, modificato o ampliato?
- Perché serve: definire il catalogo.
- Task bloccate o influenzate: catalogo futuro dei metodi di pagamento nella sezione Finanze.
- Checklist collegata: futura sezione Finanze
- Stato: aperta, rinviata alla sezione Finanze
- Risposta: decisione sul catalogo futuro rinviata; il catalogo corrente non è riaperto
- Data validazione: —

### PA-02
- Area: prove di pagamento
- Destinatario: commercialista o consulente
- Domanda: Quali prove o documenti renderanno ufficiale un pagamento nella futura sezione Finanze/documenti?
- Perché serve: definire requisiti futuri.
- Task bloccate o influenzate: allegati e documenti pagamento.
- Checklist collegata: I4
- Stato: aperta, rinviata
- Risposta: la ricevuta è una delle prove da considerare; catalogo, requisiti e comportamento definitivi restano da decidere
- Data validazione: —

### PA-03
- Area: pagamenti complessi
- Destinatario: commercialista o consulente
- Domanda: Come saranno gestiti pagamenti parziali, crediti e debiti?
- Perché serve: definire il modello futuro.
- Task bloccate o influenzate: pagamenti successivi alla prima fase.
- Checklist collegata: I5
- Stato: aperta, rinviata alla sezione Finanze
- Risposta: pagamenti parziali, crediti e debiti saranno definiti in quella fase; Rentila sarà soltanto un riferimento funzionale da analizzare
- Data validazione: —

### PA-04
- Area: ricevute
- Destinatario: commercialista o consulente
- Domanda: Quando e con quale flusso sarà prodotta una ricevuta?
- Perché serve: definire il servizio documentale.
- Task bloccate o influenzate: generazione ricevute.
- Checklist collegata: I4
- Stato: aperta, rinviata
- Risposta: sono già noti locatore, conduttore, importo, data e tipologia/metodo di pagamento; momento, flusso, automatismi e ulteriori requisiti restano da decidere
- Data validazione: —

### PA-05
- Area: documenti fiscali
- Destinatario: commercialista o consulente
- Domanda: Quali tipologie documentali e regole fiscali saranno applicate ai pagamenti?
- Perché serve: evitare classificazioni improprie.
- Task bloccate o influenzate: documenti pagamento.
- Checklist collegata: I4
- Stato: aperta, rinviata
- Risposta: il futuro sistema distinguerà almeno Ricevuta, Fattura, Quietanza e Allegato del pagamento; non è decisa una regola automatica privato/società
- Data validazione: —

### PA-06
- Area: locazioni
- Destinatario: commercialista o consulente
- Domanda: Quando una locazione termina in data diversa da quella contrattuale e l'utente forza la data finale, il catalogo corrente `Decesso`, `Sequestro o provvedimento dell'autorità`, `Sfratto`, `Altro` è sufficiente o va ampliato?
- Perché serve: ampliare il catalogo minimo approvato.
- Task bloccate o influenzate: override data finale.
- Checklist collegata: D1B, D3
- Stato: aperta, rinviata; da riproporre
- Risposta: decisione e implementazione rinviate; il catalogo corrente non è dichiarato definitivo
- Data validazione: —

### PA-08
- Area: edifici
- Destinatario: commercialista o consulente
- Domanda: Il valore IMU rappresenta importo annuale, rata, previsione o costo storico?
- Perché serve: definire semantica e UI.
- Task bloccate o influenzate: informazioni finanziarie edificio.
- Checklist collegata: futura semantica finanziaria degli edifici
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### PA-09
- Area: acquisto edificio
- Destinatario: commercialista o consulente
- Domanda: Prezzo e spese di acquisto richiedono separazione IVA, imposte o costi accessori?
- Perché serve: definire il modello finanziario.
- Task bloccate o influenzate: informazioni finanziarie edificio.
- Checklist collegata: futura semantica finanziaria degli edifici
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### PA-10
- Area: affitto prepagato
- Destinatario: commercialista o consulente
- Domanda: Come deve essere rappresentato e contabilizzato l’affitto prepagato e come deve incidere su rate, ricavi, saldi e rinnovi?
- Perché serve: definire la semantica di D2D e impedire doppi ricavi o rate incoerenti.
- Task bloccate o influenzate: D2D, D3, I5.
- Checklist collegata: D2D, D3, I5
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### PA-11
- Area: annullamento ricevute
- Destinatario: commercialista o consulente
- Domanda: Quando un pagamento torna non pagato, il numero di ricevuta precedente deve essere conservato come annullato, invalidato oppure rimosso?
- Perché serve: preservare audit e numerazione senza dichiarare valida una ricevuta revocata.
- Task bloccate o influenzate: D2D, D3, I4.
- Checklist collegata: D2D, D3, I4
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### PA-12
- Area: conferma precedente
- Destinatario: commercialista o consulente
- Domanda: Quando un pagamento torna non pagato, la `confirmation` precedente deve essere conservata come storico, invalidata oppure rimossa?
- Perché serve: definire audit e comportamento del record.
- Task bloccate o influenzate: D2D, D3.
- Checklist collegata: D2D, D3
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### PA-13
- Area: rinnovo locazione
- Destinatario: commercialista o consulente
- Domanda: Come deve comportarsi il rinnovo rispetto a rate future, affitto prepagato, deposito, storico e numerazione documentale?
- Perché serve: impedire duplicazioni e modifiche retroattive.
- Task bloccate o influenzate: D3.
- Checklist collegata: D3
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

## Decisioni validate

### UN-02
- Area: unità
- Destinatario: agente immobiliare o amministratore
- Domanda: Quali periodicità di pagamento devono essere supportate?
- Perché serve: definire il catalogo canonico.
- Task bloccate o influenzate: periodicità forfettaria futura delle locazioni.
- Checklist collegata: I10
- Stato: validata
- Risposta: catalogo canonico esatto: Mensile, Trimestrale, Semestrale, Annuale.
- Data validazione: 2026-08-14

### AC-01 — Codice fiscale account Props24
- Area: account, identità e workspace
- Destinatario: agente immobiliare, amministratore o responsabile account
- Domanda: Il codice fiscale dell'account Props24 è obbligatorio alla registrazione e quale unicità deve avere se inserito?
- Perché serve: distinguere l'identità dell'account dalla politica duplicati di tenant e contatti e impedire il riuso dello stesso CF fra account.
- Task bloccate o influenzate: registrazione account, identità e workspace.
- Checklist collegata: H1, H2
- Stato: validata
- Risposta: il CF non è obbligatorio durante la registrazione iniziale dell'account. Se inserito successivamente è globalmente univoco fra account Props24 e un secondo account con lo stesso CF viene bloccato. La regola è separata dai duplicati tenant/contatti, che sono account-scoped.
- Data validazione: 2026-08-14

### KPI-01 — Valori e redditività delle unità
- Area: KPI unità
- Destinatario: agente immobiliare, amministratore o consulente
- Domanda: Quali fonti e basi temporali devono essere usate per valore locativo, valore patrimoniale, redditività lorda e redditività netta?
- Perché serve: chiarire mensile o annuale; canone richiesto, contrattuale o incassato; prezzo d’acquisto, valore dichiarato o stima; spese comprese nel netto; trattamento dei dati mancanti e delle unità non locate.
- Task bloccate o influenzate: card KPI unità.
- Checklist collegata: B9A
- Stato: validata
- Risposta: valore locativo manuale come canone ragionevolmente producibile; valore patrimoniale come prezzo/valore di acquisizione, senza stime o rivalutazioni automatiche. Guadagno lordo = canoni effettivamente incassati nel periodo, esclusi dovuti non pagati e depositi. Guadagno netto = lordo − tasse − costi realmente disponibili e utilizzabili; non creare campi. L'audit conferma pagamenti/spese operative, IVA contrattuale e costi di acquisizione/agenzia, da usare solo se semanticamente pertinenti. Dato assente non equivale a zero; calcolo sui dati disponibili con indicazione `Dati incompleti`. Selettore comune: Ultimo mese, Anno corrente (default 1 gennaio–oggi), Ultimi 12 mesi, Dall'inizio; nessuna proiezione. Le card mostrano valore principale, dovuto/incassato/scaduto o lordo/tasse/costi, periodo e incompletezza. Fuori scope: ROI, yield, reminder, fonti esterne e nuovi costi.
- Data validazione: 2026-08-14

### KPI-02 — Tasso di occupazione
- Area: KPI unità
- Destinatario: agente immobiliare, amministratore o consulente
- Domanda: Il tasso di occupazione deve essere istantaneo oppure ponderato sui giorni del periodo selezionato?
- Perché serve: chiarire periodo annuale o selezionabile, unità archiviate o indisponibili, giorni coperti da locazioni, sovrapposizioni e unità create durante il periodo.
- Task bloccate o influenzate: card KPI unità.
- Checklist collegata: B9A
- Stato: validata
- Risposta: affitti brevi: Tasso di occupazione = giorni occupati/giorni disponibili, senza implementare ora prenotazioni. Locazioni tradizionali: Copertura locativa del periodo, soprattutto aggregata; non è card standard della Scrivania o della singola unità. Futuro possibile widget/KPI di portafoglio, senza soglie o automatismi privato/società decisi ora.
- Data validazione: 2026-08-14

### PA-07
- Area: audit
- Destinatario: commercialista o consulente
- Domanda: Per quanto tempo deve essere conservato lo storico immutabile delle modifiche?
- Perché serve: definire retention e conformità.
- Task bloccate o influenzate: storico append-only.
- Checklist collegata: D1B, K1
- Stato: validata
- Risposta: lo storico append-only è conservato a tempo indefinito, senza scadenza automatica.
- Data validazione: 2026-08-14