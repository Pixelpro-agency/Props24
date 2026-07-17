# DB JSON temporaneo

Questa cartella contiene la base dati temporanea del gestionale.

- `database.json` è il seed iniziale ricavato dai mock presenti in `src/data`.
- `jsonDb.ts` legge il seed e salva le modifiche in `localStorage`.

Uso previsto nella prossima fase:

- i pulsanti `Salva` dei form creeranno record nelle rispettive collezioni;
- i pulsanti `Modifica` aggiorneranno record esistenti;
- i pulsanti `Elimina` rimuoveranno o archivieranno record;
- quando arriverà un vero database, le chiamate di `jsonDb.ts` verranno sostituite con API reali.

Collezioni già previste:

- `properties`
- `propertyDetails`
- `buildings`
- `tenants`
- `tenantList`
- `leases`
- `contacts`
- `documents`
- `payments`
- `reservations`
- `catalogs`
- `inventory`
- `maintenance`
- `tasks`
- `notes`
- `messages`
- `candidates`
