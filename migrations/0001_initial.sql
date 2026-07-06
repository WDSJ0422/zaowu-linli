CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'buyer',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS printers (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  city TEXT NOT NULL,
  materials TEXT NOT NULL,
  size TEXT NOT NULL,
  price TEXT NOT NULL,
  phone TEXT DEFAULT '',
  wechat TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  rating TEXT DEFAULT '5.0',
  eta TEXT DEFAULT '今天可咨询',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES users(id),
  printer_id TEXT NOT NULL REFERENCES printers(id),
  item TEXT NOT NULL,
  icon TEXT DEFAULT '◫',
  reference_price INTEGER DEFAULT 59,
  model_link TEXT DEFAULT '',
  upload_name TEXT DEFAULT '',
  material TEXT NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  address TEXT NOT NULL,
  recipient TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '待商家报价',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_printers_owner_id ON printers(owner_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_buyer_id ON inquiries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_printer_id ON inquiries(printer_id);
