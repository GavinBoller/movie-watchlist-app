// pages/api/auth/sync-session.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

/**
 * This API endpoint provides the current authenticated session
 * It's useful for forcing a session sync between server and client
 */
export default async function handler(req, res) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Get the session from the server
    const session = await getServerSession(req, res, authOptions);
    
    // Return session data with no caching to ensure freshness
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    
    if (session) {
      // Return authenticated session data
      return res.status(200).json({
        authenticated: true,
        user: session.user || null,
        expires: session.expires || null,
      });
    } else {
      // Return unauthenticated status
      return res.status(200).json({
        authenticated: false,
        user: null,
        expires: null,
      });
    }
  } catch (error) {
    console.error("Error in sync-session API:", error);
    return res.status(500).json({
      error: "Failed to fetch session",
      message: error.message,
    });
  }
}
