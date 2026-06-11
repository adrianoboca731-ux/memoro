import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenziali",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });
          if (!user) return null;
          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isValid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
            username: user.username,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      // Handle session update (e.g. avatar change)
      if (trigger === "update" && session) {
        if (session.image !== undefined) {
          token.picture = session.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        // Ensure image is always in sync with token
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/accedi",
    newUser: "/auth/registrati",
  },
  secret: process.env.NEXTAUTH_SECRET || "memoro-secret-dev-key-2024",
};
