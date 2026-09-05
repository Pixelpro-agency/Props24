# S2.3 — Supabase Auth adapter

## Scopo

S2.3 introduce la foundation applicativa di Supabase Auth necessaria a Props24 senza effettuare ancora il cutover della sessione runtime.

La task introduce:

* `@supabase/supabase-js` come SDK runtime browser;
* client Supabase browser condiviso;
* Auth port applicativo indipendente dalle shape dell'SDK;
* adapter Supabase Auth;
* login email/password;
* signup email/password con metadata nominali di bootstrap;
* lettura dell'utente Auth corrente;
* subscription agli Auth state change;
* logout della sessione browser corrente;
* normalizzazione applicativa degli errori Auth.

S2.3 non introduce Profile, Workspace, Membership, RLS, Storage o persistence business Supabase.

---

## Dependency e runtime Node

Props24 utilizza:

```text
@supabase/supabase-js
→ 2.115.0
→ versione exact
```

L'SDK è una dependency runtime perché viene utilizzato dal bundle browser.

Con l'introduzione dell'SDK Supabase il requisito Node corrente del progetto diventa:

```text
>=22.12.0
```

Node 20 non fa più parte del runtime supportato da Props24.

---

## Environment browser

Il client Supabase browser utilizza esclusivamente:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Queste variabili costituiscono configurazione browser-safe.

Non vengono utilizzati o esposti:

```text
secret key
service role
SUPABASE_SECRET_KEY
VITE_SUPABASE_SECRET_KEY
```

URL, project ref e API key non vengono hardcodati nel sorgente.

---

## Supabase browser client

Implementazione:

```text
src/supabase/client.ts
```

Il client:

```text
createClient
→ lazy
→ singleton
```

e mantiene abilitate le normali funzioni Auth browser:

```text
persistSession
autoRefreshToken
detectSessionInUrl
```

Se `VITE_SUPABASE_URL` o `VITE_SUPABASE_PUBLISHABLE_KEY` mancano o sono vuote, la richiesta del client fallisce esplicitamente.

Non esiste:

```text
fallback verso Auth locale
client fake
placeholder silenzioso
```

---

## Auth port

Implementazione:

```text
src/auth/authAdapter.ts
```

Il port applicativo mantiene Props24 indipendente dalle shape fisiche di Supabase Auth.

L'identità minima è:

```text
AuthIdentity

id
email
```

Non appartengono ad `AuthIdentity`:

```text
password
fiscalCode
workspaceId
membership
role
access token
refresh token
JWT
```

L'identità target corrisponde concettualmente a:

```text
auth.users.id
→ UUID
```

senza creare una seconda tabella `accounts`.

---

## Login

Il primo cutover Auth approvato utilizza:

```text
email
+
password
```

Il nuovo Auth adapter non supporta:

```text
codice fiscale + password
```

Il codice fiscale resta Profile identity e non Auth credential.

Il login Supabase utilizza:

```text
signInWithPassword
```

senza lookup preliminari che possano introdurre user enumeration.

---

## Signup

L'input applicativo è:

```text
firstName
lastName
email
password
```

`confirmPassword` resta una responsabilità della futura UI/form.

Il codice fiscale non è richiesto dall'Auth adapter.

Al signup vengono inviati come metadata non autorizzativi esclusivamente:

```text
first_name
last_name
```

Questi metadata sono bootstrap/convenience e non diventano authority applicativa.

Il futuro:

```text
public.profiles
```

sarà l'authority dei dati personali applicativi secondo S1.2 e verrà introdotto nelle task successive.

---

## Conferma email

L'adapter non assume che tutti gli ambienti abbiano la stessa configurazione di conferma email.

Gestisce entrambi i risultati:

```text
signup
→ user + session
→ authenticated
```

e:

```text
signup
→ user + session assente
→ confirmation_required
```

Una risposta provider incoerente non viene trasformata in dati inventati e produce un failure applicativo.

---

## Current authenticated user

L'adapter consente la lettura dell'utente Auth corrente tramite Supabase e normalizza il risultato in:

```text
AuthIdentity
```

oppure:

```text
null
```

Non vengono esposti al caller:

```text
access token
refresh token
JWT raw
Session raw
provider identity raw
```

---

## Auth state subscription

L'adapter incapsula:

```text
onAuthStateChange
```

e converte gli eventi Supabase in eventi applicativi normalizzati.

Sono gestiti gli eventi Auth previsti dal lifecycle SDK utilizzato, fra cui:

```text
INITIAL_SESSION
PASSWORD_RECOVERY
SIGNED_IN
SIGNED_OUT
TOKEN_REFRESHED
USER_UPDATED
MFA_CHALLENGE_VERIFIED
```

