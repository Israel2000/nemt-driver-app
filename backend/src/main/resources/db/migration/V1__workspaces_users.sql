-- V1: workspaces + users (auth foundation)
CREATE TABLE IF NOT EXISTS workspaces (
  id            VARCHAR(64)  PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  provider_id   VARCHAR(64),
  fleet_size    VARCHAR(64),
  plan          VARCHAR(32)  NOT NULL DEFAULT 'growth',
  billing_cycle VARCHAR(32)  NOT NULL DEFAULT 'monthly',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          VARCHAR(32)  NOT NULL,
  workspace_id  VARCHAR(64)  NOT NULL REFERENCES workspaces (id),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users (workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
