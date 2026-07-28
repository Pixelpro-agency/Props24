# Ruoli, inviti e workspace

## 1. Stato della specifica

Questa è una specifica concettuale di prodotto e dell’architettura futura. Non descrive un’implementazione corrente: non esistono ancora servizio email reale, token reali o backend autorizzativo. Supabase/PostgreSQL resta il target futuro. F3.1 — Nuovo inquilino non deve implementare il portale inquilino.

## 2. Osservazione Rentila

### Comportamento osservato

Come evidenza fornita dall’utente, con un’email presente Rentila mostra nella scheda inquilino un link di invito copiabile. Il testo osservato promette accesso limitato alla locazione, alle ricevute e alla messaggistica; l’email ricevuta menziona anche documenti e manutenzioni. L’utente ha aperto il link, ma la pagina ha continuato a richiedere un invito senza completare l’accesso.

### Causa non verificata

La causa tecnica dell’anomalia non è nota.

### Decisione Props24

Il comportamento anomalo non deve essere copiato. Props24 dovrà associare atomicamente invito, email, partecipante, locazione e account.

## 3. Identità unica e ruoli multipli

L’account è l’identità autenticata. Non esiste un tipo esclusivo e permanente “tenant” o “landlord”: lo stesso account può essere inquilino, proprietario, professionista o collaboratore di uno studio. I ruoli dipendono dal workspace o dalla relazione. La scelta iniziale proprietario/inquilino serve all’onboarding e non costituisce un vincolo permanente.

## 4. Workspace

I contesti concettuali sono:

- workspace personale/proprietario;
- accesso alle locazioni come inquilino;
- workspace studio/professionista;
- workspace cliente delegato.

Il professionista usa sempre il proprio account e non impersona tecnicamente il cliente. Opera nel workspace del cliente soltanto dopo conferma, ottenibile in futuro tramite registrazione, email, invito o altro flusso backend. Prima dell’accettazione non accede; ogni operazione lascia audit, e l’accesso può essere revocato.

Ogni operazione futura deve poter registrare almeno:

- `actorAccountId`;
- `workspaceId`;
- `entityType`;
- `entityId`;
- `operation`;
- `createdAt`.

## 5. Interfaccia multi-ruolo

Il selettore concettuale contiene “I miei immobili”, “Le mie locazioni” e “Studio / Clienti”. Per un account sia gestore sia inquilino, Locazioni distingue “Gestite da me” e “Come inquilino”; entrambe possono contenere “Attive” e “Archivio”. Le locazioni gestite e quelle vissute come inquilino non devono essere mescolate per impostazione predefinita.

## 6. Portale dell’inquilino

L’inquilino vede soltanto i dati pertinenti alle proprie locazioni: locazioni cui partecipa, scadenze e pagamenti pertinenti, ricevute e documenti condivisi, messaggi, richieste di manutenzione e il proprio profilo account.

Non vede altre proprietà del proprietario, altri inquilini, KPI patrimoniali, redditività, costi privati, dati catastali non necessari, la scheda gestionale privata conservata dal proprietario, record o documenti non condivisi o altre locazioni del proprietario.

## 7. Workspace personale dell’inquilino

Un inquilino può scegliere in seguito “Gestisci anche i tuoi immobili”. L’azione crea un proprio workspace personale da proprietario e non modifica i permessi della locazione ricevuta tramite invito.

## 8. Professionista

L’interfaccia futura distingue “Personale” e “Studio / Gestionale”. Nel contesto Studio mostra elenco clienti, selezione del cliente e banner evidente del cliente attivo. Consente gestione secondo delega, futura creazione, modifica, archiviazione ed eliminazione secondo permessi, inviti agli inquilini e richieste di accesso ai proprietari.

Non è ammesso accesso silenzioso: conferma o accettazione del cliente è obbligatoria e il log conserva l’autore reale. Ruoli futuri possibili: Titolare, Gestore completo, Collaboratore, Contabile, Sola lettura e Inquilino. Il permission engine non viene implementato ora.

## 9. Flusso invito inquilino

L’invito è manuale e distinto per ogni partecipante. Dopo la creazione della locazione la UI futura può mostrare “Invita gli inquilini” e, per ciascuno, nome, email, disponibilità dell’invito, stato, invia, reinvia e revoca. Se manca l’email, la sezione resta visibile con il messaggio “Aggiungi un indirizzo email per invitare l’inquilino.”

Stati concettuali: `non_preparato`, `pronto`, `inviato`, `accettato`, `scaduto`, `revocato`, `fallito`.

Vanno sempre distinti record locale aggiornato, email realmente inviata, email consegnata, invito accettato e account collegato.

Il flusso futuro verifica il token, mostra proprietario e locazione, propone login o registrazione, richiede accettazione esplicita, collega account e partecipante, consuma o revoca il token e apre “Le mie locazioni”. Il token stabilisce già il ruolo ricevuto nella relazione e non obbliga a scegliere nuovamente “proprietario o inquilino”.

