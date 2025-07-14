// safari-emergency-fix.js
// Copy and paste this entire script into the Safari console
// when experiencing issues with the watchlist page

(function() {
  console.log('🚨 Safari Emergency Fix Running...');
  
  // 1. Clear all storage
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Local storage and session storage cleared');
  } catch (e) {
    console.error('Error clearing storage:', e);
  }
  
  // 2. Clear cookies
  try {
    document.cookie.split(';').forEach(function(c) {
      document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
    });
    console.log('✅ Cookies cleared');
  } catch (e) {
    console.error('Error clearing cookies:', e);
  }
  
  // 3. Unregister service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      if (registrations.length > 0) {
        console.log(`Found ${registrations.length} service worker registrations`);
        registrations.forEach(function(registration) {
          registration.unregister();
          console.log('Unregistered service worker:', registration.scope);
        });
        console.log('✅ All service workers unregistered');
      } else {
        console.log('No service workers to unregister');
      }
    }).catch(function(error) {
      console.error('Error unregistering service workers:', error);
    });
  }
  
  // 4. Create emergency navigation button
  try {
    // Create a floating action button
    const fab = document.createElement('div');
    fab.style.position = 'fixed';
    fab.style.bottom = '20px';
    fab.style.right = '20px';
    fab.style.backgroundColor = '#E50914';
    fab.style.color = 'white';
    fab.style.borderRadius = '50%';
    fab.style.width = '60px';
    fab.style.height = '60px';
    fab.style.display = 'flex';
    fab.style.justifyContent = 'center';
    fab.style.alignItems = 'center';
    fab.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    fab.style.cursor = 'pointer';
    fab.style.zIndex = '9999';
    fab.innerHTML = '⚡️';
    fab.style.fontSize = '24px';
    
    // Create menu that appears on click
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.bottom = '90px';
    menu.style.right = '20px';
    menu.style.backgroundColor = 'rgba(0,0,0,0.8)';
    menu.style.color = 'white';
    menu.style.borderRadius = '8px';
    menu.style.padding = '10px';
    menu.style.display = 'none';
    menu.style.flexDirection = 'column';
    menu.style.zIndex = '9999';
    menu.style.minWidth = '200px';
    
    // Add navigation options
    const options = [
      { text: 'Go to Home', action: () => window.location.href = '/' },
      { text: 'Go to Search', action: () => window.location.href = '/search' },
      { text: 'Go to Watchlist', action: () => window.location.href = '/watchlist' },
      { text: 'Sign In', action: () => window.location.href = '/api/auth/signin' },
      { text: 'Sign Out', action: () => window.location.href = '/api/auth/signout' },
      { text: 'Clear & Reload', action: () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }}
    ];
    
    options.forEach(option => {
      const button = document.createElement('button');
      button.innerText = option.text;
      button.style.backgroundColor = '#333';
      button.style.border = 'none';
      button.style.color = 'white';
      button.style.padding = '10px';
      button.style.margin = '5px 0';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      button.style.width = '100%';
      button.style.textAlign = 'left';
      
      button.addEventListener('click', option.action);
      menu.appendChild(button);
    });
    
    // Toggle menu on click
    fab.addEventListener('click', () => {
      menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
    });
    
    // Add to page
    document.body.appendChild(fab);
    document.body.appendChild(menu);
    
    console.log('✅ Emergency navigation button added');
  } catch (e) {
    console.error('Error creating emergency navigation:', e);
  }
  
  console.log('✅ Safari Emergency Fix Complete');
  console.log('➡️ Click the ⚡️ button in the bottom right for emergency navigation');
})();
