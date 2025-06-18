import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { Pool } from '@neondatabase/serverless' // For Neon
import PgAdapter from "@auth/pg-adapter" // Corrected: PgAdapter is a default export

// Initialize the Neon database connection pool
// Auth.js will use this for its adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export const authOptions = {
  // Configure one or more authentication providers
  adapter: PgAdapter(pool), // Use the official PostgreSQL adapter with your Neon pool
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // You can add other providers here (e.g., GitHub, Credentials for email/password)
  ],
  session: {
    // Use JSON Web Tokens for session strategy
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // For new users created via OAuth, the adapter's createUser method
      // should be called. The user object passed here might be the one
      // the adapter intends to create.
      // If an id is missing, it's an issue with the adapter's createUser input.
      // console.log("signIn callback user:", user);
      // console.log("signIn callback account:", account);
      // console.log("signIn callback profile:", profile);
      return true; // Allow sign in
    },
    async redirect({ baseUrl }) {
      // Always redirect to the base URL (homepage) after sign-in
      return baseUrl // Default redirect to base URL (homepage)
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
