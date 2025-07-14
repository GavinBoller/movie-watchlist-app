// loop-breaker.js
// This script can be directly added to your page to detect and break redirect loops

(function() {
  // Only run in browser
  if (typeof window === 'undefined') return;
  
  console.log('🚨 Safari Authentication Loop Breaker active');
  
  // Function to break the redirect loop
  function breakRedirectLoop() {
    console.log('Breaking authentication redirect loop');
    
    // Clear storage
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(';').forEach(function(c) {
        document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
      });
      
      console.log('Storage and cookies cleared');
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
    
    // Add reset parameter and redirect to home
    window.location.href = '/?reset=true&breakLoop=true';
  }
  
  // Detect if we're in a loop
  const MAX_VISITS = 3; // Max number of visits to the same page in a short time
  const TIME_WINDOW = 10000; // 10 seconds
  
  // Get current page
  const currentPath = window.location.pathname;
  
  // Check if we're on a critical page that might be in a loop
  const isAuthPage = currentPath.includes('/auth/signin') || 
                   currentPath.includes('/api/auth') || 
                   currentPath === '/watchlist';
  
  if (!isAuthPage) return;
  
  // Track visit time
  const now = Date.now();
  
  // Get visit history from sessionStorage
  let visitHistory;
  try {
    visitHistory = JSON.parse(sessionStorage.getItem('visitHistory') || '[]');
  } catch (e) {
    visitHistory = [];
  }
  
  // Filter out old visits
  visitHistory = visitHistory.filter(v => (now - v.time) < TIME_WINDOW);
  
  // Add current visit
  visitHistory.push({
    path: currentPath,
    time: now
  });
  
  // Save updated history
  try {
    sessionStorage.setItem('visitHistory', JSON.stringify(visitHistory));
  } catch (e) {
    console.error('Error saving visit history:', e);
  }
  
  // Count visits to current page
  const currentPageVisits = visitHistory.filter(v => v.path === currentPath).length;
  
  // Check if we need to break the loop
  if (currentPageVisits >= MAX_VISITS) {
    console.log(`Detected ${currentPageVisits} visits to ${currentPath} in ${TIME_WINDOW/1000}s`);
    
    // Add a button to manually break the loop
    const breakButton = document.createElement('button');
    breakButton.innerText = 'Break Auth Loop';
    breakButton.style.position = 'fixed';
    breakButton.style.bottom = '20px';
    breakButton.style.right = '20px';
    breakButton.style.zIndex = '9999';
    breakButton.style.padding = '10px 15px';
    breakButton.style.backgroundColor = '#E50914';
    breakButton.style.color = 'white';
    breakButton.style.border = 'none';
    breakButton.style.borderRadius = '5px';
    breakButton.style.fontWeight = 'bold';
    breakButton.style.cursor = 'pointer';
    
    breakButton.addEventListener('click', breakRedirectLoop);
    
    // Only add the button once
    if (!document.getElementById('break-loop-button')) {
      breakButton.id = 'break-loop-button';
      document.body.appendChild(breakButton);
    }
    
    // Show a notification
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '15px 20px';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    notification.style.color = 'white';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '80%';
    notification.style.textAlign = 'center';
    notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    
    notification.innerHTML = `
      <p style="margin: 0 0 10px 0; font-weight: bold;">Authentication Loop Detected</p>
      <p style="margin: 0 0 10px 0;">You appear to be stuck in a redirect loop. Click the button below to break the loop.</p>
    `;
    
    // Only add the notification once
    if (!document.getElementById('auth-loop-notification')) {
      notification.id = 'auth-loop-notification';
      document.body.appendChild(notification);
      
      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        if (document.getElementById('auth-loop-notification')) {
          document.getElementById('auth-loop-notification').style.display = 'none';
        }
      }, 10000);
    }
  }
})();
