import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

const COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export async function POST(request: Request) {
  try {
    await signOut({ redirect: false });
  } catch {
    // continue — cookies are cleared below
  }

  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url, 303);

  for (const name of COOKIE_NAMES) {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
    });
    response.cookies.delete(name);
  }

  // Also clear active shared-space cookie
  response.cookies.set("expenssa_active_owner", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

export async function GET(request: Request) {
  return POST(request);
}
