import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, account, profile }) {
      if (profile) {
        token.name = profile.name ?? token.name;
        token.email = profile.email ?? token.email;
      }

      if (account?.provider === "google" && profile) {
        const googleProfile = profile as {
          picture?: string;
        };

        token.picture = googleProfile.picture ?? token.picture;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? null;
        session.user.email = token.email ?? null;
        session.user.image = token.picture ?? null;
      }

      return session;
    },
  },
};
