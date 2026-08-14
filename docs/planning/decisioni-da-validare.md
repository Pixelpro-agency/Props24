# Props24 — Decisioni da validare con i professionisti

Questo registro contiene le questioni ancora aperte e, nella sezione finale, le decisioni validate. Per le voci aperte: Stato `aperta`, Risposta `non ancora fornita`, Data validazione `—`.

- [Todo list e stato di avanzamento](./todo-list.md)
- [Implementazioni residue](./implementazioni.md)

Il registro contiene le domande complete e resta l’unico luogo in cui registrarne la risposta. La Todo ne mostra soltanto l’impatto sintetico e viene aggiornata dopo ogni validazione.

## Agente immobiliare o amministratore

### ED-01

- Area: edifici
- Destinatario: agente immobiliare o amministratore
- Domanda: L'identificativo dell'edificio deve essere univoco per account?
- Perché serve: definire vincolo e gestione duplicati.
- Task bloccate o influenzate: repository e form edificio.
- Checklist collegata: A1, A2
- Stato: aperta
- Risposta: si
- Data validazione: —

### ED-02
- Area: edifici
- Destinatario: agente immobiliare o amministratore
- Domanda: Sono ammessi più edifici distinti con lo stesso indirizzo?
- Perché serve: evitare falsi duplicati.
- Task bloccate o influenzate: repository edifici.
- Checklist collegata: A1
- Stato: aperta
- Risposta: no, vanno collegati in base al civico
- Data validazione: —

### ED-06
- Area: criteri di ripartizione
- Destinatario: agente immobiliare o amministratore
- Domanda: La somma dei millesimi deve essere obbligatoriamente 1.000?
- Perché serve: definire la validazione.
- Task bloccate o influenzate: criteri di ripartizione.
- Checklist collegata: A2
- Stato: aperta
- Risposta: eliminiamo dal progetto questa logica
- Data validazione: —

### ED-07
- Area: millesimi
- Destinatario: agente immobiliare o amministratore
- Domanda: I millesimi della scheda Unità e quelli dei criteri di ripartizione hanno significati differenti e devono essere entrambi conservati?
- Perché serve: evitare perdita o duplicazione semantica.
- Task bloccate o influenzate: schema edificio.
- Checklist collegata: A2
- Stato: aperta
- Risposta: idem come sopra
- Data validazione: —

### UN-01
- Area: unità
- Destinatario: agente immobiliare o amministratore
- Domanda: Quali valori definitivi deve avere il tipo di locazione dell'unità?
- Perché serve: definire il catalogo canonico.
- Task bloccate o influenzate: campi unità.
- Checklist collegata: B3
- Stato: aperta
- Risposta: risultanze catastali(foglio, particella, subalterno, rendita catastale, categoria catastale)
- Data validazione: —

### UN-02
- Area: unità
- Destinatario: agente immobiliare o amministratore
- Domanda: Quali periodicità di pagamento devono essere supportate?
- Perché serve: definire il catalogo canonico.
- Task bloccate o influenzate: campi unità e locazioni.
- Checklist collegata: B3, I10
- Stato: aperta
- Risposta: mensile, trimestrale, semestrale, annuale
- Data validazione: —

### UN-03
- Area: unità
- Destinatario: agente immobiliare o amministratore
- Domanda: Quali valori e casi speciali deve supportare la classe energetica?
- Perché serve: validazione e normalizzazione.
- Task bloccate o influenzate: campi unità.
- Checklist collegata: B3
- Stato: aperta
- Risposta: nessun caso speciale
- Data validazione: —

### UN-04
- Area: catasto
- Destinatario: agente immobiliare o amministratore
- Domanda: Come gestire unità estere o prive di dati catastali completi?
- Perché serve: definire edge case e duplicati.
- Task bloccate o influenzate: repository unità.
- Checklist collegata: B2
- Stato: aperta
- Risposta: unita estera eliminiamo la logica dal progetto, privi di dati catastali completi=
- Data validazione: —

