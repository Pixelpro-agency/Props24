# Props24 — Specifica della fase locale prioritaria

## 1. Scopo della fase

La fase locale deve rendere realmente funzionanti e collaudabili i flussi Nuova unità, Nuovo inquilino, Nuova locazione e Nuovo edificio.

Ogni form supportato deve salvare e ricaricare tutti i dati compresi nello scope approvato, conservare i dati inseriti in caso di errore e permettere un collaudo completo sul database locale. Toast, modali e `console.log` non costituiscono da soli un salvataggio riuscito.

Il database locale è l'ambiente del collaudo funzionale completo. I dati locali attuali sono dati di test e possono essere modificati o eliminati durante QA autorizzato; questa libertà non vale per i futuri dati di produzione. Dalla fase di produzione, sviluppo e test dovranno usare account e dati esplicitamente dedicati al QA.

## 2. Convenzione delle funzioni non disponibili

Qualunque funzione visibile che non sia ancora implementata, realmente funzionante, collaudata e approvata può restare visibile soltanto quando è utile a mostrare la direzione del prodotto, ma deve essere:

- evidenziata in giallo;
- realmente disabilitata e non cliccabile;
- dotata di `disabled` o `aria-disabled`, quando applicabile;
- accompagnata da tooltip o testo chiaro;
- priva di route fittizie, fallback `#` e falsi messaggi di successo.

La convenzione si applica alle funzioni realmente non disponibili, come Importa, Esporta, FeedbackBox, OCR, firme digitali, scraping, automazioni email, generazione documentale e integrazioni che richiedono backend o storage non ancora implementati. Non disabilita automaticamente i campi e i flussi locali già supportati e persistiti nei form.

Importa ed Esporta devono restare visibili, gialli e disabilitati fino all'implementazione. Anche FeedbackBox deve restare visibile, giallo e disabilitato. Questa task documentale non implementa la convenzione.

## 3. Bozze manuali

Le bozze sono salvate soltanto tramite azione esplicita dell'utente: non esiste autosalvataggio e non si usa debounce per salvare automaticamente. Sono record account-scoped distinti dai record definitivi e restano disponibili finché il form viene completato con successo oppure l'utente le elimina esplicitamente.

### Apertura con bozza esistente

La pagina di creazione mostra una modale coerente con lo stile dell'app:

- `Riprendi bozza`: carica l'ultima versione salvata;
- `Elimina e ricomincia`: elimina la bozza e apre campi vuoti;
- `Annulla`: conserva la bozza e interrompe l'apertura del form.

La bozza ripristinata è inizialmente salvata e non dirty; una modifica successiva la rende dirty.

### Salva bozza

`Salva bozza` salva manualmente la versione corrente, sostituisce la versione precedente della stessa bozza e, se invocato dal form, lascia l'utente nella pagina. Gli errori reali devono essere mostrati senza cancellare i dati.

### Navigazione con modifiche non salvate

Un form vuoto e mai modificato può essere abbandonato senza modale. Un form dirty mostra:

- `Resta`: chiude la modale e mantiene il form;
- `Abbandona`: scarta solo le modifiche successive all'ultimo stato salvato, senza eliminare un'eventuale bozza precedente;
- `Salva bozza`: salva e completa automaticamente la navigazione richiesta.

Il guard condiviso dovrà coprire sidebar, navbar, menu Aggiungi, link e route interne, browser back, Annulla, logout, cambio pagina e cambio di scheda interna quando comporta perdita di dati.

Quando la navigazione è già sospesa, `Resta` non scrive; `Abbandona` ripristina soltanto la baseline dell’ultimo salvataggio manuale; `Salva bozza` esegue una sola scrittura e prosegue verso la destinazione originaria. La destinazione resta conservata anche durante il salvataggio asincrono.

Per refresh e chiusura della scheda si usa `beforeunload`: il browser può mostrare soltanto l'avviso nativo e non va promessa una modale CSS personalizzata.

### Submit definitivo

