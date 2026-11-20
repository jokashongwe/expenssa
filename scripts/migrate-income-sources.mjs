// Crée la table income_sources (idempotent). Usage :
//   node --env-file=.env scripts/migrate-income-sources.mjs
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquante");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, connect_timeout: 20 });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS income_sources (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      currency_id TEXT NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
      name TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      frequency TEXT NOT NULL CHECK (frequency IN ('month', 'year')),
      created_at TEXT NOT NULL
    )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_income_sources_user ON income_sources(user_id)`;
  console.log("income_sources : OK");
} catch (error) {
  console.error("Échec :", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
