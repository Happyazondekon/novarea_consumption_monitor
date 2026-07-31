import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/login");
      const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");

      if (isApiAuthRoute) return true;

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      if (isDashboardRoute) {
        if (!isLoggedIn) return false;
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
        if (user) {
          token.id = user.id;
          token.role = (user as any).role;
          // IMPORTANT: DO NOT STORE THE AVATAR (BASE64) IN THE TOKEN
          // It causes the cookie size to exceed browser limits (ERR_RESPONSE_HEADERS_TOO_BIG)
          token.hasAvatar = !!(user as any).avatar;
        }

        if (trigger === "update" && session) {
            if (session.user?.name) token.name = session.user.name;
            if (session.user?.email) token.email = session.user.email;
            if (session.user?.avatar !== undefined) token.hasAvatar = !!session.user.avatar;
        }

        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as any).id = token.id;
          (session.user as any).role = token.role;
          (session.user as any).hasAvatar = token.hasAvatar;
        }
        return session;
      },
  },
  providers: [],
} satisfies NextAuthConfig;
