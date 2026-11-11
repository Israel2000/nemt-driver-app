# FleetOS backend — Phase 3 (brokers, billing/CMS-1500, rider tracking, notifications, compliance checks, proof upload)
#
# Stack: Spring Boot 3.3 (Java 21) + PostgreSQL 16 + Flyway + JWT.
# The Angular app talks to it through proxy.conf.json (npm start) or directly
# via CORS (localhost:4200 and the Vercel site are allowed).

## Run it

```bash
# 1. Database (pick one — the app expects a `fleetos` DB on localhost:5432)
docker compose up -d            # Postgres 16 in Docker, user/pass fleetos/fleetos
# ... or start the local Postgres cluster and create the DB:
#    sudo -u postgres psql -c "CREATE USER fleetos WITH PASSWORD 'fleetos';"
#    sudo -u postgres psql -c "CREATE DATABASE fleetos OWNER fleetos;"

# 2. Backend (from backend/)
./mvnw spring-boot:run           # listens on http://localhost:8080

# 3. Frontend (from the repo root, separate terminal)
npm start                        # http://localhost:4200, /api proxied to :8080
```

Flyway runs migrations V1–V4 on startup (schema is versioned — Hibernate
`ddl-auto` is `validate`, never `update`). On first start against an empty DB
the seeder creates the demo workspace + users (see "Demo logins").

## Endpoints (Phase 1 + 2)

All `/api/**` endpoints except the auth ones require
`Authorization: Bearer <jwt>`. Every endpoint is **workspace-scoped**: a user
only ever sees their own workspace's data (cross-workspace access is a 404),
and a DRIVER only sees/acts on trips assigned to their driver record.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | — | `{email, password}` → `{token, user, workspace}`; 401 on bad credentials |
| POST | /api/auth/register | — | `{companyName, email, password, fullName?, fleetSize?, plan?}` → creates workspace + ADMIN user, 201; 409 if email exists |
| GET | /api/auth/me | JWT | Current user (re-issues a token) |
| GET | /actuator/health | — | Liveness probe |
| GET | /api/trips?status=&driver= | JWT | List (status + driver-code filters). Drivers see only their trips |
| GET | /api/trips/{id} | JWT | One trip (`{id}` = UUID or TRP- code) |
| POST | /api/trips | JWT, ADMIN/DISPATCHER | Create/assign; DQF check — blocked driver → 403 + reasons |
| PATCH | /api/trips/{id}/assign | JWT, ADMIN/DISPATCHER | Reassign driver/vehicle; DQF check applies |
| POST | /api/trips/{id}/status | JWT | Lifecycle transition (see below); illegal → 400 |
| POST | /api/trips/{id}/securement | JWT | Wheelchair checklist (8 items) |
| POST | /api/trips/{id}/proof | JWT | Proof of delivery (odometer + signatures) |
| GET | /api/trips/{id}/events | JWT | GPS-stamped status history |
| GET/POST | /api/trips/{id}/messages | JWT | Per-trip driver↔dispatch thread |
| GET | /api/trips/{id}/eta?to=dropoff\|pickup | JWT | Haversine ETA @ 30 mph, labelled estimate |
| GET | /api/drivers | JWT | Roster with computed DQF status + days-left |
| GET | /api/drivers/{id} | JWT | One driver (`{id}` = UUID or DRV- code) |
| GET | /api/drivers/{id}/dqf | JWT | Full credential list with live status |
| GET | /api/drivers/{id}/eligibility | JWT | Eligibility check for one driver |
| POST | /api/drivers/{id}/credentials | JWT, ADMIN/DISPATCHER | Add a credential |
| PUT | /api/credentials/{id} | JWT, ADMIN/DISPATCHER | Renew/update a credential |
| GET | /api/dispatch/eligibility?driverId= | JWT | Eligibility check (same rule as trip creation) |
| POST | /api/sync/outbox | JWT | Flush offline-outbox batch (see below) |

Everything else under `/api/**` requires a `Authorization: Bearer <jwt>` header.
Tokens live 24h (see `app.jwt.expiration-ms`).

### Trip lifecycle

`ASSIGNED → EN_ROUTE → ARRIVED → BOARDED → COMPLETED`, plus `NO_SHOW` /
`CANCELLED` / `DELAYED` (with a reason code). `DELAYED` is a hold — the trip
resumes into its next live status. Illegal transitions return 400. Every
transition records GPS + timestamp + a `trip_status_events` row (and a
mirrored `audit_events` row).

