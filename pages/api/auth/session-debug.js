// pages/api/auth/session-debug.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

/**
 * This API endpoint provides debug information about the current session
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
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Return current session information
    return res.status(200).json({
      authenticated: !!session,
      session: session || null,
      cookies: {
        names: Object.keys(req.cookies || {}),
        hasNextAuthSession: !!req.cookies['next-auth.session-token'],
        hasJWT: !!req.cookies['__Secure-next-auth.session-token'],
      },
      headers: {
        userAgent: req.headers['user-agent'],
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer,
      }
    });
  } catch (error) {
    console.error("Error in session-debug API:", error);
    return res.status(500).json({
      error: "Failed to fetch session",
      message: error.message,
    });
  }
}