Dopo submit riuscito si crea o aggiorna il record definitivo, si elimina la bozza associata e si naviga alla destinazione prevista. La cancellazione avviene soltanto dopo la creazione riuscita; se il cleanup fallisce, il recovery non ripete la creazione definitiva. Nella Nuova locazione un lock sincrono create-only impedisce submit concorrenti: un errore di `createLease` rilascia il lock e consente un nuovo tentativo, mentre dopo una create riuscita il lock resta acquisito durante cleanup e recovery. Dopo submit fallito non si eliminano bozza o dati correnti e non si dichiara successo. Il logout usa lo stesso guard delle altre navigazioni applicative.

## 4. Modifiche delle locazioni e storico

Le modifiche alle locazioni producono eventi append-only persistiti nel database. Ogni evento conserva:

- identificativo evento e locazione;
- account autore;
- data e ora;
- tipo di operazione;
- motivo, quando richiesto;
- campi cambiati;
- stato precedente e successivo.

Lo storico non è sovrascrivibile né ricostruito soltanto dai dati correnti e deve mostrare come i dati erano e come sono diventati. È conservato a tempo indefinito e non prevede scadenza automatica.

## 5. Data finale della locazione

La data finale è normalmente calcolata da tipo e durata con regole sicure di fine mese. La modifica manuale è un override esplicito e richiede obbligatoriamente un motivo:

- Decesso;
- Sequestro o provvedimento dell'autorità;
- Sfratto;
- Altro.

Per `Altro` è obbligatoria una spiegazione. L'evento append-only conserva data precedente, data nuova, motivo, eventuale spiegazione, autore e timestamp. Altri motivi restano da validare.

## 6. Pagamenti nella prima fase

La prima versione gestisce soltanto pagamenti completi. Un pagamento diventa `paid` solo dopo conferma esplicita dell'utente, che raccoglie metodo, data, importo e nota facoltativa.

I metodi correnti restano `Bonifico`, `Contanti`, `Assegno`, `Carta` e `Addebito`. L'eventuale catalogo futuro sarà rivalutato soltanto con la sezione Finanze.

Nessun metodo implica automaticamente l'incasso. L'importo deve coincidere con l'intero residuo; i pagamenti parziali non sono accettati silenziosamente. Non vengono prodotti automaticamente ricevute o documenti e nessun pagamento è ufficiale senza conferma.

### Prova dell'incasso

Nessun metodo contrattuale, incluso l'addebito, implica da solo l'incasso. Lo stato `paid` richiede una conferma esplicita completa; i consumer di cassa richiedono inoltre una `paidDate` valida. Un record `paid` senza `paidDate` viene trattato conservativamente come non pagato.

Il solo metodo di pagamento non autorizza a ricostruire `paidDate`, `confirmation`, `receiptNumber`, ricevute o altre prove dell'incasso.

### Storico, repair e migrazione

Gli status assenti o sconosciuti non diventano automaticamente `paid`. Le cronologie legacy non vuote vengono preservate e normalizzate: una singola anomalia o la forma degli ID non autorizza la sostituzione dell'intera cronologia.

Una cronologia legacy vuota produce soltanto rate contrattuali eleggibili `late` o `pending`. Migrazione e repair non inventano incassi, spese, `paidDate`, `confirmation` o `receiptNumber`.

Il repair viene persistito, riletto e verificato soltanto quando modifica realmente il database account. La procedura è idempotente: una seconda inizializzazione del valore già riparato non produce un'altra scrittura.

### Saldi e metriche

Le metriche di cassa includono ricavi soltanto con `accountingRole: revenue`, `status: paid` e `paidDate` valida, e spese operative soltanto con `accountingRole: expense`, `status: paid` e `paidDate` valida.

Lo scaduto riguarda esclusivamente ricavi `late` oppure ricavi `pending` con `dueDate` arrivata alla data di riferimento. I movimenti con `accountingRole: deposit` sono isolati dalle metriche generali di ricavo e spesa.

La semantica completa di deposito, restituzione e prepagato resta una decisione separata di D2D.