### CT-03
- Area: anagrafiche estere
- Destinatario: agente immobiliare o amministratore
- Domanda: Come gestire persone e società estere prive di identificativi italiani?
- Perché serve: definire eccezioni valide.
- Task bloccate o influenzate: form e repository inquilini.
- Checklist collegata: C1, C3, C4, C10
- Stato: aperta
- Risposta: ci sono identificativi che riguardano la burocrazia (spiegare meglio)
- Data validazione: —

### CT-04
- Area: duplicati anagrafici
- Destinatario: agente immobiliare o amministratore
- Domanda: Un duplicato anagrafico deve essere bloccato oppure ammesso dopo conferma?
- Perché serve: definire la mutazione.
- Task bloccate o influenzate: repository inquilini.
- Checklist collegata: C1, C3, C4, C10
- Stato: aperta
- Risposta: no, ultima verifica il codice fiscale
- Data validazione: —

### KPI-01 — Valori e redditività delle unità
- Area: KPI unità
- Destinatario: agente immobiliare, amministratore o consulente
- Domanda: Quali fonti e basi temporali devono essere usate per valore locativo, valore patrimoniale, redditività lorda e redditività netta?
- Perché serve: chiarire mensile o annuale; canone richiesto, contrattuale o incassato; prezzo d’acquisto, valore dichiarato o stima; spese comprese nel netto; trattamento dei dati mancanti e delle unità non locate.
- Task bloccate o influenzate: card KPI unità.
- Checklist collegata: B9A
- Stato: aperta
- Risposta: la fonte è il proprietario e/o saranno esterne al progetto
- Data validazione: —

### KPI-02 — Tasso di occupazione
- Area: KPI unità
- Destinatario: agente immobiliare, amministratore o consulente
- Domanda: Il tasso di occupazione deve essere istantaneo oppure ponderato sui giorni del periodo selezionato?
- Perché serve: chiarire periodo annuale o selezionabile, unità archiviate o indisponibili, giorni coperti da locazioni, sovrapposizioni e unità create durante il periodo.
- Task bloccate o influenzate: card KPI unità.
- Checklist collegata: B9A
- Stato: aperta
- Risposta: valido solo per affitti brevi, oppure segnalere tasso di occupaziona ma riferito ad affitti(non brevi)
- Data validazione: —

### KPI-03 — KPI delle locazioni
- Area: KPI locazioni
- Destinatario: agente immobiliare, amministratore o consulente
- Domanda: La card Canoni di affitto deve mostrare importo mensile, annualizzato o relativo al periodo selezionato, e la card Depositi cauzionali deve mostrare importi contrattuali oppure effettivamente incassati?
- Perché serve: rendere esplicita la base temporale e distinguere valori contrattuali da incassi reali.
- Task bloccate o influenzate: card KPI locazioni.
- Checklist collegata: D3A
- Stato: aperta
- Risposta: devi spiegarmela meglio
- Data validazione: —

## Commercialista o consulente

### PA-01
- Area: pagamenti
- Destinatario: commercialista o consulente
- Domanda: Il catalogo locale corrente comprende bonifico, contanti, assegno, carta e addebito. Può essere considerato definitivo oppure deve essere modificato o ampliato?
- Perché serve: definire il catalogo.
- Task bloccate o influenzate: conferma pagamento.
- Checklist collegata: D2
- Stato: aperta
- Risposta: è una sezione del progetto non sviluppata (vedere sezione finanze/registra un pagamento)
- Data validazione: —

### PA-02
- Area: prove di pagamento
- Destinatario: commercialista o consulente
- Domanda: Quali prove documentali rendono ufficiale un pagamento?
- Perché serve: definire requisiti futuri.
- Task bloccate o influenzate: allegati e documenti pagamento.
- Checklist collegata: I4
- Stato: aperta
- Risposta: lo facciamo piu avanti nel progetto, cmq ricevuta 
- Data validazione: —

