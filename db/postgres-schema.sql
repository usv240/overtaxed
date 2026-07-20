-- Overtaxed — Postgres (OLTP) schema. Transactional user state.
CREATE TABLE IF NOT EXISTS saved_properties (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL DEFAULT 'demo',
  country     TEXT NOT NULL,               -- 'US' | 'UK'
  pin         TEXT,                         -- US parcel id (null for UK)
  address     TEXT NOT NULL,
  region      TEXT,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appeals (
  id                       SERIAL PRIMARY KEY,
  user_id                  TEXT NOT NULL DEFAULT 'demo',
  property_pin             TEXT,
  address                  TEXT NOT NULL,
  jurisdiction             TEXT,
  estimated_annual_saving  INTEGER,
  status                   TEXT NOT NULL DEFAULT 'draft',  -- draft|filed|won|rejected
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- daily snapshots written by the scheduled "watch my home" Trigger.dev task
CREATE TABLE IF NOT EXISTS watch_snapshots (
  id                 SERIAL PRIMARY KEY,
  saved_property_id  INTEGER,
  address            TEXT NOT NULL,
  annual_overpay     INTEGER,
  checked_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_appeals_user ON appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_prop ON watch_snapshots(saved_property_id);