Sono attività future: pagamenti parziali, crediti, debiti, compensazioni, allegati probatori, richieste di ricevuta, scontrini, documenti ufficiali e generazione automatica di ricevute o fatture.


## 7. Contratto locale delle Unit

### Campi canonici

I valori strutturati delle Unit usano cataloghi canonici condivisi per tipo di unità, tipo di locazione, periodicità di pagamento e classe energetica.

`PropertyTypeID` è obbligatorio al submit e alla mutation definitiva. Tipo di locazione, periodicità e classe energetica possono essere vuoti, ma quando valorizzati devono appartenere ai rispettivi cataloghi canonici.

La lettura dei dati legacy è conservativa: i valori riconosciuti vengono normalizzati, mentre valori sconosciuti o ambigui vengono preservati e non producono riscritture automatiche.

Il database persiste i machine ID. Le label leggibili vengono costruite nel read-model e nella UI. I percorsi di lettura non modificano il database.

La fonte tecnica dei valori canonici implementati è `src/data/propertyCatalogs.ts`; i cataloghi verificati da B3 non devono essere modificati senza una nuova decisione di prodotto.

### Identità annidate

Gli ID persistenti annidati delle Unit vengono generati soltanto quando nasce realmente un nuovo oggetto o file.

Una volta assegnati, edit, rerender, normalizzazione, draft, submit, persistenza e reload devono preservare la stessa identità.

Parser e normalizzatori non generano nuovi ID. La sostituzione reale di un file crea un nuovo file ID, mentre l'ID dell'entità parent resta invariato.

Gli ID legacy già presenti vengono conservati senza migrazione automatica del formato.

La strategia tecnica del generatore canonico è descritta in [Database locale e migrazione futura](./database-locale-e-migrazione.md).

### Modifica, bozza edit e lifecycle

La modifica di una Unit usa la route canonica `/properties/units/:id/edit` e parte dal record persistito. L'aggiornamento definitivo modifica il record esistente senza creare una nuova Unit e preserva identità, `createdAt`, stato di archivio, relazioni e ID annidati già assegnati, salvo la sostituzione reale di un file. La relazione `buildingId` non viene riassegnata implicitamente durante l'edit.

La bozza di modifica usa `formType: property`, `mode: edit` ed `entityId` uguale all'ID della Unit. È account-scoped ed è distinta sia dalla bozza create sia dalle bozze edit di altre Unit. Il salvataggio resta esclusivamente manuale; una bozza ripristinata è inizialmente clean e il guard mantiene il contratto `Resta` / `Abbandona` / `Salva bozza`. Dopo un update definitivo riuscito viene eseguito il cleanup della bozza; un errore del cleanup non ripete l'update già completato.

Il lifecycle delle Unit usa operazioni account-scoped reali di archivio, ripristino ed eliminazione, oltre alle corrispondenti operazioni bulk atomiche. Prima di una mutazione bulk viene validato l'intero insieme richiesto; una delete che contiene insieme Unit eliminabili e Unit bloccate non produce cancellazioni parziali.

Archivio e ripristino preservano identità, dati e `buildingId` e non modificano `building.unitsCount`. Una Unit può essere ripristinata anche quando il Building collegato è archiviato.

L'eliminazione è bloccata da qualunque Lease persistente con `lease.propertyId` uguale all'ID della Unit e da qualunque Payment persistente con `payment.propertyId` uguale all'ID della Unit, indipendentemente dallo stato corrente o storico. Le proiezioni `tenantIds` e `leaseIds` non costituiscono blocker autonomi e non viene eseguito alcun cascade.

Una Unit libera può essere eliminata anche se collegata a un Building; in questo caso `building.unitsCount` viene ricalcolato dai dati reali.

Lista e dettaglio espongono lifecycle coerente con lo stato persistito: una Unit attiva offre Modifica, Archivia ed Elimina; una Unit archiviata offre Modifica, Ripristina ed Elimina. Le azioni attive eseguono mutazioni reali e gli errori di dominio non producono falsi successi.

