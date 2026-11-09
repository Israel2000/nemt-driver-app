-- V3: Phase 2 — trip messages, status-event history, wheelchair securement,
-- offline-outbox idempotency, trip geo/proof columns, DQF lockout setting.

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS dqf_lockout_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Geo + contact + proof columns the Phase 1 trips table was missing.
-- (The frontend has always carried pickup/dropoff coordinates, patient
-- phone, mobility and signature images; the server needs them for the
-- ARRIVED proximity gate, ETA and proof-of-delivery.)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS pickup_lat NUMERIC(10, 7);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS pickup_lng NUMERIC(10, 7);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS dropoff_lat NUMERIC(10, 7);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS dropoff_lng NUMERIC(10, 7);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS patient_phone VARCHAR(32);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS mobility VARCHAR(32) NOT NULL DEFAULT 'ambulatory';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS passenger_signature_data TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_signature_data TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS signee_name VARCHAR(255);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS signee_type VARCHAR(32);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- One row per status transition: GPS + timestamp + actor + reason.
-- audit_events still gets a mirrored row (the audit trail); this table is
-- the queryable per-trip history behind GET /api/trips/{id}/events.
CREATE TABLE IF NOT EXISTS trip_status_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID         NOT NULL REFERENCES trips (id),
  workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces (id),
  status      VARCHAR(32)  NOT NULL,
  gps_lat     NUMERIC(10, 7),
  gps_lng     NUMERIC(10, 7),
  gps_source  VARCHAR(16)  NOT NULL DEFAULT 'estimated',
  by_role     VARCHAR(32),
  by_name     VARCHAR(255),
  reason_code VARCHAR(64),
  reason_note TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trip_status_events_trip_id ON trip_status_events (trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_status_events_created_at ON trip_status_events (created_at);

-- Wheelchair securement checklist (8 items). One row per trip, upserted.
CREATE TABLE IF NOT EXISTS trip_securements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id               UUID         NOT NULL UNIQUE REFERENCES trips (id),
  workspace_id          VARCHAR(64)  NOT NULL REFERENCES workspaces (id),
  positioned            BOOLEAN      NOT NULL DEFAULT FALSE,
  tie_down_front_left   BOOLEAN      NOT NULL DEFAULT FALSE,
  tie_down_front_right  BOOLEAN      NOT NULL DEFAULT FALSE,
  tie_down_rear_left    BOOLEAN      NOT NULL DEFAULT FALSE,
  tie_down_rear_right   BOOLEAN      NOT NULL DEFAULT FALSE,
  brakes_set            BOOLEAN      NOT NULL DEFAULT FALSE,
  lap_belt              BOOLEAN      NOT NULL DEFAULT FALSE,
  shoulder_belt         BOOLEAN      NOT NULL DEFAULT FALSE,
  completed_by          VARCHAR(255),
  completed_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Per-trip driver <-> dispatch message thread.
CREATE TABLE IF NOT EXISTS trip_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID         NOT NULL REFERENCES trips (id),
  workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces (id),
  sender_user_id UUID REFERENCES users (id),
  sender_role VARCHAR(32)  NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  body        TEXT         NOT NULL,
  read_flag   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trip_messages_trip_id ON trip_messages (trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_messages_created_at ON trip_messages (created_at);

-- Offline-outbox idempotency: one row per client event id per workspace.
-- A duplicate client_event_id is never applied twice — the second flush
-- reports it as duplicate-skipped.
CREATE TABLE IF NOT EXISTS sync_outbox_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    VARCHAR(64) NOT NULL REFERENCES workspaces (id),
  client_event_id VARCHAR(128) NOT NULL,
  trip_id         UUID REFERENCES trips (id),
  kind            VARCHAR(32)  NOT NULL,
  result          VARCHAR(32)  NOT NULL,
  detail          TEXT,
  processed_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_sync_outbox_workspace_client_event UNIQUE (workspace_id, client_event_id)
);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_workspace_id ON sync_outbox_events (workspace_id);