La subscription espone un unsubscribe applicativo che rimuove realmente la subscription Supabase.

Il listener applicativo non riceve token o sessioni raw.

---

## Logout

Il logout Supabase utilizza esplicitamente:

```text
signOut({ scope: 'local' })
```

La semantica è:

```text
logout
→ sessione/browser corrente
```

e non:

```text
logout
→ revoca automatica di tutte le sessioni su tutti i dispositivi
```

Il teardown di cache, repository e scope applicativo non appartiene a S2.3.

---

## Error normalization

Gli errori Auth vengono normalizzati a partire dai codici strutturati del provider.

Il contratto applicativo iniziale distingue:

```text
invalid_credentials
email_not_confirmed
already_registered
weak_password
rate_limited
configuration_error
provider_error
```

I messaggi inglesi provenienti dal provider non costituiscono contratto applicativo.

Gli errori non riconosciuti convergono in un failure provider esplicito.

Password, token e credential payload non vengono esposti nei risultati applicativi.

---

## Runtime boundary

Alla chiusura di S2.3 resta intenzionalmente vero:

```text
Supabase Auth adapter
→ IMPLEMENTATO
→ TESTATO
→ NON ANCORA COMPOSTO NEL RUNTIME

AuthProvider
→ usa ancora authStorage locale

Auth runtime authority
→ locale

business persistence
→ locale

dual-write Auth
→ NO

fallback Auth
→ NO

runtime cutover
→ NO
```

Questo confine è necessario perché il runtime corrente lega ancora:

```text
LocalAccount.id
→ active database account
→ persistence business locale
```

Sostituire direttamente `LocalAccount.id` con `auth.users.id` ricreerebbe il modello:

```text
utente = database
```

che S0/S1 hanno esplicitamente eliminato dal target.

Il flusso futuro resta:

```text
Supabase Auth User
→ Membership
→ Workspace
→ scoped dependencies
→ PostgreSQL/RLS
```

---

## Task successive

Il modello fisico di:

```text
Profile
Workspace
Membership
Workspace Profile
```

appartiene a:

```text
S2.4 — Profile, Workspace e Membership foundation
```

Il bootstrap/join Workspace appartiene a S2.5.

La RLS baseline appartiene a S2.6.

Storage appartiene a S2.7.

La composizione dell'Auth adapter nel runtime e il passaggio reale di sessione/logout/cache/scope appartengono a:

```text
S2.8 — Session, logout, cache e scope transition
```

La rimozione definitiva dell'Auth persistence locale avverrà soltanto dopo la verifica dei consumer residui prevista dal cleanup finale del Blocco S.

---

## File implementati

```text
src/supabase/client.ts
src/auth/authAdapter.ts
src/auth/supabaseAuthAdapter.ts

tests/supabase/client.test.ts
tests/auth/supabaseAuthAdapter.test.ts
```

Sono inoltre aggiornati:

```text
package.json
package-lock.json
```

per dependency Supabase e requisito Node.

---

## Gate verificato

S2.3A ha prodotto:

```text
test Supabase client/Auth adapter
→ 17 PASS / 0 FAIL

regression Auth/navigation runtime corrente
→ 42 PASS / 0 FAIL

build
→ PASS

git diff --check
→ PASS
```

Il runtime Auth locale non è stato modificato.

Non sono state introdotte:

```text
migration
Profile
Workspace
Membership
RLS
Storage
Realtime business
Edge Function
remote Auth mutation
```

Il gate non richiede browser QA perché S2.3 non modifica intenzionalmente il comportamento UI/runtime.

---

## Dependency audit

Durante il gate è stato eseguito anche un controllo `npm audit`.

Le vulnerabilità runtime segnalate appartengono a dependency già presenti nel progetto o alle relative catene, fra cui Axios, React Router e Vite.

Non è risultata coinvolta la nuova catena introdotta da:

```text
@supabase/supabase-js
@supabase/auth-js
@supabase/functions-js
@supabase/postgrest-js
@supabase/realtime-js
@supabase/storage-js
iceberg-js
```

Nessun `npm audit fix` è stato eseguito dentro S2.3.

L'aggiornamento delle dependency vulnerabili preesistenti costituisce manutenzione separata e non viene accorpato opportunisticamente alla foundation Auth.

---

## Stato

```text
S2.3
→ COMPLETATA E VERIFICATA

S2.3A
→ SUPABASE AUTH ADAPTER FOUNDATION COMPLETATA

Supabase Auth adapter
→ IMPLEMENTATO E TESTATO

Auth runtime
→ ANCORA LOCALE

Runtime cutover
→ RINVIATO A S2.8

Prossima task
→ S2.4 — Profile, Workspace e Membership foundation
```
