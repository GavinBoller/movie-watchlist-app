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
  // Safari-friendly cookie configuration
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_USE_HTTPS === 'true',
        // Safari requires these to be explicit, even with secure=true
        domain: undefined, // default to current domain
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_USE_HTTPS === 'true',
        domain: undefined, // default to current domain
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.csrf-token`
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_USE_HTTPS === 'true',
        domain: undefined, // default to current domain
      },
    },
  },
  // Add error handling
  events: {
    async signIn(message) {
      console.log("User sign in attempt:", 
        message.user?.email ? `${message.user.email}` : "unknown user");
      
      // Log provider information
      if (message.account) {
        console.log("Provider:", message.account.provider);
      }
    },
    async signOut() {
      // Clean up any session data on sign out
      console.log("User signed out successfully");
    },
    async error(message) {
      // Log but don't throw errors during auth transitions
      console.error("NextAuth error:", message);
      
      // Enhanced error logging for OAuth errors
      if (message.error) {
        if (typeof message.error === 'object') {
          console.error("OAuth Error Details:", JSON.stringify(message.error, null, 2));
        } else {
          console.error("OAuth Error:", message.error);
        }
      }
    },
  },
  // Custom logger to suppress client errors
  logger: {
    error: (code, metadata) => {
      // Log the full environment configuration for auth-related errors (only in development)
      if (process.env.NODE_ENV === 'development' && 
          (code === 'oauth_error' || code === 'SIGNIN_OAUTH_ERROR')) {
        console.error(`Auth Config Debug - NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
        console.error(`Auth Config Debug - GOOGLE_CLIENT_ID set: ${!!process.env.GOOGLE_CLIENT_ID}`);
        console.error(`Auth Config Debug - GOOGLE_CLIENT_SECRET set: ${!!process.env.GOOGLE_CLIENT_SECRET}`);
      }
      
      // Suppress the specific client fetch error during sign out
      if (code === 'CLIENT_FETCH_ERROR' && metadata?.message?.includes('Cannot convert undefined or null to object')) {
        console.log('NextAuth: Suppressed client fetch error during sign out transition');
        return;
      }
      console.error(`NextAuth Error [${code}]:`, metadata);
    },
    warn: (code) => {
      console.warn(`NextAuth Warning [${code}]`);
    },
    debug: (code, metadata) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`NextAuth Debug [${code}]:`, metadata);
      }
    },
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
      // Early return if no token (shouldn't happen, but safety check)
      if (!token) {
        return {};
      }
      
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
      // Handle null or undefined session gracefully
      if (!session) {
        return null;
      }
      
      // Handle null or undefined token gracefully
      if (!token) {
        return session;
      }
      
      // Ensure session.user exists before proceeding
      if (!session.user) {
        return session;
      }
      
      // For JWT strategy, we need to look up the actual user ID from the database
      // based on the Google provider account ID
      if (token.sub) {
        try {
          const { Pool } = require('@neondatabase/serverless');
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
          });
          
          // Look up the user ID and country from the accounts and users tables
          const result = await pool.query(
            `SELECT u.id, u.country, u.role 
             FROM accounts a 
             JOIN users u ON a."userId" = u.id 
             WHERE a.provider = $1 AND a."providerAccountId" = $2`,
            ['google', token.sub]
          );
          
          if (result.rows.length > 0) {
            const userData = result.rows[0];
            session.user.id = userData.id;
            session.user.country = userData.country || 'AU'; // Default to AU if null
            session.user.role = userData.role || 'user';
          } else {
            // Fallback to the token data if no database entry found
            session.user.id = token.sub;
            session.user.country = token.country || 'AU'; // Default to AU
            session.user.role = token.role || 'user';
          }
          
          await pool.end();
        } catch (error) {
          console.error('Error looking up user ID:', error);
          // Fallback to token data on error
          session.user.id = token.sub;
          session.user.country = token.country || 'AU'; // Default to AU
          session.user.role = token.role || 'user';
        }
      } else {
        session.user.id = token.id || token.sub;
        session.user.role = token.role || 'user';
        session.user.country = token.country || 'AU'; // Default to AU
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
        secure: process.env.NODE_ENV !== "development" || process.env.NEXT_PUBLIC_USE_HTTPS === "true",
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "development" 
        ? `next-auth.callback-url` 
        : `__Secure-next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV !== "development" || process.env.NEXT_PUBLIC_USE_HTTPS === "true",
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === "development" 
        ? `next-auth.csrf-token` 
        : `__Secure-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV !== "development" || process.env.NEXT_PUBLIC_USE_HTTPS === "true",
      },
    },
  },
  
  // CSRF protection
  useSecureCookies: process.env.NODE_ENV !== "development" || process.env.NEXT_PUBLIC_USE_HTTPS === "true",
}

export default NextAuth(authOptions)
