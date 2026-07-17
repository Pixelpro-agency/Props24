# Coming Soon - Elementi non ancora collegati

> Questo file elenca bottoni, link e elementi cliccabili che puntano a pagine o funzionalita non ancora sviluppate. Le rotte qui sotto sono state confrontate con `src/App.tsx`.

**Ultimo aggiornamento:** 15 Luglio 2026

---

## Route attualmente funzionanti

| Route | Pagina |
|---|---|
| `/` | Redirect a `/dashboard` |
| `/dashboard` | Scrivania |
| `/properties` | Redirect a `/properties/units` |
| `/properties/units` | Lista unita |
| `/properties/units/:id` | Dettaglio proprieta |
| `/properties/buildings` | Lista edifici |
| `/properties/new` | Nuova proprieta |
| `/properties/units/import` | Importa unita |
| `/tenants` | Lista inquilini |
| `/tenants/new` | Nuovo inquilino |
| `/tenants/:id` | Dettaglio inquilino |
| `/leases` | Lista locazioni |
| `/leases/new` | Nuova locazione |

---

## Link verso route mancanti evidenziati

Questi elementi restano cliccabili come prima, ma vengono evidenziati in giallo quando puntano a rotte non dichiarate in `src/App.tsx`. Non sono state create nuove pagine.

| Area | File | Intervento |
|---|---|---|
| Sidebar | `src/components/layout/MenuItem.tsx` | Link e quick-add con route inesistente evidenziati in giallo |
| Navbar - Aggiungi | `src/components/navbar/AddMenu.tsx` | Voci con route inesistente evidenziate in giallo |
| Navbar - Aiuto | `src/components/navbar/HelpMenu.tsx` | Voci interne con route inesistente evidenziate in giallo |
| Navbar - Mio account | `src/components/navbar/SettingsMenu.tsx` | Voci con route inesistente evidenziate in giallo |
| Navbar - Avvisi | `src/components/navbar/AlertsDropdown.tsx` | Alert verso route inesistenti e footer `/alerts` evidenziati in giallo |
| Dashboard - Quick Actions | `src/components/dashboard/QuickActions.tsx` | Azioni verso `/payments/*` evidenziate in giallo |
| Dashboard - HelpFooter | `src/components/dashboard/HelpFooter.tsx` | `/support` e `/contact` evidenziati in giallo |
| Dropdown generico | `src/components/ui/Dropdown.tsx` | Supporto a voci `warning` evidenziate in giallo |
| Inquilini - PageHeader | `src/components/tenants/PageHeader.tsx` | Azione Importa verso `/tenants/import` ripristinata ed evidenziata in giallo |
| Locazioni - PageHeader | `src/components/leases/PageHeader.tsx` | Azione Importa verso `/leases/import` ripristinata ed evidenziata in giallo |

La verifica delle rotte e centralizzata in `src/utils/routes.ts`.

---

## Route mancanti ancora referenziate dai dati

Le seguenti destinazioni esistono nei dati di menu/navbar, ma non sono dichiarate in `src/App.tsx`. Sono quindi da implementare oppure da rimuovere dai dati quando non servono.

### Sidebar - `src/data/menu.ts`

| Voce | Route mancante |
|---|---|
| Edifici - quick add | `/properties/buildings/new` |
| Prenotazioni | `/reservations`, `/reservations/new` |
| Cataloghi | `/catalogs`, `/catalogs/new` |
| Inventario | `/inventory`, `/inventory/new` |
| Finanze | `/finances`, `/finances/new-expense`, `/finances/new-income` |
| Prestiti | `/finances/loans`, `/finances/loans/new` |
| Importa estratto conto | `/finances/import` |
| Bilancio | `/finances/balance` |
| Documenti | `/documents/mine`, `/documents/mine/new`, `/documents/templates`, `/documents/templates/new`, `/documents/signature`, `/documents/signature/new`, `/documents/all-templates` |
| Rubrica | `/contacts`, `/contacts/new` |
| Interventi | `/maintenance`, `/maintenance/new` |
| Attivita | `/tasks`, `/tasks/new` |
| Note | `/notes`, `/notes/new` |
| Messaggi | `/messages`, `/messages/new` |
| Candidati | `/candidates`, `/candidates/new` |
| Quesiti legali | `/legal` |
| Strumenti | `/tools/rent-update`, `/tools/expense-reconciliation`, `/tools/equipment`, `/tools/equipment/new`, `/tools/travels`, `/tools/travels/new`, `/tools/meter-reading`, `/tools/meter-reading/new`, `/tools/reports`, `/tools/news`, `/tools/ai` |
| Cestino | `/trash` |

