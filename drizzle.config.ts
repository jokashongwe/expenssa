import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { readFileSync, existsSync } from "fs";

// Charge .env même si dotenv injecte 0 (Windows / chemins)
config({ path: ".env" });
config({ path: ".env.local" });

if (!process.env.DATABASE_URL && existsSync(".env")) {
  const raw = readFileSync(".env", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^DATABASE_URL=(.*)$/);
    if (m) process.env.DATABASE_URL = m[1].trim();
  }
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