## 7 bis. Contratto locale Inquilini e Contatti

### Rubrica canonica

`ContactRecord` è l'entità canonica della rubrica locale e viene condivisa dai consumer che necessitano di persone o società collegate, inclusi garanti delle locazioni e relazioni Contact degli inquilini.

La futura pagina o view Rubrica non appartiene al ciclo C1. Il repository, le relazioni e i consumer possono essere completati e collaudati prima dell'introduzione di una route dedicata ai contatti.

### Relazioni Tenant–Contact

Le relazioni Contact salvate nel Tenant mantengono due identità distinte:

```text
id
contactId
```
`id` identifica l'elemento o relazione annidata nel Tenant; `contactId` identifica il `ContactRecord` canonico della rubrica.

`contactId` è opzionale durante la transizione per preservare i record legacy già persistiti. Un record legacy inline privo di `contactId` viene conservato senza tentare collegamenti euristici automatici basati su nome, email, telefono, codice fiscale, partita IVA o altri campi.

I metadati specifici della relazione restano sul Tenant. In particolare `isPrimary` di un contatto di emergenza descrive la relazione con quello specifico Tenant e non modifica il `ContactRecord` globale.

Garanti e contatti di emergenza devono convergere sulla stessa rubrica canonica senza perdere i dati legacy già presenti.

### Creazione dei Contact

La creazione esplicita di un nuovo contatto dal form Tenant produce un vero `ContactRecord` nella rubrica account-scoped, analogamente al flusso già supportato dai garanti della locazione.

Il Contact è un'entità autonoma: può esistere in rubrica anche senza essere successivamente collegato a un Tenant o a una Lease. L'abbandono del form Tenant o un errore della successiva create Tenant non produce rollback o cancellazione automatica del Contact creato esplicitamente.

La bozza Tenant conserva i riferimenti e i dati di relazione, ma il restore della bozza non crea nuovi Contact e il caricamento asincrono della rubrica non produce autosave né dirty state da solo.

### Riferimenti archived e missing

Un riferimento Contact già persistito non viene rimosso automaticamente perché il Contact è archiviato, temporaneamente non disponibile oppure non ancora verificabile durante loading/error della rubrica.

I consumer devono distinguere almeno riferimenti disponibili, archiviati e non risolvibili, preservando l'identificativo finché l'utente non compie un'azione esplicita.

### Lifecycle Contact

Il lifecycle locale della rubrica comprende create, update, archive, restore, delete protetta e subscription account-scoped.

Un Contact non può essere eliminato quando è ancora referenziato da una locazione come garante oppure da una relazione Contact persistita di un Tenant. Non viene eseguito alcun cascade implicito per liberare la delete.

### Identità fiscale e duplicati

C3 ha consolidato CT-01–CT-05 come hard block fiscale account-scoped senza override.

Il duplicate check resta separato fra le due entità persistenti canoniche:

```text
Contact ↔ Contact
Tenant  ↔ Tenant
```

Non esiste un vincolo fiscale incrociato `Contact ↔ Tenant`. Un Contact autonomo della rubrica può quindi appartenere alla stessa persona o società che successivamente assume anche il ruolo di Tenant senza dover essere eliminato o convertito.

Per le persone fisiche la chiave hard-block è esclusivamente il codice fiscale valorizzato. La P.IVA personale, l'email, il telefono, il nome e l'indirizzo non costituiscono prova di duplicazione.

Per società ed enti le chiavi hard-block sono il codice fiscale dell'ente e, quando valorizzata, la partita IVA dell'ente. La collisione di uno dei due identificatori è sufficiente per bloccare la mutazione. SIRET e SIREN restano fuori scope corrente.

Gli identificatori fiscali vuoti non costituiscono identità e non collidono. Gli stessi identificatori sono ammessi in account differenti. I record archived continuano a partecipare al controllo perché restano anagrafiche persistite dell'account.

Nel modello Tenant società il codice fiscale dell'ente è distinto dal codice fiscale del rappresentante legale. Il form usa:

