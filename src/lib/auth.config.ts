import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      const isAuthPage =
        pathname.startsWith("/login") || pathname.startsWith("/register");
      const isPublic =
        isAuthPage ||
        pathname === "/" ||
        pathname.startsWith("/offline") ||
        pathname.startsWith("/icons") ||
        pathname === "/manifest.webmanifest";

      if (isPublic) {
        if (isLoggedIn && isAuthPage) return Response.redirect(new URL("/dashboard", request.nextUrl));
        return true;
      }

      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