## 10. Modello dati concettuale

- `accounts`: identità di login;
- `user_profiles`: dati personali gestiti dall’utente;
- `workspaces`: confini dei dati;
- `workspace_memberships`: ruoli e permessi;
- `parties`: persone o società rappresentate nei contratti;
- `party_account_links`: collegamento verificato fra account e anagrafica;
- `lease_participants`: ruolo di una parte nella locazione;
- `invitations`: invito, stato, destinatario e scadenza;
- `documents`: metadati del documento;
- `document_access_grants`: visibilità per account, ruolo o partecipante;
- `audit_events`: storico immutabile.

Il modello è documentato senza implementazione.

## 11. Codice fiscale

Props24 non calcola né propone automaticamente il codice fiscale: il CF è richiesto all’utente e potrà essere verificato in futuro. Non è necessario per un semplice invito, può essere facoltativo nella prima anagrafica e deve essere richiesto prima della finalizzazione di una locazione italiana quando applicabile, con eccezioni country-aware.

Il CF non sostituisce la normalizzazione dell’indirizzo e il suo inserimento non avvia automaticamente consultazioni catastali.

## 12. Autocompilazione tramite dati catastali

L’autocompilazione degli immobili tramite CF è una funzione differenziante futura e si attiva soltanto dopo un’azione esplicita dell’utente. Prima dell’azione compare una modale o un avviso con checkbox non preselezionata. Il testo dichiara finalità, dati richiesti, fonte, dati importati, conservazione nel database Props24 ed eventuali soggetti che effettuano il trattamento. Si registrano versione del testo, timestamp e account autorizzante, prevedendo revoca quando applicabile.

Il requisito tecnico o formale della delega dipenderà dalla fonte effettiva: non si deve dichiarare che una checkbox autorizzi automaticamente qualsiasi accesso esterno. Prima dell’implementazione servono audit tecnico, legale e della fonte.

Flusso: richiesta dell’utente → informativa e autorizzazione esplicita → acquisizione da fonte ammessa → elenco degli immobili trovati → selezione → anteprima → conferma → salvataggio. Nessun dato viene importato direttamente senza anteprima e conferma.

## 13. Visure e documenti di autocompilazione

- **Visura catastale:** immobili, intestazioni, foglio, particella, subalterno, categoria, rendita e altri riferimenti catastali.
- **Visura camerale:** società, impresa, sede, attività, rappresentanti e identificativi societari.
- **Carta d’identità:** dati anagrafici, estremi, scadenza e dati leggibili da confermare.

Direzione futura: carta d’identità per anagrafiche personali, visura camerale per società, visura catastale per unità e immobili, contratti PDF o immagini per precompilare locazioni. OCR ed estrazione sono sempre seguiti da anteprima e conferma; nessun dato estratto è automaticamente verificato.

## 14. Identificatori francesi

SIREN identifica un’entità legale o impresa francese; SIRET uno specifico stabilimento francese. Gli identificatori sono country-aware: SIREN è richiesto quando applicabile a un’impresa francese; SIRET quando il record rappresenta uno stabilimento specifico e può non essere applicabile altrimenti. Nessun SIRET è richiesto ai soggetti italiani. L’email resta recapito e canale di invito, non identificatore fiscale.

## 15. Documenti della locazione

Il futuro dettaglio locazione prevede una sezione laterale o scheda “Documenti allegati”. Categorie iniziali: Contratto, Conguaglio, Bollette e utenze, Spese condominiali, Deposito cauzionale, Assicurazioni, Ricevute, Comunicazioni e Altro.

Visibilità: Solo proprietario; Proprietario e professionisti autorizzati; Condiviso con tutti gli inquilini; Condiviso con inquilini selezionati. Il collegamento alla locazione non rende automaticamente il documento visibile all’inquilino.

## 16. Conguagli

Il conguaglio futuro distingue spesa effettiva, acconti già pagati, periodo, criterio di attribuzione, saldo a debito, saldo a credito, documenti giustificativi ed effetto sulla rata successiva. Il PDF è un giustificativo, non l’intero modello contabile.

## 17. Idea sull’affidabilità

Ragionamento futuro emerso, non discusso, non approfondito, non approvato e non pianificato.

Possibile uso futuro di dati provenienti da fonti esterne e possibile valutazione dell’affidabilità di clienti o inquilini. Nessuna fonte, criterio o punteggio è definito; non esistono task esecutiva o priorità. Prima di qualsiasi sviluppo serviranno discovery, audit legale, privacy, qualità dei dati e possibilità di contestazione.

## 18. Fuori perimetro

Nessun codice modificato; nessun backend; nessuna email; nessun token; nessun account inquilino reale; nessun permission engine; nessuna delega reale; nessuna integrazione catastale; nessun OCR; nessuna estrazione documentale; nessun KPI; nessuno scoring; nessuna modifica F3.1.
