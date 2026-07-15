# 🚧 Coming Soon — Elementi Non Ancora Collegati

> Questo file elenca tutti i bottoni, link e elementi cliccabili presenti nell'interfaccia che **puntano a pagine/funzionalità non ancora sviluppate**. Usalo come riferimento per sapere cosa implementare prossimamente.

**Ultimo aggiornamento:** 2 Marzo 2026

---

## Route Attualmente Funzionanti

| Route | Pagina |
|---|---|
| `/dashboard` | Scrivania |
| `/properties/units` | Lista Unità |
| `/properties/units/:id` | Dettaglio Proprietà |
| `/properties/buildings` | Lista Edifici |
| `/properties/new` | Nuova Proprietà |
| `/properties/units/import` | Importa Unità |
| `/tenants` | Lista Inquilini |
| `/tenants/new` | Nuovo Inquilino |
| `/tenants/:id` | Dettaglio Inquilino |
| `/leases` | Lista Locazioni |
| `/leases/new` | Nuova Locazione |

---

## 1. Sidebar — Voci di Menu Senza Pagina

**File:** `src/data/menu.ts`

### Sezione "L'ESSENZIALE"

| Voce | `href` | `quickAddHref` |
|---|---|---|
| Edifici → quickAdd | — | `/properties/buildings/new` |
| Prenotazioni | `/reservations` | `/reservations/new` |
| Cataloghi | `/catalogs` | `/catalogs/new` |
| Inventario | `/inventory` | `/inventory/new` |
| Finanze | `/finances` | `/finances/new-expense`, `/finances/new-income` |
| ↳ Prestiti | `/finances/loans` | `/finances/loans/new` |
| ↳ Importa estratto conto | `/finances/import` | — |
| ↳ Bilancio | `/finances/balance` | — |
| Miei documenti | `/documents/mine` | `/documents/mine/new` |
| Miei modelli | `/documents/templates` | `/documents/templates/new` |
| Firma elettronica | `/documents/signature` | `/documents/signature/new` |
| Modelli di documenti | `/documents/all-templates` | — |

### Sezione "DI PIÙ"

| Voce | `href` | `quickAddHref` |
|---|---|---|
| Rubrica | `/contacts` | `/contacts/new` |
| Interventi | `/maintenance` | `/maintenance/new` |
| Attività | `/tasks` | `/tasks/new` |
| Note | `/notes` | `/notes/new` |
| Messaggi | `/messages` | `/messages/new` |
| Candidati | `/candidates` | `/candidates/new` |
| Quesiti Legali | `/legal` | — |
| Aggiornamento canone | `/tools/rent-update` | — |
| Conguaglio spese | `/tools/expense-reconciliation` | — |
| Attrezzature | `/tools/equipment` | `/tools/equipment/new` |
| Viaggi | `/tools/travels` | `/tools/travels/new` |
| Lettura contatori | `/tools/meter-reading` | `/tools/meter-reading/new` |
| Reports | `/tools/reports` | — |
| Notizie immobiliari | `/tools/news` | — |
| Assistente AI | `/tools/ai` | — |
| Cestino | `/trash` | — |

---

## 2. Navbar — Menu "Aggiungi"

**File:** `src/data/navbar.ts` → `src/components/navbar/AddMenu.tsx`

| Voce | `href` morto |
|---|---|
| Nuova prenotazione | `/reservations/new` |
| Nuovo catalogo | `/catalogs/new` |
| Nuovo inventario | `/inventory/new` |
| Nuovo contatto | `/contacts/new` |
| Nuovo intervento | `/maintenance/new` |
| Nuova attività | `/tasks/new` |
| Nuovo evento | `/agenda/new` |
| Nuova nota | `/notes/new` |
| Nuovo documento | `/documents/mine/new` |
| Nuovo messaggio | `/messages/new` |
| Nuovo candidato | `/candidates/invite` |
| Nuovo reddito | `/finances/new-income` |
| Nuova spesa | `/finances/new-expense` |

---

## 3. Navbar — Menu "Aiuto"

**File:** `src/data/navbar.ts` → `src/components/navbar/HelpMenu.tsx`

| Voce | `href` morto | Note |
|---|---|---|
| Assistente AI | `/tools/ai` | Anche nel sidebar |
| Centro Supporto | `/support/` | Apre in `target="_blank"` |
| Contattaci | `#contact` | Anchor inesistente |

---

## 4. Navbar — Menu "Impostazioni / Mio Account"

**File:** `src/data/navbar.ts` → `src/components/navbar/SettingsMenu.tsx`

### Impostazioni

| Voce | `href` morto |
|---|---|
| Impostazioni | `/settings` |
| Proprietari multipli | `/settings/multi-landlord` |
| Utenti | `/settings/users` |
| Messaggi di sistema | `/settings/system-messages` |
| Pagamenti online | `/settings/online-payments` |

### Mio Account

| Voce | `href` morto |
|---|---|
| Mio account | `/profile/edit` |
| Email e password | `/profile/credentials` |
| Abbonamento e fatturazione | `/profile/subscription` |
| Riferimenti | `/profile/referrals` |
| Scarica base dati | `/profile/export` |
| Esci | `/logout` |

