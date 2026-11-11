-- V4: Phase 3 — broker intake, billing/claims, notifications, rider tracking
-- tokens, binary proof files, driver OIG/SAM/MVR compliance fields.
--
-- Honesty boundaries (see backend/README.md):
-- * Brokers: intake + mapping only. No live broker API connection exists
--   (broker_connections rows are NOT_CONNECTED until real credentials are
--   configured); the adapter layer is a stub ready for a real credential.
-- * OIG/SAM/MVR checks: recorded as SIMULATED/MANUAL — never presented as
--   a live federal lookup. No live exclusion-database API is called.
-- * Push: in-app notifications are real and stored; WebPush delivery is a
--   stub channel until VAPID keys + a service worker exist.

-- Broker connections: one row per broker per workspace. All start
-- NOT_CONNECTED; a real connection needs broker-issued API credentials.
CREATE TABLE IF NOT EXISTS broker_connections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          VARCHAR(64) NOT NULL REFERENCES workspaces (id),
  broker                VARCHAR(32) NOT NULL,
  status                VARCHAR(32) NOT NULL DEFAULT 'NOT_CONNECTED',
  credentials_configured BOOLEAN NOT NULL DEFAULT FALSE,
  note                  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_broker_connection_workspace_broker UNIQUE (workspace_id, broker)
);

-- Broker trip intake: raw broker payloads, normalised into the app's Trip
-- model on import. Deduped by (workspace, broker, broker_trip_id).
CREATE TABLE IF NOT EXISTS broker_trips (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     VARCHAR(64) NOT NULL REFERENCES workspaces (id),
  broker           VARCHAR(32) NOT NULL,
  broker_trip_id   VARCHAR(128) NOT NULL,
  status           VARCHAR(32) NOT NULL DEFAULT 'RECEIVED',
  raw_payload      TEXT,
  rider_name       VARCHAR(255),
  pickup_address   TEXT,
  dropoff_address  TEXT,
  scheduled_at     TIMESTAMPTZ,
  mobility         VARCHAR(32) NOT NULL DEFAULT 'ambulatory',
  wheelchair       BOOLEAN NOT NULL DEFAULT FALSE,
  imported_trip_id UUID REFERENCES trips (id),
  import_error     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_broker_trip_workspace_broker_external UNIQUE (workspace_id, broker, broker_trip_id)
);
CREATE INDEX IF NOT EXISTS idx_broker_trips_workspace_broker ON broker_trips (workspace_id, broker);
CREATE INDEX IF NOT EXISTS idx_broker_trips_status ON broker_trips (status);

-- Billing: claims built from completed + billable trips, plus invoices.
CREATE TABLE IF NOT EXISTS claims (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number  VARCHAR(32) NOT NULL UNIQUE,
  workspace_id  VARCHAR(64) NOT NULL REFERENCES workspaces (id),
  trip_id       UUID NOT NULL REFERENCES trips (id),
  broker        VARCHAR(32),
  payer         VARCHAR(128),
  status        VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  amount        NUMERIC(10, 2) NOT NULL,
  currency      VARCHAR(8) NOT NULL DEFAULT 'USD',
  cms1500_json  TEXT,
  denial_reason TEXT,
  submitted_at  TIMESTAMPTZ,
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_claims_workspace_status ON claims (workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_claims_trip_id ON claims (trip_id);

CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(32) NOT NULL UNIQUE,
  workspace_id   VARCHAR(64) NOT NULL REFERENCES workspaces (id),
  claim_id       UUID REFERENCES claims (id),
  amount         NUMERIC(10, 2) NOT NULL,
  status         VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  due_at         TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_workspace_status ON invoices (workspace_id, status);

-- In-app notifications (stored, per user). WebPush delivery is a stub
-- channel — see NotificationService / PushChannel.
CREATE TABLE IF NOT EXISTS notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      VARCHAR(64) NOT NULL REFERENCES workspaces (id),
  recipient_user_id UUID NOT NULL REFERENCES users (id),
  type              VARCHAR(64) NOT NULL,
  title             VARCHAR(255) NOT NULL,
  body              TEXT,
  trip_id           UUID REFERENCES trips (id),
  read_flag         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications (recipient_user_id, created_at);

-- Binary proof files (signature images / odometer photos) stored on disk;
-- this table is the metadata + billable-evidence link.
CREATE TABLE IF NOT EXISTS proof_files (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        VARCHAR(64) NOT NULL REFERENCES workspaces (id),
  trip_id             UUID NOT NULL REFERENCES trips (id),
  kind                VARCHAR(32) NOT NULL,
  filename            VARCHAR(255) NOT NULL,
  stored_filename     VARCHAR(255) NOT NULL,
  content_type        VARCHAR(128),
  size_bytes          BIGINT,
  uploaded_by_user_id UUID REFERENCES users (id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_proof_files_trip_id ON proof_files (trip_id);

-- Rider tracking links: signed, expiring tokens (one active token per trip).
CREATE TABLE IF NOT EXISTS tracking_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID NOT NULL UNIQUE REFERENCES trips (id),
  workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces (id),
  token      VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tracking_tokens_token ON tracking_tokens (token);

-- OIG/SAM/MVR compliance check history. `source` is SIMULATED or MANUAL —
-- a check is never a live federal lookup unless a real API is wired in.
CREATE TABLE IF NOT EXISTS compliance_checks (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       VARCHAR(64) NOT NULL REFERENCES workspaces (id),
  driver_id          UUID NOT NULL REFERENCES drivers (id),
  check_type         VARCHAR(16) NOT NULL,
  result             VARCHAR(16) NOT NULL,
  source             VARCHAR(16) NOT NULL DEFAULT 'SIMULATED',
  note               TEXT,
  checked_by_user_id UUID REFERENCES users (id),
  checked_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_driver ON compliance_checks (driver_id, checked_at);

-- Driver compliance fields (OIG/SAM/MVR) — Phase 3 adds them server-side.
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS oig_status VARCHAR(16);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS oig_last_checked TIMESTAMPTZ;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS sam_status VARCHAR(16);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS sam_last_checked TIMESTAMPTZ;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS mvr_status VARCHAR(16);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS mvr_last_checked TIMESTAMPTZ;
