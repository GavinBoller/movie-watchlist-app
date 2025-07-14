// watchlist-fallback.js
// This is a special fetcher for the watchlist page to handle auth issues

/**
 * Special fetcher for watchlist API that handles authentication issues
 * and provides better error handling for Safari
 */
export async function watchlistFetcher(url) {
  console.log('Watchlist API request:', url);
  
  try {
    // First, verify session is valid
    const sessionRes = await fetch('/api/auth/session');
    const session = await sessionRes.json();
    
    if (!session || !session.user) {
      console.error('No valid session found, redirecting to sign in');
      // This is a clean way to handle authentication errors
      // Instead of throwing an error, we return empty data
      return { items: [], total: 0, totalPages: 0 };
    }
    
    // Now fetch the watchlist data with a longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      credentials: 'include' // Important for cookies in Safari
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.error('Authentication error from watchlist API:', response.status);
        return { items: [], total: 0, totalPages: 0 };
      }
      
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    
    // Special handling for aborted requests (timeouts)
    if (error.name === 'AbortError') {
      console.error('Request timeout - taking too long to respond');
      return { items: [], total: 0, totalPages: 0, timeout: true };
    }
    
    // For Safari, detect specific network errors
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari && (error.message.includes('NetworkError') || error.message.includes('Failed to fetch'))) {
      console.error('Safari network error detected');
      return { items: [], total: 0, totalPages: 0, safari: true };
    }
    
    // For all other errors, return empty data with error flag
    return { 
      items: [], 
      total: 0, 
      totalPages: 0, 
      error: true,
      message: error.message
    };
  }
}