Rules enforced server-side (the frontend also enforces them, so a bad
client cannot bypass them):

- **ARRIVED proximity gate:** a live fix > 0.5 miles from the pickup returns
  409 with `{distanceMiles, requiresConfirm: true}`; resend with
  `"confirm": true` to proceed. No GPS supplied → the fix is the stop's
  known coordinates, stamped `gpsSource: "estimated"` — never faked as live.
- **BOARDED gate:** wheelchair trips need the full 8-item securement
  checklist first, else 409 `securementRequired`.
- **COMPLETED gate:** odometer + passenger signature + driver signature are
  all required, else 409 with the missing fields; with them the trip is
  `billable: true`.

### DQF eligibility / dispatch blocking

Computed live from credential expiry dates (the stored `status` column is
not trusted on its own): expired → lockout reason; expiring within 30 days
→ warning. The workspace **DQF hard-lockout toggle** lives in
`workspaces.dqf_lockout_enabled` (V3, default ON): when ON, an expired
credential hard-blocks dispatch (`POST /api/trips` → 403 with `reasons`);
when OFF, expired items only warn and dispatch is allowed. OIG/SAM and MVR
checks from the frontend rule are not modelled yet (no such fields — Phase 3).

### Offline-outbox sync protocol

`POST /api/sync/outbox` accepts `{events: [{clientEventId, kind, tripId,
payload}]}` — oldest first, in array order. Kinds: `status`, `assignment`
(full trip payload creates a missing trip), `message`, `securement`,
`proof`, `exception` (audit-only). Each event returns
`{clientEventId, result, detail}` where result is `APPLIED`, `REJECTED`
(with a reason — a rejected event never fails the rest of the batch), or
`DUPLICATE` (the `clientEventId` was already seen in this workspace —
deduped by the unique `(workspace_id, client_event_id)` constraint, so a
re-flush never double-applies). Unknown kinds (`dvir`, …) are `REJECTED`.

## Demo logins (seeded on first start, BCrypt-hashed — never plaintext)

| Email | Password | Role | Who |
|-------|----------|------|-----|
| admin@nemtos.com | admin123 | ADMIN | Sarah Jenkins (Fleet Director), Metro Care Transit LLC (ws-metro-01) |
| driver@nemtos.com | driver123 | DRIVER | Marcus Vance, DRV-101 |
| operator@metrotransit.com | demo | DISPATCHER | Metro Care Operations Lead |

The seeder only runs when the `users` table is empty — it never overwrites
real accounts. Demo driver/vehicle/trip rows (DRV-101/102/103, Van #1–3,
TRP-100/101/102) are seeded the same way.

## Env vars

| Var | Default (dev) | Notes |
|-----|---------------|-------|
| SPRING_DATASOURCE_URL | jdbc:postgresql://localhost:5432/fleetos | |
| SPRING_DATASOURCE_USERNAME | fleetos | |
| SPRING_DATASOURCE_PASSWORD | fleetos | |
| JWT_SECRET | dev-only placeholder | **Set a long random secret in production** — the default is marked dev-only in code |
| PORT | 8080 | |

Copy `.env.example` to `.env` for local overrides (never commit `.env`).

> **No-TCP environments:** if Java cannot open TCP sockets (some sandboxes
> block them), the driver can reach Postgres over its Unix socket instead —
> the backend ships the junixsocket runtime dependency for exactly this:
>
> ```bash
> SPRING_DATASOURCE_URL='jdbc:postgresql://localhost:5432/fleetos?socketFactory=org.newsclub.net.unix.AFUNIXSocketFactory$FactoryArg&socketFactoryArg=/var/run/postgresql/.s.PGSQL.5432' ./mvnw spring-boot:run
> ```
>
> (Local Postgres must allow password auth over the socket — set
> `local all all scram-sha-256` in `pg_hba.conf`.) Normal machines use plain
> TCP `localhost:5432` and never need this.

## Frontend fallback (important)

The Angular `AuthService.login()` tries the real API first
(`POST /api/auth/login` via the dev proxy). If the backend is unreachable —
e.g. the Vercel deployment, which has no backend yet — it falls back to the
existing demo auth (localStorage accounts) exactly as before, so the live
demo never breaks. When the API succeeds, the JWT is stored as `nemt_jwt`
and the session is the real one. Same for signup via `register()`.

**Phase 2 dual-mode:** the same pattern now covers trips, drivers and sync:

