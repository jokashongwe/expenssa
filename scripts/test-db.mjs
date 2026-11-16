import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, connect_timeout: 20 });

try {
  const rows = await sql`select 1 as ok`;
  console.log("connection OK", rows);
} catch (error) {
  console.error("connection FAIL", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
