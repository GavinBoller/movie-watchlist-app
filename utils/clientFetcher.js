/**
 * Enhanced fetcher with retry logic for client-side requests
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options (optional)
 * @param {number} retries - Number of retries (default: 3)
 * @returns {Promise<any>} The parsed JSON response
 */
export const clientFetcher = async (url, options = {}, retries = 3) => {
  let currentRetry = 0;
  let lastError = null;

  while (currentRetry < retries) {
    try {
      const res = await fetch(url, options);
      
      if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        // Attach extra info to the error object
        error.info = await res.json().catch(() => ({})); // Handle cases where the error body isn't JSON
        error.status = res.status;
        
        // Don't retry for client errors (4xx) except for 429 (rate limit)
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw error;
        }
        
        lastError = error;
        throw error;
      }
      
      return res.json();
    } catch (error) {
      lastError = error;
      
      // If we've tried the maximum number of times, throw the error
      if (currentRetry === retries - 1) {
        throw lastError;
      }
      
      // Calculate exponential backoff time (500ms, 1000ms, 2000ms, ...)
      const backoffTime = Math.min(1000 * (2 ** currentRetry), 8000);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      currentRetry++;
    }
  }
  
  throw lastError;
};

export default clientFetcher;
