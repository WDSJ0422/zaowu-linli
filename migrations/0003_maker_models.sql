CREATE TABLE IF NOT EXISTS maker_models (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  printer_id TEXT NOT NULL REFERENCES printers(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  material TEXT NOT NULL,
  reference_price INTEGER NOT NULL DEFAULT 29,
  license TEXT DEFAULT '',
  description TEXT DEFAULT '',
  file_name TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_maker_models_owner_id ON maker_models(owner_id);
CREATE INDEX IF NOT EXISTS idx_maker_models_printer_id ON maker_models(printer_id);
CREATE INDEX IF NOT EXISTS idx_maker_models_active ON maker_models(active);
