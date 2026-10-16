import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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