'use strict';

// SQLite database (built into Node.js, nothing to install or host).
// The schema is created on first start; demo data is added when the shop is empty.

const fs = require('node:fs');
const path = require('node:path');

// node:sqlite still prints an "experimental" warning on some Node versions.
const emitWarning = process.emitWarning;
process.emitWarning = (warning, ...args) => {
  if (String(warning).includes('SQLite')) return;
  emitWarning.call(process, warning, ...args);
};
const { DatabaseSync } = require('node:sqlite');
process.emitWarning = emitWarning;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('buyer', 'seller')),
  company_name  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id           INTEGER PRIMARY KEY,
  seller_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_model  TEXT NOT NULL,
  height_mm    REAL NOT NULL,
  width_mm     REAL NOT NULL,
  thickness_mm REAL NOT NULL,
  color        TEXT NOT NULL,
  material     TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  price_cents  INTEGER NOT NULL CHECK (price_cents > 0),
  stock        INTEGER NOT NULL CHECK (stock >= 0),
  image        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cart_items (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id          INTEGER PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_cents INTEGER NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copies of name and price, so old orders do not change when a product does.
CREATE TABLE IF NOT EXISTS order_items (
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
  phone_model TEXT NOT NULL,
  color       TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  quantity    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS case_requests (
  id           INTEGER PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  phone_model  TEXT NOT NULL,
  height_mm    REAL,
  width_mm     REAL,
  thickness_mm REAL,
  color        TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL,
  details      TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS orders_user ON orders(user_id);
`;

function openDatabase(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  db.exec(SCHEMA);
  return db;
}

/** Runs `fn` in a transaction: all of it is saved, or none of it. */
function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = { openDatabase, transaction };
