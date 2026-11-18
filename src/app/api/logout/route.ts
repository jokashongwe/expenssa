import { NextResponse } from "next/server";

// Préfixes des cookies Auth.js / NextAuth (y compris versions __Secure-/__Host-
// et cookies fragmentés « .0 », « .1 »… quand le JWT est volumineux).
const AUTH_COOKIE_PATTERN =
  /^(__Secure-|__Host-)?(authjs|next-auth)\.(session-token|callback-url|csrf-token|pkce\.code_verifier|state|nonce)(\.\d+)?$/;

const EXTRA_COOKIES = ["expenssa_active_owner"];

function redirectToLogin(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isHttps =
    forwardedProto === "https" || new URL(request.url).protocol === "https:";

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.headers.set("Cache-Control", "no-store");

  const names = new Set<string>(EXTRA_COOKIES);
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name && AUTH_COOKIE_PATTERN.test(name)) names.add(name);
  }
  // Noms connus même s'ils ne sont pas présents dans la requête
  names.add("authjs.session-token");
  names.add("__Secure-authjs.session-token");

  for (const name of names) {
    // Les cookies préfixés __Secure-/__Host- ne sont acceptés (et donc
    // supprimés) par le navigateur que s'ils portent l'attribut Secure.
    const needsSecure =
      name.startsWith("__Secure-") || name.startsWith("__Host-") || isHttps;
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure: needsSecure,
    });
  }

  return response;
}

export async function POST(request: Request) {
  // Auth.js utilise une session JWT sans état serveur : supprimer les cookies
  // suffit. On évite signOut() qui écrivait des cookies concurrents.
  return redirectToLogin(request);
}

export async function GET(request: Request) {
  return redirectToLogin(request);
}
