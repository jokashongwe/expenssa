import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!row) {
    // Session JWT orpheline (ex. après migration SQLite → Supabase)
    await signOut({ redirectTo: "/login" });
    redirect("/login");
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
  };
}

export async function getOptionalUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return row ?? null;
}
