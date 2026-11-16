import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "crypto";
import { readFileSync } from "fs";
import postgres from "postgres";

const base = process.argv[2] || "http://localhost:3000";
const email = "smoke@expenssa.test";
const password = "secret12";

const raw = readFileSync(".env", "utf8");
const url = raw.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 15 });

async function ensureUser() {
  const existing = await sql`select id from users where email = ${email} limit 1`;
  let userId = existing[0]?.id;
  if (!userId) {
    userId = randomUUID();
    const hash = await bcrypt.hash(password, 10);
    await sql`
      insert into users (id, email, password_hash, name, default_currency_code, created_at)
      values (${userId}, ${email}, ${hash}, ${"Smoke Tester"}, ${"USD"}, ${new Date().toISOString()})
    `;
    await sql`
      insert into currencies (id, user_id, code, name, rate_to_usd, is_default)
      values (${randomUUID()}, ${userId}, ${"USD"}, ${"Dollar américain"}, ${1}, ${true})
    `;
    console.log("created smoke user", userId);
  } else {
    console.log("smoke user exists", userId);
  }
  return userId;
}

function parseCookies(res) {
  const raw = res.headers.getSetCookie?.() || [];
  const jar = new Map();
  for (const c of raw) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
  return jar;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

try {
  await ensureUser();
  const ping = await sql`select count(*)::int as n from users`;
  console.log("DB users count", ping[0].n);
} finally {
  await sql.end({ timeout: 3 });
}

const jar = new Map();

const csrfRes = await fetch(`${base}/api/auth/csrf`);
const csrfJson = await csrfRes.json();
for (const [k, v] of parseCookies(csrfRes)) jar.set(k, v);
console.log("csrf", !!csrfJson.csrfToken);

const body = new URLSearchParams({
  csrfToken: csrfJson.csrfToken,
  email,
  password,
  callbackUrl: `${base}/dashboard`,
  json: "true",
});

const loginRes = await fetch(`${base}/api/auth/callback/credentials`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Cookie: cookieHeader(jar),
  },
  body,
  redirect: "manual",
});
for (const [k, v] of parseCookies(loginRes)) jar.set(k, v);
console.log("login status", loginRes.status);

const sessionRes = await fetch(`${base}/api/auth/session`, {
  headers: { Cookie: cookieHeader(jar) },
});
const session = await sessionRes.json();
console.log("session user", session?.user?.email || null);

const dashRes = await fetch(`${base}/dashboard`, {
  headers: { Cookie: cookieHeader(jar) },
  redirect: "manual",
});
const dashHtml = await dashRes.text();
console.log("dashboard", dashRes.status, {
  hasBonjour: dashHtml.includes("Bonjour"),
  hasError: dashHtml.includes("Application error") || dashHtml.includes("Failed query"),
  hasRoboto: dashHtml.includes("roboto") || dashHtml.includes("font-sans"),
});

if (
  !session?.user?.email ||
  dashRes.status !== 200 ||
  dashHtml.includes("Application error") ||
  dashHtml.includes("Failed query")
) {
  process.exitCode = 1;
} else {
  console.log("SMOKE OK");
}