### PA-03
- Area: pagamenti complessi
- Destinatario: commercialista o consulente
- Domanda: Come gestire in futuro pagamenti parziali, crediti e debiti?
- Perché serve: definire il modello futuro.
- Task bloccate o influenzate: pagamenti successivi alla prima fase.
- Checklist collegata: D2D, I5
- Stato: aperta
- Risposta: copiamo rentila (sezione finanze)
- Data validazione: —

### PA-04
- Area: ricevute
- Destinatario: commercialista o consulente
- Domanda: Quando deve essere prodotta una ricevuta e quali dati obbligatori deve contenere?
- Perché serve: definire il servizio documentale.
- Task bloccate o influenzate: generazione ricevute.
- Checklist collegata: I4
- Stato: aperta
- Risposta: avere dati locatore e conduttore, importo e data e tipologia di pagamento
- Data validazione: —

### PA-05
- Area: documenti fiscali
- Destinatario: commercialista o consulente
- Domanda: Come distinguere ricevuta, fattura, quietanza e semplice allegato del pagamento?
- Perché serve: evitare classificazioni improprie.
- Task bloccate o influenzate: documenti pagamento.
- Checklist collegata: I4
- Stato: aperta
- Risposta: se proprietario fa ricevuta, se societa fa fattura (spiegamela meglio)
- Data validazione: —

### PA-06
- Area: locazioni
- Destinatario: commercialista o consulente
- Domanda: Quali motivi aggiuntivi devono essere presenti nell'override della data finale?
- Perché serve: ampliare il catalogo minimo approvato.
- Task bloccate o influenzate: override data finale.
- Checklist collegata: D1B, D3
- Stato: aperta
- Risposta: spiegamela meglio
- Data validazione: —

### PA-07
- Area: audit
- Destinatario: commercialista o consulente
- Domanda: Per quanto tempo deve essere conservato lo storico immutabile delle modifiche?
- Perché serve: definire retention e conformità.
- Task bloccate o influenzate: storico append-only.
- Checklist collegata: D1B, K1
- Stato: aperta
- Risposta: teniamole a tempo indefinito
- Data validazione: —

### PA-08
- Area: edifici
- Destinatario: commercialista o consulente
- Domanda: Il valore IMU rappresenta importo annuale, rata, previsione o costo storico?
- Perché serve: definire semantica e UI.
- Task bloccate o influenzate: informazioni finanziarie edificio.
- Checklist collegata: A2
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### PA-09
- Area: acquisto edificio
- Destinatario: commercialista o consulente
- Domanda: Prezzo e spese di acquisto richiedono separazione IVA, imposte o costi accessori?
- Perché serve: definire il modello finanziario.
- Task bloccate o influenzate: informazioni finanziarie edificio.
- Checklist collegata: A2
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

### ED-03
- Area: routing edifici
- Destinatario: agente immobiliare o amministratore
- Domanda: Dopo la creazione dell'edificio si deve aprire la lista o il dettaglio?
- Perché serve: definire la destinazione post-submit.
- Task bloccate o influenzate: route Nuovo edificio.
- Checklist collegata: A3, A6
- Stato: validata
- Risposta: dopo la creazione si apre il dettaglio dell’edificio. La lista edifici conduce al dettaglio edificio; il dettaglio mostra la lista delle unità collegate e il click su un’unità apre il dettaglio unità. Edificio/fabbricato è l’aggregato gestionale, mentre l’unità immobiliare è l’elemento atomico gestibile e locabile. Un edificio può avere una o più unità; nessuna classificazione è automatica in base al solo aspetto fisico.
- Data validazione: 2026-07-28

