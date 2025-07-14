# Safari PWA & Service Worker Troubleshooting Guide

This guide addresses common issues with Progressive Web Apps (PWAs) and service workers in Safari, particularly focusing on authentication problems and service worker registration.

## Identified Issues

Based on the console message:
```
"Service worker registered:falseSignIn page - Auth status:"authenticated""Session:""Present"Authenticated, redirecting to callback URLRoute changed, checking auth stateBrowser: SafariCookie count:1Auth cookies present:Secure context:trueProtocol:"https:"
```

The main issues are:

1. **Service Worker Registration Failure**: The service worker is not being registered in Safari.
2. **Authentication/Session Issues**: Despite being authenticated, the auth cookies may not be properly working.
3. **Redirect Loop**: The app may be caught in a redirect loop on the watchlist page.

## Implemented Fixes

### Service Worker Registration

1. **Enhanced Registration Logic**
   - Added Safari-specific detection and logging
   - Added protocol and secure context validation
   - Implemented delayed registration for Safari
   - Added detailed error logging for Safari-specific issues

2. **Fixed HTTPS Configuration**
   - Updated server.js to use proper certificate paths
   - Generated new local certificates with mkcert

### Authentication & Session Management

1. **Safari-Friendly NextAuth Configuration**
   - Updated cookie configuration to be Safari-compatible
   - Explicitly set cookie parameters needed for Safari
   - Implemented better error handling for authentication issues

2. **Fixed Redirect Loop on Watchlist Page**
   - Added redirect loop prevention using sessionStorage
   - Improved authentication state handling and debugging
   - Added better error messaging and user feedback

### Debugging Tools

1. **Enhanced Auth Debugging**
   - Added comprehensive auth state debugging
   - Improved cookie and session inspection
   - Added Safari-specific storage access checks

2. **Service Worker Diagnostics**
   - Created diagnostic tools for service worker issues
   - Added a debug button for in-app diagnosis
   - Implemented scripts to check environment configuration

3. **Cookie/Storage Management**
   - Added scripts to clear Safari cookies and storage
   - Provided guidance on Safari's privacy settings

## Usage Instructions

### Development Environment Setup

1. **HTTPS Setup**:
   ```bash
   # Create local certificates
   mkcert localhost
   
   # Start the app with HTTPS
   npm run dev:https
   ```

2. **Clearing Safari Storage**:
   ```bash
   # Run the script for guidance
   ./scripts/clear-safari-storage.sh
   ```

3. **PWA Diagnostics**:
   ```bash
   # Check your environment configuration
   ./scripts/fix-safari-pwa.sh
   ```

### Debug Tools

1. **In-App Debugging**:
   - Look for the "Debug PWA/SW" button in development mode
   - Check browser console for detailed diagnostics

2. **Service Worker Management**:
   - In Safari, go to Develop > Web Application > Service Workers
   - Use the clear-service-workers.js utility when needed

3. **Authentication Debugging**:
   - Watch for auth status in console logs
   - Check the debug output for cookie and session status

## Safari-Specific Considerations

1. **Storage & Cookie Access**:
   - Safari has strict rules for cookies in PWAs
   - Requires secure context and proper cookie settings
   - May require explicit storage access

2. **HTTPS Requirements**:
   - Safari requires HTTPS even for localhost
   - Certificates must be trusted in macOS Keychain

3. **Cache Behavior**:
   - Safari caches aggressively, which can cause stale behavior
   - Regular cache clearing may be necessary during development

## Troubleshooting Steps

If issues persist:

1. Clear Safari cookies and website data
2. Remove and reinstall the PWA
3. Check Safari's Developer Tools for service worker status
4. Verify all cookies are being set correctly
5. Ensure the certificate is trusted in macOS Keychain Access

## Safari PWA Checklist

- [ ] Using HTTPS with trusted certificates
- [ ] Manifest.json has correct settings
- [ ] Apple-specific meta tags in document head
- [ ] Service worker successfully registering
- [ ] Auth cookies configured properly
- [ ] Handling session storage limitations
- [ ] Tested as installed PWA from home screen
