# FleetOS backend — Phase 1 (auth + schema)
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

Flyway runs migrations V1/V2 on startup (schema is versioned — Hibernate
`ddl-auto` is `validate`, never `update`). On first start against an empty DB
the seeder creates the demo workspace + users (see "Demo logins").

## Endpoints (Phase 1)

| Method | Path               | Auth | Description |
|--------|--------------------|------|-------------|
| POST   | /api/auth/login    | —    | `{email, password}` → `{token, user, workspace}`; 401 on bad credentials |
| POST   | /api/auth/register | —    | `{companyName, email, password, fullName?, fleetSize?, plan?}` → creates workspace + ADMIN user, 201; 409 if email exists |
| GET    | /api/auth/me       | JWT  | Current user (re-issues a token) |
| GET    | /actuator/health   | —    | Liveness probe |

Everything else under `/api/**` requires a `Authorization: Bearer <jwt>` header.
Tokens live 24h (see `app.jwt.expiration-ms`).

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

## Tests

```bash
./mvnw test        # H2 in-memory profile (application-test.yml) — no Postgres needed
```

## What Phase 2 adds

Trips API (lifecycle + GPS + proof-of-delivery), driver/DQF endpoints with
server-side dispatch blocking, dispatch messaging, offline-outbox sync, and
swapping the frontend's localStorage trip/driver services for HttpClient.
Auth stays as built here — no rework needed.
