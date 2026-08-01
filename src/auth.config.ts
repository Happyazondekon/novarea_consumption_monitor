import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as any)?.role;
      const isAuthPage = nextUrl.pathname.startsWith("/login");
      const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");

      // Admin-only sub-routes
      const adminOnlyRoutes = [
        "/dashboard/events",
        "/dashboard/reports",
        "/dashboard/reports/generator",
        "/dashboard/users"
      ];
      const isAdminRoute = adminOnlyRoutes.some(route => nextUrl.pathname.startsWith(route));

      if (isApiAuthRoute) return true;

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      if (isDashboardRoute) {
        if (!isLoggedIn) {
            // Redirect to login if trying to access dashboard while unauthenticated
            const loginUrl = new URL("/login", nextUrl);
            loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
            return Response.redirect(loginUrl);
        }

        // Role-based Access Control
        if (isAdminRoute && role !== 'ADMINISTRATEUR') {
            return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
        if (user) {
          token.id = user.id;
          token.role = (user as any).role;
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
