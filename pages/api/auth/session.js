// pages/api/auth/session.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    // Set headers to prevent caching and ensure proper content type
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Content-Type", "application/json");
    
    // Ensure we always return a valid JSON response
    if (session === null || session === undefined) {
      return res.status(200).json(null);
    }
    
    // Ensure the session object is properly serializable
    const safeSession = JSON.parse(JSON.stringify(session));
    return res.status(200).json(safeSession);
  } catch (error) {
    console.error('Session endpoint error:', error);
    // Set proper headers and return null session on error
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json(null);
  }
}
