import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // NOTE: there is deliberately no `authorized` callback here.
    //
    // next-auth v5 runs `authorized` before the middleware handler and, the
    // moment it returns a Response, it skips that handler entirely
    // (node_modules/next-auth/lib/index.js -> handleAuth). Keeping the route
    // gate here meant redirects were emitted without the security headers, and
    // the rules lived in two places that could drift. The whole gate now sits
    // in src/middleware.ts.
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
