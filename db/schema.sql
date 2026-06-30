PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS news_items (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  categories TEXT NOT NULL,
  published_at TEXT,
  fetched_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_news_items_published_at ON news_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_source ON news_items(source);
CREATE INDEX IF NOT EXISTS idx_news_items_fetched_at ON news_items(fetched_at DESC);

CREATE TABLE IF NOT EXISTS news_item_categories (
  news_id TEXT NOT NULL,
  category TEXT NOT NULL,
  PRIMARY KEY (news_id, category),
  FOREIGN KEY (news_id) REFERENCES news_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_news_item_categories_category ON news_item_categories(category);

CREATE TABLE IF NOT EXISTS source_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  fetched_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  finished_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_source_runs_source_started_at ON source_runs(source, started_at DESC);
