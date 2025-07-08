// pages/api/auth/session.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  // Return the session with cache control headers to prevent caching
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.json(session);
}
