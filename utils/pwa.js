// Register the service worker for PWA functionality
export function registerServiceWorker() {
  // Check if running in a browser environment
  if (typeof window === 'undefined') return;
  
  // Check if service workers are supported
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service worker registered:', registration.scope);
        })
        .catch(error => {
          console.error('Service worker registration failed:', error);
        });
    });
  }
}

// Detect if the app is in standalone mode (added to home screen)
// This function is exported with two names to support existing imports
export function isPWAMode() {
  // Check if running in a browser environment
  if (typeof window === 'undefined') return false;
  
  // Method 1: navigator.standalone (iOS Safari specific)
  if ('standalone' in navigator && navigator.standalone === true) {
    return true;
  }
  
  // Method 2: display-mode media query (more standard)
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Method 3: window.navigator.standalone (older iOS)
  if (window.navigator && window.navigator.standalone === true) {
    return true;
  }
  
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
