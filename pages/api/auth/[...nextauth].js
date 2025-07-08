// [...nextauth].js
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
// Remove PrismaAdapter import since we're using JWT strategy
// import { PrismaAdapter } from "@next-auth/prisma-adapter"
// import prisma from '../../../lib/prisma'; // Adjust path if needed

export const authOptions = {
  // Remove adapter when using JWT strategy
  // adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }
    ),
  ],
  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
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
        // For Google OAuth, use the user.id (which is the Google user ID)
        // If user.id is not set, fall back to the email as a last resort
        token.id = user.id || user.email;
        token.role = user.role || 'user';
        token.country = user.country || null;
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
      if (token && session?.user) {
        // For JWT strategy, we need to look up the actual user ID from the database
        // based on the Google provider account ID
        if (token.sub) {
          try {
            const { Pool } = require('@neondatabase/serverless');
            const pool = new Pool({
              connectionString: process.env.DATABASE_URL,
            });
            
            // Look up the user ID from the accounts table
            const result = await pool.query(
              'SELECT "userId" FROM accounts WHERE provider = $1 AND "providerAccountId" = $2',
              ['google', token.sub]
            );
            
            if (result.rows.length > 0) {
              session.user.id = result.rows[0].userId;
            } else {
              // Fallback to the token.sub if no database entry found
              session.user.id = token.sub;
            }
            
            await pool.end();
          } catch (error) {
            console.error('Error looking up user ID:', error);
            // Fallback to token.sub on error
            session.user.id = token.sub;
          }
        } else {
          session.user.id = token.id || token.sub;
        }
        
        session.user.role = token.role || 'user';
        session.user.country = token.country || null;
      }
      return session;
    },
    
    // Handle redirect after sign in/out
    async redirect({ url, baseUrl }) {
      // For sign-out, always go to home page
      if (url.includes('signout') || url.includes('signOut')) {
        return `${baseUrl}/`;
      }
      
      // If the URL starts with the base URL, it's an internal redirect
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // If URL is just a path, combine with base URL
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Default to search page for successful sign-in
      return `${baseUrl}/search`;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  
  // Configure pages
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  // Enhanced security settings
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "development" 
        ? `next-auth.session-token` 
        : `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV !== "development",
      },
    },
  },
  
  // CSRF protection
  useSecureCookies: process.env.NODE_ENV !== "development",
}

export default NextAuth(authOptions)
