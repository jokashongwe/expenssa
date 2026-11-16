/**
 * Smoke test: connexion DB + login Auth.js credentials callback.
 * Usage: node scripts/smoke-login.mjs [baseUrl]
 */
import postgres from "postgres";
import { readFileSync } from "fs";

const base = process.argv[2] || "http://localhost:3000";
const raw = readFileSync(".env", "utf8");
const url = raw.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();

if (!url) {
  console.error("DATABASE_URL manquante");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 15 });

try {
  const ping = await sql`select 1 as ok`;
  console.log("DB OK", ping[0]);

  const users = await sql`select id, email from users order by created_at desc limit 3`;
  console.log(
    "users",
    users.map((u) => u.email)
  );
} catch (error) {
  console.error("DB FAIL", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 3 });
}

const home = await fetch(base + "/");
console.log("GET /", home.status);

const login = await fetch(base + "/login");
console.log("GET /login", login.status);

const dash = await fetch(base + "/dashboard", { redirect: "manual" });
console.log("GET /dashboard (anon)", dash.status, dash.headers.get("location"));
