// Register the service worker for PWA functionality
export function registerServiceWorker() {
  // Check if running in a browser environment
  if (typeof window === 'undefined') return;
  
  // Check if service workers are supported
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      console.log('Attempting to register service worker...');
      
      // Safari-specific logging
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        console.log('Safari detected, using special service worker registration approach');
      }
      
      // Check if this is an auth callback URL
      const isAuthCallback = window.location.pathname.includes('/api/auth/callback');
      if (isAuthCallback) {
        console.log('Auth callback detected, delaying service worker registration');
        // For auth callbacks, delay service worker registration to prevent interference
        setTimeout(() => registerSW(), 2000);
      } else {
        // Small delay for Safari to ensure DOM is fully loaded
        setTimeout(() => registerSW(), isSafari ? 500 : 0);
      }
    });
  } else {
    console.warn('Service Worker API not supported in this browser');
  }
  
  function registerSW() {
    // Get current protocol
    const protocol = window.location.protocol;
    const isHttps = protocol === 'https:';
    
    if (!isHttps && window.location.hostname !== 'localhost') {
      console.warn('Service Worker registration failed: HTTPS required except on localhost');
      return;
    }
    
    // Safari fix: check window.isSecureContext before registering
    if (window.isSecureContext === false) {
      console.warn('Service Worker registration failed: Not in a secure context');
      return;
    }
    
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service worker registered successfully:', registration.scope);
        
        // Force update check for the service worker
        registration.update().catch(err => {
          console.log('Service worker update check failed:', err);
        });
        
        // Handle service worker state changes
        if (registration.installing) {
          console.log('Service worker installing');
          registration.installing.addEventListener('statechange', e => {
            console.log('Service worker state change:', e.target.state);
          });
        }
        
        if (registration.waiting) {
          console.log('Service worker waiting');
        }
        
        if (registration.active) {
          console.log('Service worker active');
        }
      })
      .catch(error => {
        console.error('Service worker registration failed:', error);
        
        // More detailed error logging for Safari debugging
        if (error.name) console.error('Error name:', error.name);
        if (error.message) console.error('Error message:', error.message);
        if (error.stack) console.error('Error stack:', error.stack);
        
        // Check if running in Safari
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (isSafari) {
          console.warn('Safari detected. Service worker may require HTTPS, even on localhost.');
          console.warn('For Google Auth to work properly in Safari, ensure you have:');
          console.warn('1. Set up HTTPS for localhost');
          console.warn('2. Trusted the certificate in Keychain Access');
          console.warn('3. Cleared HSTS cache if previously visited the site');
        }
      });
  }
}

// Detect if the app is in standalone mode (added to home screen)
// This function is exported with two names to support existing imports
export function isPWAMode() {
  // Check if running in a browser environment
  if (typeof window === 'undefined') return false;
  
  console.log('Checking PWA mode...');
  
  // Method 1: navigator.standalone (iOS Safari specific)
  if ('standalone' in navigator && navigator.standalone === true) {
    console.log('PWA detected via navigator.standalone');
    return true;
  }
  
  // Method 2: display-mode media query (more standard)
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    console.log('PWA detected via display-mode: standalone media query');
    return true;
  }
  
  // Method 3: window.navigator.standalone (older iOS)
  if (window.navigator && window.navigator.standalone === true) {
    console.log('PWA detected via window.navigator.standalone');
    return true;
  }
  
  console.log('Not running as PWA');
  return false;
}

// Alias for isPWAMode to support different import styles
export const isPWA = isPWAMode;

// Add a custom PWA install prompt
export function initPWAInstallPrompt() {
  // Check if running in a browser environment
  if (typeof window === 'undefined') return;
  
  let deferredPrompt;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  // If the app is already installed, don't show install prompt
  if (isPWAMode()) return;
  
  // For modern browsers that support the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default browser install prompt
    e.preventDefault();
    // Store the event for later use
    deferredPrompt = e;
    
    // Show your custom install button or notification
    const installBtn = document.getElementById('pwa-install-button');
    if (installBtn) {
      installBtn.style.display = 'block';
      
      installBtn.addEventListener('click', () => {
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          } else {
            console.log('User dismissed the install prompt');
          }
          // Clear the saved prompt
          deferredPrompt = null;
          // Hide the install button
          installBtn.style.display = 'none';
        });
      });
    }
  });
  
  // For iOS, show custom instructions since beforeinstallprompt isn't supported
  if (isIOS) {
    // Check if we've already shown the iOS install prompt (using localStorage)
    const hasShownIOSPrompt = localStorage.getItem('hasShownIOSInstallPrompt');
    
    if (!hasShownIOSPrompt && !isPWAMode()) {
      // Wait until the app has loaded
      setTimeout(() => {
        // You could implement a custom iOS install instruction modal here
        // This example uses alert, but you should create a nicer UI
        const shouldShow = window.confirm(
          'To install this app on your iPhone: tap the share button, then "Add to Home Screen"'
        );
        
        if (shouldShow) {
          // Mark that we've shown the iOS install prompt
          localStorage.setItem('hasShownIOSInstallPrompt', 'true');
        }
      }, 3000);
    }
  }
}

// Export a function to initialize all PWA features
export function initPWA() {
  // Check if running in a browser environment
  if (typeof window === 'undefined') return;
  
  registerServiceWorker();
  initPWAInstallPrompt();
}
