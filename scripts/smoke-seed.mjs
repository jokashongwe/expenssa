import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";

fs.mkdirSync("./data", { recursive: true });
const db = new Database("./data/expenssa.db");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    default_currency_code TEXT NOT NULL DEFAULT 'USD',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS currencies (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    rate_to_usd REAL NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#0d9488',
    icon TEXT NOT NULL DEFAULT 'circle'
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    currency_id TEXT NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    currency_id TEXT NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    amount REAL NOT NULL,
    period TEXT NOT NULL,
    start_date TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS savings_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency_id TEXT NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL NOT NULL DEFAULT 0,
    periodicity TEXT NOT NULL,
    duration_units INTEGER NOT NULL,
    start_date TEXT NOT NULL
  );
`);

const email = "demo@expenssa.test";
const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
if (existing) {
  console.log("demo user already exists", existing.id);
  process.exit(0);
}

const id = crypto.randomUUID();
const hash = bcrypt.hashSync("secret12", 10);
db.prepare(
  `INSERT INTO users (id, email, password_hash, name, default_currency_code, created_at)
   VALUES (?, ?, ?, ?, ?, ?)`
).run(id, email, hash, "Demo User", "USD", new Date().toISOString());

db.prepare(
  `INSERT INTO currencies (id, user_id, code, name, rate_to_usd, is_default)
   VALUES (?, ?, ?, ?, ?, ?)`
).run(crypto.randomUUID(), id, "USD", "Dollar américain", 1, 1);

const cats = [
  ["Salaire", "income", "#059669"],
  ["Alimentation", "expense", "#f59e0b"],
  ["Transport", "expense", "#3b82f6"],
];
for (const [name, type, color] of cats) {
  db.prepare(
    `INSERT INTO categories (id, user_id, name, type, color, icon)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(crypto.randomUUID(), id, name, type, color, "circle");
}

console.log("seeded", id);
