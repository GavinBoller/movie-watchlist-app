// [...nextauth].js
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from '../../../lib/prisma'; // Adjust path if needed

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider.default({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }
    ),
  ],
  // Use JWTs for session management, which enables the update() function.
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * This callback is called whenever a JWT is created or updated.
     * @param  {object}  token     Decrypted JSON Web Token
     * @param  {object}  user      User object      (only available on initial sign-in)
     * @param  {string}  trigger   "create" | "update" | "signIn"
     * @param  {object}  session   Data from client-side update() call
     * @return {object}            JSON Web Token that will be saved
     */
    async jwt({ token, user, trigger, session }) {
      // The `user` object is only passed on initial sign-in.
      // We persist the user's id, role, and country to the token.
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.country = user.country;
      }

      // This is called when the session is updated with update() on the client.
      // e.g. from the CountrySelector component.
      if (trigger === "update" && session?.country) {
        token.country = session.country;
      }

      return token;
    },

    // The session callback is called whenever a session is checked.
    // It receives the JWT token and is used to populate the session object.
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.country = token.country;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

export default NextAuth.default(authOptions)
