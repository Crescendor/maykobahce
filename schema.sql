-- Cloudflare D1 Database Schema for Mayko Virtual Flower Garden

CREATE TABLE IF NOT EXISTS flowers (
  id TEXT PRIMARY KEY,
  x REAL NOT NULL,
  y REAL NOT NULL,
  name TEXT,
  instagram TEXT,
  note TEXT,
  is_anonymous INTEGER DEFAULT 0,
  is_private INTEGER DEFAULT 0,
  password TEXT,
  delete_code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  strokes_json TEXT NOT NULL,
  stem_type TEXT DEFAULT 'classic',
  stem_color TEXT DEFAULT '#52b788',
  scale REAL DEFAULT 1,
  stem_angle REAL DEFAULT 0,
  approved INTEGER DEFAULT 0,
  animation TEXT DEFAULT NULL,
  animation_color TEXT DEFAULT NULL,
  real_sender TEXT DEFAULT NULL
);

-- Index for high performance querying and auto-pruning
CREATE INDEX IF NOT EXISTS idx_flowers_created ON flowers(created_at DESC);

-- Run these ALTER TABLE commands on existing D1 databases:
-- ALTER TABLE flowers ADD COLUMN approved INTEGER DEFAULT 0;
-- ALTER TABLE flowers ADD COLUMN animation TEXT DEFAULT NULL;
-- ALTER TABLE flowers ADD COLUMN animation_color TEXT DEFAULT NULL;
-- ALTER TABLE flowers ADD COLUMN real_sender TEXT DEFAULT NULL;
