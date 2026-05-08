const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'data.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS hero_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_path TEXT NOT NULL,
    alt_uz TEXT,
    alt_ru TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS marquee_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text_uz TEXT NOT NULL,
    text_ru TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name_uz TEXT NOT NULL,
    name_ru TEXT,
    short_uz TEXT,
    short_ru TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name_uz TEXT NOT NULL,
    name_ru TEXT,
    alt_uz TEXT,
    alt_ru TEXT,
    image_path TEXT,
    price TEXT,
    price_ask INTEGER DEFAULT 0,
    badge_type TEXT,
    badge_text TEXT,
    visible INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text_uz TEXT NOT NULL,
    text_ru TEXT,
    author_name TEXT NOT NULL,
    author_initials TEXT,
    city_uz TEXT,
    city_ru TEXT,
    stars INTEGER DEFAULT 5,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    category TEXT,
    note TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order);
  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
`);

const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
const setSettingStmt = db.prepare(
  'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
);

function get(key) {
  const row = getSetting.get(key);
  return row ? row.value : null;
}
function set(key, value) {
  setSettingStmt.run(key, value == null ? '' : String(value));
}
function getAllSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}
function setMany(obj) {
  const tx = db.transaction((entries) => {
    for (const [k, v] of entries) set(k, v);
  });
  tx(Object.entries(obj));
}

module.exports = { db, get, set, getAllSettings, setMany };
