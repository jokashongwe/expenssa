import postgres from "postgres";
import dns from "dns/promises";

const password = encodeURIComponent(process.env.DB_PASS || "Z3roDbKh2026b");
const ref = "vdadmkaenppqpvzpdwro";
const regions = [
  "eu-west-1",
  "eu-central-1",
  "eu-west-2",
  "us-east-1",
  "us-west-1",
  "ap-southeast-1",
];

for (const region of regions) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  try {
    await dns.lookup(host, { family: 4 });
  } catch {
    console.log(region, "DNS fail");
    continue;
  }

  // Session mode 5432 and transaction 6543, user postgres.PROJECT
  const urls = [
    `postgresql://postgres.${ref}:${password}@${host}:6543/postgres`,
    `postgresql://postgres.${ref}:${password}@${host}:5432/postgres`,
  ];

  for (const url of urls) {
    const sql = postgres(url, { prepare: false, connect_timeout: 8, max: 1 });
    try {
      const rows = await sql`select current_database() as db`;
      console.log("SUCCESS", url.replace(password, "***"), rows);
      await sql.end({ timeout: 2 });
      process.exit(0);
    } catch (error) {
      console.log(
        "fail",
        region,
        url.includes(":6543") ? "6543" : "5432",
        error instanceof Error ? error.message : error
      );
      await sql.end({ timeout: 2 }).catch(() => {});
    }
  }
}

console.log("No working pooler found");
process.exit(1);