```text
TenantCompanyFiscalCode
```

per l'ente, persistito come:

```text
TenantRecord.companyFiscalCode
```

Il preesistente `TenantFiscalCode` della sezione Rappresentante legale resta riferito alla persona fisica rappresentante e non viene usato per determinare un duplicato della società. `TenantVatNumberPersonal` resta analogamente distinto dalla P.IVA dell'ente.

I Tenant company legacy privi di `companyFiscalCode` vengono preservati con valore vuoto. Non viene inferito il CF dell'ente dal vecchio `fiscalCode`.

L'enforcement corrente è:

- `ContactRepository.create` e `ContactRepository.update`: persona per CF; società per CF o P.IVA;
- `createTenant`: persona per CF; società per `companyFiscalCode` o P.IVA;
- update Contact con esclusione del record corrente;
- archived inclusi;
- nessuna mutazione definitiva quando il controllo fallisce;
- UI Nuovo inquilino con errore sul campo fiscale corretto e ritorno alla scheda `Informazioni generali`;
- nessun hard block Contact↔Tenant.

L'update Tenant reale non è ancora implementato e appartiene a C5; quando verrà introdotto dovrà riusare le pure business rules C3 con esclusione del Tenant corrente.

C3 è stata completata tramite:

- C3.1 — contratto identità fiscale e modello company Tenant;
- C3.2 — enforcement `ContactRepository`;
- C3.3 — enforcement Tenant create e UI;
- C3.4 — gate tecnico consolidato.

Il gate fiscale consolidato C3 verifica 7 file / 37 test PASS. Le due full-suite globali eseguite durante C3.4 hanno mostrato intermittenze fuori scope nei test NewProperty; il successivo collaudo isolato e combinato dei test coinvolti ha concluso con 44/44 PASS, nessun timeout e nessuna failure riproducibile.

### Creazione atomica Tenant

C4 ha consolidato la create definitiva del Tenant come mutation account-scoped e atomica.

`tenantRepository` espone una authority unica per la create tramite operations basate su gateway e una factory account-scoped. Il bridge legacy `createTenant` resta compatibile per i consumer esistenti ma cattura l'account attivo all'inizio della mutation e delega alla stessa authority; non esistono due implementazioni indipendenti della create.

L'ordine della mutation definitiva è:

1. normalizzazione del form Tenant;
2. lettura del database dello scope account;
3. quota allegati;
4. controllo duplicati fiscali C3;
5. integrità delle relazioni;
6. validazione dei riferimenti Contact;
7. generazione dell'ID Tenant;
8. costruzione completa del record e del database candidato;
9. una sola persistenza;
10. rilettura del Tenant dal database restituito dalla persistenza.

Nessuna write definitiva avviene prima del completamento delle validazioni.

Per `TenantGuarantors` e `TenantEmergencyContacts` valgono inoltre:

- relation `id` obbligatorio e univoco all'interno della relativa collection;
- `contactId` resta opzionale per i record inline/legacy;
- se `contactId` è presente in una nuova create definitiva, deve esistere in `database.contacts` dello stesso account;
- un Contact archived continua a essere referenzialmente valido;
- un Contact presente soltanto in un altro account non rende valido il riferimento;
- nessun matching euristico crea o ricostruisce `contactId`;
- lo stesso Contact può essere referenziato in ruoli differenti;
- i contatti di emergenza sono al massimo 5;
- se sono presenti contatti di emergenza, deve esistere esattamente un `isPrimary = true`.

Il vincolo sui nuovi `contactId` dangling riguarda la mutation definitiva. Draft e record legacy già persistiti continuano a preservare riferimenti mancanti/non risolvibili senza read-repair o cancellazioni automatiche.

Un Contact creato esplicitamente mediante `ContactRepository` resta un'entità autonoma: il fallimento della successiva create Tenant non esegue rollback, delete o altra mutation del Contact.

