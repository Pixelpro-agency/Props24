# Props24 — Database locale e migrazione futura

## 1. Destinazione approvata

Provider futuro approvato: Supabase. Database: PostgreSQL.

MongoDB non è il target corrente. Il database locale non deve imitare API proprietarie di Supabase, ma usare contratti di dominio e repository migrabili.

## 2. Obiettivi del database locale

Il database locale deve permettere test funzionali completi, isolamento account, schema versionato, migrazioni idempotenti, mutazioni atomiche e dati ricaricabili dopo refresh. La UI non accede direttamente a `localStorage`: usa repository, selettori, subscription coerenti ed errori di dominio. Non sono ammesse scritture parziali.

## 3. Campi trasversali

Dove applicabile:

```text
id
accountId
schemaVersion
createdAt
updatedAt
archivedAt
```

`id` usa UUID canonici; i timestamp sono ISO; `accountId` è obbligatorio sui dati account-scoped. Nessun ID persistito nasce durante il render e `Date.now()` o `Math.random()` non sono ID definitivi. Le relazioni usano ID, non copie incontrollate.

## 4. Repository

La UI non conosce chiavi di storage, formato fisico locale, dettagli Supabase o query SQL future. I repository offrono operazioni di dominio come `list`, `get`, `create`, `update`, `archive`, `restore`, eliminazione protetta e `subscribe` quando necessario. Le mutazioni multirecord sono una singola operazione atomica.

## 5. Bozze separate

L'archivio bozze è separato dai record definitivi e usa almeno:

```text
id
accountId
formType
mode
entityId opzionale
payload
schemaVersion
createdAt
updatedAt
```

`formType` distingue almeno `building`, `property`, `tenant`, `lease`; `mode` distingue `create` ed `edit`.

Caricare una bozza non crea entità definitive. La bozza è aggiornata soltanto manualmente, resta dopo l'abbandono di modifiche non salvate, viene eliminata dopo submit riuscito ed è eliminabile esplicitamente all'apertura del form. Gli allegati futuri non devono far crescere senza limiti il JSON locale.

## 6. Storico append-only

L'archivio eventi di audit è separato e usa concettualmente:

```text
id
accountId
entityType
entityId
operation
reasonCode
reasonText opzionale
changedFields
before
after
actorAccountId
createdAt
```

Gli eventi sono immutabili, cronologici, contengono snapshot precedente e successivo, non includono dati sensibili non necessari e supportano inizialmente le locazioni, con estensione futura ad altri domini.

## 7. Unicità delle unità

Ogni unità ha sempre un UUID interno. Quando i dati catastali ufficiali sono completi, la chiave normalizzata account-scoped usa Paese, Codice Comune, Terreni/Urbano, Sezione Urbana o Comune Catastale quando presente, Foglio, Particella e Subalterno quando presente.

La normalizzazione gestisce spazi e maiuscole/minuscole, conserva gli zeri significativi, distingue i campi assenti e viene verificata in create ed edit escludendo il record corrente. Indirizzo, piano e interno non costituiscono identità catastale ufficiale.

Senza chiave catastale completa si usa un fingerprint operativo:

- con edificio: `accountId + buildingId + scala + piano + interno`, normalizzati;
- senza edificio: `accountId + indirizzo + CAP + scala + piano + interno`, normalizzati.

Il fingerprint segnala un potenziale duplicato; l'indirizzo da solo non definisce un duplicato.

## 8. Edifici e unità

Relazioni canoniche:

```text
unit.relations.buildingId
building.unitsCount derivato
```

Non si duplicano oggetti edificio nelle unità. `unitsCount` deriva dai dati reali e viene ricalcolato dopo il lifecycle delle unità. L'eliminazione dell'edificio è bloccata con relazioni non gestite. L'unicità dell'identificativo edificio resta da validare.

## 9. Allegati e storage futuro

I metadati risiedono nel database; i binari in storage dedicato. IndexedDB può essere una soluzione locale temporanea e Supabase Storage è il candidato naturale per il backend. Password e codici sensibili non vanno salvati in chiaro.

## 10. Migrazione verso Supabase/PostgreSQL

La migrazione sostituirà l'implementazione dei repository senza riscrivere i form. Dovrà prevedere mapping dei record locali, migrazioni versionate, validazione prima dell'import, report degli scarti, idempotenza, isolamento account, transazioni, vincoli univoci, foreign key, Row Level Security, storage separato e rollback.

Supabase non viene implementato in questa task.

## 11. Sicurezza dei dati

I dati locali attuali sono di test e Desktop può crearli, modificarli o eliminarli durante QA autorizzato. Prima dei dati reali serve un gate di produzione; i prompt futuri devono distinguere test e produzione. Sviluppo e collaudo non devono modificare o cancellare dati di produzione.

## 12. Pagamenti legacy, repair e migrazione locale

### Normalizzazione conservativa

Soltanto `paid`, `pending` e `late` sono status riconosciuti. Uno status assente o sconosciuto non costituisce prova dell'incasso e viene normalizzato conservativamente come non pagato. `paidDate` non viene derivata dal metodo contrattuale, incluso l'addebito.

I record incoerenti vengono ricondotti a `late` o `pending` secondo scadenza e data di riferimento, senza inventare `paidDate`, `confirmation` o `receiptNumber`.

### Preservazione e ricostruzione

Le collezioni di pagamenti non vuote vengono preservate e normalizzate. Nessuna euristica sulla forma degli ID o su singole anomalie può eliminarle o sostituirle integralmente.

Le cronologie legacy vuote vengono ricostruite mediante il calendario contrattuale esistente. Le rate generate ricostruite sono esclusivamente `late` o `pending`, non sono `paid` e non producono spese sintetiche.

### Deduplicazione delle rate generate

Le rate generate duplicate usano la chiave:

```text
leaseId + category + dueDate
```

La selezione segue, nell'ordine, l'evidenza disponibile:

```text
confirmation coerente
paid con paidDate
non pagato
updatedAt
ID stabile
```

I pagamenti manuali non vengono deduplicati.

### Persistenza del repair

Il caricamento di un database account segue il flusso:

```text
lettura
→ normalizzazione e repair
→ confronto con il valore memorizzato
→ scrittura soltanto se differente
→ rilettura e verifica
→ cache
```

L'idempotenza deriva dai dati memorizzati, senza marker separati e senza aggiornamenti artificiali di `meta.updatedAt`: la seconda inizializzazione non riscrive un database già canonico. Durante una migrazione le sorgenti legacy non vengono rimosse prima della scrittura e verifica del database account. In caso di errore resta invariato il fallback in memoria.

### Consumer finanziari

Le metriche di cassa richiedono `status: paid` e una `paidDate` valida. `accountingRole` separa `revenue`, `expense` e `deposit`: lo scaduto considera soltanto `revenue`, mentre i movimenti `deposit` non entrano nei KPI generali di ricavo e spesa.

## Collegamenti

- [Fase locale prioritaria](./fase-locale-prioritaria.md)
- [Specifica Nuovo edificio](./nuovo-edificio.md)
- [Decisioni da validare](../decisioni-da-validare.md)
