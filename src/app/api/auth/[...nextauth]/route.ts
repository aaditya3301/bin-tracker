import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Redirect to /home after sign in
      return `${baseUrl}/home`;
    },
    async session({ session, token, user }) {
      // This is where you can add additional data to the session
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
