import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
  
  interface User {
    // Your custom user properties
    firstName?: string;
    lastName?: string;
    // etc.
  }
}