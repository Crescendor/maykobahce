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
  stem_angle REAL DEFAULT 0
);

-- Index for high performance querying and auto-pruning
CREATE INDEX IF NOT EXISTS idx_flowers_created ON flowers(created_at DESC);