- `TripService` pulls the server trip list on startup (when a JWT exists)
  and pushes creates / status changes / reassignments / securement to
  `/api/trips` in the background, keeping the exact same public methods —
  driver-runs, the dispatch console and the proof drawers are untouched.
  Local state is applied first (optimistic), so the UI never waits on the
  network; if the API is unreachable everything stays on the localStorage
  behaviour from before.
- `SyncService` flushes the offline outbox to `POST /api/sync/outbox`
  (idempotent client event ids) when a backend is reachable, otherwise it
  runs the original local flush. Queued events carry their full payload
  (status + GPS + proof, message body, …) so the server can re-apply them.
- `ComplianceService` refreshes DQF expiries from
  `GET /api/drivers/{code}/dqf` when a backend is reachable; the local
  eligibility check still runs first in Quick Dispatch, and the server
  re-checks on trip creation.
- An `authTokenInterceptor` attaches the JWT to `/api` requests.

Known limitation (fixed in Phase 3): events recorded while the browser is
*online* but the backend is unreachable are now retro-queued — a failed
server push (status 0) puts the event into the offline outbox
(`SyncService.queueFailedEvent()`, deduped by event id) and flips the
activity entry back to unsynced, so the next successful flush sends it to
`POST /api/sync/outbox` with the same idempotency. Same for dispatch
messages (`SyncService.sendMessage()`).

## Tests

```bash
./mvnw test        # H2 in-memory profile (application-test.yml) — no Postgres needed
```

## What Phase 3 adds

### 1. Broker integrations — intake + mapping layer, NOT a live connection

Real broker APIs (ModivCare / MTM / Verida) need broker credentials and a
signed agreement, which do not exist here. What is built is a working
intake + mapping layer with a stub adapter per broker, so a real credential
can be plugged in later without a rewrite (`brokers/BrokerAdapter` +
`BrokerAdapters` — field-name mapping only, no network calls).

- `GET /api/brokers` — ModivCare / MTM / Verida, all `NOT_CONNECTED` with
  `connectionRequirement: "credentials_required"`. The UI shows this truth
  instead of pretending to be connected.
- `POST /api/brokers/{broker}/intake` (ADMIN/DISPATCHER) — accepts a broker
  trip payload, validates + normalises it into the app's Trip model,
  dedupes by broker trip id (repeat intake returns the existing record
  with `status: "DUPLICATE"`).
- `GET /api/brokers/{broker}/trips` — intake records + import status.
- `POST /api/brokers/{broker}/trips/{intakeId}/import` — creates a real
  Trip from an intake record; DQF eligibility is still enforced.
- Tables: `broker_connections`, `broker_trips` (Flyway V4).

To go live, Israel needs from each broker: API credentials (client id /
secret or API key), the broker's trip-intake endpoint + payload spec, and
the broker's trip-id format for dedupe. Until then every broker row reads
`NOT_CONNECTED`.

### 2. Billing / CMS-1500 — claims from billable trips

- `POST /api/billing/claims/from-trip/{tripId}` — only COMPLETED +
  billable trips (409 otherwise, and 409 if a claim already exists).
  Claim numbers `CLM-1001+`; status DRAFT → SUBMITTED → PAID / DENIED.
- `GET /api/billing/claims` (status filter), `GET /api/billing/claims/{id}`,
  `POST /api/billing/claims/{id}/submit` (creates an invoice, SENT, due in
  30 days), `POST /api/billing/claims/{id}/mark-paid`,
  `POST /api/billing/claims/{id}/mark-denied {reason}`,
  `GET /api/billing/claims/{id}/cms1500` — a **structured JSON
  representation of the CMS-1500 form fields** (boxes 1–33), not a printable
  PDF. No PDF is generated yet; the response lists its placeholders.
- `GET /api/billing/invoices`.
- Tables: `claims`, `invoices` (Flyway V4).
- **Amounts: the flat $45.00 per completed billable trip is a documented
  placeholder rate** (there is no trip pricing field yet). Replace it with
  real broker rate tables before billing anyone.
- Frontend: the admin billing page lists claims from the API when the
  backend is reachable (actions submit / mark paid / mark denied / view
  CMS-1500 JSON) and shows demo claims from localStorage otherwise — the
  four demo billing cards are untouched.

### 3. Rider tracking links — signed, expiring, public-safe

- `POST /api/trips/{id}/tracking-link` (ADMIN/DISPATCHER) — creates or
  returns a 48-hex-char token (`SecureRandom`), stored in
  `tracking_tokens`. Expiry: 24h after trip completion, otherwise 7 days
  after scheduling; re-issuing an expired token extends it to 24h from now.
