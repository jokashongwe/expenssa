"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { seedUserDefaults } from "@/lib/seed";

const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export type ActionState = {
  error?: string;
  success?: string;
};

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return { error: "Un compte existe déjà avec cet email" };
  }

  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await db.insert(users).values({
    id,
    email,
    name: parsed.data.name.trim(),
    passwordHash,
    defaultCurrencyCode: "USD",
    createdAt: new Date().toISOString(),
  });

  await seedUserDefaults(id);

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    return { error: "Compte créé, mais la connexion a échoué. Connectez-vous." };
  }

  redirect("/dashboard");
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email et mot de passe requis" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect" };
    }
    throw error;
  }

  redirect("/dashboard");
}

async function clearAuthCookies() {
  const jar = await cookies();
  const names = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ];
  for (const name of names) {
    try {
      jar.set(name, "", { expires: new Date(0), path: "/", maxAge: 0 });
      jar.delete(name);
    } catch {
      // ignore cookies not present / not deletable in this context
    }
  }
}

export async function logoutAction(): Promise<ActionState> {
  try {
    await signOut({ redirect: false });
  } catch {
    // continue — on force le nettoyage des cookies
  }
  await clearAuthCookies();
  return { success: "Déconnecté" };
}
