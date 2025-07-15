import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  // Log all cookies and headers for debugging
  const cookies = req.cookies;
  const headers = req.headers;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  console.log("/api/test-token debug:");
  console.log("Cookies:", cookies);
  console.log("Headers:", headers);
  console.log("Decoded token:", token);

  res.status(200).json({
    cookies,
    headers,
    token
  });
}
