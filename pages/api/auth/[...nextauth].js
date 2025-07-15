// [...nextauth].js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Pool } from '@neondatabase/serverless';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  jwt: { encryption: false },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      // Only run this logic if we have a Google sub (first login or session refresh)
      if (token && token.sub) {
        try {
          const pool = new Pool({ connectionString: process.env.DATABASE_URL });
          const result = await pool.query(
            `SELECT u.id FROM accounts a JOIN users u ON a."userId" = u.id WHERE a.provider = $1 AND a."providerAccountId" = $2`,
            ['google', token.sub]
          );
          if (result.rows.length > 0) {
            // Overwrite token.sub with app UUID
            console.log('[NextAuth][jwt callback] Mapping Google sub', token.sub, 'to app UUID', result.rows[0].id);
            token.sub = result.rows[0].id;
          } else {
            console.log('[NextAuth][jwt callback] No mapping found for Google sub', token.sub);
          }
          await pool.end();
        } catch (e) {
          console.log('[NextAuth][jwt callback] Error mapping Google sub', token.sub, e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log('[NextAuth][session callback] token:', token);
      console.log('[NextAuth][session callback] session (before):', session);
      // Ensure session.user exists
      if (!session.user) session.user = {};
      if (token && token.sub) session.user.id = token.sub;
      if (token && token.email) session.user.email = token.email;
      if (token && token.name) session.user.name = token.name;
      if (token && token.picture) session.user.image = token.picture;
      console.log('[NextAuth][session callback] session (after):', session);
      return session;
    },
  },
};

export default NextAuth(authOptions);