---

## 5. Navbar — Alerts

**File:** `src/data/navbar.ts`

| Alert | `viewHref` morto |
|---|---|
| Canoni in ritardo | `/finances?filter=rent_late` |

> L'alert "Assicurazione inquilino" con `viewHref: '/leases'` è già funzionante ✅

---

## 6. Dashboard — Quick Actions

**File:** `src/components/dashboard/QuickActions.tsx`

| Azione | `href` morto | Note |
|---|---|---|
| Ricevute | `/payments` | Badge "SOON" presente |
| Aggiungi un'entrata | `/payments/new-income` | Badge "SOON" presente |
| Aggiungi una spesa | `/payments/new-expense` | Badge "SOON" presente |

---

## 7. Dashboard — HelpFooter

**File:** `src/components/dashboard/HelpFooter.tsx`

| Link | `href` morto |
|---|---|
| Centro Supporto | `/support` |
| Contattaci | `/contact` |

---

## 8. Dashboard — PremiumBanner

**File:** `src/components/dashboard/PremiumBanner.tsx`

| Elemento | Problema |
|---|---|
| Bottone "Scopri l'offerta" | `<button>` senza `onClick` — non fa nulla |

**Da collegare a:** futura pagina abbonamento/pricing

---

## 9. Dashboard — NewsPanel

**File:** `src/components/dashboard/NewsPanel.tsx`

| Elemento | Problema |
|---|---|
| Bottone ingranaggio "Gestire" | `<button>` senza `onClick` — non fa nulla |

**Da collegare a:** futura funzionalità gestione feed notizie

---

## 10. Property Detail — LeaseCard (bottoni)

**File:** `src/components/property-detail/LeaseCard.tsx`

| Elemento | Problema |
|---|---|
| Bottone matita "Modifica" (riga ~59) | `<button>` senza `onClick` |
| Bottone occhio "Visualizza" (riga ~65) | `<button>` senza `onClick` |

**Da collegare a:** futura pagina dettaglio/modifica locazione (`/leases/:id`)

---

## 11. Property Detail — Dropdown "Modifica"

**File:** `src/pages/PropertyDetailPage.tsx`

| Elemento | Problema |
|---|---|
| Voce "Modifica" nel dropdown azioni (riga ~52) | `onClick` chiude solo il menu senza navigare |

**Da collegare a:** futura modalità edit della proprietà (riutilizzare `NewProperty` con parametro `?edit=id`)

---

## 12. Tenant Detail — TenantLeasesTab (bottoni)

**File:** `src/components/tenant-detail/TenantLeasesTab.tsx`

| Elemento | Problema |
|---|---|
| Bottone "Modifica" (riga ~62) | `<button>` senza `onClick` |
| Bottone "Visualizza" (riga ~66) | `<button>` senza `onClick` |

**Da collegare a:** futura pagina dettaglio/modifica locazione (`/leases/:id`)

---

## 13. Page Headers — Bottoni "Importa"

| File | `navigate()` morto |
|---|---|
| `src/components/tenants/PageHeader.tsx` | `/tenants/import` |
| `src/components/leases/PageHeader.tsx` | `/leases/import` |

**Da fare:** creare le rispettive pagine di import, oppure disabilitare/nascondere i bottoni

---

## 14. CalendarSync — Link iCal Import

**File:** `src/components/property-detail/CalendarSync.tsx`

| Elemento | Problema |
|---|---|
| Link "Clicca qui" (riga ~111) | `href={property.urls.icalImport ?? '#'}` — fallback a `#` se non c'è URL |

**Da fare:** Popolare `icalImport` nei mock data con un URL valido

---

## 📊 Riepilogo per Priorità

### Alta priorità (usati frequentemente)
- [ ] Pagina Finanze (`/finances`) — referenziata da sidebar, navbar, dashboard, alerts
- [ ] Pagina Impostazioni (`/settings`) — navbar
- [ ] Pagina Profilo/Account (`/profile/*`) — navbar

### Media priorità (sezioni secondarie)
- [ ] Documenti (`/documents/*`) — sidebar + navbar
- [ ] Rubrica/Contatti (`/contacts`) — sidebar + navbar
- [ ] Messaggi (`/messages`) — sidebar + navbar
- [ ] Dettaglio Locazione (`/leases/:id`) — usato da LeaseCard e TenantLeasesTab
- [ ] Modifica Proprietà (edit mode in `/properties/new`) — PropertyDetailPage dropdown

### Bassa priorità (funzionalità avanzate)
- [ ] Prenotazioni (`/reservations`) — expert mode
- [ ] Cataloghi (`/catalogs`)
- [ ] Inventario (`/inventory`)
- [ ] Interventi/Manutenzione (`/maintenance`) — expert mode
- [ ] Attività/Task (`/tasks`) — expert mode
- [ ] Note (`/notes`) — expert mode
- [ ] Candidati (`/candidates`)
- [ ] Quesiti Legali (`/legal`)
- [ ] Strumenti (`/tools/*`)
- [ ] Cestino (`/trash`)
- [ ] Centro Supporto (`/support`)
- [ ] Contattaci (`/contact`)
- [ ] Logout (`/logout`)
