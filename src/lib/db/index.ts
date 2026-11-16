import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL manquante. Ajoutez la connection string Postgres Supabase dans .env"
    );
  }
  return url;
}

type GlobalDb = {
  sql?: ReturnType<typeof postgres>;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

const globalForDb = globalThis as unknown as GlobalDb;

export function resetDbConnection() {
  const previous = globalForDb.sql;
  globalForDb.sql = undefined;
  globalForDb.db = undefined;
  if (previous) {
    void previous.end({ timeout: 1 }).catch(() => undefined);
  }
}

function createSql() {
  return postgres(getDatabaseUrl(), {
    // Requis pour le pooler Supabase (transaction / session)
    prepare: false,
    max: 5,
    idle_timeout: 20,
    max_lifetime: 60 * 5,
    connect_timeout: 15,
    // Recycle les sockets morts plutôt que de planter l'app
    connection: {
      application_name: "expenssa",
    },
  });
}

function getSql() {
  if (!globalForDb.sql) {
    globalForDb.sql = createSql();
  }
  return globalForDb.sql;
}

export function getDb() {
  if (!globalForDb.db) {
    globalForDb.db = drizzle(getSql(), { schema });
  }
  return globalForDb.db;
}

function isConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const cause =
    error && typeof error === "object" && "cause" in error
      ? String((error as { cause?: unknown }).cause)
      : "";
  return /CONNECTION_CLOSED|ECONNRESET|CONNECT_TIMEOUT|connection.*closed|fetch failed/i.test(
    `${message} ${cause}`
  );
}

/** Exécute une requête avec 1 retry si le pooler a coupé le socket. */
export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    resetDbConnection();
    return await fn();
  }
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
