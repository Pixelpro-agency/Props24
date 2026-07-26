# Props24 — Specifica Nuovo edificio

## 1. Fonte e utilizzo

La specifica deriva dagli screenshot forniti dall'utente, dal sorgente legacy della pagina Nuovo edificio e dalle decisioni prodotto approvate. Il legacy è un riferimento comportamentale e di copertura campi, basato su HTML, jQuery e chiamate server: non è codice da copiare e non deve essere aggiunto al repository.

## 2. Obiettivo locale

Il form crea realmente un edificio nel database locale, salva tutti i campi della prima fase, supporta [bozza manuale e modifiche non salvate](./fase-locale-prioritaria.md), collega unità esistenti, consente il salvataggio senza unità solo dopo conferma e produce un record compatibile con il repository futuro.

## 3. Schede

1. Informazioni generali;
2. Unità;
3. Informazioni aggiuntive;
4. Informazioni finanziarie;
5. Password e codice;
6. Criteri di ripartizione;
7. Foto;
8. Documenti.

## 4. Stato nella prima fase

Sono attive Informazioni generali, Unità, Informazioni aggiuntive, Informazioni finanziarie e Criteri di ripartizione.

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

Sono richieste validazione sul campo, numeri sicuri, nessuna conversione silenziosa, separazione tra descrizione e nota privata e colore canonico. L'unicità dell'identificativo è ancora da validare.

## 6. Unità

La scheda consente scelta e associazione di più unità esistenti, millesimi di proprietà per associazione, aggiunta e rimozione delle righe. Impedisce la stessa unità ripetuta, esclude unità archiviate e non crea implicitamente unità incomplete.

Se non esistono associazioni, una modale condivisa avverte che nessuna unità è associata e chiede se salvare comunque. `Annulla` torna al form; `Conferma` consente il submit. La mancanza di unità non è un errore assoluto e la conferma non appare con almeno un'associazione valida.

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

## 10. Criteri di ripartizione

Il form gestisce più criteri, ciascuno con identificativo o titolo obbligatorio, una o più unità/proprietà, millesimi per ogni unità/proprietà e righe aggiungibili o rimovibili. Consente modifica ed eliminazione, impedisce ripetizioni e unità archiviate.

Non è definita automaticamente la somma: l'obbligo di 1.000 rispetto a valori liberi resta in [Decisioni da validare](../decisioni-da-validare.md).

## 11. Foto

La scheda resta disabilitata. In futuro comprenderà fotografie multiple, copertina, upload, rimozione, conversione, storage, metadati ed errori. I Data URL persistenti non sono una soluzione definitiva.

## 12. Documenti

La scheda resta disabilitata. In futuro comprenderà documenti multipli, tipo, descrizione, file nuovo o esistente, condivisione, storage sicuro, permessi, eliminazione coordinata e OCR dopo upload reale. Il catalogo legacy non è un enum definitivo senza normalizzazione.

## 13. Bozza e navigazione

Il form segue [la specifica della fase locale](./fase-locale-prioritaria.md): bozza manuale, ripresa o eliminazione, stato dirty, modale Resta/Abbandona/Salva bozza ed eliminazione soltanto dopo submit riuscito.

## 14. Relazioni e unicità

Secondo [Database locale e migrazione futura](./database-locale-e-migrazione.md), edificio e unità usano UUID e `buildingId`; `unitsCount` è derivato. L'identificativo edificio è obbligatorio ma la sua unicità resta da validare. Lo stesso indirizzo non è automaticamente un duplicato.

## 15. Destinazione post-submit

Dopo una creazione riuscita si apre la lista Edifici oppure il dettaglio appena creato. La scelta resta da confermare prima della task di routing; non va inventata una route dettaglio inesistente.

## 16. Criteri di accettazione

- cinque schede attive e tre gialle disabilitate;
- obbligatorietà corretta e round-trip di tutti i campi attivi;
- bozza manuale;
- salvataggio con unità e conferma senza unità;
- associazioni senza duplicati;
- criteri persistiti;
- reload e isolamento account;
- nessun falso successo;
- build e lint mirato;
- collaudo browser separato.
