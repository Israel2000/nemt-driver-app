-- V2: drivers, vehicles, trips, credentials, audit events
CREATE TABLE IF NOT EXISTS drivers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_code        VARCHAR(32)  NOT NULL UNIQUE,
  user_id            UUID REFERENCES users (id),
  workspace_id       VARCHAR(64)  NOT NULL REFERENCES workspaces (id),
  license_number     VARCHAR(64),
  license_expires_at DATE,
  dqf_id             VARCHAR(32),
  phone              VARCHAR(32),
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_drivers_workspace_id ON drivers (workspace_id);

CREATE TABLE IF NOT EXISTS vehicles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          VARCHAR(64) NOT NULL REFERENCES workspaces (id),
  label                 VARCHAR(64) NOT NULL,
  plate                 VARCHAR(32),
  capacity              INTEGER,
  wheelchair_accessible BOOLEAN     NOT NULL DEFAULT FALSE,
  status                VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vehicles_workspace_id ON vehicles (workspace_id);

CREATE TABLE IF NOT EXISTS trips (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                VARCHAR(32)  NOT NULL UNIQUE,
  workspace_id        VARCHAR(64)  NOT NULL REFERENCES workspaces (id),
  driver_id           UUID REFERENCES drivers (id),
  vehicle_id          UUID REFERENCES vehicles (id),
  rider_name          VARCHAR(255),
  pickup_address      TEXT,
  dropoff_address     TEXT,
  status              VARCHAR(32)  NOT NULL DEFAULT 'ASSIGNED',
  wheelchair          BOOLEAN      NOT NULL DEFAULT FALSE,
  scheduled_at        TIMESTAMPTZ,
  gps_lat             NUMERIC(10, 7),
  gps_lng             NUMERIC(10, 7),
  arrived_lat         NUMERIC(10, 7),
  arrived_lng         NUMERIC(10, 7),
  odometer_start      INTEGER,
  odometer_end        INTEGER,
  passenger_signature BOOLEAN      NOT NULL DEFAULT FALSE,
  driver_signature    BOOLEAN      NOT NULL DEFAULT FALSE,
  billable            BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trips_workspace_id ON trips (workspace_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips (driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips (status);

CREATE TABLE IF NOT EXISTS credentials (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id  UUID         NOT NULL REFERENCES drivers (id),
  type       VARCHAR(64)  NOT NULL,
  expires_at DATE,
  status     VARCHAR(32)  NOT NULL DEFAULT 'VALID',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credentials_driver_id ON credentials (driver_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces (id),
  user_id     UUID REFERENCES users (id),
  actor       VARCHAR(255) NOT NULL,
  action      VARCHAR(255) NOT NULL,
  entity_type VARCHAR(64),
  entity_id   VARCHAR(64),
  gps_lat     NUMERIC(10, 7),
  gps_lng     NUMERIC(10, 7),
  details     TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_workspace_id ON audit_events (workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_events (created_at);
