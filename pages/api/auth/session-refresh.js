// This API route ensures session state is refreshed properly after authentication
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  try {
    // Force session refresh
    const session = await getSession({ req });
    
    // Get the original callback URL
    const callbackUrl = req.query.callbackUrl || '/search';
    
    // Set cookie to indicate session refresh is needed
    res.setHeader('Set-Cookie', 'next-auth.session-refresh=true; Path=/; HttpOnly; Max-Age=60');
    
    // Redirect to the original callback URL with a special parameter
    res.redirect(`${callbackUrl}?refresh=true&ts=${Date.now()}`);
  } catch (error) {
    console.error('Session refresh error:', error);
    res.redirect('/search');
  }
}
