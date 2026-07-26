# Props24 — Decisioni da validare con i professionisti

Questo registro contiene soltanto questioni aperte. Per tutte le voci: Stato `aperta`, Risposta `non ancora fornita`, Data validazione `—`.

## Agente immobiliare o amministratore

### ED-01

- Area: edifici
- Destinatario: agente immobiliare o amministratore
- Domanda: L'identificativo dell'edificio deve essere univoco per account?
- Perché serve: definire vincolo e gestione duplicati.
- Task bloccate o influenzate: repository e form edificio.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### ED-02
- Area: edifici
- Destinatario: agente immobiliare o amministratore
- Domanda: Sono ammessi più edifici distinti con lo stesso indirizzo?
- Perché serve: evitare falsi duplicati.
- Task bloccate o influenzate: repository edifici.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### ED-03
- Area: routing edifici
- Destinatario: agente immobiliare o amministratore
- Domanda: Dopo la creazione dell'edificio si deve aprire la lista o il dettaglio?
- Perché serve: definire la destinazione post-submit.
- Task bloccate o influenzate: route Nuovo edificio.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### ED-04
- Area: edifici e unità
- Destinatario: agente immobiliare o amministratore
- Domanda: Dal form edificio deve essere possibile creare una nuova unità oppure soltanto associare unità esistenti?
- Perché serve: delimitare il flusso e prevenire entità incomplete.
- Task bloccate o influenzate: form Nuovo edificio.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### ED-05
- Area: lifecycle edifici
- Destinatario: agente immobiliare o amministratore
- Domanda: Quali azioni sono richieste nel dettaglio edificio: modifica, archivio, ripristino, eliminazione?
- Perché serve: definire il lifecycle approvato.
- Task bloccate o influenzate: dettaglio e azioni edificio.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### ED-06
- Area: criteri di ripartizione
- Destinatario: agente immobiliare o amministratore
- Domanda: La somma dei millesimi deve essere obbligatoriamente 1.000?
- Perché serve: definire la validazione.
- Task bloccate o influenzate: criteri di ripartizione.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### ED-07
- Area: millesimi
- Destinatario: agente immobiliare o amministratore
- Domanda: I millesimi della scheda Unità e quelli dei criteri di ripartizione hanno significati differenti e devono essere entrambi conservati?
- Perché serve: evitare perdita o duplicazione semantica.
- Task bloccate o influenzate: schema edificio.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### UN-01
- Area: unità
- Destinatario: agente immobiliare o amministratore
- Domanda: Quali valori definitivi deve avere il tipo di locazione dell'unità?
- Perché serve: definire il catalogo canonico.
- Task bloccate o influenzate: campi unità.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### UN-02
- Area: unità
- Destinatario: agente immobiliare o amministratore
- Domanda: Quali periodicità di pagamento devono essere supportate?
- Perché serve: definire il catalogo canonico.
- Task bloccate o influenzate: campi unità e locazioni.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### UN-03
- Area: unità
- Destinatario: agente immobiliare o amministratore
- Domanda: Quali valori e casi speciali deve supportare la classe energetica?
- Perché serve: validazione e normalizzazione.
- Task bloccate o influenzate: campi unità.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### UN-04
- Area: catasto
- Destinatario: agente immobiliare o amministratore
- Domanda: Come gestire unità estere o prive di dati catastali completi?
- Perché serve: definire edge case e duplicati.
- Task bloccate o influenzate: repository unità.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### CT-01
- Area: anagrafiche
- Destinatario: agente immobiliare o amministratore
- Domanda: Per una persona fisica il codice fiscale è sempre obbligatorio?
- Perché serve: validazione e duplicati.
- Task bloccate o influenzate: form inquilino.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### CT-02
- Area: anagrafiche
- Destinatario: agente immobiliare o amministratore
- Domanda: Per una società la partita IVA è sempre obbligatoria?
- Perché serve: validazione e duplicati.
- Task bloccate o influenzate: form inquilino.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### CT-03
- Area: anagrafiche estere
- Destinatario: agente immobiliare o amministratore
- Domanda: Come gestire persone e società estere prive di identificativi italiani?
- Perché serve: definire eccezioni valide.
- Task bloccate o influenzate: form e repository inquilini.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### CT-04
- Area: duplicati anagrafici
- Destinatario: agente immobiliare o amministratore
- Domanda: Un duplicato anagrafico deve essere bloccato oppure ammesso dopo conferma?
- Perché serve: definire la mutazione.
- Task bloccate o influenzate: repository inquilini.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### CT-05
- Area: identificatori
- Destinatario: agente immobiliare o amministratore
- Domanda: Email e SIRET sono identificatori o soltanto segnali secondari?
- Perché serve: evitare falsi duplicati.
- Task bloccate o influenzate: controllo anagrafiche.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

## Commercialista o consulente

### PA-01
- Area: pagamenti
- Destinatario: commercialista o consulente
- Domanda: Quali metodi di pagamento devono essere disponibili nella conferma manuale?
- Perché serve: definire il catalogo.
- Task bloccate o influenzate: conferma pagamento.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### PA-02
- Area: prove di pagamento
- Destinatario: commercialista o consulente
- Domanda: Quali prove documentali rendono ufficiale un pagamento?
- Perché serve: definire requisiti futuri.
- Task bloccate o influenzate: allegati e documenti pagamento.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### PA-03
- Area: pagamenti complessi
- Destinatario: commercialista o consulente
- Domanda: Come gestire in futuro pagamenti parziali, crediti e debiti?
- Perché serve: definire il modello futuro.
- Task bloccate o influenzate: pagamenti successivi alla prima fase.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### PA-04
- Area: ricevute
- Destinatario: commercialista o consulente
- Domanda: Quando deve essere prodotta una ricevuta e quali dati obbligatori deve contenere?
- Perché serve: definire il servizio documentale.
- Task bloccate o influenzate: generazione ricevute.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### PA-05
- Area: documenti fiscali
- Destinatario: commercialista o consulente
- Domanda: Come distinguere ricevuta, fattura, quietanza e semplice allegato del pagamento?
- Perché serve: evitare classificazioni improprie.
- Task bloccate o influenzate: documenti pagamento.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### PA-06
- Area: locazioni
- Destinatario: commercialista o consulente
- Domanda: Quali motivi aggiuntivi devono essere presenti nell'override della data finale?
- Perché serve: ampliare il catalogo minimo approvato.
- Task bloccate o influenzate: override data finale.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### PA-07
- Area: audit
- Destinatario: commercialista o consulente
- Domanda: Per quanto tempo deve essere conservato lo storico immutabile delle modifiche?
- Perché serve: definire retention e conformità.
- Task bloccate o influenzate: storico append-only.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### PA-08
- Area: edifici
- Destinatario: commercialista o consulente
- Domanda: Il valore IMU rappresenta importo annuale, rata, previsione o costo storico?
- Perché serve: definire semantica e UI.
- Task bloccate o influenzate: informazioni finanziarie edificio.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —

### PA-09
- Area: acquisto edificio
- Destinatario: commercialista o consulente
- Domanda: Prezzo e spese di acquisto richiedono separazione IVA, imposte o costi accessori?
- Perché serve: definire il modello finanziario.
- Task bloccate o influenzate: informazioni finanziarie edificio.
- Stato: aperta
- Risposta: non ancora fornita
- Data validazione: —
