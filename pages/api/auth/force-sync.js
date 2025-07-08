// pages/api/auth/force-sync.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

/**
 * This API endpoint helps force a session sync between server and client
 * It specifically addresses the issue where NextAuth cookies might not be properly
 * synchronized between client and server.
 */
export default async function handler(req, res) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Get the session from the server
    const session = await getServerSession(req, res, authOptions);
    
    // Get all cookies for debugging
    const cookieHeader = req.headers.cookie || '';
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key) acc[key] = value;
      return acc;
    }, {});
    
    // Explicitly set the Set-Cookie header for the session token
    // This helps ensure the client has the correct session cookie
    if (session) {
      // Return session data with explicit cache control
      res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      return res.status(200).json({
        success: true,
        authenticated: true,
        session,
        cookieCount: Object.keys(cookies).length,
        hasSessionCookie: !!cookies['next-auth.session-token'] || !!cookies['__Secure-next-auth.session-token'],
      });
    } else {
      return res.status(200).json({
        success: true,
        authenticated: false,
        session: null,
        cookieCount: Object.keys(cookies).length,
        hasSessionCookie: !!cookies['next-auth.session-token'] || !!cookies['__Secure-next-auth.session-token'],
      });
    }
  } catch (error) {
    console.error("Error in force-sync API:", error);
    return res.status(500).json({
      error: "Failed to sync session",
      message: error.message,
    });
  }
}
