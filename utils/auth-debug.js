// Debug utility for Safari authentication issues
// Add this script to your _app.js file

export function debugAuthState() {
  if (typeof window === 'undefined') return;
  
  // Check browser
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  console.log('Browser: ' + (isSafari ? 'Safari' : 'Not Safari'));
  
  // Check cookies
  const cookies = document.cookie.split(';').map(c => c.trim());
  console.log('Cookie count:', cookies.length);
  
  // Check for auth cookies without exposing values
  const hasSessionToken = cookies.some(c => 
    c.startsWith('next-auth.session-token=') || 
    c.startsWith('__Secure-next-auth.session-token=')
  );
  
  const hasCallbackUrl = cookies.some(c => 
    c.startsWith('next-auth.callback-url=') || 
    c.startsWith('__Secure-next-auth.callback-url=')
  );
  
  const hasCsrfToken = cookies.some(c => 
    c.startsWith('next-auth.csrf-token=') || 
    c.startsWith('__Secure-next-auth.csrf-token=')
  );
  
  console.log('Auth cookies present:', {
    sessionToken: hasSessionToken,
    callbackUrl: hasCallbackUrl,
    csrfToken: hasCsrfToken
  });
  
  // Check if running in secure context
  console.log('Secure context:', window.isSecureContext);
  
  // Check protocol
  console.log('Protocol:', window.location.protocol);
  
  // Check service worker registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration()
      .then(registration => {
        console.log('Service worker registered:', registration ? true : false);
        if (registration) {
          console.log('Service worker state:', registration.active ? registration.active.state : 'No active worker');
          console.log('Service worker scope:', registration.scope);
        }
      })
      .catch(err => console.error('Error checking service worker:', err));
  }
  
  // Try to check auth status from session
  try {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        console.log('Session:', session ? 'Present' : 'Not present');
        console.log('Auth status:', session && session.user ? 'authenticated' : 'unauthenticated');
      })
      .catch(err => console.error('Error fetching session:', err));
  } catch (e) {
    console.error('Error checking session:', e);
  }
  
  // Log storage access status (Safari-specific)
  if (isSafari && document.hasStorageAccess) {
    document.hasStorageAccess().then(hasAccess => {
      console.log('Safari storage access granted:', hasAccess);
      if (!hasAccess && document.requestStorageAccess) {
        console.log('Storage access can be requested by user interaction');
      }
    }).catch(e => {
      console.error('Error checking storage access:', e);
    });
  }
}