### Navbar - `src/data/navbar.ts`

| Area | Route mancante |
|---|---|
| Aggiungi | `/reservations/new`, `/catalogs/new`, `/inventory/new`, `/contacts/new`, `/maintenance/new`, `/tasks/new`, `/agenda/new`, `/notes/new`, `/documents/mine/new`, `/messages/new`, `/candidates/invite`, `/finances/new-income`, `/finances/new-expense` |
| Aiuto | `/tools/ai`, `/support/`, `#contact` |
| Impostazioni | `/settings`, `/settings/multi-landlord`, `/settings/users`, `/settings/system-messages`, `/settings/online-payments` |
| Mio account | `/profile/edit`, `/profile/credentials`, `/profile/subscription`, `/profile/referrals`, `/profile/export`, `/logout` |
| Avvisi | `/finances?filter=rent_late`, `/alerts` |

### Dashboard

| File | Route mancante |
|---|---|
| `src/components/dashboard/QuickActions.tsx` | `/payments`, `/payments/new-income`, `/payments/new-expense` |
| `src/components/dashboard/HelpFooter.tsx` | `/support`, `/contact` |

---

## Elementi non collegati senza route reale

Questi elementi non hanno ancora una destinazione verificata. Non sono stati collegati a route inventate.

| Area | File | Stato |
|---|---|---|
| Dashboard - PremiumBanner | `src/components/dashboard/PremiumBanner.tsx` | Bottone "Scopri l'offerta" senza destinazione reale |
| Dashboard - NewsPanel | `src/components/dashboard/NewsPanel.tsx` | Bottone "Gestire" senza destinazione reale |
| Property Detail - LeaseCard | `src/components/property-detail/LeaseCard.tsx` | Bottoni Modifica/Visualizza senza route `/leases/:id` |
| Property Detail - Dropdown Modifica | `src/pages/PropertyDetailPage.tsx` | Modalita edit proprieta non dichiarata come route |
| Tenant Detail - TenantLeasesTab | `src/components/tenant-detail/TenantLeasesTab.tsx` | Bottoni Modifica/Visualizza senza route `/leases/:id` |
| CalendarSync | `src/components/property-detail/CalendarSync.tsx` | Link iCal usa fallback `#` se manca `icalImport` |

---

## Priorita consigliata

### Alta priorita

- [ ] Finanze (`/finances` e azioni reddito/spesa): referenziate da sidebar, navbar, dashboard e avvisi.
- [ ] Impostazioni (`/settings`): voce principale del menu account.
- [ ] Profilo/account (`/profile/*`): menu account molto visibile.
- [ ] Pagamenti/ricevute (`/payments/*`): presenti nelle quick action della dashboard.

### Media priorita

- [ ] Documenti (`/documents/*`): presenti in sidebar e navbar.
- [ ] Rubrica/contatti (`/contacts/*`): presenti in sidebar e navbar.
- [ ] Messaggi (`/messages/*`): presenti in sidebar e navbar.
- [ ] Dettaglio locazione (`/leases/:id`): necessario per i bottoni Visualizza/Modifica nelle schede locazione.
- [ ] Modifica proprieta: serve una route o un flusso reale per il dropdown "Modifica".

### Bassa priorita

- [ ] Prenotazioni (`/reservations/*`)
- [ ] Cataloghi (`/catalogs/*`)
- [ ] Inventario (`/inventory/*`)
- [ ] Interventi/manutenzione (`/maintenance/*`)
- [ ] Attivita/task (`/tasks/*`)
- [ ] Note (`/notes/*`)
- [ ] Candidati (`/candidates/*`)
- [ ] Quesiti legali (`/legal`)
- [ ] Strumenti (`/tools/*`)
- [ ] Cestino (`/trash`)
- [ ] Centro supporto e contatto (`/support`, `/contact`)
- [ ] Logout (`/logout`)