### ED-04
- Area: edifici e unità
- Destinatario: agente immobiliare o amministratore
- Domanda: Dal form edificio deve essere possibile creare una nuova unità oppure soltanto associare unità esistenti?
- Perché serve: delimitare il flusso e prevenire entità incomplete.
- Task bloccate o influenzate: form Nuovo edificio.
- Checklist collegata: A2
- Stato: validata
- Risposta: non creare unità inline nel form Nuovo edificio. Dopo il salvataggio mostrare “Aggiungi unità” e aprire il normale form Nuova unità con `buildingId` preimpostato e indirizzo dell’edificio precompilato e read-only quando il flusso parte dal dettaglio edificio. Resta disponibile la creazione autonoma da Nuova unità. In futuro sarà possibile associare un’unità esistente priva di edificio, senza duplicare il record.
- Data validazione: 2026-07-28

### ED-05
- Area: lifecycle edifici
- Destinatario: agente immobiliare o amministratore
- Domanda: Quali azioni sono richieste nel dettaglio edificio: modifica, archivio, ripristino, eliminazione?
- Perché serve: definire il lifecycle approvato.
- Task bloccate o influenzate: dettaglio e azioni edificio.
- Checklist collegata: A5, A6, A7
- Stato: validata
- Risposta: sono richiesti modifica, archivio, ripristino ed eliminazione protetta con conferma esplicita. L’eliminazione è bloccata in presenza di unità o riferimenti non gestiti e non deve produrre cancellazioni parziali. Quando esiste storico, l’archivio è preferibile.
- Data validazione: 2026-07-28

### CT-01
- Area: anagrafiche
- Destinatario: agente immobiliare o amministratore
- Domanda: Per una persona fisica il codice fiscale è sempre obbligatorio?
- Perché serve: validazione e duplicati.
- Task bloccate o influenzate: form inquilino.
- Checklist collegata: C1, C3, C4, C10
- Stato: validata
- Risposta: Props24 non calcola il codice fiscale: viene richiesto all’utente, ma non è sempre obbligatorio nella prima anagrafica né necessario per ricevere un invito. È richiesto prima della finalizzazione di una locazione italiana quando applicabile, con eccezioni per soggetti esteri o casi non applicabili; nelle fasi precedenti è facoltativo ma consigliato, dichiarandone i vantaggi di verifica e futura precompilazione. Il CF non normalizza gli indirizzi e non avvia consultazioni catastali silenziose: una futura consultazione avverrà soltanto su richiesta esplicita e autorizzazione.
- Data validazione: 2026-07-28

### CT-02
- Area: anagrafiche
- Destinatario: agente immobiliare o amministratore
- Domanda: Per una società la partita IVA è sempre obbligatoria?
- Perché serve: validazione e duplicati.
- Task bloccate o influenzate: form inquilino.
- Checklist collegata: C1, C3, C4, C10
- Stato: validata
- Risposta: la partita IVA non è sempre obbligatoria per ogni organizzazione. Per i soggetti italiani si acquisisce il codice fiscale dell’ente e la partita IVA quando applicabile; per i soggetti esteri si usano Paese e identificatore country-aware, senza applicare indiscriminatamente la validazione italiana.
- Data validazione: 2026-07-28

### CT-05
- Area: identificatori
- Destinatario: agente immobiliare o amministratore
- Domanda: Email e SIRET sono identificatori o soltanto segnali secondari?
- Perché serve: evitare falsi duplicati.
- Task bloccate o influenzate: controllo anagrafiche.
- Checklist collegata: C1, C3, C4, C10
- Stato: validata
- Risposta: l’email è recapito e canale di invito e, da sola, non blocca i duplicati. SIREN identifica l’impresa o entità legale francese; SIRET identifica uno specifico stabilimento francese. SIREN è richiesto quando applicabile e SIRET quando il record rappresenta uno stabilimento; SIRET non si applica ai soggetti italiani. Gli identificatori dipendono dal Paese; i segnali secondari possono generare avvisi, ma non costituiscono da soli prova di duplicazione.
- Data validazione: 2026-07-28
