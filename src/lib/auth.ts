import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { authConfig } from "../auth.config";
import { checkAttempts, clearAttempts, registerFailure } from "@/lib/security/rate-limit";

/**
 * Hash of a random throwaway string, compared against when the username does
 * not exist so that "unknown user" and "wrong password" cost the same time.
 * Without it, response timing tells an attacker which logins are real.
 */
const DECOY_HASH = "$2b$10$f0mukDMTkOpAmkek/HP33.aDW5q1H2mSHEmoYqQN/mdSCECbKO5ue";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifiant: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const username =
          typeof credentials?.identifiant === "string" ? credentials.identifiant.trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!username || !password) return null;

        // Slow down password guessing. Keyed on the login handle so one targeted
        // account cannot be hammered, and cleared on success so a legitimate
        // user who mistyped a few times is never locked out of their own shift.
        const throttleKey = username.toLowerCase();
        const throttle = checkAttempts(throttleKey);
        if (throttle.blocked) {
          console.warn(
            `[AUTH] Throttled sign-in attempt for "${throttleKey}" (${throttle.retryAfterSeconds}s remaining)`
          );
          return null;
        }

        const user = await prisma.user.findUnique({ where: { username } });

        // Always run a bcrypt comparison, even for an unknown username, to keep
        // the timing of both failure modes identical.
        const isPasswordValid = await bcrypt.compare(password, user?.password ?? DECOY_HASH);

        if (!user || !isPasswordValid) {
          registerFailure(throttleKey);
          return null;
        }

        // A deactivated account must not be able to sign in. `isActive` was only
        // ever used to grey the user out in the admin list, so a disabled
        // technician could still log in with their old password.
        if (!user.isActive) {
          console.warn(`[AUTH] Rejected sign-in for deactivated account: ${user.username}`);
          registerFailure(throttleKey);
          return null;
        }

        clearAttempts(throttleKey);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar ? "EXISTS" : null,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
        if (user) {
            token.id = (user as any).id;
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
        if (token) {
            (session.user as any).id = token.id;
            (session.user as any).role = token.role;
            (session.user as any).hasAvatar = token.hasAvatar;
        }
        return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 1 * 60 * 60, // 1 HOUR
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
});
