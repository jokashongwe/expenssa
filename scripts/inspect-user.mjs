import postgres from "postgres";
import { readFileSync } from "fs";

const raw = readFileSync(".env", "utf8");
const url = raw.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
const sql = postgres(url, { prepare: false, max: 1 });

try {
  const users = await sql`select id, email, name from users order by created_at desc limit 5`;
  console.log("users", users);
  for (const u of users) {
    const cur = await sql`select code, is_default from currencies where user_id = ${u.id}`;
    const cat = await sql`select count(*)::int as n from categories where user_id = ${u.id}`;
    console.log(u.email, "currencies", cur, "categories", cat[0].n);
  }
} finally {
  await sql.end({ timeout: 3 });
}
