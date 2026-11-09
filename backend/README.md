# FleetOS backend — Phase 2 (trips, DQF blocking, messaging, outbox sync)
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

Flyway runs migrations V1–V3 on startup (schema is versioned — Hibernate
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

Known limitation: events recorded while the browser is *online* but the
backend is unreachable are kept locally and are not retro-queued — the
offline outbox only captures events recorded while offline (or simulated
offline). The next `refreshFromServer()` reconciles the trip list from the
server.

## Tests

```bash
./mvnw test        # H2 in-memory profile (application-test.yml) — no Postgres needed
```

## What Phase 3 adds

Vehicles API, workspace settings (DQF lockout toggle endpoint, billing),
audit-binder export (1-click PDF), push notifications / rider tracking
links, broker integrations (ModivCare/MTM), and swapping the remaining
localStorage services (candidates, vehicles, audit log) for HttpClient.
File upload for signatures/DVIR photos (binary, not data URLs) also lands
there. Auth and trips stay as built here — no rework needed.
