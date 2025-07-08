/**
 * Enhanced fetcher with retry logic for client-side requests
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options (optional)
 * @param {number} retries - Number of retries (default: 3)
 * @returns {Promise<any>} The parsed JSON response
 */
export const clientFetcher = async (url, options = {}, retries = 3) => {
  // Check if we're online first
  if (typeof window !== 'undefined' && !window.navigator.onLine) {
    const offlineError = new Error('You are currently offline. Please check your internet connection.');
    offlineError.isOffline = true;
    console.error('Network Error: Device is offline');
    throw offlineError;
  }

  let currentRetry = 0;
  let lastError = null;

  // Debug information
  console.log(`API Request: ${url}`, { method: options.method || 'GET' });

  while (currentRetry < retries) {
    try {
      // Add a timeout to the fetch request using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };
      
      try {
        const res = await fetch(url, fetchOptions);
        clearTimeout(timeoutId); // Clear the timeout if fetch completes
        
        if (!res.ok) {
          // Create more descriptive error message based on status code
          let errorMessage = 'An error occurred while fetching the data.';
          if (res.status === 401) {
            errorMessage = 'Authentication required. Please sign in to access this resource.';
          } else if (res.status === 403) {
            errorMessage = 'You do not have permission to access this resource.';
          } else if (res.status === 404) {
            errorMessage = 'The requested resource was not found.';
          } else if (res.status === 429) {
            errorMessage = 'Too many requests. Please try again later.';
          } else if (res.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          
          const error = new Error(errorMessage);
          
          // Attach extra info to the error object
          try {
            error.info = await res.json();
          } catch (e) {
            // The response might not be JSON, so we just attach the text or a generic message
            error.info = { message: 'Could not parse error response' };
          }
          
          error.status = res.status;
          console.error(`API Error: ${res.status} ${errorMessage}`, error.info);
          
          // Don't retry for client errors (4xx) except for 429 (rate limit)
          if (res.status >= 400 && res.status < 500 && res.status !== 429) {
            throw error;
          }
          
          // For server errors and 429, we'll retry
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
          continue; // Skip to the next retry attempt
        }
        
        // If we get here, the request was successful
        return await res.json();
      } catch (fetchError) {
        clearTimeout(timeoutId); // Make sure to clear the timeout
        throw fetchError; // Re-throw to be caught by the outer try/catch
      }
    } catch (error) {
      // Check if this was a timeout abort
      if (error.name === 'AbortError') {
        lastError = new Error('Request timed out. Please try again.');
        lastError.isTimeout = true;
      } else {
        lastError = error;
      }
      
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
