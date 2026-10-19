import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ROLE, seededRole } from "@/lib/roles";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google") {
        token.googleId =
          account.providerAccountId ||
          ("sub" in (profile ?? {})
            ? String(profile?.sub ?? "")
            : "");

        const googleId = String(token.googleId ?? "");
        const email = typeof profile?.email === "string" ? profile.email : null;
        if (email) token.email = email;

        if (googleId) {
          // Record the contributor and seed SUPER_ADMIN from the allowlist. The role is
          // only written when the allowlist grants one, so a promoted admin keeps their
          // role. This runs at sign-in only, never on token refresh.
          const seeded = seededRole(email, process.env.SUPER_ADMIN_EMAILS);
          try {
            await prisma.user.upsert({
              where: { id: googleId },
              update: { email: email ?? undefined, ...(seeded ? { role: seeded } : {}) },
              create: { id: googleId, email, role: seeded ?? DEFAULT_ROLE },
            });
          } catch (error) {
            // Sign-in must not fail because the database is unreachable.
            console.error("Could not record the signed-in user:", error);
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.googleId ?? "");
      }

      return session;
    },
  },

  pages: {
    signIn: "/",
  },
};