- `GET /api/public/tracking/{token}` — **no auth** (the token is the
  credential). Returns only: trip code, status, ETA, driver first name,
  vehicle label, pickup/dropoff **areas** (city/state — never the street
  address). No rider phone, no signatures, no full address. Invalid or
  expired token → 404.
- Frontend: public route `/track/:token` (no login, no guard) shows live
  status + ETA.
- Table: `tracking_tokens` (Flyway V4).

### 4. Push notifications — in-app is real, WebPush is stubbed

- `notifications` table (Flyway V4) + `NotificationService`: trip
  lifecycle + claim events create persistent notifications.
  Recipients: TRIP_ASSIGNED → the assigned driver; EN_ROUTE / ARRIVED /
  TRIP_COMPLETED / CLAIM_DENIED → all ADMIN + DISPATCHER users; MESSAGE →
  the other side of the thread.
- `GET /api/notifications` (JWT, per user), `GET
  /api/notifications/unread-count`, `POST /api/notifications/{id}/read`,
  `POST /api/notifications/read-all`. Frontend polls every 60s (driver +
  admin bell in the topbars); offline, the bell shows nothing — no fake
  notifications are invented.
- **WebPush/VAPID delivery is NOT built.** `PushChannel` +
  `NoOpPushChannel` is a stub that logs the attempt and never fakes a
  delivery. Going live needs VAPID keys (`app.push.vapid-public-key` /
  `app.push.vapid-private-key` in `application.yml`) + a service worker.

### 5. OIG/SAM + MVR fields — SIMULATED / MANUAL only

- Driver columns (Flyway V4): `oig_status` / `oig_last_checked`,
  `sam_status` / `sam_last_checked`, `mvr_status` / `mvr_last_checked`.
- `GET /api/drivers/{id}/compliance` — full view incl. OIG/SAM/MVR +
  check history + a disclaimer that checks are simulated.
- `POST /api/drivers/{id}/compliance/run-check` (ADMIN) and
  `POST /api/drivers/compliance/run-check` (batch, ADMIN) — record a check
  run with timestamp + result. **Source is `SIMULATED` by default
  (or `MANUAL`) and the result is CLEAR by default; this is never a live
  federal lookup.** A live lookup needs a screening vendor or the OIG LEIE
  file.
- Table: `compliance_checks` (Flyway V4).
- Frontend: the Audit Shield "Run OIG/SAM Scan" button calls the batch
  endpoint when the backend is reachable and falls back to the demo scan
  when it is not; both snackbars now say the check is simulated/demo,
  not a live federal lookup (the old message claimed LEIE verification —
  that wording is gone).

### 6. Binary proof upload — local disk, 10 MB, linked to billable rules

- `POST /api/trips/{id}/proof/upload` (multipart) — kinds
  `SIGNATURE_DRIVER` / `SIGNATURE_PASSENGER` / `ODOMETER`; whitelist
  `image/*` + PDF; 10 MB limit. Files land in `backend/uploads`
  (gitignored, `app.uploads.dir`, env `UPLOADS_DIR`) with metadata in
  `proof_files` (Flyway V4). Uploading an ODOMETER file satisfies the
  odometer requirement; SIGNATURE_DRIVER / SIGNATURE_PASSENGER files
  satisfy the signature flags (they mirror onto the trip's flags) — so a
  trip with the three binary files attached can complete as billable
  without JSON proof. The existing JSON proof endpoint is unchanged.
- `GET /api/trips/{id}/proof/files` (list), `GET /api/proof-files/{id}`
  (download, JWT + workspace-scoped).

### 7. Retro-queue fix (Phase 2 known limitation)

See "Frontend fallback" above — failed online pushes now land in the
offline outbox and flush on the next successful sync, same idempotency.

## What remains after Phase 3

- Broker live connections (needs real broker credentials + approval;
  adapter layer is ready).
- Real CMS-1500 PDF (needs a PDF library + payer layout) and real broker
  rate tables (replace the $45.00 placeholder).
- WebPush delivery (needs VAPID keys + service worker).
- Live OIG/SAM lookup (needs a screening vendor or the OIG LEIE file).
- Vehicles API, workspace settings endpoint, audit-binder export
  (1-click PDF) — listed in the Phase 2 README as Phase 3; not covered
  by this phase.
- Contact-form inbox endpoint (messages still pile up in localStorage).
- Driver vault locks to the signed-in driver once there is a real identity
  (still lets you switch between all drivers' DQF files).
- Annual discount (20% off) is still an unconfirmed placeholder.
