# Props24 — Specifica Nuovo edificio

## 1. Fonte e utilizzo

La specifica deriva dagli screenshot forniti dall'utente, dal sorgente legacy della pagina Nuovo edificio e dalle decisioni prodotto approvate. Il legacy è un riferimento comportamentale e di copertura campi, basato su HTML, jQuery e chiamate server: non è codice da copiare e non deve essere aggiunto al repository.

## 2. Obiettivo locale

Il form crea realmente un edificio nel database locale, salva tutti i campi della prima fase, supporta [bozza manuale e modifiche non salvate](./fase-locale-prioritaria.md) e produce un record compatibile con il repository futuro. Il salvataggio senza unità è il flusso corrente e non richiede una conferma dedicata.

## 3. Schede

1. Informazioni generali;
2. Unità;
3. Informazioni aggiuntive;
4. Informazioni finanziarie;
5. Password e codice;
6. Foto;
7. Documenti.

## 4. Stato nella prima fase

Sono attive Informazioni generali, Unità, Informazioni aggiuntive e Informazioni finanziarie.

Password e codice, Foto e Documenti restano visibili, gialle e disabilitate: non accettano input, non usano handler fittizi, non dichiarano salvataggi e spiegano la dipendenza da backend o storage sicuro.

## 5. Informazioni generali

| Campo | Prima fase | Obbligatorio |
| --- | ---: | ---: |
| Identificativo | attivo | sì |
| Colore | attivo | no |
| Indirizzo | attivo | sì |
| Indirizzo 2 | attivo | no |
| Città | attivo | sì |
| CAP | attivo | sì |
| Provincia | attivo | no |
| Regione | attivo | no |
| Paese | attivo | sì |
| Superficie m² | attivo | no |
| Anno di costruzione | attivo | no |
| Descrizione | attivo | no |
| Nota privata | attivo | no |

Sono richieste validazione sul campo, numeri sicuri, nessuna conversione silenziosa, separazione tra descrizione e nota privata e colore canonico. L'identificativo è univoco nello stesso account, non globalmente; in edit il record corrente è escluso dal controllo.

## 6. Unità

Non si creano unità inline. Dopo il salvataggio, `Aggiungi unità` apre il normale form Nuova unità con `buildingId` preimpostato e indirizzo edificio precompilato e read-only quando il flusso parte dal dettaglio. La creazione autonoma resta disponibile. La futura associazione di unità esistenti prive di edificio non è funzione corrente. Il campo millesimi già presente nel form unità resta semplice e facoltativo, senza somme, calcoli o validazioni speciali.

## 7. Informazioni aggiuntive

Il catalogo approvato è:

```text
Accesso per i disabili
Addolcitore d'acqua
Area attrezzata con giochi
Allarme antincendio
Irrigazione
Balcone
Barre per finestre
Lavanderia in comune
Cantina
Camino
Cassaforte
Rivelatori di fumo
Automazione domestica
Produzione acqua calda centralizzata
Fibra ottica
Garage
Sorvegliante
Eliporto
Jacuzzi
Lavanderia
Casa del custode
Pannelli solari
Piscina
Porta blindata
Sauna
Spa
Tende elettriche
Videosorveglianza
Parco giochi
Termostato collegato
Scivolo spazzatura
Ventilazione meccanica
Tapparelle elettriche
Accesso Internet
Aria condizionata
Allarme
Antenna TV collettiva
Ascensore
Barbecue
Terminale per auto elettriche
Cavo/fibra
Riscaldamento centralizzato
Cinema
Concierge
Digicode
Doppi vetri
Spazio verde / giardino
Palestra
Posto bici
Golf
Citofono
Giardino
Sala biciclette
Zanzariere
Parcheggio
Cancelli elettrici
Palazzetto dello sport
Servizio di sicurezza
Tende
Sistema di sicurezza
Tennis
Terrazza
Ventilazione
Videotelefono
Tapparelle
```

`Cassaforte` normalizza il legacy “Sicuro”. La persistenza usa valori canonici stabili, non etichette fragili. Non è definito un catalogo remoto o amministrabile.

## 8. Informazioni finanziarie

Sono attivi Data di acquisto, Prezzo d'acquisto, Spese di acquisto e IMU. Le date sono ISO nel record e italiane nella UI; gli importi sono numerici, non stringhe monetarie. Non sono previsti calcolo fiscale automatico o dichiarazioni di correttezza fiscale.

## 9. Password e codice

Il legacy contempla descrizione, numero, quantità, detentore, note e fotografie. Nella prima fase la scheda è gialla e disabilitata: non salva dati sensibili o credenziali in chiaro. L'implementazione dipende da backend, autorizzazione e storage sicuro.

## 10. Foto

La scheda resta disabilitata. In futuro comprenderà fotografie multiple, copertina, upload, rimozione, conversione, storage, metadati ed errori. I Data URL persistenti non sono una soluzione definitiva.

## 11. Documenti

La scheda resta disabilitata. In futuro comprenderà documenti multipli, tipo, descrizione, file nuovo o esistente, condivisione, storage sicuro, permessi, eliminazione coordinata e OCR dopo upload reale. Il catalogo legacy non è un enum definitivo senza normalizzazione.

## 12. Bozza e navigazione

Il form segue [la specifica della fase locale](./fase-locale-prioritaria.md): bozza manuale, ripresa o eliminazione, stato dirty, modale Resta/Abbandona/Salva bozza ed eliminazione soltanto dopo submit riuscito.

## 13. Relazioni e unicità

Secondo [Database locale e migrazione futura](./database-locale-e-migrazione.md), edificio e unità usano UUID e `buildingId`; `unitsCount` è derivato. L'identificativo edificio è obbligatorio e univoco per account. Nello stesso account, stesso indirizzo completo e stesso civico identificano lo stesso edificio; `10`, `10 bis` e `10 ter` sono civici distinti. Unità, scala, piano e interno non generano nuovi edifici.

## 14. Destinazione post-submit

Dopo una creazione riuscita si apre il dettaglio dell'edificio appena creato.

## 15. Criteri di accettazione

- quattro schede attive e tre gialle disabilitate;
- obbligatorietà corretta e round-trip di tutti i campi attivi;
- bozza manuale;
- salvataggio dell'edificio senza associazioni inline e successiva azione `Aggiungi unità` tramite form dedicato;
- identificativo univoco per account, con esclusione del record corrente in edit;
- stesso indirizzo completo e civico bloccato nello stesso account;
- post-submit al dettaglio e creazione unità tramite form dedicato;
- lifecycle di modifica, archivio, ripristino ed eliminazione protetta;
- reload e isolamento account;
- nessun falso successo;
- build e lint mirato;
- collaudo browser separato.
