import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { authConfig } from "../auth.config";

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
        if (!credentials?.identifiant || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.identifiant as string }
        });

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar ? "EXISTS" : null, // Store only status to keep session small
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
    maxAge: 2 * 60 * 60, // 2 hours
  },
});