C4 è stata verificata con 14 test dedicati. Dopo il fix della fixture C2 che conteneva due `contactId` senza i corrispondenti `ContactRecord`, le regressioni C1/C2/C3, submit/draft e tenant-form sono risultate positive; la full suite finale ha concluso con 106 file / 1206 test PASS, build positiva e lint mirato senza errori o warning.

### Confini del ciclo

C1 definisce e integra il modello Contact–Tenant e il lifecycle Contact. C2 consolida le identità persistenti annidate Tenant con il contratto create-once/preserve-thereafter. C3 consolida e applica le regole fiscali CT-01–CT-05. C4 consolida la create Tenant account-scoped, atomica e referenzialmente valida.

Restano task separate:

- C5 — edit e lifecycle Tenant, incluso l'enforcement fiscale dell'update con esclusione del record corrente e il riuso dei vincoli referenziali C4;
- C6 — ulteriori azioni lista non appartenenti al lifecycle C5.

C1–C4 costituiscono quindi la baseline completata che C5 deve preservare.

## 8. Funzioni documentali future

Dipendono dal backend: upload e storage definitivo di immagini, conversione immagini, lettura e creazione PDF, OCR di identità, catasto e visure camerali, scraping, firme digitali, verifica documentale, email e automazioni. Il futuro sistema distingue almeno Ricevuta, Fattura, Quietanza e Allegato del pagamento. Per la ricevuta sono già noti locatore, conduttore, importo, data e tipologia/metodo di pagamento. Restano rinviati prove definitive, momento di emissione, automatismi, regole fiscali, pagamenti parziali, crediti e debiti.

Le integrazioni documentali che richiedono backend, storage definitivo, OCR, firme, invio o automazioni rispettano la convenzione delle funzioni non disponibili. I campi e gli allegati già supportati localmente restano utilizzabili nel perimetro locale approvato.

## 9. Ordine operativo prioritario

### Baseline repository già raggiunta

L'audit del confine repository locale è concluso. Il pilot contacts comprende porta e adapter, isolamento account, provider e hook asincrono, oltre alla migrazione e al collaudo dei consumer dei garanti. Questa baseline non implica che tutti i domini o consumer siano già migrati.

Dopo l'audit del confine repository e il pilot contacts già conclusi, lo stato raggiunto è:

1. repository condiviso delle bozze manuali — implementato;
2. guard condiviso delle modifiche non salvate — implementato;
3. Nuovo inquilino — integrato e collaudato;
4. Nuova unità — integrata e collaudata;
5. Nuova locazione — integrata e collaudata;
6. repository edifici — implementato e verificato;
7. relazione unità–edificio — implementata, verificata e collaudata;
8. Nuovo edificio — implementato, verificato e collaudato;
9. route, lista, lifecycle e dettaglio edifici — completati e collaudati;
10. integrazione bozza e guard di Nuovo edificio — F3.4 completata;
11. collaudo trasversale dei quattro flussi create — F4 completato con PASS senza finding.
12. duplicati delle Unit — B2 completata e collaudata;
13. campi e cataloghi canonici delle Unit — B3 completata e verificata;
14. ID annidati canonici delle Unit — B4 completata e verificata.
15. modifica e lifecycle delle Unit — B6 completata e verificata tecnicamente, inclusi lifecycle repository, edit reale, bozza e guard edit, azioni lista/dettaglio e gate consolidato.
16. collaudo browser finale delle Unit — B9 completata con PASS funzionale e nessun finding applicativo riproducibile; restano rinviate a B9R, per limitazioni dello strumento, la verifica browser del caricamento reale degli allegati, degli ID annidati dopo create/reload/edit, del doppio submit create e dell'assenza di scritture persistite nei percorsi read-only. I relativi contratti restano già coperti dai gate automatizzati B4/B6.
17. Garanti e rubrica — C1.1–C1.4 completate e verificate: `ContactRecord` canonico condiviso da Lease e Tenant, `contactId` distinto dall'ID delle relazioni Tenant, lifecycle Contact con restore e delete protection Lease/Tenant, Garanti Tenant e contatti di emergenza migrati alla rubrica reale, compatibilità legacy e gate tecnico consolidato concluso con 95 file / 1137 test PASS.
18. ID annidati canonici Tenant — C2.1–C2.3 completate e verificate: 8 categorie di ID persistenti annidati usano il generatore canonico condiviso nei nuovi writer e rispettano create-once/preserve-thereafter; normalization, draft, `createTenant`, JSON persistito e reload preservano byte-for-byte gli ID canonici e legacy già presenti; il reload del database canonico non produce read-repair; gate concluso con 98 file / 1155 test PASS.
19. duplicati anagrafici — C3.1–C3.4 completate e verificate: identità fiscale person/company distinta, `TenantCompanyFiscalCode` e `companyFiscalCode` consolidati, hard block Contact create/update e Tenant create account-scoped, archived ed exclude-current verificati, nessun vincolo fiscale Contact↔Tenant, mapping UI fiscale e compatibilità legacy verificati; gate fiscale concluso con 7 file / 37 test PASS. Le intermittenze NewProperty osservate nelle full-suite globali C3.4 non sono risultate riproducibili nel collaudo mirato successivo, concluso con 44/44 test PASS.
20. creazione atomica Tenant — C4 completata e verificata: authority unica account-scoped per la create, bridge legacy compatibile, quota e duplicati fiscali verificati prima della mutation, relation ID non vuoti/univoci, riferimenti Contact validati nello stesso account, archived consentiti, inline legacy preservati, cross-account/dangling bloccati, massimo 5 Emergency ed exactly-one primary, una sola write sul successo e zero write sulle validation failure. Il FIX C4-F01 ha reso referenzialmente valida una fixture C2 senza rimuovere `contactId` o alterare gli ID annidati. Gate concluso con 14 test C4 PASS e full suite 106 file / 1206 test PASS.

