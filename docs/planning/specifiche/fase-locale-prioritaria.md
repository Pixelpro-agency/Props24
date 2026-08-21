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

La convenzione si applicherà a Importa, Esporta, FeedbackBox, Foto, Documenti, Password e codici, OCR, firme digitali, scraping, automazioni email, generazione documentale e altre integrazioni backend non disponibili.

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

## 7. Funzioni documentali future

Dipendono dal backend: upload e storage definitivo di immagini, conversione immagini, lettura e creazione PDF, OCR di identità, catasto e visure camerali, scraping, firme digitali, verifica documentale, email e automazioni. Il futuro sistema distingue almeno Ricevuta, Fattura, Quietanza e Allegato del pagamento. Per la ricevuta sono già noti locatore, conduttore, importo, data e tipologia/metodo di pagamento. Restano rinviati prove definitive, momento di emissione, automatismi, regole fiscali, pagamenti parziali, crediti e debiti.

Nella fase locale i relativi controlli rispettano la convenzione gialla e disabilitata.

## 8. Ordine operativo prioritario

### Baseline repository già raggiunta

L'audit del confine repository locale è concluso. Il pilot contacts comprende porta e adapter, isolamento account, provider e hook asincrono, oltre alla migrazione e al collaudo dei consumer dei garanti. Questa baseline non implica che tutti i domini o consumer siano già migrati.

Dopo l'audit del confine repository e il pilot contacts già conclusi, lo stato è:

1. repository condiviso delle bozze manuali — implementato;
2. guard condiviso delle modifiche non salvate — implementato;
3. Nuovo inquilino — integrato e collaudato;
4. Nuova unità — integrata e collaudata;
5. Nuova locazione — integrata e collaudata;
6. repository edifici — da implementare dopo le decisioni del Blocco A;
7. Nuovo edificio — da integrare dopo il Blocco A;
8. lista, lifecycle e collaudo edifici — da completare;
9. collaudo trasversale dei quattro CRUD — non avviabile prima dell’integrazione residua Nuovo edificio.

Il comportamento manuale è integrato nei primi tre form e resta da applicare a Nuovo edificio. `Elimina e ricomincia` cancella esplicitamente la bozza persistita. Nuova locazione comprende restore esplicito, riconciliazione dei riferimenti, guard, cleanup/recovery e submit lock; le integrazioni dei form complessi restano task separate.

## Decisioni approvate, futuro e questioni aperte

Le regole sopra descritte sono decisioni approvate per la fase locale. Supabase, storage e servizi documentali sono attività future. Le questioni professionali ancora aperte sono registrate in [Decisioni da validare](../decisioni-da-validare.md). I vincoli di persistenza sono descritti in [Database locale e migrazione futura](./database-locale-e-migrazione.md); il form edificio in [Specifica Nuovo edificio](./nuovo-edificio.md).
