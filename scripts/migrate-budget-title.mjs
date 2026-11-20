// Ajoute la colonne budgets.title (idempotent). Usage :
//   node --env-file=.env scripts/migrate-budget-title.mjs
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquante");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, connect_timeout: 20 });

try {
  await sql`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS title TEXT`;
  console.log("budgets.title : OK");
} catch (error) {
  console.error("Échec :", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