Il ciclo locale corrente delle Unit è concluso dopo il collaudo B9. B7 — Import/Export resta rinviata, B8 — Analisi catastale/OCR resta futura/backend e B9A — Card e KPI Unit resta futura; queste attività non riaprono né bloccano la chiusura del perimetro Unit già verificato.

Il ciclo locale prioritario di Inquilini e Contatti ha completato C1 — Garanti e rubrica, C2 — ID annidati canonici Tenant, C3 — Duplicati anagrafici e C4 — Creazione atomica Tenant. La prossima task è C5 — Modifica e lifecycle Tenant; seguono C6 e quindi C10. Il modello Contact–Tenant consolidato da C1, il contratto create-once/preserve-thereafter consolidato da C2, le regole fiscali account-scoped consolidate da C3 e l'authority atomica/referenziale della create consolidata da C4 costituiscono boundary da preservare nelle task successive. Le funzioni C7–C9 e C10A dipendenti da backend, storage o sviluppo futuro non bloccano il collaudo locale di questo dominio.

Il comportamento manuale delle bozze e il guard condiviso sono integrati nei quattro flussi create supportati: Nuovo edificio, Nuova unità, Nuovo inquilino e Nuova locazione.

`Elimina e ricomincia` cancella esplicitamente la bozza persistita. Il collaudo trasversale F4 ha verificato restore, salvataggio manuale, dirty state, navigazione protetta, `Resta`, `Abbandona`, logout, submit riuscito e fallito, cleanup e persistenza.

Per refresh e chiusura della scheda resta valido il contratto `beforeunload` nativo. Durante F4 il dialog nativo non è stato osservabile dallo strumento di collaudo; la circostanza è stata classificata come limitazione strumentale, senza evidenza di difetto applicativo.

## Decisioni approvate, futuro e questioni aperte

Le regole sopra descritte sono decisioni approvate per la fase locale. Supabase, storage e servizi documentali sono attività future. Le questioni professionali ancora aperte sono registrate in [Decisioni da validare](../decisioni-da-validare.md). I vincoli di persistenza sono descritti in [Database locale e migrazione futura](./database-locale-e-migrazione.md); il form edificio in [Specifica Nuovo edificio](./nuovo-edificio.md).