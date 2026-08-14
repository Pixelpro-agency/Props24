# Props24 — Decisioni da validare con i professionisti

- [Todo list e stato di avanzamento](./todo-list.md)
- [Implementazioni residue](./implementazioni.md)

Questo registro contiene le domande professionali complete e resta l'unico luogo in cui registrarne la risposta. La Todo mostra soltanto l'impatto sintetico. La parte iniziale contiene decisioni ancora aperte, comprese quelle rinviate o parzialmente definite; non tutte devono quindi avere `Risposta: non ancora fornita`. La sezione finale contiene le decisioni validate.

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
- Task bloccate o influenzate: conferma pagamento.
- Checklist collegata: D2
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
- Checklist collegata: D2D, I5
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

### ED-01

- Area: edifici
- Destinatario: agente immobiliare o amministratore
- Domanda: L'identificativo dell'edificio deve essere univoco per account?
- Perché serve: definire vincolo e gestione duplicati.
- Task bloccate o influenzate: repository e form edificio.
- Checklist collegata: A1, A2
- Stato: validata
- Risposta: l'identificativo edificio è obbligatorio e univoco soltanto nello stesso account Props24; account differenti possono riusarlo. Non esiste unicità globale. In edit il record corrente è escluso dal controllo duplicati.
- Data validazione: 2026-08-14

### ED-02
- Area: edifici
- Destinatario: agente immobiliare o amministratore
- Domanda: Sono ammessi più edifici distinti con lo stesso indirizzo?
- Perché serve: evitare falsi duplicati.
- Task bloccate o influenzate: repository edifici.
- Checklist collegata: A1
- Stato: validata
- Risposta: nello stesso account, stesso indirizzo completo e stesso civico identificano lo stesso edificio. Unità, scala, piano e interno non giustificano un secondo edificio. I suffissi (`10`, `10 bis`, `10 ter`) distinguono civici. È una regola funzionale Props24, non una regola catastale universale.
- Data validazione: 2026-08-14

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

### ED-06
- Area: criteri di ripartizione
- Destinatario: agente immobiliare o amministratore
- Domanda: La somma dei millesimi deve essere obbligatoriamente 1.000?
- Perché serve: definire la validazione.
- Task bloccate o influenzate: criteri di ripartizione.
- Checklist collegata: A2
- Stato: validata
- Risposta: eliminare dall'attuale progetto l'intera funzionalità Criteri di ripartizione: scheda, persistenza, calcoli, somme, criteri, validazioni e logiche collegate.
- Data validazione: 2026-08-14

### ED-07
- Area: millesimi
- Destinatario: agente immobiliare o amministratore
- Domanda: I millesimi della scheda Unità e quelli dei criteri di ripartizione hanno significati differenti e devono essere entrambi conservati?
- Perché serve: evitare perdita o duplicazione semantica.
- Task bloccate o influenzate: schema edificio.
- Checklist collegata: A2
- Stato: validata
- Risposta: nessuna nuova logica sui millesimi, somma obbligatoria, calcolo speciale o collegamento ai criteri. L'audit del codice conferma il campo `PropertyThousandths`: può restare semplice e facoltativo, senza validazioni speciali.
- Data validazione: 2026-08-14

### UN-01
- Area: unità
- Destinatario: agente immobiliare o amministratore
- Domanda: Quali valori definitivi deve avere il tipo di locazione dell'unità?
- Perché serve: definire il catalogo canonico.
- Task bloccate o influenzate: campi unità.
- Checklist collegata: B3
- Stato: validata
- Risposta: catalogo canonico: Canone libero (4+4); Canone libero (4+4) con cedolare secca; Canone concordato (3+2); Canone concordato (3+2) con cedolare secca; Canone concordato (4+2) con cedolare secca; Canone concordato (5+2) con cedolare secca; Canone concordato (6+2) con cedolare secca; Turistico; Turistico con cedolare; Parziale; Parziale transitoria; Transitorio; Transitorio con cedolare secca; Studenti; Studenti con cedolare secca; Uso commerciale 6+6; Uso commerciale 9+9; Uso commerciale 6+2; Comodato / Usufrutto; Sublocazione; Uso foresteria.
- Data validazione: 2026-08-14

### UN-02
- Area: unità
- Destinatario: agente immobiliare o amministratore
- Domanda: Quali periodicità di pagamento devono essere supportate?
- Perché serve: definire il catalogo canonico.
- Task bloccate o influenzate: campi unità e locazioni.
- Checklist collegata: B3, I10
- Stato: validata
- Risposta: catalogo canonico esatto: Mensile, Trimestrale, Semestrale, Annuale.
- Data validazione: 2026-08-14

### UN-03
- Area: unità
- Destinatario: agente immobiliare o amministratore
- Domanda: Quali valori e casi speciali deve supportare la classe energetica?
- Perché serve: validazione e normalizzazione.
- Task bloccate o influenzate: campi unità.
- Checklist collegata: B3
- Stato: validata
- Risposta: catalogo canonico esatto: A4, A3, A2, A1, B, C, D, E, F, G. Nessun caso speciale o descrizione estesa nel valore.
- Data validazione: 2026-08-14

### UN-04
- Area: catasto
- Destinatario: agente immobiliare o amministratore
- Domanda: Come gestire unità estere o prive di dati catastali completi?
- Perché serve: definire edge case e duplicati.
- Task bloccate o influenzate: repository unità.
- Checklist collegata: B2
- Stato: validata
- Risposta: eliminata la logica specifica per unità estere. Le unità italiane sono salvabili con dati catastali incompleti; il duplicato si controlla solo con chiave catastale completa. Con dati incompleti nessun fallback basato su indirizzo, buildingId, scala, piano, interno o fingerprint. Nessun reminder corrente.
- Data validazione: 2026-08-14

### CT-01
- Area: anagrafiche
- Destinatario: agente immobiliare o amministratore
- Domanda: Per una persona fisica il codice fiscale è sempre obbligatorio?
- Perché serve: validazione e duplicati.
- Task bloccate o influenzate: form inquilino.
- Checklist collegata: C1, C3, C4, C10
- Stato: validata
- Risposta: Props24 non calcola il codice fiscale: viene richiesto all’utente, ma non è sempre obbligatorio nella prima anagrafica né necessario per ricevere un invito. È richiesto prima della finalizzazione di una locazione italiana quando applicabile; nei flussi italiani anche i soggetti esteri usano gli identificativi fiscali italiani secondo CT-03. Nelle fasi precedenti è facoltativo ma consigliato, dichiarandone i vantaggi di verifica e futura precompilazione. Il CF non normalizza gli indirizzi e non avvia consultazioni catastali silenziose: una futura consultazione avverrà soltanto su richiesta esplicita e autorizzazione.
- Data validazione: 2026-07-28

### CT-02
- Area: anagrafiche
- Destinatario: agente immobiliare o amministratore
- Domanda: Per una società la partita IVA è sempre obbligatoria?
- Perché serve: validazione e duplicati.
- Task bloccate o influenzate: form inquilino.
- Checklist collegata: C1, C3, C4, C10
- Stato: validata
- Risposta: la partita IVA non è sempre obbligatoria per ogni organizzazione. Per i soggetti italiani si acquisisce il codice fiscale dell’ente e la partita IVA quando applicabile. Per gli attuali flussi italiani con soggetti esteri valgono il codice fiscale italiano e la partita IVA italiana quando applicabile, secondo la successiva CT-03; non è requisito corrente un identificatore fiscale estero country-aware.
- Data validazione: 2026-07-28

### CT-03
- Area: anagrafiche estere
- Destinatario: agente immobiliare o amministratore
- Domanda: Come gestire persone e società estere prive di identificativi italiani?
- Perché serve: definire eccezioni valide.
- Task bloccate o influenzate: form e repository inquilini.
- Checklist collegata: C1, C3, C4, C10
- Stato: validata
- Risposta: nessuna logica fiscale country-by-country corrente. Nei flussi italiani, persona estera: CF italiano; società/ente estero: CF italiano e partita IVA italiana quando applicabile. Props24 resta basato sugli identificativi italiani.
- Data validazione: 2026-08-14

### CT-04
- Area: duplicati anagrafici
- Destinatario: agente immobiliare o amministratore
- Domanda: Un duplicato anagrafico deve essere bloccato oppure ammesso dopo conferma?
- Perché serve: definire la mutazione.
- Task bloccate o influenzate: repository inquilini.
- Checklist collegata: C1, C3, C4, C10
- Stato: validata
- Risposta: duplicato fiscale nello stesso account = hard block senza override. Persona: stesso CF. Società: stesso CF o, quando presente, stessa partita IVA. Gli stessi identificativi sono ammessi in account differenti.
- Data validazione: 2026-08-14

### CT-05
- Area: identificatori
- Destinatario: agente immobiliare o amministratore
- Domanda: Email e SIRET sono identificatori o soltanto segnali secondari?
- Perché serve: evitare falsi duplicati.
- Task bloccate o influenzate: controllo anagrafiche.
- Checklist collegata: C1, C3, C4, C10
- Stato: validata
- Risposta: l’email è recapito e canale di invito e, da sola, non blocca i duplicati né ne costituisce prova. SIREN identifica l’impresa o entità legale francese e SIRET uno specifico stabilimento francese, ma restano riferimento futuro fuori scope: non sono implementati nell’attuale logica Props24 e non partecipano al controllo duplicati corrente. Gli identificativi italiani decisi da CT-03 restano quelli correnti; eventuali segnali secondari possono generare avvisi, ma non costituiscono da soli prova di duplicazione.
- Data validazione: 2026-07-28

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
